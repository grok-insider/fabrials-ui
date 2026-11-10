"use client";
// Multi-value filter. The closed summary (the placeholder, one name, or the first name and how many more) and the checkbox
// rows follow the Adobe Spectrum Picker with multiple selection: https://react-spectrum.adobe.com/react-spectrum/Picker.html
// Since 0.11 it is a Base UI Select with `multiple` (https://base-ui.com/react/components/select): a listbox the arrow keys,
// Home, End and typing move through, where Enter or Space ticks a row and the popup stays open. Not a copy of either
// library's markup.

import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronDown, X } from "lucide-react";
import { useLabels, useLocale } from "./labels";
import { formatCount } from "./plural";
import { classes } from "./shared";

export type MultiSelectOption = { value: string; label: string };

export type MultiSelectLabels = {
  /** The closed field with nothing chosen. */
  placeholder: string;
  /** What follows the first name for assistive technology: "and 2 more". The eye reads "+2". */
  more: (count: number, locale: Intl.LocalesArgument) => string;
  /** The clear key under the list, given the field's label. The English default lowercases the label ("Clear status"). */
  clear: (label: string) => string;
};

const MULTI_SELECT_LABELS: MultiSelectLabels = {
  placeholder: "Any",
  more: (count, locale) => `and ${formatCount(count, locale)} more`,
  clear: (label) => `Clear ${label.toLocaleLowerCase("en")}`,
};

export function MultiSelect({
  id,
  label,
  options,
  value,
  onValueChange,
  placeholder,
  disabled = false,
  labels: ownLabels,
  locale: ownLocale,
  className,
}: {
  id: string;
  label: string;
  options: readonly MultiSelectOption[];
  value: readonly string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  /** The words of the summary and the clear key. A `LabelsProvider` sets them for every field (scope `multiSelect`). */
  labels?: Partial<MultiSelectLabels>;
  /** The locale of the count beside the first name. */
  locale?: Intl.LocalesArgument;
  className?: string;
}) {
  const labels = useLabels("multiSelect", MULTI_SELECT_LABELS, ownLabels);
  const locale = useLocale(ownLocale);
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
            <span className="fui-multi-select-first">{names[0] ?? placeholder ?? labels.placeholder}</span>
            {more > 0 ? (
              <>
                <span aria-hidden="true" className="fui-multi-select-more">
                  +{formatCount(more, locale)}
                </span>
                <span className="fui-sr-only">{` ${labels.more(more, locale)}`}</span>
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
                    {labels.clear(label)}
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
