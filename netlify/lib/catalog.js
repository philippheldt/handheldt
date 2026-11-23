// netlify/lib/catalog.js
// Lädt den Shop-Katalog direkt aus Stripe. Gepflegt wird alles im Stripe-Dashboard:
// Name, Beschreibung, Bilder und Standardpreis am Produkt, Zusatzangaben als Metadaten
// (siehe SHOP-ANLEITUNG.md).

// Kommaliste aus den Metadaten in ein Array umwandeln ("S, M, L" -> ["S", "M", "L"]).
// Dezimalkommas in Aufpreisen ("+2,50") werden vorher zu Punkten, damit sie nicht trennen.
function parseList(value) {
  if (!value) return [];
  return value
    .replace(/(\+\s*\d+),(\d{1,2})/g, "$1.$2")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

// Aufpreis "+2", "+2.50" oder "+2,50 €" -> Cent (sonst null)
function parseSurcharge(part) {
  const match = part.match(/^\+\s*(\d+(?:[.,]\d{1,2})?)\s*€?$/);
  return match ? Math.round(parseFloat(match[1].replace(",", ".")) * 100) : null;
}

// Optionen mit optionalem Aufpreis: "S, M, XXL:+2" -> Namen + Aufpreise in Cent
function parseOptions(value) {
  const names = [];
  const surcharges = {};
  parseList(value).forEach((entry) => {
    const [name, ...rest] = entry.split(":").map((part) => part.trim());
    names.push(name);
    const surcharge = rest.map(parseSurcharge).find((amount) => amount !== null);
    if (surcharge) surcharges[name] = surcharge;
  });
  return { names, surcharges };
}

// Farben im Format "Schwarz:#000000, Weiß:#ffffff:+1,50"
function parseColors(value) {
  const colors = [];
  const surcharges = {};
  parseList(value).forEach((entry) => {
    const [name, ...rest] = entry.split(":").map((part) => part.trim());
    colors.push({ name, hex: rest.find((part) => part.startsWith("#")) || "#cccccc" });
    const surcharge = rest.map(parseSurcharge).find((amount) => amount !== null);
    if (surcharge) surcharges[name] = surcharge;
  });
  return { colors, surcharges };
}

// Datum "2026-12-15" oder "15.12.2026" -> "2026-12-15" (sonst null)
function parseDate(value) {
  if (!value) return null;
  const text = value.trim();
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const german = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!iso && !german) return null;
  const [year, month, day] = iso ? iso.slice(1) : [german[3], german[2], german[1]];
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

// Heutiges Datum in Deutschland als "2026-12-15" (der Server läuft in UTC)
function todayInGermany() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date());
}

// Metadatum "vorbestellung":
//   ein Datum  "2026-12-15"              -> Versand ab diesem Datum, danach normal lieferbar
//   zwei Daten "2026-11-30, 2026-12-15"  -> vorbestellbar bis zum 1. Datum (einschließlich),
//                                           Versand am 2. Datum; nach dem 1. Datum ist das Produkt offline
function parsePreorder(value) {
  const dates = parseList(value).map(parseDate).filter(Boolean);
  const today = todayInGermany();
  if (dates.length >= 2) {
    const [until, ship] = dates;
    return { date: ship > today ? ship : null, until, exact: true, closed: until < today };
  }
  if (dates.length === 1) {
    return { date: dates[0] > today ? dates[0] : null, until: null, exact: false, closed: false };
  }
  return { date: null, until: null, exact: false, closed: false };
}

// Bestand: "20" = insgesamt, "S:5, M:10, L:0" = je Größe, "Blau:3, Rot:0" = je Farbe/Variante,
// "Gelb/M:2, Blau/L:0" = je Kombination. Kein Eintrag = unbegrenzt; nicht genannte Optionen ebenfalls.
export function parseStock(value) {
  const text = (value || "").trim();
  if (!text) return null;
  if (/^\d+$/.test(text)) return { total: Number(text), byOption: null };

  const byOption = {};
  parseList(text).forEach((entry) => {
    const separator = entry.lastIndexOf(":");
    const name = entry.slice(0, separator).trim();
    const amount = entry.slice(separator + 1).trim();
    if (separator > 0 && name && /^\d+$/.test(amount)) byOption[name] = Number(amount);
  });
  return Object.keys(byOption).length > 0 ? { total: null, byOption } : null;
}

// Bestand zurück in die Schreibweise der Metadaten ("12" bzw. "S:4, M:9")
export function formatStock(stock) {
  if (stock.total !== null) return String(stock.total);
  return Object.entries(stock.byOption)
    .map(([name, amount]) => `${name}:${amount}`)
    .join(", ");
}

// Gleiche Regeln wie src/js/stock.js (Browser) – Änderungen bitte in beiden Dateien.
// "Gelb / M" und "gelb/m" gelten als gleich
const normalizeStockKey = (key) => String(key).replace(/\s*\/\s*/g, "/").trim().toLowerCase();

// Alle Reihenfolgen aller Teilmengen der gewählten Werte, die längsten zuerst
function stockKeyCandidates(values) {
  const result = [];
  const permute = (rest, picked) => {
    if (picked.length > 0) result.push(picked);
    rest.forEach((value, index) => permute([...rest.slice(0, index), ...rest.slice(index + 1)], [...picked, value]));
  };
  permute(values, []);
  return result.sort((a, b) => b.length - a.length).map((parts) => parts.join("/"));
}

// Welcher Eintrag aus "bestand" gilt für die Auswahl { size, color, variant }? (null = keiner)
// Kombinationen wie "Gelb/M" (Reihenfolge egal) gehen vor einzelnen Optionen wie "M".
export function stockOptionFor(stock, choice) {
  if (!stock || stock.total !== null) return null;
  const byNormalized = new Map(Object.keys(stock.byOption).map((key) => [normalizeStockKey(key), key]));
  const values = [choice.size, choice.color, choice.variant].filter(Boolean);
  for (const candidate of stockKeyCandidates(values)) {
    const key = byNormalized.get(normalizeStockKey(candidate));
    if (key !== undefined) return key;
  }
  return null;
}

// Verfügbare Stückzahl für eine Auswahl { size, color, variant } (Infinity = unbegrenzt)
export function availableFor(product, choice = {}) {
  const stock = product.stock;
  if (!stock) return Infinity;
  if (stock.total !== null) return stock.total;
  const option = stockOptionFor(stock, choice);
  return option ? stock.byOption[option] : Infinity;
}

// Alle möglichen Auswahlen des Produkts (Größe × Farbe × Variante)
function combinations(product) {
  const sizes = product.sizes.length > 0 ? product.sizes : [null];
  const colors = product.colors.length > 0 ? product.colors.map((color) => color.name) : [null];
  const variants = product.variants.length > 0 ? product.variants : [null];
  return sizes.flatMap((size) => colors.flatMap((color) => variants.map((variant) => ({ size, color, variant }))));
}

function toShopProduct(product) {
  const price = product.default_price;
  const meta = product.metadata || {};
  const sizes = parseOptions(meta.groessen);
  const colors = parseColors(meta.farben);
  const variants = parseOptions(meta.varianten);
  const preorder = parsePreorder(meta.vorbestellung);

  return {
    id: product.id,
    title: product.name,
    description: product.description || "",
    price: price.unit_amount / 100,
    unitAmount: price.unit_amount,
    currency: "€",
    images: product.images,
    sizes: sizes.names,
    colors: colors.colors,
    variants: variants.names,
    // Aufpreise je Option in Cent, z. B. { size: { XXL: 200 }, color: {}, variant: {} }
    surcharges: { size: sizes.surcharges, color: colors.surcharges, variant: variants.surcharges },
    hasSurcharges: [sizes, colors, variants].some((option) => Object.keys(option.surcharges).length > 0),
    // "lager: nein" = wird nach Bestellung gefertigt (14 Tage), sonst vorrätig (5 Werktage)
    inStock: (meta.lager || "ja").toLowerCase() !== "nein",
    // "versandfrei: ja" = z. B. Postkarten; allein bestellt kostenlos, gemischt zählen sie zum Warenwert
    freeShipping: (meta.versandfrei || "").toLowerCase() === "ja",
    // Weitere Bilder liegen in src/img/produkte/<bildordner>/ (Stripe erlaubt im Dashboard nur ein Bild)
    imageFolder: (meta.bildordner || "").trim(),
    // Vorbestellung: Versanddatum, ggf. Bestellschluss; "exact" = Versand genau am Datum (zwei Daten)
    preorderDate: preorder.date,
    preorderUntil: preorder.until,
    preorderExact: preorder.exact,
    preorderClosed: preorder.closed,
    // Herstellungs-Hinweis auf der Produktseite: leer = Siebdruck-Standardtext, "nein" = ausblenden
    production: (meta.herstellung || "").trim(),
    // Größentabelle aus src/groessentabellen.json, z. B. "hoodie" (leer = keine Tabelle)
    sizeChart: (meta.groessentabelle || "").trim().toLowerCase(),
    stock: parseStock(meta.bestand),
    categories: parseCategories(meta.kategorie),
    // Für die Sortierung "Neu": Metadatum "neu_seit" (Datum), sonst Anlegezeitpunkt in Stripe (Sekunden)
    created: parseDate(meta.neu_seit) ? Date.parse(parseDate(meta.neu_seit)) / 1000 : product.created || 0,
    sort: Number(meta.sortierung) || 999,
  };
}

// Ausverkauft: keine einzige Auswahl (Größe/Farbe/Variante bzw. Kombination) ist mehr lieferbar
function isSoldOut(product) {
  if (!product.stock) return false;
  return combinations(product).every((choice) => availableFor(product, choice) <= 0);
}

// Kategorien: "Postkarten" oder mehrere "Postkarten, Weihnachten"
function parseCategories(value) {
  return parseList(value);
}

export async function loadCatalog(stripe) {
  const products = await stripe.products
    .list({ active: true, limit: 100, expand: ["data.default_price"] })
    .autoPagingToArray({ limit: 500 });

  return products
    .filter((product) => {
      const price = product.default_price;
      // Nur Produkte mit aktivem Euro-Einmalpreis gehören in den Shop
      return (
        price &&
        typeof price === "object" &&
        price.active &&
        price.currency === "eur" &&
        price.type === "one_time" &&
        price.unit_amount !== null
      );
    })
    .map(toShopProduct)
    // Vorbestellung mit Bestellschluss: nach dem Schluss ist das Produkt offline (Shop und Kasse)
    .filter((product) => !product.preorderClosed)
    .map((product) => ({ ...product, soldOut: isSoldOut(product) }))
    .sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title, "de"));
}

// Bestand in Stripe ändern: entries = [{ productId, choice: { size, color, variant }, quantity }].
// direction -1 = abziehen (Verkauf), +1 = zurückbuchen (Stornierung). Produkte ohne Bestand = unbegrenzt.
export async function changeStock(stripe, entries, direction = -1) {
  const byProduct = new Map();
  for (const entry of entries) {
    if (!entry.productId) continue;
    byProduct.set(entry.productId, [...(byProduct.get(entry.productId) || []), entry]);
  }

  for (const [productId, list] of byProduct) {
    const product = await stripe.products.retrieve(productId);
    const stock = parseStock(product.metadata.bestand);
    if (!stock) continue;

    for (const { choice, quantity } of list) {
      if (stock.total !== null) {
        stock.total = Math.max(0, stock.total + direction * quantity);
        continue;
      }
      // Bestand je Größe, Farbe, Variante oder Kombination; nicht genannte Optionen sind unbegrenzt
      const option = stockOptionFor(stock, choice);
      if (option) stock.byOption[option] = Math.max(0, stock.byOption[option] + direction * quantity);
    }
    await stripe.products.update(productId, { metadata: { bestand: formatStock(stock) } });
  }
}
