// netlify/lib/eur-xlsx.js
// Baut aus den Jahreszeilen (eur.js) eine Excel-Datei mit drei Blättern:
// Einnahmen (jede Buchung), Übersicht (pro Monat) und Hinweise.
import ExcelJS from "exceljs";

const EURO = '#,##0.00 "€";-#,##0.00 "€"';
const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const euro = (cent) => Math.round(cent) / 100;

// Datum in deutscher Zeit als Excel-Datum (ohne Uhrzeit)
function berlinDate(sec) {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date(sec * 1000)).split("-");
  return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
}

function styleHeader(row) {
  row.font = { bold: true, color: { argb: "FFF8F7F4" } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0C0B21" } };
  row.alignment = { vertical: "middle" };
  row.height = 20;
}

export async function buildEurWorkbook({ jahr, zeilen, stand }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "handheldt";
  wb.created = new Date(stand * 1000);

  // Blatt 1: alle Buchungen
  const ws = wb.addWorksheet("Einnahmen", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { header: "Datum", key: "datum", width: 12, style: { numFmt: "dd.mm.yyyy" } },
    { header: "Beleg", key: "beleg", width: 16 },
    { header: "Art", key: "art", width: 30 },
    { header: "Kunde", key: "kunde", width: 26 },
    { header: "Positionen", key: "positionen", width: 60 },
    { header: "Warenwert", key: "warenwert", width: 13, style: { numFmt: EURO } },
    { header: "Versand", key: "versand", width: 11, style: { numFmt: EURO } },
    { header: "Spende", key: "spende", width: 11, style: { numFmt: EURO } },
    { header: "Brutto", key: "brutto", width: 13, style: { numFmt: EURO } },
    { header: "Stripe-Gebühr", key: "gebuehr", width: 14, style: { numFmt: EURO } },
    { header: "Netto (Auszahlung)", key: "netto", width: 18, style: { numFmt: EURO } },
    { header: "Zahlungsart", key: "zahlungsart", width: 20 },
    { header: "Stripe-ID", key: "stripeId", width: 30 },
  ];
  styleHeader(ws.getRow(1));
  for (const z of zeilen) {
    ws.addRow({
      ...z,
      datum: berlinDate(z.datum),
      warenwert: euro(z.warenwert),
      versand: euro(z.versand),
      spende: euro(z.spende),
      brutto: euro(z.brutto),
      gebuehr: euro(z.gebuehr),
      netto: euro(z.netto),
    });
  }
  const last = ws.rowCount;
  const sumRow = ws.addRow({ art: "Summe" });
  for (const col of ["F", "G", "H", "I", "J", "K"]) {
    sumRow.getCell(col).value = last > 1 ? { formula: `SUM(${col}2:${col}${last})` } : 0;
    sumRow.getCell(col).numFmt = EURO;
  }
  sumRow.font = { bold: true };
  sumRow.border = { top: { style: "thin" } };
  ws.autoFilter = { from: "A1", to: `M${Math.max(last, 1)}` };

  // Blatt 2: pro Monat
  const months = MONTHS.map(() => ({ einnahmen: 0, spenden: 0, erstattungen: 0, gebuehren: 0, netto: 0 }));
  for (const z of zeilen) {
    const m = berlinDate(z.datum).getUTCMonth();
    if (z.art === "Erstattung") months[m].erstattungen += z.brutto;
    else months[m].einnahmen += z.brutto;
    months[m].spenden += z.spende;
    months[m].gebuehren += z.gebuehr;
    months[m].netto += z.netto;
  }
  const ov = wb.addWorksheet("Übersicht");
  ov.columns = [
    { header: "Monat", key: "monat", width: 14 },
    { header: "Einnahmen brutto", key: "einnahmen", width: 18, style: { numFmt: EURO } },
    { header: "davon Spenden", key: "spenden", width: 15, style: { numFmt: EURO } },
    { header: "Erstattungen", key: "erstattungen", width: 14, style: { numFmt: EURO } },
    { header: "Einnahmen ohne Spenden, nach Erstattungen", key: "erloese", width: 40, style: { numFmt: EURO } },
    { header: "Stripe-Gebühren (Ausgabe)", key: "gebuehren", width: 24, style: { numFmt: EURO } },
    { header: "Netto (Auszahlung)", key: "netto", width: 18, style: { numFmt: EURO } },
  ];
  styleHeader(ov.getRow(1));
  months.forEach((m, i) => {
    const row = ov.addRow({
      monat: MONTHS[i],
      einnahmen: euro(m.einnahmen),
      spenden: euro(m.spenden),
      erstattungen: euro(m.erstattungen),
      gebuehren: euro(m.gebuehren),
      netto: euro(m.netto),
    });
    row.getCell("erloese").value = { formula: `B${row.number}-C${row.number}+D${row.number}` };
  });
  const total = ov.addRow({ monat: `Summe ${jahr}` });
  for (const col of ["B", "C", "D", "E", "F", "G"]) {
    total.getCell(col).value = { formula: `SUM(${col}2:${col}13)` };
    total.getCell(col).numFmt = EURO;
  }
  total.font = { bold: true };
  total.border = { top: { style: "thin" } };

  // Blatt 3: Hinweise
  const notes = wb.addWorksheet("Hinweise");
  notes.getColumn(1).width = 110;
  [
    `Einnahmen ${jahr} aus Stripe, erstellt am ${new Date(stand * 1000).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}.`,
    "",
    "Datum = Tag der Zahlung bzw. Erstattung in Stripe (deutsche Zeit). Auszahlungen aufs Bankkonto sind nicht aufgeführt, das sind nur Umbuchungen.",
    "Brutto = bezahlter Betrag. Stripe-Gebühr = von Stripe einbehaltene Gebühr. Netto = Brutto minus Gebühr (das, was ausgezahlt wird).",
    "Spenden (Aufrundung im Warenkorb) sind separat ausgewiesen und gehen vollständig an die Sozial-Missionarische Arbeit des EC Deutschlands in Nepal.",
    "Erstattungen stehen mit negativem Betrag am Tag der Erstattung, auch wenn die Bestellung aus einem früheren Jahr stammt.",
    "Rechnungen, die bar oder per Überweisung aufs eigene Konto bezahlt und in Stripe als bezahlt markiert wurden, stehen mit dem Datum der Markierung und ohne Gebühr.",
    "Bar-Einnahmen ohne Stripe-Rechnung und andere Einnahmen sind nicht enthalten.",
    "Bitte die Zuordnung in der EÜR mit der Steuerberatung abstimmen.",
  ].forEach((text) => notes.addRow([text]));
  notes.getRow(1).font = { bold: true };
  notes.getColumn(1).alignment = { wrapText: true, vertical: "top" };

  return wb.xlsx.writeBuffer();
}
