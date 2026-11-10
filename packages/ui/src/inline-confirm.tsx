"use client";
// Origin: Radiant's in-place confirmations (session, placement, exam, conversation, recordings): the behaviour only. 0.12.

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { CircleAlert } from "lucide-react";
import type { ConfirmResult } from "./confirm-dialog";
import { Button, NativeCheckbox } from "./controls";
import { classes } from "./shared";

export type InlineConfirmAcknowledgement = {
  /** The sentence beside the box: what the person agrees to. */
  label: ReactNode;
  /** The answer is refused until the box is ticked. On by default. */
  required?: boolean;
  /** Said when the answer is pressed with the box empty. */
  error?: ReactNode;
  onCheckedChange?: (checked: boolean) => void;
};

type InlineConfirmBlockProps = Omit<ComponentProps<"div">, "title"> & {
  title: ReactNode;
  description?: ReactNode;
  /** Makes the title a heading. Without it the title is a paragraph that names the group. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  confirmLabel: ReactNode;
  pendingLabel?: ReactNode;
  cancelLabel?: ReactNode;
  destructive?: boolean;
  /**
   * The action. A promise keeps the question open with the answer loading and deaf to a second press; it closes when the
   * promise settles, unless that is a rejection or `{ ok: false, error }`, which are shown and leave it open to try again.
   */
  onConfirm: (state: { acknowledged: boolean }) => Promise<ConfirmResult | void> | ConfirmResult | void;
  /** The safe answer was given: the cancel button or Escape. */
  onCancel?: () => void;
  /** The host is carrying the action out: as a pending promise, when the host owns the request. */
  pending?: boolean;
  /** A failure the host knows of. It is an alert, and the question stays open. */
  error?: ReactNode;
  fallbackError?: string;
  /** A box that must be ticked. Pressing the answer without it says what is missing and moves to the box; nothing is disabled. */
  acknowledgement?: InlineConfirmAcknowledgement;
  /** A new value empties the box: what is agreed to has changed. */
  acknowledgementKey?: string | number;
  /** Where focus goes when the question closes. By default the control that had focus when it opened. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  /** `false` shows the question without moving focus or scrolling: one that is already on the page when it loads. */
  autoFocus?: boolean;
};

export type InlineConfirmProps = InlineConfirmBlockProps & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/**
 * A confirmation asked in place, not in a dialog: the page stays usable around it. It is a group named by its question
 * (an `alertdialog` would promise a modal that is not there). When it opens the safe answer takes focus and the block
 * scrolls clear of a sticky `ActionBar`; Escape is the safe answer; when it closes focus goes back to the control that
 * asked. For a question that must stop everything, use `ConfirmDialog`.
 */
export function InlineConfirm({ open, defaultOpen = false, onOpenChange, ...props }: InlineConfirmProps) {
  const [own, setOwn] = useState(defaultOpen);
  if (!(open ?? own)) return null;
  return (
    <InlineConfirmBlock
      {...props}
      onClose={() => {
        if (open === undefined) setOwn(false);
        onOpenChange?.(false);
      }}
    />
  );
}

function InlineConfirmBlock({
  title,
  description,
  headingLevel,
  confirmLabel,
  pendingLabel,
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
  pending = false,
  error,
  fallbackError = "Something went wrong",
  acknowledgement,
  acknowledgementKey,
  returnFocusRef,
  autoFocus = true,
  onClose,
  className,
  children,
  onKeyDown,
  ref,
  ...props
}: InlineConfirmBlockProps & { onClose: () => void }) {
  const id = useId();
  const root = useRef<HTMLDivElement | null>(null);
  const safe = useRef<HTMLButtonElement | null>(null);
  const box = useRef<HTMLInputElement | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const running = useRef(false);
  const mounted = useRef(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [tick, setTick] = useState({ key: acknowledgementKey, ticked: false, missing: false });
  const ticked = tick.key === acknowledgementKey && tick.ticked;
  const missing = tick.key === acknowledgementKey && tick.missing;
  const required = acknowledgement ? acknowledgement.required !== false : false;
  const working = pending || busy;
  const shownError = error ?? failure;

  const focusTarget = useRef(returnFocusRef);
  useEffect(() => {
    focusTarget.current = returnFocusRef;
  });

  useLayoutEffect(() => {
    const node = root.current;
    return () => {
      // Runs before the block leaves the document, while focus is still inside it. The frame is waited for so a trigger
      // that was unmounted while the question was open is back; a block that is still there (React's strict mode
      // rehearsing an unmount) keeps its focus.
      if (!node || !node.contains(document.activeElement)) return;
      requestAnimationFrame(() => {
        if (node.isConnected) return;
        const lost = !document.activeElement || document.activeElement === document.body;
        const target = focusTarget.current?.current ?? opener.current;
        if (lost && target?.isConnected) target.focus();
      });
    };
  }, []);

  useEffect(() => {
    mounted.current = true;
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body && !root.current?.contains(active)) opener.current = active;
    if (autoFocus) {
      // Focus first, without the browser's own jump; then one scroll that keeps the whole block clear of a sticky bar.
      safe.current?.focus({ preventScroll: true });
      root.current?.scrollIntoView({ block: "nearest" });
    }
    return () => {
      mounted.current = false;
    };
    // Only on opening: a host that flips `autoFocus` later does not move focus.
  }, []);

  const cancel = () => {
    if (working) return;
    onCancel?.();
    onClose();
  };

  const confirm = async () => {
    if (working || running.current) return;
    if (required && !ticked) {
      setTick({ key: acknowledgementKey, ticked: false, missing: true });
      box.current?.focus();
      return;
    }
    setFailure(null);
    let result: ConfirmResult | void;
    try {
      const answer = onConfirm({ acknowledged: ticked });
      if (answer && "then" in answer) {
        running.current = true;
        setBusy(true);
        try {
          result = await answer;
        } finally {
          running.current = false;
          if (mounted.current) setBusy(false);
        }
      } else result = answer;
    } catch (cause) {
      if (mounted.current) setFailure(cause instanceof Error && cause.message ? cause.message : fallbackError);
      return;
    }
    if (!mounted.current) return;
    if (result && !result.ok) setFailure(result.error || fallbackError);
    else onClose();
  };

  const Title = headingLevel ? (`h${headingLevel}` as "h2") : "p";
  return (
    <div
      data-slot="inline-confirm"
      role="group"
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
      {...props}
      className={classes("fui-inline-confirm", className)}
      data-destructive={destructive || undefined}
      data-pending={working || undefined}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        if (event.key !== "Escape" || event.defaultPrevented) return;
        // Escape answers this question only: a sheet or a dialog around it stays open.
        event.stopPropagation();
        cancel();
      }}
      ref={(node) => {
        root.current = node;
        if (typeof ref === "function") return ref(node);
        if (ref) ref.current = node;
      }}
    >
      <div className="fui-inline-confirm-text">
        <Title className="fui-inline-confirm-title" id={`${id}-title`}>
          {title}
        </Title>
        {description ? (
          <p className="fui-inline-confirm-description" id={`${id}-description`}>
            {description}
          </p>
        ) : null}
      </div>
      {children}
      {acknowledgement ? (
        <div className="fui-inline-confirm-acknowledgement">
          <NativeCheckbox
            aria-describedby={missing ? `${id}-missing` : undefined}
            aria-invalid={missing || undefined}
            aria-required={required || undefined}
            checked={ticked}
            disabled={working}
            label={acknowledgement.label}
            onChange={(event) => {
              const checked = event.currentTarget.checked;
              setTick({ key: acknowledgementKey, ticked: checked, missing: missing && !checked });
              acknowledgement.onCheckedChange?.(checked);
            }}
            ref={box}
          />
          {missing ? (
            <p className="fui-inline-confirm-error" id={`${id}-missing`} role="alert">
              <CircleAlert aria-hidden />
              <span>{acknowledgement.error ?? "Tick the box to continue"}</span>
            </p>
          ) : null}
        </div>
      ) : null}
      {shownError ? (
        <p className="fui-inline-confirm-error" role="alert">
          <CircleAlert aria-hidden />
          <span>{shownError}</span>
        </p>
      ) : null}
      <div className="fui-inline-confirm-actions">
        <Button disabled={working} focusableWhenDisabled onClick={cancel} ref={safe} type="button" variant="outline">
          {cancelLabel}
        </Button>
        <Button loading={working} onClick={() => void confirm()} type="button" variant={destructive ? "destructive" : "default"}>
          {working && pendingLabel ? pendingLabel : confirmLabel}
        </Button>
      </div>
    </div>
  );
}

export type UseInlineConfirmResult = {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** For the control that asks: it opens the question, says whether it is open, and takes focus back when it closes. */
  triggerProps: {
    ref: RefObject<HTMLButtonElement | null>;
    onClick: () => void;
    "aria-expanded": boolean;
  };
  /** For `InlineConfirm`, wherever on the page it is rendered. */
  confirmProps: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    returnFocusRef: RefObject<HTMLElement | null>;
  };
};

/**
 * The open state of an `InlineConfirm` and the wiring to the control that asks, for the usual case where the two are in
 * different places: `<Button {...confirm.triggerProps}>` in a bar and `<InlineConfirm {...confirm.confirmProps} />` above it.
 */
export function useInlineConfirm({ defaultOpen = false }: { defaultOpen?: boolean } = {}): UseInlineConfirmResult {
  const [open, setOpen] = useState(defaultOpen);
  const trigger = useRef<HTMLButtonElement | null>(null);
  return {
    open,
    setOpen,
    triggerProps: { ref: trigger, onClick: () => setOpen(true), "aria-expanded": open },
    confirmProps: { open, onOpenChange: setOpen, returnFocusRef: trigger },
  };
}
