"use client";
// Origin: Fabrials, 0.12, from Radiant's composer controls: a pill that picks a model, an effort or a mode, with the value
// in its name, built on the library's Select so typeahead, the arrows and Escape come with it.

import type { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@fabrials/ui";

export type ComposerOption = {
  value: string;
  label: string;
  /** A second line under the label: what choosing it does ("Deeper reasoning, slower"). */
  hint?: string;
  icon?: ReactNode;
};

export type ComposerSelectLabels = {
  /** The pill's name, from what is being picked and its value: "Reasoning effort: High". */
  name?: (label: string, value: string) => string;
};

export type ComposerSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly ComposerOption[];
  /** What is being picked, in words: "Reasoning effort". The pill's name says it and the value: "Reasoning effort: High". */
  label: string;
  /** The mark before the value, on the pill and in every option that has none of its own. */
  icon?: ReactNode;
  /** The value that is usual: at it the pill is plain, away from it the pill is tinted as a pressed toggle is. Default: the
   * first option. */
  defaultValue?: string;
  disabled?: boolean;
  /** Open on first paint, with no one having pressed it: a bench, or a composer whose list is already out. */
  defaultOpen?: boolean;
  /** How the value reads on the pill. Default: the option's label. */
  formatValue?: (option: ComposerOption) => string;
  labels?: ComposerSelectLabels;
  /** The name of the value in a form. */
  name?: string;
  /** The id of the pill, for a label or a test. */
  id?: string;
  className?: string;
};

const joined = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ");

/**
 * A composer pill that picks one of a few: a model, a reasoning effort, a mode. It looks and measures like `ComposerToggle`,
 * but it opens a list instead of toggling, its accessible name says what is chosen now, and away from the usual value it
 * carries the pressed pill's tint. In a narrow composer the value folds away and the mark stays.
 */
export function ComposerSelect({
  value,
  onValueChange,
  options,
  label,
  icon,
  defaultValue,
  defaultOpen = false,
  disabled = false,
  formatValue,
  labels,
  name,
  id,
  className,
}: ComposerSelectProps) {
  const chosen = options.find((option) => option.value === value);
  const valueLabel = chosen ? (formatValue?.(chosen) ?? chosen.label) : value;
  const usual = defaultValue ?? options[0]?.value;
  const named = labels?.name?.(label, valueLabel) ?? `${label}: ${valueLabel}`;
  return (
    <Select
      defaultOpen={defaultOpen}
      disabled={disabled}
      name={name}
      onValueChange={(next) => {
        if (next !== null && next !== undefined) onValueChange(String(next));
      }}
      value={value}
    >
      <SelectTrigger
        aria-label={named}
        id={id}
        className={joined("fui-composer-pill", "fui-composer-select", className)}
        data-state={value === usual ? "off" : "on"}
        title={named}
      >
        {chosen?.icon ?? icon}
        <span className="fui-composer-select-value">{valueLabel}</span>
      </SelectTrigger>
      <SelectContent align="start" className="fui-composer-select-menu">
        {options.map((option) => {
          const mark = option.icon ?? icon;
          return (
            <SelectItem className="fui-composer-option" key={option.value} value={option.value}>
              {mark ? <span className="fui-composer-option-icon">{mark}</span> : null}
              <span className="fui-composer-option-text">
                <span className="fui-composer-option-label">{option.label}</span>
                {option.hint ? <span className="fui-composer-option-hint">{option.hint}</span> : null}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

export type ComposerMenuProps = {
  /** The pill's name. Without `text` it is also what a pointer sees on hover. */
  label: string;
  icon?: ReactNode;
  /** Words beside the mark. Without them the pill is the mark alone, as a "More" key is. */
  text?: ReactNode;
  /** The menu's own name, when the pill's is not enough: "More controls". */
  menuLabel?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  disabled?: boolean;
  /** Menu items: `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`, separators and labels. */
  children: ReactNode;
  className?: string;
};

/**
 * The same pill, opening a menu: checkbox and radio items for settings that stay, plain items for what happens once. The
 * pill is the trigger, so the menu opens with Enter, Space or the down arrow and closes with Escape, as every menu here.
 */
export function ComposerMenu({
  label,
  icon,
  text,
  menuLabel,
  align = "start",
  side = "top",
  disabled = false,
  children,
  className,
}: ComposerMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            aria-label={label}
            className={joined("fui-composer-pill", "fui-composer-menu", className)}
            data-icon-only={text ? undefined : true}
            disabled={disabled}
            title={text ? undefined : label}
            type="button"
          >
            {icon}
            {text ? <span>{text}</span> : null}
          </button>
        }
      />
      <DropdownMenuContent align={align} aria-label={menuLabel} side={side}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
