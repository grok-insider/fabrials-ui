"use client";

import { useState, type ReactNode } from "react";
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

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  details?: ReactNode;
  confirmLabel: ReactNode;
  pendingLabel?: ReactNode;
  cancelLabel?: ReactNode;
  destructive?: boolean;
  fallbackError?: string;
  onConfirm: () => Promise<ConfirmResult | void> | ConfirmResult | void;
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
  className,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      const result = await onConfirm();
      if (result && !result.ok) {
        setError(result.error || fallbackError);
      } else {
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
      <AlertDialogContent className={classes("fui-confirm-dialog", className)}>
        <AlertDialogHeader>
          <AlertDialogTitle className="fui-confirm-dialog-title">{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
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
