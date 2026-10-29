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

Alle Felder sind optional. Ohne `groessen`, `farben` oder `varianten` wird die
jeweilige Auswahl auf der Produktseite ausgeblendet.

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
und die gewählte Versandart (DHL oder Abholung in Teningen) in den Zahlungsdetails.

Hinweis: Stripe kann dabei für die bestellten Artikel interne Produkte ohne Standardpreis
anlegen. Diese tauchen nicht im Shop auf und können ignoriert werden.

## Einmalig einrichten

- **Netlify:** Umgebungsvariable `STRIPE_SECRET_KEY` mit dem geheimen Live-Schlüssel
  (`sk_live_…`) setzen.
- **Stripe → Einstellungen → E-Mails:** Belege für erfolgreiche Zahlungen aktivieren
  (die AGB versprechen eine Bestellbestätigung per E-Mail).
