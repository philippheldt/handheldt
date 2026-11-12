// Erzeugt /img/produkte/bilder.json: alle Bilder aus src/img/produkte/<ordner>/, verkleinert als WebP.
// In Stripe verweist das Metadatum "bildordner" auf einen dieser Ordner (siehe SHOP-ANLEITUNG.md).
import fs from "node:fs";
import path from "node:path";
import Image from "@11ty/eleventy-img";

const PRODUCT_IMAGE_DIR = "src/img/produkte";
const IMAGE_FILE = /\.(jpe?g|png|webp)$/i;

export default class {
  data() {
    return {
      permalink: "/img/produkte/bilder.json",
      layout: false,
      eleventyExcludeFromCollections: true,
    };
  }

  async render() {
    const folders = fs
      .readdirSync(PRODUCT_IMAGE_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    const manifest = {};

    for (const folder of folders) {
      // Reihenfolge nach Dateiname, Zahlen natürlich sortiert (2.jpg vor 10.jpg)
      const files = fs
        .readdirSync(path.join(PRODUCT_IMAGE_DIR, folder))
        .filter((file) => IMAGE_FILE.test(file))
        .sort((a, b) => a.localeCompare(b, "de", { numeric: true }));

      manifest[folder] = [];
      for (const file of files) {
        const metadata = await Image(path.join(PRODUCT_IMAGE_DIR, folder, file), {
          widths: [400, 1200],
          formats: ["webp"],
          outputDir: "_site/img/opt/",
          urlPath: "/img/opt/",
        });
        const [thumb, full] = metadata.webp;
        // name = Dateiname ohne Endung; darüber findet die Produktseite das Bild zu einer Farbe/Variante
        manifest[folder].push({ src: (full || thumb).url, thumb: thumb.url, name: path.parse(file).name });
      }
    }

    return JSON.stringify(manifest);
  }
}
