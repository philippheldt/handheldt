// js/shop_gallery.js
// Produktkarten aus dem Stripe-Katalog. Jedes Element mit data-product-gallery wird befüllt:
// - shop.html: alle Produkte, mit Filter nach Kategorie und Sortierung (data-shop-filter)
// - Startseite: data-limit="4" data-variant="preview" (bei leerem Shop nur ein kurzer Hinweis)
// - Produktseite: data-related = „Das könnte dir gefallen“ (gleiche Kategorie zuerst)

(function () {
  // Preis im deutschen Format, z. B. 45 -> "45,00 €"
  function formatPrice(value) {
    return value.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
  }

  // Produktdaten kommen aus Stripe, daher vor dem Einfügen ins HTML maskieren
  function escapeHtml(text) {
    return String(text ?? "").replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
  }

  // Zusätzliche Produktbilder aus src/img/produkte/<bildordner>/ (Liste wird beim Build erzeugt)
  async function loadProductImageFolders() {
    try {
      const response = await fetch("/img/produkte/bilder.json");
      return response.ok ? await response.json() : {};
    } catch (error) {
      return {};
    }
  }

  // Stripe-Bild(er) zuerst, danach die Bilder aus dem Bildordner
  function withFolderImages(product, folders) {
    const extra = (product.imageFolder && folders[product.imageFolder]) || [];
    return { ...product, images: [...product.images, ...extra.map((image) => image.src)] };
  }

  function renderEmpty(gallery) {
    if (gallery.dataset.variant === "preview") {
      gallery.innerHTML = `
        <p class="shop-maintenance">Unser neuer Shop ist fast fertig – gerade laufen noch Wartungsarbeiten.
        Schau bald wieder vorbei!</p>`;
      return;
    }
    gallery.innerHTML = `
      <div class="shop-maintenance">
        <h2>Wartungsarbeiten</h2>
        <p>Unser Shop wird gerade überarbeitet und ist bald wieder für dich da.
        Bei Fragen erreichst du uns jederzeit unter <a href="mailto:mail@handheldt.de">mail@handheldt.de</a>.</p>
      </div>`;
  }

  function renderCard(product) {
    const card = document.createElement("a");
    card.href = `shop_item.html?id=${encodeURIComponent(product.id)}`;
    card.className = `product-card${product.soldOut ? " product-card--soldout" : ""}`;

    // Zweites Bild erscheint beim Hovern (falls vorhanden).
    // Ohne Bild bleibt die neutrale Fläche des Bildrahmens sichtbar.
    const img1Src = product.images[0];
    const img2Src = product.images.length > 1 ? product.images[1] : img1Src;
    const images = img1Src
      ? `<img src="${escapeHtml(img1Src)}" alt="" class="primary-img" loading="lazy">
        <img src="${escapeHtml(img2Src)}" alt="" class="secondary-img" loading="lazy">`
      : "";

    const badge = product.soldOut ? "Ausverkauft" : product.preorderDate ? "Vorbestellung" : "";

    card.innerHTML = `
      <div class="card-image-wrapper">
        ${badge ? `<span class="card-badge">${badge}</span>` : ""}
        ${images}
      </div>
      <h3>${escapeHtml(product.title)}</h3>
      <div class="price">${product.hasSurcharges ? "ab " : ""}${formatPrice(product.price)}</div>
      ${product.freeShipping ? '<div class="card-note">Versandkostenfrei</div>' : ""}`;
    return card;
  }

  function renderCards(gallery, products) {
    gallery.innerHTML = "";
    const limit = Number(gallery.dataset.limit) || products.length;
    products.slice(0, limit).forEach((product) => gallery.appendChild(renderCard(product)));
  }

  // ---------- Filter und Sortierung (shop.html) ----------

  const SORTERS = {
    // Reihenfolge aus dem Metadatum "sortierung" (so kommt der Katalog bereits an)
    empfohlen: () => 0,
    neu: (a, b) => b.created - a.created,
    "preis-auf": (a, b) => a.price - b.price,
    "preis-ab": (a, b) => b.price - a.price,
    az: (a, b) => a.title.localeCompare(b.title, "de"),
  };

  // Bis zu so vielen Kategorien als Buttons, darüber als Auswahlliste (bleibt übersichtlich)
  const MAX_CATEGORY_CHIPS = 3;

  function initFilter(gallery, products) {
    const toolbar = document.querySelector("[data-shop-filter]");
    if (!toolbar) return renderCards(gallery, products);

    const chipBox = toolbar.querySelector("[data-filter-categories]");
    const sortSelect = toolbar.querySelector("[data-filter-sort]");
    const categorySelect = toolbar.querySelector("[data-filter-category-select]");
    const counter = toolbar.querySelector("[data-filter-count]");

    // Kategorien in der Reihenfolge, in der sie im Katalog zuerst vorkommen
    const categories = [...new Set(products.flatMap((product) => product.categories || []))];

    // Auswahl steht in der Adresse (?kategorie=…&sortierung=…), damit Links und „Zurück“ funktionieren
    const params = new URLSearchParams(window.location.search);
    let category = categories.includes(params.get("kategorie")) ? params.get("kategorie") : "";
    let sort = params.get("sortierung") in SORTERS ? params.get("sortierung") : "empfohlen";

    function update() {
      const visible = products
        .filter((product) => !category || (product.categories || []).includes(category))
        // Ausverkauftes rutscht ans Ende, sonst bleibt die gewählte Reihenfolge stabil
        .sort((a, b) => Number(a.soldOut) - Number(b.soldOut) || SORTERS[sort](a, b));
      renderCards(gallery, visible);
      counter.textContent = visible.length === 1 ? "1 Produkt" : `${visible.length} Produkte`;

      chipBox.querySelectorAll(".filter-chip").forEach((chip) => {
        chip.setAttribute("aria-pressed", chip.dataset.category === category);
      });
      if (categorySelect) categorySelect.value = category;

      const next = new URLSearchParams();
      if (category) next.set("kategorie", category);
      if (sort !== "empfohlen") next.set("sortierung", sort);
      const query = next.toString();
      history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
    }

    // Nur eine Kategorie (oder keine) -> Filter ausblenden, Sortierung bleibt
    if (categories.length > MAX_CATEGORY_CHIPS && categorySelect) {
      // Viele Kategorien: Auswahlliste neben der Sortierung statt einer langen Button-Reihe
      chipBox.hidden = true;
      ["", ...categories].forEach((name) => categorySelect.add(new Option(name || "Alle Kategorien", name)));
      categorySelect.hidden = false;
      categorySelect.addEventListener("change", () => {
        category = categorySelect.value;
        update();
      });
    } else if (categories.length > 1) {
      chipBox.innerHTML = ["", ...categories]
        .map(
          (name) =>
            `<button type="button" class="filter-chip" data-category="${escapeHtml(name)}">${escapeHtml(name || "Alle")}</button>`,
        )
        .join("");
      chipBox.addEventListener("click", (event) => {
        const chip = event.target.closest(".filter-chip");
        if (!chip) return;
        category = chip.dataset.category;
        update();
      });
    } else {
      chipBox.hidden = true;
    }

    sortSelect.value = sort;
    sortSelect.addEventListener("change", () => {
      sort = sortSelect.value;
      update();
    });

    toolbar.hidden = false;
    update();
  }

  // ---------- „Das könnte dir gefallen“ (Produktseite) ----------

  function renderRelated(gallery, products) {
    const currentId = new URLSearchParams(window.location.search).get("id");
    const current = products.find((product) => product.id === currentId);
    const section = gallery.closest("section");
    if (!current) return;

    const shared = (product) =>
      (product.categories || []).filter((name) => (current.categories || []).includes(name)).length;

    // Zuerst Produkte aus derselben Kategorie, danach auffüllen; Ausverkauftes nie vorschlagen
    const related = products
      .filter((product) => product.id !== currentId && !product.soldOut)
      .map((product, index) => ({ product, score: shared(product), index }))
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map((entry) => entry.product);

    if (related.length === 0) return;
    renderCards(gallery, related);
    if (section) section.hidden = false;
  }

  // ---------- Start ----------

  async function loadGalleries() {
    const galleries = document.querySelectorAll("[data-product-gallery]");
    if (galleries.length === 0) return;

    try {
      // Katalog kommt aus Stripe (netlify/functions/products.js)
      const response = await fetch("/.netlify/functions/products");
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const [catalog, folders] = await Promise.all([response.json(), loadProductImageFolders()]);
      const products = catalog.map((product) => withFolderImages(product, folders));

      galleries.forEach((gallery) => {
        if ("related" in gallery.dataset) return renderRelated(gallery, products);
        if (products.length === 0) return renderEmpty(gallery);
        if (gallery.dataset.variant === "preview") return renderCards(gallery, products);
        initFilter(gallery, products);
      });
    } catch (error) {
      console.error("Fehler beim Laden der Galerie:", error);
      galleries.forEach((gallery) => {
        if ("related" in gallery.dataset) return;
        gallery.innerHTML = '<p class="shop-maintenance">Produkte konnten gerade nicht geladen werden.</p>';
      });
    }
  }

  loadGalleries();
})();
