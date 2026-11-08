"use client";
// Origin: Fabrials, 0.10, assimilated from X Tracker's lightbox (zoom to real size and back, look around by dragging or
// with the keys, a swipe or the arrows to move, a strip of neighbours). The viewer is always dark: it carries the dark
// theme's tokens, so every control in it reads on the stage in both themes.

import { useCallback, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, Download, ImageOff, X, ZoomIn, ZoomOut } from "lucide-react";
import { buttonVariants } from "./button-variants";
import { IconButton } from "./icon-button";
import { clamp, focusOf, isDrag, panDelta, pinchScale, scrollToKeep, stepScale, swipeStep, wheelScale, zoomLimit } from "./media-logic";
import { PixelSpinner } from "./pixel-spinner";

export type ViewerItem = {
  src: string;
  alt: string;
  /** A small copy for the strip of neighbours. */
  thumb?: string;
  width?: number;
  height?: number;
  caption?: ReactNode;
  /** A URL for the download button; `false` hides it. The image itself by default. */
  download?: string | false;
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
};

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
};

/**
 * Images on a dark stage, one at a time. The wheel (or a pinch) zooms by steps around the pointer, from fitted to twice the
 * real size; a click, Z or the key goes to the real size around the point pressed and back to fitted; + and − step, 0 fits.
 * Zoomed, drag with the left button (or a finger), the arrows or a sideways scroll look around. Fitted, the arrows (or a
 * swipe) move to the neighbours, Home and End to the ends. Escape closes and focus goes back to what opened it.
 */
export function ImageViewer({ items, index, onIndexChange, onClose, label = "Images", thumbnails, labels, renderMedia, onNearEnd }: ImageViewerProps) {
  const text = { ...LABELS, ...labels };
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
  const press = useRef<{ x: number; y: number; left: number; top: number; moved: boolean; onImage: boolean; pinch: number; scale: number } | null>(null);
  const status = current && state?.src === current.src ? state.status : "loading";

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
      press.current = { x: event.clientX, y: event.clientY, left: node.scrollLeft, top: node.scrollTop, moved: true, onImage: false, pinch, scale: scaleNow.current };
      return;
    }
    // Where the press began: the pointer is captured, so the release is reported on the stage, not on the picture.
    const onImage = !!(event.target as HTMLElement).closest("[data-viewer-image]");
    press.current = { x: event.clientX, y: event.clientY, left: node.scrollLeft, top: node.scrollTop, moved: false, onImage, pinch: 0, scale: scaleNow.current };
    event.currentTarget.setPointerCapture(event.pointerId);
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
    if (isDrag(start, { x: event.clientX, y: event.clientY })) start.moved = true;
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
      const [rest] = [...pointers.current.values()];
      const node = stage.current;
      if (start.pinch !== 0 && rest && node) {
        press.current = { x: rest.x, y: rest.y, left: node.scrollLeft, top: node.scrollTop, moved: true, onImage: false, pinch: -1, scale: scaleNow.current };
      }
      return;
    }
    press.current = null;
    if (start.pinch !== 0) return;
    const end = { x: event.clientX, y: event.clientY };
    if (!start.moved && start.onImage) toggle(end);
    else if (scaleNow.current <= 1 && event.pointerType === "touch") {
      const step = swipeStep(start, end, getComputedStyle(event.currentTarget).direction === "rtl");
      if (step) go(index! + step);
    }
  };

  const download = current && isImage ? (current.download === false ? null : (current.download ?? current.src)) : null;
  const showStrip = (thumbnails ?? total > 1) && total > 1;

  return (
    <BaseDialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fui-viewer-backdrop" />
        <BaseDialog.Popup
          className="dark fui-viewer"
          data-theme="dark"
          data-zoomed={zoomed ? "" : undefined}
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
                  {download ? (
                    <a href={download} download className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label={text.download} title={text.download}>
                      <Download aria-hidden="true" />
                    </a>
                  ) : null}
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
                    )}
                    {status === "loading" ? (
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
              {showStrip ? (
                <div className="fui-viewer-strip" role="group" aria-label={text.thumbnails}>
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
