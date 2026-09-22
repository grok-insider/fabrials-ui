"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { classes, type StyledProps } from "./shared";

export const Select = BaseSelect.Root;
export const SelectValue = BaseSelect.Value;
export const SelectGroup = BaseSelect.Group;

export function SelectTrigger({
  className,
  children,
  ...props
}: StyledProps<BaseSelect.Trigger.Props>) {
  return (
    <BaseSelect.Trigger
      className={classes("fui-input", "fui-select-trigger", className)}
      {...props}
    >
      {children}
      <BaseSelect.Icon>
        <ChevronDown aria-hidden size={16} />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  );
}

export function SelectContent({
  className,
  children,
  ...props
}: StyledProps<BaseSelect.Popup.Props>) {
  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner
        className="fui-positioner"
        sideOffset={6}
        alignItemWithTrigger={false}
      >
        <BaseSelect.Popup className={classes("fui-menu", className)} {...props}>
          <BaseSelect.List>{children}</BaseSelect.List>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

export function SelectItem({
  className,
  children,
  ...props
}: StyledProps<BaseSelect.Item.Props>) {
  return (
    <BaseSelect.Item className={classes("fui-menu-item", className)} {...props}>
      <BaseSelect.ItemText>{children}</BaseSelect.ItemText>
      <BaseSelect.ItemIndicator className="fui-menu-indicator">
        <Check aria-hidden size={16} />
      </BaseSelect.ItemIndicator>
    </BaseSelect.Item>
  );
}
