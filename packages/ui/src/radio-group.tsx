"use client";

import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { classes, type StyledProps } from "./shared";

export function RadioGroup({
  className,
  ...props
}: StyledProps<BaseRadioGroup.Props>) {
  return (
    <BaseRadioGroup
      data-slot="radio-group"
      className={classes("fui-radio-group", className)}
      {...props}
    />
  );
}

export function Radio({
  className,
  ...props
}: StyledProps<BaseRadio.Root.Props>) {
  return (
    <BaseRadio.Root
      data-slot="radio"
      className={classes("fui-radio", className)}
      {...props}
    >
      <BaseRadio.Indicator className="fui-radio-indicator" />
    </BaseRadio.Root>
  );
}
