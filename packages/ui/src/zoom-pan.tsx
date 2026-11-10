"use client";
// Origin: Fabrials, 0.12. The gestures of ImageViewer (media-logic) for any content: a diagram, a canvas, a wide table.

import {
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from "react";
import { flushSync } from "react-dom";
import { Toolbar as BaseToolbar } from "@base-ui/react/toolbar";
import { ZoomIn, ZoomOut } from "lucide-react";
import { useAnnounce } from "./announcer";
import { focusOf, isDrag, panDelta, scrollToKeep } from "./media-logic";
import { classes } from "./shared";
import { Toolbar, ToolbarButton } from "./toolbar";
import { clampZoom, fitZoom, sameZoom, wheelZooms, zoomByPinch, zoomByStep, zoomByWheel, zoomPercent, zoomRange } from "./zoom-pan-logic";

export type ZoomPanLabels = {
  zoomIn: string;
  zoomOut: string;
  /** The key that brings the whole content back into view. */
  fit: string;
  /** The name of the group of keys. */
  controls: string;
  /** The level between the keys ("125%"). */
  level: (percent: number) => string;
  /** What a screen reader hears after a key or a button changed the level. */
  announce: (percent: number) => string;
  /** The keys, read once when the region takes focus. */
  hint: string;
};

const LABELS: ZoomPanLabels = {
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  fit: "Fit",
  controls: "Zoom",
  level: (percent) => `${percent}%`,
  announce: (percent) => `Zoom ${percent}%`,
  hint: "Press plus or minus to zoom, 0 to fit, and the arrow keys to move around.",
};

type Point = { x: number; y: number };

export type ZoomPanHandle = {
  /** Zooms to a scale (1 is the natural layout) around a point of the screen; the middle of the viewport without one. */
  zoomTo(scale: number, at?: Point): void;
  /** The largest scale, up to 1, at which the whole content shows, from its start. */
  fit(): void;
  /** Back to `defaultScale`, from its start. */
  reset(): void;
};

export type ZoomPanProps = Omit<ComponentProps<"div">, "children" | "ref"> & {
  children?: ReactNode;
  /** The smallest and largest scale; 1 is the content laid out as wide as the viewport. Default 1 to 4. */
  minScale?: number;
  maxScale?: number;
  defaultScale?: number;
  /** Controlled scale, with `onScaleChange`. */
  scale?: number;
  onScaleChange?: (scale: number) => void;
  /**
   * False makes it an ordinary box: nothing zooms, nothing takes a key, the wheel or a touch, and there are no controls.
   * For a drawing inside a page that scrolls, which becomes interactive in a full-screen view.
   */
  interactive?: boolean;
  /**
   * `ctrl` (default): a plain turn of the wheel scrolls the page, and Ctrl or ⌘ with the wheel, or a pinch, zooms. `zoom`:
   * the wheel zooms, for a view that owns the screen.
   */
  wheel?: "zoom" | "ctrl";
  /** The name of the region. */
  label?: string;
  labels?: Partial<ZoomPanLabels>;
  /** The keys under the viewport: zoom out, the level, zoom in, fit. */
  controls?: boolean;
  /** The handle: `zoomTo`, `fit`, `reset`. */
  ref?: Ref<ZoomPanHandle>;
};

type Base = { width: number; height: number };
type Press = { x: number; y: number; left: number; top: number; moved: boolean; pinch: number; scale: number; touch: boolean };

/**
 * A viewport that zooms and pans whatever it holds, with ImageViewer's gestures: the wheel (steps the same on every
 * device, around the pointer), a pinch, a drag once zoomed, and keys while the region has focus (+ and −, 0 to fit, the
 * arrows, Home). The content is drawn at its natural layout and enlarged by a transform inside a box of the enlarged size,
 * so the scroll bars and the keys' scrolling are the browser's own and any content works (a table does not reflow, an SVG
 * is drawn again at the new size and stays sharp). Nothing is animated.
 */
export function ZoomPan({
  children,
  minScale = 1,
  maxScale = 4,
  defaultScale,
  scale: scaleProp,
  onScaleChange,
  interactive = true,
  wheel = "ctrl",
  label = "Zoomable view",
  labels,
  controls = true,
  className,
  ref,
  ...props
}: ZoomPanProps) {
  const text = { ...LABELS, ...labels };
  const range = zoomRange(minScale, maxScale);
  const [own, setOwn] = useState(() => clampZoom(defaultScale ?? 1, range));
  const [base, setBase] = useState<Base | null>(null);
  const [pannable, setPannable] = useState(false);
  const [dragging, setDragging] = useState(false);
  const hintId = useId();
  const announce = useAnnounce();
  const scale = interactive ? clampZoom(scaleProp ?? own, range) : 1;
  // Until the content has been measured it is drawn as it is, whatever scale was asked for.
  const zoomed = base !== null && !sameZoom(scale, 1);

  const viewport = useRef<HTMLDivElement | null>(null);
  const sizer = useRef<HTMLDivElement | null>(null);
  const content = useRef<HTMLDivElement | null>(null);
  const scaleNow = useRef(scale);
  const zoomedNow = useRef(false);
  // The width the content has at scale 1, and the viewport's own width then: zoomed, the content follows the viewport
  // by the same amount, whatever scroll bars have appeared since.
  const pin = useRef<{ viewport: number; base: number } | null>(null);
  const anchor = useRef<{ fx: number; fy: number; x: number; y: number } | null>(null);
  const home = useRef(false);
  const pointers = useRef(new Map<number, Point>());
  const press = useRef<Press | null>(null);
  const swallowClick = useRef(false);

  const measure = () => {
    const node = viewport.current;
    const inner = content.current;
    if (!node || !inner || zoomedNow.current) return;
    const next = { width: inner.offsetWidth, height: inner.offsetHeight };
    if (!next.width || !next.height) return;
    pin.current = { viewport: node.offsetWidth, base: next.width };
    setBase((before) => (before && Math.abs(before.width - next.width) < 1 && Math.abs(before.height - next.height) < 1 ? before : next));
  };

  const zoomTo = (next: number, at?: Point, sync = false, toStart = false) => {
    const node = viewport.current;
    const drawn = content.current;
    if (!interactive || !node || !drawn) return;
    const target = clampZoom(next, range);
    anchor.current = null;
    home.current = false;
    if (sameZoom(target, scaleNow.current)) {
      if (toStart) node.scrollTo(0, 0);
      return;
    }
    const frame = node.getBoundingClientRect();
    const origin = { x: frame.left + node.clientLeft, y: frame.top + node.clientTop };
    const point = at ?? { x: origin.x + node.clientWidth / 2, y: origin.y + node.clientHeight / 2 };
    if (toStart) home.current = true;
    // The fractions are of the drawing itself, not of the box around it: the box is centred in a taller viewport, and the
    // drawing must stay under the pointer whatever the box does.
    else anchor.current = { ...focusOf(drawn.getBoundingClientRect(), point), x: point.x - origin.x, y: point.y - origin.y };
    const apply = () => {
      // Leaving the natural layout: its size is read now, so the first step never waits for the observer.
      measure();
      if (scaleProp === undefined) setOwn(target);
      onScaleChange?.(target);
    };
    scaleNow.current = target;
    if (sync) flushSync(apply);
    else apply();
  };
  const fit = () => {
    const node = viewport.current;
    const inner = content.current;
    if (!node || !inner) return;
    zoomTo(fitZoom({ width: inner.offsetWidth, height: inner.offsetHeight }, { width: node.clientWidth, height: node.clientHeight }, range), undefined, false, true);
  };
  const reset = () => zoomTo(defaultScale ?? 1, undefined, false, true);
  const step = (direction: 1 | -1) => {
    const next = zoomByStep(scaleNow.current, direction, range);
    zoomTo(next);
    announce(text.announce(zoomPercent(next)));
  };

  // The handle and the wheel listener outlive a render: they call the functions of the latest one.
  const latest = useRef({ zoomTo, fit, reset });
  useLayoutEffect(() => {
    latest.current = { zoomTo, fit, reset };
  });
  useImperativeHandle(
    ref,
    () => ({
      zoomTo: (next, at) => latest.current.zoomTo(next, at),
      fit: () => latest.current.fit(),
      reset: () => latest.current.reset(),
    }),
    [],
  );

  // Once the new size is laid out, the point that was zoomed around is put back under the pointer.
  useLayoutEffect(() => {
    scaleNow.current = scale;
    zoomedNow.current = zoomed;
    const node = viewport.current;
    const drawn = content.current;
    const at = anchor.current;
    const toStart = home.current;
    anchor.current = null;
    home.current = false;
    if (!node || !drawn) return;
    if (toStart) node.scrollTo(0, 0);
    else if (at) {
      const rect = drawn.getBoundingClientRect();
      const frame = node.getBoundingClientRect();
      const to = scrollToKeep(at, {
        left: rect.left - frame.left - node.clientLeft + node.scrollLeft,
        top: rect.top - frame.top - node.clientTop + node.scrollTop,
        width: rect.width,
        height: rect.height,
      });
      node.scrollTo(to.left, to.top);
    }
    setPannable(interactive && (node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1));
  }, [scale, zoomed, base, interactive]);

  useEffect(() => {
    const node = viewport.current;
    const inner = content.current;
    if (!interactive || !node || !inner || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === inner) {
          if (!zoomedNow.current) measure();
          else {
            const height = inner.offsetHeight;
            setBase((before) => (before && height && Math.abs(before.height - height) >= 1 ? { ...before, height } : before));
          }
        } else if (zoomedNow.current && pin.current) {
          const width = Math.max(1, pin.current.base + node.offsetWidth - pin.current.viewport);
          setBase((before) => (before && Math.abs(before.width - width) >= 1 ? { ...before, width } : before));
        }
      }
      setPannable(node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1);
    });
    observer.observe(inner);
    observer.observe(node);
    return () => observer.disconnect();
    // `measure` reads refs only.
  }, [interactive]);

  // The wheel must be able to call preventDefault (a zoom must not also scroll, and a trackpad pinch would zoom the page),
  // and so must two fingers on a touch screen: both are attached by hand, not passive.
  const wheelNow = useRef<(event: WheelEvent) => void>(() => {});
  useLayoutEffect(() => {
    wheelNow.current = (event) => {
      if (!wheelZooms(event, wheel)) return;
      if (event.ctrlKey || event.metaKey) event.preventDefault();
      // A turn that is mostly sideways scrolls a zoomed view.
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();
      const next = zoomByWheel(event, scaleNow.current, range);
      if (next !== null) latest.current.zoomTo(next, { x: event.clientX, y: event.clientY }, true);
    };
  });
  useEffect(() => {
    const node = viewport.current;
    if (!interactive || !node) return;
    const onWheel = (event: WheelEvent) => wheelNow.current(event);
    const twoFingers = (event: TouchEvent) => {
      if (event.touches.length > 1 && event.cancelable) event.preventDefault();
    };
    const gesture = (event: Event) => event.preventDefault();
    node.addEventListener("wheel", onWheel, { passive: false });
    node.addEventListener("touchmove", twoFingers, { passive: false });
    // Safari's own pinch, which would zoom the page.
    node.addEventListener("gesturestart", gesture);
    node.addEventListener("gesturechange", gesture);
    return () => {
      node.removeEventListener("wheel", onWheel);
      node.removeEventListener("touchmove", twoFingers);
      node.removeEventListener("gesturestart", gesture);
      node.removeEventListener("gesturechange", gesture);
    };
  }, [interactive]);

  const keydown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Only while the region itself has focus: a key pressed on a control inside the content is that control's.
    if (event.target !== event.currentTarget || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    const node = event.currentTarget;
    const key = event.key;
    if (key === "+" || key === "=") step(1);
    else if (key === "-" || key === "_") step(-1);
    else if (key === "0") {
      fit();
      announce(text.announce(zoomPercent(scaleNow.current)));
    } else if (key === "Home") {
      // With nothing to put back, Home is the page's.
      if (sameZoom(scaleNow.current, clampZoom(defaultScale ?? 1, range)) && node.scrollLeft === 0 && node.scrollTop === 0) return;
      reset();
      announce(text.announce(zoomPercent(scaleNow.current)));
    } else {
      const delta = panDelta(key, { width: node.clientWidth, height: node.clientHeight });
      const across = node.scrollWidth > node.clientWidth + 1;
      const down = node.scrollHeight > node.clientHeight + 1;
      // An arrow moves the view where there is more that way; where there is not, it scrolls the page as it always does.
      if (!delta || !((delta.dx !== 0 && across) || (delta.dy !== 0 && down))) return;
      node.scrollBy({ left: delta.dx, top: delta.dy });
    }
    event.preventDefault();
  };

  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    // The first finger (or the mouse) starts a new gesture; a third finger changes nothing.
    if (event.isPrimary) pointers.current.clear();
    if (pointers.current.size >= 2) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const node = event.currentTarget;
    const touch = event.pointerType === "touch";
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      press.current = { x: event.clientX, y: event.clientY, left: node.scrollLeft, top: node.scrollTop, moved: true, pinch: Math.hypot(a!.x - b!.x, a!.y - b!.y), scale: scaleNow.current, touch };
      return;
    }
    press.current = { x: event.clientX, y: event.clientY, left: node.scrollLeft, top: node.scrollTop, moved: false, pinch: 0, scale: scaleNow.current, touch };
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = press.current;
    if (!start || !pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (start.pinch > 0 && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      zoomTo(zoomByPinch(start.scale, start.pinch, Math.hypot(a!.x - b!.x, a!.y - b!.y), range), { x: (a!.x + b!.x) / 2, y: (a!.y + b!.y) / 2 }, true);
      return;
    }
    // One finger scrolls the view (and then the page) as the browser does it, with its own momentum.
    if (start.touch || start.pinch !== 0) return;
    const node = event.currentTarget;
    if (!start.moved && isDrag(start, { x: event.clientX, y: event.clientY }) && (node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1)) {
      start.moved = true;
      // Captured only now: captured at the press, the click would never reach a control inside the content.
      node.setPointerCapture(event.pointerId);
      setDragging(true);
    }
    if (start.moved) {
      node.scrollLeft = start.left - (event.clientX - start.x);
      node.scrollTop = start.top - (event.clientY - start.y);
    }
  };
  const pointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = press.current;
    pointers.current.delete(event.pointerId);
    if (!start) return;
    if (pointers.current.size > 0) {
      // One finger left a pinch: the other one is a single finger again, and the browser scrolls for it.
      if (start.pinch !== 0) press.current = { ...start, pinch: -1 };
      return;
    }
    press.current = null;
    if (start.moved && start.pinch === 0) {
      // The release of a drag is not a click on whatever was under the pointer.
      swallowClick.current = true;
      window.setTimeout(() => {
        swallowClick.current = false;
      }, 0);
    }
    setDragging(false);
  };
  const clickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!swallowClick.current) return;
    swallowClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  const percent = zoomPercent(zoomed ? scale : 1);
  const sized: { ghost: CSSProperties; sizer: CSSProperties; content: CSSProperties } | null = zoomed
    ? {
        // What the natural layout would take, so the viewport keeps the height it has at scale 1.
        ghost: { blockSize: base.height * Math.min(1, scale) },
        sizer: {
          inlineSize: base.width * scale,
          blockSize: base.height * scale,
          // In the middle while it is smaller than the viewport, from the start once it is larger.
          insetInlineStart: `max(0px, calc((100% - ${base.width * scale}px) / 2))`,
          insetBlockStart: `max(0px, calc((100% - ${base.height * scale}px) / 2))`,
        },
        content: { inlineSize: base.width, transform: `scale(${scale})` },
      }
    : null;
  return (
    <div
      {...props}
      data-slot="zoom-pan"
      data-interactive={interactive || undefined}
      data-zoomed={zoomed || undefined}
      className={classes("fui-zoom-pan", className)}
    >
      <div
        ref={viewport}
        data-slot="zoom-pan-viewport"
        className="fui-zoom-pan-viewport"
        data-pannable={pannable || undefined}
        data-dragging={dragging || undefined}
        {...(interactive
          ? {
              role: "region",
              "aria-label": label,
              "aria-describedby": hintId,
              tabIndex: 0,
              onKeyDown: keydown,
              onPointerDown: pointerDown,
              onPointerMove: pointerMove,
              onPointerUp: pointerUp,
              onPointerCancel: pointerUp,
              onClickCapture: clickCapture,
              onDragStart: (event) => {
                if (pannable) event.preventDefault();
              },
            }
          : {})}
      >
        {sized ? <div aria-hidden="true" className="fui-zoom-pan-ghost" style={sized.ghost} /> : null}
        <div ref={sizer} className="fui-zoom-pan-sizer" style={sized?.sizer}>
          <div ref={content} className="fui-zoom-pan-content" style={sized?.content}>
            {children}
          </div>
        </div>
      </div>
      {interactive ? (
        <span className="fui-sr-only" id={hintId}>
          {text.hint}
        </span>
      ) : null}
      {interactive && controls ? (
        <Toolbar aria-label={text.controls} className="fui-zoom-pan-controls">
          <ToolbarButton disabled={scale <= range.min + 0.001} label={text.zoomOut} onClick={() => step(-1)} size="icon-sm">
            <ZoomOut aria-hidden="true" />
          </ToolbarButton>
          <span className="fui-zoom-pan-level" data-slot="zoom-pan-level">
            {text.level(percent)}
          </span>
          <ToolbarButton disabled={scale >= range.max - 0.001} label={text.zoomIn} onClick={() => step(1)} size="icon-sm">
            <ZoomIn aria-hidden="true" />
          </ToolbarButton>
          <BaseToolbar.Button
            className="fui-button fui-zoom-pan-fit"
            data-size="sm"
            data-slot="button"
            data-variant="ghost"
            onClick={() => {
              fit();
              announce(text.announce(zoomPercent(scaleNow.current)));
            }}
          >
            {text.fit}
          </BaseToolbar.Button>
        </Toolbar>
      ) : null}
    </div>
  );
}
