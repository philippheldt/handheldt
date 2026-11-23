// netlify/lib/order.js
// Gemeinsame Prüfung des Warenkorbs für die Kasse (create-checkout.js) und für
// „Abholen und bar bezahlen“ (cash-order.js): Produkte, Optionen, Bestand, Mindestbestellwert.
import { availableFor, stockOptionFor } from "./catalog.js";

// Mindestbestellwert laut AGB § 3 (Warenwert ohne Versand, in Cent; muss zu js/cart.js passen)
export const MIN_ORDER_AMOUNT = 250;

// "2026-12-15" -> "15.12.2026"
export function formatDate(isoDate) {
  const [year, month, day] = isoDate.split("-");
  return `${day}.${month}.${year}`;
}

// 200 -> "+2,00 €"
function formatSurcharge(cents) {
  return `+${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

// Aufpreise der gewählten Optionen in Cent (aus den Stripe-Metadaten, nie aus dem Browser)
export function surchargeFor(product, item) {
  const { size, color, variant } = product.surcharges;
  return (size[item.size] || 0) + (color[item.color] || 0) + (variant[item.variant] || 0);
}

// Stückpreis inkl. Aufpreisen in Cent
export function unitAmountFor(product, item) {
  return product.unitAmount + surchargeFor(product, item);
}

// Gewählte Ausführung als Text, z. B. ["Größe M", "Farbe Gelb", "Vorbestellung – Versand ab 15.12.2026"]
export function optionTexts(product, item) {
  const { size, color, variant } = product.surcharges;
  const withSurcharge = (label, amount) => (amount ? `${label} (${formatSurcharge(amount)})` : label);
  return [
    item.size && withSurcharge(`Größe ${item.size}`, size[item.size]),
    item.color && withSurcharge(`Farbe ${item.color}`, color[item.color]),
    item.variant && withSurcharge(item.variant, variant[item.variant]),
    product.preorderDate &&
      `Vorbestellung – Versand ${product.preorderExact ? "am" : "ab"} ${formatDate(product.preorderDate)}`,
  ].filter(Boolean);
}

// Name für Fehlermeldungen: „Der Fels | Postkarte“ (Blau)
function itemLabel(title, option) {
  return `„${title}“${option ? ` (${option})` : ""}`;
}

// Prüft eine Warenkorb-Position gegen den Katalog.
// Ergebnis: { product } oder { error } mit einer verständlichen Meldung für den Warenkorb.
function validateItem(item, catalog) {
  const title = typeof item.title === "string" ? item.title.slice(0, 80) : "Ein Produkt";
  const product = catalog.find((p) => p.id === item.productId);
  if (!product) {
    return { error: `${itemLabel(title)} gibt es leider nicht mehr. Bitte entferne es aus dem Warenkorb.` };
  }
  if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
    return { error: `Die Menge von ${itemLabel(product.title)} ist ungültig. Bitte passe sie an.` };
  }

  // Auswahl muss zu den aktuellen Optionen des Produkts passen (falls es welche gibt)
  const unavailable = (value) =>
    `${itemLabel(product.title, value)} gibt es in dieser Ausführung nicht mehr. Bitte entferne es und wähle neu.`;
  if (product.sizes.length > 0 && !product.sizes.includes(item.size)) return { error: unavailable(item.size) };
  if (product.colors.length > 0 && !product.colors.some((c) => c.name === item.color)) {
    return { error: unavailable(item.color) };
  }
  if (product.variants.length > 0 && !product.variants.includes(item.variant)) return { error: unavailable(item.variant) };

  return { product };
}

// Ganzer Warenkorb: Ergebnis { products, subtotal } oder { error: { status, message, index } }.
// "index" zeigt dem Warenkorb, welche Position betroffen ist.
export function checkCart(items, catalog) {
  if (catalog.length === 0) {
    return { error: { status: 503, message: "Der Shop wird gerade gewartet. Bitte versuche es später erneut." } };
  }
  if (!Array.isArray(items) || items.length === 0) {
    return { error: { status: 400, message: "Ungültiger Warenkorb." } };
  }

  const products = [];
  for (const [index, item] of items.entries()) {
    const result = validateItem(item || {}, catalog);
    if (result.error) return { error: { status: 400, message: result.error, index } };
    products.push(result.product);
  }

  // Bestand prüfen: gleiche Produkte bzw. Größen/Farben/Varianten über alle Positionen zusammenzählen
  const requested = new Map();
  items.forEach((item, index) => {
    const product = products[index];
    const option = stockOptionFor(product.stock, item);
    const key = `${product.id}|${option || ""}`;
    const entry = requested.get(key) || { product, item, option, index, quantity: 0 };
    entry.quantity += item.quantity;
    requested.set(key, entry);
  });
  for (const { product, item, option, index, quantity } of requested.values()) {
    const available = availableFor(product, item);
    if (quantity > available) {
      const label = itemLabel(product.title, option);
      const message =
        available > 0
          ? `Von ${label} ${available === 1 ? "ist" : "sind"} nur noch ${available} Stück verfügbar. Bitte passe die Menge an.`
          : `${label} ist leider ausverkauft. Bitte entferne es aus dem Warenkorb.`;
      return { error: { status: 409, message, index } };
    }
  }

  const subtotal = items.reduce((sum, item, index) => sum + unitAmountFor(products[index], item) * item.quantity, 0);
  if (subtotal < MIN_ORDER_AMOUNT) {
    return {
      error: { status: 400, message: "Der Mindestbestellwert beträgt 2,50 €. Bitte lege noch etwas in den Warenkorb." },
    };
  }
  return { products, subtotal };
}
