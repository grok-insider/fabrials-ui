"use client";
// Origin: Fabrials, 0.10, assimilated from X Tracker's lightbox (zoom to real size and back, look around by dragging or
// with the keys, a swipe or the arrows to move, a strip of neighbours). The viewer is always dark: it carries the dark
// theme's tokens, so every control in it reads on the stage in both themes.

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, Download, ImageOff, X, ZoomIn, ZoomOut } from "lucide-react";
import { buttonVariants } from "./button-variants";
import { IconButton } from "./icon-button";
import { focusOf, isDrag, panDelta, pinchIntent, scrollForFocus, swipeStep, wheelIntent } from "./media-logic";
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
 * Images on a dark stage, one at a time. A click, Z, the wheel or a pinch brings an image to its real size around the point
 * looked at; then drag, scroll or use the arrows to look around, and the same again fits it. Fitted, the arrows (or a
 * swipe) move to the neighbours, Home and End to the ends. Escape closes and focus goes back to what opened it.
 */
export function ImageViewer({ items, index, onIndexChange, onClose, label = "Images", thumbnails, labels, renderMedia, onNearEnd }: ImageViewerProps) {
  const text = { ...LABELS, ...labels };
  const open = index !== null && index >= 0 && index < items.length;
  const current = open ? items[index]! : null;
  const total = items.length;
  const isImage = !!current && (!current.kind || current.kind === "image");
  const [zoomedKey, setZoomedKey] = useState<string | null>(null);
  const [state, setState] = useState<{ src: string; status: "loading" | "loaded" | "failed" } | null>(null);
  const [canZoom, setCanZoom] = useState(false);
  const zoomed = !!current && isImage && zoomedKey === current.src;
  const stage = useRef<HTMLDivElement | null>(null);
  const focus = useRef({ fx: 0.5, fy: 0.5 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const press = useRef<{ x: number; y: number; left: number; top: number; moved: boolean; pinch: number; fired: boolean } | null>(null);
  const status = current && state?.src === current.src ? state.status : "loading";

  const go = useCallback(
    (to: number) => {
      if (!open) return;
      const next = Math.min(total - 1, Math.max(0, to));
      if (next === index) return;
      setZoomedKey(null);
      onIndexChange(next);
      if (next >= total - 3) onNearEnd?.();
    },
    [open, total, index, onIndexChange, onNearEnd],
  );

  const zoomTo = (on: boolean, at?: { x: number; y: number }) => {
    if (!current || !isImage || (on && !canZoom)) return;
    if (on) {
      const image = stage.current?.querySelector("img");
      focus.current = image ? focusOf(image.getBoundingClientRect(), at) : { fx: 0.5, fy: 0.5 };
    }
    setZoomedKey(on ? current.src : null);
  };

  // At real size, the point that was looked at goes to the middle of the stage.
  useLayoutEffect(() => {
    const node = stage.current;
    const image = node?.querySelector<HTMLElement>("[data-viewer-image]");
    if (!node || !image || !zoomed) return;
    const box = image.getBoundingClientRect();
    const frame = node.getBoundingClientRect();
    const to = scrollForFocus(
      focus.current,
      { left: box.left - frame.left + node.scrollLeft, top: box.top - frame.top + node.scrollTop, width: box.width, height: box.height },
      { width: node.clientWidth, height: node.clientHeight },
    );
    node.scrollTo(to.left, to.top);
  }, [zoomed]);

  // The wheel needs preventDefault (a trackpad pinch would zoom the page), so it is attached by hand, not passive.
  const wheel = useRef<(event: WheelEvent) => void>(() => {});
  useEffect(() => {
    wheel.current = (event) => {
      if (!isImage) return;
      if (event.ctrlKey) event.preventDefault();
      const intent = wheelIntent(event, zoomed);
      if (!intent) return;
      event.preventDefault();
      zoomTo(intent === "in", { x: event.clientX, y: event.clientY });
    };
  });
  const stageRef = useCallback((node: HTMLDivElement | null) => {
    const listener = (event: WheelEvent) => wheel.current(event);
    stage.current = node;
    node?.addEventListener("wheel", listener, { passive: false });
    return () => node?.removeEventListener("wheel", listener);
  }, []);

  const measure = (image: HTMLImageElement) => {
    const node = stage.current;
    if (!node) return;
    const fitted = image.getBoundingClientRect();
    setCanZoom(image.naturalWidth > fitted.width + 1 || image.naturalHeight > fitted.height + 1);
  };

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
    } else if (key === "z" || key === "Z") zoomTo(!zoomed);
    else if (key === "+" || key === "=") zoomTo(true);
    else if (key === "-") zoomTo(false);
  };

  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const node = stage.current;
    if (!node) return;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      press.current = { x: event.clientX, y: event.clientY, left: node.scrollLeft, top: node.scrollTop, moved: true, pinch: Math.hypot(a!.x - b!.x, a!.y - b!.y), fired: false };
      return;
    }
    press.current = { x: event.clientX, y: event.clientY, left: node.scrollLeft, top: node.scrollTop, moved: false, pinch: 0, fired: false };
    if (zoomed && event.pointerType !== "touch") event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = press.current;
    if (!start || !pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (start.pinch > 0 && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const intent = pinchIntent(start.pinch, Math.hypot(a!.x - b!.x, a!.y - b!.y), zoomed);
      if (intent && !start.fired) {
        start.fired = true;
        zoomTo(intent === "in", { x: (a!.x + b!.x) / 2, y: (a!.y + b!.y) / 2 });
      }
      return;
    }
    if (isDrag(start, { x: event.clientX, y: event.clientY })) start.moved = true;
    if (zoomed && event.pointerType !== "touch" && start.moved && stage.current) {
      stage.current.scrollLeft = start.left - (event.clientX - start.x);
      stage.current.scrollTop = start.top - (event.clientY - start.y);
    }
  };
  const pointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = press.current;
    pointers.current.delete(event.pointerId);
    if (!start || pointers.current.size > 0) return;
    press.current = null;
    if (start.pinch > 0) return;
    const end = { x: event.clientX, y: event.clientY };
    if (!start.moved && (event.target as HTMLElement).closest("[data-viewer-image]")) zoomTo(!zoomed, end);
    else if (!zoomed && event.pointerType === "touch") {
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
          initialFocus={() => stage.current}
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
                  {isImage ? (
                    <IconButton
                      size="icon"
                      label={zoomed ? text.zoomOut : text.zoomIn}
                      shortcut={["Z"]}
                      aria-pressed={zoomed}
                      disabled={!canZoom && !zoomed}
                      onClick={() => zoomTo(!zoomed)}
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
                aria-label={current.alt || label}
                role="group"
                className="fui-viewer-stage"
                data-zoomable={isImage && canZoom ? "" : undefined}
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
                        onLoad={(event) => {
                          setState({ src: current.src, status: "loaded" });
                          measure(event.currentTarget);
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
