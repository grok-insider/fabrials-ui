"use client";
// Origin: Fabrials, 0.8 (promoted from Open Email's resizable panes). Built on react-resizable-panels 4.

import { useCallback, useEffect, useRef, type ComponentProps } from "react";
import {
  Group,
  Panel,
  Separator,
  useGroupRef,
  usePanelRef,
  type GroupImperativeHandle,
  type Layout,
  type PanelImperativeHandle,
} from "react-resizable-panels";
import { classes } from "./shared";

export { useGroupRef as useResizableGroupRef, usePanelRef as useResizablePanelRef };
export type { GroupImperativeHandle as ResizableGroupHandle, Layout as ResizableLayout, PanelImperativeHandle as ResizablePanelHandle };

export type ResizablePanelGroupProps = Omit<ComponentProps<typeof Group>, "className"> & {
  className?: string;
  /** shadcn's name for `orientation`. */
  direction?: "horizontal" | "vertical";
};

/**
 * A row (or column) of panes with draggable and keyboard-operable handles between them. Panes size in percentages,
 * pixels or rem (`minSize="19rem"`), and each scrolls on its own inside the group.
 *
 * Two lessons built in. The hit target of a handle is bigger than its 1 px line: `resizeTargetMinimumSize` defaults
 * to 10 px for a mouse and 24 px for touch (pass your own to change it). And a double click on a handle resets the
 * layout anywhere in that hit target, not only on the line, without the library calling it a user interaction: a
 * host that saves the layout in `onLayoutChanged` would keep the stale one. This wrapper reports the layout that a
 * double click produced as a user interaction (`meta.isUserInteraction`), whatever element was hit, so saving needs
 * no `event.target` logic.
 */
export function ResizablePanelGroup({
  className,
  direction,
  orientation,
  resizeTargetMinimumSize = { fine: 10, coarse: 24 },
  elementRef,
  onLayoutChanged,
  ...props
}: ResizablePanelGroupProps) {
  const element = useRef<HTMLDivElement | null>(null);
  const resetting = useRef(false);
  // How far from a handle's line a double click still counts: half of the largest hit target the group asks for.
  const reach = Math.max(resizeTargetMinimumSize.fine, resizeTargetMinimumSize.coarse) / 2;
  useEffect(() => {
    let frame = 0;
    // The library resets from a capture listener on the document, which runs before anything React attaches, so the
    // window's capture listener (earlier still in the event path) is the only place to see the double click first.
    const mark = (event: MouseEvent) => {
      const near = [...(element.current?.querySelectorAll('[role="separator"]') ?? [])].some((handle) => {
        const box = handle.getBoundingClientRect();
        return event.clientX >= box.left - reach && event.clientX <= box.right + reach && event.clientY >= box.top - reach && event.clientY <= box.bottom + reach;
      });
      if (!near) return; // a word selected in a pane is not a reset
      resetting.current = true;
      cancelAnimationFrame(frame);
      // The reset lands within a frame or two; after that a layout change is not a double click's.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          resetting.current = false;
        });
      });
    };
    window.addEventListener("dblclick", mark, true);
    return () => {
      window.removeEventListener("dblclick", mark, true);
      cancelAnimationFrame(frame);
    };
  }, [reach]);
  const setElement = useCallback(
    (node: HTMLDivElement | null) => {
      element.current = node;
      if (typeof elementRef === "function") elementRef(node);
      else if (elementRef) (elementRef as { current: HTMLDivElement | null }).current = node;
    },
    [elementRef],
  );
  return (
    <Group
      data-slot="resizable-panel-group"
      className={classes("fui-resizable-group", className)}
      orientation={orientation ?? direction}
      resizeTargetMinimumSize={resizeTargetMinimumSize}
      elementRef={setElement}
      onLayoutChanged={
        onLayoutChanged
          ? (layout, meta) => onLayoutChanged(layout, resetting.current ? { ...meta, isUserInteraction: true } : meta)
          : undefined
      }
      {...props}
    />
  );
}

/** A pane. Sizes are numbers (percent) or strings with a unit (`"18rem"`). */
export const ResizablePanel = Panel;

export type ResizableHandleProps = Omit<ComponentProps<typeof Separator>, "className" | "aria-label"> & {
  className?: string;
  /** The handle's name for assistive technology ("Resize the list"). Give every handle one. */
  label?: string;
  /** shadcn's name: a small grip on the line. Off by default; Highstorm draws only the line. */
  withHandle?: boolean;
};

/**
 * The line between two panes: a 1 px hairline; hover, drag and keyboard focus draw a 3 px Stormlight line (keyed on
 * the library's `data-separator`), and a disabled handle is transparent. Arrow keys resize by the library's fixed
 * step, Home and End jump to the limits, a double click resets. The outline is off because it would draw a 5 px rail
 * around a 1 px separator: the line is the focus indicator (forced colours get an outline back).
 */
export function ResizableHandle({ className, label, withHandle = false, children, ...props }: ResizableHandleProps) {
  return (
    <Separator data-slot="resizable-handle" aria-label={label} className={classes("fui-resizable-handle", className)} {...props}>
      {withHandle ? <span className="fui-resizable-grip" aria-hidden="true" /> : null}
      {children}
    </Separator>
  );
}
