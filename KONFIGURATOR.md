# Textil-Konfigurator pflegen

Die Seite `configurator.html` hat zwei Wege:

- **Selbst zusammenstellen:** Produkt, Farbe, Druck, Menge, Termin, Motiv und Kontakt, mit Preisschätzung.
- **Noch keine Ahnung? Kurz beschreiben:** nur Beschreibung, ungefähre Menge, Termin, Datei und Kontakt.
  Direktlink: `configurator.html#schnellanfrage`.

Beide Anfragen landen in Netlify unter **Forms** (`konfigurator` bzw. `schnellanfrage`), samt hochgeladener Datei
(max. 8 MB). Beim Konfigurator steht im Feld `konfiguration` eine lesbare Zusammenfassung, z. B.:

```
Produkt: T-Shirt
Farbe: Burgundy
Vorne: Mittel, Mitte, 2 Farben
Hinten: Groß, Mitte, 1 Farbe
Menge: 20 Stück (M: 12, L: 8)
Preisschätzung: ca. 340 € – 480 € (17 € – 24 €/Stück, zzgl. Versand)
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

## Vorschau

Für das T-Shirt (mit Vorderdruck) und die Tote Bag gibt es Vorschaubilder in `src/img/configurator/config/`.
Für Hoodie, Sweater und Babybody zeigt die Vorschau bisher nur die Farbe mit dem Produktnamen. Für eine
richtige Vorschau braucht es pro Produkt ein Bild im gleichen Stil: weiß, die Form des Textils transparent
ausgeschnitten (die Farbe liegt dahinter), z. B. `HOOD.png` in `src/img/configurator/config/`. Dann beim
Produkt in `druckoptionen.json` `"vorschau": "HOOD"` eintragen.
