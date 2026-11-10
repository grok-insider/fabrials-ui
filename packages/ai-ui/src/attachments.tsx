"use client";

import type { CSSProperties, ReactNode } from "react";
import { Spinner, canonicalSize, localeTag, useLabels, useLocale, useProvidedLocale } from "@fabrials/ui";
import { useArrivals } from "./agent";
import { attachmentCategory, formatBytes, formatPercent, type AttachmentCategory } from "./format";
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

export type AttachmentVariant = "grid" | "inline" | "list";

export { attachmentCategory, formatBytes, formatPercent, type AttachmentCategory } from "./format";

function typeLabel(mediaType: string) {
  const subtype = mediaType.split(";")[0]?.split("/")[1] ?? "";
  return subtype ? subtype.replace(/^x-/, "").replace(/^vnd\..*\./, "").toUpperCase() : "";
}

/** The type and size of a file ("PDF · 1.5 KB"). With a `locale` the size is written in it ("1,5 kB"). */
export function attachmentDetail(item: AttachmentItem, locale?: Intl.LocalesArgument): string {
  return [typeLabel(item.mediaType), formatBytes(item.size, locale ? localeTag(locale) : undefined)].filter(Boolean).join(" · ");
}

export type AttachmentsLabels = {
  /** The name of the list. */
  label: string;
  /** An upload with no known progress. */
  uploading: string;
  /** The name of an upload's spinner and progress, given the file's name. */
  uploadingName: (name: string) => string;
  /** An upload with its progress, given the percentage as it is written ("36%"). */
  uploadingPercent: (percent: string) => string;
  /** A failed upload that gives no reason. */
  failed: string;
  /** The name of the remove key, given the file's name. */
  remove: (name: string) => string;
};

const ATTACHMENTS_LABELS: AttachmentsLabels = {
  label: "Attachments",
  uploading: "Uploading…",
  uploadingName: (name) => `Uploading ${name}`,
  uploadingPercent: (percent) => `Uploading ${percent}`,
  failed: "Upload failed",
  remove: (name) => `Remove ${name}`,
};

const ICONS = {
  audio: MusicIcon,
  document: FileTextIcon,
  image: ImageIcon,
  unknown: PaperclipIcon,
  video: VideoIcon,
} satisfies Record<AttachmentCategory, unknown>;

function Preview({ item, variant, labels }: { item: AttachmentItem; variant: AttachmentVariant; labels: AttachmentsLabels }) {
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
          <Spinner label={labels.uploadingName(item.name)} />
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
  /** The words of an upload, a failure and the remove key. A `LabelsProvider` sets them for every file (scope `attachments`). */
  labels?: Partial<AttachmentsLabels>;
  /** The locale of the percentage and, when given here or by a `LabelsProvider`, of the size. */
  locale?: Intl.LocalesArgument;
  className?: string;
};

export function AttachmentChip({
  item,
  variant = "inline",
  onRemove,
  removeLabel: ownRemoveLabel,
  labels: ownLabels,
  locale: ownLocale,
  className,
}: AttachmentChipProps) {
  const labels = useLabels("attachments", ATTACHMENTS_LABELS, ownLabels);
  const locale = useLocale(ownLocale);
  const sizeLocale = useProvidedLocale(ownLocale);
  const removeLabel = ownRemoveLabel ?? ((value: AttachmentItem) => labels.remove(value.name));
  const percent = percentOf(item.progress);
  const uploading = item.status === "uploading";
  const detail =
    item.status === "error"
      ? item.error || labels.failed
      : uploading
        ? percent === undefined
          ? labels.uploading
          : labels.uploadingPercent(formatPercent(percent, locale))
        : attachmentDetail(item, sizeLocale);
  return (
    <div
      aria-busy={uploading || undefined}
      className={["fui-attachment", className].filter(Boolean).join(" ")}
      data-status={item.status ?? "ready"}
      data-variant={variant}
      title={variant === "grid" ? `${item.name}${detail ? ` · ${detail}` : ""}` : undefined}
    >
      <Preview item={item} labels={labels} variant={variant} />
      {percent !== undefined && variant === "grid" ? (
        <>
          {uploading ? <UploadRing percent={percent} /> : null}
          {uploading ? (
            <span
              aria-label={labels.uploadingName(item.name)}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={percent}
              className="fui-attachment-percent"
              role="progressbar"
            >
              {formatPercent(percent, locale)}
            </span>
          ) : (
            <span aria-hidden="true" className="fui-attachment-percent" data-done>
              {formatPercent(100, locale)}
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
  /** The size of `grid` tiles: `md` (96 px, the default, named `default` too) or `sm` (56 px, for a composer). */
  size?: "sm" | "md" | "default";
  onRemove?: (id: string) => void;
  removeLabel?: (item: AttachmentItem) => string;
  empty?: ReactNode;
  /** The list's name; `labels.label` ("Attachments") by default. */
  label?: string;
  /** The words of the list and its files. A `LabelsProvider` sets them for every list (scope `attachments`). */
  labels?: Partial<AttachmentsLabels>;
  /** The locale of percentages and, when given here or by a `LabelsProvider`, of sizes. */
  locale?: Intl.LocalesArgument;
  className?: string;
};

export function Attachments({
  items,
  variant = "inline",
  size = "md",
  onRemove,
  removeLabel,
  empty = null,
  label,
  labels: ownLabels,
  locale,
  className,
}: AttachmentsProps) {
  const labels = useLabels("attachments", ATTACHMENTS_LABELS, ownLabels);
  const stagger = useArrivals(items.map((item) => item.id));
  if (items.length === 0) {
    return empty ? <div className="fui-attachments-empty">{empty}</div> : null;
  }
  return (
    <ul
      aria-label={label ?? labels.label}
      className={["fui-attachments", className].filter(Boolean).join(" ")}
      data-size={variant === "grid" && (canonicalSize(size, "md") ?? "md") === "sm" ? "sm" : undefined}
      data-variant={variant}
    >
      {items.map((item) => (
        <li
          className={stagger.has(item.id) ? "fui-rise" : undefined}
          key={item.id}
          style={stagger.has(item.id) ? ({ "--fui-stagger": stagger.get(item.id) } as CSSProperties) : undefined}
        >
          <AttachmentChip item={item} labels={ownLabels} locale={locale} onRemove={onRemove} removeLabel={removeLabel} variant={variant} />
        </li>
      ))}
    </ul>
  );
}
