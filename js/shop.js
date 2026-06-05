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
    const response = await fetch("products.json");
    const products = await response.json();

    // Finde Produkt nach ID
    currentProduct = products.find((p) => p.id === productId);

    if (currentProduct) {
      renderProduct();
    } else {
      document.getElementById("shop-item").innerHTML = "<h2>Produkt nicht gefunden.</h2>";
    }
  } catch (error) {
    console.error("Fehler beim Laden der JSON:", error);
  }
}

// 2. Produkt in HTML rendern
function renderProduct() {
  document.getElementById("prod-title").innerText = currentProduct.title;
  document.getElementById("prod-desc").innerText = currentProduct.description;
  document.getElementById("price").innerText =
    `${currentProduct.price.toFixed(2)} ${currentProduct.currency}`;

  if (currentProduct.discountPrice > currentProduct.price) {
    document.getElementById("old-price").innerText =
      `${currentProduct.discountPrice.toFixed(2)} ${currentProduct.currency}`;
  }
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
  mainImg.src = currentProduct.images[currentImgIndex];
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
  const buyButton = document.querySelector(".product-details button.black");
  const quantityInput = document.getElementById("quantity");

  // NEU: Wir holen uns den neuen Checkout-Button aus dem HTML
  const checkoutButton = document.getElementById("go-to-checkout-btn");

  // 1. Logik für den normalen "Jetzt kaufen" Button (In den Warenkorb legen)
  if (buyButton) {
    buyButton.onclick = () => {
      const quantity = parseInt(quantityInput.value) || 1;
      let cart = JSON.parse(localStorage.getItem("handheldt_cart")) || [];

      const cartItem = {
        priceId: currentProduct.id,
        title: currentProduct.title,
        quantity: quantity,
        size: selectedSize,
        color: selectedColor,
        variant: selectedVariant,
        image: currentProduct.images[0],
      };

      const existingItemIndex = cart.findIndex(
        (item) =>
          item.priceId === cartItem.priceId &&
          item.size === cartItem.size &&
          item.color === cartItem.color &&
          item.variant === cartItem.variant,
      );

      if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += quantity;
      } else {
        cart.push(cartItem);
      }

      localStorage.setItem("handheldt_cart", JSON.stringify(cart));
      alert(`${currentProduct.title} wurde in den Warenkorb gelegt!`);
    };
  }

  // ============================================================
  // NEU: 2. Logik für den "Zum Warenkorb & Kasse" Button
  // ============================================================
  if (checkoutButton) {
    checkoutButton.onclick = async () => {
      // Wir holen den aktuellen Warenkorb aus dem Speicher
      const cart = JSON.parse(localStorage.getItem("handheldt_cart")) || [];

      // Falls der Warenkorb komplett leer ist, warnen wir den Nutzer kurz
      if (cart.length === 0) {
        alert("Dein Warenkorb ist noch leer! Füge zuerst ein Produkt hinzu.");
        return;
      }

      try {
        // Button optisch sperren während des Ladens
        checkoutButton.disabled = true;
        checkoutButton.innerText = "Wird zur Kasse weitergeleitet...";

        // Wir senden den GESAMTEN Warenkorb an deine Netlify Function
        const response = await fetch("/.netlify/functions/create-checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ items: cart }),
        });

        const data = await response.json();

        if (data.url) {
          // WICHTIG: Wir leeren den lokalen Warenkorb, da der Nutzer jetzt bezahlt
          localStorage.removeItem("handheldt_cart");

          // Ab zu Stripe!
          window.location.href = data.url;
        } else {
          alert("Fehler: " + (data.error || "Checkout konnte nicht geladen werden."));
          checkoutButton.disabled = false;
          checkoutButton.innerText = "Zum Warenkorb & Kasse";
        }
      } catch (error) {
        console.error("Fehler beim Checkout:", error);
        alert("Verbindung zum Server fehlgeschlagen.");
        checkoutButton.disabled = false;
        checkoutButton.innerText = "Zum Warenkorb & Kasse";
      }
    };
  }
}

// Start
loadProduct();
