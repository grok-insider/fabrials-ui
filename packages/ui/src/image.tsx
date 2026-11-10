"use client";
// Origin: Fabrials, 0.10. AspectRatio under shadcn's name; Image and MediaGrid assimilated from X Tracker's media-image
// and post mosaic. 0.12: a picture that opens a viewer (`ZoomableImage` lives in image-viewer), a gallery that grows past
// four tiles with a lead one, a line under each tile and a broken one dropped.

import { useCallback, useId, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";
import { ImageOff } from "lucide-react";
import { useImageViewer } from "./image-viewer-context";
import { galleryLayout } from "./media-logic";
import { classes } from "./shared";

const ratioValue = (ratio: number | string | undefined) => (ratio === undefined ? undefined : typeof ratio === "number" ? String(ratio) : ratio);

/** A box that keeps its shape whatever its width: `ratio` is width over height (16 / 9 is 1.78). */
export function AspectRatio({ ratio = 1, className, style, ...props }: ComponentProps<"div"> & { ratio?: number | string }) {
  return (
    <div
      data-slot="aspect-ratio"
      className={classes("fui-aspect-ratio", className)}
      style={{ ...style, "--fui-aspect-ratio": ratioValue(ratio) } as CSSProperties}
      {...props}
    />
  );
}

export type ImageProps = Omit<ComponentProps<"img">, "className" | "style" | "children"> & {
  /** The frame's shape, so nothing moves when the image arrives ("16 / 9", 1.5). From width and height when left out. */
  ratio?: number | string;
  /** `cover` fills the frame and crops; `contain` shows all of it on the stage colour. */
  fit?: "cover" | "contain";
  /** A caption under the image: the frame becomes a figure. */
  caption?: ReactNode;
  /** What shows when the image cannot load; the alt text on a quiet plate by default. */
  fallback?: ReactNode;
  /** The frame is pressed: it becomes a button, named by `pressLabel` (0.12, what `ZoomableImage` uses). */
  onPress?: (button: HTMLElement) => void;
  pressLabel?: string;
  className?: string;
  style?: CSSProperties;
  imgClassName?: string;
};

/**
 * An image in a frame that keeps its shape while it loads, appears through the 2 px dither when it arrives late (never
 * when it is cached), and says what it was when it fails. Always give `alt`; `alt=""` only for decoration. With `onPress`
 * the frame is a button, and nothing is drawn when the picture itself failed.
 */
export function Image({
  ratio,
  fit = "cover",
  caption,
  fallback,
  onPress,
  pressLabel,
  className,
  style,
  imgClassName,
  alt = "",
  width,
  height,
  src,
  loading = "lazy",
  decoding = "async",
  onLoad,
  onError,
  ...props
}: ImageProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<string | null>(null);
  const shape = ratio ?? (width && height ? `${width} / ${height}` : undefined);
  const watch = useCallback(
    (node: HTMLImageElement | null) => {
      if (!node || !src) return;
      // A server-rendered image can fail before hydration attaches onError: it finished with no pixels.
      if (node.complete && node.naturalWidth === 0) setFailed(String(src));
      else if (node.complete) setLoaded(String(src));
      else node.dataset.fuiReveal = "pending";
    },
    [src],
  );
  const broken = !!src && failed === String(src);
  const state = broken ? "error" : loaded === String(src) ? "loaded" : "loading";
  const Frame = caption ? "figure" : "div";
  const contents = broken ? (
    <span className="fui-image-fallback" {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })}>
      {fallback ?? (
        <>
          <ImageOff aria-hidden="true" />
          {alt ? <span aria-hidden="true">{alt}</span> : null}
        </>
      )}
    </span>
  ) : src ? (
    <img
      {...props}
      ref={watch}
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      className={classes("fui-image-img", imgClassName)}
      onLoad={(event) => {
        setLoaded(String(src));
        if (event.currentTarget.dataset.fuiReveal === "pending") event.currentTarget.dataset.fuiReveal = "in";
        onLoad?.(event);
      }}
      onError={(event) => {
        setFailed(String(src));
        onError?.(event);
      }}
    />
  ) : null;
  return (
    <Frame
      data-slot="image"
      data-state={state}
      data-fit={fit}
      className={classes("fui-image", className)}
      style={{ ...style, "--fui-aspect-ratio": ratioValue(shape) } as CSSProperties}
    >
      {onPress && !broken ? (
        <button type="button" className="fui-image-frame fui-image-action" aria-label={pressLabel ?? alt} onClick={(event) => onPress(event.currentTarget)}>
          {contents}
        </button>
      ) : (
        <span className="fui-image-frame">{contents}</span>
      )}
      {caption ? <figcaption className="fui-image-caption">{caption}</figcaption> : null}
    </Frame>
  );
}

export type MediaGridItem = {
  src: string;
  alt: string;
  /** A smaller copy for the tile. */
  thumb?: string;
  /** Marks a tile as a video or a GIF. */
  kind?: "image" | "video" | "gif";
  /** A line over the foot of the tile, on hover and on focus, and always on a touch screen (0.12). */
  caption?: ReactNode;
  /** Who made it, under the caption (0.12). */
  credit?: ReactNode;
  sourceUrl?: string;
  sourceLabel?: string;
  /** The name a download saves it as, in the viewer (0.12). */
  downloadName?: string;
  /** A URL for the viewer's download key; `false` leaves it out. */
  download?: string | false;
  width?: number;
  height?: number;
};

export type MediaGridProps = Omit<ComponentProps<"div">, "children"> & {
  items: readonly MediaGridItem[];
  /** The most tiles drawn: four in a grid (the rest is "+N"), eight in a gallery. */
  max?: number;
  /** `grid` is the mosaic a post shows (the default); `gallery` lays out up to eight tiles around a lead one (0.12). */
  layout?: "grid" | "gallery";
  onOpen?: (index: number) => void;
  /** Open the nearest `ImageViewerProvider`'s viewer on the tile pressed, with the unbroken items around it (0.12). */
  openWith?: "viewer";
  openLabel?: (item: MediaGridItem, index: number, total: number) => string;
  moreLabel?: (hidden: number) => string;
  kindLabel?: { video: string; gif: string };
  ratio?: number | string;
  /** The group's name, said by a screen reader ("Photos of the harbour") (0.12). */
  caption?: string;
  /** A line under the tiles: where they come from (0.12). */
  footer?: ReactNode;
  /** What to draw when every tile failed and `hideBroken` took them away (0.12). */
  empty?: ReactNode;
  /** A tile whose picture fails leaves the grid, and the viewer's set, instead of leaving a hole (0.12). */
  hideBroken?: boolean;
  onItemError?: (item: MediaGridItem, index: number) => void;
  referrerPolicy?: ReferrerPolicy;
};

const notBroken = (item: { src: string }, broken: ReadonlySet<string>) => !broken.has(item.src);

/**
 * One to four images in the shape a post shows them: one wide, two side by side, one tall and two stacked, or a square of
 * four. More than `max` turns the last tile into "+N". With `onOpen` or inside an `ImageViewerProvider` (`openWith`), each
 * tile is a button that opens the viewer. `layout="gallery"` draws up to eight, with a line over each tile, a broken one
 * removed and a footer under them.
 */
export function MediaGrid({
  items,
  max,
  layout = "grid",
  onOpen,
  openWith,
  openLabel = (item, index, total) => (item.alt ? `${item.alt} (${index + 1} of ${total})` : `Open item ${index + 1} of ${total}`),
  moreLabel = (hidden) => `${hidden} more`,
  kindLabel = { video: "Video", gif: "GIF" },
  ratio = "16 / 9",
  caption,
  footer,
  empty,
  hideBroken = false,
  onItemError,
  referrerPolicy,
  className,
  style,
  ...props
}: MediaGridProps) {
  const viewer = useImageViewer();
  const base = useId();
  const signature = items.map((item) => item.src).join("\n");
  const [failed, setFailed] = useState<{ signature: string; srcs: ReadonlySet<string> }>({ signature, srcs: new Set() });
  if (failed.signature !== signature) setFailed({ signature, srcs: new Set() });
  const broken = failed.srcs;
  const report = (item: MediaGridItem, index: number) => {
    if (!hideBroken) return onItemError?.(item, index);
    onItemError?.(item, index);
    setFailed((current) => (current.srcs.has(item.src) ? current : { ...current, srcs: new Set(current.srcs).add(item.src) }));
  };
  const visible = items.map((item, index) => ({ item, index })).filter(({ item }) => !hideBroken || notBroken(item, broken));
  const shape = galleryLayout(visible.length, layout === "gallery" ? (max ?? 8) : Math.min(4, max ?? 4));
  const shown = visible.slice(0, shape.shown);
  const hidden = visible.length - shown.length;
  const opens = !!onOpen || (openWith === "viewer" && !!viewer);
  const press = (item: MediaGridItem, index: number, place: number, tile: HTMLElement) => {
    if (onOpen) return onOpen(index);
    if (!viewer) return;
    viewer.open(
      hideBroken ? visible.map((entry) => entry.item) : items,
      Math.max(0, hideBroken ? place : index),
      { returnFocus: tile },
    );
  };
  const grid = (
    <div
      data-slot="media-grid"
      data-count={shown.length}
      data-layout={layout === "gallery" ? "gallery" : undefined}
      data-columns={layout === "gallery" ? shape.columns : undefined}
      data-lead={layout === "gallery" && shape.lead ? "" : undefined}
      data-span-first={layout === "gallery" && shape.spanFirst ? "" : undefined}
      className={classes("fui-media-grid", className)}
      style={{ ...style, "--fui-aspect-ratio": ratioValue(ratio) } as CSSProperties}
      {...props}
    >
      {shown.length === 0 && empty ? <div className="fui-media-grid-empty">{empty}</div> : null}
      {shown.map(({ item, index }, place) => {
        const more = place === shown.length - 1 && hidden > 0 ? hidden : 0;
        const described = item.caption || item.credit ? `${base}-tile-${place}` : undefined;
        const content = (
          <>
            <img
              src={item.thumb ?? item.src}
              alt={opens ? "" : item.alt}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="fui-media-grid-img"
              referrerPolicy={referrerPolicy}
              onError={() => report(item, index)}
            />
            {item.kind && item.kind !== "image" ? (
              <span className="fui-media-grid-kind" aria-hidden={opens ? true : undefined}>
                {kindLabel[item.kind]}
              </span>
            ) : null}
            {more ? (
              <span className="fui-media-grid-more" aria-hidden="true">
                +{more}
              </span>
            ) : null}
            {!more && (item.caption || item.credit) ? (
              <span id={described} className="fui-media-grid-caption" dir="auto">
                {item.caption ? <span className="fui-media-grid-caption-text">{item.caption}</span> : null}
                {item.credit ? <span className="fui-media-grid-credit">{item.credit}</span> : null}
              </span>
            ) : null}
          </>
        );
        return opens ? (
          <button
            key={`${item.src}-${place}`}
            type="button"
            className="fui-media-grid-tile"
            aria-label={more ? `${openLabel(item, place, visible.length)}, ${moreLabel(more)}` : openLabel(item, place, visible.length)}
            aria-describedby={more ? undefined : described}
            onClick={(event) => press(item, index, place, event.currentTarget)}
          >
            {content}
          </button>
        ) : (
          <span key={`${item.src}-${place}`} className="fui-media-grid-tile">
            {content}
          </span>
        );
      })}
    </div>
  );
  const group = (body: ReactNode) =>
    caption || footer || layout === "gallery" ? (
      <figure className="fui-media" role={caption ? "group" : undefined} aria-label={caption}>
        {body}
        {footer ? <figcaption className="fui-media-footer">{footer}</figcaption> : null}
      </figure>
    ) : (
      body
    );
  return group(grid);
}
