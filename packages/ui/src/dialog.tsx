"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
import { X } from "lucide-react";
import { Button } from "./controls";
import { classes, type StyledProps } from "./shared";

type ButtonVariant = ComponentProps<typeof Button>["variant"];

/** Hands one element to several refs (a callback ref or a ref object each). */
function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as RefObject<T | null>).current = value;
}

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
  closeVariant: ButtonVariant;
  slotWanted: boolean;
  /** A DialogActions registers here and gets its cleanup: the footer keeps its slot while any of them is mounted. */
  addSlotUser(): () => void;
  slot: HTMLElement | null;
  setSlot(element: HTMLElement | null): void;
};
const ChromeContext = createContext<DialogChrome | null>(null);

export type DialogContentProps = StyledProps<BaseDialog.Popup.Props> & {
  closeLabel?: string;
  /**
   * The `Button` variant of the Close that `close="footer"` puts in the footer. `"secondary"` (a grey fill) by default; a product
   * whose secondary actions are outlines sets `"outline"` once here. A `DialogFooter` `closeVariant` wins. The corner X is always
   * the ghost icon button.
   */
  closeVariant?: ButtonVariant;
  /**
   * Where the dialog is portalled: an element, a ref to one, or `null` to wait until there is one. The default is the document
   * body. Hold the element in state (`useState` with the setter as its `ref`) when the dialog can be open on the first render: a
   * ref object is still empty then, and the dialog falls back to the body. Put a sheet next to its trigger and the tab order is
   * trigger, then the sheet, with nothing between them. A
   * position-fixed popup is placed against the window whatever the container is, unless the container is itself a containing
   * block (`transform`, `contain: paint`).
   */
  container?: BaseDialog.Portal.Props["container"];
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
  closeVariant = "secondary",
  container,
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
    <BaseDialog.Portal keepMounted={keepMounted} container={container}>
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
          value={{ close: mode, closeLabel, closeVariant, slotWanted: slotUsers > 0, addSlotUser, slot, setSlot }}
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
  closeVariant,
  ref,
  ...props
}: ComponentProps<"div"> & {
  showCloseButton?: boolean;
  closeLabel?: string;
  /** The variant of the Close this footer draws. Default: the `DialogContent`'s `closeVariant`, else `"secondary"`. */
  closeVariant?: ButtonVariant;
}) {
  const chrome = useContext(ChromeContext);
  const close = showCloseButton ?? chrome?.close === "footer";
  const element = useRef<HTMLDivElement | null>(null);
  const setElement = useCallback(
    (node: HTMLDivElement | null) => {
      element.current = node;
      assignRef(ref, node);
    },
    [ref],
  );
  // In a short window the dialog scrolls as a whole and this footer sticks over its bottom edge (styles.css). CSS cannot read the
  // footer's height, so it is published on the dialog as `--fui-dialog-footer-size`, and the dialog pads its scrolling with it:
  // a field that gets focus is scrolled into view above the footer, not under it. Only that rule reads it.
  useLayoutEffect(() => {
    const footer = element.current;
    const dialog = footer?.closest<HTMLElement>(".fui-dialog");
    if (!footer || !dialog || typeof ResizeObserver === "undefined") return;
    const publish = () => dialog.style.setProperty("--fui-dialog-footer-size", `${footer.getBoundingClientRect().height}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(footer);
    return () => {
      observer.disconnect();
      dialog.style.removeProperty("--fui-dialog-footer-size");
    };
  }, []);
  return (
    <div
      ref={setElement}
      className={classes("fui-dialog-footer", className)}
      {...props}
    >
      {close && (
        <BaseDialog.Close render={<Button variant={closeVariant ?? chrome?.closeVariant ?? "secondary"} />}>
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

/** What a `Sheet` shares with its `SheetContent`: whether it is modal, and the Escape scope with the popup it applies to. */
type SheetState = { modal: boolean; popup: RefObject<HTMLElement | null>; closeOnEscape: "anywhere" | "focus-inside" };
const SheetContext = createContext<SheetState | null>(null);

/**
 * A sheet is a dialog attached to an edge. `modal` is Base UI's: `true` (default) traps focus, locks the page scroll and draws a
 * scrim; `false` is a drawer beside the page (no scrim, no trap, the page stays usable, an outside press does not close it,
 * Escape and the close control do); `"trap-focus"` traps focus but leaves the page usable. Base UI reads `modal` on the
 * root, which is why it is set here and `SheetContent` follows it.
 *
 * `closeOnEscape` says where Escape is heard. `"anywhere"` (the default) is a dialog's: Escape closes it from wherever focus is in
 * the document. `"focus-inside"` closes it only when focus is inside the sheet, so a drawer that stays open beside the page is not
 * closed by an Escape meant for the editor next to it; Escape from inside still hands focus back to the trigger.
 */
export function Sheet<Payload = unknown>({
  modal = true,
  disablePointerDismissal,
  closeOnEscape = "anywhere",
  onOpenChange,
  ...props
}: BaseDialog.Root.Props<Payload> & { closeOnEscape?: "anywhere" | "focus-inside" }) {
  const popup = useRef<HTMLElement | null>(null);
  const scoped: typeof onOpenChange = (open, details) => {
    if (!open && closeOnEscape === "focus-inside" && details.reason === "escape-key") {
      const target = details.event.target;
      if (!(target instanceof Node) || !popup.current?.contains(target)) {
        details.cancel();
        return;
      }
    }
    onOpenChange?.(open, details);
  };
  return (
    <SheetContext.Provider value={{ modal: modal === true, popup, closeOnEscape }}>
      <Dialog<Payload>
        {...props}
        modal={modal}
        onOpenChange={scoped}
        disablePointerDismissal={disablePointerDismissal ?? (modal === false ? true : undefined)}
      />
    </SheetContext.Provider>
  );
}
export const SheetTrigger = DialogTrigger;
export const SheetClose = DialogClose;
export const SheetHeader = DialogHeader;
export const SheetTitle = DialogTitle;
export const SheetDescription = DialogDescription;
export const SheetFooter = DialogFooter;
export const SheetBody = DialogBody;

/**
 * The panel of a `Sheet`.
 *
 * `side` is `"left"` or `"right"` (physical: the same edge in every writing direction) or `"start"` or `"end"` (logical: the
 * inline start or end, which is the other edge in a right-to-left page). `container` portals it somewhere other than the body
 * (see `DialogContent`), and `initialFocus` / `finalFocus` are Base UI's: `initialFocus={false}` leaves focus where it was when
 * the sheet opens (a drawer that must not steal it from its trigger).
 *
 * Placement is set with custom properties on the popup, from `style` or `className`, with no `!important`:
 * `--fui-sheet-inset-block-start` and `--fui-sheet-inset-block-end` (a length, default 0: a drawer under a header),
 * `--fui-sheet-z` (default: the overlay level, one above the scrim) and `--fui-sheet-width` (default 26rem; never wider than the
 * window).
 */
export function SheetContent({
  side = "right",
  ref,
  ...props
}: Omit<DialogContentProps, "placement" | "size" | "backdrop"> & { side?: "left" | "right" | "start" | "end" }) {
  const sheet = useContext(SheetContext);
  const popup = sheet?.popup;
  const setPopup = useCallback(
    (node: HTMLDivElement | null) => {
      if (popup) popup.current = node;
      assignRef(ref, node);
    },
    [popup, ref],
  );
  return (
    <DialogContent
      {...props}
      ref={setPopup}
      data-side={side}
      backdrop={sheet?.modal ?? true}
      placement={side === "left" || side === "start" ? "start" : "end"}
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
