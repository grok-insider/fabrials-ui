/**
 * The data a spreadsheet viewer shows, shared by the viewer and the readers (`@fabrials/ui/spreadsheet`). A workbook is
 * sheets of rows of cells; a cell keeps its value and, when the file said how to show it, the text it showed.
 */

export type CellValue = string | number | boolean | Date | null;

export type SheetCell = {
  value: CellValue;
  /** How the file shows the value (a formatted number or date). The viewer formats it itself when absent. */
  text?: string;
  /** The formula, without "=", when the value is a formula's last result. */
  formula?: string;
  /** An error such as #DIV/0! or #REF!. */
  error?: string;
};

export type SheetMerge = { top: number; left: number; bottom: number; right: number };

export type Worksheet = {
  name: string;
  /** Rows of cells; a cell may be a bare value. Missing cells are empty. */
  rows: (SheetCell | CellValue | undefined)[][];
  /** Column widths in CSS pixels, by index. */
  columnWidths?: (number | undefined)[];
  merges?: SheetMerge[];
  /** Rows and columns that stay in view (the file's frozen panes). */
  frozen?: { rows?: number; columns?: number };
};

export type Workbook = { sheets: Worksheet[] };

/** A, B, …, Z, AA, AB, … for a zero-based column index. */
export function columnName(index: number): string {
  let name = "";
  for (let rest = index + 1; rest > 0; rest = Math.floor((rest - 1) / 26)) name = String.fromCharCode(65 + ((rest - 1) % 26)) + name;
  return name;
}

/** "B4" for row 3, column 1 (both zero-based). */
export const cellAddress = (row: number, column: number) => `${columnName(column)}${row + 1}`;

/** Row and column (zero-based) of an address such as "AB12"; undefined for anything else. */
export function parseAddress(address: string): { row: number; column: number } | undefined {
  const match = /^\$?([A-Z]{1,3})\$?(\d{1,7})$/i.exec(address.trim());
  if (!match) return undefined;
  let column = 0;
  for (const letter of match[1]!.toUpperCase()) column = column * 26 + (letter.charCodeAt(0) - 64);
  return { row: Number(match[2]) - 1, column: column - 1 };
}

export const asCell = (cell: SheetCell | CellValue | undefined): SheetCell | undefined =>
  cell === undefined || cell === null ? undefined : typeof cell === "object" && !(cell instanceof Date) ? cell : { value: cell };

/** The text a cell shows: the file's own text, else the value formatted for the locale. */
export function cellText(cell: SheetCell | CellValue | undefined, locale?: Intl.LocalesArgument): string {
  const own = asCell(cell);
  if (!own) return "";
  if (own.error) return own.error;
  if (own.text !== undefined) return own.text;
  const value = own.value;
  if (value === null) return "";
  if (typeof value === "number") return new Intl.NumberFormat(locale, { maximumFractionDigits: 10, useGrouping: false }).format(value);
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (value instanceof Date) {
    const midnight = value.getUTCHours() === 0 && value.getUTCMinutes() === 0 && value.getUTCSeconds() === 0;
    return new Intl.DateTimeFormat(locale, midnight ? { dateStyle: "medium", timeZone: "UTC" } : { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(value);
  }
  return value;
}

/** What kind of value a cell holds, for its alignment: numbers and dates to the end, booleans centred, text to the start. */
export function cellKind(cell: SheetCell | CellValue | undefined): "empty" | "text" | "number" | "boolean" | "date" | "error" {
  const own = asCell(cell);
  if (!own || own.value === null || own.value === "") return own?.error ? "error" : "empty";
  if (own.error) return "error";
  if (typeof own.value === "number") return "number";
  if (typeof own.value === "boolean") return "boolean";
  if (own.value instanceof Date) return "date";
  return "text";
}
