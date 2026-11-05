"use client";

import { useCallback, useEffect, useRef, type ReactNode, type Ref } from "react";
import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import { Monitor, Moon, Sun } from "lucide-react";
import { classes, type StyledProps } from "./shared";

/**
 * Keeps one indicator under the pressed item of a single-choice group and lets it slide when the choice changes (0.10). It
 * sets `--fui-toggle-x/y/w/h` on the group; with two or more pressed items (a multiple group) there is no indicator and each
 * pressed item paints its own fill, as before. The first placement does not animate.
 */
function useSlidingIndicator(ref?: Ref<HTMLDivElement>) {
  const node = useRef<HTMLDivElement | null>(null);
  const setNode = useCallback(
    (element: HTMLDivElement | null) => {
      node.current = element;
      if (typeof ref === "function") ref(element);
      else if (ref) ref.current = element;
    },
    [ref],
  );
  useEffect(() => {
    const group = node.current;
    if (!group) return;
    let frame = 0;
    const place = () => {
      const pressed = group.querySelectorAll<HTMLElement>(":scope > [data-pressed]");
      if (pressed.length !== 1) {
        delete group.dataset.indicator;
        return;
      }
      const item = pressed[0]!;
      group.style.setProperty("--fui-toggle-x", `${item.offsetLeft}px`);
      group.style.setProperty("--fui-toggle-y", `${item.offsetTop}px`);
      group.style.setProperty("--fui-toggle-w", `${item.offsetWidth}px`);
      group.style.setProperty("--fui-toggle-h", `${item.offsetHeight}px`);
      if (group.dataset.indicator === undefined) {
        group.dataset.indicator = "";
        const ready = () => {
          group.dataset.indicator = "ready";
        };
        if (typeof requestAnimationFrame === "function") frame = requestAnimationFrame(ready);
        else ready();
      }
    };
    place();
    const mutations = new MutationObserver(place);
    mutations.observe(group, { subtree: true, attributes: true, attributeFilter: ["data-pressed"], childList: true });
    // Test environments (jsdom) and old engines have no ResizeObserver: the indicator then follows choices, not resizes.
    const sizes = typeof ResizeObserver === "function" ? new ResizeObserver(place) : null;
    sizes?.observe(group);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      mutations.disconnect();
      sizes?.disconnect();
    };
  }, []);
  return setNode;
}

export function ToggleGroup({
  className,
  size = "default",
  ref,
  ...props
}: StyledProps<BaseToggleGroup.Props> & {
  /** `sm` 26 px, `default` 34 px, `lg` 44 px painted on every pointer (the large control height); `sm` and `default` are 44 px on touch and narrow screens. */
  size?: "default" | "sm" | "lg";
  ref?: Ref<HTMLDivElement>;
}) {
  const setNode = useSlidingIndicator(ref);
  return (
    <BaseToggleGroup
      data-slot="toggle-group"
      data-size={size}
      className={classes("fui-toggle-group", className)}
      ref={setNode}
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
