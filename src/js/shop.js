// js/shop.js – Produktseite (shop_item.html?id=prod_…)

// Preis im deutschen Format, z. B. 45 -> "45,00 €"
function formatPrice(value) {
  return value.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
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
  return {
    ...product,
    images: [...product.images, ...extra.map((image) => image.src)],
    thumbs: [...product.images, ...extra.map((image) => image.thumb)],
  };
}

// "2026-12-15" -> "15. Dezember 2026"
function formatLongDate(isoDate) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
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
    const [products, folders] = await Promise.all([response.json(), loadProductImageFolders()]);

    const product = products.find((p) => p.id === productId);
    currentProduct = product ? withFolderImages(product, folders) : null;

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

  // Lieferzeit laut AGB § 5: Vorbestellung ab Datum, sonst vorrätig 5 Werktage bzw. gefertigt 14 Tage
  const stock = document.getElementById("delivery-time");
  if (currentProduct.preorderDate) {
    stock.innerText = `Vorbestellung – Versand ab ${formatLongDate(currentProduct.preorderDate)}`;
    stock.classList.add("stock-badge--preorder");
    document.getElementById("add-to-cart-btn").innerText = "Vorbestellen";
  } else {
    stock.innerText = currentProduct.inStock
      ? "Auf Lager – Versand in 5 Werktagen"
      : "Wird für dich gefertigt – Versand in 14 Tagen";
    stock.classList.toggle("stock-badge--made-to-order", !currentProduct.inStock);
  }
  stock.hidden = false;

  // Versandfreie Produkte (z. B. Postkarten): allein bestellt kostenlos, sonst gilt die normale Pauschale
  if (currentProduct.freeShipping) {
    document.getElementById("shipping-note").innerHTML =
      'allein bestellt versandkostenfrei, sonst zzgl. <a href="agb.html">Versandkosten</a>';
  }

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

// Auf dem Handy durch die Bilder wischen
let swipeReady = false;
function initSwipe() {
  if (swipeReady) return;
  swipeReady = true;
  const box = document.querySelector(".main-image-container");
  let startX = null;
  box.addEventListener("touchstart", (e) => (startX = e.touches[0].clientX), { passive: true });
  box.addEventListener("touchend", (e) => {
    if (startX === null || currentProduct.images.length < 2) return;
    const deltaX = e.changedTouches[0].clientX - startX;
    if (Math.abs(deltaX) > 40) changeImage(deltaX < 0 ? 1 : -1);
    startX = null;
  });
}
function renderGallery() {
  initSwipe();

  const images = currentProduct.images;
  const thumbBar = document.getElementById("thumb-bar");
  thumbBar.innerHTML = "";

  // Bei nur einem Bild braucht es weder Pfeile noch Vorschaubilder
  document.getElementById("gallery-nav").hidden = images.length < 2;
  thumbBar.hidden = images.length < 2;

  currentProduct.thumbs.forEach((imgSrc, index) => {
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

  // Aktives Vorschaubild in der Leiste sichtbar halten (ohne die Seite zu scrollen)
  const bar = document.getElementById("thumb-bar");
  const active = bar.children[index];
  if (active) {
    const left = active.offsetLeft - bar.offsetLeft;
    if (left < bar.scrollLeft || left + active.offsetWidth > bar.scrollLeft + bar.clientWidth) {
      bar.scrollTo({ left: left - bar.clientWidth / 2 + active.offsetWidth / 2, behavior: "smooth" });
    }
  }
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
      freeShipping: currentProduct.freeShipping,
      preorderDate: currentProduct.preorderDate,
    });
    quantityInput.value = 1;
  };
}

loadProduct();
