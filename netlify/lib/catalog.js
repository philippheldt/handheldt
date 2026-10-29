// netlify/lib/catalog.js
// Lädt den Shop-Katalog direkt aus Stripe. Gepflegt wird alles im Stripe-Dashboard:
// Name, Beschreibung, Bilder und Standardpreis am Produkt, Zusatzangaben als Metadaten
// (siehe SHOP-ANLEITUNG.md).

// Kommaliste aus den Metadaten in ein Array umwandeln ("S, M, L" -> ["S", "M", "L"])
function parseList(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

// Farben im Format "Schwarz:#000000, Weiß:#ffffff"
function parseColors(value) {
  return parseList(value).map((entry) => {
    const [name, hex] = entry.split(":").map((part) => part.trim());
    return { name, hex: hex || "#cccccc" };
  });
}

function toShopProduct(product) {
  const price = product.default_price;
  const meta = product.metadata || {};

  return {
    id: product.id,
    title: product.name,
    description: product.description || "",
    price: price.unit_amount / 100,
    unitAmount: price.unit_amount,
    currency: "€",
    images: product.images,
    sizes: parseList(meta.groessen),
    colors: parseColors(meta.farben),
    variants: parseList(meta.varianten),
    // "lager: nein" = wird nach Bestellung gefertigt (14 Tage), sonst vorrätig (5 Werktage)
    inStock: (meta.lager || "ja").toLowerCase() !== "nein",
    sort: Number(meta.sortierung) || 999,
  };
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
    .sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title, "de"));
}
