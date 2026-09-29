"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
import { X } from "lucide-react";
import { Button } from "./controls";
import { classes, type StyledProps } from "./shared";

type OpenChangeDetails = { reason: string; event: Event; cancel(): void };

/**
 * A key press that is part of an input method composition (a Japanese or Chinese IME, an accent dead key) must not
 * close a dialog: Escape there cancels the composition, and closing would lose what the person was typing.
 */
function guardComposition<Details extends OpenChangeDetails>(
  onOpenChange: ((open: boolean, details: Details) => void) | undefined,
) {
  return (open: boolean, details: Details) => {
    if (
      !open &&
      details.reason === "escape-key" &&
      "isComposing" in details.event &&
      details.event.isComposing
    ) {
      details.cancel();
      return;
    }
    onOpenChange?.(open, details);
  };
}

/** The dialog root. Escape during an IME composition does not close it (0.8). */
export function Dialog<Payload = unknown>({
  onOpenChange,
  ...props
}: BaseDialog.Root.Props<Payload>) {
  return <BaseDialog.Root<Payload> {...props} onOpenChange={guardComposition(onOpenChange)} />;
}
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;
export const DialogPortal = BaseDialog.Portal;

/** The scrim behind a dialog. DialogContent already renders one; use this with DialogPortal for a custom layout. */
export function DialogOverlay({ className, ...props }: StyledProps<BaseDialog.Backdrop.Props>) {
  return <BaseDialog.Backdrop className={classes("fui-backdrop", className)} {...props} />;
}

/**
 * What DialogContent shares with its DialogFooter: where the close control lives, and the slot a `DialogActions` portals
 * into. `null` outside a DialogContent (an AlertDialog, a sidebar sheet).
 */
type DialogChrome = {
  close: "corner" | "footer" | "none";
  closeLabel: string;
  slotWanted: boolean;
  /** A DialogActions registers here and gets its cleanup: the footer keeps its slot while any of them is mounted. */
  addSlotUser(): () => void;
  slot: HTMLElement | null;
  setSlot(element: HTMLElement | null): void;
};
const ChromeContext = createContext<DialogChrome | null>(null);

export type DialogContentProps = StyledProps<BaseDialog.Popup.Props> & {
  closeLabel?: string;
  /** The corner X. `close` overrides it. */
  showCloseButton?: boolean;
  /**
   * Where the close control lives. `"corner"` is the X in the corner (the default); `"footer"` puts a Close button first in
   * the `DialogFooter` (so the primary action ends at the inline end) and draws no X.
   */
  close?: "corner" | "footer";
  placement?: "center" | "start" | "end";
  /**
   * `default` is 32rem. `wide` is 46rem. `settings` is a 62 by 42rem workspace (72 by 48rem from 100rem) for a dialog that holds
   * a rail and panels. `full-narrow` keeps the default width and takes the whole screen below 48rem. `wide` and `settings`
   * also take the whole screen there, the way a sheet does.
   */
  size?: "default" | "wide" | "settings" | "full-narrow";
  /** `none` removes the padding (a sheet whose content draws its own, a dialog that is only a `DialogBody`). */
  padding?: "default" | "none";
  /** Keep the dialog in the DOM, hidden, while it is closed: what was typed in it is still there when it opens again. */
  keepMounted?: boolean;
  /** Draw the scrim. A non-modal Sheet has none. */
  backdrop?: boolean;
};

export function DialogContent({
  className,
  children,
  closeLabel = "Close",
  showCloseButton = true,
  close,
  placement = "center",
  size = "default",
  padding = "default",
  keepMounted,
  backdrop = true,
  ...props
}: DialogContentProps) {
  const mode = close ?? (showCloseButton ? "corner" : "none");
  const [slotUsers, setSlotUsers] = useState(0);
  const addSlotUser = useCallback(() => {
    setSlotUsers((count) => count + 1);
    return () => setSlotUsers((count) => count - 1);
  }, []);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  return (
    <BaseDialog.Portal keepMounted={keepMounted}>
      {backdrop && <BaseDialog.Backdrop className="fui-backdrop" />}
      <BaseDialog.Popup
        className={classes("fui-dialog", className)}
        data-placement={placement}
        data-size={size === "default" ? undefined : size}
        data-padding={padding === "none" ? "none" : undefined}
        data-close={mode}
        {...props}
      >
        <ChromeContext.Provider
          value={{ close: mode, closeLabel, slotWanted: slotUsers > 0, addSlotUser, slot, setSlot }}
        >
          {children}
        </ChromeContext.Provider>
        {mode === "corner" && (
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

/**
 * The scrolling middle of a dialog. Put it between `DialogHeader` and `DialogFooter` as direct children of `DialogContent`
 * and the dialog gets a fixed header, a body that is the only scroller and a fixed footer: a long title, a long form or a
 * long list never pushes the title or the actions out of reach. Without a `DialogBody` a dialog is the plain padded box.
 * `scroll={false}` makes the body a plain region that its own content fills and scrolls (a settings rail and panel).
 * A body with no focusable content should be given `tabIndex={0}` and a name, so it scrolls from the keyboard.
 */
export function DialogBody({
  className,
  scroll = true,
  padding = "default",
  ...props
}: ComponentProps<"div"> & { scroll?: boolean; padding?: "default" | "none" }) {
  return (
    <div
      className={classes("fui-dialog-body", className)}
      data-scroll={scroll ? undefined : "false"}
      data-padding={padding === "none" ? "none" : undefined}
      {...props}
    />
  );
}

/**
 * The action row of a dialog. In a `DialogContent` with `close="footer"` (or with `showCloseButton`, shadcn's name) a Close
 * button comes first, so the primary action is the last one, at the inline end. In a fixed-layout dialog under 34rem the
 * row wraps: the secondary buttons share rows, the ink action (last, as in the tab order) takes the full bottom row, and every
 * button is 44 px tall.
 */
export function DialogFooter({
  className,
  children,
  showCloseButton,
  closeLabel,
  ...props
}: ComponentProps<"div"> & { showCloseButton?: boolean; closeLabel?: string }) {
  const chrome = useContext(ChromeContext);
  const close = showCloseButton ?? chrome?.close === "footer";
  return (
    <div className={classes("fui-dialog-footer", className)} {...props}>
      {close && (
        <BaseDialog.Close render={<Button variant="secondary" />}>
          {closeLabel ?? chrome?.closeLabel ?? "Close"}
        </BaseDialog.Close>
      )}
      {children}
      {chrome?.slotWanted && (
        <span ref={chrome.setSlot} className="fui-dialog-footer-slot" />
      )}
    </div>
  );
}

/**
 * Renders its children in the dialog's footer, after Close. For actions that belong to a stateful child under the body (a form
 * that owns the submit): the button sits in the fixed footer while the state stays where it lives. Nothing renders until the
 * footer has mounted, so the server output is empty. Needs a `DialogFooter` in the same `DialogContent`.
 */
export function DialogActions({ children }: { children: ReactNode }) {
  const chrome = useContext(ChromeContext);
  const addSlotUser = chrome?.addSlotUser;
  useEffect(() => addSlotUser?.(), [addSlotUser]);
  return chrome?.slot ? createPortal(children, chrome.slot) : null;
}

const SheetModal = createContext(true);

/**
 * A sheet is a dialog attached to an edge. `modal` is Base UI's: `true` (default) traps focus, locks the page scroll and draws a
 * scrim; `false` is a drawer beside the page (no scrim, no trap, the page stays usable, an outside press does not close it,
 * Escape and the close control do); `"trap-focus"` traps focus but leaves the page usable. Base UI reads `modal` on the
 * root, which is why it is set here and `SheetContent` follows it.
 */
export function Sheet<Payload = unknown>({
  modal = true,
  disablePointerDismissal,
  ...props
}: BaseDialog.Root.Props<Payload>) {
  return (
    <SheetModal.Provider value={modal === true}>
      <Dialog<Payload>
        {...props}
        modal={modal}
        disablePointerDismissal={disablePointerDismissal ?? (modal === false ? true : undefined)}
      />
    </SheetModal.Provider>
  );
}
export const SheetTrigger = DialogTrigger;
export const SheetClose = DialogClose;
export const SheetHeader = DialogHeader;
export const SheetTitle = DialogTitle;
export const SheetDescription = DialogDescription;
export const SheetFooter = DialogFooter;
export const SheetBody = DialogBody;

export function SheetContent({
  side = "right",
  ...props
}: Omit<DialogContentProps, "placement" | "size" | "backdrop"> & { side?: "left" | "right" }) {
  const modal = useContext(SheetModal);
  return (
    <DialogContent
      {...props}
      data-side={side}
      backdrop={modal}
      placement={side === "left" ? "start" : "end"}
    />
  );
}

/** The alert dialog root. Escape during an IME composition does not close it (0.8). */
export function AlertDialog<Payload = unknown>({
  onOpenChange,
  ...props
}: BaseAlertDialog.Root.Props<Payload>) {
  return (
    <BaseAlertDialog.Root<Payload> {...props} onOpenChange={guardComposition(onOpenChange)} />
  );
}
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
export function AlertDialogFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={classes("fui-dialog-footer", className)} {...props} />;
}
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
