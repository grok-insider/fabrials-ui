"use client";

import type { ReactNode } from "react";
import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import { Monitor, Moon, Sun } from "lucide-react";
import { classes, type StyledProps } from "./shared";

export function ToggleGroup({
  className,
  size = "default",
  ...props
}: StyledProps<BaseToggleGroup.Props> & {
  /** `sm` 26 px, `default` 34 px, `lg` 44 px painted on every pointer (the large control height); `sm` and `default` are 44 px on touch and narrow screens. */
  size?: "default" | "sm" | "lg";
}) {
  return (
    <BaseToggleGroup
      data-slot="toggle-group"
      data-size={size}
      className={classes("fui-toggle-group", className)}
      {...props}
    />
  );
}

export function ToggleGroupItem({
  className,
  ...props
}: StyledProps<BaseToggle.Props>) {
  return (
    <BaseToggle
      data-slot="toggle-group-item"
      className={classes("fui-toggle", className)}
      {...props}
    />
  );
}

export type ThemePreference = "system" | "light" | "dark";

const themeOptions: Array<{ value: ThemePreference; icon: typeof Sun }> = [
  { value: "system", icon: Monitor },
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
];

/**
 * Presentational theme choice. The host owns persistence and applies `.dark`.
 */
export function ThemeSwitcher({
  value,
  onValueChange,
  labels = { system: "System", light: "Light", dark: "Dark" },
  showLabels = false,
  label = "Theme",
  size = "sm",
  className,
}: {
  value: ThemePreference;
  onValueChange: (value: ThemePreference) => void;
  labels?: Record<ThemePreference, ReactNode>;
  showLabels?: boolean;
  label?: string;
  /** As `ToggleGroup`; `lg` paints 44 px on every pointer, for a row of primary 44 px targets. */
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  return (
    <ToggleGroup
      aria-label={label}
      size={size}
      value={[value]}
      onValueChange={(next) => {
        const selected = next[0] as ThemePreference | undefined;
        if (selected) onValueChange(selected);
      }}
      className={classes("fui-theme-switcher", className)}
      data-labels={showLabels || undefined}
    >
      {themeOptions.map(({ value: option, icon: Icon }) => (
        <ToggleGroupItem
          key={option}
          value={option}
          aria-label={showLabels ? undefined : String(labels[option])}
          title={showLabels ? undefined : String(labels[option])}
        >
          <Icon aria-hidden />
          {showLabels ? <span>{labels[option]}</span> : null}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
