"use client";
// Origin: Fabrials, 0.10, assimilated from X Tracker's lightbox (zoom to real size and back, look around by dragging or
// with the keys, a swipe or the arrows to move, a strip of neighbours). The viewer is always dark: it carries the dark
// theme's tokens, so every control in it reads on the stage in both themes.

import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { flushSync } from "react-dom";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { Check, ChevronLeft, ChevronRight, Copy, Download, ImageOff, X, ZoomIn, ZoomOut } from "lucide-react";
import { buttonVariants } from "./button-variants";
import { copyImage } from "./export";
import { IconButton } from "./icon-button";
import {
  ImageViewerControlContext,
  ImageViewerGroupContext,
  ImageViewerOpenContext,
  useImageViewer,
  type ImageViewerControl,
  type ImageViewerMember,
} from "./image-viewer-context";
import {
  clamp,
  closesOnRelease,
  DOUBLE_TAP_TIME,
  dragAxis,
  dragDown,
  focusOf,
  isDoubleTap,
  isDrag,
  panDelta,
  pinchScale,
  preloadTargets,
  scrollToKeep,
  stepScale,
  swipeStep,
  wheelScale,
  zoomLimit,
} from "./media-logic";
import { Image, type ImageProps } from "./image";
import { classes } from "./shared";
import { useLabels } from "./labels";
import { PixelSpinner } from "./pixel-spinner";
import { useHydrated } from "./use-hydrated";

export type ViewerItem = {
  src: string;
  alt: string;
  /**
   * A small copy for the strip of neighbours. Since 0.12 it also stands under the picture, softly blurred, while the picture
   * loads: at the picture's own place when `width` and `height` are given, as large as the stage allows without them.
   */
  thumb?: string;
  /** The real size of `src` in pixels. */
  width?: number;
  height?: number;
  caption?: ReactNode;
  /** Who made the picture, on a line under the caption (0.12). */
  credit?: ReactNode;
  /** Where the picture comes from: a link on the credit line, named by `sourceLabel` or `labels.source` (0.12). */
  sourceUrl?: string;
  sourceLabel?: string;
  /** A URL for the download button; `false` hides it. The image itself by default. */
  download?: string | false;
  /** The name of the downloaded file (0.12). */
  downloadName?: string;
  /** A video or a GIF is drawn by `renderMedia`. */
  kind?: "image" | "video" | "gif";
  poster?: string;
};

export type ViewerLabels = {
  close: string;
  previous: string;
  next: string;
  zoomIn: string;
  zoomOut: string;
  /** The zoom key of a picture no larger than the stage, which has no real size to go to (0.11). */
  enlarge: string;
  /** The zoom level beside the key, as a share of the real size (0.11). */
  zoom: (percent: number) => string;
  download: string;
  thumbnails: string;
  failed: string;
  position: (index: number, total: number) => string;
  /** The line of credit's link when the item has no `sourceLabel` (0.12). */
  source: string;
  /** The copy key and what it says when it is done (0.12). */
  copy: string;
  copied: string;
  copyFailed: string;
  /** The name of a picture that opens the provider's viewer (`ZoomableImage`), from its alt text (0.12). */
  open: (alt: string) => string;
};

const LABELS: ViewerLabels = {
  close: "Close",
  previous: "Previous",
  next: "Next",
  zoomIn: "Real size",
  zoomOut: "Fit to screen",
  enlarge: "Zoom in",
  zoom: (percent) => `${percent}%`,
  download: "Download",
  thumbnails: "All items",
  failed: "This image could not be loaded.",
  position: (index, total) => `${index + 1} of ${total}`,
  source: "Source",
  copy: "Copy image",
  copied: "Image copied",
  copyFailed: "The image could not be copied.",
  open: (alt) => (alt ? `Open ${alt}` : "Open image"),
};

export type ViewerAction = "download" | "copy";

export type ImageViewerProps = {
  items: readonly ViewerItem[];
  /** The item on show; `null` is closed. */
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  /** The viewer's name, said with the position ("Photos, 3 of 8"). */
  label?: string;
  /** The strip of neighbours; on by default with more than one item. */
  thumbnails?: boolean;
  labels?: Partial<ViewerLabels>;
  /** Draws an item that is not an image (a video or a GIF): `VideoPlayer` and `AnimatedImage` fit here. */
  renderMedia?: (item: ViewerItem, index: number) => ReactNode;
  /** Called when the viewer gets within three items of the end (load more). */
  onNearEnd?: () => void;
  /**
   * What zooms to the real size and back (0.12): one click or tap on the picture (the default), or two. With `"double"` a
   * single tap of a finger shows and hides the bars instead, as phone galleries do.
   */
  zoomOn?: "click" | "double";
  /** The keys of the bar that act on the picture, in order (0.12). `"copy"` shows only where the browser can copy a picture. */
  actions?: readonly ViewerAction[];
  /**
   * In a narrow window (0.12): the zoom level leaves the bar and, with eight items or fewer, dots stand for the strip.
   * Previous and Next stay for assistive technology and the keyboard.
   */
  compact?: boolean;
  /** A finger (or a pen) drags a fitted picture down to close the viewer (0.12). On by default. */
  dragToClose?: boolean;
  /** Where focus goes on close when it is not what had focus on open (0.12). An element that left the page is ignored. */
  returnFocus?: RefObject<HTMLElement | null>;
};

const ACTIONS: readonly ViewerAction[] = ["download"];

type Press = {
  x: number;
  y: number;
  left: number;
  top: number;
  moved: boolean;
  onImage: boolean;
  pinch: number;
  scale: number;
  /** A finger or a pen on a fitted picture, outside a player: it may drag down to close. */
  pull: boolean;
  axis: "x" | "y" | null;
  /** The last place and time of a drag down, and its speed in pixels per millisecond. */
  at: { y: number; time: number };
  speed: number;
};

/**
 * Images on a dark stage, one at a time. The wheel (or a pinch) zooms by steps around the pointer, from fitted to twice the
 * real size; a click, Z or the key goes to the real size around the point pressed and back to fitted; + and − step, 0 fits.
 * Zoomed, drag with the left button (or a finger), the arrows or a sideways scroll look around. Fitted, the arrows (or a
 * swipe) move to the neighbours, Home and End to the ends, and a finger drags the picture down to close. Escape closes and
 * focus goes back to what opened it.
 */
export function ImageViewer({
  items,
  index,
  onIndexChange,
  onClose,
  label = "Images",
  thumbnails,
  labels,
  renderMedia,
  onNearEnd,
  zoomOn = "click",
  actions = ACTIONS,
  compact = false,
  dragToClose = true,
  returnFocus,
}: ImageViewerProps) {
  const text = useLabels("imageViewer", LABELS, labels);
  const open = index !== null && index >= 0 && index < items.length;
  const current = open ? items[index]! : null;
  const total = items.length;
  const isImage = !!current && (!current.kind || current.kind === "image");
  const [zoom, setZoom] = useState<{ src: string; scale: number } | null>(null);
  const [fitted, setFitted] = useState<{ src: string; width: number; height: number; naturalWidth: number } | null>(null);
  const [state, setState] = useState<{ src: string; status: "loading" | "loaded" | "failed" } | null>(null);
  const scale = current && isImage && zoom?.src === current.src ? zoom.scale : 1;
  const zoomed = scale > 1;
  const fit = current && isImage && fitted?.src === current.src ? fitted : null;
  // The real size over the fitted one: above 1 when the picture was shrunk to fit the stage.
  const real = fit ? Math.max(1, fit.naturalWidth / fit.width) : 1;
  const max = zoomLimit(real);
  const stage = useRef<HTMLDivElement | null>(null);
  const scaleNow = useRef(1);
  const anchor = useRef<{ fx: number; fy: number; x: number; y: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const press = useRef<Press | null>(null);
  const status = current && state?.src === current.src ? state.status : "loading";
  const popup = useRef<HTMLDivElement | null>(null);
  const backdrop = useRef<HTMLDivElement | null>(null);
  const timers = useRef<{ settle?: number; chrome?: number; copied?: number }>({});
  const lastTap = useRef<{ x: number; y: number; time: number } | null>(null);
  const preloaded = useRef(new Set<string>());
  const hydrated = useHydrated();
  const [bare, setBare] = useState(false);
  const [underFailed, setUnderFailed] = useState<string | null>(null);
  const [copied, setCopied] = useState<{ src: string; done: boolean } | null>(null);
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    setBare(false);
    setCopied(null);
  }
  // The small copy under a picture that has not arrived. Without it (or when it fails too) the spinner says it is loading.
  const under = current && isImage && status === "loading" && current.thumb && current.thumb !== current.src && underFailed !== current.thumb ? current.thumb : null;

  // The next and the previous picture are asked for once each, so moving to them shows them at once.
  useEffect(() => {
    if (!open) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    for (const src of preloadTargets(items, index, preloaded.current, !!connection?.saveData)) {
      preloaded.current.add(src);
      new window.Image().src = src;
    }
  }, [open, items, index]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      window.clearTimeout(pending.settle);
      window.clearTimeout(pending.chrome);
      window.clearTimeout(pending.copied);
    };
  }, []);

  /**
   * The picture under a finger that drags it down: how far it is, how much it has shrunk and how much of the backdrop is
   * left, written on the elements so a drag does not render. The stylesheet reads them only when motion is allowed.
   */
  const pull = (dy: number, phase: "dragging" | "settling") => {
    const moved = dragDown(dy, stage.current?.clientHeight ?? 0);
    for (const node of [popup.current, backdrop.current]) {
      if (!node) continue;
      node.toggleAttribute("data-dragging", phase === "dragging");
      node.toggleAttribute("data-settling", phase === "settling");
      node.style.setProperty("--fui-viewer-drag", `${moved.offset}px`);
      node.style.setProperty("--fui-viewer-drag-scale", String(moved.scale));
      node.style.setProperty("--fui-viewer-drag-fade", `${Math.round(moved.fade * 100)}%`);
    }
  };
  const rest = () => {
    window.clearTimeout(timers.current.settle);
    for (const node of [popup.current, backdrop.current]) {
      if (!node) continue;
      node.removeAttribute("data-dragging");
      node.removeAttribute("data-settling");
      for (const name of ["--fui-viewer-drag", "--fui-viewer-drag-scale", "--fui-viewer-drag-fade"]) node.style.removeProperty(name);
    }
  };
  /** Let go short of closing: the picture goes back to its place, and the marks of the drag leave once it is there. */
  const settle = () => {
    pull(0, "settling");
    window.clearTimeout(timers.current.settle);
    timers.current.settle = window.setTimeout(rest, 320);
  };

  const copy = () => {
    if (!current) return;
    const src = current.src;
    const say = (done: boolean) => {
      setCopied({ src, done });
      window.clearTimeout(timers.current.copied);
      timers.current.copied = window.setTimeout(() => setCopied(null), 4000);
    };
    copyImage(src).then(
      () => say(true),
      () => say(false),
    );
  };

  const go = useCallback(
    (to: number) => {
      if (!open) return;
      const next = Math.min(total - 1, Math.max(0, to));
      if (next === index) return;
      setZoom(null);
      onIndexChange(next);
      if (next >= total - 3) onNearEnd?.();
    },
    [open, total, index, onIndexChange, onNearEnd],
  );

  /**
   * Zooms to `next` (1 is fitted) around a point of the screen, the middle of the stage without one: the point of the picture
   * under it stays under it. `sync` paints it before the next event of a gesture arrives.
   */
  const zoomTo = (next: number, at?: { x: number; y: number }, sync = false) => {
    const node = stage.current;
    const image = node?.querySelector<HTMLElement>("[data-viewer-image]");
    if (!current || !isImage || !fit || !node || !image) return;
    const target = clamp(next, 1, max);
    if (Math.abs(target - scaleNow.current) < 0.001) return;
    const frame = node.getBoundingClientRect();
    const point = at ?? { x: frame.left + node.clientWidth / 2, y: frame.top + node.clientHeight / 2 };
    anchor.current = { ...focusOf(image.getBoundingClientRect(), point), x: point.x - frame.left, y: point.y - frame.top };
    scaleNow.current = target;
    const apply = () => setZoom(target > 1.0005 ? { src: current.src, scale: target } : null);
    if (sync) flushSync(apply);
    else apply();
  };
  /** Real size and back: the click, Z and the key. A picture no larger than the stage goes to twice its size. */
  const toggle = (at?: { x: number; y: number }) => zoomTo(scaleNow.current > 1 ? 1 : real > 1.01 ? real : 2, at);

  const measure = useCallback(() => {
    const image = stage.current?.querySelector<HTMLImageElement>("img[data-viewer-image]");
    const src = image?.getAttribute("src");
    if (!image || !src || scaleNow.current > 1 || !image.complete || !image.naturalWidth) return;
    const box = image.getBoundingClientRect();
    if (!box.width || !box.height) return;
    setFitted((before) =>
      before && before.src === src && Math.abs(before.width - box.width) < 0.5 && Math.abs(before.height - box.height) < 0.5
        ? before
        : { src, width: box.width, height: box.height, naturalWidth: image.naturalWidth },
    );
  }, []);

  // Zoomed, the point that was zoomed around stays under the pointer. Fitted, the picture is inside the stage again, so
  // nothing is left scrolled, and it is measured again: the window may have changed size while it was zoomed.
  useLayoutEffect(() => {
    scaleNow.current = scale;
    const node = stage.current;
    const image = node?.querySelector<HTMLImageElement>("img[data-viewer-image]");
    const at = anchor.current;
    anchor.current = null;
    if (!node || !image) return;
    if (scale <= 1) {
      node.scrollTo(0, 0);
      measure();
    } else if (at) {
      const box = image.getBoundingClientRect();
      const frame = node.getBoundingClientRect();
      const to = scrollToKeep(at, { left: box.left - frame.left + node.scrollLeft, top: box.top - frame.top + node.scrollTop, width: box.width, height: box.height });
      node.scrollTo(to.left, to.top);
    }
  }, [scale, current?.src, measure]);

  // The wheel needs preventDefault (it zooms, and a trackpad pinch would zoom the page), so it is attached by hand, not
  // passive. A turn that is mostly sideways is left to the stage, which scrolls a zoomed picture.
  const wheel = useRef<(event: WheelEvent) => void>(() => {});
  useLayoutEffect(() => {
    wheel.current = (event) => {
      if (!isImage) return;
      // Ctrl + wheel is a pinch on a trackpad, or the page's own zoom: over the picture, it is the picture's.
      if (event.ctrlKey) event.preventDefault();
      if (!fit || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();
      const next = wheelScale(event, scaleNow.current, max);
      if (next !== null) zoomTo(next, { x: event.clientX, y: event.clientY }, true);
    };
  });
  const stageRef = useCallback(
    (node: HTMLDivElement | null) => {
      const listener = (event: WheelEvent) => wheel.current(event);
      stage.current = node;
      node?.addEventListener("wheel", listener, { passive: false });
      const observer = node && typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => measure()) : null;
      if (node) observer?.observe(node);
      return () => {
        node?.removeEventListener("wheel", listener);
        observer?.disconnect();
      };
    },
    [measure],
  );

  const keydown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (bare) setBare(false);
    if (target.closest("input, textarea, select, [role=slider], [role=menu], [role^=menuitem], [data-media-keys]") || event.ctrlKey || event.metaKey || event.altKey) return;
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    if (zoomed && stage.current) {
      const delta = panDelta(event.key, { width: stage.current.clientWidth, height: stage.current.clientHeight });
      if (delta) {
        event.preventDefault();
        stage.current.scrollBy({ left: rtl ? -delta.dx : delta.dx, top: delta.dy });
        return;
      }
    }
    const key = event.key;
    if (key === "ArrowRight" || key === "ArrowLeft") {
      event.preventDefault();
      go(index! + ((key === "ArrowRight") !== rtl ? 1 : -1));
    } else if (key === "Home") {
      event.preventDefault();
      go(0);
    } else if (key === "End") {
      event.preventDefault();
      go(total - 1);
    } else if (key === "z" || key === "Z") toggle();
    else if (key === "+" || key === "=") zoomTo(stepScale(scaleNow.current, 1, max));
    else if (key === "-" || key === "_") zoomTo(stepScale(scaleNow.current, -1, max));
    else if (key === "0") zoomTo(1);
  };

  const still: Press = { x: 0, y: 0, left: 0, top: 0, moved: false, onImage: false, pinch: 0, scale: 1, pull: false, axis: null, at: { y: 0, time: 0 }, speed: 0 };
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    // The first finger (or the mouse) starts a new gesture; a third finger changes nothing.
    if (event.isPrimary) pointers.current.clear();
    if (pointers.current.size >= 2) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const node = stage.current;
    if (!node) return;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const pinch = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      // A second finger ends a drag down: the two of them pinch.
      if (press.current?.axis === "y") rest();
      press.current = { ...still, x: event.clientX, y: event.clientY, left: node.scrollLeft, top: node.scrollTop, moved: true, pinch, scale: scaleNow.current };
      return;
    }
    // Where the press began: the pointer is captured, so the release is reported on the stage, not on the picture.
    const target = event.target as HTMLElement;
    const onImage = !!target.closest("[data-viewer-image]");
    const pull = dragToClose && event.pointerType !== "mouse" && scaleNow.current <= 1 && !target.closest("[data-media-keys]");
    press.current = { ...still, x: event.clientX, y: event.clientY, left: node.scrollLeft, top: node.scrollTop, onImage, scale: scaleNow.current, pull, at: { y: event.clientY, time: event.timeStamp } };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Capture keeps a drag that leaves the stage; without it (a pointer the browser no longer knows) the gesture still works.
    }
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = press.current;
    if (!start || !pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (start.pinch > 0 && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      zoomTo(pinchScale(start.scale, start.pinch, Math.hypot(a!.x - b!.x, a!.y - b!.y), max), { x: (a!.x + b!.x) / 2, y: (a!.y + b!.y) / 2 }, true);
      return;
    }
    const point = { x: event.clientX, y: event.clientY };
    if (isDrag(start, point)) start.moved = true;
    if (start.pull && scaleNow.current <= 1) {
      start.axis ??= dragAxis(start, point);
      if (start.axis === "y") {
        const elapsed = event.timeStamp - start.at.time;
        if (elapsed > 0) start.speed = 0.7 * ((point.y - start.at.y) / elapsed) + 0.3 * start.speed;
        start.at = { y: point.y, time: event.timeStamp };
        window.clearTimeout(timers.current.settle);
        pull(point.y - start.y, "dragging");
      }
      return;
    }
    if (scaleNow.current > 1 && start.moved && stage.current) {
      stage.current.scrollLeft = start.left - (event.clientX - start.x);
      stage.current.scrollTop = start.top - (event.clientY - start.y);
    }
  };
  const pointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = press.current;
    pointers.current.delete(event.pointerId);
    if (!start) return;
    if (pointers.current.size > 0) {
      // One finger left a pinch: the one still down looks around from where the picture is now.
      const [left] = [...pointers.current.values()];
      const node = stage.current;
      if (start.pinch !== 0 && left && node) {
        press.current = { ...still, x: left.x, y: left.y, left: node.scrollLeft, top: node.scrollTop, moved: true, pinch: -1, scale: scaleNow.current };
      }
      return;
    }
    press.current = null;
    if (start.pinch !== 0) return;
    const end = { x: event.clientX, y: event.clientY };
    if (start.axis === "y") {
      // A finger that stopped before it let go is not a flick.
      const speed = event.timeStamp - start.at.time > 100 ? 0 : start.speed;
      if (!closesOnRelease(end.y - start.y, speed)) return settle();
      onClose();
      // A host that keeps the viewer open gets its picture back.
      window.clearTimeout(timers.current.settle);
      timers.current.settle = window.setTimeout(() => {
        if (popup.current?.isConnected && !popup.current.hasAttribute("data-ending-style")) settle();
      }, 320);
      return;
    }
    if (!start.moved) tap(end, event, start.onImage);
    else if (scaleNow.current <= 1 && event.pointerType === "touch") {
      const step = swipeStep(start, end, getComputedStyle(event.currentTarget).direction === "rtl");
      if (step) go(index! + step);
    }
  };
  /**
   * A press that did not move. By default it zooms the picture under it. With `zoomOn="double"` the second of two does, and
   * a single tap of a finger shows or hides the bars once it is clear that no second tap follows.
   */
  const tap = (at: { x: number; y: number }, event: PointerEvent<HTMLDivElement>, onImage: boolean) => {
    if (zoomOn !== "double") {
      if (onImage) toggle(at);
      return;
    }
    const now = { ...at, time: event.timeStamp };
    window.clearTimeout(timers.current.chrome);
    if (onImage && isDoubleTap(lastTap.current, now)) {
      lastTap.current = null;
      toggle(at);
      return;
    }
    lastTap.current = onImage ? now : null;
    if (event.pointerType !== "mouse") timers.current.chrome = window.setTimeout(() => setBare((hidden) => !hidden), DOUBLE_TAP_TIME);
  };

  const download = current && isImage && actions.includes("download") ? (current.download === false ? null : (current.download ?? current.src)) : null;
  const canCopy = hydrated && !!current && isImage && actions.includes("copy") && typeof ClipboardItem !== "undefined" && typeof navigator.clipboard?.write === "function";
  const copiedNow = current && copied?.src === current.src ? copied : null;
  const showStrip = (thumbnails ?? total > 1) && total > 1;
  const showDots = compact && showStrip && total <= 8;
  const keys: Record<ViewerAction, ReactNode> = {
    download: download ? (
      <a
        key="download"
        href={download}
        download={current?.downloadName ?? true}
        className={buttonVariants({ variant: "ghost", size: "icon" })}
        aria-label={text.download}
        title={text.download}
      >
        <Download aria-hidden="true" />
      </a>
    ) : null,
    copy: canCopy ? (
      <IconButton key="copy" size="icon" label={text.copy} data-copied={copiedNow?.done ? "" : undefined} onClick={copy}>
        {copiedNow?.done ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      </IconButton>
    ) : null,
  };

  return (
    <BaseDialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop ref={backdrop} className="fui-viewer-backdrop" />
        <BaseDialog.Popup
          ref={popup}
          className="dark fui-viewer"
          data-theme="dark"
          data-zoomed={zoomed ? "" : undefined}
          data-drag-close={dragToClose ? "" : undefined}
          data-compact={compact ? "" : undefined}
          data-chrome={bare ? "hidden" : undefined}
          finalFocus={returnFocus ? () => (returnFocus.current?.isConnected ? returnFocus.current : true) : undefined}
          initialFocus={() => stage.current?.querySelector<HTMLElement>("[data-media-keys] [tabindex='0']") ?? stage.current}
          onKeyDown={keydown}
        >
          {current ? (
            <>
              <BaseDialog.Title className="fui-sr-only">{`${label}, ${text.position(index!, total)}`}</BaseDialog.Title>
              <div className="fui-viewer-bar">
                <span className="fui-viewer-count" aria-hidden="true">
                  {total > 1 ? `${index! + 1} / ${total}` : ""}
                </span>
                <span className="fui-viewer-actions">
                  {isImage && fit ? (
                    <span className="fui-viewer-zoom" aria-hidden="true">
                      {text.zoom(Math.round(((fit.width * scale) / fit.naturalWidth) * 100))}
                    </span>
                  ) : null}
                  {isImage ? (
                    <IconButton
                      size="icon"
                      label={zoomed ? text.zoomOut : real > 1.01 ? text.zoomIn : text.enlarge}
                      shortcut={["Z"]}
                      aria-pressed={zoomed}
                      disabled={!fit}
                      onClick={() => toggle()}
                    >
                      {zoomed ? <ZoomOut aria-hidden="true" /> : <ZoomIn aria-hidden="true" />}
                    </IconButton>
                  ) : null}
                  {actions.map((action) => keys[action])}
                  <BaseDialog.Close render={<IconButton size="icon" label={text.close} />}>
                    <X aria-hidden="true" />
                  </BaseDialog.Close>
                </span>
              </div>
              <div
                ref={stageRef}
                tabIndex={-1}
                aria-label={isImage ? current.alt || label : undefined}
                role={isImage ? "group" : undefined}
                className="fui-viewer-stage"
                data-zoomable={isImage && fit ? "" : undefined}
                onPointerDown={pointerDown}
                onPointerMove={pointerMove}
                onPointerUp={pointerUp}
                onPointerCancel={(event) => {
                  pointers.current.delete(event.pointerId);
                  if (press.current?.axis === "y") settle();
                  press.current = null;
                }}
              >
                {isImage ? (
                  <div className="fui-viewer-canvas" data-state={status}>
                    {status === "failed" ? (
                      <p className="fui-viewer-failed">
                        <ImageOff aria-hidden="true" />
                        {text.failed}
                      </p>
                    ) : (
                      <>
                        {under ? (
                          <img
                            src={under}
                            alt=""
                            aria-hidden="true"
                            draggable={false}
                            className="fui-viewer-under"
                            style={
                              current.width && current.height
                                ? ({ "--fui-viewer-under-width": `${current.width}px`, "--fui-viewer-under-height": `${current.height}px` } as CSSProperties)
                                : undefined
                            }
                            onError={() => setUnderFailed(under)}
                          />
                        ) : null}
                        <img
                          key={current.src}
                          src={current.src}
                          alt={current.alt}
                          width={current.width}
                          height={current.height}
                          draggable={false}
                          data-viewer-image=""
                          className="fui-viewer-image"
                          style={zoomed && fit ? { width: fit.width * scale, height: fit.height * scale } : undefined}
                          onLoad={() => {
                            setState({ src: current.src, status: "loaded" });
                            measure();
                          }}
                          onError={() => setState({ src: current.src, status: "failed" })}
                        />
                      </>
                    )}
                    {status === "loading" && !under ? (
                      <span className="fui-viewer-loading" aria-hidden="true">
                        <PixelSpinner />
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <div className="fui-viewer-canvas" data-state="loaded" data-media-keys="">
                    {renderMedia?.(current, index!)}
                  </div>
                )}
              </div>
              {total > 1 ? (
                <>
                  <IconButton size="icon" label={text.previous} className="fui-viewer-previous" disabled={index === 0} onClick={() => go(index! - 1)}>
                    <ChevronLeft aria-hidden="true" className="fui-viewer-chevron" />
                  </IconButton>
                  <IconButton size="icon" label={text.next} className="fui-viewer-next" disabled={index === total - 1} onClick={() => go(index! + 1)}>
                    <ChevronRight aria-hidden="true" className="fui-viewer-chevron" />
                  </IconButton>
                </>
              ) : null}
              {current.caption ? <div className="fui-viewer-caption">{current.caption}</div> : null}
              {current.credit || current.sourceUrl ? (
                <p className="fui-viewer-credit" dir="auto">
                  {current.credit ? <span className="fui-viewer-credit-text">{current.credit}</span> : null}
                  {current.sourceUrl ? (
                    <a href={current.sourceUrl} target="_blank" rel="noreferrer noopener" className="fui-viewer-source">
                      {current.sourceLabel ?? text.source}
                    </a>
                  ) : null}
                </p>
              ) : null}
              {showDots ? (
                <div className="fui-viewer-dots" aria-hidden="true">
                  {items.map((item, position) => (
                    <span key={`${item.src}-${position}`} className="fui-viewer-dot" data-current={position === index ? "" : undefined} />
                  ))}
                </div>
              ) : null}
              <span className="fui-sr-only" role="status">
                {copiedNow ? (copiedNow.done ? text.copied : text.copyFailed) : ""}
              </span>
              {showStrip ? (
                <div className="fui-viewer-strip" role="group" aria-label={text.thumbnails} data-dots={showDots ? "" : undefined}>
                  {items.map((item, position) => (
                    <button
                      key={`${item.src}-${position}`}
                      type="button"
                      className="fui-viewer-thumb"
                      aria-label={`${item.alt || label}, ${text.position(position, total)}`}
                      aria-current={position === index ? "true" : undefined}
                      onClick={() => go(position)}
                    >
                      <img src={item.thumb ?? item.poster ?? item.src} alt="" loading="lazy" draggable={false} />
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

export type ImageViewerProviderProps = {
  children?: ReactNode;
  /** The viewer's name, said with the position ("Photos, 3 of 8"). */
  label?: string;
  labels?: Partial<ViewerLabels>;
  thumbnails?: boolean;
  renderMedia?: ImageViewerProps["renderMedia"];
  actions?: readonly ViewerAction[];
  zoomOn?: ImageViewerProps["zoomOn"];
  compact?: boolean;
  dragToClose?: boolean;
  onNearEnd?: () => void;
};

/**
 * One viewer for everything below it. `useImageViewer` opens it from anywhere (`open(items, index)`), and a `ZoomableImage`
 * or a `MediaGrid openWith="viewer"` opens it on its own picture, with its group as the set. The controlled `ImageViewer`
 * stays what it was; this is the wiring a page with many pictures does not want to write.
 */
export function ImageViewerProvider({ children, label, labels, thumbnails, renderMedia, actions, zoomOn, compact, dragToClose, onNearEnd }: ImageViewerProviderProps) {
  const [shown, setShown] = useState<{ items: ViewerItem[]; index: number } | null>(null);
  const [opener, setOpener] = useState<HTMLElement | null>(null);
  const groups = useRef(new Map<string, Set<ImageViewerMember>>()).current;
  const text = useLabels("imageViewer", LABELS, labels);
  const control = useMemo<ImageViewerControl>(
    () => ({
      open: (items, index = 0, options) => {
        if (items.length === 0) return;
        const active = typeof document === "undefined" ? null : document.activeElement instanceof HTMLElement ? document.activeElement : null;
        setOpener(options?.returnFocus ?? active);
        setShown({ items: [...items], index: Math.min(Math.max(index, 0), items.length - 1) });
      },
      close: () => setShown(null),
      openLabel: (alt) => text.open(alt),
      join: (group, member) => {
        const members = groups.get(group) ?? new Set<ImageViewerMember>();
        groups.set(group, members);
        members.add(member);
        return () => {
          members.delete(member);
          if (members.size === 0) groups.delete(group);
        };
      },
      members: (group) =>
        [...(groups.get(group) ?? [])].sort((a, b) => {
          const one = a.node();
          const other = b.node();
          if (!one || !other || one === other) return 0;
          return one.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
        }),
    }),
    [groups, text.open],
  );
  const focus = useMemo(() => ({ current: opener }), [opener]);
  return (
    <ImageViewerControlContext.Provider value={control}>
      <ImageViewerOpenContext.Provider value={shown !== null}>
        {children}
        <ImageViewer
          items={shown?.items ?? []}
          index={shown?.index ?? null}
          onIndexChange={(index) => setShown((current) => (current ? { ...current, index } : current))}
          onClose={() => setShown(null)}
          label={label}
          thumbnails={thumbnails}
          labels={labels}
          renderMedia={renderMedia}
          actions={actions}
          zoomOn={zoomOn}
          compact={compact}
          dragToClose={dragToClose}
          onNearEnd={onNearEnd}
          returnFocus={focus}
        />
      </ImageViewerOpenContext.Provider>
    </ImageViewerControlContext.Provider>
  );
}

export type ImageViewerGroupProps = {
  /** The group's name: every picture inside it opens in one viewer, in the order of the document. */
  name: string;
  children?: ReactNode;
};

/** Pictures that belong together (one gallery per message, a row of results): they page into each other in the viewer. */
export function ImageViewerGroup({ name, children }: ImageViewerGroupProps) {
  return <ImageViewerGroupContext.Provider value={name}>{children}</ImageViewerGroupContext.Provider>;
}

export type ZoomableImageProps = ImageProps & {
  /** The picture the viewer shows, when the one in the page is a smaller copy. */
  full?: string;
  /** The set it joins: every `ZoomableImage` with the same group in the provider opens in one viewer (0.12). */
  group?: string;
  /** Who made the picture, said under it in the viewer (0.12). */
  credit?: ReactNode;
  sourceUrl?: string;
  sourceLabel?: string;
  /** The name of the file a download saves (0.12). */
  downloadName?: string;
  /** A URL for the download key in the viewer; `false` leaves it out. */
  download?: string | false;
  /** The name of the action, from the viewer's labels: "Open {alt}" by default. */
  labels?: Partial<Pick<ViewerLabels, "open">>;
};

/**
 * An `Image` that opens the nearest `ImageViewerProvider`'s viewer when pressed: a real button named "Open {alt}", or, in a
 * group, its own place in the set the group forms. Outside a provider it is a plain image, not a control that does nothing.
 */
export function ZoomableImage({
  full,
  group,
  credit,
  sourceUrl,
  sourceLabel,
  downloadName,
  download,
  labels,
  alt = "",
  src,
  className,
  style,
  ...image
}: ZoomableImageProps) {
  const viewer = useImageViewer();
  const control = useContext(ImageViewerControlContext);
  const named = useContext(ImageViewerGroupContext);
  const name = group ?? named;
  const node = useRef<HTMLDivElement | null>(null);
  const item: ViewerItem = {
    src: full ?? (typeof src === "string" ? src : ""),
    alt,
    thumb: typeof src === "string" ? src : undefined,
    width: typeof image.width === "number" ? image.width : undefined,
    height: typeof image.height === "number" ? image.height : undefined,
    caption: image.caption,
    credit,
    sourceUrl,
    sourceLabel,
    download,
    downloadName,
  };
  const latest = useRef(item);
  latest.current = item;
  const linked = !!viewer && !!control;
  useEffect(() => {
    if (!linked || !control || !name) return;
    return control.join(name, { node: () => node.current, item: () => latest.current });
  }, [linked, control, name]);
  if (!viewer || !control) return <Image alt={alt} src={src} className={className} style={style} {...image} />;
  const text = useLabels("imageViewer", LABELS, labels);
  // The button, not the wrapper: focus comes back to what was pressed, and a div cannot take it.
  const press = (element: HTMLElement) => {
    const set = name ? control.members(name) : [];
    if (set.length === 0) return control.open([item], 0, { returnFocus: element });
    const at = set.findIndex((member) => member.node() === node.current);
    control.open(
      set.map((member) => member.item()),
      at < 0 ? 0 : at,
      { returnFocus: element },
    );
  };
  return (
    <div ref={node} className={classes("fui-zoomable", className)} style={style}>
      <Image
        alt={alt}
        src={src}
        {...image}
        pressLabel={text.open(alt)}
        onPress={(element) => press(element)}
      />
    </div>
  );
}
