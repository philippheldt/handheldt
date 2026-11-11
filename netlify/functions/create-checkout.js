// netlify/functions/create-checkout.js
import Stripe from "stripe";
import { availableFor, loadCatalog, stockOptionFor } from "../lib/catalog.js";

// Initialisiere Stripe mit dem Key aus den Umgebungsvariablen
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const headers = { "Content-Type": "application/json" };

// "2026-12-15" -> "15.12.2026"
function formatDate(isoDate) {
  const [year, month, day] = isoDate.split("-");
  return `${day}.${month}.${year}`;
}

// 200 -> "+2,00 €"
function formatSurcharge(cents) {
  return `+${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

// Aufpreise der gewählten Optionen in Cent (aus den Stripe-Metadaten, nie aus dem Browser)
function surchargeFor(product, item) {
  const { size, color, variant } = product.surcharges;
  return (size[item.size] || 0) + (color[item.color] || 0) + (variant[item.variant] || 0);
}

// "index" zeigt dem Warenkorb, welche Position betroffen ist
function errorResponse(statusCode, message, index) {
  return { statusCode, headers, body: JSON.stringify({ error: message, ...(index !== undefined && { index }) }) };
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

export const handler = async (event) => {
  // Die Funktion wird nur von der eigenen Website aufgerufen, daher kein CORS
  if (event.httpMethod !== "POST") {
    return errorResponse(405, "Methode nicht erlaubt.");
  }

  try {
    const { items } = JSON.parse(event.body);
    const siteUrl = process.env.URL || "https://bright-taffy-986c8a.netlify.app";

    // Nur Produkte zulassen, die aktuell in Stripe aktiv sind
    const catalog = await loadCatalog(stripe);

    if (catalog.length === 0) {
      return errorResponse(503, "Der Shop wird gerade gewartet. Bitte versuche es später erneut.");
    }

    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse(400, "Ungültiger Warenkorb.");
    }

    const products = [];
    for (const [index, item] of items.entries()) {
      const result = validateItem(item || {}, catalog);
      if (result.error) return errorResponse(400, result.error, index);
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
        return errorResponse(
          409,
          available > 0
            ? `Von ${label} ${available === 1 ? "ist" : "sind"} nur noch ${available} Stück verfügbar. Bitte passe die Menge an.`
            : `${label} ist leider ausverkauft. Bitte entferne es aus dem Warenkorb.`,
          index,
        );
      }
    }

    // Preis kommt immer aus Stripe, Größe/Farbe/Variante stehen am Artikel,
    // damit sie an der Kasse, auf dem Beleg und im Dashboard sichtbar sind
    const line_items = items.map((item, index) => {
      const product = products[index];
      const { size, color, variant } = product.surcharges;
      const withSurcharge = (label, amount) => (amount ? `${label} (${formatSurcharge(amount)})` : label);
      const options = [
        item.size && withSurcharge(`Größe ${item.size}`, size[item.size]),
        item.color && withSurcharge(`Farbe ${item.color}`, color[item.color]),
        item.variant && withSurcharge(item.variant, variant[item.variant]),
        product.preorderDate && `Vorbestellung – Versand ab ${formatDate(product.preorderDate)}`,
      ].filter(Boolean);

      return {
        quantity: item.quantity,
        price_data: {
          currency: "eur",
          unit_amount: product.unitAmount + surchargeFor(product, item),
          product_data: {
            name: product.title,
            ...(options.length > 0 && { description: options.join(" · ") }),
            ...(product.images.length > 0 && { images: product.images.slice(0, 1) }),
            metadata: {
              product_id: product.id,
              groesse: item.size || "",
              farbe: item.color || "",
              variante: item.variant || "",
            },
          },
        },
      };
    });

    // Versandkosten laut AGB § 3: 4,90 € unter 50 € Warenwert, darüber kostenlos.
    // Enthält die Bestellung nur versandfreie Produkte (z. B. Postkarten), ist der Versand immer kostenlos.
    const subtotal = items.reduce(
      (sum, item, index) => sum + (products[index].unitAmount + surchargeFor(products[index], item)) * item.quantity,
      0,
    );
    const onlyFreeShipping = products.every((product) => product.freeShipping);
    const shippingAmount = onlyFreeShipping || subtotal >= 5000 ? 0 : 490;

    // Lieferzeit laut AGB § 5: vorrätig 5 Werktage, sonst 14 Tage.
    // Mit Vorbestellungen geht die ganze Bestellung gemeinsam ab dem spätesten Vorbestell-Datum raus.
    const allInStock = products.every((product) => product.inStock);
    const preorderDate = products
      .map((product) => product.preorderDate)
      .filter(Boolean)
      .sort()
      .pop();
    let deliveryEstimate;
    if (preorderDate) {
      const daysUntil = Math.max(1, Math.ceil((Date.parse(preorderDate) - Date.now()) / 86400000));
      deliveryEstimate = {
        minimum: { unit: "day", value: daysUntil },
        maximum: { unit: "day", value: daysUntil + 5 },
      };
    } else {
      deliveryEstimate = allInStock
        ? { minimum: { unit: "business_day", value: 1 }, maximum: { unit: "business_day", value: 5 } }
        : { minimum: { unit: "day", value: 1 }, maximum: { unit: "day", value: 14 } };
    }

    const shipping_options = [
      {
        shipping_rate_data: {
          display_name: onlyFreeShipping ? "Versand per Post" : "DHL Versand",
          type: "fixed_amount",
          fixed_amount: { amount: shippingAmount, currency: "eur" },
          delivery_estimate: deliveryEstimate,
        },
      },
      {
        shipping_rate_data: {
          display_name: "Abholung in Teningen (nach Absprache)",
          type: "fixed_amount",
          fixed_amount: { amount: 0, currency: "eur" },
        },
      },
    ];

    // Zahlarten werden im Stripe-Dashboard gesteuert (kein fest verdrahtetes "card")
    const session = await stripe.checkout.sessions.create({
      // Kasse verfällt nach gut 30 Minuten (Minimum bei Stripe), damit Bestände nicht lange blockiert wirken
      expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
      line_items: line_items,
      mode: "payment",
      locale: "de",
      // Lieferadresse wird für den Versand benötigt
      shipping_address_collection: {
        allowed_countries: ["DE"],
      },
      shipping_options: shipping_options,
      ...(preorderDate && { metadata: { vorbestellung: preorderDate } }),
      custom_text: {
        ...(preorderDate && {
          shipping_address: {
            message: `Deine Bestellung enthält Vorbestellungen und wird gesammelt ab dem ${formatDate(preorderDate)} verschickt.`,
          },
        }),
        submit: {
          message: "Es gelten die AGB von handheldt (handheldt.de/agb.html). Infos zum Widerrufsrecht: handheldt.de/widerruf.html",
        },
      },
      success_url: `${siteUrl}/success.html`,
      cancel_url: `${siteUrl}/cancel.html`,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    console.error("Stripe Fehler:", error);
    return errorResponse(500, "Checkout konnte nicht gestartet werden.");
  }
};
