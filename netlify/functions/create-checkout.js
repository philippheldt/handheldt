// netlify/functions/create-checkout.js
import Stripe from "stripe";

// Initialisiere Stripe mit dem Key aus den Umgebungsvariablen
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const handler = async (event, context) => {
  // CORS-Header, damit dein Frontend ohne Blockaden mit der Funktion sprechen darf
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Preflight-Anfragen von Browsern abfangen
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Methode nicht erlaubt." };
  }

  try {
    const { items } = JSON.parse(event.body);
    const siteUrl = process.env.URL || "https://bright-taffy-986c8a.netlify.app";

    // Nur Produkte zulassen, die aktuell im Shop (products.json) angeboten werden
    const productsResponse = await fetch(`${siteUrl}/products.json`);
    const products = await productsResponse.json();
    const availableIds = products.map((p) => p.id);

    if (products.length === 0) {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({ error: "Der Shop wird gerade gewartet. Bitte versuche es später erneut." }),
      };
    }

    const validItems =
      Array.isArray(items) &&
      items.length > 0 &&
      items.every(
        (item) =>
          availableIds.includes(item.priceId) &&
          Number.isInteger(item.quantity) &&
          item.quantity >= 1 &&
          item.quantity <= 99,
      );

    if (!validItems) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Ungültiger Warenkorb." }),
      };
    }

    // Menge ist im Checkout fest, damit die Versandkosten zum Warenwert passen
    const line_items = items.map((item) => ({
      price: item.priceId,
      quantity: item.quantity,
    }));

    // Versandkosten laut AGB § 3: 4,90 € unter 50 € Warenwert, darüber kostenlos
    const subtotal = items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.priceId);
      return sum + product.price * item.quantity;
    }, 0);
    const shippingAmount = subtotal >= 50 ? 0 : 490;

    // Lieferzeit laut AGB § 5: vorrätig 5 Werktage, sonst 14 Tage
    const allInStock = items.every(
      (item) => products.find((p) => p.id === item.priceId).stock === "Auf Lager",
    );
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
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
