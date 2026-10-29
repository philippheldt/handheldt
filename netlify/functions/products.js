// netlify/functions/products.js
import Stripe from "stripe";
import { loadCatalog } from "../lib/catalog.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const handler = async () => {
  try {
    const catalog = await loadCatalog(stripe);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        // Browser: 1 Minute, Netlify-CDN: 5 Minuten (danach im Hintergrund aktualisieren)
        "Cache-Control": "public, max-age=60",
        "Netlify-CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
      body: JSON.stringify(catalog),
    };
  } catch (error) {
    console.error("Stripe Fehler:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Produkte konnten nicht geladen werden." }),
    };
  }
};
