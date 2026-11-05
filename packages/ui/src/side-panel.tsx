"use client";
// Origin: Fabrials, 0.10. The detail pane beside a list (an inspector): docked and resizable on wide screens, a sheet on
// narrow ones, with the same parts in both.

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "./dialog";
import { IconButton } from "./icon-button";
import { classes } from "./shared";

type PanelContext = { sheet: boolean; titleId: string; close: () => void; closeLabel: string };
const SidePanelContext = createContext<PanelContext>({ sheet: false, titleId: "", close: () => {}, closeLabel: "Close panel" });

function useNarrow(below: number | false) {
  const query = below === false ? null : `(max-width: ${below - 0.02}px)`;
  const subscribe = useCallback(
    (notify: () => void) => {
      if (!query || typeof window === "undefined" || !window.matchMedia) return () => {};
      const list = window.matchMedia(query);
      list.addEventListener("change", notify);
      return () => list.removeEventListener("change", notify);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => !!query && typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(query).matches,
    () => false,
  );
}

export type SidePanelProps = Omit<ComponentProps<"aside">, "onResize"> & {
  /** Rendered while open; closed, nothing is drawn. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The edge of the row it sits on, which decides where the resize handle goes. */
  side?: "start" | "end";
  width?: number;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  onWidthChange?: (width: number) => void;
  resizable?: boolean;
  resizeLabel?: string;
  closeLabel?: string;
  /** Below this window width (px) the panel is a modal sheet; `false` keeps it docked. */
  sheetBelow?: number | false;
};

/**
 * A docked detail pane. Put it after (or before) the main column in a row; it keeps its width, scrolls on its own and
 * can be resized with the pointer or, on its handle, with the arrow keys (Home and End go to the limits). Below
 * `sheetBelow` it becomes a modal sheet from the same edge. Escape inside the docked panel closes it.
 */
export function SidePanel({
  open = true,
  onOpenChange,
  side = "end",
  width,
  defaultWidth = 360,
  minWidth = 280,
  maxWidth = 640,
  onWidthChange,
  resizable = true,
  resizeLabel = "Resize panel",
  closeLabel = "Close panel",
  sheetBelow = 768,
  className,
  style,
  children,
  onKeyDown,
  ...props
}: SidePanelProps) {
  const titleId = useId();
  const narrow = useNarrow(sheetBelow);
  const [own, setOwn] = useState(defaultWidth);
  const size = Math.min(maxWidth, Math.max(minWidth, width ?? own));
  const drag = useRef<{ x: number; width: number } | null>(null);
  const close = () => onOpenChange?.(false);
  const resize = (next: number) => {
    const clamped = Math.round(Math.min(maxWidth, Math.max(minWidth, next)));
    if (width === undefined) setOwn(clamped);
    onWidthChange?.(clamped);
  };
  const context = { sheet: narrow, titleId, close, closeLabel };

  if (narrow)
    return (
      <SidePanelContext.Provider value={context}>
        <Sheet open={open} onOpenChange={(next) => onOpenChange?.(next)}>
          <SheetContent side={side} showCloseButton={false} className={classes("fui-side-panel-sheet", className)}>
            {children}
          </SheetContent>
        </Sheet>
      </SidePanelContext.Provider>
    );
  if (!open) return null;

  const direction = (element: HTMLElement) => (getComputedStyle(element).direction === "rtl" ? -1 : 1) * (side === "end" ? -1 : 1);
  return (
    <SidePanelContext.Provider value={context}>
      <aside
        aria-labelledby={props["aria-label"] ? undefined : titleId}
        {...props}
        data-slot="side-panel"
        data-side={side}
        className={classes("fui-side-panel", className)}
        style={{ ...style, "--fui-side-panel-width": `${size}px` } as CSSProperties}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.key === "Escape" && !event.defaultPrevented && onOpenChange) {
            event.preventDefault();
            close();
          }
        }}
      >
        {resizable ? (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label={resizeLabel}
            aria-valuenow={size}
            aria-valuemin={minWidth}
            aria-valuemax={maxWidth}
            tabIndex={0}
            className="fui-side-panel-handle"
            onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
              const step = event.shiftKey ? 64 : 16;
              const sign = direction(event.currentTarget);
              const moves: Record<string, number> = {
                ArrowLeft: size - step * sign,
                ArrowRight: size + step * sign,
                Home: minWidth,
                End: maxWidth,
              };
              if (moves[event.key] === undefined) return;
              event.preventDefault();
              event.stopPropagation();
              resize(moves[event.key]!);
            }}
            onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              drag.current = { x: event.clientX, width: size };
            }}
            onPointerMove={(event: PointerEvent<HTMLDivElement>) => {
              if (!drag.current) return;
              resize(drag.current.width + (event.clientX - drag.current.x) * direction(event.currentTarget));
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
          />
        ) : null}
        {children}
      </aside>
    </SidePanelContext.Provider>
  );
}

export function SidePanelHeader({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="side-panel-header" className={classes("fui-side-panel-header", className)} {...props} />;
}

/** The panel's name: the sheet's title when it is a sheet. */
export function SidePanelTitle({ className, ...props }: ComponentProps<"h2">) {
  const { sheet, titleId } = useContext(SidePanelContext);
  if (sheet) return <SheetTitle className={classes("fui-side-panel-title", className)} {...props} />;
  return <h2 id={titleId} className={classes("fui-side-panel-title", className)} {...props} />;
}

export function SidePanelDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={classes("fui-description", "fui-side-panel-description", className)} {...props} />;
}

/** The corner X. It calls `onOpenChange(false)`. */
export function SidePanelClose({ label, className }: { label?: string; className?: string }) {
  const { close, closeLabel } = useContext(SidePanelContext);
  return (
    <IconButton size="icon-sm" label={label ?? closeLabel} className={classes("fui-side-panel-close", className)} onClick={close}>
      <X aria-hidden="true" />
    </IconButton>
  );
}

/** The part that scrolls. */
export function SidePanelBody({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="side-panel-body" className={classes("fui-side-panel-body", className)} {...props} />;
}

export function SidePanelFooter({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="side-panel-footer" className={classes("fui-side-panel-footer", className)} {...props} />;
}
