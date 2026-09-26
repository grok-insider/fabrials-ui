"use client";

import type { ComponentProps } from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { X } from "lucide-react";
import { classes } from "./shared";

type FilterChipBase = {
  label: string;
  value: string;
  clearLabel?: string;
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

function FilterChipContent({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="fui-filter-chip-label">{label}:</span>
      <span className="fui-filter-chip-value">{value}</span>
      <X aria-hidden className="fui-filter-chip-icon" />
    </>
  );
}

function FilterChipLink({ label, value, clearLabel, className, render, ...props }: FilterChipLinkProps) {
  return useRender({
    defaultTagName: "a",
    render,
    props: mergeProps<"a">(
      {
        className: classes("fui-filter-chip", className),
        "aria-label": clearLabel ?? defaultClearLabel(label, value),
        children: <FilterChipContent label={label} value={value} />,
      },
      props,
    ),
  });
}

function FilterChipButton({ label, value, clearLabel, className, onRemove, ...props }: FilterChipButtonProps) {
  return (
    <button
      type="button"
      className={classes("fui-filter-chip", className)}
      aria-label={clearLabel ?? defaultClearLabel(label, value)}
      {...props}
      onClick={onRemove}
    >
      <FilterChipContent label={label} value={value} />
    </button>
  );
}

export function FilterChip(props: FilterChipProps) {
  if (props.onRemove) return <FilterChipButton {...props} />;
  return <FilterChipLink {...(props as FilterChipLinkProps)} />;
}
