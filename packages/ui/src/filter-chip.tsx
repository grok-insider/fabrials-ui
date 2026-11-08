"use client";

import { useEffect, useRef, type ComponentProps, type ReactNode, type Ref } from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { X } from "lucide-react";
import { classes } from "./shared";

type FilterChipBase = {
  label: string;
  value: string;
  /** The accessible name of the clear key. `Clear <label> filter (<value>)` by default. */
  clearLabel?: string;
  /** On the chip; the other props go to its clear key. */
  className?: string;
};

export type FilterChipLinkProps = FilterChipBase &
  Omit<useRender.ComponentProps<"a">, "children" | "className"> & {
    href?: string;
    onRemove?: undefined;
  };

export type FilterChipButtonProps = FilterChipBase &
  Omit<ComponentProps<"button">, "children" | "className" | "onClick" | "type" | "value"> & {
    onRemove: () => void;
    href?: undefined;
    render?: undefined;
  };

export type FilterChipProps = FilterChipLinkProps | FilterChipButtonProps;

function defaultClearLabel(label: string, value: string) {
  return `Clear ${label.toLowerCase()} filter (${value})`;
}

function Chip({ label, value, className, leaving, chipRef, children }: {
  label: string;
  value: string;
  className?: string;
  leaving?: boolean;
  chipRef?: Ref<HTMLSpanElement>;
  children: ReactNode;
}) {
  return (
    <span className={classes("fui-filter-chip", className)} data-leaving={leaving || undefined} ref={chipRef}>
      <span className="fui-filter-chip-text" title={`${label}: ${value}`}>
        <span className="fui-filter-chip-label">{label}:</span>
        <span className="fui-filter-chip-value">{value}</span>
      </span>
      {children}
    </span>
  );
}

function FilterChipLink({ label, value, clearLabel, className, render, ...props }: FilterChipLinkProps) {
  const key = useRender({
    defaultTagName: "a",
    render,
    props: mergeProps<"a">(
      {
        className: "fui-filter-chip-remove",
        "aria-label": clearLabel ?? defaultClearLabel(label, value),
        children: <X aria-hidden />,
      },
      props,
    ),
  });
  return (
    <Chip className={className} label={label} value={value}>
      {key}
    </Chip>
  );
}

/** The clear key of the next chip in the same row (or list), else the previous one: where focus goes when a chip leaves. */
function neighbour(chip: HTMLElement) {
  const parent = chip.parentElement;
  const scope = parent?.tagName === "LI" ? parent.parentElement : parent;
  if (!scope) return null;
  const keys = [...scope.querySelectorAll<HTMLElement>(".fui-filter-chip:not([data-leaving]) > .fui-filter-chip-remove")];
  const at = keys.findIndex((key) => chip.contains(key));
  if (at < 0) return null;
  return keys[at + 1] ?? keys[at - 1] ?? null;
}

/** The exit length in ms, from the motion tokens: 0 under reduced motion (the tokens are 0 there) or without animations. */
function exitDuration(chip: HTMLElement) {
  if (typeof chip.animate !== "function" || typeof getComputedStyle !== "function") return 0;
  const token = getComputedStyle(chip).getPropertyValue("--fui-duration").trim();
  const length = Number.parseFloat(token) * (token.endsWith("ms") ? 1 : 1000);
  return Number.isFinite(length) ? length : 0;
}

function FilterChipButton({ label, value, clearLabel, className, onRemove, ...props }: FilterChipButtonProps) {
  const chip = useRef<HTMLSpanElement | null>(null);
  const mounted = useRef(true);
  const restore = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // The exit ends after a render or two: it calls the onRemove of the latest render, not of the one that was clicked.
  const latest = useRef(onRemove);
  useEffect(() => {
    latest.current = onRemove;
  });
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(restore.current);
    };
  }, []);
  const remove = () => {
    const node = chip.current;
    if (!node) return onRemove();
    if (node.dataset.leaving !== undefined) return;
    // Focus moves on to the next chip before this one goes, so a keyboard user keeps their place in the row.
    if (node.contains(document.activeElement)) neighbour(node)?.focus();
    const duration = exitDuration(node);
    if (!duration) return onRemove();
    node.dataset.leaving = "";
    const exit = node.animate([{ opacity: 1, scale: "1" }, { opacity: 0, scale: "0.9" }], {
      duration,
      easing: "cubic-bezier(0.3, 0, 1, 1)",
      fill: "forwards",
    });
    const finish = () => {
      if (!mounted.current) return;
      latest.current();
      // A host that keeps the filter (a navigation that was refused) gets its chip back.
      restore.current = setTimeout(() => {
        if (!mounted.current) return;
        exit.cancel();
        delete node.dataset.leaving;
      }, 1500);
    };
    exit.finished.then(finish, finish);
  };
  return (
    <Chip chipRef={chip} className={className} label={label} value={value}>
      <button
        type="button"
        className="fui-filter-chip-remove"
        aria-label={clearLabel ?? defaultClearLabel(label, value)}
        {...props}
        onClick={remove}
      >
        <X aria-hidden />
      </button>
    </Chip>
  );
}

/**
 * An active filter: its name and value, and a key that clears it. The key is a link (`href`, or `render` for a router link)
 * or a button (`onRemove`). A removed button chip fades out first, and focus moves on to the next chip in its row.
 */
export function FilterChip(props: FilterChipProps) {
  if (props.onRemove) return <FilterChipButton {...props} />;
  return <FilterChipLink {...(props as FilterChipLinkProps)} />;
}
