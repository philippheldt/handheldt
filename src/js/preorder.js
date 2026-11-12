// js/preorder.js – Texte für Vorbestellungen (Produktseite)
// Metadatum "vorbestellung" mit zwei Daten: vorbestellbar bis zum 1. Datum, Versand am 2. Datum.
// Die Texte zählen in Worten herunter: „Noch 12 Tage vorbestellbar“, „Noch eine Woche“, „bis morgen“, „heute“.

(function () {
  // Heutiges Datum in Deutschland als "2026-12-15"
  function today() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date());
  }

  // Ganze Tage von heute bis zum Datum (0 = heute, 1 = morgen, negativ = vorbei)
  function daysUntil(isoDate) {
    const [y1, m1, d1] = today().split("-").map(Number);
    const [y2, m2, d2] = isoDate.split("-").map(Number);
    return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
  }

  // "2026-12-15" -> "15. Dezember" (im laufenden Jahr) bzw. "15. Dezember 2027"
  function formatLong(isoDate) {
    const date = new Date(`${isoDate}T12:00:00`);
    const sameYear = isoDate.slice(0, 4) === today().slice(0, 4);
    return date.toLocaleDateString("de-DE", {
      day: "numeric",
      month: "long",
      ...(sameYear ? {} : { year: "numeric" }),
    });
  }

  // Wie lange noch vorbestellt werden kann (null = Bestellschluss vorbei)
  function deadlineText(until) {
    const days = daysUntil(until);
    if (days < 0) return null;
    if (days === 0) return "Nur noch heute vorbestellbar";
    if (days === 1) return "Nur noch bis morgen vorbestellbar";
    if (days === 7) return "Noch eine Woche vorbestellbar";
    if (days === 14) return "Noch zwei Wochen vorbestellbar";
    if (days < 14) return `Noch ${days} Tage vorbestellbar`;
    return `Vorbestellbar bis ${formatLong(until)}`;
  }

  // Ganzer Hinweis für die Produktseite
  function productText(product) {
    const ship = product.preorderExact
      ? `wir versenden am ${formatLong(product.preorderDate)}`
      : `Versand ab ${formatLong(product.preorderDate)}`;
    if (!product.preorderUntil) return `Vorbestellung – ${ship}`;
    const deadline = deadlineText(product.preorderUntil);
    return deadline ? `${deadline} – ${ship}` : "Vorbestellung beendet";
  }

  window.handheldtPreorder = { daysUntil, formatLong, deadlineText, productText };
})();
