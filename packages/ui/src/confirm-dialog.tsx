"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Button, type ButtonProps } from "./controls";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./dialog";
import { Alert, AlertDescription } from "./display";
import { classes } from "./shared";

export type ConfirmResult = { ok: true } | { ok: false; error: string };

type PopupFinalFocus = NonNullable<ComponentProps<typeof AlertDialogContent>["finalFocus"]>;
type PopupCloseType = PopupFinalFocus extends infer F ? (F extends (closeType: infer C) => unknown ? C : never) : never;

/** Whether the dialog closed because the action ran and succeeded, or was dismissed (Cancel, Escape, the backdrop). */
export type ConfirmOutcome = "confirmed" | "dismissed";

/**
 * Where focus goes when the dialog closes: Base UI's `finalFocus` (`false` for nowhere, a ref, or a function returning an
 * element), with the outcome as a second argument. A confirmed action that removes or disables its trigger names the
 * element that now holds the result; Cancel and Escape still return to the trigger. A function that returns nothing or
 * `null` keeps the default (Base UI treats a bare `undefined` as "do not move focus"; this wrapper does not).
 */
export type ConfirmFinalFocus =
  | boolean
  | { current: HTMLElement | null }
  | ((closeType: PopupCloseType, outcome: ConfirmOutcome) => boolean | HTMLElement | null | void);

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  details?: ReactNode;
  confirmLabel: ReactNode;
  pendingLabel?: ReactNode;
  cancelLabel?: ReactNode;
  destructive?: boolean;
  fallbackError?: string;
  onConfirm: () => Promise<ConfirmResult | void> | ConfirmResult | void;
  /** Where focus lands on close. Without it Base UI returns to the trigger, which is nowhere once a confirmed action removes it. */
  finalFocus?: ConfirmFinalFocus;
  className?: string;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  details,
  confirmLabel,
  pendingLabel,
  cancelLabel = "Cancel",
  destructive = false,
  fallbackError = "Something went wrong",
  onConfirm,
  finalFocus,
  className,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const outcome = useRef<ConfirmOutcome>("dismissed");
  useEffect(() => {
    if (open) outcome.current = "dismissed";
  }, [open]);

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      const result = await onConfirm();
      if (result && !result.ok) {
        setError(result.error || fallbackError);
      } else {
        outcome.current = "confirmed";
        onOpenChange(false);
      }
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : fallbackError);
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (!next) setError(null);
        onOpenChange(next);
      }}
    >
      <AlertDialogContent
        className={classes("fui-confirm-dialog", className)}
        finalFocus={
          typeof finalFocus === "function"
            ? (closeType) => finalFocus(closeType, outcome.current) ?? null
            : finalFocus
        }
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="fui-confirm-dialog-title">{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        {details || error ? (
          <div className="fui-confirm-dialog-body">
            {details}
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            loading={pending}
            variant={destructive ? "destructive" : "default"}
            onClick={() => void confirm()}
          >
            {pending && pendingLabel ? pendingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export type ConfirmActionButtonProps = Omit<ConfirmDialogProps, "open" | "onOpenChange"> & {
  children: ReactNode;
  buttonProps?: Omit<ButtonProps, "onClick" | "children">;
  defaultOpen?: boolean;
};

export function ConfirmActionButton({
  children,
  buttonProps,
  defaultOpen = false,
  ...dialog
}: ConfirmActionButtonProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <Button type="button" {...buttonProps} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <ConfirmDialog {...dialog} open={open} onOpenChange={setOpen} />
    </>
  );
}
