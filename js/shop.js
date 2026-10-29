let currentProduct = null;
let currentImgIndex = 0;

// NEU: Hier merken wir uns, was der Nutzer ausgewählt hat
let selectedSize = null;
let selectedColor = null;
let selectedVariant = null;

// 1. Daten laden
async function loadProduct() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  try {
    // Katalog kommt aus Stripe (netlify/functions/products.js)
    const response = await fetch("/.netlify/functions/products");
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const products = await response.json();

    // Finde Produkt nach ID
    currentProduct = products.find((p) => p.id === productId);

    if (currentProduct) {
      renderProduct();
    } else {
      document.getElementById("shop-item").innerHTML = "<h2>Produkt nicht gefunden.</h2>";
    }
  } catch (error) {
    console.error("Fehler beim Laden der Produkte:", error);
    document.getElementById("shop-item").innerHTML =
      "<h2>Das Produkt konnte gerade nicht geladen werden. Bitte versuche es später erneut.</h2>";
  }
}

// 2. Produkt in HTML rendern
function renderProduct() {
  document.getElementById("prod-title").innerText = currentProduct.title;
  document.getElementById("prod-desc").innerText = currentProduct.description;
  document.getElementById("price").innerText =
    `${currentProduct.price.toFixed(2)} ${currentProduct.currency}`;

  // Vorrätige Ware: 5 Werktage, auf Bestellung gefertigte Ware: 14 Tage (siehe AGB § 5)
  document.getElementById("delivery-time").innerText =
    currentProduct.inStock
      ? "Auf Lager – Versand innerhalb von 5 Werktagen"
      : "Wird für dich gefertigt – Versand innerhalb von 14 Tagen";

  // Hauptbild setzen
  updateImg(0);

  // Thumbnails generieren
  const thumbBar = document.getElementById("thumb-bar");
  currentProduct.images.forEach((imgSrc, index) => {
    const img = document.createElement("img");
    img.src = imgSrc;
    img.classList.add("thumb");
    img.onmouseover = () => updateImg(index);
    thumbBar.appendChild(img);
  });

  // Dropdowns füllen
  if (currentProduct.sizes.length > 0) {
    // Standardmäßig die erste Größe auswählen
    selectedSize = currentProduct.sizes[0];
    renderSizeButtons(currentProduct.sizes);
  } else {
    document.getElementById("size-group").style.display = "none";
  }

  if (currentProduct.colors.length > 0) {
    // Standardmäßig die erste Farbe auswählen
    selectedColor = currentProduct.colors[0].name;
    renderColorButtons(currentProduct.colors);
  } else {
    document.getElementById("color-group").style.display = "none";
  }

  if (currentProduct.variants.length > 0) {
    // Standardmäßig die erste Variante auswählen
    selectedVariant = currentProduct.variants[0];
    fillDropdown("select-variant", currentProduct.variants);

    // Event Listener für das Dropdown, wenn sich die Variante ändert
    document.getElementById("select-variant").addEventListener("change", (e) => {
      selectedVariant = e.target.value;
    });
  } else {
    document.getElementById("variant-group").style.display = "none";
  }

  // NEU: "Jetzt kaufen"-Button aktivieren
  initBuyButton();
}

function fillDropdown(id, dataArray) {
  const select = document.getElementById(id);
  dataArray.forEach((item) => {
    const opt = document.createElement("option");
    opt.value = item;
    opt.innerText = item;
    select.appendChild(opt);
  });
}

function renderSizeButtons(sizes) {
  const container = document.getElementById("size-container");
  container.innerHTML = "";

  sizes.forEach((size, index) => {
    const btn = document.createElement("button");
    btn.textContent = size;
    btn.className = "size-btn";

    if (index === 0) btn.classList.add("active");

    btn.onclick = function () {
      document.querySelectorAll(".size-btn").forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      // NEU: Auswahl speichern
      selectedSize = size;
    };

    container.appendChild(btn);
  });
}

function renderColorButtons(colors) {
  const container = document.getElementById("color-container");
  container.innerHTML = "";

  colors.forEach((color, i) => {
    const btn = document.createElement("button");
    btn.className = `color-btn ${i === 0 ? "active" : ""}`;

    const dot = document.createElement("span");
    dot.className = "color-preview";
    dot.style.backgroundColor = color.hex;

    const text = document.createTextNode(color.name);

    btn.appendChild(dot);
    btn.appendChild(text);

    btn.onclick = () => {
      document.querySelectorAll(".color-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // NEU: Auswahl speichern
      selectedColor = color.name;

      if (color.image_index !== undefined) {
        updateImg(color.image_index);
      }
    };

    container.appendChild(btn);
  });
}

function updateImg(index) {
  currentImgIndex = index;
  const mainImg = document.getElementById("main-image");
  mainImg.src = currentProduct.images[currentImgIndex] || "img/logo.png";
}

function changeImage(step) {
  let newIndex = currentImgIndex + step;
  if (newIndex >= currentProduct.images.length) newIndex = 0;
  if (newIndex < 0) newIndex = currentProduct.images.length - 1;
  updateImg(newIndex);
}

// ==========================================
// AB HIER NEU: WARENKORB LOGIK VIA LOCALSTORAGE
// ==========================================

function initBuyButton() {
  const buyButton = document.getElementById("add-to-cart-btn");
  const quantityInput = document.getElementById("quantity");
  const cartButton = document.getElementById("go-to-cart-btn");

  // In den Warenkorb legen (Preis wird nur zur Anzeige gespeichert,
  // abgerechnet wird immer der aktuelle Preis aus Stripe)
  buyButton.onclick = () => {
    const quantity = Math.min(Math.max(parseInt(quantityInput.value) || 1, 1), 99);
    let cart = JSON.parse(localStorage.getItem("handheldt_cart")) || [];

    const cartItem = {
      productId: currentProduct.id,
      title: currentProduct.title,
      price: currentProduct.price,
      quantity: quantity,
      size: selectedSize,
      color: selectedColor,
      variant: selectedVariant,
      image: currentProduct.images[0] || "img/logo.png",
    };

    const existingItemIndex = cart.findIndex(
      (item) =>
        item.productId === cartItem.productId &&
        item.size === cartItem.size &&
        item.color === cartItem.color &&
        item.variant === cartItem.variant,
    );

    if (existingItemIndex > -1) {
      cart[existingItemIndex].quantity = Math.min(cart[existingItemIndex].quantity + quantity, 99);
    } else {
      cart.push(cartItem);
    }

    localStorage.setItem("handheldt_cart", JSON.stringify(cart));
    if (window.updateCartCount) window.updateCartCount();
    alert(`${currentProduct.title} wurde in den Warenkorb gelegt!`);
  };

  // Zur Kasse geht es immer über den Warenkorb (dort stehen Versandkosten und AGB-Hinweis)
  cartButton.onclick = () => {
    window.location.href = "cart.html";
  };
}

// Start
loadProduct();
