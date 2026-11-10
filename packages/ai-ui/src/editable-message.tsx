"use client";
// Origin: Fabrials, 0.12 (from Radiant's components/chat/chat-thread.tsx, where a sent message is edited in place).

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode, type RefObject } from "react";
import { Button, Textarea } from "@fabrials/ui";
import { MessageAction, type MessageActionProps } from "./chat-message";
import { PencilIcon } from "./chat-icons";

export type EditableMessageLabels = {
  /** Why the send key is unavailable while the field holds nothing. */
  empty: string;
  /** Why it is unavailable while the field holds what was already sent. */
  unchanged: string;
  /** Said while the host is sending. */
  pending: string;
  /** Said when the send failed and the reason carried no words of its own. */
  failed: string;
};

const LABELS: EditableMessageLabels = {
  empty: "Type a message to send.",
  unchanged: "Change the message to send it.",
  pending: "Sending your message.",
  failed: "The message could not be sent.",
};

function join(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function reasonOf(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}

export type EditableMessageProps = Omit<ComponentProps<"form">, "children" | "onSubmit" | "onError" | "onReset"> & {
  /** The message as it was sent: the draft starts from it and sending it back unchanged is not a change. */
  value: string;
  /**
   * Sends `next`. It may return a promise: the key waits then, and a rejection keeps the draft and says why. The host
   * closes the editor; focus comes back to `returnFocusRef` when it goes.
   */
  onSubmit: (next: string) => void | Promise<void>;
  onCancel: () => void;
  /** The field's name. Default "Edit message". */
  label?: string;
  /** A line under the field, in the host's words. There is no default: what sending costs is the host's to say. */
  hint?: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  /** The host is sending: the key is busy and the field holds still. */
  pending?: boolean;
  maxLength?: number;
  /** A failure the host already knows about, shown where a refused send is. */
  error?: ReactNode;
  /** Where focus goes when the editor closes after a cancel or a send. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  /** Take focus with the caret at the end when it appears. A host that keeps several editors open turns it off. */
  autoFocus?: boolean;
  labels?: Partial<EditableMessageLabels>;
};

/**
 * A sent message edited where it stands: the same bubble, a field that grows with the words instead of reflowing the
 * thread. Escape cancels and Ctrl or Cmd with Enter sends; Enter is a new line, and a key pressed while an input method is
 * composing never sends. An empty draft, or the message as it was, cannot be sent, and the hint says so in words rather
 * than leaving a key greyed out without a reason.
 */
export function EditableMessage({
  value,
  onSubmit,
  onCancel,
  label = "Edit message",
  hint,
  submitLabel = "Save and send",
  cancelLabel = "Cancel",
  pending = false,
  maxLength,
  error,
  returnFocusRef,
  autoFocus = true,
  labels,
  className,
  ...props
}: EditableMessageProps) {
  const text = { ...LABELS, ...labels };
  const field = useRef<HTMLTextAreaElement | null>(null);
  const restore = useRef(false);
  const done = useRef(false);
  const [draft, setDraft] = useState(value);
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const id = useId();
  const working = pending || sending;

  const next = draft.trim();
  const empty = next.length === 0;
  const unchanged = !empty && next === value.trim();
  const ready = !empty && !unchanged && !working;

  useLayoutEffect(() => {
    if (!autoFocus) return;
    const node = field.current;
    if (!node) return;
    node.focus();
    node.setSelectionRange(node.value.length, node.value.length);
  }, [autoFocus]);

  // The editor closes after a cancel or a send: the key that opened it takes the focus back, once its own ref is attached.
  const target = useRef(returnFocusRef);
  target.current = returnFocusRef;
  useEffect(
    () => () => {
      if (restore.current) target.current?.current?.focus();
    },
    [],
  );

  // A host that keeps the editor open after a send hands it the new message: the next draft is a new send.
  useEffect(() => {
    done.current = false;
  }, [value]);

  const send = async () => {
    if (!ready || done.current) return;
    setFailure(null);
    const result = onSubmit(next);
    if (!result || typeof result.then !== "function") {
      done.current = true;
      restore.current = true;
      return;
    }
    setSending(true);
    try {
      await result;
      done.current = true;
      restore.current = true;
    } catch (reason) {
      restore.current = false;
      setFailure(reasonOf(reason, text.failed));
    } finally {
      setSending(false);
    }
  };

  const cancel = () => {
    restore.current = true;
    onCancel();
  };

  const why = working ? text.pending : empty ? text.empty : unchanged ? text.unchanged : null;
  const said = [hint, why].filter((part) => part !== undefined && part !== null && part !== "").map(String).join(" ");

  return (
    <form
      {...props}
      aria-busy={working || undefined}
      className={join("fui-editable-message", className)}
      data-slot="editable-message"
      onSubmit={(event) => {
        event.preventDefault();
        void send();
      }}
    >
      <Textarea
        aria-describedby={said ? id : undefined}
        aria-label={label}
        autoResize
        className="fui-editable-message-field"
        dir="auto"
        maxLength={maxLength}
        maxRows={10}
        minRows={2}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            cancel();
            return;
          }
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            void send();
          }
        }}
        onChange={(event) => setDraft(event.currentTarget.value)}
        readOnly={working}
        ref={field}
        value={draft}
      />
      {failure ?? error ? (
        <p className="fui-editable-message-error" role="alert">
          {failure ?? error}
        </p>
      ) : null}
      <div className="fui-editable-message-bar">
        {said ? (
          <p className="fui-editable-message-hint" id={id}>
            {said}
          </p>
        ) : null}
        <Button onClick={cancel} size="sm" type="button" variant="ghost">
          {cancelLabel}
        </Button>
        <Button aria-disabled={ready ? undefined : true} loading={working} size="sm" type="submit">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export type EditMessageActionProps = Omit<MessageActionProps, "label" | "children"> & {
  /** Default "Edit". */
  label?: string;
};

/** The key of a message's action row that opens the editor in place. */
export function EditMessageAction({ label = "Edit", ...props }: EditMessageActionProps) {
  return (
    <MessageAction {...props} label={label}>
      <PencilIcon />
    </MessageAction>
  );
}
