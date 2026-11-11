// js/configurator.js – Textil-Konfigurator (configurator.html)
// Produkte, Farben und Preise stehen in /druckoptionen.json (siehe KONFIGURATOR.md).
//
// Preis = Einrichtung (Siebe, einmalig) + Menge × (Textil + Druck pro Stück)
//   Siebe:  je Druckseite und Farbe ein Sieb (druck.sieb, z. B. 20 €)
//   Druck:  je Druckseite nach Größe (druck.proStueck) + je weitere Farbe (druck.proZusatzfarbe)
// Die Auswahl wird vor dem Absenden als lesbarer Text in das Feld "konfiguration" geschrieben,
// damit sie vollständig in der Netlify-E-Mail ankommt.

(function () {
  const form = document.querySelector("[data-config-form]");
  if (!form) return;

  // Hex-Werte der Stanley/Stella-Farbcodes
  const COLOR_HEX = {
    C001: "#F1F1F1", C002: "#2F2F2F", C004: "#A32E40", C005: "#FEBCCA", C007: "#ECE8DC", C018: "#EDE9E6",
    C028: "#BCAC9D", C036: "#013D3E", C048: "#BE7D1A", C053: "#4E7DB1", C054: "#F9EFD8", C063: "#B9B7CC",
    C088: "#1E2D70", C089: "#A6B8AC", C101: "#F0AE96", C112: "#D4A77E", C116: "#52323A", C129: "#EC98BA",
    C142: "#E6B372", C143: "#FB6445", C144: "#6B8883", C145: "#4AC1E8", C146: "#EBE6ED", C147: "#F6E9E2",
    C149: "#B2D0EC", C115: "#614790", C204: "#F6B846", C223: "#636359", C244: "#592930", C250: "#D3D3D3",
    C253: "#5D5D5D", C355: "#BD8D99", C356: "#E8CC87", C357: "#69AEAA", C358: "#AAA696", C504: "#EFEBE7",
    C591: "#41455B", C651: "#A2A1A6", C652: "#464D5D", C702: "#405361", C715: "#444A5D", C727: "#1F1E30",
    C728: "#D8E2E3", C729: "#306FA4", C730: "#A64D3B", C731: "#DED4CB", C735: "#A4CDAF",
  };
  // So viele Farben sind sofort sichtbar, der Rest per „Alle Farben zeigen“
  const VISIBLE_COLORS = 12;
  const PRINT_SIZES = ["Klein", "Mittel", "Groß"];
  const MAX_FILE_MB = 8;

  let data = null;
  const state = {
    product: null,
    color: null,
    showAllColors: false,
    // Druckseiten: { Vorne: { active, size, position, colors, note }, Hinten: {…} }
    areas: {},
  };

  const $ = (selector) => form.querySelector(selector);

  // Schätzung immer in ganzen Euro
  function formatEuro(value) {
    return Math.round(value).toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  }

  function formatRange([min, max]) {
    return Math.round(min) === Math.round(max) ? formatEuro(min) : `${formatEuro(min)} – ${formatEuro(max)}`;
  }

  function escapeHtml(text) {
    return String(text ?? "").replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
  }

  // ---------- Darstellung ----------

  function renderProducts() {
    $("[data-products]").innerHTML = data.produkte
      .map(
        (product, index) => `
        <label class="choice-card">
          <input type="radio" name="ui-produkt" value="${product.code}" ${index === 0 ? "checked" : ""}>
          <span>${escapeHtml(product.name)}</span>
          <small>${product.textil ? `ab ${formatEuro(product.textil[0])}` : "auf Anfrage"}</small>
        </label>`,
      )
      .join("");
  }

  function renderColors() {
    const box = $("[data-colors]");
    const toggle = $("[data-show-colors]");
    const colors = Object.entries(state.product.farben || {});
    $("[data-other-color]").hidden = colors.length > 0;
    box.hidden = colors.length === 0;

    if (!colors.some(([name]) => name === state.color)) state.color = colors[0]?.[0] || null;
    const visible = state.showAllColors ? colors : colors.slice(0, VISIBLE_COLORS);
    // Gewählte Farbe immer sichtbar halten
    if (state.color && !visible.some(([name]) => name === state.color)) {
      visible.push(colors.find(([name]) => name === state.color));
    }

    box.innerHTML = visible
      .map(
        ([name, code]) => `
        <label class="swatch" title="${escapeHtml(name)}">
          <input type="radio" name="ui-farbe" value="${escapeHtml(name)}" ${name === state.color ? "checked" : ""}>
          <span class="swatch-dot" style="background:${COLOR_HEX[code] || "#ccc"}"></span>
          <span class="swatch-name">${escapeHtml(name)}</span>
        </label>`,
      )
      .join("");

    toggle.hidden = colors.length <= VISIBLE_COLORS;
    toggle.textContent = state.showAllColors ? "Weniger Farben zeigen" : `Alle ${colors.length} Farben zeigen`;
    $("[data-color-value]").textContent = state.color ? `– ${state.color}` : "";
  }

  function renderAreas() {
    const colorOptions = Object.keys(data.druck.farben);
    $("[data-areas]").innerHTML = Object.entries(state.product.bereiche)
      .map(([area, positions]) => {
        const current = state.areas[area];
        return `
        <div class="print-area${current.active ? " is-active" : ""}" data-area="${area}">
          <label class="toggle-row">
            <input type="checkbox" data-area-toggle ${current.active ? "checked" : ""}>
            <span><b>${area}</b> bedrucken</span>
          </label>
          <div class="print-area-options" ${current.active ? "" : "hidden"}>
            <div class="option-row">
              <span class="option-title">Größe</span>
              <div class="chips">${PRINT_SIZES.map((size) => chip(area, "size", size, current.size)).join("")}</div>
            </div>
            ${
              positions.length > 1
                ? `<div class="option-row">
                    <span class="option-title">Position</span>
                    <div class="chips">${[...positions, "Sonderwunsch"].map((pos) => chip(area, "position", pos, current.position)).join("")}</div>
                    <input type="text" class="area-note" data-area-note placeholder="Wo genau? z. B. Ärmel, Nacken …"
                      value="${escapeHtml(current.note)}" ${current.position === "Sonderwunsch" ? "" : "hidden"}>
                  </div>`
                : ""
            }
            <div class="option-row">
              <span class="option-title">Farben im Motiv</span>
              <div class="chips">${colorOptions.map((count) => chip(area, "colors", count, current.colors)).join("")}</div>
            </div>
          </div>
        </div>`;
      })
      .join("");
  }

  function chip(area, key, value, selected) {
    return `
      <label class="chip-option">
        <input type="radio" name="ui-${area}-${key}" value="${escapeHtml(value)}" data-key="${key}" ${value === selected ? "checked" : ""}>
        <span>${escapeHtml(value)}</span>
      </label>`;
  }

  function renderSizes() {
    const sizes = state.product.groessen ? data.groessen[state.product.groessen] : null;
    $("[data-sizes-toggle-row]").hidden = !sizes;
    if (!sizes) {
      $("[data-sizes-toggle]").checked = false;
      $("[data-sizes]").hidden = true;
      $("[data-total-field]").hidden = false;
      return;
    }
    $("[data-sizes]").innerHTML = sizes
      .map(
        (size) => `
        <label class="size-field">
          <span>${escapeHtml(size)}</span>
          <input type="number" min="0" max="999" value="0" inputmode="numeric" data-size="${escapeHtml(size)}"
            aria-label="Anzahl Größe ${escapeHtml(size)}">
        </label>`,
      )
      .join("");
  }

  // Vorschau: für T-Shirts mit Vorderdruck gibt es fertige Bilder, sonst das Grundbild ("vorschau") oder nur die Farbe
  function renderPreview() {
    const image = form.querySelector(".config-preview-image");
    const label = form.querySelector(".config-preview-label");
    const code = state.product.code;
    const hex = COLOR_HEX[state.product.farben?.[state.color]] || "#e2e0da";
    form.querySelector(".config-preview-color").style.backgroundColor = hex;

    let src = null;
    if (code === "TSHI") {
      const front = state.areas.Vorne;
      const sizeCode = { Klein: "VKLE", Mittel: "VMIT", Groß: "VGRO" }[front.size];
      const posCode = { Links: "VPLI", Mitte: "VPMO", Rechts: "VPRE", Sonderwunsch: "VPSO" }[front.position];
      const colorCode = front.colors === "1" ? "VZ1F" : front.colors === "2" ? "VZ2F" : "VZME";
      src = front.active ? `TSHI-${sizeCode}-${posCode}-${colorCode}` : "TSHI";
    } else if (state.product.vorschau) {
      src = state.product.vorschau;
    }
    image.hidden = !src;
    if (src) image.src = `img/configurator/config/${src}.png`;
    label.textContent = src ? "" : state.product.name === "Etwas anderes" ? "Dein Wunschprodukt" : state.product.name;
  }

  // ---------- Menge und Preis ----------

  function quantity() {
    if ($("[data-sizes-toggle]").checked) {
      return [...form.querySelectorAll("[data-size]")].reduce((sum, input) => sum + (Number(input.value) || 0), 0);
    }
    return Math.max(0, Math.floor(Number($("#menge-gesamt").value) || 0));
  }

  // Preis für eine Menge: [min, max] gesamt, dazu Einrichtung und Stückpreis
  function calculate(qty) {
    const { sieb, proStueck, proZusatzfarbe, farben } = data.druck;
    const active = Object.values(state.areas).filter((area) => area.active);

    const setup = [0, 0];
    const piece = state.product.textil ? [...state.product.textil] : [0, 0];
    active.forEach((area) => {
      const [screensMin, screensMax] = farben[area.colors];
      setup[0] += screensMin * sieb;
      setup[1] += screensMax * sieb;
      piece[0] += proStueck[area.size] + (screensMin - 1) * proZusatzfarbe;
      piece[1] += proStueck[area.size] + (screensMax - 1) * proZusatzfarbe;
    });

    const total = [setup[0] + qty * piece[0], setup[1] + qty * piece[1]];
    return { setup, piece, total, perPiece: qty > 0 ? [total[0] / qty, total[1] / qty] : null, screens: setup.map((s) => s / sieb) };
  }

  function updatePrice() {
    const qty = quantity();
    const result = calculate(qty);
    const hasPrint = Object.values(state.areas).some((area) => area.active);
    const totalEl = form.querySelector("[data-price-total]");
    const pieceEl = form.querySelector("[data-price-piece]");
    const setupEl = form.querySelector("[data-price-setup]");
    const tipEl = form.querySelector("[data-price-tip]");
    const inline = form.querySelector("[data-price-inline]");

    if (!state.product.textil) {
      // „Etwas anderes“: Textil unbekannt, nur die Druckkosten lassen sich schätzen
      totalEl.textContent = "Auf Anfrage";
      pieceEl.textContent = hasPrint
        ? `Druck: ca. ${formatRange(result.total)} für ${qty} Stück, plus Produkt`
        : "Wähle aus, wie bedruckt werden soll.";
      setupEl.textContent = "";
      tipEl.hidden = true;
      inline.textContent = "";
      return { qty, result, text: "Auf Anfrage" };
    }

    if (qty === 0) {
      totalEl.textContent = "–";
      pieceEl.textContent = "Gib eine Menge an.";
      setupEl.textContent = "";
      tipEl.hidden = true;
      inline.textContent = "";
      return { qty, result, text: "–" };
    }

    totalEl.textContent = `ca. ${formatRange(result.total)}`;
    pieceEl.textContent = `${qty} Stück · ca. ${formatRange(result.perPiece)} pro Stück`;
    const [screensMin, screensMax] = result.screens;
    setupEl.textContent = hasPrint
      ? `inkl. Einrichtung ${formatRange(result.setup)} (${screensMin === screensMax ? screensMin : `${screensMin}–${screensMax}`} ${screensMax === 1 ? "Sieb" : "Siebe"}, einmalig)`
      : "ohne Druck";

    // Mengenvorteil zeigen: die Siebe verteilen sich auf mehr Stück
    const nextStep = [10, 20, 50, 100].find((step) => step > qty);
    if (hasPrint && nextStep) {
      const better = calculate(nextStep).total.map((value) => value / nextStep);
      tipEl.textContent = `Ab ${nextStep} Stück nur ca. ${formatRange(better)} pro Stück`;
      tipEl.hidden = false;
    } else {
      tipEl.hidden = true;
    }
    inline.textContent = `Geschätzt ca. ${formatRange(result.total)} (zzgl. Versand)`;
    return { qty, result, text: `ca. ${formatRange(result.total)} (${formatRange(result.perPiece)}/Stück, zzgl. Versand)` };
  }

  // ---------- Zusammenfassung fürs Formular ----------

  function summary(price) {
    const otherProduct = $("#sonstiges-produkt").value.trim();
    const otherColor = $("#sonstiges-farbe").value.trim();
    const lines = [
      `Produkt: ${state.product.code === "SONS" ? `Etwas anderes – ${otherProduct || "(nicht angegeben)"}` : state.product.name}`,
      `Farbe: ${state.color || otherColor || "(nicht angegeben)"}`,
    ];

    const active = Object.entries(state.areas).filter(([, area]) => area.active);
    if (active.length === 0) lines.push("Druck: noch offen");
    active.forEach(([name, area]) => {
      const position = area.position === "Sonderwunsch" ? `Sonderwunsch: ${area.note || "(ohne Angabe)"}` : area.position;
      lines.push(`${name}: ${area.size}, ${position}, ${area.colors} ${area.colors === "1" ? "Farbe" : "Farben"}`);
    });

    if ($("[data-sizes-toggle]").checked) {
      const sizes = [...form.querySelectorAll("[data-size]")]
        .filter((input) => Number(input.value) > 0)
        .map((input) => `${input.dataset.size}: ${input.value}`);
      lines.push(`Menge: ${price.qty} Stück (${sizes.join(", ") || "keine Größen angegeben"})`);
    } else {
      lines.push(`Menge: ca. ${price.qty} Stück`);
    }
    lines.push(`Preisschätzung: ${price.text}`);
    return lines.join("\n");
  }

  // ---------- Ereignisse ----------

  function selectProduct(code) {
    state.product = data.produkte.find((product) => product.code === code);
    state.showAllColors = false;
    // Druckseiten neu aufbauen, vorhandene Auswahl wenn möglich übernehmen
    const previous = state.areas;
    state.areas = {};
    Object.entries(state.product.bereiche).forEach(([area, positions], index) => {
      const old = previous[area] || {};
      state.areas[area] = {
        active: old.active ?? index === 0,
        size: old.size || "Mittel",
        position: positions.includes(old.position) || old.position === "Sonderwunsch" ? old.position : positions[Math.floor(positions.length / 2)],
        colors: old.colors || "1",
        note: old.note || "",
      };
      if (positions.length === 1) state.areas[area].position = positions[0];
    });
    $("[data-other-product]").hidden = code !== "SONS";
    renderColors();
    renderAreas();
    renderSizes();
    refresh();
  }

  function refresh() {
    renderPreview();
    updatePrice();
  }

  form.addEventListener("change", (event) => {
    const target = event.target;
    if (target.name === "ui-produkt") return selectProduct(target.value);
    if (target.name === "ui-farbe") {
      state.color = target.value;
      $("[data-color-value]").textContent = `– ${state.color}`;
      return refresh();
    }

    const areaBox = target.closest("[data-area]");
    if (areaBox) {
      const area = state.areas[areaBox.dataset.area];
      if (target.matches("[data-area-toggle]")) {
        area.active = target.checked;
        areaBox.classList.toggle("is-active", target.checked);
        areaBox.querySelector(".print-area-options").hidden = !target.checked;
      } else if (target.dataset.key) {
        area[target.dataset.key] = target.value;
        if (target.dataset.key === "position") {
          const note = areaBox.querySelector("[data-area-note]");
          if (note) note.hidden = target.value !== "Sonderwunsch";
        }
      }
      return refresh();
    }

    if (target.matches("[data-sizes-toggle]")) {
      $("[data-sizes]").hidden = !target.checked;
      $("[data-total-field]").hidden = target.checked;
    }
    if (target.matches("[data-file-input]")) checkFile(target);
    updatePrice();
  });

  form.addEventListener("input", (event) => {
    if (event.target.matches("[data-area-note]")) {
      state.areas[event.target.closest("[data-area]").dataset.area].note = event.target.value;
    }
    if (event.target.matches("#menge-gesamt, [data-size]")) updatePrice();
  });

  form.addEventListener("click", (event) => {
    if (!event.target.matches("[data-show-colors]")) return;
    state.showAllColors = !state.showAllColors;
    renderColors();
  });

  // Dateien über 8 MB nimmt Netlify nicht an
  function checkFile(input) {
    const file = input.files[0];
    input.setCustomValidity(
      file && file.size > MAX_FILE_MB * 1024 * 1024 ? `Die Datei ist zu groß (max. ${MAX_FILE_MB} MB).` : "",
    );
    input.reportValidity();
  }
  document.querySelectorAll("#panel-schnell [data-file-input]").forEach((input) => {
    input.addEventListener("change", () => checkFile(input));
  });

  form.addEventListener("submit", () => {
    const price = updatePrice();
    form.elements.konfiguration.value = summary(price);
    form.elements.preisschaetzung.value = price.text;
    form.elements.gesamtmenge.value = price.qty;
  });

  // Wunschtermin frühestens in 2 Wochen
  const earliest = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  document.querySelectorAll('input[type="date"]').forEach((input) => (input.min = earliest));

  // ---------- Reiter: Konfigurator / Schnellanfrage ----------

  const tabs = document.querySelectorAll('[role="tab"]');
  function showTab(tab) {
    tabs.forEach((other) => {
      const selected = other === tab;
      other.setAttribute("aria-selected", selected);
      other.tabIndex = selected ? 0 : -1;
      document.getElementById(other.getAttribute("aria-controls")).hidden = !selected;
    });
  }
  tabs.forEach((tab) => tab.addEventListener("click", () => showTab(tab)));
  // Direktlink: configurator.html#schnellanfrage
  if (window.location.hash === "#schnellanfrage") showTab(document.getElementById("tab-schnell"));

  // ---------- Start ----------

  fetch("/druckoptionen.json")
    .then((response) => response.json())
    .then((json) => {
      data = json;
      renderProducts();
      selectProduct(data.produkte[0].code);
    })
    .catch((error) => {
      console.error("Druckoptionen konnten nicht geladen werden:", error);
      document.getElementById("panel-konfigurator").innerHTML =
        '<p>Der Konfigurator konnte gerade nicht geladen werden. Beschreib uns deine Idee doch einfach im zweiten Reiter oder schreib an <a href="mailto:mail@handheldt.de">mail@handheldt.de</a>.</p>';
      showTab(document.getElementById("tab-schnell"));
    });
})();
