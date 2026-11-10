"use client";
// Origin: Fabrials, 0.12 (from Radiant's features/core/study-chips.tsx: the follow-ups it offered under a long answer).

import { useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { useArrivals } from "./agent";

export type SuggestionItem = {
  id: string;
  /** What the chip says. */
  label: string;
  /** What the host sends when it is chosen; the label when there is none. */
  value?: string;
  /** The language of the label, when it is not the page's. */
  lang?: string;
};

export type SuggestionChipsLabels = {
  /** What a screen reader hears after the chips were added, when the group changes. */
  added?: (count: number) => string;
};

export type SuggestionChipsProps = {
  items: readonly SuggestionItem[];
  /** Called once with the chosen item; a press on a disabled group does nothing. */
  onSelect: (item: SuggestionItem) => void;
  disabled?: boolean;
  /** The group's name. */
  label?: string;
  labels?: SuggestionChipsLabels;
  className?: string;
  /** Drawn before each chip's label, for a host that gives them icons. */
  icon?: (item: SuggestionItem) => ReactNode;
};

/**
 * The follow-ups offered under an answer: a wrapping row of soft tags that are buttons, one tab stop with the arrow keys
 * between them, Home and End at the ends, and a rise into place for the chips that arrive after the answer is shown.
 */
export function SuggestionChips({ items, onSelect, disabled = false, label = "Follow-ups", labels, className, icon }: SuggestionChipsProps) {
  const [active, setActive] = useState(0);
  const row = useRef<HTMLDivElement | null>(null);
  const stagger = useArrivals(items.map((item) => item.id));
  const index = Math.min(active, Math.max(0, items.length - 1));
  const focusAt = (next: number) => {
    const buttons = row.current?.querySelectorAll<HTMLButtonElement>("[data-slot='suggestion-chip']");
    if (!buttons?.length) return;
    const target = ((next % buttons.length) + buttons.length) % buttons.length;
    setActive(target);
    buttons[target]?.focus();
  };
  const keydown = (event: KeyboardEvent<HTMLDivElement>) => {
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const step = (rtl ? -1 : 1) as 1 | -1;
    if (event.key === "ArrowRight") focusAt(index + step);
    else if (event.key === "ArrowLeft") focusAt(index - step);
    else if (event.key === "Home") focusAt(0);
    else if (event.key === "End") focusAt(items.length - 1);
    else return;
    event.preventDefault();
  };
  if (!items.length) return null;
  return (
    <div
      aria-label={label}
      className={["fui-suggestion-chips", className].filter(Boolean).join(" ")}
      data-slot="suggestion-chips"
      onKeyDown={keydown}
      ref={row}
      role="group"
    >
      {items.map((item, position) => {
        const arriving = stagger.get(item.id);
        return (
          <button
            className={arriving === undefined ? "fui-suggestion-chip" : "fui-suggestion-chip fui-rise"}
            data-slot="suggestion-chip"
            dir="auto"
            disabled={disabled}
            key={item.id}
            lang={item.lang}
            onClick={() => {
              if (disabled) return;
              setActive(position);
              onSelect(item);
            }}
            onFocus={() => setActive(position)}
            style={arriving === undefined ? undefined : ({ "--fui-stagger": arriving } as CSSProperties)}
            tabIndex={position === index ? 0 : -1}
            type="button"
          >
            {icon?.(item)}
            <span className="fui-suggestion-chip-label">{item.label}</span>
          </button>
        );
      })}
      <span className="fui-sr-only" role="status">
        {labels?.added?.(items.length) ?? ""}
      </span>
    </div>
  );
}
