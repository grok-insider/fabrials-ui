"use client";
// Origin: Radiant's rename-in-place of a sidebar chat title (the behaviour only). 0.12.

import { useEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type MouseEvent } from "react";
import { Pencil } from "lucide-react";
import { commitDecision } from "./editable-text-logic";
import { IconButton } from "./icon-button";
import { PixelSpinner } from "./pixel-spinner";
import { classes } from "./shared";
import { TruncatedText } from "./truncated-text";

export type EditableTextProps = Omit<ComponentProps<"span">, "children" | "onChange" | "onError" | "onBlur"> & {
  value: string;
  /** Called with the trimmed text, when it changed. A promise keeps the field pending until it settles. */
  onCommit: (next: string) => void | Promise<void>;
  /** A commit the host refused: the old text comes back and this hears why. */
  onError?: (error: unknown) => void;
  /** A host that owns the request says its commit has not settled yet, the same as a promise it returned. */
  pending?: boolean;
  /** Controlled editing; `defaultEditing` and `onEditingChange` otherwise. */
  editing?: boolean;
  defaultEditing?: boolean;
  onEditingChange?: (editing: boolean) => void;
  /** How the text itself starts an edit: nothing (a trigger only, the default), a double click, a single one. */
  startOn?: "none" | "doubleClick" | "click";
  /** A pencil beside the text that starts an edit. */
  showTrigger?: boolean;
  /** The pencil's name ("Rename"). */
  triggerLabel?: string;
  /** The field's name for a screen reader ("Rename chat"). */
  label?: string;
  placeholder?: string;
  maxLength?: number;
  /** Select everything as the field takes focus (the default). */
  selectOnEdit?: boolean;
  /** The text's own direction: any script reads the right way round with the ellipsis at its end. */
  dir?: "auto" | "ltr" | "rtl";
  /** A tooltip with the whole text while it is cut short (the default). */
  truncate?: boolean;
  /** What is announced while a commit is in flight ("Saving"). */
  pendingLabel?: string;
  fieldClassName?: string;
};

/**
 * A title renamed where it is read: Enter commits, Escape cancels, leaving the field commits, and a text that did not
 * change or came out empty calls nobody. The pencil or the text itself (`startOn`) opens the field, which takes focus with
 * its text selected; when editing ends, focus goes back to what started it. Put it inside a row that is a link and it
 * keeps the row from navigating while it is edited.
 */
export function EditableText({
  value,
  onCommit,
  onError,
  pending: pendingProp,
  editing: editingProp,
  defaultEditing = false,
  onEditingChange,
  startOn = "none",
  showTrigger = false,
  triggerLabel = "Rename",
  label,
  placeholder,
  maxLength,
  selectOnEdit = true,
  dir = "auto",
  truncate = true,
  pendingLabel = "Saving",
  className,
  fieldClassName,
  ...props
}: EditableTextProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultEditing);
  const editing = editingProp ?? uncontrolled;
  const [draft, setDraft] = useState(value);
  const [pendingValue, setPendingValue] = useState<string | null>(null);
  const waiting = pendingProp === true || pendingValue !== null;
  const field = useRef<HTMLInputElement>(null);
  const display = useRef<HTMLSpanElement>(null);
  const starter = useRef<HTMLElement | null>(null);
  const ignoreBlur = useRef(false);
  const settled = useRef(0);
  const root = useRef<HTMLSpanElement>(null);
  const returnTo = useRef<{ node: HTMLElement | null; kind: "starter" | "text" } | null>(null);
  const text = pendingValue ?? value;

  const setEditing = (next: boolean) => {
    if (editingProp === undefined) setUncontrolled(next);
    onEditingChange?.(next);
  };

  useEffect(() => {
    if (!editing) return;
    const node = field.current;
    if (!node) return;
    node.focus({ preventScroll: true });
    if (selectOnEdit) node.select();
  }, [editing, selectOnEdit]);

  // The field is not mounted yet when editing ends, so the focus goes back on the frame after it does.
  useEffect(() => {
    if (editing) return;
    const back = returnTo.current;
    if (!back) return;
    returnTo.current = null;
    const node = back.node?.isConnected ? back.node : null;
    const target =
      back.kind === "text" ? display.current : (node ?? root.current?.querySelector<HTMLElement>('[data-slot="editable-text-trigger"]') ?? display.current);
    target?.focus({ preventScroll: true });
  }, [editing]);

  const start = (from: HTMLElement | null = null, kind: "starter" | "text" = "starter") => {
    starter.current = kind === "text" ? null : (from ?? (typeof document === "undefined" ? null : (document.activeElement as HTMLElement | null)));
    returnTo.current = { node: starter.current, kind };
    ignoreBlur.current = false;
    setDraft(value);
    setEditing(true);
  };

  const cancel = () => {
    ignoreBlur.current = true;
    setDraft(value);
    setEditing(false);
  };

  const commit = () => {
    if (!editing) return;
    const decision = commitDecision(draft, value);
    ignoreBlur.current = true;
    setEditing(false);
    if (decision.kind !== "commit") {
      setDraft(value);
      return;
    }
    const next = decision.value;
    const generation = ++settled.current;
    setDraft(next);
    setPendingValue(next);
    let result: void | Promise<void>;
    try {
      result = onCommit(next);
    } catch (error) {
      if (settled.current === generation) setPendingValue(null);
      onError?.(error);
      return;
    }
    if (result && typeof result.then === "function") {
      result.then(
        () => {
          if (settled.current === generation) setPendingValue(null);
        },
        (error: unknown) => {
          if (settled.current === generation) setPendingValue(null);
          onError?.(error);
        },
      );
    } else setPendingValue(null);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // An input method's Enter chooses a candidate; it is not the end of the edit.
    if (event.nativeEvent.isComposing) {
      event.stopPropagation();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      cancel();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      commit();
      return;
    }
    event.stopPropagation();
  };

  // While the field is open the row around it (a link, a menu row) stays out of the way.
  const swallow = (event: MouseEvent<HTMLInputElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <span
      ref={root}
      data-slot="editable-text"
      data-editing={editing || undefined}
      data-pending={waiting || undefined}
      aria-busy={waiting || undefined}
      className={classes("fui-editable-text", className)}
      {...props}
    >
      {editing ? (
        <input
          ref={field}
          aria-label={label}
          className={classes("fui-editable-text-field", fieldClassName)}
          dir={dir}
          maxLength={maxLength}
          placeholder={placeholder}
          value={draft}
          onBlur={() => {
            if (ignoreBlur.current) {
              ignoreBlur.current = false;
              return;
            }
            commit();
          }}
          onChange={(event) => setDraft(event.currentTarget.value)}
          onClick={swallow}
          onKeyDown={onKeyDown}
          onMouseDown={swallow}
          onPointerDown={swallow}
        />
      ) : (
        <span
          ref={display}
          className="fui-editable-text-value"
          dir={dir}
          tabIndex={startOn === "none" ? -1 : 0}
          onClick={
            startOn === "none"
              ? undefined
              : (event) => {
                  if (event.detail === 1 && startOn === "doubleClick") return;
                  // The click that opens the field is the field's, not the row's: a link around it stays put.
                  event.preventDefault();
                  event.stopPropagation();
                  start(event.currentTarget, "text");
                }
          }
          onDoubleClick={
            startOn === "doubleClick"
              ? (event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  start(event.currentTarget, "text");
                }
              : undefined
          }
          onKeyDown={
            startOn === "none"
              ? undefined
              : (event) => {
                  if (event.key !== "Enter" && event.key !== "F2") return;
                  event.preventDefault();
                  event.stopPropagation();
                  start(event.currentTarget, "text");
                }
          }
        >
          {truncate ? <TruncatedText>{text}</TruncatedText> : text}
        </span>
      )}
      {showTrigger && !editing ? (
        <IconButton
          className="fui-editable-text-trigger"
          data-slot="editable-text-trigger"
          label={triggerLabel}
          onClick={(event) => start(event.currentTarget)}
          size="icon-xs"
          variant="ghost"
        >
          <Pencil aria-hidden size={14} />
        </IconButton>
      ) : null}
      {waiting ? (
        <>
          <PixelSpinner aria-hidden className="fui-editable-text-spinner" />
          <span className="fui-sr-only" role="status">
            {pendingLabel}
          </span>
        </>
      ) : null}
    </span>
  );
}
