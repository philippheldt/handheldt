// netlify/functions/create-checkout.js
import Stripe from "stripe";
import { loadCatalog } from "../lib/catalog.js";
import { checkCart, formatDate, optionTexts, unitAmountFor } from "../lib/order.js";

// Initialisiere Stripe mit dem Key aus den Umgebungsvariablen
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const headers = { "Content-Type": "application/json" };

// Freiwilliges Aufrunden auf den nächsten vollen 5-€-Betrag (in Cent), Differenz = Spende (siehe js/cart.js)
const ROUNDUP_STEP = 500;

// "index" zeigt dem Warenkorb, welche Position betroffen ist
function errorResponse(statusCode, message, index) {
  return { statusCode, headers, body: JSON.stringify({ error: message, ...(index !== undefined && { index }) }) };
}

export const handler = async (event) => {
  // Die Funktion wird nur von der eigenen Website aufgerufen, daher kein CORS
  if (event.httpMethod !== "POST") {
    return errorResponse(405, "Methode nicht erlaubt.");
  }

  try {
    const { items, aufrunden } = JSON.parse(event.body);
    const siteUrl = process.env.URL || "https://bright-taffy-986c8a.netlify.app";

    // Nur Produkte zulassen, die aktuell in Stripe aktiv sind
    const catalog = await loadCatalog(stripe);

    const checked = checkCart(items, catalog);
    if (checked.error) return errorResponse(checked.error.status, checked.error.message, checked.error.index);
    const { products, subtotal } = checked;

    // Preis kommt immer aus Stripe, Größe/Farbe/Variante stehen am Artikel,
    // damit sie an der Kasse, auf dem Beleg und im Dashboard sichtbar sind
    const line_items = items.map((item, index) => {
      const product = products[index];
      const options = optionTexts(product, item);
      return {
        quantity: item.quantity,
        price_data: {
          currency: "eur",
          unit_amount: unitAmountFor(product, item),
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
    const onlyFreeShipping = products.every((product) => product.freeShipping);
    const shippingAmount = onlyFreeShipping || subtotal >= 5000 ? 0 : 490;

    // Aufrunden: Warenwert + Versand (wie im Warenkorb angezeigt) auf den nächsten 5er, Differenz als Spende.
    // Zählt nicht zum Warenwert (kein Einfluss auf kostenlosen Versand oder Mindestbestellwert).
    const roundTotal = subtotal + shippingAmount;
    const donation = aufrunden === true ? Math.ceil(roundTotal / ROUNDUP_STEP) * ROUNDUP_STEP - roundTotal : 0;
    if (donation > 0) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: donation,
          product_data: {
            name: "Aufrundung: Spende für Kinder in Nepal",
            description: "Geht vollständig an die Sozial-Missionarische Arbeit des EC Deutschlands in Nepal.",
            metadata: { spende: "ja" },
          },
        },
      });
    }

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
      // Feld "Gutscheincode hinzufügen" an der Kasse. Codes werden in Stripe unter
      // Produktkatalog → Gutscheine angelegt (siehe SHOP-ANLEITUNG.md)
      allow_promotion_codes: true,
      // Lieferadresse wird für den Versand benötigt
      shipping_address_collection: {
        allowed_countries: ["DE"],
      },
      shipping_options: shipping_options,
      metadata: {
        ...(preorderDate && { vorbestellung: preorderDate }),
        ...(donation > 0 && { spende_cent: String(donation) }),
      },
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
