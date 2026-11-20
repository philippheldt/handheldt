// netlify/functions/orders.js
// Interne Bestellübersicht (handheldt.de/bestellungen.html).
// GET  -> alle bezahlten Shop-Bestellungen und separat abgerechneten Rechnungen aus Stripe
// POST -> Bestellung als verschickt / nicht verschickt markieren, interne Notiz speichern
// Zugriff nur mit dem Passwort aus der Netlify-Variable BESTELLUNGEN_PASSWORT (Header x-passwort).
// Der Versandstatus steht in Stripe: bei Shop-Bestellungen am Zahlungsvorgang (PaymentIntent),
// bei Rechnungen an der Rechnung, jeweils in den Metadaten "versendet" und "notiz".
import { createHash, timingSafeEqual } from "node:crypto";
import Stripe from "stripe";
import { loadEur } from "../lib/eur.js";
import { buildEurWorkbook } from "../lib/eur-xlsx.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const MAX_ORDERS = 500;
const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(body),
});

function authorized(event) {
  const expected = process.env.BESTELLUNGEN_PASSWORT;
  if (!expected) return null;
  const given = event.headers["x-passwort"] || "";
  // Hash vergleichen, damit unterschiedliche Längen nichts verraten
  const hash = (value) => createHash("sha256").update(value).digest();
  return timingSafeEqual(hash(given), hash(expected));
}

function addressOf(details) {
  if (!details?.address) return null;
  const a = details.address;
  return {
    name: details.name || "",
    zeile1: a.line1 || "",
    zeile2: a.line2 || "",
    plz: a.postal_code || "",
    ort: a.city || "",
    land: a.country || "",
  };
}

// Datum als "2026-11-25" in deutscher Zeit
const isoDay = (date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(date);

// Zusage aus der Kasse (z. B. 1–5 Werktage, 1–14 Tage) ab Bestelldatum weiterzählen
function addEstimate(createdSec, { unit, value }) {
  const date = new Date(createdSec * 1000);
  if (unit === "business_day") {
    let left = value;
    while (left > 0) {
      date.setUTCDate(date.getUTCDate() + 1);
      const day = date.getUTCDay();
      if (day !== 0 && day !== 6) left -= 1;
    }
  } else if (unit === "week") date.setUTCDate(date.getUTCDate() + 7 * value);
  else if (unit === "month") date.setUTCMonth(date.getUTCMonth() + value);
  else if (unit === "hour") date.setUTCHours(date.getUTCHours() + value);
  else date.setUTCDate(date.getUTCDate() + value);
  return isoDay(date);
}

// Bis wann die Bestellung raus sein muss:
// Vorbestellung -> Versanddatum der Vorbestellung, sonst -> späteste Lieferzusage an der Kasse.
// Abholung hat keine Frist.
function deadlineFor(session, rate, abholung) {
  if (abholung) return "";
  if (session.metadata?.vorbestellung) return session.metadata.vorbestellung;
  const max = rate?.delivery_estimate?.maximum;
  return addEstimate(session.created, max || { unit: "business_day", value: 5 });
}

async function loadSessionOrders() {
  const sessions = await stripe.checkout.sessions
    .list({ status: "complete", limit: 100, expand: ["data.payment_intent.latest_charge", "data.shipping_cost.shipping_rate"] })
    .autoPagingToArray({ limit: MAX_ORDERS });

  // Nur Bestellungen, die bezahlt sind oder deren Zahlung noch läuft (z. B. Lastschrift).
  // Storniert, fehlgeschlagen oder komplett erstattet: nicht anzeigen.
  const relevant = sessions
    .map((session) => {
      const pi = typeof session.payment_intent === "object" ? session.payment_intent : null;
      const charge = pi && typeof pi.latest_charge === "object" ? pi.latest_charge : null;
      const paid = ["paid", "no_payment_required"].includes(session.payment_status);
      const pending = pi?.status === "processing";
      if (pi && ["canceled", "requires_payment_method"].includes(pi.status)) return null;
      if (!paid && !pending) return null;
      if (charge?.refunded) return null;
      return { session, pi, paid, erstattet: charge?.amount_refunded || 0 };
    })
    .filter(Boolean);

  const orders = [];
  // Positionen in kleinen Gruppen laden, damit Stripe nicht drosselt
  for (let i = 0; i < relevant.length; i += 8) {
    const batch = relevant.slice(i, i + 8);
    const results = await Promise.all(
      batch.map(async ({ session, pi, paid, erstattet }) => {
        const lineItems = await stripe.checkout.sessions
          .listLineItems(session.id, { limit: 100, expand: ["data.price.product"] })
          .autoPagingToArray({ limit: 100 });

        const positionen = [];
        let spende = 0;
        for (const item of lineItems) {
          const product = item.price?.product || {};
          const meta = product.metadata || {};
          if (meta.spende === "ja") {
            spende += item.amount_total;
            continue;
          }
          positionen.push({
            produktId: meta.product_id || null,
            name: product.name || item.description,
            groesse: meta.groesse || "",
            farbe: meta.farbe || "",
            variante: meta.variante || "",
            menge: item.quantity,
            betrag: item.amount_total,
          });
        }

        const shipping = session.collected_information?.shipping_details || session.shipping_details;
        const rate = typeof session.shipping_cost?.shipping_rate === "object" ? session.shipping_cost.shipping_rate : null;
        const abholung = /abholung/i.test(rate?.display_name || "");
        return {
          art: "shop",
          id: session.id,
          nummer: pi ? pi.id.slice(-8).toUpperCase() : session.id.slice(-8).toUpperCase(),
          datum: session.created,
          bezahlt: paid,
          kunde: session.customer_details?.name || shipping?.name || "",
          email: session.customer_details?.email || "",
          telefon: session.customer_details?.phone || "",
          adresse: addressOf(shipping) || addressOf(session.customer_details),
          vorbestellung: session.metadata?.vorbestellung || "",
          versandkosten: session.shipping_cost?.amount_total ?? session.total_details?.amount_shipping ?? 0,
          // Gewählte Versandart an der Kasse, z. B. "DHL Versand" oder "Abholung in Teningen (nach Absprache)"
          versandart: rate?.display_name || "",
          abholung,
          frist: deadlineFor(session, rate, abholung),
          spende,
          summe: session.amount_total,
          erstattet,
          positionen,
          versendet: pi?.metadata?.versendet || "",
          notiz: pi?.metadata?.notiz || "",
          stripeUrl: pi
            ? `https://dashboard.stripe.com/payments/${pi.id}`
            : `https://dashboard.stripe.com/checkout/sessions/${session.id}`,
        };
      }),
    );
    orders.push(...results.filter(Boolean));
  }
  return orders;
}

async function loadInvoiceOrders() {
  // Separat abgerechnete Bestellungen (z. B. Büchertisch), nicht Abos
  const invoices = await stripe.invoices
    .list({ limit: 100, expand: ["data.customer"] })
    .autoPagingToArray({ limit: MAX_ORDERS });

  return invoices
    // Offen oder bezahlt; per Gutschrift komplett zurückgenommene Rechnungen ausblenden
    .filter((inv) => ["open", "paid"].includes(inv.status) && inv.billing_reason === "manual")
    .filter((inv) => (inv.post_payment_credit_notes_amount || 0) + (inv.pre_payment_credit_notes_amount || 0) < inv.total)
    .map((inv) => {
      const customer = typeof inv.customer === "object" ? inv.customer : null;
      const shipping = inv.customer_shipping || customer?.shipping;
      return {
        art: "rechnung",
        id: inv.id,
        nummer: inv.number || inv.id.slice(-8).toUpperCase(),
        datum: inv.status_transitions?.finalized_at || inv.created,
        bezahlt: inv.status === "paid",
        kunde: inv.customer_name || customer?.name || "",
        email: inv.customer_email || "",
        telefon: inv.customer_phone || "",
        ansprechpartner: shipping?.name && shipping.name !== inv.customer_name ? shipping.name : "",
        adresse: addressOf(shipping) || addressOf({ name: inv.customer_name, address: inv.customer_address }),
        vorbestellung: "",
        versandkosten: 0,
        versandart: "",
        abholung: false,
        frist: "",
        spende: 0,
        summe: inv.total,
        erstattet: inv.post_payment_credit_notes_amount || 0,
        positionen: inv.lines.data.map((line) => ({
          produktId: null,
          name: line.description || "Position",
          groesse: "",
          farbe: "",
          variante: "",
          menge: line.quantity || 1,
          betrag: line.amount,
        })),
        versendet: inv.metadata?.versendet || "",
        notiz: inv.metadata?.notiz || "",
        stripeUrl: `https://dashboard.stripe.com/invoices/${inv.id}`,
      };
    });
}

async function updateOrder({ art, id, versendet, notiz }) {
  const metadata = {};
  if (versendet !== undefined) metadata.versendet = versendet ? new Date().toISOString().slice(0, 10) : "";
  if (notiz !== undefined) metadata.notiz = String(notiz).slice(0, 480);

  if (art === "rechnung") {
    if (!/^in_[A-Za-z0-9]+$/.test(id)) throw new Error("Ungültige Rechnung.");
    const inv = await stripe.invoices.update(id, { metadata });
    return { versendet: inv.metadata.versendet || "", notiz: inv.metadata.notiz || "" };
  }

  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) throw new Error("Ungültige Bestellung.");
  const session = await stripe.checkout.sessions.retrieve(id);
  if (!session.payment_intent) throw new Error("Zu dieser Bestellung gibt es keinen Zahlungsvorgang.");
  const pi = await stripe.paymentIntents.update(session.payment_intent, { metadata });
  return { versendet: pi.metadata.versendet || "", notiz: pi.metadata.notiz || "" };
}

export const handler = async (event) => {
  const ok = authorized(event);
  if (ok === null) return json(503, { error: "In Netlify ist noch kein BESTELLUNGEN_PASSWORT eingetragen." });
  if (!ok) return json(401, { error: "Falsches Passwort." });

  try {
    if (event.httpMethod === "GET" && event.queryStringParameters?.export === "eur") {
      const year = Number(event.queryStringParameters.jahr);
      if (!Number.isInteger(year) || year < 2020 || year > 2100) return json(400, { error: "Ungültiges Jahr." });
      const buffer = await buildEurWorkbook(await loadEur(stripe, year));
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="handheldt-EUER-${year}.xlsx"`,
          "Cache-Control": "no-store",
        },
        body: Buffer.from(buffer).toString("base64"),
        isBase64Encoded: true,
      };
    }
    if (event.httpMethod === "GET") {
      const [shop, rechnungen] = await Promise.all([loadSessionOrders(), loadInvoiceOrders()]);
      const bestellungen = [...shop, ...rechnungen].sort((a, b) => b.datum - a.datum);
      return json(200, { bestellungen, stand: Math.floor(Date.now() / 1000) });
    }
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      return json(200, await updateOrder(body));
    }
    return json(405, { error: "Methode nicht erlaubt." });
  } catch (error) {
    console.error("Bestellungen:", error);
    return json(500, { error: error.message || "Bestellungen konnten nicht geladen werden." });
  }
};
