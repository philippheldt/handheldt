// netlify/functions/stripe-webhook.js
// Zieht nach einer bezahlten Bestellung die gekauften Stück vom Bestand (Metadatum "bestand") ab.
// Einrichtung in Stripe: Entwickler → Webhooks, Endpunkt .../.netlify/functions/stripe-webhook,
// Ereignisse checkout.session.completed und checkout.session.async_payment_succeeded.
// Das Signing Secret (whsec_…) gehört in Netlify als STRIPE_WEBHOOK_SECRET.
import Stripe from "stripe";
import { changeStock } from "../lib/catalog.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function reduceStock(session) {
  // Jede Bestellung nur einmal abziehen, auch wenn Stripe das Ereignis erneut schickt
  const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
  if (paymentIntent.metadata.bestand_abgezogen === "ja") return;

  const lineItems = await stripe.checkout.sessions
    .listLineItems(session.id, { limit: 100, expand: ["data.price.product"] })
    .autoPagingToArray({ limit: 100 });

  // Gekaufte Stück je Shop-Produkt mit der gewählten Größe/Farbe/Variante
  const entries = lineItems
    .map((lineItem) => ({ meta: lineItem.price.product.metadata || {}, quantity: lineItem.quantity }))
    .filter(({ meta }) => meta.product_id)
    .map(({ meta, quantity }) => ({
      productId: meta.product_id,
      choice: { size: meta.groesse, color: meta.farbe, variant: meta.variante },
      quantity,
    }));
  await changeStock(stripe, entries, -1);

  await stripe.paymentIntents.update(paymentIntent.id, { metadata: { bestand_abgezogen: "ja" } });
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Methode nicht erlaubt." };
  }

  // Signatur prüfen: nur echte Ereignisse von Stripe werden verarbeitet
  let stripeEvent;
  try {
    const body = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
    stripeEvent = stripe.webhooks.constructEvent(
      body,
      event.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("Webhook-Signatur ungültig:", error.message);
    return { statusCode: 400, body: "Ungültige Signatur." };
  }

  try {
    const session = stripeEvent.data.object;
    const paid =
      (stripeEvent.type === "checkout.session.completed" && session.payment_status === "paid") ||
      stripeEvent.type === "checkout.session.async_payment_succeeded";

    if (paid && session.payment_intent) await reduceStock(session);
    return { statusCode: 200, body: "ok" };
  } catch (error) {
    // 500 -> Stripe versucht es später erneut
    console.error("Bestand konnte nicht aktualisiert werden:", error);
    return { statusCode: 500, body: "Fehler beim Aktualisieren des Bestands." };
  }
};
