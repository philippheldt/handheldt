// js/shop.js – Produktseite (shop_item.html?id=prod_…)

// Preis im deutschen Format, z. B. 45 -> "45,00 €"
function formatPrice(value) {
  return value.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

let currentProduct = null;
let currentImgIndex = 0;

// Auswahl des Nutzers
let selectedSize = null;
let selectedColor = null;
let selectedVariant = null;

// 1. Produkt aus dem Stripe-Katalog laden (netlify/functions/products.js)
async function loadProduct() {
  const productId = new URLSearchParams(window.location.search).get("id");

  try {
    const response = await fetch("/.netlify/functions/products");
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const products = await response.json();

    currentProduct = products.find((p) => p.id === productId);

    if (currentProduct) {
      renderProduct();
    } else {
      showMessage("Dieses Produkt gibt es leider nicht (mehr).");
    }
  } catch (error) {
    console.error("Fehler beim Laden der Produkte:", error);
    showMessage("Das Produkt konnte gerade nicht geladen werden. Bitte versuche es später erneut.");
  }
}

function showMessage(text) {
  document.getElementById("shop-item").innerHTML = `
    <div class="product-message">
      <h1 class="page-title">${text}</h1>
      <a href="shop.html" class="black-button">Zum Shop</a>
    </div>`;
}

// 2. Produkt darstellen
function renderProduct() {
  document.title = `${currentProduct.title} | handheldt`;
  document.getElementById("prod-title").innerText = currentProduct.title;
  document.getElementById("price").innerText = `${formatPrice(currentProduct.price)}*`;

  const description = document.getElementById("prod-desc");
  if (currentProduct.description) {
    description.innerText = currentProduct.description;
  } else {
    document.getElementById("description-accordion").hidden = true;
  }

  // Lieferzeit laut AGB § 5: vorrätig 5 Werktage, auf Bestellung gefertigt 14 Tage
  const stock = document.getElementById("delivery-time");
  stock.innerText = currentProduct.inStock
    ? "Auf Lager – Versand in 5 Werktagen"
    : "Wird für dich gefertigt – Versand in 14 Tagen";
  stock.classList.toggle("stock-badge--made-to-order", !currentProduct.inStock);
  stock.hidden = false;

  renderGallery();

  if (currentProduct.sizes.length > 0) {
    selectedSize = currentProduct.sizes[0];
    renderChips("size", currentProduct.sizes.map((size) => ({ value: size, label: size })), (value) => {
      selectedSize = value;
    });
  } else {
    document.getElementById("size-group").hidden = true;
  }

  if (currentProduct.colors.length > 0) {
    selectedColor = currentProduct.colors[0].name;
    renderChips(
      "color",
      currentProduct.colors.map((color) => ({ value: color.name, label: color.name, hex: color.hex })),
      (value) => {
        selectedColor = value;
      },
    );
  } else {
    document.getElementById("color-group").hidden = true;
  }

  if (currentProduct.variants.length > 0) {
    selectedVariant = currentProduct.variants[0];
    const select = document.getElementById("select-variant");
    currentProduct.variants.forEach((variant) => select.add(new Option(variant, variant)));
    select.addEventListener("change", (e) => (selectedVariant = e.target.value));
  } else {
    document.getElementById("variant-group").hidden = true;
  }

  initBuyRow();
}

// Auswahl-Buttons für Größe und Farbe; die aktuelle Auswahl steht neben der Überschrift
function renderChips(type, options, onSelect) {
  const container = document.getElementById(`${type}-container`);
  const valueLabel = document.getElementById(`${type}-value`);
  container.innerHTML = "";
  valueLabel.innerText = options[0].label;

  options.forEach((option, index) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `chip${index === 0 ? " active" : ""}`;
    chip.setAttribute("aria-pressed", index === 0);

    if (option.hex) {
      const dot = document.createElement("span");
      dot.className = "chip-swatch";
      dot.style.backgroundColor = option.hex;
      chip.appendChild(dot);
    }
    chip.appendChild(document.createTextNode(option.label));

    chip.onclick = () => {
      container.querySelectorAll(".chip").forEach((c) => {
        c.classList.remove("active");
        c.setAttribute("aria-pressed", false);
      });
      chip.classList.add("active");
      chip.setAttribute("aria-pressed", true);
      valueLabel.innerText = option.label;
      onSelect(option.value);
    };

    container.appendChild(chip);
  });
}

// 3. Bildergalerie
function renderGallery() {
  const images = currentProduct.images;
  const thumbBar = document.getElementById("thumb-bar");
  thumbBar.innerHTML = "";

  // Bei nur einem Bild braucht es weder Pfeile noch Vorschaubilder
  document.getElementById("gallery-nav").hidden = images.length < 2;
  thumbBar.hidden = images.length < 2;

  images.forEach((imgSrc, index) => {
    const thumb = document.createElement("button");
    thumb.type = "button";
    thumb.className = "thumb-button";
    thumb.setAttribute("aria-label", `Bild ${index + 1} anzeigen`);
    thumb.onclick = () => updateImg(index);

    const img = document.createElement("img");
    img.src = imgSrc;
    img.alt = "";
    img.className = "thumb";

    thumb.appendChild(img);
    thumbBar.appendChild(thumb);
  });

  updateImg(0);
}

function updateImg(index) {
  currentImgIndex = index;
  const mainImg = document.getElementById("main-image");
  mainImg.src = currentProduct.images[index] || "img/logo.png";
  mainImg.alt = `${currentProduct.title} – Bild ${index + 1}`;

  document.querySelectorAll(".thumb-button").forEach((thumb, i) => {
    thumb.classList.toggle("active", i === index);
    thumb.setAttribute("aria-current", i === index);
  });
}

function changeImage(step) {
  const count = currentProduct.images.length;
  updateImg((currentImgIndex + step + count) % count);
}

// 4. Menge und "In den Warenkorb"
function initBuyRow() {
  const quantityInput = document.getElementById("quantity");
  const clampQuantity = () => Math.min(Math.max(parseInt(quantityInput.value) || 1, 1), 99);

  document.querySelectorAll("[data-quantity-step]").forEach((button) => {
    button.onclick = () => {
      quantityInput.value = Math.min(Math.max(clampQuantity() + Number(button.dataset.quantityStep), 1), 99);
    };
  });
  quantityInput.addEventListener("change", () => (quantityInput.value = clampQuantity()));

  // Der Preis wird nur zur Anzeige gespeichert, abgerechnet wird immer der aktuelle Preis aus Stripe
  document.getElementById("add-to-cart-btn").onclick = () => {
    window.handheldtCart.add({
      productId: currentProduct.id,
      title: currentProduct.title,
      price: currentProduct.price,
      quantity: clampQuantity(),
      size: selectedSize,
      color: selectedColor,
      variant: selectedVariant,
      image: currentProduct.images[0] || "img/logo.png",
    });
    quantityInput.value = 1;
  };
}

loadProduct();
