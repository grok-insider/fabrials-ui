"use client";

import type { CSSProperties, ReactNode } from "react";
import { Spinner } from "@fabrials/ui";
import { useArrivals } from "./agent";
import {
  AlertIcon,
  FileTextIcon,
  ImageIcon,
  MusicIcon,
  PaperclipIcon,
  VideoIcon,
  XIcon,
} from "./chat-icons";

export type AttachmentItem = {
  id: string;
  name: string;
  mediaType: string;
  url?: string;
  size?: number;
  status?: "ready" | "uploading" | "error";
  /** Upload progress, 0 to 1, while `status` is "uploading". With it the tile draws a ring that closes as the file goes up and
   * counts the percentage; without it a spinner says it is busy. */
  progress?: number;
  error?: string;
};

function percentOf(progress: number | undefined) {
  return progress === undefined ? undefined : Math.round(Math.min(1, Math.max(0, progress)) * 100);
}

export type AttachmentCategory = "image" | "video" | "audio" | "document" | "unknown";

export type AttachmentVariant = "grid" | "inline" | "list";

export function attachmentCategory(mediaType: string | undefined): AttachmentCategory {
  const type = mediaType ?? "";
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (type.startsWith("application/") || type.startsWith("text/")) return "document";
  return "unknown";
}

export function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined || !Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 10 ? Math.round(value) : Math.round(value * 10) / 10} ${units[unit]}`;
}

function typeLabel(mediaType: string) {
  const subtype = mediaType.split(";")[0]?.split("/")[1] ?? "";
  return subtype ? subtype.replace(/^x-/, "").replace(/^vnd\..*\./, "").toUpperCase() : "";
}

export function attachmentDetail(item: AttachmentItem): string {
  return [typeLabel(item.mediaType), formatBytes(item.size)].filter(Boolean).join(" · ");
}

const ICONS = {
  audio: MusicIcon,
  document: FileTextIcon,
  image: ImageIcon,
  unknown: PaperclipIcon,
  video: VideoIcon,
} satisfies Record<AttachmentCategory, unknown>;

function Preview({ item, variant }: { item: AttachmentItem; variant: AttachmentVariant }) {
  const category = attachmentCategory(item.mediaType);
  const Icon = item.status === "error" ? AlertIcon : ICONS[category];
  let content: ReactNode = <Icon />;
  if (item.status !== "error" && item.url && category === "image") {
    content = <img alt={variant === "grid" ? item.name : ""} decoding="async" loading="lazy" src={item.url} />;
  } else if (item.status !== "error" && item.url && category === "video") {
    content = <video aria-hidden muted playsInline preload="metadata" src={item.url} />;
  }
  const percent = percentOf(item.progress);
  return (
    <span className="fui-attachment-preview" data-category={category}>
      {content}
      {item.status === "uploading" && percent === undefined ? (
        <span className="fui-attachment-busy">
          <Spinner label={`Uploading ${item.name}`} />
        </span>
      ) : null}
    </span>
  );
}

/** The ring an upload draws round its tile: it closes clockwise as the file goes up. */
function UploadRing({ percent }: { percent: number }) {
  return (
    <svg aria-hidden="true" className="fui-attachment-ring" focusable="false">
      <rect className="fui-attachment-ring-track" height="100%" pathLength={100} rx={9} width="100%" />
      <rect className="fui-attachment-ring-fill" height="100%" pathLength={100} rx={9} style={{ strokeDashoffset: 100 - percent }} width="100%" />
    </svg>
  );
}

export type AttachmentChipProps = {
  item: AttachmentItem;
  variant?: AttachmentVariant;
  onRemove?: (id: string) => void;
  removeLabel?: (item: AttachmentItem) => string;
  className?: string;
};

export function AttachmentChip({
  item,
  variant = "inline",
  onRemove,
  removeLabel = (value) => `Remove ${value.name}`,
  className,
}: AttachmentChipProps) {
  const percent = percentOf(item.progress);
  const uploading = item.status === "uploading";
  const detail =
    item.status === "error"
      ? item.error || "Upload failed"
      : uploading
        ? percent === undefined
          ? "Uploading…"
          : `Uploading ${percent}%`
        : attachmentDetail(item);
  return (
    <div
      aria-busy={uploading || undefined}
      className={["fui-attachment", className].filter(Boolean).join(" ")}
      data-status={item.status ?? "ready"}
      data-variant={variant}
      title={variant === "grid" ? `${item.name}${detail ? ` · ${detail}` : ""}` : undefined}
    >
      <Preview item={item} variant={variant} />
      {percent !== undefined && variant === "grid" ? (
        <>
          {uploading ? <UploadRing percent={percent} /> : null}
          {uploading ? (
            <span
              aria-label={`Uploading ${item.name}`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={percent}
              className="fui-attachment-percent"
              role="progressbar"
            >
              {`${percent}%`}
            </span>
          ) : (
            <span aria-hidden="true" className="fui-attachment-percent" data-done>
              100%
            </span>
          )}
        </>
      ) : null}
      {variant === "grid" ? (
        item.status === "error" ? <span className="fui-sr-only">{`${item.name}: ${detail}`}</span> : null
      ) : (
        <span className="fui-attachment-info">
          <span className="fui-attachment-name">{item.name}</span>
          {detail ? (
            <span className="fui-attachment-detail" role={item.status === "error" ? "alert" : undefined}>
              {detail}
            </span>
          ) : null}
        </span>
      )}
      {onRemove ? (
        <button
          aria-label={removeLabel(item)}
          className="fui-attachment-remove"
          onClick={(event) => {
            event.stopPropagation();
            onRemove(item.id);
          }}
          title={removeLabel(item)}
          type="button"
        >
          <XIcon />
        </button>
      ) : null}
    </div>
  );
}

export type AttachmentsProps = {
  items: readonly AttachmentItem[];
  variant?: AttachmentVariant;
  /** The size of `grid` tiles: `md` (96 px, the default) or `sm` (56 px, for a composer). */
  size?: "sm" | "md";
  onRemove?: (id: string) => void;
  removeLabel?: (item: AttachmentItem) => string;
  empty?: ReactNode;
  label?: string;
  className?: string;
};

export function Attachments({
  items,
  variant = "inline",
  size = "md",
  onRemove,
  removeLabel,
  empty = null,
  label = "Attachments",
  className,
}: AttachmentsProps) {
  const stagger = useArrivals(items.map((item) => item.id));
  if (items.length === 0) {
    return empty ? <div className="fui-attachments-empty">{empty}</div> : null;
  }
  return (
    <ul
      aria-label={label}
      className={["fui-attachments", className].filter(Boolean).join(" ")}
      data-size={variant === "grid" && size === "sm" ? "sm" : undefined}
      data-variant={variant}
    >
      {items.map((item) => (
        <li
          className={stagger.has(item.id) ? "fui-rise" : undefined}
          key={item.id}
          style={stagger.has(item.id) ? ({ "--fui-stagger": stagger.get(item.id) } as CSSProperties) : undefined}
        >
          <AttachmentChip item={item} onRemove={onRemove} removeLabel={removeLabel} variant={variant} />
        </li>
      ))}
    </ul>
  );
}
