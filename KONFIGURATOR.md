# Textil-Konfigurator pflegen

Die Seite `configurator.html` hat zwei Wege:

- **Selbst zusammenstellen:** Produkt, Farbe, Druck, Menge, Termin, Motiv und Kontakt, mit Preisschätzung.
- **Noch keine Ahnung? Kurz beschreiben:** nur Beschreibung, ungefähre Menge, Termin, Datei und Kontakt.
  Direktlink: `configurator.html#schnellanfrage`.

Beide Anfragen landen in Netlify unter **Forms** (`konfigurator` bzw. `schnellanfrage`). Dateien laden Kunden
über den pCloud-Upload-Link hoch (Anfragelink, Limit 100 MB, in `src/configurator.html`); im Formular kreuzen sie
„Ich habe Dateien hochgeladen“ an und sollen ihren Namen in den Dateinamen schreiben. Beim Konfigurator steht im Feld `konfiguration` eine lesbare Zusammenfassung, z. B.:

```
Produkt: T-Shirt
Farbe: Burgundy
Vorne: Mittel, Mitte, 2 Farben
Hinten: Groß, Mitte, 1 Farbe
Menge: 20 Stück (M: 12, L: 8)
Preisschätzung: ca. 344 € – 488 € (17 € – 24 €/Stück, zzgl. Versand)
Dateien: bei pCloud hochgeladen
```

## Preise und Produkte ändern

Alles steht in `src/druckoptionen.json`:

| Eintrag | Bedeutung |
| --- | --- |
| `druck.sieb` | Preis pro Sieb (einmalig). Pro Druckseite und Farbe ein Sieb. |
| `druck.proStueck` | Druckpreis pro Stück und Druckseite nach Motivgröße (Klein/Mittel/Groß) |
| `druck.proZusatzfarbe` | Aufschlag pro Stück für jede weitere Farbe einer Druckseite |
| `druck.farben` | Wie viele Siebe eine Auswahl bedeutet (`"4 oder mehr": [4, 6]` = 4 bis 6) |
| `produkte[].textil` | Textilpreis pro Stück `[min, max]`; `null` = auf Anfrage („Etwas anderes“) |
| `produkte[].farben` | Farbname → Stanley/Stella-Farbcode (Hex-Werte in `src/js/configurator.js`) |
| `produkte[].groessen` | `erwachsene`, `baby` oder `null` (keine Größen, z. B. Tote Bag) |
| `produkte[].bereiche` | Druckseiten und Positionen |
| `produkte[].vorschau` | Dateiname des Vorschaubilds ohne `.png` (oder `null`) |

Formel: **Siebe (einmalig) + Menge × (Textil + Druck pro Stück)**, alles zzgl. Versand.

### Textilpreise (Stand 11/2026)

Einkaufspreise inkl. MwSt. bei [Shirtschleuder](https://katalog.shirtschleuder.de/), Stanley/Stella. Von-Preis =
günstigste reguläre Farbe, Bis-Preis = teuerste Farbe bzw. 4XL–5XL. Abverkaufsfarben (z. B. 3,40 €) sind nicht
berücksichtigt.

| Produkt | Artikel | Preis |
| --- | --- | --- |
| T-Shirt | Creator 2.0 (STTU169) bis Sparker 2.0 (STTU171, schwer) | 8,20 – 15,40 € |
| Hoodie | Cruiser 2.0 (STSU177) | 35,88 – 44,32 € |
| Sweater | Changer 2.0 (STSU178) | 27,55 – 34,30 € |
| Babybody | Baby Body (STUB103) | 7,31 – 8,54 € |
| Tote Bag | Light Tote Bag (STAU773) bis Tote Bag (STAU760) | 3,47 – 6,30 € |

Der Textilpreis geht ohne Aufschlag in die Schätzung ein – euer Anteil steckt im Druckpreis pro Stück
(`druck.proStueck`). Wer auf das Textil etwas aufschlagen will, erhöht hier die Werte.

## Vorschau

Für das T-Shirt (mit Vorderdruck) und die Tote Bag gibt es Vorschaubilder in `src/img/configurator/config/`.
Für Hoodie, Sweater und Babybody zeigt die Vorschau bisher nur die Farbe mit dem Produktnamen. Für eine
richtige Vorschau braucht es pro Produkt ein Bild im gleichen Stil: weiß, die Form des Textils transparent
ausgeschnitten (die Farbe liegt dahinter), z. B. `HOOD.png` in `src/img/configurator/config/`. Dann beim
Produkt in `druckoptionen.json` `"vorschau": "HOOD"` eintragen.
