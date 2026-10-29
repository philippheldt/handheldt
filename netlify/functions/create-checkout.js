// netlify/functions/create-checkout.js
import Stripe from "stripe";
import { loadCatalog } from "../lib/catalog.js";

// Initialisiere Stripe mit dem Key aus den Umgebungsvariablen
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const headers = { "Content-Type": "application/json" };

function errorResponse(statusCode, message) {
  return { statusCode, headers, body: JSON.stringify({ error: message }) };
}

// Prüft eine Warenkorb-Position gegen den Katalog und gibt das Produkt zurück (oder null)
function validateItem(item, catalog) {
  const product = catalog.find((p) => p.id === item.productId);
  if (!product) return null;
  if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) return null;

  // Auswahl muss zu den Optionen des Produkts passen (falls es welche gibt)
  if (product.sizes.length > 0 && !product.sizes.includes(item.size)) return null;
  if (product.colors.length > 0 && !product.colors.some((c) => c.name === item.color)) return null;
  if (product.variants.length > 0 && !product.variants.includes(item.variant)) return null;

  return product;
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

    const products = items.map((item) => validateItem(item, catalog));
    if (products.includes(null)) {
      return errorResponse(400, "Ungültiger Warenkorb.");
    }

    // Preis kommt immer aus Stripe, Größe/Farbe/Variante stehen am Artikel,
    // damit sie an der Kasse, auf dem Beleg und im Dashboard sichtbar sind
    const line_items = items.map((item, index) => {
      const product = products[index];
      const options = [
        item.size && `Größe ${item.size}`,
        item.color && `Farbe ${item.color}`,
        item.variant && item.variant,
      ].filter(Boolean);

      return {
        quantity: item.quantity,
        price_data: {
          currency: "eur",
          unit_amount: product.unitAmount,
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

    // Versandkosten laut AGB § 3: 4,90 € unter 50 € Warenwert, darüber kostenlos
    const subtotal = items.reduce((sum, item, index) => sum + products[index].unitAmount * item.quantity, 0);
    const shippingAmount = subtotal >= 5000 ? 0 : 490;

    // Lieferzeit laut AGB § 5: vorrätig 5 Werktage, sonst 14 Tage
    const allInStock = products.every((product) => product.inStock);
    const deliveryEstimate = allInStock
      ? { minimum: { unit: "business_day", value: 1 }, maximum: { unit: "business_day", value: 5 } }
      : { minimum: { unit: "day", value: 1 }, maximum: { unit: "day", value: 14 } };

    const shipping_options = [
      {
        shipping_rate_data: {
          display_name: "DHL Versand",
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
      line_items: line_items,
      mode: "payment",
      locale: "de",
      // Lieferadresse wird für den Versand benötigt
      shipping_address_collection: {
        allowed_countries: ["DE"],
      },
      shipping_options: shipping_options,
      custom_text: {
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
