"use client";

import { useRef, type ReactNode } from "react";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, X } from "lucide-react";
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

// The dotted parts of 0.11 and before. They still work; each names the flat part that replaces it.
const dotted = {
  ...BaseCombobox,
  /** @deprecated Use `Combobox` (or `ComboboxRoot`) as the root. */
  Root: BaseCombobox.Root,
  /** @deprecated Use `ComboboxInput`, or `ComboboxChipsInput` inside `ComboboxChips`. */
  Input,
  /** @deprecated Use `ComboboxContent`, which brings the portal and the positioner. */
  Popup,
  /** @deprecated Use `ComboboxContent`. */
  Portal: BaseCombobox.Portal,
  /** @deprecated Use `ComboboxContent` (`side`, `align`, `sideOffset`, `anchor`). */
  Positioner: BaseCombobox.Positioner,
  /** @deprecated Use `ComboboxItem`, which brings the tick. */
  Item,
  /** @deprecated Use `ComboboxItem`. */
  ItemIndicator: BaseCombobox.ItemIndicator,
  /** @deprecated Use `ComboboxList`. */
  List: BaseCombobox.List,
  /** @deprecated Use `ComboboxEmpty`. */
  Empty: BaseCombobox.Empty,
  /** @deprecated Use `ComboboxValue`. */
  Value: BaseCombobox.Value,
  /** @deprecated Use `ComboboxTrigger`, or `ComboboxInput`, which has one. */
  Trigger: BaseCombobox.Trigger,
  /** @deprecated Use `ComboboxClear`, or `ComboboxInput showClear`. */
  Clear: BaseCombobox.Clear,
  /** @deprecated Use `ComboboxGroup`. */
  Group: BaseCombobox.Group,
  /** @deprecated Use `ComboboxLabel`. */
  GroupLabel: BaseCombobox.GroupLabel,
  /** @deprecated Use `ComboboxCollection`. */
  Collection: BaseCombobox.Collection,
  /** @deprecated Use `ComboboxSeparator`. */
  Separator: BaseCombobox.Separator,
  /** @deprecated Use `ComboboxChips`, which is the field and the list's anchor. */
  Chips,
  /** @deprecated Use `ComboboxChip`, which brings the key that removes it. */
  Chip,
  /** @deprecated Use `ComboboxChip`. */
  ChipRemove: BaseCombobox.ChipRemove,
};

/**
 * A field that filters a list as you type. `items` is the list, `multiple` keeps several values; the rest is Base UI's
 * Combobox root (`value`, `onValueChange`, `itemToStringLabel`, `autoHighlight`, `disabled`, `name`…).
 */
export const ComboboxRoot = BaseCombobox.Root;

/**
 * The root under shadcn's name: `<Combobox items={…}>` is `<ComboboxRoot items={…}>`. It also still carries the dotted
 * parts of earlier releases (`Combobox.Root`, `Combobox.Input`, `Combobox.Popup`…), which are deprecated: a Server
 * Component cannot reach into them, and the flat parts bring the field, the positioner and the tick with them.
 */
export const Combobox = Object.assign(function Combobox<Value, Multiple extends boolean | undefined = false, Item = Value>(
  props: BaseCombobox.Root.Props<Value, Multiple, Item>,
) {
  return <BaseCombobox.Root {...props} />;
}, dotted);

/** The chosen value, or a function of it: `{(values) => values.map(…)}` draws the chips of a multiple combobox. */
export const ComboboxValue = BaseCombobox.Value;
export const ComboboxGroup = BaseCombobox.Group;
/** The items of a group when the list is grouped: `<ComboboxCollection>{(item) => <ComboboxItem … />}</ComboboxCollection>`. */
export const ComboboxCollection = BaseCombobox.Collection;

/** The key at the end of the field that opens the list. Pointer only: the arrow keys open it from the input. */
export function ComboboxTrigger({ className, children, ...props }: StyledProps<BaseCombobox.Trigger.Props>) {
  return (
    <BaseCombobox.Trigger data-slot="combobox-trigger" className={classes("fui-combobox-key", className)} {...props}>
      {children ?? <ChevronDown aria-hidden />}
    </BaseCombobox.Trigger>
  );
}

/** The key that empties the field; it is only there while there is something to clear. */
export function ComboboxClear({ className, children, ...props }: StyledProps<BaseCombobox.Clear.Props>) {
  return (
    <BaseCombobox.Clear data-slot="combobox-clear" className={classes("fui-combobox-key", className)} {...props}>
      {children ?? <X aria-hidden />}
    </BaseCombobox.Clear>
  );
}

/**
 * The field of a single combobox: the input in its box, with the key that opens the list and, with `showClear`, the key
 * that empties it. `className` sizes the box; everything else (`id`, `placeholder`, `aria-label`…) goes to the input.
 * The list opens under the box, as wide as it.
 */
export function ComboboxInput({
  className,
  children,
  disabled,
  showTrigger = true,
  showClear = false,
  triggerLabel = "Show options",
  clearLabel = "Clear",
  ...props
}: StyledProps<BaseCombobox.Input.Props> & {
  showTrigger?: boolean;
  showClear?: boolean;
  /** The name of the key that opens the list. */
  triggerLabel?: string;
  /** The name of the key that empties the field. */
  clearLabel?: string;
  /** Anything else inside the box, after the keys. */
  children?: ReactNode;
}) {
  return (
    <BaseCombobox.InputGroup data-slot="combobox-field" className={classes("fui-input-group", "fui-combobox-field", className)}>
      <BaseCombobox.Input
        data-slot="combobox-input"
        className="fui-input fui-input-group-control fui-combobox-input"
        disabled={disabled}
        {...props}
      />
      {showClear ? <ComboboxClear aria-label={clearLabel} disabled={disabled} /> : null}
      {showTrigger ? <ComboboxTrigger aria-label={triggerLabel} disabled={disabled} /> : null}
      {children}
    </BaseCombobox.InputGroup>
  );
}

/**
 * The list's surface: the portal, the positioner (under the field, 6 px away, aligned with its start) and the popup.
 * A multiple combobox whose anchor is not its chips box passes `anchor`.
 */
export function ComboboxContent({
  className,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  anchor,
  ...props
}: StyledProps<BaseCombobox.Popup.Props> &
  Pick<BaseCombobox.Positioner.Props, "side" | "align" | "sideOffset" | "alignOffset" | "anchor">) {
  return (
    <BaseCombobox.Portal>
      <BaseCombobox.Positioner
        className="fui-positioner"
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
      >
        <BaseCombobox.Popup data-slot="combobox-content" className={classes("fui-menu", "fui-combobox-content", className)} {...props} />
      </BaseCombobox.Positioner>
    </BaseCombobox.Portal>
  );
}

/** The options. Children are the items, or a function of each item of the root's `items`. */
export function ComboboxList({ className, ...props }: StyledProps<BaseCombobox.List.Props>) {
  return <BaseCombobox.List data-slot="combobox-list" className={classes("fui-combobox-list", className)} {...props} />;
}

/** One option; the chosen ones carry a tick at the end of the row. */
export function ComboboxItem({ className, children, ...props }: StyledProps<BaseCombobox.Item.Props>) {
  return (
    <BaseCombobox.Item data-slot="combobox-item" className={classes("fui-menu-item", "fui-combobox-item", className)} {...props}>
      {children}
      <BaseCombobox.ItemIndicator className="fui-menu-indicator">
        <Check aria-hidden />
      </BaseCombobox.ItemIndicator>
    </BaseCombobox.Item>
  );
}

/** The heading of a `ComboboxGroup`. */
export function ComboboxLabel({ className, ...props }: StyledProps<BaseCombobox.GroupLabel.Props>) {
  return <BaseCombobox.GroupLabel data-slot="combobox-label" className={classes("fui-menu-label", className)} {...props} />;
}

export function ComboboxSeparator({ className, ...props }: StyledProps<BaseCombobox.Separator.Props>) {
  return <BaseCombobox.Separator className={classes("fui-menu-separator", "fui-separator", className)} {...props} />;
}

/**
 * What the list says when nothing matches. It is a polite live region that stays mounted, so the sentence is announced
 * when the last match goes; put it before the list.
 */
export function ComboboxEmpty({ className, ...props }: StyledProps<BaseCombobox.Empty.Props>) {
  return <BaseCombobox.Empty data-slot="combobox-empty" className={classes("fui-combobox-empty", className)} {...props} />;
}

/**
 * The field of a multiple combobox: a box that holds the chosen values as chips and, last, a `ComboboxChipsInput`. The
 * list opens under the box. The arrow keys walk the chips from the input, and Backspace in an empty input removes the last.
 */
export function ComboboxChips({ className, children, ...props }: StyledProps<BaseCombobox.InputGroup.Props>) {
  return (
    <BaseCombobox.InputGroup data-slot="combobox-chips" className={classes("fui-input-group", "fui-combobox-field", className)} {...props}>
      <BaseCombobox.Chips className="fui-combobox-chips">{children}</BaseCombobox.Chips>
    </BaseCombobox.InputGroup>
  );
}

/** One chosen value, with the key that removes it (`showRemove={false}` leaves it out; `removeLabel` names it). */
export function ComboboxChip({
  className,
  children,
  showRemove = true,
  removeLabel = "Remove",
  ...props
}: StyledProps<BaseCombobox.Chip.Props> & { showRemove?: boolean; removeLabel?: string }) {
  return (
    <BaseCombobox.Chip data-slot="combobox-chip" className={classes("fui-combobox-chip", className)} {...props}>
      {children}
      {showRemove ? (
        <BaseCombobox.ChipRemove className="fui-combobox-chip-remove" aria-label={removeLabel}>
          <X aria-hidden />
        </BaseCombobox.ChipRemove>
      ) : null}
    </BaseCombobox.Chip>
  );
}

/** The input at the end of the chips. */
export function ComboboxChipsInput({ className, ...props }: StyledProps<BaseCombobox.Input.Props>) {
  return (
    <BaseCombobox.Input
      data-slot="combobox-chips-input"
      className={classes("fui-input", "fui-input-group-control", "fui-combobox-chips-input", className)}
      {...props}
    />
  );
}

/** A ref for the element a list should open under when that is not its own field: give it to the element and to `ComboboxContent anchor`. */
export function useComboboxAnchor() {
  return useRef<HTMLDivElement | null>(null);
}
