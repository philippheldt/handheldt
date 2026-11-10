# Shop-Produkte in Stripe pflegen

Der Shop auf handheldt.de liest seine Produkte direkt aus Stripe. Änderungen im
Stripe-Dashboard erscheinen nach spätestens etwa 5 Minuten auf der Website – am Code muss
dafür nichts geändert werden.

## Neues Produkt anlegen

Stripe-Dashboard → **Produktkatalog** → **Produkt hinzufügen**

| Feld in Stripe | Wird im Shop angezeigt als |
| --- | --- |
| Name | Produkttitel |
| Beschreibung | Produktbeschreibung |
| Bilder (bis zu 8) | Produktbilder, das erste ist das Titelbild |
| Preis | Verkaufspreis – **Einmalig**, in **EUR**, als Standardpreis |

Unter **Metadaten** (im Produkt ganz unten) kannst du zusätzlich eintragen:

| Schlüssel | Beispiel | Bedeutung |
| --- | --- | --- |
| `groessen` | `S, M, L, XL` | Größenauswahl (Komma-getrennt) |
| `farben` | `Schwarz:#000000, Weiß:#ffffff` | Farbauswahl mit Farbpunkt (Name:Farbcode) |
| `varianten` | `Slim Fit, Regular Fit` | Auswahlliste „Variante“ |
| `lager` | `nein` | `nein` = wird nach Bestellung gefertigt (Lieferzeit 14 Tage). Ohne Angabe oder `ja` = vorrätig (5 Werktage) |
| `sortierung` | `1` | Reihenfolge im Shop (kleinere Zahl = weiter vorne) |
| `bildordner` | `hoodie` | Weitere Produktbilder aus dem Ordner `src/img/produkte/hoodie/` (siehe unten) |
| `versandfrei` | `ja` | z. B. Postkarten: Wird nur so etwas bestellt, ist der Versand kostenlos (per Post). Zusammen mit anderen Produkten gilt die normale Pauschale (4,90 € bis 50 €), der Preis zählt zum Warenwert |

Alle Felder sind optional. Ohne `groessen`, `farben` oder `varianten` wird die
jeweilige Auswahl auf der Produktseite ausgeblendet.

## Mehr als ein Bild pro Produkt

Im Stripe-Dashboard lässt sich nur ein Bild hochladen. Weitere Bilder (beliebig viele)
kommen in einen eigenen Ordner im Repository:

1. Auf GitHub im Repository zu `src/img/produkte/` gehen.
2. **Add file → Upload files** und die Bilder hochladen. Im Feld oben den Pfad um einen
   neuen Ordnernamen ergänzen, z. B. `hoodie/` (nur Kleinbuchstaben, keine Leerzeichen).
3. Commit erstellen. Netlify baut die Seite automatisch neu (ca. 1–2 Minuten).
4. In Stripe beim Produkt das Metadatum `bildordner` = `hoodie` eintragen.

Reihenfolge: zuerst das Bild aus Stripe, dann die Bilder aus dem Ordner sortiert nach
Dateiname. Am einfachsten nummerieren: `01.jpg`, `02.jpg`, … `14.jpg`. Das zweite Bild
erscheint in der Shop-Übersicht beim Drüberfahren.

Die Bilder werden beim Build automatisch verkleinert. Bitte trotzdem nicht größer als
etwa 2400 px Breite und als JPG hochladen.

## Produkt aus dem Shop nehmen

Produkt in Stripe **archivieren**. Es verschwindet aus dem Shop und wird auch aus
Warenkörben entfernt, in denen es noch liegt.

Sind keine aktiven Produkte vorhanden, zeigt der Shop automatisch den Hinweis
„Wartungsarbeiten“.

## Preis ändern

Beim Produkt einen neuen Preis anlegen und als **Standardpreis** festlegen. Abgerechnet
wird immer der aktuelle Standardpreis aus Stripe.

Achtung bei Rabatten: Wenn du einen Preis senkst und den alten Preis irgendwo
durchgestrichen zeigst, muss der durchgestrichene Preis der niedrigste Preis der letzten
30 Tage sein (§ 11 PAngV).

## Bestellungen

Jede Bestellung erscheint in Stripe unter **Zahlungen**. Größe, Farbe und Variante stehen
direkt am Artikel (z. B. „Adore Him Hoodie – Größe M · Farbe Schwarz“), die Lieferadresse
und die gewählte Versandart (DHL, Post bei reinen Postkarten-Bestellungen oder Abholung in
Teningen) in den Zahlungsdetails.

Hinweis: Stripe kann dabei für die bestellten Artikel interne Produkte ohne Standardpreis
anlegen. Diese tauchen nicht im Shop auf und können ignoriert werden.

## Einmalig einrichten

- **Netlify:** Umgebungsvariable `STRIPE_SECRET_KEY` mit dem geheimen Live-Schlüssel
  (`sk_live_…`) setzen.
- **Stripe → Einstellungen → E-Mails:** Belege für erfolgreiche Zahlungen aktivieren
  (die AGB versprechen eine Bestellbestätigung per E-Mail).
