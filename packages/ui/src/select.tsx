"use client";

import { Children, isValidElement, type ReactNode } from "react";
import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { classes, type StyledProps } from "./shared";

export const Select = BaseSelect.Root;
export const SelectValue = BaseSelect.Value;
export const SelectGroup = BaseSelect.Group;

export function SelectLabel({ className, ...props }: StyledProps<BaseSelect.GroupLabel.Props>) {
  return <BaseSelect.GroupLabel className={classes("fui-menu-label", className)} {...props} />;
}

export function SelectSeparator({ className, ...props }: StyledProps<BaseSelect.Separator.Props>) {
  return <BaseSelect.Separator className={classes("fui-menu-separator", "fui-separator", className)} {...props} />;
}

export function SelectScrollUpButton({ className, ...props }: StyledProps<BaseSelect.ScrollUpArrow.Props>) {
  return (
    <BaseSelect.ScrollUpArrow data-slot="select-scroll-up" className={classes("fui-menu-scroll-arrow", "fui-menu-scroll-arrow-up", className)} {...props}>
      <ChevronUp aria-hidden size={16} />
    </BaseSelect.ScrollUpArrow>
  );
}

export function SelectScrollDownButton({ className, ...props }: StyledProps<BaseSelect.ScrollDownArrow.Props>) {
  return (
    <BaseSelect.ScrollDownArrow data-slot="select-scroll-down" className={classes("fui-menu-scroll-arrow", "fui-menu-scroll-arrow-down", className)} {...props}>
      <ChevronDown aria-hidden size={16} />
    </BaseSelect.ScrollDownArrow>
  );
}

export function SelectTrigger({
  className,
  children,
  size,
  ...props
}: StyledProps<BaseSelect.Trigger.Props> & { size?: string }) {
  return (
    <BaseSelect.Trigger
      className={classes("fui-input", "fui-select-trigger", className)}
      data-size={size}
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
  align = "center",
  ...props
}: StyledProps<BaseSelect.Popup.Props> & {
  align?: "start" | "center" | "end";
}) {
  // The scroll keys are siblings of the list, never rows of it: Base UI draws them only while the list has more to scroll
  // and would read them as options otherwise. They are written among the items, as shadcn's users write them.
  const rows: ReactNode[] = [];
  const up: ReactNode[] = [];
  const down: ReactNode[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === SelectScrollUpButton) up.push(child);
    else if (isValidElement(child) && child.type === SelectScrollDownButton) down.push(child);
    else rows.push(child);
  });
  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner
        className="fui-positioner"
        sideOffset={6}
        align={align}
        alignItemWithTrigger={false}
      >
        <BaseSelect.Popup className={classes("fui-menu", "fui-select-popup", className)} data-slot="select-content" {...props}>
          {up}
          <BaseSelect.List className="fui-select-list">{rows}</BaseSelect.List>
          {down}
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
