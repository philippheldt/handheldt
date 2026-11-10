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

// "vorbestellung: 2026-12-15" oder "15.12.2026": Versand erst ab diesem Datum.
// Liegt das Datum nicht mehr in der Zukunft, gilt das Produkt wieder als normal lieferbar.
function parsePreorderDate(value) {
  if (!value) return null;
  const text = value.trim();
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const german = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!iso && !german) return null;
  const [year, month, day] = iso ? iso.slice(1) : [german[3], german[2], german[1]];
  const date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const today = new Date().toISOString().slice(0, 10);
  return date > today ? date : null;
}

// Bestand: "20" = insgesamt, "S:5, M:10, L:0" = je Größe.
// Kein Eintrag = unbegrenzt; Größen, die nicht genannt sind, ebenfalls unbegrenzt.
export function parseStock(value) {
  const text = (value || "").trim();
  if (!text) return null;
  if (/^\d+$/.test(text)) return { total: Number(text), bySize: null };

  const bySize = {};
  parseList(text).forEach((entry) => {
    const [size, amount] = entry.split(":").map((part) => part.trim());
    if (size && /^\d+$/.test(amount || "")) bySize[size] = Number(amount);
  });
  return Object.keys(bySize).length > 0 ? { total: null, bySize } : null;
}

// Bestand zurück in die Schreibweise der Metadaten ("12" bzw. "S:4, M:9")
export function formatStock(stock) {
  if (stock.total !== null) return String(stock.total);
  return Object.entries(stock.bySize)
    .map(([size, amount]) => `${size}:${amount}`)
    .join(", ");
}

// Verfügbare Stückzahl für eine Größe (Infinity = unbegrenzt)
export function availableFor(product, size) {
  const stock = product.stock;
  if (!stock) return Infinity;
  if (stock.total !== null) return stock.total;
  return size in stock.bySize ? stock.bySize[size] : Infinity;
}

function toShopProduct(product) {
  const price = product.default_price;
  const meta = product.metadata || {};
  const sizes = parseOptions(meta.groessen);
  const colors = parseColors(meta.farben);
  const variants = parseOptions(meta.varianten);

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
    preorderDate: parsePreorderDate(meta.vorbestellung),
    // Herstellungs-Hinweis auf der Produktseite: leer = Siebdruck-Standardtext, "nein" = ausblenden
    production: (meta.herstellung || "").trim(),
    stock: parseStock(meta.bestand),
    sort: Number(meta.sortierung) || 999,
  };
}

// Ausverkauft: Gesamtbestand 0 oder alle Größen mit Bestand 0
function isSoldOut(product) {
  if (!product.stock) return false;
  if (product.stock.total !== null) return product.stock.total <= 0;
  if (product.sizes.length === 0) return false;
  return product.sizes.every((size) => availableFor(product, size) <= 0);
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
    .map((product) => ({ ...product, soldOut: isSoldOut(product) }))
    .sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title, "de"));
}
