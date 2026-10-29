import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";

export default function (eleventyConfig) {
  // Statische Dateien 1:1 übernehmen
  for (const path of ["css", "js", "img", "fonts", "configurator.js", "druckoptionen.json", "_redirects", ".well-known"]) {
    eleventyConfig.addPassthroughCopy({ [`src/${path}`]: path });
  }

  // Alle Seiten behalten ihre bisherigen URLs (z. B. /agb.html statt /agb/)
  eleventyConfig.addGlobalData("permalink", () => (data) => `${data.page.filePathStem}.html`);
  eleventyConfig.addGlobalData("layout", "base.njk");

  // <img>-Tags automatisch als verkleinertes WebP mit width/height ausgeben
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["webp"],
    widths: [480, 960, 1600],
    urlPath: "/img/opt/",
    outputDir: "_site/img/opt/",
    htmlOptions: {
      imgAttributes: {
        loading: "lazy",
        decoding: "async",
        sizes: "(max-width: 800px) 100vw, 800px",
      },
    },
  });

  return {
    dir: { input: "src", output: "_site" },
    htmlTemplateEngine: "njk",
    templateFormats: ["html", "njk"],
  };
}
