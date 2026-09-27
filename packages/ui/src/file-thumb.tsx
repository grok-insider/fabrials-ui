"use client";

import { useCallback, useState, type CSSProperties, type ReactNode } from "react";
import { FileText } from "lucide-react";
import { classes } from "./shared";

export function fileTypeLabel(filename?: string | null, mime?: string | null) {
  const fromName = filename?.match(/\.([a-z0-9]{1,5})$/i)?.[1];
  const fromMime = mime?.split("/")[1]?.split(/[+;.-]/)[0];
  return (fromName || fromMime || "file").slice(0, 4).toUpperCase();
}

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
