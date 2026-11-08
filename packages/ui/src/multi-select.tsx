"use client";
// Multi-value filter. The closed summary (the placeholder, one name, or the first name and how many more) and the checkbox
// rows follow the Adobe Spectrum Picker with multiple selection: https://react-spectrum.adobe.com/react-spectrum/Picker.html
// Since 0.11 it is a Base UI Select with `multiple` (https://base-ui.com/react/components/select): a listbox the arrow keys,
// Home, End and typing move through, where Enter or Space ticks a row and the popup stays open. Not a copy of either
// library's markup.

import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronDown, X } from "lucide-react";
import { classes } from "./shared";

export type MultiSelectOption = { value: string; label: string };

export function MultiSelect({
  id,
  label,
  options,
  value,
  onValueChange,
  placeholder = "Any",
  disabled = false,
  className,
}: {
  id: string;
  label: string;
  options: readonly MultiSelectOption[];
  value: readonly string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const labelId = `${id}-label`;
  const chosen = options.filter((option) => value.includes(option.value));
  const unknown = value.filter((item) => !options.some((option) => option.value === item));
  const names = [...chosen.map((option) => option.label), ...unknown];
  const more = names.length - 1;

  return (
    <div className={classes("fui-multi-select", className)}>
      <span className="fui-multi-select-label" id={labelId}>
        {label}
      </span>
      <BaseSelect.Root
        multiple
        value={value}
        onValueChange={(next) => onValueChange([...(next as string[])])}
        disabled={disabled || options.length === 0}
      >
        <BaseSelect.Trigger
          aria-labelledby={labelId}
          className="fui-input fui-select-trigger fui-multi-select-trigger"
          data-placeholder={names.length === 0 ? "" : undefined}
          id={id}
        >
          <span className="fui-multi-select-summary">
            <span className="fui-multi-select-first">{names[0] ?? placeholder}</span>
            {more > 0 ? (
              <>
                <span aria-hidden="true" className="fui-multi-select-more">
                  +{more}
                </span>
                <span className="fui-sr-only">{` and ${more} more`}</span>
              </>
            ) : null}
          </span>
          <BaseSelect.Icon className="fui-multi-select-icon">
            <ChevronDown aria-hidden size={16} />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner align="start" alignItemWithTrigger={false} className="fui-positioner" sideOffset={6}>
            <BaseSelect.Popup className="fui-menu fui-multi-select-popup">
              <BaseSelect.List aria-labelledby={labelId} className="fui-multi-select-list">
                {options.map((option) => {
                  const ticked = value.includes(option.value);
                  return (
                    <BaseSelect.Item className="fui-menu-item fui-multi-select-item" key={option.value} value={option.value}>
                      <span aria-hidden="true" className="fui-checkbox fui-multi-select-box" data-checked={ticked || undefined}>
                        {ticked ? (
                          <span className="fui-control-indicator">
                            <Check aria-hidden size={12} strokeWidth={3} />
                          </span>
                        ) : null}
                      </span>
                      <BaseSelect.ItemText className="fui-multi-select-name">{option.label}</BaseSelect.ItemText>
                    </BaseSelect.Item>
                  );
                })}
              </BaseSelect.List>
              {value.length > 0 ? (
                <div className="fui-multi-select-footer">
                  <button className="fui-multi-select-clear" onClick={() => onValueChange([])} type="button">
                    <X aria-hidden size={14} />
                    Clear {label.toLocaleLowerCase()}
                  </button>
                </div>
              ) : null}
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </div>
  );
}
