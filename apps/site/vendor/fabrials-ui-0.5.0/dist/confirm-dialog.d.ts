import { type ReactNode } from "react";
import { type ButtonProps } from "./controls";
export type ConfirmResult = {
    ok: true;
} | {
    ok: false;
    error: string;
};
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
export declare function ConfirmDialog({ open, onOpenChange, title, description, details, confirmLabel, pendingLabel, cancelLabel, destructive, fallbackError, onConfirm, className, }: ConfirmDialogProps): import("react").JSX.Element;
export type ConfirmActionButtonProps = Omit<ConfirmDialogProps, "open" | "onOpenChange"> & {
    children: ReactNode;
    buttonProps?: Omit<ButtonProps, "onClick" | "children">;
    defaultOpen?: boolean;
};
export declare function ConfirmActionButton({ children, buttonProps, defaultOpen, ...dialog }: ConfirmActionButtonProps): import("react").JSX.Element;
