"use client";

import { useCallback, useState, type CSSProperties, type ReactNode } from "react";
import { FileText } from "lucide-react";
import { fileTypeLabel } from "./format";
import { classes } from "./shared";

export { fileTypeLabel } from "./format";

export type FileThumbProps = {
  src?: string | null;
  mime?: string | null;
  filename?: string | null;
  alt?: string;
  icon?: ReactNode;
  size?: number;
  className?: string;
};

export function FileThumb({
  src,
  mime,
  filename,
  alt = "",
  icon,
  size = 40,
  className,
}: FileThumbProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  // A server-rendered image can fail before hydration attaches onError; the
  // ref callback catches that case (finished loading with no pixels).
  const checkLoaded = useCallback(
    (img: HTMLImageElement | null) => {
      if (img && src && img.complete && img.naturalWidth === 0) setFailedSrc(src);
      // An image still on its way when it mounts appears through the dither once it arrives; a cached one just shows.
      if (img && src && !img.complete) img.dataset.fuiReveal = "pending";
    },
    [src],
  );
  const style = { "--fui-file-thumb-size": `${size}px` } as CSSProperties;
  const isImage = !mime || mime.startsWith("image/");

  if (src && isImage && failedSrc !== src) {
    return (
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className={classes("fui-file-thumb", "fui-file-thumb-image", className)}
        style={style}
        onError={() => setFailedSrc(src)}
        onLoad={(event) => {
          if (event.currentTarget.dataset.fuiReveal === "pending") event.currentTarget.dataset.fuiReveal = "in";
        }}
        ref={checkLoaded}
      />
    );
  }

  return (
    <span
      className={classes("fui-file-thumb", "fui-file-thumb-tile", className)}
      style={style}
      {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })}
    >
      <span aria-hidden className="fui-file-thumb-icon">
        {icon ?? <FileText />}
      </span>
      <span aria-hidden className="fui-file-thumb-ext">
        {fileTypeLabel(filename, mime)}
      </span>
    </span>
  );
}
