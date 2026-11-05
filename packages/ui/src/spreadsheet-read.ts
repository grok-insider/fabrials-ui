/**
 * Reads CSV and XLSX files into the workbook the Spreadsheet viewer shows, with nothing but the browser: the ZIP container
 * is read by hand and inflated with DecompressionStream, and the SpreadsheetML is read by a small XML reader. What it reads:
 * values, shared and inline strings, formula results (not formulas' recalculation), dates in both date systems, the common
 * number formats, several sheets (hidden ones are left out), column widths, merged cells and frozen panes. What it does
 * not: the old binary .xls, .ods, password-protected workbooks, charts, pictures, styles and conditional formats.
 * Import it from "@fabrials/ui/spreadsheet".
 */

import type { Worksheet, SheetCell, SheetMerge, Workbook } from "./spreadsheet-data";
import { parseAddress } from "./spreadsheet-data";

export type { CellValue, Worksheet, SheetCell, SheetMerge, Workbook } from "./spreadsheet-data";

export class SpreadsheetError extends Error {
  constructor(
    readonly code: "unsupported" | "corrupt" | "too-large",
    message: string,
  ) {
    super(message);
    this.name = "SpreadsheetError";
  }
}

// ------------------------------------------------------------------ CSV

/** Splits CSV or TSV text into rows of fields (RFC 4180: quoted fields, doubled quotes, line breaks inside quotes). */
export function parseCsv(text: string, delimiter = detectDelimiter(text)): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index]!;
    if (quoted) {
      if (char === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index += 1;
        } else quoted = false;
      } else field += char;
    } else if (char === '"' && field === "") quoted = true;
    else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** The delimiter of the first lines: comma, semicolon, tab or pipe, whichever splits them most consistently. */
export function detectDelimiter(text: string): string {
  const lines = text.split(/\r?\n/, 6).filter(Boolean);
  let best = ",";
  let bestScore = -1;
  for (const candidate of [",", ";", "\t", "|"]) {
    const counts = lines.map((line) => {
      let count = 0;
      let quoted = false;
      for (const char of line) {
        if (char === '"') quoted = !quoted;
        else if (char === candidate && !quoted) count += 1;
      }
      return count;
    });
    const first = counts[0] ?? 0;
    const score = first === 0 ? 0 : counts.every((count) => count === first) ? first * 2 : first;
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

const PLAIN_NUMBER = /^[-+]?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?(?:[eE][-+]?\d+)?$|^[-+]?\.\d+$/;
const DECIMAL_COMMA = /^[-+]?(?:\d+|\d{1,3}(?:\.\d{3})+),\d+$/;

/** A field as a number when it plainly is one; identifiers with leading zeros and long digit strings stay text. */
export function csvNumber(field: string, delimiter = ","): number | undefined {
  const trimmed = field.trim();
  if (!trimmed || /^[-+]?0\d/.test(trimmed) || trimmed.replace(/\D/g, "").length > 15) return undefined;
  if (PLAIN_NUMBER.test(trimmed)) return Number(trimmed.replace(/,/g, ""));
  if (delimiter === ";" && DECIMAL_COMMA.test(trimmed)) return Number(trimmed.replace(/\./g, "").replace(",", "."));
  return undefined;
}

/** A CSV or TSV text as one sheet: numbers become numbers (shown as written), everything else stays text. */
export function csvToSheet(text: string, name = "Sheet 1"): Worksheet {
  const delimiter = detectDelimiter(text);
  const rows = parseCsv(text, delimiter).map((row) =>
    row.map((field): SheetCell | undefined => {
      if (field === "") return undefined;
      const number = csvNumber(field, delimiter);
      return number === undefined ? { value: field } : { value: number, text: field.trim() };
    }),
  );
  return { name, rows };
}

// ------------------------------------------------------------------ ZIP

const u16 = (bytes: Uint8Array, at: number) => bytes[at]! | (bytes[at + 1]! << 8);
const u32 = (bytes: Uint8Array, at: number) => (bytes[at]! | (bytes[at + 1]! << 8) | (bytes[at + 2]! << 16) | (bytes[at + 3]! << 24)) >>> 0;

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") throw new SpreadsheetError("unsupported", "This browser cannot decompress the workbook.");
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** The files of a ZIP archive whose names pass `wanted`, decompressed. */
export async function unzip(bytes: Uint8Array, wanted: (name: string) => boolean = () => true): Promise<Map<string, Uint8Array>> {
  let end = -1;
  for (let at = bytes.length - 22; at >= Math.max(0, bytes.length - 65_557); at -= 1)
    if (u32(bytes, at) === 0x06054b50) {
      end = at;
      break;
    }
  if (end < 0) throw new SpreadsheetError("corrupt", "The file is not a workbook (no ZIP directory).");
  const count = u16(bytes, end + 10);
  let at = u32(bytes, end + 16);
  if (at === 0xffffffff) throw new SpreadsheetError("too-large", "The workbook is too large to open here.");
  const files = new Map<string, Uint8Array>();
  const decoder = new TextDecoder();
  for (let entry = 0; entry < count; entry += 1) {
    if (u32(bytes, at) !== 0x02014b50) throw new SpreadsheetError("corrupt", "The workbook's ZIP directory is damaged.");
    const method = u16(bytes, at + 10);
    const size = u32(bytes, at + 20);
    const nameLength = u16(bytes, at + 28);
    const skip = nameLength + u16(bytes, at + 30) + u16(bytes, at + 32);
    const local = u32(bytes, at + 42);
    const name = decoder.decode(bytes.subarray(at + 46, at + 46 + nameLength));
    at += 46 + skip;
    if (!wanted(name)) continue;
    if (size === 0xffffffff || local === 0xffffffff) throw new SpreadsheetError("too-large", "The workbook is too large to open here.");
    const start = local + 30 + u16(bytes, local + 26) + u16(bytes, local + 28);
    const data = bytes.subarray(start, start + size);
    if (method === 0) files.set(name, data);
    else if (method === 8) files.set(name, await inflate(data));
    else throw new SpreadsheetError("unsupported", "The workbook uses a compression this reader does not know.");
  }
  return files;
}

// ------------------------------------------------------------------ XML

export type XmlNode = { name: string; attrs: Record<string, string>; children: XmlNode[]; text: string };

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const decodeEntities = (text: string) =>
  text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, code: string) =>
    code[0] === "#" ? String.fromCodePoint(code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : Number(code.slice(1))) : ENTITIES[code.toLowerCase()]!,
  );
const local = (name: string) => name.slice(name.indexOf(":") + 1);

/** A small XML reader for machine-written files: elements, attributes, text, CDATA and entities; names lose their prefix. */
export function parseXml(xml: string): XmlNode {
  const root: XmlNode = { name: "#document", attrs: {}, children: [], text: "" };
  const stack = [root];
  const pattern = /<!\[CDATA\[([\s\S]*?)\]\]>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<(\/?)([^\s/>]+)((?:\s+[^\s=/>]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
  for (const match of xml.matchAll(pattern)) {
    const top = stack[stack.length - 1]!;
    if (match[1] !== undefined) top.text += match[1];
    else if (match[3] !== undefined) {
      if (match[2] === "/") {
        if (stack.length > 1) stack.pop();
        continue;
      }
      const attrs: Record<string, string> = {};
      for (const attr of match[4]!.matchAll(/([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
        const value = decodeEntities(attr[2] ?? attr[3] ?? "");
        attrs[attr[1]!] = value;
        if (!(local(attr[1]!) in attrs)) attrs[local(attr[1]!)] = value;
      }
      const node: XmlNode = { name: local(match[3]), attrs, children: [], text: "" };
      top.children.push(node);
      if (match[5] !== "/") stack.push(node);
    } else if (match[6] !== undefined) top.text += decodeEntities(match[6]);
  }
  return root;
}

const child = (node: XmlNode | undefined, name: string) => node?.children.find((item) => item.name === name);
const children = (node: XmlNode | undefined, name: string) => node?.children.filter((item) => item.name === name) ?? [];
function find(node: XmlNode | undefined, name: string): XmlNode | undefined {
  if (!node) return undefined;
  for (const item of node.children) {
    if (item.name === name) return item;
    const deeper = find(item, name);
    if (deeper) return deeper;
  }
  return undefined;
}
/** The text of every `t` below a node, leaving out phonetic runs (`rPh`). */
function runText(node: XmlNode | undefined): string {
  if (!node) return "";
  if (node.name === "t") return node.text;
  if (node.name === "rPh") return "";
  return node.children.map(runText).join("");
}

// ------------------------------------------------------------------ number formats

const BUILT_IN_FORMATS: Record<number, string> = {
  0: "General",
  1: "0",
  2: "0.00",
  3: "#,##0",
  4: "#,##0.00",
  9: "0%",
  10: "0.00%",
  11: "0.00E+00",
  12: "# ?/?",
  13: "# ??/??",
  14: "yyyy-mm-dd",
  15: "d-mmm-yy",
  16: "d-mmm",
  17: "mmm-yy",
  18: "h:mm AM/PM",
  19: "h:mm:ss AM/PM",
  20: "h:mm",
  21: "h:mm:ss",
  22: "yyyy-mm-dd h:mm",
  37: "#,##0 ;(#,##0)",
  38: "#,##0 ;[Red](#,##0)",
  39: "#,##0.00;(#,##0.00)",
  40: "#,##0.00;[Red](#,##0.00)",
  45: "mm:ss",
  46: "[h]:mm:ss",
  47: "mmss.0",
  48: "##0.0E+0",
  49: "@",
};

/** Whether a number format shows dates or times (d, m, y, h or s outside quotes, brackets and escapes). */
export function isDateFormat(code: string): boolean {
  const bare = code
    .split(";")[0]!
    .replace(/"[^"]*"/g, "")
    .replace(/\\./g, "")
    .replace(/\[(?![hms]+\])[^\]]*\]/gi, "")
    .replace(/General/gi, "");
  return /[dmyhs]/i.test(bare) && !/[0#?]/.test(bare.replace(/\.0+/, ""));
}

/** A number as the format code shows it, for the common codes: decimals, grouping, percent, currency, exponent. */
export function formatNumber(value: number, code: string, locale?: string): string {
  const sections = code.split(";");
  const section = (value < 0 && sections[1] ? sections[1] : sections[0]) ?? "General";
  if (/^General$/i.test(section.trim()) || section.trim() === "") return new Intl.NumberFormat(locale, { maximumSignificantDigits: 11, useGrouping: false }).format(value);
  if (section.trim() === "@") return String(value);
  const literal = section.replace(/"([^"]*)"/g, "$1").replace(/\\(.)/g, "$1");
  const currency = /\[\$([^\]-]*)[^\]]*\]/.exec(literal)?.[1] ?? /[$€£¥₹]/.exec(literal)?.[0] ?? "";
  const pattern = literal.replace(/\[[^\]]*\]/g, "").replace(/[$€£¥₹]/g, "");
  const decimals = /\.([0#?]+)/.exec(pattern)?.[1]?.length ?? 0;
  const percent = pattern.includes("%");
  const negativeInParentheses = value < 0 && sections[1] !== undefined && /\(/.test(sections[1]);
  const shown = (negativeInParentheses ? Math.abs(value) : value) * (percent ? 100 : 1);
  let text: string;
  if (/E[+-]/i.test(pattern)) text = shown.toExponential(decimals).toUpperCase().replace(/E\+?(-?)(\d)$/, "E+$10$2").replace("E+-", "E-");
  else
    text = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: /[#0],[#0]/.test(pattern),
    }).format(shown);
  if (percent) text += "%";
  if (currency) text = literal.indexOf(currency) <= literal.search(/[0#?]/) ? `${currency}${text}` : `${text} ${currency}`;
  return negativeInParentheses ? `(${text})` : text;
}

/** An Excel serial date as a UTC Date (the 1900 system, or 1904 when the workbook says so). */
export function serialToDate(serial: number, date1904 = false): Date {
  const days = date1904 ? serial + 1462 : serial < 60 ? serial + 1 : serial;
  return new Date(Math.round((days - 25569) * 86_400_000));
}

function formatDate(date: Date, code: string, locale?: string): string {
  const bare = code.replace(/"[^"]*"/g, "").replace(/\[[^\]]*\]/g, "");
  const hasDate = /[dy]/i.test(bare) || /m{3,}/i.test(bare) || (/m/i.test(bare) && !/[hs]/i.test(bare));
  const hasTime = /[hs]/i.test(bare);
  const seconds = /s/i.test(bare);
  const options: Intl.DateTimeFormatOptions = { timeZone: "UTC" };
  if (hasDate) options.dateStyle = "medium";
  if (hasTime) options.timeStyle = seconds ? "medium" : "short";
  if (!hasDate && !hasTime) options.dateStyle = "medium";
  return new Intl.DateTimeFormat(locale, options).format(date);
}

// ------------------------------------------------------------------ XLSX

const columnWidth = (characters: number) => Math.round(characters * 7 + 5);

function resolveTarget(target: string) {
  const path = target.startsWith("/") ? target.slice(1) : `xl/${target}`;
  const parts: string[] = [];
  for (const part of path.split("/")) {
    if (part === "..") parts.pop();
    else if (part !== ".") parts.push(part);
  }
  return parts.join("/");
}

export type ReadOptions = {
  /** For formatted numbers and dates. */
  locale?: string;
  /** Cells read per sheet before the rest is cut (the sheet is marked `truncated`). */
  maxCells?: number;
};

/** Reads an .xlsx (or .xlsm) workbook. Throws a SpreadsheetError the host can say in words. */
export async function readXlsx(data: ArrayBuffer | Uint8Array, { locale, maxCells = 1_000_000 }: ReadOptions = {}): Promise<Workbook & { sheets: (Worksheet & { truncated?: boolean })[] }> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const files = await unzip(bytes, (name) => /^xl\/(workbook\.xml|_rels\/workbook\.xml\.rels|sharedStrings\.xml|styles\.xml|worksheets\/[^/]+\.xml)$/i.test(name));
  const text = (name: string) => {
    const file = files.get(name);
    return file ? new TextDecoder().decode(file) : undefined;
  };
  const workbookXml = text("xl/workbook.xml");
  if (!workbookXml) throw new SpreadsheetError("corrupt", "The file is a ZIP archive but not a workbook.");
  const workbook = parseXml(workbookXml);
  const date1904 = ["1", "true"].includes(find(workbook, "workbookPr")?.attrs.date1904 ?? "");
  const relations = new Map(children(child(parseXml(text("xl/_rels/workbook.xml.rels") ?? ""), "Relationships"), "Relationship").map((rel) => [rel.attrs.Id ?? "", resolveTarget(rel.attrs.Target ?? "")]));
  const shared = children(child(parseXml(text("xl/sharedStrings.xml") ?? ""), "sst"), "si").map(runText);
  const styles = parseXml(text("xl/styles.xml") ?? "");
  const customFormats = new Map(children(find(styles, "numFmts"), "numFmt").map((format) => [Number(format.attrs.numFmtId), format.attrs.formatCode ?? "General"]));
  const styleFormats = children(find(styles, "cellXfs"), "xf").map((xf) => {
    const id = Number(xf.attrs.numFmtId ?? 0);
    return customFormats.get(id) ?? BUILT_IN_FORMATS[id] ?? "General";
  });

  const sheets: (Worksheet & { truncated?: boolean })[] = [];
  for (const entry of children(find(workbook, "sheets"), "sheet")) {
    if (entry.attrs.state === "hidden" || entry.attrs.state === "veryHidden") continue;
    const path = relations.get(entry.attrs["r:id"] ?? entry.attrs.id ?? "");
    const xml = path ? text(path) : undefined;
    if (!xml) continue;
    const sheet = parseXml(xml);
    const rows: (SheetCell | undefined)[][] = [];
    let cells = 0;
    let truncated = false;
    let rowIndex = -1;
    for (const row of children(find(sheet, "sheetData"), "row")) {
      rowIndex = row.attrs.r ? Number(row.attrs.r) - 1 : rowIndex + 1;
      let columnIndex = -1;
      for (const cell of children(row, "c")) {
        const at = cell.attrs.r ? parseAddress(cell.attrs.r) : undefined;
        columnIndex = at ? at.column : columnIndex + 1;
        const raw = child(cell, "v")?.text;
        const formula = child(cell, "f")?.text || undefined;
        const type = cell.attrs.t ?? "n";
        const format = styleFormats[Number(cell.attrs.s ?? 0)] ?? "General";
        let value: SheetCell | undefined;
        if (type === "s") value = { value: shared[Number(raw)] ?? "" };
        else if (type === "inlineStr") value = { value: runText(child(cell, "is")) };
        else if (type === "str") value = { value: raw ?? "" };
        else if (type === "b") value = { value: raw === "1" };
        else if (type === "e") value = { value: null, error: raw ?? "#ERROR!" };
        else if (type === "d" && raw) {
          const date = new Date(raw.endsWith("Z") || /[+-]\d\d:\d\d$/.test(raw) ? raw : `${raw}Z`);
          value = { value: date, text: formatDate(date, format, locale) };
        } else if (raw !== undefined && raw !== "") {
          const number = Number(raw);
          if (isDateFormat(format)) {
            const date = serialToDate(number, date1904);
            value = { value: date, text: formatDate(date, format, locale) };
          } else value = { value: number, text: formatNumber(number, format, locale) };
        }
        if (!value && formula) value = { value: null };
        if (!value) continue;
        if (formula) value.formula = formula;
        if (cells >= maxCells) {
          truncated = true;
          break;
        }
        (rows[rowIndex] ??= [])[columnIndex] = value;
        cells += 1;
      }
      if (truncated) break;
    }
    for (let index = 0; index < rows.length; index += 1) rows[index] ??= [];
    const columnWidths: (number | undefined)[] = [];
    for (const column of children(find(sheet, "cols"), "col")) {
      if (column.attrs.width === undefined) continue;
      const from = Number(column.attrs.min ?? 1) - 1;
      const to = Math.min(Number(column.attrs.max ?? from + 1), from + 512);
      const width = column.attrs.hidden === "1" ? 0 : columnWidth(Number(column.attrs.width));
      for (let index = from; index < to; index += 1) columnWidths[index] = width;
    }
    const merges: SheetMerge[] = children(find(sheet, "mergeCells"), "mergeCell").flatMap((merge) => {
      const [first, last] = (merge.attrs.ref ?? "").split(":");
      const start = first ? parseAddress(first) : undefined;
      const end = last ? parseAddress(last) : start;
      return start && end ? [{ top: start.row, left: start.column, bottom: end.row, right: end.column }] : [];
    });
    const pane = find(sheet, "pane");
    const frozen = pane && pane.attrs.state?.startsWith("frozen") ? { rows: Number(pane.attrs.ySplit ?? 0) || undefined, columns: Number(pane.attrs.xSplit ?? 0) || undefined } : undefined;
    sheets.push({ name: entry.attrs.name ?? `Sheet ${sheets.length + 1}`, rows, columnWidths, merges, frozen, truncated: truncated || undefined });
  }
  if (sheets.length === 0) throw new SpreadsheetError("corrupt", "The workbook has no sheets to show.");
  return { sheets };
}

function decodeText(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

/**
 * A file people chose (a File or Blob, or its bytes) as a workbook: an .xlsx by its ZIP signature, an old .xls or a
 * protected workbook refused with a reason, anything else read as CSV or TSV text.
 */
export async function readSpreadsheet(input: Blob | ArrayBuffer | Uint8Array, options: ReadOptions & { name?: string } = {}): Promise<Workbook> {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input instanceof Blob ? await input.arrayBuffer() : input);
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) return readXlsx(bytes, options);
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0)
    throw new SpreadsheetError("unsupported", "This is an old .xls file or a password-protected workbook. Save it as .xlsx or CSV to open it here.");
  const name = (options.name ?? (input instanceof File ? input.name : "Sheet 1")).replace(/\.(csv|tsv|txt)$/i, "");
  return { sheets: [csvToSheet(decodeText(bytes), name)] };
}
