# handheldt.de

Die Website wird mit [Eleventy](https://www.11ty.dev/) gebaut. Ihr schreibt weiterhin
normales HTML – Kopfbereich, Navigation und Footer gibt es aber nur noch einmal, und Bilder
werden beim Bauen automatisch verkleinert.

## Lokal starten

```bash
npm install
npm start
```

Die Seite läuft dann unter http://localhost:8080 und lädt bei Änderungen automatisch neu.
(Die Shop-Funktionen unter `netlify/functions` laufen nur mit `netlify dev` bzw. auf Netlify.)

## Aufbau

| Ordner / Datei | Inhalt |
| --- | --- |
| `src/*.html` | Die Seiten. Oben steht ein Block mit Einstellungen (siehe unten), darunter nur der Inhalt |
| `src/_includes/base.njk` | Grundgerüst jeder Seite (`<head>`, Meta-Tags, CSS/JS) |
| `src/_includes/header.njk` | Versand-Banner und Navigation |
| `src/_includes/footer.njk` | Footer mit Zahlarten und Rechtstexten |
| `src/_data/site.json` | Domain, Name und Standard-Vorschaubild für Social Media |
| `src/css`, `src/js`, `src/img`, `src/fonts` | Werden unverändert übernommen |
| `netlify/functions` | Shop-Schnittstelle zu Stripe |
| `_site/` | Ergebnis des Builds (nicht bearbeiten, nicht einchecken) |

## Einstellungen einer Seite

```yaml
---
title: "Seitentitel | handheldt"          # Titel im Browser-Tab und bei Google
description: "Ein bis zwei Sätze …"       # Beschreibung bei Google und beim Teilen
styles: ["faq.css"]                         # zusätzliche CSS-Dateien aus src/css
scripts: ["js/video_replay.js"]             # zusätzliche Skripte (im <head>, mit defer)
bodyScripts: ["js/cart.js"]                 # Skripte am Ende der Seite
noindex: true                               # nicht bei Google und nicht in der Sitemap
---
```

Eine neue Seite ist einfach eine neue Datei `src/name.html` mit so einem Block – sie
erscheint automatisch unter `/name.html` und in der `sitemap.xml`.

## Bilder

- Bilder, die per `<img>` eingebunden sind, werden beim Build automatisch als WebP in
  mehreren Größen ausgegeben (inkl. `width`/`height`). Ihr könnt also die Originale
  einbinden – bitte trotzdem nicht größer als ca. 2400 px breit.
- Bilder, die per JavaScript ausgetauscht werden, brauchen das Attribut
  `eleventy:ignore`, sonst passt das Ersetzen nicht mehr.
- Vorschaubilder von Videos (`poster`) und Hintergrundbilder im CSS werden nicht
  automatisch optimiert – diese vorher verkleinern (z. B. 1600 px, JPEG ~80 %).

## Shop

Wie Produkte in Stripe gepflegt werden, steht in [SHOP-ANLEITUNG.md](SHOP-ANLEITUNG.md).
