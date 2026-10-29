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

    const line_items = items.map((item) => {
      return {
        price: item.priceId,
        quantity: item.quantity,
        adjustable_quantity: {
          enabled: true,
          minimum: 0,
          maximum: 99,
        },
      };
    });

    // Zahlarten werden im Stripe-Dashboard gesteuert (kein fest verdrahtetes "card")
    const session = await stripe.checkout.sessions.create({
      line_items: line_items,
      mode: "payment",
      locale: "de",
      // Lieferadresse wird für den Versand benötigt
      shipping_address_collection: {
        allowed_countries: ["DE"],
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
