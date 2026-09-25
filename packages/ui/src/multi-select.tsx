"use client";
// Multi-value filter. The closed summary ("Any", one name, or "N selected") and
// the checkbox menu follow the Adobe Spectrum Picker with multiple selection:
// https://react-spectrum.adobe.com/react-spectrum/Picker.html
// The popup is Base UI Popover (https://base-ui.com/react/components/popover).
// This is not a copy of either library's markup.

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { NativeCheckbox } from "./controls";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
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
  const selected = new Set(value);
  const summary = summaryLabel(options, value, placeholder);
  const toggle = (option: string) => {
    onValueChange(selected.has(option) ? value.filter((item) => item !== option) : [...value, option]);
  };

  return (
    <div className={classes("fui-multi-select", className)}>
      <span className="fui-multi-select-label" id={labelId}>
        {label}
      </span>
      <Popover>
        <PopoverTrigger
          aria-labelledby={labelId}
          className="fui-input fui-select-trigger fui-multi-select-trigger"
          disabled={disabled || options.length === 0}
          id={id}
        >
          <span>{options.length === 0 ? placeholder : summary}</span>
          <ChevronDown aria-hidden size={16} />
        </PopoverTrigger>
        <PopoverContent align="start" className="fui-multi-select-popup">
          <div aria-labelledby={labelId} className="fui-multi-select-menu" role="group">
            {options.map((option) => (
              <label className="fui-multi-select-option" key={option.value}>
                <NativeCheckbox checked={selected.has(option.value)} onChange={() => toggle(option.value)} />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          {value.length > 0 ? (
            <button className="fui-multi-select-clear" onClick={() => onValueChange([])} type="button">
              Clear {label.toLocaleLowerCase()}
            </button>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}

function summaryLabel(options: readonly MultiSelectOption[], value: readonly string[], placeholder: string): string {
  if (value.length === 0) return placeholder;
  if (value.length === 1) return options.find((option) => option.value === value[0])?.label ?? value[0];
  return `${value.length} selected`;
}
