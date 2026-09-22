import { classes } from "./shared";

export type ButtonStyleProps = {
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm";
  className?: string;
};

export function buttonVariants({ variant = "default", size = "default", className }: ButtonStyleProps = {}) {
  return classes("fui-button", `fui-button-${variant}`, `fui-button-size-${size}`, className);
}
