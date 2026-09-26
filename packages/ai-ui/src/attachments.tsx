"use client";

import type { ReactNode } from "react";
import { Spinner } from "@fabrials/ui";
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
  error?: string;
};

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
  return (
    <span className="fui-attachment-preview" data-category={category}>
      {content}
      {item.status === "uploading" ? (
        <span className="fui-attachment-busy">
          <Spinner label={`Uploading ${item.name}`} />
        </span>
      ) : null}
    </span>
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
  const detail = item.status === "error" ? item.error || "Upload failed" : item.status === "uploading" ? "Uploading…" : attachmentDetail(item);
  return (
    <div
      aria-busy={item.status === "uploading" || undefined}
      className={["fui-attachment", className].filter(Boolean).join(" ")}
      data-status={item.status ?? "ready"}
      data-variant={variant}
      title={variant === "grid" ? `${item.name}${detail ? ` · ${detail}` : ""}` : undefined}
    >
      <Preview item={item} variant={variant} />
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
  onRemove?: (id: string) => void;
  removeLabel?: (item: AttachmentItem) => string;
  empty?: ReactNode;
  label?: string;
  className?: string;
};

export function Attachments({
  items,
  variant = "inline",
  onRemove,
  removeLabel,
  empty = null,
  label = "Attachments",
  className,
}: AttachmentsProps) {
  if (items.length === 0) {
    return empty ? <div className="fui-attachments-empty">{empty}</div> : null;
  }
  return (
    <ul aria-label={label} className={["fui-attachments", className].filter(Boolean).join(" ")} data-variant={variant}>
      {items.map((item) => (
        <li key={item.id}>
          <AttachmentChip item={item} onRemove={onRemove} removeLabel={removeLabel} variant={variant} />
        </li>
      ))}
    </ul>
  );
}
