"use client";

import { useCallback, useEffect, useRef, type ReactNode, type Ref } from "react";
import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import { Monitor, Moon, Sun } from "lucide-react";
import { canonicalSize } from "./canonical-size";
import { useLabels } from "./labels";
import { classes, type StyledProps } from "./shared";
import { toggleVariants, type ToggleSize, type ToggleVariant } from "./variants";

export { toggleVariants, type ToggleSize, type ToggleVariant } from "./variants";

/**
 * Keeps one indicator under the pressed item of a single-choice group and lets it slide when the choice changes (0.10). It
 * sets `--fui-toggle-x/r/y/w/h` on the group (the item's left, right, top, width and height inside it); with two or more
 * pressed items (a multiple group) there is no indicator and each pressed item paints its own fill, as before. The first
 * placement does not animate; after it, `data-direction` (left or right) says which way the last move went, so the leading
 * edge can go first (0.11).
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
    let last: { item: HTMLElement; left: number } | undefined;
    const place = () => {
      const pressed = group.querySelectorAll<HTMLElement>(":scope > [data-pressed]");
      if (pressed.length !== 1) {
        delete group.dataset.indicator;
        last = undefined;
        return;
      }
      const item = pressed[0]!;
      const left = item.offsetLeft;
      // A new choice sets the direction; the same choice measured again (fonts, a resize) does not.
      if (last && last.item !== item) group.dataset.direction = left > last.left ? "right" : "left";
      last = { item, left };
      group.style.setProperty("--fui-toggle-x", `${left}px`);
      group.style.setProperty("--fui-toggle-r", `${group.clientWidth - left - item.offsetWidth}px`);
      group.style.setProperty("--fui-toggle-y", `${item.offsetTop}px`);
      group.style.setProperty("--fui-toggle-w", `${item.offsetWidth}px`);
      group.style.setProperty("--fui-toggle-h", `${item.offsetHeight}px`);
      // Ready a frame after the first placement. Checked against "ready", not set once: an effect that runs twice (React's
      // strict mode) cancels the first frame, and the indicator would otherwise never slide.
      if (group.dataset.indicator !== "ready") {
        group.dataset.indicator = "";
        const ready = () => {
          group.dataset.indicator = "ready";
        };
        if (typeof requestAnimationFrame === "function") {
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(ready);
        } else ready();
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
  /** `sm` 26 px, `default` 34 px, `lg` 44 px painted on every pointer (the large control height); `sm` and `default` are 44 px on touch and narrow screens. `md` is `default`. */
  size?: "default" | "md" | "sm" | "lg";
  ref?: Ref<HTMLDivElement>;
}) {
  const setNode = useSlidingIndicator(ref);
  return (
    <BaseToggleGroup
      data-slot="toggle-group"
      data-size={canonicalSize(size, "default")}
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

export type ToggleProps = StyledProps<BaseToggle.Props> & {
  /** `default` sits on the page as a control; `outline` draws only its hairline; `plain` has no look of its own. */
  variant?: ToggleVariant;
  /** `sm` 26 px, `default` 34 px, `lg` 44 px on every pointer. */
  size?: ToggleSize;
};

/**
 * One key that stays on, on its own: the look of a `ToggleGroupItem` for a screen that has only one mode to switch. Its
 * state is `pressed` (or `defaultPressed` when the host does not hold it) and a screen reader hears "pressed"; inside a
 * `ToggleGroup` use `ToggleGroupItem`, which takes its value from the group. `variant="plain"` keeps none of the look, for
 * a key that is a mode inside something else (the composer's pills are one).
 */
export function Toggle({ className, variant = "default", size = "default", ...props }: ToggleProps) {
  return <BaseToggle data-slot="toggle" className={toggleVariants({ variant, size, className })} {...props} />;
}

export type ThemePreference = "system" | "light" | "dark";

const THEME_LABELS: Record<ThemePreference, ReactNode> = { system: "System", light: "Light", dark: "Dark" };

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
  labels: ownLabels,
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
  /** As `ToggleGroup`; `lg` paints 44 px on every pointer, for a row of primary 44 px targets. `md` is `default`. */
  size?: "default" | "md" | "sm" | "lg";
  className?: string;
}) {
  const labels = useLabels("themeSwitcher", THEME_LABELS, ownLabels);
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
