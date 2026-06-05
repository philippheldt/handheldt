async function loadGallery() {
  try {
    // Lädt die gleiche JSON-Datei wie die Detailseite
    const response = await fetch("products.json");
    const products = await response.json();

    const galleryContainer = document.getElementById("main-gallery");
    galleryContainer.innerHTML = ""; // Container leeren

    products.forEach((product) => {
      // Erstelle den Link zur Detailseite mit der ID-Injection
      const card = document.createElement("a");
      card.href = `shop_item.html?id=${product.id}`;
      card.className = "product-card";

      // Das erste Bild (Standard)
      const img1Src = product.images[0];

      // Das zweite Bild (für Hover) - wir prüfen, ob es existiert
      const img2Src = product.images.length > 1 ? product.images[1] : img1Src;

      // Die neue HTML-Struktur für die Karte mit ZWEI Bildern
      card.innerHTML = `
        <div class="card-image-wrapper">
            <img src="${img1Src}" alt="${product.title}" class="primary-img">
            
            <img src="${img2Src}" alt="${product.title}" class="secondary-img">
        </div>
        <h3>${product.title}</h3>
        <div class="price">${product.price.toFixed(2)} ${product.currency}</div>
    `;

      galleryContainer.appendChild(card);
    });
  } catch (error) {
    console.error("Fehler beim Laden der Galerie:", error);
    document.getElementById("main-gallery").innerHTML =
      "<p>Produkte konnten nicht geladen werden.</p>";
  }
}

// Start
loadGallery();
