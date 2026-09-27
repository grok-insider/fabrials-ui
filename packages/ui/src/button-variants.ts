import { classes } from "./shared";

export type ButtonVariant =
  | "default"
  | "accent"
  | "outline"
  | "secondary"
  | "ghost"
  | "destructive"
  | "link";

export type ButtonSize =
  | "default"
  | "xs"
  | "sm"
  | "lg"
  | "icon"
  | "icon-xs"
  | "icon-sm"
  | "icon-lg";

export type ButtonStyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

export function buttonVariants({ variant = "default", size = "default", className }: ButtonStyleProps = {}) {
  return classes("fui-button", `fui-button-${variant}`, `fui-button-size-${size}`, className);
}
