"use client";
// Origin: Fabrials, 0.10. A read-only spreadsheet: column letters and row numbers that stay in view, the file's frozen
// rows and columns, merged cells, a bar with the active cell's address and contents, sheet tabs, and only the cells on
// screen drawn, so a sheet of a hundred thousand rows scrolls like a short one. Files are read by "@fabrials/ui/spreadsheet".

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { asCell, cellAddress, cellKind, cellText, columnName, type Worksheet, type SheetCell, type SheetMerge, type Workbook } from "./spreadsheet-data";
import { useCopy } from "./use-copy";
import { useLabels, useLocale } from "./labels";
import { classes } from "./shared";

export type SpreadsheetLabels = {
  sheets: string;
  empty: string;
  truncated: string;
  copied: (address: string) => string;
};

const LABELS: SpreadsheetLabels = {
  sheets: "Sheets",
  empty: "This sheet is empty.",
  truncated: "The sheet is longer than this viewer reads; only its first part is shown.",
  copied: (address) => `${address} copied`,
};

export type SpreadsheetProps = Omit<ComponentProps<"div">, "children"> & {
  workbook: Workbook;
  /** The sheet on show (an index). */
  sheet?: number;
  defaultSheet?: number;
  onSheetChange?: (index: number) => void;
  /** For numbers and dates the file did not format; "en" unless a `LabelsProvider` says otherwise. */
  locale?: Intl.LocalesArgument;
  /** The grid's height: a CSS length or px. */
  height?: number | string;
  rowHeight?: number;
  /** For columns the file gives no width. */
  columnWidth?: number;
  labels?: Partial<SpreadsheetLabels>;
};

const HEADER_HEIGHT = 28;
const ROW_HEADER_WIDTH = 48;
const OVERSCAN = 4;

function bisect(offsets: number[], value: number) {
  let low = 0;
  let high = offsets.length - 2;
  while (low < high) {
    const middle = (low + high + 1) >> 1;
    if (offsets[middle]! <= value) low = middle;
    else high = middle - 1;
  }
  return Math.max(0, low);
}

type Merges = { anchors: Map<string, SheetMerge>; covered: Map<string, SheetMerge> };

function mergeMaps(merges: SheetMerge[] | undefined): Merges {
  const anchors = new Map<string, SheetMerge>();
  const covered = new Map<string, SheetMerge>();
  for (const merge of merges ?? []) {
    anchors.set(`${merge.top}:${merge.left}`, merge);
    for (let row = merge.top; row <= merge.bottom && row - merge.top < 500; row += 1)
      for (let column = merge.left; column <= merge.right && column - merge.left < 200; column += 1)
        if (row !== merge.top || column !== merge.left) covered.set(`${row}:${column}`, merge);
  }
  return { anchors, covered };
}

/**
 * A workbook on screen, read-only. The grid is one tab stop: arrows move the active cell, Home and End go to the row's
 * ends (with Ctrl, the sheet's), Page Up and Page Down move a screen, Ctrl+C copies the cell. The bar above says where you
 * are and what the cell holds (its formula, when it has one); the tabs below change the sheet.
 */
export function Spreadsheet({
  workbook,
  sheet: sheetProp,
  defaultSheet = 0,
  onSheetChange,
  locale: ownLocale,
  height = 420,
  rowHeight = 28,
  columnWidth = 96,
  labels,
  className,
  style,
  "aria-label": ariaLabel,
  ...props
}: SpreadsheetProps) {
  const text = useLabels("spreadsheet", LABELS, labels);
  const locale = useLocale(ownLocale);
  const id = useId();
  const [ownSheet, setOwnSheet] = useState(defaultSheet);
  const index = Math.min(Math.max(sheetProp ?? ownSheet, 0), Math.max(workbook.sheets.length - 1, 0));
  const sheet: Worksheet | undefined = workbook.sheets[index];
  const scroller = useRef<HTMLDivElement | null>(null);
  const [view, setView] = useState({ left: 0, top: 0, width: 960, height: 420 });
  const [active, setActive] = useState({ row: 0, column: 0 });
  const [announce, setAnnounce] = useState("");
  const copyCell = useCopy();

  const rowCount = Math.max(sheet?.rows.length ?? 0, 1);
  const columnCount = useMemo(() => Math.max(1, ...(sheet?.rows ?? []).map((row) => row?.length ?? 0), ...(sheet?.merges ?? []).map((merge) => merge.right + 1)), [sheet]);
  const empty = !sheet || sheet.rows.every((row) => !row || row.every((cell) => cellKind(cell) === "empty"));
  const frozenRows = Math.min(sheet?.frozen?.rows ?? 0, rowCount - 1, 20);
  const frozenColumns = Math.min(sheet?.frozen?.columns ?? 0, columnCount - 1, 10);
  const widths = useMemo(() => Array.from({ length: columnCount }, (_, column) => sheet?.columnWidths?.[column] ?? columnWidth), [sheet, columnCount, columnWidth]);
  const left = useMemo(() => {
    const out = [0];
    for (const width of widths) out.push(out[out.length - 1]! + width);
    return out;
  }, [widths]);
  const merges = useMemo(() => mergeMaps(sheet?.merges), [sheet]);
  const frozenWidth = left[frozenColumns]!;
  const stickyWidth = ROW_HEADER_WIDTH + frozenWidth;
  const stickyHeight = HEADER_HEIGHT + frozenRows * rowHeight;
  const totalWidth = ROW_HEADER_WIDTH + left[columnCount]!;
  const totalHeight = HEADER_HEIGHT + rowCount * rowHeight;

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    const update = () => setView({ left: node.scrollLeft, top: node.scrollTop, width: node.clientWidth, height: node.clientHeight });
    update();
    node.addEventListener("scroll", update, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(node);
    return () => {
      node.removeEventListener("scroll", update);
      observer?.disconnect();
    };
  }, [index]);

  useEffect(() => {
    setActive({ row: 0, column: 0 });
    scroller.current?.scrollTo(0, 0);
  }, [index]);

  // The scrolling window: rows and columns under the sticky headers and frozen panes.
  const firstRow = Math.max(frozenRows, Math.floor(view.top / rowHeight) + frozenRows - OVERSCAN);
  const lastRow = Math.min(rowCount, Math.ceil((view.top + view.height) / rowHeight) + OVERSCAN);
  const firstColumn = Math.max(frozenColumns, bisect(left, view.left + frozenWidth) - OVERSCAN + 0);
  const lastColumn = Math.min(columnCount, bisect(left, view.left + view.width) + 1 + OVERSCAN);

  const anchorOf = (row: number, column: number) => merges.covered.get(`${row}:${column}`) ?? merges.anchors.get(`${row}:${column}`);
  const cellAt = (row: number, column: number): SheetCell | undefined => asCell(sheet?.rows[row]?.[column]);
  const activeAnchor = anchorOf(active.row, active.column);
  const shown = activeAnchor ? { row: activeAnchor.top, column: activeAnchor.left } : active;
  const activeCell = cellAt(shown.row, shown.column);
  const cellId = (row: number, column: number) => `${id}-r${row}c${column}`;

  const reveal = (row: number, column: number) => {
    const node = scroller.current;
    if (!node) return;
    if (row >= frozenRows) {
      const top = (row - frozenRows) * rowHeight;
      const visible = node.clientHeight - stickyHeight;
      if (top < node.scrollTop) node.scrollTop = top;
      else if (top + rowHeight > node.scrollTop + visible) node.scrollTop = top + rowHeight - visible;
    }
    if (column >= frozenColumns) {
      const start = left[column]! - frozenWidth;
      const end = left[column + 1]! - frozenWidth;
      const visible = node.clientWidth - stickyWidth;
      if (start < node.scrollLeft) node.scrollLeft = start;
      else if (end > node.scrollLeft + visible) node.scrollLeft = end - visible;
    }
  };

  const move = (row: number, column: number) => {
    const next = { row: Math.min(Math.max(row, 0), rowCount - 1), column: Math.min(Math.max(column, 0), columnCount - 1) };
    setActive(next);
    reveal(next.row, next.column);
  };

  const keydown = (event: KeyboardEvent<HTMLDivElement>) => {
    const command = event.ctrlKey || event.metaKey;
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const page = Math.max(1, Math.floor((view.height - stickyHeight) / rowHeight) - 1);
    const merge = anchorOf(active.row, active.column);
    const steps: Record<string, () => [number, number]> = {
      ArrowUp: () => [(merge ? merge.top : active.row) - 1, active.column],
      ArrowDown: () => [(merge ? merge.bottom : active.row) + 1, active.column],
      ArrowLeft: () => [active.row, rtl ? (merge ? merge.right : active.column) + 1 : (merge ? merge.left : active.column) - 1],
      ArrowRight: () => [active.row, rtl ? (merge ? merge.left : active.column) - 1 : (merge ? merge.right : active.column) + 1],
      Home: () => (command ? [0, 0] : [active.row, 0]),
      End: () => (command ? [rowCount - 1, columnCount - 1] : [active.row, columnCount - 1]),
      PageUp: () => [active.row - page, active.column],
      PageDown: () => [active.row + page, active.column],
    };
    if (steps[event.key]) {
      event.preventDefault();
      const [row, column] = steps[event.key]!();
      move(row, column);
      // Ctrl+Home goes back to the start of the sheet, even when the first cell sits in a frozen pane.
      if (command && event.key === "Home") scroller.current?.scrollTo(0, 0);
      return;
    }
    if (command && event.key.toLowerCase() === "c") {
      event.preventDefault();
      void copyCell
        .copy(activeCell?.formula !== undefined && activeCell.value === null ? `=${activeCell.formula}` : cellText(activeCell, locale))
        .then((copied) => {
          if (copied) setAnnounce(text.copied(cellAddress(shown.row, shown.column)));
        });
    }
  };

  const renderCell = (row: number, column: number, position: CSSProperties) => {
    if (merges.covered.has(`${row}:${column}`)) return null;
    const merge = merges.anchors.get(`${row}:${column}`);
    const cell = cellAt(row, column);
    const kind = cellKind(cell);
    const width = merge ? left[merge.right + 1]! - left[merge.left]! : widths[column]!;
    const tall = merge ? (merge.bottom - merge.top + 1) * rowHeight : rowHeight;
    return (
      <div
        key={column}
        id={cellId(row, column)}
        role="gridcell"
        aria-colindex={column + 2}
        aria-selected={row === shown.row && column === shown.column}
        data-kind={kind}
        data-merged={merge ? "" : undefined}
        className="fui-spreadsheet-cell"
        style={{ ...position, width, height: tall }}
        onMouseDown={(event) => {
          event.preventDefault();
          scroller.current?.focus({ preventScroll: true });
          move(row, column);
        }}
      >
        {cellText(cell, locale)}
      </div>
    );
  };

  const rowElement = (row: number, sticky: boolean) => (
    <div
      key={row}
      role="row"
      aria-rowindex={row + 2}
      className="fui-spreadsheet-row"
      data-frozen={sticky ? "" : undefined}
      style={sticky ? { top: HEADER_HEIGHT + row * rowHeight, height: rowHeight } : { transform: `translateY(${HEADER_HEIGHT + row * rowHeight}px)`, height: rowHeight }}
    >
      <div className="fui-spreadsheet-pinned" style={{ width: stickyWidth }}>
        <div role="rowheader" aria-colindex={1} className="fui-spreadsheet-rowheader" data-active={row === shown.row ? "" : undefined} style={{ width: ROW_HEADER_WIDTH }}>
          {row + 1}
        </div>
        {Array.from({ length: frozenColumns }, (_, column) => renderCell(row, column, { left: ROW_HEADER_WIDTH + left[column]! }))}
      </div>
      {Array.from({ length: Math.max(0, lastColumn - firstColumn) }, (_, offset) => {
        const column = firstColumn + offset;
        return renderCell(row, column, { left: ROW_HEADER_WIDTH + left[column]! });
      })}
    </div>
  );

  const activeRect = (() => {
    const merge = activeAnchor;
    const row = merge ? merge.top : active.row;
    const column = merge ? merge.left : active.column;
    const width = merge ? left[merge.right + 1]! - left[merge.left]! : widths[column]!;
    const tall = merge ? (merge.bottom - merge.top + 1) * rowHeight : rowHeight;
    return { row, column, width, tall };
  })();
  const visibleActive = (activeRect.row < frozenRows || (activeRect.row >= firstRow && activeRect.row < lastRow)) && (activeRect.column < frozenColumns || (activeRect.column >= firstColumn && activeRect.column < lastColumn));

  return (
    <div {...props} className={classes("fui-spreadsheet", className)} style={style} data-slot="spreadsheet">
      <div className="fui-spreadsheet-bar" aria-hidden="true">
        <span className="fui-spreadsheet-address">{cellAddress(shown.row, shown.column)}</span>
        <span className="fui-spreadsheet-contents">
          {activeCell?.formula !== undefined ? <span className="fui-spreadsheet-formula">={activeCell.formula}</span> : null}
          {activeCell?.formula !== undefined ? " " : null}
          {cellText(activeCell, locale)}
        </span>
      </div>
      {(sheet as (Worksheet & { truncated?: boolean }) | undefined)?.truncated ? <p className="fui-spreadsheet-note">{text.truncated}</p> : null}
      <div
        ref={scroller}
        id={`${id}-grid`}
        role="grid"
        aria-label={ariaLabel ? `${ariaLabel}, ${sheet?.name ?? ""}` : sheet?.name}
        aria-readonly="true"
        aria-rowcount={rowCount + 1}
        aria-colcount={columnCount + 1}
        aria-activedescendant={!empty && visibleActive ? cellId(activeRect.row, activeRect.column) : undefined}
        tabIndex={0}
        className="fui-spreadsheet-grid"
        style={{ blockSize: typeof height === "number" ? `${height}px` : height, "--fui-spreadsheet-row": `${rowHeight}px`, "--fui-spreadsheet-pinned": `${stickyWidth}px` } as CSSProperties}
        onKeyDown={keydown}
      >
        {empty ? (
          <p className="fui-spreadsheet-empty" role="row">
            <span role="gridcell">{text.empty}</span>
          </p>
        ) : (
          <div className="fui-spreadsheet-canvas" style={{ width: totalWidth, height: totalHeight }}>
            {Array.from({ length: Math.max(0, lastRow - firstRow) }, (_, offset) => rowElement(firstRow + offset, false))}
            <div className="fui-spreadsheet-head" style={{ height: stickyHeight, width: totalWidth }}>
              <div role="row" aria-rowindex={1} className="fui-spreadsheet-row fui-spreadsheet-letters" style={{ height: HEADER_HEIGHT }}>
                <div className="fui-spreadsheet-pinned" style={{ width: stickyWidth }}>
                  <div className="fui-spreadsheet-corner" role="columnheader" aria-colindex={1} style={{ width: ROW_HEADER_WIDTH }} />
                  {Array.from({ length: frozenColumns }, (_, column) => (
                    <div key={column} role="columnheader" aria-colindex={column + 2} className="fui-spreadsheet-letter" data-active={column === shown.column ? "" : undefined} style={{ left: ROW_HEADER_WIDTH + left[column]!, width: widths[column] }}>
                      {columnName(column)}
                    </div>
                  ))}
                </div>
                {Array.from({ length: Math.max(0, lastColumn - firstColumn) }, (_, offset) => {
                  const column = firstColumn + offset;
                  return (
                    <div key={column} role="columnheader" aria-colindex={column + 2} className="fui-spreadsheet-letter" data-active={column === shown.column ? "" : undefined} style={{ left: ROW_HEADER_WIDTH + left[column]!, width: widths[column] }}>
                      {columnName(column)}
                    </div>
                  );
                })}
              </div>
              {Array.from({ length: frozenRows }, (_, row) => rowElement(row, true))}
            </div>
          </div>
        )}
      </div>
      {workbook.sheets.length > 1 ? (
        <SheetTabs
          sheets={workbook.sheets}
          index={index}
          label={text.sheets}
          controls={`${id}-grid`}
          onChange={(next) => {
            if (sheetProp === undefined) setOwnSheet(next);
            onSheetChange?.(next);
          }}
        />
      ) : null}
      <span className="fui-sr-only" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}

function SheetTabs({ sheets, index, label, controls, onChange }: { sheets: Worksheet[]; index: number; label: string; controls: string; onChange: (index: number) => void }): ReactNode {
  const list = useRef<HTMLDivElement | null>(null);
  return (
    <div
      ref={list}
      role="tablist"
      aria-label={label}
      className="fui-spreadsheet-tabs"
      onKeyDown={(event) => {
        const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
        const moves: Record<string, number> = {
          ArrowRight: index + (rtl ? -1 : 1),
          ArrowLeft: index + (rtl ? 1 : -1),
          Home: 0,
          End: sheets.length - 1,
        };
        const next = moves[event.key];
        if (next === undefined) return;
        event.preventDefault();
        const target = (next + sheets.length) % sheets.length;
        onChange(target);
        list.current?.querySelectorAll<HTMLButtonElement>("[role=tab]")[target]?.focus();
      }}
    >
      {sheets.map((sheet, position) => (
        <button
          key={`${sheet.name}-${position}`}
          type="button"
          role="tab"
          aria-selected={position === index}
          aria-controls={controls}
          tabIndex={position === index ? 0 : -1}
          className="fui-spreadsheet-tab"
          onClick={() => onChange(position)}
        >
          {sheet.name}
        </button>
      ))}
    </div>
  );
}
