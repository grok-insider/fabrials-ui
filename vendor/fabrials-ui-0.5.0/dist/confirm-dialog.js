"use client";
import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Button } from "./controls.js";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "./dialog.js";
import { Alert, AlertDescription } from "./display.js";
import { classes } from "./shared.js";
function ConfirmDialog({
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
  className
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
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
  return /* @__PURE__ */ jsx(
    AlertDialog,
    {
      open,
      onOpenChange: (next) => {
        if (pending) return;
        if (!next) setError(null);
        onOpenChange(next);
      },
      children: /* @__PURE__ */ jsxs(AlertDialogContent, { className: classes("fui-confirm-dialog", className), children: [
        /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
          /* @__PURE__ */ jsx(AlertDialogTitle, { className: "fui-confirm-dialog-title", children: title }),
          /* @__PURE__ */ jsx(AlertDialogDescription, { children: description })
        ] }),
        details || error ? /* @__PURE__ */ jsxs("div", { className: "fui-confirm-dialog-body", children: [
          details,
          error ? /* @__PURE__ */ jsx(Alert, { variant: "destructive", children: /* @__PURE__ */ jsx(AlertDescription, { children: error }) }) : null
        ] }) : null,
        /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
          /* @__PURE__ */ jsx(AlertDialogCancel, { disabled: pending, children: cancelLabel }),
          /* @__PURE__ */ jsx(
            AlertDialogAction,
            {
              type: "button",
              loading: pending,
              variant: destructive ? "destructive" : "default",
              onClick: () => void confirm(),
              children: pending && pendingLabel ? pendingLabel : confirmLabel
            }
          )
        ] })
      ] })
    }
  );
}
function ConfirmActionButton({
  children,
  buttonProps,
  defaultOpen = false,
  ...dialog
}) {
  const [open, setOpen] = useState(defaultOpen);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Button, { type: "button", ...buttonProps, onClick: () => setOpen(true), children }),
    /* @__PURE__ */ jsx(ConfirmDialog, { ...dialog, open, onOpenChange: setOpen })
  ] });
}
export {
  ConfirmActionButton,
  ConfirmDialog
};
