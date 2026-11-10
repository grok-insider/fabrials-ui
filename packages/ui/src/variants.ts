// The class names of a control, for the places that cannot render one: a link that is a tag, a cell that is a key. No hooks
// and no directive, so a Server Component can call them; `@fabrials/ui/button-variants` is the same idea for `Button`.

import { classes } from "./shared";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger" | "accent";
export type BadgeVariant = "soft" | "outline" | "solid";
export type BadgeSize = "sm" | "default" | "lg";

export type BadgeVariantProps = {
  /** `neutral` (default), `info`, `success`, `warning`, `danger`, or `accent` for the brand's own. */
  tone?: BadgeTone;
  /** `soft` (default), `outline`, or `solid`. */
  variant?: BadgeVariant;
  /** `sm` 18 px, `default` 20 px, `lg` 24 px. */
  size?: BadgeSize;
  className?: string;
};

/**
 * What a `Badge` looks like, as classes: for a link, a button or a table cell that has to be a tag but cannot be a `Badge`.
 * The dot, the truncation and a count's centred width are the component's own (they read its props), so a tag that needs
 * them is a `Badge` with `render`.
 */
export function badgeVariants({ tone = "neutral", variant = "soft", size = "default", className }: BadgeVariantProps = {}) {
  return classes("fui-badge", `fui-badge-tone-${tone}`, `fui-badge-${variant}`, size === "default" ? undefined : `fui-badge-size-${size}`, className);
}

export type TabsListVariant = "underline" | "segmented";

export type TabsListVariantProps = {
  /** `underline` (default) or `segmented`, a raised plate under the current tab. */
  variant?: TabsListVariant;
  className?: string;
};

/** What a `TabsList` looks like, as classes, for a strip of tabs a host draws itself. */
export function tabsListVariants({ variant = "underline", className }: TabsListVariantProps = {}) {
  return classes("fui-tabs-list", variant === "segmented" ? "fui-tabs-list-segmented" : undefined, className);
}

export type ToggleVariant = "default" | "outline" | "plain";
export type ToggleSize = "default" | "sm" | "lg";

export type ToggleVariantProps = {
  /** `default` sits on the page as a control; `outline` draws only its hairline; `plain` has no look of its own. */
  variant?: ToggleVariant;
  /** `sm` 26 px, `default` 34 px, `lg` 44 px on every pointer. */
  size?: ToggleSize;
  className?: string;
};

/**
 * What a `Toggle` looks like, as classes, for a pressed key a host draws itself. `plain` keeps none of them, for a key that
 * is a mode inside something else: the host's `className` is then its whole look.
 */
export function toggleVariants({ variant = "default", size = "default", className }: ToggleVariantProps = {}) {
  if (variant === "plain") return classes(className);
  return classes("fui-toggle", `fui-toggle-${variant}`, size === "default" ? undefined : `fui-toggle-size-${size}`, className);
}
