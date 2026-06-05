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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: line_items,
      mode: "payment",
      success_url: `${process.env.URL || "https://bright-taffy-986c8a.netlify.app"}/success.html`,
      cancel_url: `${process.env.URL || "https://bright-taffy-986c8a.netlify.app"}/cancel.html`,
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
