"use client";

import type { ComponentProps } from "react";
import { Button as BaseButton } from "@base-ui/react/button";
import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { Check, Minus } from "lucide-react";
import { classes, type StyledProps } from "./shared";

export { buttonVariants } from "./button-variants";
import type { ButtonStyleProps } from "./button-variants";

export type ButtonProps = StyledProps<BaseButton.Props> & ButtonStyleProps;

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      data-slot="button"
      className={classes("fui-button", className)}
      data-variant={variant}
      data-size={size}
      {...props}
    />
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={classes("fui-input", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={classes("fui-input", "fui-textarea", className)}
      {...props}
    />
  );
}

export function NativeSelect({
  className,
  ...props
}: ComponentProps<"select">) {
  return (
    <select
      className={classes("fui-input", "fui-native-select", className)}
      {...props}
    />
  );
}

export function NativeCheckbox({
  className,
  ...props
}: ComponentProps<"input"> & { type?: "checkbox" }) {
  return (
    <input
      className={classes("fui-native-checkbox", className)}
      {...props}
      type="checkbox"
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={classes("fui-label", className)} {...props} />;
}

export function Checkbox({
  className,
  indeterminate,
  ...props
}: StyledProps<BaseCheckbox.Root.Props>) {
  return (
    <BaseCheckbox.Root
      className={classes("fui-checkbox", className)}
      indeterminate={indeterminate}
      {...props}
    >
      <BaseCheckbox.Indicator className="fui-control-indicator">
        {indeterminate ? (
          <Minus aria-hidden size={14} />
        ) : (
          <Check aria-hidden size={14} />
        )}
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
}

export function Switch({
  className,
  ...props
}: StyledProps<BaseSwitch.Root.Props>) {
  return (
    <BaseSwitch.Root className={classes("fui-switch", className)} {...props}>
      <BaseSwitch.Thumb className="fui-switch-thumb" />
    </BaseSwitch.Root>
  );
}
