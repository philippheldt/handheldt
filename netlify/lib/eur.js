// netlify/lib/eur.js
// Einnahmen eines Kalenderjahres für die EÜR, Grundlage sind die Geldbewegungen im Stripe-Guthaben
// (Zahlungen, Erstattungen, Gebühren) plus Rechnungen, die außerhalb von Stripe bezahlt wurden.
// Auszahlungen aufs Bankkonto sind nur Umbuchungen und werden nicht aufgeführt.

const SKIP_TYPES = new Set(["payout", "payout_cancel", "payout_failure", "transfer", "transfer_cancel", "transfer_failure"]);
const CHARGE_TYPES = new Set(["charge", "payment"]);
const REFUND_TYPES = new Set(["refund", "payment_refund"]);

const PAYMENT_LABELS = {
  card: "Karte",
  paypal: "PayPal",
  sepa_debit: "SEPA-Lastschrift",
  klarna: "Klarna",
  sofort: "Sofort",
  giropay: "giropay",
  eps: "eps",
  customer_balance: "Banküberweisung (Stripe)",
  link: "Link",
  amazon_pay: "Amazon Pay",
  revolut_pay: "Revolut Pay",
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
};

const OTHER_LABELS = {
  stripe_fee: "Stripe-Gebühr",
  application_fee: "Gebühr",
  adjustment: "Korrektur",
  dispute: "Zahlungsanfechtung",
  payment_failure_refund: "Rückbuchung",
  payment_reversal: "Rückbuchung",
};

// Jahresgrenzen in deutscher Zeit
const startOfYear = (year) => Math.floor(Date.parse(`${year}-01-01T00:00:00+01:00`) / 1000);
const shortId = (id) => (id ? id.slice(-8).toUpperCase() : "");
// Betrag einer Rechnung, der außerhalb von Stripe bezahlt wurde (bar, Überweisung aufs eigene Konto).
// Seit API-Version 2025-03-31 gibt es paid_out_of_band nicht mehr; neu ist amount_paid_off_stripe
// (ab 2026-05-27), dazwischen bleibt nur der Abgleich mit den Zahlungen über Stripe.
function offStripeAmount(inv) {
  if (typeof inv.amount_paid_off_stripe === "number") return inv.amount_paid_off_stripe;
  if (typeof inv.paid_out_of_band === "boolean") return inv.paid_out_of_band ? (inv.amount_paid ?? inv.total) : 0;
  const viaStripe = (inv.payments?.data || [])
    .filter((p) => p.payment?.type === "payment_intent" && p.status === "paid")
    .reduce((sum, p) => sum + (p.amount_paid || 0), 0);
  return Math.max(0, (inv.amount_paid || 0) - viaStripe);
}

const id = (value) => (typeof value === "object" && value ? value.id : value);

function paymentLabel(charge) {
  const details = charge?.payment_method_details;
  if (!details) return "";
  const wallet = details.card?.wallet?.type;
  return PAYMENT_LABELS[wallet] || PAYMENT_LABELS[details.type] || details.type;
}

async function lineItemsOf(stripe, session) {
  if (session.line_items?.data) return session.line_items.data;
  return stripe.checkout.sessions.listLineItems(session.id, { limit: 100 }).autoPagingToArray({ limit: 100 });
}

export async function loadEur(stripe, year) {
  const from = startOfYear(year);
  const to = startOfYear(year + 1);

  const [transactions, sessions, invoices] = await Promise.all([
    stripe.balanceTransactions
      .list({ created: { gte: from, lt: to }, limit: 100, expand: ["data.source"] })
      .autoPagingToArray({ limit: 10000 }),
    // Alle Bestellungen bis Jahresende, damit auch Erstattungen alter Bestellungen zugeordnet werden
    stripe.checkout.sessions
      .list({ status: "complete", created: { lt: to }, limit: 100 })
      .autoPagingToArray({ limit: 10000 }),
    stripe.invoices
      .list({ status: "paid", limit: 100, expand: ["data.amount_paid_off_stripe", "data.payments"] })
      .autoPagingToArray({ limit: 2000 }),
  ]);

  const sessionByPayment = new Map(sessions.filter((s) => s.payment_intent).map((s) => [id(s.payment_intent), s]));

  const rows = [];
  for (const txn of transactions) {
    if (SKIP_TYPES.has(txn.type)) continue;
    const source = typeof txn.source === "object" ? txn.source : null;

    if (CHARGE_TYPES.has(txn.type)) {
      const paymentId = id(source?.payment_intent);
      const session = sessionByPayment.get(paymentId);
      let versand = 0;
      let spende = 0;
      let positionen = source?.description || "";
      if (session) {
        const items = await lineItemsOf(stripe, session);
        const products = [];
        for (const item of items) {
          if (/spende/i.test(item.description || "")) spende += item.amount_total;
          else products.push(`${item.quantity}× ${item.description}`);
        }
        positionen = products.join("; ");
        versand = session.shipping_cost?.amount_total ?? session.total_details?.amount_shipping ?? 0;
      }
      rows.push({
        datum: txn.created,
        beleg: shortId(paymentId || source?.id),
        art: session ? "Verkauf Shop" : "Zahlung über Stripe",
        kunde: session?.customer_details?.name || source?.billing_details?.name || "",
        positionen,
        warenwert: txn.amount - versand - spende,
        versand,
        spende,
        brutto: txn.amount,
        gebuehr: txn.fee,
        netto: txn.net,
        zahlungsart: paymentLabel(source),
        stripeId: source?.id || txn.id,
      });
      continue;
    }

    if (REFUND_TYPES.has(txn.type)) {
      const paymentId = id(source?.payment_intent);
      const session = sessionByPayment.get(paymentId);
      rows.push({
        datum: txn.created,
        beleg: shortId(paymentId || id(source?.charge)),
        art: "Erstattung",
        kunde: session?.customer_details?.name || "",
        positionen: `Erstattung zu Bestellung Nr. ${shortId(paymentId || id(source?.charge))}`,
        warenwert: 0,
        versand: 0,
        spende: 0,
        brutto: txn.amount,
        gebuehr: txn.fee,
        netto: txn.net,
        zahlungsart: "",
        stripeId: source?.id || txn.id,
      });
      continue;
    }

    // Gebühren und sonstige Buchungen (z. B. Rechnungsgebühren, Anfechtungen)
    const isFee = txn.type === "stripe_fee" || txn.type === "application_fee";
    rows.push({
      datum: txn.created,
      beleg: "",
      art: OTHER_LABELS[txn.type] || txn.type,
      kunde: "",
      positionen: txn.description || "",
      warenwert: 0,
      versand: 0,
      spende: 0,
      brutto: isFee ? 0 : txn.amount,
      gebuehr: isFee ? -txn.amount + txn.fee : txn.fee,
      netto: txn.net,
      zahlungsart: "",
      stripeId: txn.id,
    });
  }

  // Rechnungen, die bar oder per Überweisung aufs eigene Konto bezahlt wurden
  for (const inv of invoices) {
    const paidAt = inv.status_transitions?.paid_at;
    const amount = offStripeAmount(inv);
    if (amount <= 0 || !paidAt || paidAt < from || paidAt >= to) continue;
    rows.push({
      datum: paidAt,
      beleg: inv.number || shortId(inv.id),
      art: "Rechnung (außerhalb Stripe bezahlt)",
      kunde: inv.customer_name || "",
      positionen: inv.lines.data.map((l) => `${l.quantity || 1}× ${l.description}`).join("; "),
      warenwert: amount,
      versand: 0,
      spende: 0,
      brutto: amount,
      gebuehr: 0,
      netto: amount,
      zahlungsart: "bar / Überweisung",
      stripeId: inv.id,
    });
  }

  rows.sort((a, b) => a.datum - b.datum);
  return { jahr: year, zeilen: rows, stand: Math.floor(Date.now() / 1000) };
}
