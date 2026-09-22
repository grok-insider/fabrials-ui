"use client";

import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { classes, type StyledProps } from "./shared";

function Input({ className, ...props }: StyledProps<BaseCombobox.Input.Props>) {
  return (
    <BaseCombobox.Input
      className={classes("fui-input", className)}
      {...props}
    />
  );
}

function Popup({ className, ...props }: StyledProps<BaseCombobox.Popup.Props>) {
  return (
    <BaseCombobox.Popup className={classes("fui-menu", className)} {...props} />
  );
}

function Item({ className, ...props }: StyledProps<BaseCombobox.Item.Props>) {
  return (
    <BaseCombobox.Item
      className={classes("fui-menu-item", className)}
      {...props}
    />
  );
}

function Chips({ className, ...props }: StyledProps<BaseCombobox.Chips.Props>) {
  return (
    <BaseCombobox.Chips
      className={classes("fui-combobox-chips", className)}
      {...props}
    />
  );
}

function Chip({ className, ...props }: StyledProps<BaseCombobox.Chip.Props>) {
  return (
    <BaseCombobox.Chip
      className={classes("fui-combobox-chip", className)}
      {...props}
    />
  );
}

export const Combobox = { ...BaseCombobox, Input, Popup, Item, Chips, Chip };
