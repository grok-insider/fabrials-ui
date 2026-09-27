"use client";

import type { ComponentProps } from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
import { X } from "lucide-react";
import { Button } from "./controls";
import { classes, type StyledProps } from "./shared";

export const Dialog = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;
export const DialogPortal = BaseDialog.Portal;

/** The scrim behind a dialog. DialogContent already renders one; use this with DialogPortal for a custom layout. */
export function DialogOverlay({ className, ...props }: StyledProps<BaseDialog.Backdrop.Props>) {
  return <BaseDialog.Backdrop className={classes("fui-backdrop", className)} {...props} />;
}

export type DialogContentProps = StyledProps<BaseDialog.Popup.Props> & {
  closeLabel?: string;
  showCloseButton?: boolean;
  placement?: "center" | "start" | "end";
};

export function DialogContent({
  className,
  children,
  closeLabel = "Close",
  showCloseButton = true,
  placement = "center",
  ...props
}: DialogContentProps) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="fui-backdrop" />
      <BaseDialog.Popup
        className={classes("fui-dialog", className)}
        data-placement={placement}
        {...props}
      >
        {children}
        {showCloseButton && (
          <BaseDialog.Close
            render={
              <Button
                variant="ghost"
                size="icon"
                className="fui-dialog-close"
                aria-label={closeLabel}
              />
            }
          >
            <X aria-hidden size={18} />
          </BaseDialog.Close>
        )}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

export function DialogTitle({
  className,
  ...props
}: StyledProps<BaseDialog.Title.Props>) {
  return (
    <BaseDialog.Title
      className={classes("fui-dialog-title", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: StyledProps<BaseDialog.Description.Props>) {
  return (
    <BaseDialog.Description
      className={classes("fui-description", className)}
      {...props}
    />
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={classes("fui-dialog-header", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={classes("fui-dialog-footer", className)} {...props} />;
}

export const Sheet = Dialog;
export const SheetTrigger = DialogTrigger;
export const SheetClose = DialogClose;
export const SheetHeader = DialogHeader;
export const SheetTitle = DialogTitle;
export const SheetDescription = DialogDescription;
export const SheetFooter = DialogFooter;

export function SheetContent({
  side = "right",
  ...props
}: Omit<DialogContentProps, "placement"> & { side?: "left" | "right" }) {
  return (
    <DialogContent
      {...props}
      data-side={side}
      placement={side === "left" ? "start" : "end"}
    />
  );
}

export const AlertDialog = BaseAlertDialog.Root;
export const AlertDialogTrigger = BaseAlertDialog.Trigger;
export const AlertDialogClose = BaseAlertDialog.Close;
export const AlertDialogPortal = BaseAlertDialog.Portal;

export function AlertDialogOverlay({ className, ...props }: StyledProps<BaseAlertDialog.Backdrop.Props>) {
  return <BaseAlertDialog.Backdrop className={classes("fui-backdrop", className)} {...props} />;
}

/** An icon above the alert title; decorative, the title still states the risk. */
export function AlertDialogMedia({ className, ...props }: ComponentProps<"div">) {
  return <div aria-hidden className={classes("fui-alert-dialog-media", className)} {...props} />;
}
export const AlertDialogHeader = DialogHeader;
export const AlertDialogFooter = DialogFooter;
export const AlertDialogAction = Button;

export function AlertDialogCancel({
  variant = "outline",
  size = "default",
  ...props
}: StyledProps<BaseAlertDialog.Close.Props> &
  Pick<ComponentProps<typeof Button>, "variant" | "size">) {
  return (
    <BaseAlertDialog.Close
      render={<Button variant={variant} size={size} />}
      {...props}
    />
  );
}

export function AlertDialogContent({
  className,
  ...props
}: StyledProps<BaseAlertDialog.Popup.Props>) {
  return (
    <BaseAlertDialog.Portal>
      <BaseAlertDialog.Backdrop className="fui-backdrop" />
      <BaseAlertDialog.Popup
        className={classes("fui-dialog", className)}
        data-placement="center"
        {...props}
      />
    </BaseAlertDialog.Portal>
  );
}

export function AlertDialogTitle({
  className,
  ...props
}: StyledProps<BaseAlertDialog.Title.Props>) {
  return (
    <BaseAlertDialog.Title
      className={classes("fui-dialog-title", className)}
      {...props}
    />
  );
}

export function AlertDialogDescription({
  className,
  ...props
}: StyledProps<BaseAlertDialog.Description.Props>) {
  return (
    <BaseAlertDialog.Description
      className={classes("fui-description", className)}
      {...props}
    />
  );
}
