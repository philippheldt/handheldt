// js/cart.js

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
    cartSummary.style.display = "none";
    return;
  }

  // Wenn Produkte da sind, Container leeren und Summary anzeigen
  cartContainer.innerHTML = "";
  cartSummary.style.display = "block";

  let total = 0;

  // Loop durch alle Produkte im Warenkorb
  cart.forEach((item, index) => {
    const itemElement = document.createElement("div");
    itemElement.className = "cart-item";

    // Einfaches Inline-Styling, das du später in dein CSS packen kannst
    itemElement.style =
      "display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #eee; padding: 20px 0; gap: 15px; flex-wrap: wrap;";

    // Dummy-Preisanzeige (Da wir im LocalStorage nur IDs speichern,
    // nehmen wir für die Anzeige hier einen Beispielpreis oder den aus deiner JSON.
    // Tipp: Es empfiehlt sich, beim "In den Warenkorb legen" auch den "price" im Objekt abzuspeichern!)
    const itemPrice = item.price || 29.9;
    const itemTotal = itemPrice * item.quantity;
    total += itemTotal;

    itemElement.innerHTML = `
      <div style="display: flex; align-items: center; gap: 20px; flex: 1; min-width: 250px;">
        <img src="${item.image}" alt="${item.title}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 4px;">
        <div>
          <h4 style="margin: 0 0 5px 0; font-size: 1.1rem;">${item.title}</h4>
          <small style="color: #666; display: block; margin-bottom: 4px;">
            ${item.size ? `Größe: ${item.size}` : ""} 
            ${item.color ? ` | Farbe: ${item.color}` : ""} 
            ${item.variant ? ` | Variante: ${item.variant}` : ""}
          </small>
          <span style="font-weight: 600;">${itemPrice.toFixed(2)} €</span>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 20px;">
        <div style="display: flex; align-items: center; border: 1px solid #ccc; border-radius: 4px; overflow: hidden;">
          <button onclick="changeQuantity(${index}, -1)" style="padding: 5px 12px; background: #f5f5f5; border: none; cursor: pointer; font-weight: bold;">-</button>
          <span style="padding: 5px 15px; min-width: 20px; text-align: center; background: #fff;">${item.quantity}</span>
          <button onclick="changeQuantity(${index}, 1)" style="padding: 5px 12px; background: #f5f5f5; border: none; cursor: pointer; font-weight: bold;">+</button>
        </div>
        
        <span style="font-weight: bold; min-width: 70px; text-align: right;">${itemTotal.toFixed(2)} €</span>
        
        <button onclick="removeFromCart(${index})" style="background: none; border: none; color: #cc0000; cursor: pointer; font-size: 0.9rem; text-decoration: underline;">
          Löschen
        </button>
      </div>
    `;

    cartContainer.appendChild(itemElement);
  });

  totalPriceElement.innerText = `${total.toFixed(2)} €`;
}

// 2. Funktion zum Ändern der Anzahl (+ / -)
window.changeQuantity = function (index, change) {
  let cart = JSON.parse(localStorage.getItem("handheldt_cart")) || [];

  cart[index].quantity += change;

  // Wenn die Anzahl auf 0 sinkt, löschen wir das Produkt ganz
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }

  localStorage.setItem("handheldt_cart", JSON.stringify(cart));
  renderCart(); // Ansicht aktualisieren
};

// 3. Funktion zum kompletten Löschen
window.removeFromCart = function (index) {
  let cart = JSON.parse(localStorage.getItem("handheldt_cart")) || [];
  cart.splice(index, 1);
  localStorage.setItem("handheldt_cart", JSON.stringify(cart));
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
        // Warenkorb im Browser leeren, da der Kauf jetzt gestartet ist
        localStorage.removeItem("handheldt_cart");
        // Ab zu Stripe!
        window.location.href = data.url;
      } else {
        alert("Fehler: " + (data.error || "Checkout fehlgeschlagen."));
        checkoutButton.disabled = false;
        checkoutButton.innerText = "Sicher bezahlen mit Stripe";
      }
    } catch (error) {
      console.error("Fehler beim Checkout:", error);
      alert("Verbindung zum Server fehlgeschlagen.");
      checkoutButton.disabled = false;
      checkoutButton.innerText = "Sicher bezahlen mit Stripe";
    }
  });
}

// Beim Laden der Seite ausführen
renderCart();
