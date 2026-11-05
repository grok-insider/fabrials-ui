"use client";
// Origin: Fabrials, 0.10. A selectable list (the WAI-ARIA listbox pattern with aria-activedescendant) and a plain
// virtual list, both able to draw only the rows on screen, measured as they appear. Rows use Item's geometry and slots.

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { classes } from "./shared";

export type VirtualOptions = {
  /** A row's height before it is drawn, in px. Rows are measured once drawn and may differ. */
  estimateSize: number;
  /** Rows drawn beyond each edge of the view. */
  overscan?: number;
};

function indexAt(offsets: number[], y: number) {
  let low = 0;
  let high = offsets.length - 2;
  while (low < high) {
    const middle = (low + high + 1) >> 1;
    if (offsets[middle]! <= y) low = middle;
    else high = middle - 1;
  }
  return Math.max(0, low);
}

/** Which rows to draw and where, for a scroller of rows that are measured as they appear. */
function useRows(keys: string[], options: VirtualOptions | undefined, scroller: RefObject<HTMLElement | null>) {
  const enabled = options !== undefined;
  const estimate = options?.estimateSize ?? 44;
  const overscan = options?.overscan ?? 6;
  const sizes = useRef(new Map<string, number>());
  const [measured, setMeasured] = useState(0);
  const [view, setView] = useState({ top: 0, height: 0 });
  const offsets = useMemo(() => {
    const out = new Array<number>(keys.length + 1);
    let total = 0;
    for (let index = 0; index < keys.length; index += 1) {
      out[index] = total;
      total += sizes.current.get(keys[index]!) ?? estimate;
    }
    out[keys.length] = total;
    return measured >= 0 ? out : out;
  }, [keys, estimate, measured]);

  useEffect(() => {
    const node = scroller.current;
    if (!enabled || !node) return;
    const update = () => setView({ top: node.scrollTop, height: node.clientHeight });
    update();
    node.addEventListener("scroll", update, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(node);
    return () => {
      node.removeEventListener("scroll", update);
      observer?.disconnect();
    };
  }, [enabled, scroller]);

  // Created on the first row's ref, which runs before any effect: rows drawn on the first render are measured too.
  const rowObserver = useRef<ResizeObserver | null>(null);
  const observer = () => {
    if (rowObserver.current || typeof ResizeObserver === "undefined") return rowObserver.current;
    rowObserver.current = new ResizeObserver((entries) => {
      let changed = false;
      for (const entry of entries) {
        const key = (entry.target as HTMLElement).dataset.key;
        if (key === undefined) continue;
        const size = entry.borderBoxSize?.[0]?.blockSize ?? (entry.target as HTMLElement).offsetHeight;
        if (size > 0 && Math.abs((sizes.current.get(key) ?? -1) - size) > 0.5) {
          sizes.current.set(key, size);
          changed = true;
        }
      }
      if (changed) setMeasured((count) => count + 1);
    });
    return rowObserver.current;
  };
  useEffect(
    () => () => {
      rowObserver.current?.disconnect();
      rowObserver.current = null;
    },
    [],
  );

  const measure = useCallback((node: HTMLElement | null) => {
    if (!node) return;
    const watcher = observer();
    watcher?.observe(node);
    return () => watcher?.unobserve(node);
    // The observer is created once and kept in a ref.
  }, []);

  const count = keys.length;
  const height = view.height || 640;
  const start = enabled ? Math.max(0, indexAt(offsets, view.top) - overscan) : 0;
  const end = enabled ? Math.min(count, indexAt(offsets, view.top + height) + 1 + overscan) : count;

  // A row revealed before it was measured is revealed again once the sizes settle (estimates are only estimates).
  const revealed = useRef<{ index: number; at: number } | null>(null);
  const scrollTo = useCallback(
    (index: number) => {
      const node = scroller.current;
      if (!node || index < 0 || index >= offsets.length - 1) return;
      if (!enabled) {
        node.querySelector<HTMLElement>(`[data-index="${index}"]`)?.scrollIntoView({ block: "nearest" });
        return;
      }
      const top = offsets[index]!;
      const bottom = offsets[index + 1]!;
      if (top < node.scrollTop) node.scrollTop = top;
      else if (bottom > node.scrollTop + node.clientHeight) node.scrollTop = bottom - node.clientHeight;
    },
    [enabled, offsets, scroller],
  );
  useEffect(() => {
    if (revealed.current && Date.now() - revealed.current.at < 1000) scrollTo(revealed.current.index);
  }, [scrollTo]);
  const reveal = useCallback(
    (index: number) => {
      revealed.current = { index, at: Date.now() };
      scrollTo(index);
    },
    [scrollTo],
  );

  return { enabled, start, end, total: offsets[count]!, offsets, measure, reveal, pageSize: Math.max(1, Math.floor(height / estimate) - 1) };
}

type RowState = { selected: boolean; active: boolean; disabled: boolean; index: number };

export type ListBoxProps<T> = Omit<ComponentProps<"div">, "children" | "onSelect" | "defaultValue" | "role"> & {
  items: readonly T[];
  getKey: (item: T, index: number) => string;
  /** The row's contents: Item's slots (`ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`), never a control. */
  renderItem: (item: T, state: RowState) => ReactNode;
  /** The text type-ahead matches. Without it, typing does nothing. */
  getTextValue?: (item: T) => string;
  selectionMode?: "single" | "multiple";
  selected?: readonly string[];
  defaultSelected?: readonly string[];
  onSelectedChange?: (keys: string[]) => void;
  /** Single selection follows the arrows (a mailbox). Off, Space or a click chooses. */
  selectionFollowsFocus?: boolean;
  /** The row the keyboard is on. */
  active?: string | null;
  onActiveChange?: (key: string | null) => void;
  /** Enter or a double click: open the row. */
  onAction?: (key: string, item: T) => void;
  isDisabled?: (item: T) => boolean;
  /** Draw only the rows on screen. The list needs a height (`height`, or one from its parent). */
  virtual?: VirtualOptions;
  /** The scroller's height: a CSS length or px. */
  height?: string | number;
  /** Shown instead of rows when there are none. */
  empty?: ReactNode;
};

/**
 * A list people choose from with the keyboard: one tab stop, arrows, Home, End, Page keys and type-ahead move the
 * active row; Space or a click chooses; with `multiple`, Shift extends, Ctrl or ⌘ toggles and Ctrl+A takes all; Enter
 * opens. Rows are Item rows; a long list can draw only what is on screen (`virtual`).
 */
export function ListBox<T>({
  items,
  getKey,
  renderItem,
  getTextValue,
  selectionMode = "single",
  selected,
  defaultSelected = [],
  onSelectedChange,
  selectionFollowsFocus = selectionMode === "single",
  active,
  onActiveChange,
  onAction,
  isDisabled,
  virtual,
  height,
  empty,
  className,
  style,
  onKeyDown,
  onFocus,
  ...props
}: ListBoxProps<T>) {
  const id = useId();
  const scroller = useRef<HTMLDivElement | null>(null);
  const keys = useMemo(() => items.map((item, index) => getKey(item, index)), [items, getKey]);
  const indexOf = useMemo(() => new Map(keys.map((key, index) => [key, index])), [keys]);
  const [ownSelected, setOwnSelected] = useState<readonly string[]>(defaultSelected);
  const chosen = new Set(selected ?? ownSelected);
  const [ownActive, setOwnActive] = useState<string | null>(null);
  const current = active !== undefined ? active : ownActive;
  const activeIndex = current !== null && indexOf.has(current) ? indexOf.get(current)! : -1;
  const anchor = useRef<number>(-1);
  const typed = useRef({ text: "", at: 0 });
  const rows = useRows(keys, virtual, scroller);
  const multiple = selectionMode === "multiple";
  const off = (index: number) => !!isDisabled && isDisabled(items[index]!);

  const select = (next: Iterable<string>) => {
    const list = [...next];
    if (selected === undefined) setOwnSelected(list);
    onSelectedChange?.(list);
  };
  const activate = (index: number) => {
    const key = keys[index] ?? null;
    if (active === undefined) setOwnActive(key);
    onActiveChange?.(key);
    rows.reveal(index);
  };
  const enabledFrom = (from: number, step: number) => {
    for (let index = from; index >= 0 && index < keys.length; index += step) if (!off(index)) return index;
    return -1;
  };
  const range = (from: number, to: number) => {
    const out: string[] = [];
    for (let index = Math.min(from, to); index <= Math.max(from, to); index += 1) if (!off(index)) out.push(keys[index]!);
    return out;
  };

  const go = (index: number, event: { shiftKey: boolean }) => {
    if (index < 0) return;
    activate(index);
    if (multiple && event.shiftKey) {
      if (anchor.current < 0) anchor.current = Math.max(activeIndex, 0);
      select(range(anchor.current, index));
    } else {
      anchor.current = index;
      if (!multiple && selectionFollowsFocus) select([keys[index]!]);
    }
  };

  const keydown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || keys.length === 0) return;
    const from = activeIndex < 0 ? -1 : activeIndex;
    const command = event.ctrlKey || event.metaKey;
    const moves: Record<string, () => number> = {
      ArrowDown: () => enabledFrom(from + 1, 1),
      ArrowUp: () => enabledFrom(Math.max(from - 1, 0), -1),
      Home: () => enabledFrom(0, 1),
      End: () => enabledFrom(keys.length - 1, -1),
      PageDown: () => enabledFrom(Math.min(keys.length - 1, Math.max(from, 0) + rows.pageSize), -1),
      PageUp: () => enabledFrom(Math.max(0, from - rows.pageSize), 1),
    };
    if (moves[event.key]) {
      event.preventDefault();
      go(moves[event.key]!(), event);
      return;
    }
    if (event.key === " " && from >= 0) {
      event.preventDefault();
      if (off(from)) return;
      const key = keys[from]!;
      if (multiple) {
        const next = new Set(chosen);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        select(next);
      } else select([key]);
      anchor.current = from;
      return;
    }
    if (event.key === "Enter" && from >= 0 && onAction && !off(from)) {
      event.preventDefault();
      onAction(keys[from]!, items[from]!);
      return;
    }
    if (multiple && command && event.key.toLowerCase() === "a") {
      event.preventDefault();
      select(range(0, keys.length - 1));
      return;
    }
    if (getTextValue && event.key.length === 1 && !command && !event.altKey) {
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 600 ? typed.current.text : "") + event.key.toLowerCase(), at: now };
      const needle = typed.current.text;
      const start = needle.length === 1 ? from + 1 : Math.max(from, 0);
      for (let step = 0; step < keys.length; step += 1) {
        const index = (start + step) % keys.length;
        if (!off(index) && getTextValue(items[index]!).toLowerCase().startsWith(needle)) {
          go(index, { shiftKey: false });
          break;
        }
      }
    }
  };

  const click = (index: number, event: MouseEvent) => {
    if (off(index)) return;
    activate(index);
    const key = keys[index]!;
    if (!multiple) select([key]);
    else if (event.shiftKey && anchor.current >= 0) select(range(anchor.current, index));
    else if (event.ctrlKey || event.metaKey) {
      const next = new Set(chosen);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      select(next);
    } else select([key]);
    if (!event.shiftKey) anchor.current = index;
  };

  useEffect(() => {
    if (current !== null && !indexOf.has(current) && active === undefined) setOwnActive(null);
  }, [current, indexOf, active]);

  const optionId = (index: number) => `${id}-option-${index}`;
  // An empty listbox is not a listbox (it would have no options): the host's empty state stands in its place.
  if (keys.length === 0)
    return (
      <div className={classes("fui-listbox", className)} data-empty="" style={style}>
        <div className="fui-listbox-empty">{empty}</div>
      </div>
    );
  const drawn: ReactNode[] = [];
  for (let index = rows.start; index < rows.end; index += 1) {
    const item = items[index]!;
    const key = keys[index]!;
    const state = { selected: chosen.has(key), active: index === activeIndex, disabled: off(index), index };
    drawn.push(
      <div
        key={key}
        id={optionId(index)}
        role="option"
        aria-selected={state.selected}
        aria-disabled={state.disabled || undefined}
        aria-posinset={rows.enabled ? index + 1 : undefined}
        aria-setsize={rows.enabled ? keys.length : undefined}
        data-key={key}
        data-index={index}
        data-active={state.active ? "" : undefined}
        data-selected={state.selected ? "" : undefined}
        data-current={state.selected && !multiple ? "" : undefined}
        data-disabled={state.disabled ? "" : undefined}
        className="fui-item fui-listbox-option"
        ref={rows.enabled ? rows.measure : undefined}
        style={rows.enabled ? ({ "--fui-row-offset": `${rows.offsets[index]}px` } as CSSProperties) : undefined}
        onMouseDown={(event) => {
          if (event.shiftKey) event.preventDefault();
        }}
        onClick={(event) => click(index, event)}
        onDoubleClick={() => !state.disabled && onAction?.(key, item)}
      >
        {renderItem(item, state)}
      </div>,
    );
  }

  return (
    <div
      {...props}
      ref={scroller}
      role="listbox"
      tabIndex={0}
      aria-multiselectable={multiple || undefined}
      aria-activedescendant={activeIndex >= 0 && activeIndex >= rows.start && activeIndex < rows.end ? optionId(activeIndex) : undefined}
      data-virtual={rows.enabled ? "" : undefined}
      className={classes("fui-listbox", className)}
      style={{ ...style, ...(height !== undefined ? { blockSize: typeof height === "number" ? `${height}px` : height } : null) }}
      onKeyDown={keydown}
      onFocus={(event) => {
        onFocus?.(event);
        if (event.target === event.currentTarget && activeIndex < 0 && keys.length > 0) {
          const first = chosen.size ? keys.findIndex((key) => chosen.has(key)) : enabledFrom(0, 1);
          if (first >= 0) activate(first);
        }
      }}
    >
      {rows.enabled ? (
        <div className="fui-listbox-canvas" style={{ blockSize: `${rows.total}px` }}>
          {drawn}
        </div>
      ) : (
        drawn
      )}
    </div>
  );
}

export type VirtualListProps<T> = Omit<ComponentProps<"div">, "children"> & {
  items: readonly T[];
  getKey: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  /** Every row's estimated height; rows are measured once drawn. */
  estimateSize: number;
  overscan?: number;
  height?: string | number;
  /** The accessible name of the list. */
  "aria-label"?: string;
};

/**
 * A long list of anything (posts, log lines, history) that draws only the rows on screen, measured as they appear.
 * It is a plain list: rows keep their own links and buttons, and Tab moves through what is drawn. The scroller is a
 * named region with a tab stop, so the keyboard can scroll it even when the rows hold nothing focusable.
 */
export function VirtualList<T>({
  items,
  getKey,
  renderItem,
  estimateSize,
  overscan,
  height,
  className,
  style,
  "aria-label": label,
  ...props
}: VirtualListProps<T>) {
  const scroller = useRef<HTMLDivElement | null>(null);
  const keys = useMemo(() => items.map((item, index) => getKey(item, index)), [items, getKey]);
  const rows = useRows(keys, { estimateSize, overscan }, scroller);
  const drawn: ReactNode[] = [];
  for (let index = rows.start; index < rows.end; index += 1)
    drawn.push(
      <div
        key={keys[index]}
        role="listitem"
        aria-posinset={index + 1}
        aria-setsize={keys.length}
        data-key={keys[index]}
        data-index={index}
        className="fui-virtual-row"
        ref={rows.measure}
        style={{ "--fui-row-offset": `${rows.offsets[index]}px` } as CSSProperties}
      >
        {renderItem(items[index]!, index)}
      </div>,
    );
  return (
    <div
      {...props}
      ref={scroller}
      role="region"
      aria-label={label}
      tabIndex={0}
      className={classes("fui-virtual-list", className)}
      style={{ ...style, ...(height !== undefined ? { blockSize: typeof height === "number" ? `${height}px` : height } : null) }}
    >
      <div role="list" className="fui-listbox-canvas" style={{ blockSize: `${rows.total}px` }}>
        {drawn}
      </div>
    </div>
  );
}
