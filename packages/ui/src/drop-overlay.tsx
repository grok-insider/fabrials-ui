"use client";
// Origin: Fabrials, 0.12, from Radiant's chat drop zone: the panel over the conversation while files are dragged, counted
// by depth instead of tested with `relatedTarget`, which flickers as the pointer crosses a child.

import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { Upload } from "lucide-react";
import { useAnnounce } from "./announcer";
import { classes } from "./shared";

/** Whether a set of dragged types carries files: a dragged link or a selection of text does not. */
export function carriesFiles(types: readonly string[] | undefined) {
  return (types ?? []).some((type) => type === "Files");
}

/** The kinds of the dragged files, as the browser tells them while the drag is over. A drag never shows their names. */
function draggedTypes(dataTransfer: DataTransfer | null | undefined) {
  const kinds: string[] = [];
  for (const item of Array.from(dataTransfer?.items ?? [])) if (item.kind === "file" && item.type) kinds.push(item.type);
  return kinds.length > 0 ? kinds : (dataTransfer?.types ?? []).filter((type) => type !== "Files");
}

/**
 * Whether a drag is refused by an `accept` list, given the kinds of the dragged files ("image/png"). A list of extensions
 * (".pdf") cannot be judged from a drag, which never shows the names, so it lets the drag through.
 */
export function draggedFilesRefused(kinds: readonly string[] | undefined, accept: string | undefined) {
  const rules = (accept ?? "")
    .split(",")
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean);
  const patterns = rules.filter((rule) => !rule.startsWith("."));
  const files = (kinds ?? []).filter((kind) => kind.includes("/"));
  if (patterns.length === 0 || files.length === 0) return false;
  return !files.some((kind) =>
    patterns.some((rule) => (rule.endsWith("/*") ? kind.startsWith(rule.slice(0, -1)) : kind === rule)),
  );
}

export type DropOverlayProps = {
  /** What the panel covers. It shows over this area, never over the whole window. */
  children?: ReactNode;
  /** The words in the middle of the panel. */
  label?: string;
  /** A line under it: what may be dropped. */
  description?: ReactNode;
  /** What the panel says when the dragged files are not accepted. */
  refusedLabel?: string;
  /** Whether the drag is watched on this area alone, or on the page, for a chat that takes a file anywhere. */
  scope?: "self" | "page";
  /** What is accepted, as a file input takes it. Used to say "not accepted" while a drag is over. */
  accept?: string;
  /** Shown or hidden by the host instead of by a drag: a story, or a host that watches its own drags. */
  active?: boolean;
  /** The dragged files are not accepted, when `active` is given. */
  refused?: boolean;
  disabled?: boolean;
  /** What to do with the dropped files. Give this or the hook's own `pageDrop`, not both. */
  onDrop?: (files: File[]) => void;
  className?: string;
  id?: string;
};

const filesOf = (list: FileList | null | undefined) => Array.from(list ?? []);

/**
 * A piece of the screen that says files can be dropped on it. The panel takes no pointer events, so the pointer keeps
 * crossing the area underneath; it is `aria-hidden` while it is not there, and a polite region says when it appeared:
 * a drag cannot be heard.
 */
export function DropOverlay({
  children,
  label = "Drop files to attach",
  description,
  refusedLabel = "That kind of file is not accepted",
  scope = "self",
  accept,
  active,
  refused,
  disabled = false,
  onDrop,
  className,
  id,
}: DropOverlayProps) {
  const announce = useAnnounce();
  const depth = useRef(0);
  const [over, setOver] = useState(false);
  const [wrong, setWrong] = useState(false);
  const shown = disabled ? false : (active ?? over);
  const refusedShown = shown && (refused ?? wrong);

  // The document listeners are attached once; what they do with a drop is the latest one the host gave.
  const latest = useRef({ accept, onDrop });
  useEffect(() => {
    latest.current = { accept, onDrop };
  });

  const said = useRef("");
  useEffect(() => {
    if (!shown) {
      said.current = "";
      return;
    }
    const words = refusedShown ? refusedLabel : label;
    if (said.current === words) return;
    said.current = words;
    announce(words);
  }, [announce, label, refusedLabel, refusedShown, shown]);

  const watch = (dataTransfer: DataTransfer | null) => {
    if (disabled || !carriesFiles(dataTransfer?.types)) return false;
    depth.current += 1;
    setWrong(draggedFilesRefused(draggedTypes(dataTransfer), accept));
    setOver(true);
    return true;
  };

  const letGo = () => {
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current > 0) return;
    setOver(false);
    setWrong(false);
  };

  const take = (dataTransfer: DataTransfer | null, drop: (files: File[]) => void) => {
    const files = filesOf(dataTransfer?.files);
    depth.current = 0;
    setOver(false);
    setWrong(false);
    if (disabled || files.length === 0) return;
    drop(files);
  };

  useEffect(() => {
    if (scope !== "page" || disabled) return;
    const entered = (event: globalThis.DragEvent) => {
      if (!carriesFiles(event.dataTransfer?.types)) return;
      event.preventDefault();
      depth.current += 1;
      setWrong(draggedFilesRefused(draggedTypes(event.dataTransfer), latest.current.accept));
      setOver(true);
    };
    const left = (event: globalThis.DragEvent) => {
      if (!carriesFiles(event.dataTransfer?.types)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current > 0) return;
      setOver(false);
      setWrong(false);
    };
    // A drop is only offered where the drag is allowed to happen; without this the browser would open the file instead.
    const overPage = (event: globalThis.DragEvent) => {
      if (carriesFiles(event.dataTransfer?.types)) event.preventDefault();
    };
    const dropped = (event: globalThis.DragEvent) => {
      if (carriesFiles(event.dataTransfer?.types)) event.preventDefault();
      const files = filesOf(event.dataTransfer?.files);
      depth.current = 0;
      setOver(false);
      setWrong(false);
      if (files.length > 0) latest.current.onDrop?.(files);
    };
    document.addEventListener("dragenter", entered);
    document.addEventListener("dragleave", left);
    document.addEventListener("dragover", overPage);
    document.addEventListener("drop", dropped);
    return () => {
      document.removeEventListener("dragenter", entered);
      document.removeEventListener("dragleave", left);
      document.removeEventListener("dragover", overPage);
      document.removeEventListener("drop", dropped);
    };
  }, [disabled, scope]);

  const panel = (
    <div aria-hidden={!shown} className="fui-drop-overlay-panel" data-refused={refusedShown ? "" : undefined}>
      <Upload aria-hidden="true" className="fui-drop-overlay-icon" />
      <p className="fui-drop-overlay-label">{refusedShown ? refusedLabel : label}</p>
      {description && !refusedShown ? <p className="fui-drop-overlay-description">{description}</p> : null}
    </div>
  );

  if (scope === "page") {
    return (
      <div className={classes("fui-drop-overlay", className)} data-scope={scope} id={id}>
        {children}
        {panel}
      </div>
    );
  }

  return (
    <div
      className={classes("fui-drop-overlay", className)}
      data-scope={scope}
      id={id}
      onDragEnter={(event: DragEvent<HTMLDivElement>) => {
        if (watch(event.dataTransfer)) event.preventDefault();
      }}
      onDragLeave={letGo}
      onDragOver={(event: DragEvent<HTMLDivElement>) => {
        if (disabled || !carriesFiles(event.dataTransfer?.types)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(event: DragEvent<HTMLDivElement>) => {
        if (!carriesFiles(event.dataTransfer?.types)) return;
        event.preventDefault();
        take(event.dataTransfer, onDrop ?? (() => undefined));
      }}
    >
      {children}
      {panel}
    </div>
  );
}
