// js/shop_gallery.js
// Produktübersicht (shop.html) und Vorschau auf der Startseite.
// Jedes Element mit data-product-gallery wird befüllt; data-limit begrenzt die Anzahl,
// data-variant="preview" zeigt bei leerem Shop nur einen kurzen Hinweis.

// Preis im deutschen Format, z. B. 45 -> "45,00 €"
function formatPrice(value) {
  return value.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

// Produktdaten kommen aus Stripe, daher vor dem Einfügen ins HTML maskieren
function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
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
  card.className = "product-card";

  // Zweites Bild erscheint beim Hovern (falls vorhanden)
  const img1Src = product.images[0] || "img/logo.png";
  const img2Src = product.images.length > 1 ? product.images[1] : img1Src;

  card.innerHTML = `
    <div class="card-image-wrapper">
      <img src="${escapeHtml(img1Src)}" alt="" class="primary-img" loading="lazy">
      <img src="${escapeHtml(img2Src)}" alt="" class="secondary-img" loading="lazy">
    </div>
    <h3>${escapeHtml(product.title)}</h3>
    <div class="price">${formatPrice(product.price)}</div>`;
  return card;
}

async function loadGalleries() {
  const galleries = document.querySelectorAll("[data-product-gallery]");
  if (galleries.length === 0) return;

  try {
    // Katalog kommt aus Stripe (netlify/functions/products.js)
    const response = await fetch("/.netlify/functions/products");
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const products = await response.json();

    galleries.forEach((gallery) => {
      gallery.innerHTML = "";
      if (products.length === 0) return renderEmpty(gallery);

      const limit = Number(gallery.dataset.limit) || products.length;
      products.slice(0, limit).forEach((product) => gallery.appendChild(renderCard(product)));
    });
  } catch (error) {
    console.error("Fehler beim Laden der Galerie:", error);
    galleries.forEach((gallery) => {
      gallery.innerHTML = "<p class=\"shop-maintenance\">Produkte konnten gerade nicht geladen werden.</p>";
    });
  }
}

loadGalleries();
