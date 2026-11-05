"use client";
// Origin: Fabrials, 0.10. Replaces Kibo UI's dropzone (react-dropzone) with a dependency-free one built on FileInput's
// approach: the browser's file input underneath, our surface on top.

import { useId, useRef, useState, type DragEvent, type ReactNode } from "react";
import { Upload } from "lucide-react";
import { buttonVariants } from "./button-variants";
import { classes } from "./shared";

export type FileRejection = { file: File; reason: "type" | "size" | "count" };

/** Whether a file matches an `accept` list (".pdf", "image/*", "application/json"). An empty list accepts everything. */
export function acceptsFile(file: File, accept: string | undefined) {
  const rules = (accept ?? "")
    .split(",")
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean);
  if (rules.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  return rules.some((rule) =>
    rule.startsWith(".") ? name.endsWith(rule) : rule.endsWith("/*") ? type.startsWith(rule.slice(0, -1)) : type === rule,
  );
}

/** Splits chosen or dropped files into the ones a dropzone keeps and the ones it refuses, with the reason. */
export function sortFiles(files: File[], { accept, maxSize, maxFiles, multiple = true }: { accept?: string; maxSize?: number; maxFiles?: number; multiple?: boolean }) {
  const accepted: File[] = [];
  const rejected: FileRejection[] = [];
  const limit = multiple ? (maxFiles ?? Number.POSITIVE_INFINITY) : 1;
  for (const file of files) {
    if (!acceptsFile(file, accept)) rejected.push({ file, reason: "type" });
    else if (maxSize !== undefined && file.size > maxSize) rejected.push({ file, reason: "size" });
    else if (accepted.length >= limit) rejected.push({ file, reason: "count" });
    else accepted.push(file);
  }
  return { accepted, rejected };
}

export type DropzoneProps = {
  /** The visible text, in the interface's language. */
  label?: ReactNode;
  /** The button inside the zone that opens the picker. */
  buttonLabel?: ReactNode;
  description?: ReactNode;
  /** Shown while files are dragged over the zone. */
  dropLabel?: ReactNode;
  accept?: string;
  multiple?: boolean;
  /** Bytes. Larger files are refused with reason "size". */
  maxSize?: number;
  maxFiles?: number;
  disabled?: boolean;
  name?: string;
  onFilesChange?: (files: File[]) => void;
  onFilesRejected?: (rejections: FileRejection[]) => void;
  error?: ReactNode;
  /** Below the zone: the host's list of chosen files (FileThumb rows). */
  children?: ReactNode;
  className?: string;
  id?: string;
};

/**
 * Where files are dropped or chosen. The zone is a large target for a drag; the keyboard reaches the real file input
 * through the button inside it. Files that do not match `accept`, `maxSize` or `maxFiles` are reported, not kept.
 */
export function Dropzone({
  label = "Drop files here",
  buttonLabel = "Choose files",
  description,
  dropLabel = "Drop to add",
  accept,
  multiple = true,
  maxSize,
  maxFiles,
  disabled = false,
  name,
  onFilesChange,
  onFilesRejected,
  error,
  children,
  className,
  id,
}: DropzoneProps) {
  const generated = useId();
  const base = id ?? generated;
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);
  const take = (files: File[]) => {
    const { accepted, rejected } = sortFiles(files, { accept, maxSize, maxFiles, multiple });
    if (accepted.length) onFilesChange?.(accepted);
    if (rejected.length) onFilesRejected?.(rejected);
  };
  const enter = (event: DragEvent<HTMLDivElement>) => {
    if (disabled || !Array.from(event.dataTransfer.types).includes("Files")) return;
    event.preventDefault();
    depth.current += 1;
    setDragging(true);
  };
  const described = [description ? `${base}-description` : undefined, error ? `${base}-error` : undefined].filter(Boolean).join(" ");
  return (
    <div className={classes("fui-dropzone-field", className)}>
      <div
        className="fui-dropzone"
        data-dragging={dragging ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        data-invalid={error ? "" : undefined}
        onDragEnter={enter}
        onDragOver={(event) => {
          if (disabled || !Array.from(event.dataTransfer.types).includes("Files")) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={() => {
          depth.current = Math.max(0, depth.current - 1);
          if (depth.current === 0) setDragging(false);
        }}
        onDrop={(event) => {
          if (disabled) return;
          event.preventDefault();
          depth.current = 0;
          setDragging(false);
          take(Array.from(event.dataTransfer.files));
        }}
      >
        <Upload aria-hidden="true" className="fui-dropzone-icon" />
        <p className="fui-dropzone-label">{dragging ? dropLabel : label}</p>
        {description ? (
          <p className="fui-description fui-dropzone-description" id={`${base}-description`}>
            {description}
          </p>
        ) : null}
        <label className={classes(buttonVariants({ variant: "outline", size: "sm" }), "fui-dropzone-button")} data-variant="outline" data-size="sm">
          <input
            id={base}
            type="file"
            name={name}
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            className="fui-sr-only"
            aria-describedby={described || undefined}
            aria-invalid={error ? true : undefined}
            onChange={(event) => {
              take(Array.from(event.currentTarget.files ?? []));
              event.currentTarget.value = "";
            }}
          />
          {buttonLabel}
        </label>
      </div>
      {error ? (
        <p className="fui-field-error" id={`${base}-error`} role="alert">
          {error}
        </p>
      ) : null}
      {children}
    </div>
  );
}
