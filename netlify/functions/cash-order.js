// netlify/functions/cash-order.js
// „Abholen und bar bezahlen“ (Link unter „Weiter zur Kasse“ im Warenkorb).
// Legt in Stripe eine offene Rechnung an (Zahlung außerhalb von Stripe), zieht den Bestand sofort ab
// (Reservierung) und schickt dem Kunden die Rechnung als Bestellbestätigung per E-Mail.
// In der Bestellübersicht wird sie mit „Bar bezahlt“ abgeschlossen oder mit „Stornieren“ zurückgenommen.
// Benachrichtigung an handheldt über das Netlify-Formular „barzahlung“ (abholung-danke.html).
import Stripe from "stripe";
import { changeStock, loadCatalog } from "../lib/catalog.js";
import { checkCart, formatDate, optionTexts, unitAmountFor } from "../lib/order.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const headers = { "Content-Type": "application/json" };

// Wie lange die Rechnung offen ist (danach in der Bestellübersicht als überfällig sichtbar)
const DAYS_TO_PICK_UP = 14;

function errorResponse(statusCode, message, index) {
  return { statusCode, headers, body: JSON.stringify({ error: message, ...(index !== undefined && { index }) }) };
}

const clean = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const euro = (cents) => `${(cents / 100).toFixed(2).replace(".", ",")} €`;

// Benachrichtigung per Netlify Forms (E-Mail-Benachrichtigung in Netlify unter Forms einstellen)
async function notify(siteUrl, fields) {
  try {
    await fetch(`${siteUrl}/abholung-danke.html`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ "form-name": "barzahlung", ...fields }).toString(),
    });
  } catch (error) {
    // Bestellung steht trotzdem in Stripe und in der Bestellübersicht
    console.error("Benachrichtigung fehlgeschlagen:", error);
  }
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return errorResponse(405, "Methode nicht erlaubt.");

  let invoice = null;
  try {
    const body = JSON.parse(event.body || "{}");
    // Unsichtbares Feld: nur Bots füllen es aus
    if (body.website) return errorResponse(400, "Bestellung konnte nicht angenommen werden.");

    const name = clean(body.name, 80);
    const email = clean(body.email, 120);
    const phone = clean(body.telefon, 40);
    if (name.length < 2) return errorResponse(400, "Bitte gib deinen Namen an.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return errorResponse(400, "Bitte gib eine gültige E-Mail-Adresse an.");

    const items = body.items;
    const catalog = await loadCatalog(stripe);
    const checked = checkCart(items, catalog);
    if (checked.error) return errorResponse(checked.error.status, checked.error.message, checked.error.index);
    const { products, subtotal } = checked;

    const preorderDate = products
      .map((product) => product.preorderDate)
      .filter(Boolean)
      .sort()
      .pop();

    const customer = await stripe.customers.create({
      name,
      email,
      ...(phone && { phone }),
      preferred_locales: ["de"],
      metadata: { quelle: "Shop – Barzahlung bei Abholung" },
    });

    invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: "send_invoice",
      days_until_due: DAYS_TO_PICK_UP,
      auto_advance: false,
      pending_invoice_items_behavior: "exclude",
      description: preorderDate
        ? `Barzahlung bei Abholung in Teningen. Enthält Vorbestellungen – abholbereit ab ${formatDate(preorderDate)}. Wir melden uns wegen eines Termins.`
        : "Barzahlung bei Abholung in Teningen. Wir melden uns per E-Mail wegen eines Abholtermins.",
      footer: "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet. Es gelten die AGB von handheldt (handheldt.de/agb.html).",
      metadata: {
        barzahlung: "ja",
        abholung: "ja",
        ...(preorderDate && { vorbestellung: preorderDate }),
      },
    });

    for (const [index, item] of items.entries()) {
      const product = products[index];
      const options = optionTexts(product, item);
      await stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        quantity: item.quantity,
        price_data: { currency: "eur", product: product.id, unit_amount: unitAmountFor(product, item) },
        description: [product.title, ...options].join(" · "),
        metadata: {
          product_id: product.id,
          groesse: item.size || "",
          farbe: item.color || "",
          variante: item.variant || "",
        },
      });
    }

    invoice = await stripe.invoices.finalizeInvoice(invoice.id, { auto_advance: false });

    // Ab hier steht die Bestellung. Fehler danach nur protokollieren, damit niemand doppelt bestellt.
    // Ware reservieren: Bestand sofort abziehen (bei „Stornieren“ wird er zurückgebucht)
    try {
      await changeStock(
        stripe,
        items.map((item) => ({
          productId: item.productId,
          choice: { size: item.size, color: item.color, variant: item.variant },
          quantity: item.quantity,
        })),
        -1,
      );
      await stripe.invoices.update(invoice.id, { metadata: { bestand_abgezogen: "ja" } });
    } catch (error) {
      console.error("Bestand konnte nicht abgezogen werden:", error);
    }

    // Bestellbestätigung mit Rechnung (PDF) an den Kunden
    try {
      await stripe.invoices.sendInvoice(invoice.id);
    } catch (error) {
      console.error("Rechnung konnte nicht verschickt werden:", error);
    }

    const siteUrl = process.env.URL || "https://handheldt.de";
    await notify(siteUrl, {
      nummer: invoice.number || invoice.id,
      name,
      email,
      telefon: phone,
      summe: euro(subtotal),
      positionen: items
        .map((item, index) => `${item.quantity}× ${[products[index].title, ...optionTexts(products[index], item)].join(" · ")}`)
        .join("\n"),
      vorbestellung: preorderDate ? formatDate(preorderDate) : "",
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ nummer: invoice.number || "", summe: subtotal }),
    };
  } catch (error) {
    console.error("Barzahlung:", error);
    // Halb angelegte Rechnung wieder entfernen, damit nichts Falsches in Stripe stehen bleibt
    if (invoice && invoice.status === "draft") {
      await stripe.invoices.del(invoice.id).catch(() => {});
    }
    return errorResponse(500, "Die Bestellung konnte gerade nicht angelegt werden. Bitte versuche es erneut.");
  }
};
