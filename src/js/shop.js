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
    // Dateinamen der Ordnerbilder (Stripe-Bilder haben keinen), z. B. "fels-rot"
    imageNames: [...product.images.map(() => ""), ...extra.map((image) => image.name || "")],
  };
}

// "Dunkel Blau" / "fels-rot.jpg" -> ["dunkel", "blau"] / ["fels", "rot"]
function nameTokens(text) {
  return String(text)
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

// Erstes Bild, dessen Dateiname die Farbe/Variante enthält (z. B. "Rot" -> fels-rot.jpg), sonst -1
function imageIndexFor(option) {
  const wanted = nameTokens(option);
  if (!option || wanted.length === 0) return -1;
  return currentProduct.imageNames.findIndex((name) => {
    const tokens = nameTokens(name);
    return tokens.some((_, start) => wanted.every((token, offset) => tokens[start + offset] === token));
  });
}

// Bei Auswahl einer Farbe/Variante das passende Bild zeigen. Ohne eigenes Bild zurück zum Titelbild,
// damit nicht das Bild einer anderen Farbe stehen bleibt.
let showingOptionImage = false;
function showImageFor(option) {
  const index = imageIndexFor(option);
  if (index >= 0) {
    updateImg(index);
    showingOptionImage = true;
  } else if (showingOptionImage) {
    updateImg(0);
    showingOptionImage = false;
  }
}

// Vorschaubild für den Warenkorb: passendes Bild zu Farbe/Variante, sonst das Titelbild
function selectedImage() {
  const index = [selectedColor, selectedVariant].map(imageIndexFor).find((i) => i >= 0);
  return index !== undefined ? currentProduct.thumbs[index] : currentProduct.images[0] || "";
}

// "2026-12-15" -> "15. Dezember 2026"
function formatLongDate(isoDate) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
}

// 200 (Cent) -> "+2,00 €"
function formatSurcharge(cents) {
  return `+${formatPrice(cents / 100)}`;
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
  updatePrice();

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

  // Herstellungs-Hinweis: Standard "Von Hand im Siebdruck bedruckt", eigener Text oder ausgeblendet
  const production = (currentProduct.production || "").trim();
  if (production.toLowerCase() === "nein") {
    document.getElementById("perk-production").hidden = true;
  } else if (production) {
    document.getElementById("perk-production-text").innerText = production;
  }

  // Versandfreie Produkte (z. B. Postkarten): allein bestellt kostenlos, sonst gilt die normale Pauschale
  if (currentProduct.freeShipping) {
    document.getElementById("shipping-note").innerHTML =
      'allein bestellt versandkostenfrei, sonst zzgl. <a href="agb.html">Versandkosten</a>';
    document.getElementById("perk-shipping-text").innerText = "Allein bestellt versandkostenfrei";
  }

  renderGallery();

  if (currentProduct.sizes.length > 0) {
    // Ausverkaufte Größen sind gesperrt; vorausgewählt wird die erste verfügbare
    selectedSize = currentProduct.sizes.find((size) => optionStock(size) > 0) || currentProduct.sizes[0];
    renderChips(
      "size",
      currentProduct.sizes.map((size) => ({
        value: size,
        label: size,
        surcharge: currentProduct.surcharges.size[size],
        disabled: optionStock(size) <= 0,
      })),
      (value) => {
        selectedSize = value;
        updatePrice();
        updateAvailability();
      },
      selectedSize,
    );
  } else {
    document.getElementById("size-group").hidden = true;
  }

  if (currentProduct.colors.length > 0) {
    // Ausverkaufte Farben sind gesperrt; vorausgewählt wird die erste verfügbare
    const colorNames = currentProduct.colors.map((color) => color.name);
    selectedColor = colorNames.find((name) => optionStock(name) > 0) || colorNames[0];
    renderChips(
      "color",
      currentProduct.colors.map((color) => ({
        value: color.name,
        label: color.name,
        hex: color.hex,
        surcharge: currentProduct.surcharges.color[color.name],
        disabled: optionStock(color.name) <= 0,
      })),
      (value) => {
        selectedColor = value;
        updatePrice();
        updateAvailability();
        showImageFor(value);
      },
      selectedColor,
    );
  } else {
    document.getElementById("color-group").hidden = true;
  }

  if (currentProduct.variants.length > 0) {
    selectedVariant = currentProduct.variants.find((variant) => optionStock(variant) > 0) || currentProduct.variants[0];
    const select = document.getElementById("select-variant");
    currentProduct.variants.forEach((variant) => {
      const surcharge = currentProduct.surcharges.variant[variant];
      const soldOut = optionStock(variant) <= 0;
      const label = [variant, surcharge && `(${formatSurcharge(surcharge)})`, soldOut && "– ausverkauft"]
        .filter(Boolean)
        .join(" ");
      const option = new Option(label, variant, false, variant === selectedVariant);
      option.disabled = soldOut;
      select.add(option);
    });
    select.addEventListener("change", (e) => {
      selectedVariant = e.target.value;
      updatePrice();
      updateAvailability();
      showImageFor(selectedVariant);
    });
  } else {
    document.getElementById("variant-group").hidden = true;
  }

  initBuyRow();
}

// Preis inkl. Aufpreisen der gewählten Optionen (abgerechnet wird serverseitig mit den Stripe-Daten)
function selectedPrice() {
  const { size, color, variant } = currentProduct.surcharges;
  const extra = (size[selectedSize] || 0) + (color[selectedColor] || 0) + (variant[selectedVariant] || 0);
  return currentProduct.price + extra / 100;
}

function updatePrice() {
  document.getElementById("price").innerText = `${formatPrice(selectedPrice())}*`;
}

// Auswahl-Buttons für Größe und Farbe; die aktuelle Auswahl steht neben der Überschrift
function renderChips(type, options, onSelect, selectedValue = options[0].value) {
  const container = document.getElementById(`${type}-container`);
  const valueLabel = document.getElementById(`${type}-value`);
  container.innerHTML = "";
  valueLabel.innerText = options.find((option) => option.value === selectedValue).label;

  options.forEach((option) => {
    const isSelected = option.value === selectedValue;
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `chip${isSelected ? " active" : ""}${option.disabled ? " sold-out" : ""}`;
    chip.setAttribute("aria-pressed", isSelected);
    if (option.disabled) {
      chip.disabled = true;
      chip.setAttribute("aria-label", `${option.label} – ausverkauft`);
    }

    if (option.hex) {
      const dot = document.createElement("span");
      dot.className = "chip-swatch";
      dot.style.backgroundColor = option.hex;
      chip.appendChild(dot);
    }
    chip.appendChild(document.createTextNode(option.label));
    if (option.surcharge) {
      const extra = document.createElement("span");
      extra.className = "chip-surcharge";
      extra.innerText = formatSurcharge(option.surcharge);
      chip.appendChild(extra);
    }

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
  // Ohne Bild bleibt die neutrale Fläche des Containers sichtbar
  const src = currentProduct.images[index];
  if (src) mainImg.src = src;
  mainImg.hidden = !src;
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
// Verfügbare Stückzahl laut Bestand (Infinity = unbegrenzt).
// Bestand gibt es insgesamt oder je Größe, Farbe bzw. Variante; nicht genannte Optionen sind unbegrenzt.
function availableStock(choice = { size: selectedSize, color: selectedColor, variant: selectedVariant }) {
  const stock = currentProduct.stock;
  if (!stock) return Infinity;
  if (stock.total !== null) return stock.total;
  const option = [choice.size, choice.color, choice.variant].find((value) => value && value in stock.byOption);
  return option ? stock.byOption[option] : Infinity;
}

// Bestand einer einzelnen Option (für ausgegraute Größen/Farben/Varianten)
function optionStock(value) {
  const stock = currentProduct.stock;
  if (!stock || stock.total !== null || !(value in stock.byOption)) return Infinity;
  return stock.byOption[value];
}

// Button, Mengenauswahl und Hinweis an den Bestand der gewählten Größe anpassen
function updateAvailability() {
  const available = availableStock();
  const soldOut = currentProduct.soldOut || available <= 0;
  const button = document.getElementById("add-to-cart-btn");
  const hint = document.getElementById("stock-hint");
  const quantityInput = document.getElementById("quantity");

  button.disabled = soldOut;
  button.innerText = soldOut ? "Ausverkauft" : currentProduct.preorderDate ? "Vorbestellen" : "In den Warenkorb";
  document.querySelectorAll("[data-quantity-step]").forEach((b) => (b.disabled = soldOut));
  quantityInput.disabled = soldOut;
  quantityInput.max = Math.min(99, available);
  if (!soldOut && Number(quantityInput.value) > available) quantityInput.value = available;

  if (currentProduct.soldOut) {
    const badge = document.getElementById("delivery-time");
    badge.innerText = "Ausverkauft";
    badge.className = "stock-badge stock-badge--soldout";
  }

  hint.hidden = soldOut || available > 5;
  hint.innerText = available === 1 ? "Nur noch 1 Stück verfügbar" : `Nur noch ${available} Stück verfügbar`;
}

function initBuyRow() {
  const quantityInput = document.getElementById("quantity");
  const clampQuantity = () => Math.min(Math.max(parseInt(quantityInput.value) || 1, 1), 99, availableStock());

  document.querySelectorAll("[data-quantity-step]").forEach((button) => {
    button.onclick = () => {
      quantityInput.value = Math.min(
        Math.max(clampQuantity() + Number(button.dataset.quantityStep), 1),
        99,
        availableStock(),
      );
    };
  });
  updateAvailability();
  quantityInput.addEventListener("change", () => (quantityInput.value = clampQuantity()));

  // Der Preis wird nur zur Anzeige gespeichert, abgerechnet wird immer der aktuelle Preis aus Stripe
  document.getElementById("add-to-cart-btn").onclick = () => {
    window.handheldtCart.add({
      productId: currentProduct.id,
      title: currentProduct.title,
      price: selectedPrice(),
      quantity: clampQuantity(),
      size: selectedSize,
      color: selectedColor,
      variant: selectedVariant,
      image: selectedImage(),
      freeShipping: currentProduct.freeShipping,
      preorderDate: currentProduct.preorderDate,
      // Für den Warenkorb: mehr als verfügbar lässt sich nicht hineinlegen (null = unbegrenzt)
      available: Number.isFinite(availableStock()) ? availableStock() : null,
    });
    quantityInput.value = 1;
  };
}

loadProduct();
