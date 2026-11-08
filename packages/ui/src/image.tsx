"use client";
// Origin: Fabrials, 0.10. AspectRatio under shadcn's name; Image and MediaGrid assimilated from X Tracker's media-image
// and post mosaic.

import { useCallback, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";
import { ImageOff } from "lucide-react";
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
  className?: string;
  style?: CSSProperties;
  imgClassName?: string;
};

/**
 * An image in a frame that keeps its shape while it loads, appears through the 2 px dither when it arrives late (never
 * when it is cached), and says what it was when it fails. Always give `alt`; `alt=""` only for decoration.
 */
export function Image({
  ratio,
  fit = "cover",
  caption,
  fallback,
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
  return (
    <Frame
      data-slot="image"
      data-state={state}
      data-fit={fit}
      className={classes("fui-image", className)}
      style={{ ...style, "--fui-aspect-ratio": ratioValue(shape) } as CSSProperties}
    >
      <span className="fui-image-frame">
        {broken ? (
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
        ) : null}
      </span>
      {caption ? <figcaption className="fui-image-caption">{caption}</figcaption> : null}
    </Frame>
  );
}

export type MediaGridItem = { src: string; alt: string; /** A smaller copy for the tile. */ thumb?: string; /** Marks a tile as a video or a GIF. */ kind?: "image" | "video" | "gif" };

/**
 * One to four images in the shape a post shows them: one wide, two side by side, one tall and two stacked, or a square of
 * four. More than `max` turns the last tile into "+N". With `onOpen`, each tile is a button that opens the viewer.
 */
export function MediaGrid({
  items,
  max = 4,
  onOpen,
  openLabel = (item, index, total) => (item.alt ? `${item.alt} (${index + 1} of ${total})` : `Open item ${index + 1} of ${total}`),
  moreLabel = (hidden) => `${hidden} more`,
  kindLabel = { video: "Video", gif: "GIF" },
  ratio = "16 / 9",
  className,
  style,
  ...props
}: Omit<ComponentProps<"div">, "children"> & {
  items: readonly MediaGridItem[];
  max?: 1 | 2 | 3 | 4;
  onOpen?: (index: number) => void;
  openLabel?: (item: MediaGridItem, index: number, total: number) => string;
  moreLabel?: (hidden: number) => string;
  kindLabel?: { video: string; gif: string };
  ratio?: number | string;
}) {
  const shown = items.slice(0, max);
  const hidden = items.length - shown.length;
  return (
    <div
      data-slot="media-grid"
      data-count={shown.length}
      className={classes("fui-media-grid", className)}
      style={{ ...style, "--fui-aspect-ratio": ratioValue(ratio) } as CSSProperties}
      {...props}
    >
      {shown.map((item, index) => {
        const more = index === shown.length - 1 && hidden > 0 ? hidden : 0;
        const content = (
          <>
            <img src={item.thumb ?? item.src} alt={onOpen ? "" : item.alt} loading="lazy" decoding="async" draggable={false} className="fui-media-grid-img" />
            {item.kind && item.kind !== "image" ? (
              <span className="fui-media-grid-kind" aria-hidden={onOpen ? true : undefined}>
                {kindLabel[item.kind]}
              </span>
            ) : null}
            {more ? (
              <span className="fui-media-grid-more" aria-hidden="true">
                +{more}
              </span>
            ) : null}
          </>
        );
        return onOpen ? (
          <button
            key={`${item.src}-${index}`}
            type="button"
            className="fui-media-grid-tile"
            aria-label={more ? `${openLabel(item, index, items.length)}, ${moreLabel(more)}` : openLabel(item, index, items.length)}
            onClick={() => onOpen(index)}
          >
            {content}
          </button>
        ) : (
          <span key={`${item.src}-${index}`} className="fui-media-grid-tile">
            {content}
          </span>
        );
      })}
    </div>
  );
}
