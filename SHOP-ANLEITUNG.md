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
| `kategorie` | `Postkarten` oder `Postkarten, Weihnachten` | Kategorie(n) für den Filter in der Shop-Übersicht und für „Das könnte dir gefallen“ (siehe unten) |
| `neu_seit` | `2026-11-01` oder `01.11.2026` | Für „Neu“ (Shop-Sortierung, „Neu im Shop“ auf der Startseite, Bild der Kategorie-Kachel). Ohne Angabe zählt, wann das Produkt in Stripe angelegt wurde |
| `sortierung` | `1` | Reihenfolge im Shop bei „Empfohlen“ (kleinere Zahl = weiter vorne) |
| `vorbestellung` | `2026-12-15` oder `15.12.2026` | Vorbestellung: Versand erst ab diesem Datum statt in 5 bzw. 14 Tagen. Ist das Datum erreicht, gilt das Produkt automatisch wieder als normal lieferbar |
| `herstellung` | `Im Digitaldruck gedruckt` oder `nein` | Ersetzt auf der Produktseite den Hinweis „Von Hand im Siebdruck bedruckt“; `nein` blendet ihn aus. Leer lassen = Siebdruck-Text |
| `bestand` | `20`, `S:5, M:10, L:0` oder `Blau:3, Rot:0` | Lagerbestand insgesamt bzw. je Größe, Farbe oder Variante (siehe unten). Kein Eintrag = unbegrenzt |
| `bildordner` | `hoodie` | Weitere Produktbilder aus dem Ordner `src/img/produkte/hoodie/` (siehe unten) |
| `versandfrei` | `ja` | z. B. Postkarten: Wird nur so etwas bestellt, ist der Versand kostenlos (per Post). Zusammen mit anderen Produkten gilt die normale Pauschale (4,90 € bis 50 €), der Preis zählt zum Warenwert |

Alle Felder sind optional. Ohne `groessen`, `farben` oder `varianten` wird die
jeweilige Auswahl auf der Produktseite ausgeblendet.

## Optionen mit Aufpreis

Bei Größen, Farben und Varianten kann an jede Option ein Aufpreis gehängt werden:

| Schlüssel | Beispiel |
| --- | --- |
| `groessen` | `S, M, L, XL, XXL:+2, 3XL:+3` |
| `farben` | `Natur:#f3eee4, Schwarz:#111111:+1,50` |
| `varianten` | `Ohne Rückenprint, Mit Rückenprint:+5` |

- Optionen ohne `:+…` kosten nichts extra. Aufpreise mit Komma oder Punkt (`+2,50` oder `+2.50`).
- Nach dem Komma zwischen den Optionen bitte ein Leerzeichen lassen.
- Produktseite: Aufpreis steht an der Option, der Preis oben passt sich an.
- Shop-Übersicht: Produkte mit Aufpreisen zeigen „ab“ und den Grundpreis.
- Abgerechnet wird Grundpreis + Aufpreis; in Stripe steht an der Position z. B.
  „Größe XXL (+2,00 €) · Mit Rückenprint (+5,00 €)“.

## Bestand / Kontingente

Mit dem Metadatum `bestand` legt ihr fest, wie viele Stück verkauft werden können:

| Wert | Bedeutung |
| --- | --- |
| *(kein Eintrag)* | unbegrenzt |
| `20` | 20 Stück insgesamt (für Produkte ohne Größen) |
| `S:5, M:10, L:3, XL:0` | Bestand je Größe; Größen, die nicht genannt sind, bleiben unbegrenzt |
| `Blau:3, Grün:12, Rot:0` | Bestand je Farbe (oder je Variante) – genauso, nur mit den Namen aus `farben` bzw. `varianten` |

- Die Namen müssen genau so geschrieben sein wie in `groessen`, `farben` oder `varianten`
  (Groß-/Kleinschreibung, Leerzeichen). Pro Produkt bitte nur eine Art verwenden, also
  entweder Größen **oder** Farben **oder** Varianten.
- Ab 5 Stück oder weniger steht „Nur noch X Stück verfügbar“ auf der Produktseite.
- Optionen mit 0 sind durchgestrichen bzw. ausgegraut und nicht wählbar. Ist alles bei 0,
  steht „Ausverkauft“ auf Produktseite und Produktbild.
- In den Warenkorb passt höchstens der verfügbare Bestand; vor der Kasse wird noch einmal
  geprüft.
- Nach jeder bezahlten Bestellung zieht die Website die gekauften Stück automatisch vom
  Bestand in Stripe ab. Bei einer Erstattung den Bestand bitte von Hand wieder erhöhen.
- Die Kasse verfällt nach gut 30 Minuten. Bezahlen zwei Leute gleichzeitig das letzte Stück,
  kann es ausnahmsweise einmal zu viel verkauft werden – dann eine Bestellung erstatten.

### Was passiert bei Problemen an der Kasse?

Passt etwas im Warenkorb nicht mehr (zu wenig Bestand, Farbe/Größe gibt es nicht mehr,
Produkt wurde entfernt), nennt der Warenkorb das betroffene Produkt mit der Ausführung,
z. B. „Von „Der Fels | Postkarte“ (Blau) sind nur noch 2 Stück verfügbar“, und markiert die
Position.

### Einmalig einrichten: Webhook für das automatische Abziehen

1. Stripe → **Entwickler → Webhooks** → **Endpunkt hinzufügen**
2. Endpunkt-URL: `https://handheldt.de/.netlify/functions/stripe-webhook`
3. Ereignisse auswählen: `checkout.session.completed` und
   `checkout.session.async_payment_succeeded`
4. Speichern, dann beim Endpunkt das **Signing Secret** (`whsec_…`) einblenden und kopieren.
5. Netlify → **Project configuration → Environment variables** → neue Variable
   `STRIPE_WEBHOOK_SECRET` mit diesem Wert (Scope: Functions), danach neu deployen.

Für Test- und Live-Modus gibt es jeweils einen eigenen Webhook und ein eigenes Secret.

## Kategorien, Filter und „Das könnte dir gefallen“

- `kategorie` ist frei wählbar, z. B. `Postkarten`, `Shirts`, `Kissen`. Mehrere mit Komma.
  Auf die Schreibweise achten – `Postkarte` und `Postkarten` wären zwei Kategorien.
- Die Shop-Übersicht zeigt oben die Kategorien als Filter (erst ab zwei Kategorien; bis zu
  3 als Buttons, ab 4 als Auswahlliste „Alle Kategorien“, damit es übersichtlich bleibt) und
  eine Sortierung: Empfohlen (`sortierung`), Neu (`neu_seit`, sonst zuletzt in Stripe angelegt), Preis, A–Z.
  Ausverkauftes steht immer am Ende.
- Unter jedem Produkt stehen bis zu 4 Vorschläge, zuerst aus derselben Kategorie, danach
  aufgefüllt mit weiteren Produkten. Ausverkauftes wird nie vorgeschlagen.

## Vorschlag im Warenkorb (kurz vor 50 €)

Fehlen bis zum kostenlosen Versand höchstens 20 €, schlägt der Warenkorb ein Produkt vor,
das sich mit einem Klick hinzufügen lässt. Gewählt wird das **günstigste Produkt, mit dem
die Bestellung über 50 € kommt** – also immer knapp darüber, nie darunter. Vorgeschlagen
werden nur Produkte ohne Größenwahl, die lieferbar und keine Vorbestellung sind (Farbe bzw.
Variante: die erste verfügbare).

## Mehr als ein Bild pro Produkt

Im Stripe-Dashboard lässt sich nur ein Bild hochladen. Weitere Bilder (beliebig viele)
kommen in einen eigenen Ordner im Repository:

1. Auf dem Computer einen Ordner anlegen, z. B. `hoodie` (nur Kleinbuchstaben, Zahlen und
   Bindestriche), und die Bilder hineinlegen.
2. Auf GitHub im Repository zu `src/img/produkte/` gehen.
3. **Add file → Upload files** und den **ganzen Ordner** (nicht nur die Bilder) in das
   Upload-Feld ziehen. GitHub übernimmt den Ordner. Das geht im Browser am Computer.
4. Unten **Commit changes** klicken. Netlify baut die Seite automatisch neu (ca. 1–2 Minuten).
5. In Stripe beim Produkt das Metadatum `bildordner` = `hoodie` eintragen.

`bildordner` ist **nur der Ordnername**, kein Pfad: Für `src/img/produkte/hoodie/` steht in
Stripe einfach `hoodie` – ohne Schrägstriche, genau so geschrieben wie der Ordner.

Weitere Bilder später ergänzen: in den Ordner `src/img/produkte/hoodie/` wechseln und dort
**Add file → Upload files** nutzen.

Reihenfolge: zuerst das Bild aus Stripe, dann die Bilder aus dem Ordner sortiert nach
Dateiname. Am einfachsten nummerieren: `01.jpg`, `02.jpg`, … `14.jpg`. Das zweite Bild
erscheint in der Shop-Übersicht beim Drüberfahren.

Die Bilder werden beim Build automatisch verkleinert. Bitte trotzdem nicht größer als
etwa 2400 px Breite und als JPG hochladen.

## Vorbestellungen

Mit dem Metadatum `vorbestellung` (z. B. `15.12.2026`) wird ein Produkt zur Vorbestellung:

- Produktseite: Hinweis „Vorbestellung – Versand ab 15. Dezember 2026“, Button „Vorbestellen“
- Shop-Übersicht: Kennzeichnung „Vorbestellung“ auf dem Produktbild
- Warenkorb und Kasse: Hinweis mit dem Versanddatum; in Stripe steht es an der Bestellposition
  und als Metadatum `vorbestellung` an der Zahlung

Bezahlt wird sofort. Enthält eine Bestellung Vorbestellungen, wird sie gesammelt ab dem
spätesten Vorbestell-Datum verschickt (so steht es auch in den AGB). Ab dem Datum selbst
verschwindet der Hinweis automatisch – das Metadatum kann danach gelöscht werden.

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
- **Stripe-Webhook** für den Bestand einrichten (siehe „Bestand / Kontingente“).
- **Stripe → Einstellungen → E-Mails:** Belege für erfolgreiche Zahlungen aktivieren
  (die AGB versprechen eine Bestellbestätigung per E-Mail).

## Mindestbestellwert

Bestellungen sind erst ab **2,50 € Warenwert** (ohne Versand) möglich. Darunter zeigt der
Warenkorb, wie viel noch fehlt, und der Kasse-Button ist gesperrt; die Kasse prüft es
zusätzlich. Der Betrag steht in den AGB (§ 3 Abs. 5). Zum Ändern bitte Bescheid geben – er
steht in `netlify/functions/create-checkout.js`, `src/js/cart.js`, den AGB und der Produktseite.

## Startseite

- **Kategorie-Kacheln:** je Kategorie eine Kachel (höchstens 6), Bild ist das neueste
  lieferbare Produkt der Kategorie.
- **Neu im Shop:** die 8 neuesten lieferbaren Produkte.
- „Neu“ richtet sich nach `neu_seit`, sonst danach, wann das Produkt in Stripe angelegt wurde.
  Wer die Reihenfolge festlegen will, trägt bei den Produkten einfach ein Datum in `neu_seit` ein.
