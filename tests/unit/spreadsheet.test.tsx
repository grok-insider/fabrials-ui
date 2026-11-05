import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { deflateRawSync } from "node:zlib";
import { renderToStaticMarkup } from "react-dom/server";
import { cellAddress, cellText, columnName, parseAddress, Spreadsheet } from "@fabrials/ui";
import {
  csvNumber,
  csvToSheet,
  detectDelimiter,
  formatNumber,
  isDateFormat,
  parseCsv,
  parseXml,
  readSpreadsheet,
  readXlsx,
  serialToDate,
  SpreadsheetError,
  unzip,
} from "@fabrials/ui/spreadsheet";

/** A ZIP archive by hand: stored or deflated entries, so both of the reader's paths are exercised. */
function zip(files: Record<string, string>, deflate = true): Uint8Array {
  const encoder = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const nameBytes = encoder.encode(name);
    const raw = encoder.encode(content);
    const data = deflate ? new Uint8Array(deflateRawSync(raw)) : raw;
    const local = new Uint8Array(30 + nameBytes.length + data.length);
    const view = new DataView(local.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(8, deflate ? 8 : 0, true);
    view.setUint32(18, data.length, true);
    view.setUint32(22, raw.length, true);
    view.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    local.set(data, 30 + nameBytes.length);
    const central = new Uint8Array(46 + nameBytes.length);
    const cview = new DataView(central.buffer);
    cview.setUint32(0, 0x02014b50, true);
    cview.setUint16(10, deflate ? 8 : 0, true);
    cview.setUint32(20, data.length, true);
    cview.setUint32(24, raw.length, true);
    cview.setUint16(28, nameBytes.length, true);
    cview.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }
  const centralSize = centrals.reduce((sum, item) => sum + item.length, 0);
  const end = new Uint8Array(22);
  const eview = new DataView(end.buffer);
  eview.setUint32(0, 0x06054b50, true);
  eview.setUint16(8, centrals.length, true);
  eview.setUint16(10, centrals.length, true);
  eview.setUint32(12, centralSize, true);
  eview.setUint32(16, offset, true);
  const out = new Uint8Array(offset + centralSize + 22);
  let at = 0;
  for (const part of [...locals, ...centrals, end]) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

const workbookFiles = (sheet: string, extra: Record<string, string> = {}) => ({
  "xl/workbook.xml": `<?xml version="1.0"?><workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><workbookPr date1904="0"/><sheets><sheet name="Budget" sheetId="1" r:id="rId1"/></sheets></workbook>`,
  "xl/_rels/workbook.xml.rels": `<?xml version="1.0"?><Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>`,
  "xl/sharedStrings.xml": `<sst><si><t>Item</t></si><si><r><t>Rent </t></r><r><t xml:space="preserve">&amp; power</t></r><rPh><t>ignored</t></rPh></si></sst>`,
  "xl/styles.xml": `<styleSheet><numFmts><numFmt numFmtId="164" formatCode="&quot;$&quot;#,##0.00"/></numFmts><cellXfs><xf numFmtId="0"/><xf numFmtId="164"/><xf numFmtId="14"/><xf numFmtId="10"/></cellXfs></styleSheet>`,
  "xl/worksheets/sheet1.xml": sheet,
  ...extra,
});

test("addresses: column letters both ways, and A1 notation", () => {
  assert.deepEqual([0, 25, 26, 27, 701, 702].map(columnName), ["A", "Z", "AA", "AB", "ZZ", "AAA"]);
  assert.equal(cellAddress(3, 1), "B4");
  assert.deepEqual(parseAddress("$AB$12"), { row: 11, column: 27 });
  assert.equal(parseAddress("12AB"), undefined);
});

test("CSV: quotes, doubled quotes, line breaks in a field, the delimiter found, numbers kept as written", () => {
  assert.deepEqual(parseCsv('a,"b ""q""",c\n1,"two\nlines",3\r\n'), [["a", 'b "q"', "c"], ["1", "two\nlines", "3"]]);
  assert.equal(detectDelimiter("a;b;c\n1;2;3"), ";");
  assert.equal(detectDelimiter("a\tb\n1\t2"), "\t");
  assert.equal(csvNumber("1,234.5"), 1234.5);
  assert.equal(csvNumber("007"), undefined);
  assert.equal(csvNumber("12345678901234567"), undefined);
  assert.equal(csvNumber("1.234,5", ";"), 1234.5);
  const sheet = csvToSheet("\uFEFFname;amount\nNorth;1.234,50\nHarbour;", "usage");
  assert.equal(sheet.name, "usage");
  assert.deepEqual(sheet.rows[1]![1], { value: 1234.5, text: "1.234,50" });
  assert.equal(sheet.rows[2]![1], undefined);
});

test("XML: names lose their prefix, entities decode, attributes keep both names", () => {
  const root = parseXml(`<?xml version="1.0"?><x:c r="A1" t="s"><x:v>&lt;3 &#x41;&#66;</x:v><![CDATA[<raw>]]></x:c>`);
  const cell = root.children[0]!;
  assert.equal(cell.name, "c");
  assert.equal(cell.attrs.r, "A1");
  assert.equal(cell.children[0]!.text, "<3 AB");
  assert.equal(cell.text, "<raw>");
});

test("formats: dates are found, numbers follow decimals, grouping, percent, currency and exponents", () => {
  assert.equal(isDateFormat("yyyy-mm-dd"), true);
  assert.equal(isDateFormat("[$-409]d-mmm-yy;@"), true);
  assert.equal(isDateFormat("[h]:mm:ss"), true);
  assert.equal(isDateFormat("#,##0.00"), false);
  assert.equal(isDateFormat('0.00 "days"'), false);
  assert.equal(formatNumber(1234.5, "#,##0.00", "en-GB"), "1,234.50");
  assert.equal(formatNumber(0.125, "0.0%", "en-GB"), "12.5%");
  assert.equal(formatNumber(-1234.5, "#,##0.00;(#,##0.00)", "en-GB"), "(1,234.50)");
  assert.equal(formatNumber(1234.5, '"$"#,##0.00', "en-GB"), "$1,234.50");
  assert.equal(formatNumber(1234.5, "[$€-2] #,##0.00", "en-GB"), "€1,234.50");
  assert.equal(formatNumber(12345, "0.00E+00", "en-GB"), "1.23E+04");
  assert.equal(serialToDate(46027).toISOString().slice(0, 10), "2026-01-05");
  assert.equal(serialToDate(59).toISOString().slice(0, 10), "1900-02-28");
  assert.equal(serialToDate(0, true).toISOString().slice(0, 10), "1904-01-01");
});

test("XLSX by hand: shared and rich strings, styles, a formula's cached result, errors, booleans, gaps, deflated and stored", async () => {
  const sheet = `<worksheet><sheetViews><sheetView><pane xSplit="1" ySplit="1" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="20" customWidth="1"/></cols><sheetData>
    <row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1" t="inlineStr"><is><t>Due</t></is></c></row>
    <row r="2"><c r="A2" t="s"><v>1</v></c><c r="B2" s="1"><v>1234.5</v></c><c r="C2" s="2"><v>46027</v></c><c r="D2" s="3"><v>0.125</v></c></row>
    <row r="4"><c r="A4" t="b"><v>1</v></c><c r="B4" s="1"><f>SUM(B2:B3)</f><v>1234.5</v></c><c r="C4" t="e"><f>1/0</f><v>#DIV/0!</v></c><c r="D4" t="str"><f>"x"&amp;"y"</f><v>xy</v></c></row>
  </sheetData><mergeCells count="1"><mergeCell ref="A6:C6"/></mergeCells></worksheet>`;
  for (const deflate of [true, false]) {
    const book = await readXlsx(zip(workbookFiles(sheet), deflate), { locale: "en-GB" });
    const budget = book.sheets[0]!;
    assert.equal(budget.name, "Budget");
    assert.equal(cellText(budget.rows[0]![0]), "Item");
    assert.equal(cellText(budget.rows[0]![2]), "Due");
    assert.equal(cellText(budget.rows[1]![0]), "Rent & power");
    assert.deepEqual(budget.rows[1]![1], { value: 1234.5, text: "$1,234.50" });
    assert.equal(cellText(budget.rows[1]![2]), "5 Jan 2026");
    assert.equal(cellText(budget.rows[1]![3]), "12.50%");
    assert.equal(budget.rows[2]!.length, 0);
    assert.deepEqual(budget.rows[3]![0], { value: true });
    assert.deepEqual(budget.rows[3]![1], { value: 1234.5, text: "$1,234.50", formula: "SUM(B2:B3)" });
    assert.deepEqual(budget.rows[3]![2], { value: null, error: "#DIV/0!", formula: "1/0" });
    assert.equal(cellText(budget.rows[3]![3]), "xy");
    assert.equal(budget.columnWidths?.[0], 145);
    assert.deepEqual(budget.merges, [{ top: 5, left: 0, bottom: 5, right: 2 }]);
    assert.deepEqual(budget.frozen, { rows: 1, columns: 1 });
  }
});

test("a workbook made by another program (openpyxl) reads: visible sheets only, formats, dates, merges, frozen panes", async () => {
  const book = await readXlsx(readFileSync(new URL("../fixtures/workbook.xlsx", import.meta.url)), { locale: "en-GB" });
  assert.deepEqual(book.sheets.map((sheet) => sheet.name), ["Usage", "Notes"]);
  const usage = book.sheets[0]!;
  assert.equal(cellText(usage.rows[0]![0]), "Account");
  assert.equal(cellText(usage.rows[1]![1]), "41,250");
  assert.equal(cellText(usage.rows[1]![2]), "€1,234.50");
  assert.equal(cellText(usage.rows[1]![3]), "42.0%");
  assert.equal(cellText(usage.rows[1]![4]), "15 Jan 2026");
  assert.equal(cellText(usage.rows[3]![5]), "FALSE");
  assert.equal((usage.rows[5]![1] as { formula?: string }).formula, "SUM(B2:B4)");
  assert.deepEqual(usage.merges, [{ top: 7, left: 0, bottom: 7, right: 2 }]);
  assert.deepEqual(usage.frozen, { rows: 1, columns: 1 });
  assert.ok((usage.columnWidths?.[0] ?? 0) > 150);
  assert.equal(cellText(book.sheets[1]!.rows[0]![0]), "Ünïcode & <tags> are text");
});

test("files: XLSX by signature, CSV by default, an old .xls refused with a reason, a broken ZIP refused", async () => {
  const xlsx = await readSpreadsheet(new Blob([readFileSync(new URL("../fixtures/workbook.xlsx", import.meta.url))]));
  assert.equal(xlsx.sheets.length, 2);
  const csv = await readSpreadsheet(new File(["a,b\n1,2"], "export.csv"));
  assert.equal(csv.sheets[0]!.name, "export");
  await assert.rejects(readSpreadsheet(new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0, 0])), (error) => error instanceof SpreadsheetError && error.code === "unsupported");
  await assert.rejects(readXlsx(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3])), (error) => error instanceof SpreadsheetError && error.code === "corrupt");
  const files = await unzip(zip({ "a.txt": "hello", "b.txt": "world" }), (name) => name === "b.txt");
  assert.deepEqual([...files.keys()], ["b.txt"]);
});

test("the viewer: a read-only grid with letters, row numbers, the address bar, tabs, and only a window of a large sheet", () => {
  const rows = Array.from({ length: 5000 }, (_, row) => [`Row ${row + 1}`, row * 3, row % 2 === 0]);
  const html = renderToStaticMarkup(
    <Spreadsheet
      aria-label="Usage export"
      workbook={{ sheets: [{ name: "Usage", rows, merges: [{ top: 0, left: 0, bottom: 0, right: 1 }] }, { name: "Notes", rows: [["n"]] }] }}
      height={300}
    />,
  );
  assert.match(html, /role="grid" aria-label="Usage export, Usage" aria-readonly="true" aria-rowcount="5001" aria-colcount="4"/);
  assert.match(html, /<span class="fui-spreadsheet-address">A1<\/span>/);
  assert.match(html, /role="columnheader" aria-colindex="2"[^>]*>A</);
  assert.match(html, /role="rowheader" aria-colindex="1"[^>]*>1</);
  assert.ok((html.match(/role="row"/g)?.length ?? 0) < 60);
  assert.match(html, /data-kind="number"[^>]*>3</);
  assert.match(html, /data-kind="boolean"[^>]*>TRUE</);
  assert.match(html, /data-merged=""/);
  assert.match(html, /role="tablist" aria-label="Sheets"/);
  assert.match(html, /role="tab" aria-selected="true"/);
  const empty = renderToStaticMarkup(<Spreadsheet workbook={{ sheets: [{ name: "Blank", rows: [] }] }} />);
  assert.match(empty, /This sheet is empty\./);
});
