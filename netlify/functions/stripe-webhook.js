// netlify/functions/stripe-webhook.js
// Zieht nach einer bezahlten Bestellung die gekauften Stück vom Bestand (Metadatum "bestand") ab.
// Einrichtung in Stripe: Entwickler → Webhooks, Endpunkt .../.netlify/functions/stripe-webhook,
// Ereignisse checkout.session.completed und checkout.session.async_payment_succeeded.
// Das Signing Secret (whsec_…) gehört in Netlify als STRIPE_WEBHOOK_SECRET.
import Stripe from "stripe";
import { formatStock, parseStock, stockOptionFor } from "../lib/catalog.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function reduceStock(session) {
  // Jede Bestellung nur einmal abziehen, auch wenn Stripe das Ereignis erneut schickt
  const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
  if (paymentIntent.metadata.bestand_abgezogen === "ja") return;

  const lineItems = await stripe.checkout.sessions
    .listLineItems(session.id, { limit: 100, expand: ["data.price.product"] })
    .autoPagingToArray({ limit: 100 });

  // Gekaufte Stück je Shop-Produkt mit der gewählten Größe/Farbe/Variante sammeln
  const sold = new Map();
  for (const lineItem of lineItems) {
    const meta = lineItem.price.product.metadata || {};
    if (!meta.product_id) continue;
    const entries = sold.get(meta.product_id) || [];
    entries.push({
      choice: { size: meta.groesse, color: meta.farbe, variant: meta.variante },
      quantity: lineItem.quantity,
    });
    sold.set(meta.product_id, entries);
  }

  for (const [productId, entries] of sold) {
    const product = await stripe.products.retrieve(productId);
    const stock = parseStock(product.metadata.bestand);
    if (!stock) continue; // kein Bestand eingetragen = unbegrenzt

    for (const { choice, quantity } of entries) {
      if (stock.total !== null) {
        stock.total = Math.max(0, stock.total - quantity);
        continue;
      }
      // Bestand je Größe, Farbe oder Variante; nicht genannte Optionen sind unbegrenzt
      const option = stockOptionFor(stock, choice);
      if (option) stock.byOption[option] = Math.max(0, stock.byOption[option] - quantity);
    }
    await stripe.products.update(productId, { metadata: { bestand: formatStock(stock) } });
  }

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
