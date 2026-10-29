// js/cart.js

// Preis im deutschen Format, z. B. 45 -> "45,00 €"
function formatPrice(value) {
  return value.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

// 1. Warenkorb auslesen und auf dem Bildschirm anzeigen
function renderCart() {
  const cartContainer = document.getElementById("cart-container");
  const cartSummary = document.getElementById("cart-summary");
  const totalPriceElement = document.getElementById("total-price");

  // Warenkorb aus dem Speicher holen
  const cart = JSON.parse(localStorage.getItem("handheldt_cart")) || [];

  // Wenn der Warenkorb leer ist
  if (cart.length === 0) {
    cartContainer.innerHTML = `
      <p style="font-size: 1.2rem; color: #555;">Dein Warenkorb ist aktuell leer.</p>
      <a href="shop.html" style="display: inline-block; margin-top: 20px; color: #000; font-weight: bold;">Zurück zum Shop</a>
    `;
    cartSummary.hidden = true;
    return;
  }

  // Wenn Produkte da sind, Container leeren und Summary anzeigen
  cartContainer.innerHTML = "";
  cartSummary.hidden = false;

  let total = 0;

  // Loop durch alle Produkte im Warenkorb
  cart.forEach((item, index) => {
    const itemElement = document.createElement("div");
    itemElement.className = "cart-item";

    // Preis wird beim Laden mit Stripe abgeglichen (syncCartWithCatalog)
    const itemPrice = item.price;
    const itemTotal = itemPrice * item.quantity;
    total += itemTotal;

    itemElement.innerHTML = `
      <div class="cart-item-info">
        <img src="${item.image}" alt="">
        <div>
          <h3 class="cart-item-title">${item.title}</h3>
          <small class="cart-item-options">
            ${[item.size && `Größe: ${item.size}`, item.color && `Farbe: ${item.color}`, item.variant && `Variante: ${item.variant}`]
              .filter(Boolean)
              .join(" | ")}
          </small>
          <span class="cart-item-price">${formatPrice(itemPrice)}</span>
        </div>
      </div>

      <div class="cart-item-actions">
        <div class="quantity-control">
          <button type="button" onclick="changeQuantity(${index}, -1)" aria-label="Anzahl ${item.title} verringern">-</button>
          <span aria-label="Anzahl">${item.quantity}</span>
          <button type="button" onclick="changeQuantity(${index}, 1)" aria-label="Anzahl ${item.title} erhöhen">+</button>
        </div>

        <span class="cart-item-total">${formatPrice(itemTotal)}</span>

        <button type="button" class="cart-item-remove" onclick="removeFromCart(${index})" aria-label="${item.title} aus dem Warenkorb löschen">
          Löschen
        </button>
      </div>
    `;

    cartContainer.appendChild(itemElement);
  });

  totalPriceElement.innerText = formatPrice(total);
}

// 2. Funktion zum Ändern der Anzahl (+ / -)
window.changeQuantity = function (index, change) {
  let cart = JSON.parse(localStorage.getItem("handheldt_cart")) || [];

  cart[index].quantity = Math.min(cart[index].quantity + change, 99);

  // Wenn die Anzahl auf 0 sinkt, löschen wir das Produkt ganz
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }

  localStorage.setItem("handheldt_cart", JSON.stringify(cart));
  if (window.updateCartCount) window.updateCartCount();
  renderCart(); // Ansicht aktualisieren
};

// 3. Funktion zum kompletten Löschen
window.removeFromCart = function (index) {
  let cart = JSON.parse(localStorage.getItem("handheldt_cart")) || [];
  cart.splice(index, 1);
  localStorage.setItem("handheldt_cart", JSON.stringify(cart));
  if (window.updateCartCount) window.updateCartCount();
  renderCart(); // Ansicht aktualisieren
};

// ==========================================
// 4. STRIPE CHECKOUT AUSFÜHREN
// ==========================================
const checkoutButton = document.getElementById("checkout-button");

if (checkoutButton) {
  checkoutButton.addEventListener("click", async () => {
    const cart = JSON.parse(localStorage.getItem("handheldt_cart")) || [];

    try {
      checkoutButton.disabled = true;
      checkoutButton.innerText = "Wird zur Kasse weitergeleitet...";

      // Sende den aktuellen Warenkorb an deine funktionierende Netlify Function!
      const response = await fetch("/.netlify/functions/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: cart }),
      });

      const data = await response.json();

      if (data.url) {
        // Warenkorb wird erst auf success.html geleert, damit er bei Abbruch erhalten bleibt
        // Ab zu Stripe!
        window.location.href = data.url;
      } else {
        alert("Fehler: " + (data.error || "Checkout fehlgeschlagen."));
        checkoutButton.disabled = false;
        checkoutButton.innerText = "Weiter zur Kasse";
      }
    } catch (error) {
      console.error("Fehler beim Checkout:", error);
      alert("Verbindung zum Server fehlgeschlagen.");
      checkoutButton.disabled = false;
      checkoutButton.innerText = "Weiter zur Kasse";
    }
  });
}

// Warenkorb mit dem Stripe-Katalog abgleichen: nicht mehr angebotene Produkte entfernen,
// Preise, Namen und Bilder aktualisieren
async function syncCartWithCatalog() {
  try {
    const response = await fetch("/.netlify/functions/products");
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const products = await response.json();
    const cart = JSON.parse(localStorage.getItem("handheldt_cart")) || [];

    const synced = cart
      .filter((item) => products.some((p) => p.id === item.productId))
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return {
          ...item,
          title: product.title,
          price: product.price,
          image: product.images[0] || "img/logo.png",
        };
      });

    localStorage.setItem("handheldt_cart", JSON.stringify(synced));
    if (window.updateCartCount) window.updateCartCount();
  } catch (error) {
    console.error("Produkte konnten nicht geprüft werden:", error);
  }
}

// Beim Laden der Seite ausführen
syncCartWithCatalog().then(renderCart);
