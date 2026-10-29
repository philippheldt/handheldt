// js/cart.js
// Warenkorb: Seitenleiste (auf allen Seiten) und Warenkorb-Seite (cart.html).
// Beide Ansichten werden aus derselben Vorlage gerendert, siehe renderCart().

(function () {
  const CART_KEY = "handheldt_cart";
  // Versandkosten laut AGB § 3 (müssen zu netlify/functions/create-checkout.js passen)
  const FREE_SHIPPING_FROM = 50;
  const SHIPPING_COST = 4.9;

  let catalogSynced = false;
  let lastFocused = null;

  // ---------- Hilfsfunktionen ----------

  function formatPrice(value) {
    return value.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
  }

  // Produktdaten kommen aus Stripe, daher vor dem Einfügen ins HTML maskieren
  function escapeHtml(text) {
    return String(text ?? "").replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
  }

  function readCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function writeCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {}
    if (window.updateCartCount) window.updateCartCount();
    renderAll();
  }

  // Warenkorb mit dem Stripe-Katalog abgleichen: nicht mehr angebotene Produkte entfernen,
  // Preise, Namen und Bilder aktualisieren (einmal pro Seitenaufruf)
  async function syncCartWithCatalog() {
    if (catalogSynced || readCart().length === 0) return;
    try {
      const response = await fetch("/.netlify/functions/products");
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const products = await response.json();

      const synced = readCart()
        .filter((item) => products.some((p) => p.id === item.productId))
        .map((item) => {
          const product = products.find((p) => p.id === item.productId);
          return { ...item, title: product.title, price: product.price, image: product.images[0] || "img/logo.png" };
        });

      catalogSynced = true;
      writeCart(synced);
    } catch (error) {
      console.error("Produkte konnten nicht geprüft werden:", error);
    }
  }

  // ---------- Darstellung ----------

  function renderItems(cart) {
    return cart
      .map((item, index) => {
        const options = [item.size && `Größe ${item.size}`, item.color, item.variant].filter(Boolean).join(" · ");
        return `
          <li class="cart-item">
            <img class="cart-item-image" src="${escapeHtml(item.image)}" alt="">
            <div class="cart-item-body">
              <div class="cart-item-top">
                <h3 class="cart-item-title">${escapeHtml(item.title)}</h3>
                <span class="cart-item-total">${formatPrice(item.price * item.quantity)}</span>
              </div>
              ${options ? `<p class="cart-item-options">${escapeHtml(options)}</p>` : ""}
              <div class="cart-item-bottom">
                <div class="quantity-control quantity-control--small" role="group" aria-label="Anzahl ${escapeHtml(item.title)}">
                  <button type="button" data-action="decrease" data-index="${index}" aria-label="Anzahl verringern">−</button>
                  <span aria-live="polite">${item.quantity}</span>
                  <button type="button" data-action="increase" data-index="${index}" aria-label="Anzahl erhöhen">+</button>
                </div>
                <button type="button" class="link-button" data-action="remove" data-index="${index}"
                  aria-label="${escapeHtml(item.title)} entfernen">Entfernen</button>
              </div>
            </div>
          </li>`;
      })
      .join("");
  }

  function renderShippingProgress(subtotal) {
    if (subtotal >= FREE_SHIPPING_FROM) {
      return `
        <div class="shipping-progress shipping-progress--done">
          <p>Dein Versand ist <b>kostenlos</b>.</p>
          <div class="shipping-progress-bar"><span style="width: 100%"></span></div>
        </div>`;
    }
    const percent = Math.round((subtotal / FREE_SHIPPING_FROM) * 100);
    return `
      <div class="shipping-progress">
        <p>Noch <b>${formatPrice(FREE_SHIPPING_FROM - subtotal)}</b> bis zum kostenlosen Versand</p>
        <div class="shipping-progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${FREE_SHIPPING_FROM}"
          aria-valuenow="${subtotal.toFixed(2)}" aria-label="Fortschritt bis zum kostenlosen Versand">
          <span style="width: ${percent}%"></span>
        </div>
      </div>`;
  }

  function renderCart(root) {
    const isDrawer = root.dataset.cart === "drawer";
    const cart = readCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST;

    const header = isDrawer
      ? `
        <div class="cart-header">
          <h2 id="cart-drawer-title">Warenkorb${count > 0 ? ` <span class="cart-header-count">(${count})</span>` : ""}</h2>
          <button type="button" class="icon-button" data-action="close" aria-label="Warenkorb schließen">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>`
      : "";

    if (cart.length === 0) {
      root.innerHTML = `
        ${header}
        <div class="cart-empty">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12l1 14H5L6 7z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 7a3 3 0 0 1 6 0" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
          <p>Dein Warenkorb ist noch leer.</p>
          <a href="shop.html" class="black-button">Zum Shop</a>
        </div>`;
      return;
    }

    root.innerHTML = `
      ${header}
      ${renderShippingProgress(subtotal)}
      <ul class="cart-items">${renderItems(cart)}</ul>
      <div class="cart-footer">
        <dl class="cart-summary-rows">
          <div><dt>Zwischensumme</dt><dd>${formatPrice(subtotal)}</dd></div>
          <div><dt>Versand (DHL)</dt><dd>${shipping === 0 ? "kostenlos" : formatPrice(shipping)}</dd></div>
          <div class="cart-summary-total"><dt>Gesamt</dt><dd>${formatPrice(subtotal + shipping)}</dd></div>
        </dl>
        <p class="cart-note">Abholung in Teningen kannst du an der Kasse kostenlos wählen. Gemäß § 19 UStG wird
          keine Umsatzsteuer berechnet. Es gelten unsere <a href="agb.html">AGB</a> und die
          <a href="widerruf.html">Widerrufsbelehrung</a>.</p>
        <p class="cart-error" role="alert" hidden></p>
        <button type="button" class="black checkout-button" data-action="checkout">Weiter zur Kasse</button>
        ${isDrawer ? `<button type="button" class="link-button cart-continue" data-action="close">Weiter einkaufen</button>` : ""}
      </div>`;
  }

  function renderAll() {
    document.querySelectorAll("[data-cart]").forEach(renderCart);
  }

  // ---------- Aktionen ----------

  function changeQuantity(index, change) {
    const cart = readCart();
    if (!cart[index]) return;
    cart[index].quantity = Math.min(cart[index].quantity + change, 99);
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    writeCart(cart);
  }

  function removeItem(index) {
    const cart = readCart();
    cart.splice(index, 1);
    writeCart(cart);
  }

  async function checkout(root, button) {
    const errorBox = root.querySelector(".cart-error");
    errorBox.hidden = true;
    button.disabled = true;
    button.textContent = "Wird zur Kasse weitergeleitet …";

    try {
      const response = await fetch("/.netlify/functions/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: readCart() }),
      });
      const data = await response.json();

      if (data.url) {
        // Warenkorb wird erst auf success.html geleert, damit er bei Abbruch erhalten bleibt
        window.location.href = data.url;
        return;
      }
      throw new Error(data.error || "Checkout fehlgeschlagen.");
    } catch (error) {
      console.error("Fehler beim Checkout:", error);
      errorBox.textContent =
        error instanceof TypeError ? "Verbindung zum Server fehlgeschlagen. Bitte versuche es erneut." : error.message;
      errorBox.hidden = false;
      button.disabled = false;
      button.textContent = "Weiter zur Kasse";
    }
  }

  function handleClick(event) {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const root = target.closest("[data-cart], .cart-drawer");
    const index = Number(target.dataset.index);

    switch (target.dataset.action) {
      case "increase":
        return changeQuantity(index, 1);
      case "decrease":
        return changeQuantity(index, -1);
      case "remove":
        return removeItem(index);
      case "checkout":
        return checkout(root, target);
      case "close":
        return closeDrawer();
    }
  }

  // ---------- Seitenleiste ----------

  const drawer = document.getElementById("cart-drawer");
  const panel = drawer && drawer.querySelector("[data-cart]");

  function openDrawer() {
    // Auf der Warenkorb-Seite selbst braucht es keine Seitenleiste
    if (!drawer || document.querySelector('[data-cart="page"]')) return;
    lastFocused = document.activeElement;
    renderCart(panel);
    drawer.hidden = false;
    document.body.classList.add("cart-open");
    requestAnimationFrame(() => drawer.classList.add("is-open"));
    panel.focus();
    syncCartWithCatalog();
  }

  function closeDrawer() {
    if (!drawer || drawer.hidden) return;
    drawer.classList.remove("is-open");
    document.body.classList.remove("cart-open");
    setTimeout(() => (drawer.hidden = true), 300);
    if (lastFocused) lastFocused.focus();
  }

  // Tastatur: Esc schließt, Tab bleibt innerhalb der Seitenleiste
  function handleKeydown(event) {
    if (!drawer || drawer.hidden) return;
    if (event.key === "Escape") return closeDrawer();
    if (event.key !== "Tab") return;

    const focusable = panel.querySelectorAll("a[href], button:not([disabled])");
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  // ---------- Öffentliche Schnittstelle (für shop.js) ----------

  window.handheldtCart = {
    add(item) {
      const cart = readCart();
      const existing = cart.find(
        (entry) =>
          entry.productId === item.productId &&
          entry.size === item.size &&
          entry.color === item.color &&
          entry.variant === item.variant,
      );
      if (existing) {
        existing.quantity = Math.min(existing.quantity + item.quantity, 99);
      } else {
        cart.push(item);
      }
      writeCart(cart);
      openDrawer();
    },
    open: openDrawer,
    close: closeDrawer,
  };

  // ---------- Start ----------

  document.addEventListener("click", (event) => {
    const opener = event.target.closest("[data-cart-open]");
    if (opener && drawer && !document.querySelector('[data-cart="page"]')) {
      event.preventDefault();
      openDrawer();
      return;
    }
    if (event.target.closest("[data-cart], .cart-drawer")) handleClick(event);
  });
  document.addEventListener("keydown", handleKeydown);

  renderAll();
  if (document.querySelector('[data-cart="page"]')) syncCartWithCatalog();
})();
