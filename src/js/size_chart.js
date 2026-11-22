// js/size_chart.js – Größentabelle auf der Produktseite
// Die Tabellen stehen in /groessentabellen.json; welches Produkt welche bekommt, steht in Stripe
// im Metadatum "groessentabelle" (z. B. "hoodie"). Siehe SHOP-ANLEITUNG.md.

(function () {
  const dialog = document.getElementById("size-chart");
  const openButton = document.getElementById("size-chart-btn");
  if (!dialog || !openButton) return;

  let chart = null;
  let columns = [];
  let product = null;

  // "XXXL", "3xl", "2XL" -> einheitliche Schreibweise, damit Stripe-Größen zur Tabelle passen
  function normalizeSize(size) {
    const text = String(size).toUpperCase().replace(/\s+/g, "");
    const xCount = text.match(/^(X{2,5})L$/);
    if (xCount && xCount[1].length >= 3) return `${xCount[1].length}XL`;
    if (text === "2XL") return "XXL";
    return text;
  }

  // 58.5 -> "58,5"
  function formatCm(value) {
    return value === null || value === undefined ? "–" : String(value).replace(".", ",");
  }

  // Skizze mit den Messpunkten A (Breite), B (Länge), C (Ärmel)
  const marker = (x, y, letter) =>
    `<g class="sc-marker"><circle cx="${x}" cy="${y}" r="11"/><text x="${x}" y="${y}">${letter}</text></g>`;
  const measure = (x1, y1, x2, y2) =>
    `<line class="sc-measure" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-start="url(#sc-arrow)" marker-end="url(#sc-arrow)"/>`;

  const shapes = {
    tshirt: {
      viewBox: "0 0 240 210",
      body: `
        <path class="sc-garment" d="M100 22 Q120 40 140 22 L176 30 L222 62 L204 92 L174 78 L174 196 L66 196 L66 78 L36 92 L18 62 L64 30 Z"/>
        <path class="sc-detail" d="M106 24 Q120 35 134 24 M209 83 L190 72 M31 83 L50 72 M66 190 L174 190"/>`,
      a: [66, 104, 174, 104, 142, 104],
      b: [92, 26, 92, 196, 92, 156],
      c: [181, 23, 227, 55, 204, 39],
    },
    sweater: {
      viewBox: "0 0 244 210",
      body: `
        <path class="sc-garment" d="M100 22 Q120 40 140 22 L180 32 L226 176 L204 184 L176 96 L176 198 L64 198 L64 96 L36 184 L14 176 L60 32 Z"/>
        <path class="sc-detail" d="M106 24 Q120 35 134 24 M222 164 L201 172 M18 164 L39 172 M64 188 L176 188"/>`,
      a: [64, 112, 176, 112, 142, 112],
      b: [92, 26, 92, 198, 92, 160],
      c: [189, 29, 235, 173, 212, 101],
    },
    hoodie: {
      viewBox: "0 -30 244 240",
      body: `
        <path class="sc-garment" d="M100 22 Q120 40 140 22 L180 32 L226 176 L204 184 L176 96 L176 198 L64 198 L64 96 L36 184 L14 176 L60 32 Z"/>
        <path class="sc-garment" d="M96 28 C86 -26 154 -26 144 28 Q120 44 96 28 Z"/>
        <path class="sc-detail" d="M106 26 C106 -4 134 -4 134 26 M112 34 L112 70 M128 34 L128 70 M222 164 L201 172 M18 164 L39 172 M64 188 L176 188 M88 150 L152 150 L162 188 M88 150 L78 188"/>`,
      a: [64, 112, 176, 112, 142, 112],
      b: [92, 26, 92, 198, 92, 128],
      c: [189, 29, 235, 173, 212, 101],
    },
  };

  function figureSvg(form) {
    const shape = shapes[form];
    if (!shape) return "";
    const [ax1, ay1, ax2, ay2, alx, aly] = shape.a;
    const [bx1, by1, bx2, by2, blx, bly] = shape.b;
    const [cx1, cy1, cx2, cy2, clx, cly] = shape.c;
    return `
      <svg viewBox="${shape.viewBox}" role="img" aria-label="Skizze: A Breite, B Länge, C Ärmellänge">
        <defs>
          <marker id="sc-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0 1 L9 5 L0 9 Z" class="sc-arrowhead"/>
          </marker>
        </defs>
        ${shape.body}
        ${measure(ax1, ay1, ax2, ay2)}${measure(bx1, by1, bx2, by2)}${measure(cx1, cy1, cx2, cy2)}
        ${marker(alx, aly, "A")}${marker(blx, bly, "B")}${marker(clx, cly, "C")}
      </svg>`;
  }

  // Spalten: die Größen des Produkts (in seiner Schreibweise), soweit die Tabelle sie kennt.
  // Passt keine einzige, zeigt die Tabelle alle ihre Größen.
  function buildColumns() {
    const chartIndex = new Map(chart.groessen.map((size, index) => [normalizeSize(size), index]));
    const matched = product.sizes
      .filter((size) => chartIndex.has(normalizeSize(size)))
      .map((size) => ({ label: size, value: size, index: chartIndex.get(normalizeSize(size)) }));
    return matched.length > 0
      ? matched
      : chart.groessen.map((size, index) => ({ label: size, value: null, index }));
  }

  function sizeButton(value) {
    return document.querySelector(`#size-container .chip[data-value="${CSS.escape(value)}"]`);
  }

  function render() {
    document.getElementById("size-chart-product").innerText = `${product.title}`;
    document.getElementById("size-chart-figure").innerHTML = figureSvg(chart.form);

    const hint = document.getElementById("size-chart-hint");
    hint.innerText = chart.hinweis || "";
    hint.hidden = !chart.hinweis;

    const selectable = columns.some((column) => column.value);
    document.getElementById("size-chart-select-hint").hidden = !selectable;

    const head = columns
      .map((column) => {
        const chip = column.value && sizeButton(column.value);
        const soldOut = chip && chip.disabled;
        const label = column.label;
        return column.value && !soldOut
          ? `<th scope="col" data-col="${column.index}"><button type="button" data-size="${label}" aria-label="Größe ${label} wählen">${label}</button></th>`
          : `<th scope="col" data-col="${column.index}"${soldOut ? ' class="is-sold-out" title="ausverkauft"' : ""}><span>${label}</span></th>`;
      })
      .join("");

    const rows = chart.masse
      .map(
        (row) => `
          <tr>
            <th scope="row"><span class="sc-key">${row.kuerzel}</span>${row.name}</th>
            ${columns.map((column) => `<td data-col="${column.index}">${formatCm(row.werte[column.index])}</td>`).join("")}
          </tr>`,
      )
      .join("");

    document.getElementById("size-chart-table").innerHTML = `
      <caption class="visually-hidden">Maße in Zentimetern je Größe</caption>
      <thead><tr><th scope="col">Größe</th>${head}</tr></thead>
      <tbody>${rows}</tbody>`;

    document.getElementById("size-chart-legend").innerHTML = chart.masse
      .map((row) => `<li><span class="sc-key">${row.kuerzel}</span><span><strong>${row.name}:</strong> ${row.beschreibung}</span></li>`)
      .join("");

    document.querySelectorAll("#size-chart-table thead button").forEach((button) => {
      button.onclick = () => {
        const chip = sizeButton(button.dataset.size);
        if (chip) chip.click();
      };
    });
  }

  // Gewählte Größe in der Tabelle hervorheben
  function update(selectedSize) {
    if (!chart) return;
    const column = columns.find((col) => col.value && col.value === selectedSize);
    document.querySelectorAll("#size-chart-table [data-col]").forEach((cell) => {
      cell.classList.toggle("is-selected", Boolean(column) && Number(cell.dataset.col) === column.index);
    });
    document.querySelectorAll("#size-chart-table thead button").forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.size === selectedSize);
    });
  }

  async function init(currentProduct, selectedSize) {
    product = currentProduct;
    if (!product.sizeChart || product.sizes.length === 0) return;
    try {
      const response = await fetch("/groessentabellen.json");
      if (!response.ok) return;
      chart = (await response.json())[product.sizeChart] || null;
    } catch (error) {
      chart = null;
    }
    if (!chart) {
      console.warn(`Größentabelle "${product.sizeChart}" gibt es nicht in groessentabellen.json`);
      return;
    }
    columns = buildColumns();
    render();
    update(selectedSize);
    openButton.hidden = false;
  }

  openButton.addEventListener("click", () => {
    // Ausverkauf kann sich seit dem Laden nicht ändern, die Auswahl schon
    update(document.querySelector("#size-container .chip.active")?.dataset.value);
    dialog.showModal();
  });
  dialog.querySelector("[data-close]").addEventListener("click", () => dialog.close());
  // Klick auf den abgedunkelten Hintergrund schließt
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  window.handheldtSizeChart = { init, update };
})();
