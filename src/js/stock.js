// js/stock.js – Bestand im Browser (Produktseite und Warenkorb)
// Gleiche Regeln wie netlify/lib/catalog.js (dort für Kasse und Webhook) – Änderungen bitte in beiden Dateien.
//
// Metadatum "bestand" (siehe SHOP-ANLEITUNG.md):
//   "20"                       insgesamt
//   "S:5, M:0"                 je Größe, Farbe oder Variante
//   "Gelb/M:2, Blau/L:0"       je Kombination (Reihenfolge egal, z. B. auch "M/Gelb")
// Nicht genannte Optionen bzw. Kombinationen sind unbegrenzt.

(function () {
  // "Gelb / M" und "gelb/m" gelten als gleich
  const normalize = (key) => String(key).replace(/\s*\/\s*/g, "/").trim().toLowerCase();

  // Alle Reihenfolgen aller Teilmengen der gewählten Werte, die längsten zuerst
  function candidates(values) {
    const result = [];
    const permute = (rest, picked) => {
      if (picked.length > 0) result.push(picked);
      rest.forEach((value, index) => permute([...rest.slice(0, index), ...rest.slice(index + 1)], [...picked, value]));
    };
    permute(values, []);
    return result.sort((a, b) => b.length - a.length).map((parts) => parts.join("/"));
  }

  // Welcher Eintrag aus "bestand" gilt für die Auswahl { size, color, variant }? (null = keiner)
  function keyFor(stock, choice) {
    if (!stock || stock.total !== null) return null;
    const byNormalized = new Map(Object.keys(stock.byOption).map((key) => [normalize(key), key]));
    const values = [choice.size, choice.color, choice.variant].filter(Boolean);
    for (const candidate of candidates(values)) {
      const key = byNormalized.get(normalize(candidate));
      if (key !== undefined) return key;
    }
    return null;
  }

  // Verfügbare Stück für eine Auswahl (Infinity = unbegrenzt)
  function available(product, choice) {
    const stock = product.stock;
    if (!stock) return Infinity;
    if (stock.total !== null) return stock.total;
    const key = keyFor(stock, choice);
    return key === null ? Infinity : stock.byOption[key];
  }

  // Alle möglichen Auswahlen des Produkts (Größe × Farbe × Variante)
  function combinations(product) {
    const sizes = product.sizes.length > 0 ? product.sizes : [null];
    const colors = product.colors.length > 0 ? product.colors.map((color) => color.name) : [null];
    const variants = product.variants.length > 0 ? product.variants : [null];
    return sizes.flatMap((size) => colors.flatMap((color) => variants.map((variant) => ({ size, color, variant }))));
  }

  // Erste lieferbare Auswahl, optional mit festen Werten (z. B. { color: "Gelb" })
  function firstAvailable(product, fixed = {}) {
    return (
      combinations(product)
        .map((choice) => ({ ...choice, ...fixed }))
        .find((choice) => available(product, choice) > 0) || null
    );
  }

  window.handheldtStock = { keyFor, available, combinations, firstAvailable };
})();
