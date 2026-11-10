"use client";

import { useEffect, useRef, type ComponentProps, type CSSProperties, type RefObject } from "react";
import { useRender } from "@base-ui/react/use-render";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { useLabels } from "./labels";
import { classes, type StyledProps } from "./shared";
import { prefersReducedMotion } from "./reduced-motion";
import { useOverflowTabStop } from "./use-overflow";
import { tabsListVariants, type BadgeSize, type BadgeTone, type BadgeVariant } from "./variants";

export { badgeVariants, tabsListVariants, type BadgeSize, type BadgeTone, type BadgeVariant } from "./variants";

export { Alert, AlertAction, AlertDescription, AlertTitle } from "./alert";
export { Card, CardAction, CardCaption, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";
export { Separator } from "./separator";
export { Skeleton } from "./skeleton";

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

export type BadgeProps = ComponentProps<"span"> & {
  tone?: BadgeTone;
  variant?: BadgeVariant;
  /** `sm` 18 px for a dense row, `default` 20 px, `lg` 24 px beside a heading or in a card's header (0.11). */
  size?: BadgeSize;
  /** Adds a leading status dot; the text remains the accessible meaning. `"hollow"` is an outline dot (an archived or inactive item). */
  dot?: boolean | "hollow";
  /** The dot ripples while the state is live (syncing, recording), and stops when it is not (0.11). Still under reduced motion. */
  pulse?: boolean;
  /**
   * Colours the dot only, with any CSS colour (`var(--label-tone)`); it sets `--fui-badge-dot`. To colour the tag itself
   * (tint, hairline and dot) from data, set `--fui-badge-solid` on the badge itself (a class or `style`); `--fui-badge-ink`
   * is the text colour, set the same way. Both are public properties, and the tone attribute only sets their defaults.
   * (`--fui-badge-dot` is not declared on the badge, so it also works from an ancestor.)
   */
  dotColor?: string;
  /**
   * The tag shrinks to its container and cuts long text with an ellipsis (the full text goes to `title` when it is a
   * string and no title is given). `--fui-badge-max` caps the width (default: 100% of the container).
   */
  truncate?: boolean;
  /**
   * Renders the tag as another element, a link (`<a href>`, a router link) or a button: it then takes the pointer, deepens
   * its tint under it and shows the focus ring (0.11).
   */
  render?: useRender.RenderProp;
};

/** A number on its own (3, 12, 1,204, 99+) is a count: it sits centred in a tag at least as wide as it is tall. */
const COUNT = /^[+-]?\d[\d\s.,]*\+?$/;

function badgeParts({
  className,
  tone = "neutral",
  variant = "soft",
  size = "default",
  dot = false,
  pulse = false,
  dotColor,
  truncate = false,
  style,
  title,
  children,
  ...props
}: Omit<BadgeProps, "render">) {
  const count = typeof children === "number" || (typeof children === "string" && COUNT.test(children.trim()));
  const attributes = {
    "data-slot": "badge",
    className: classes("fui-badge", className),
    "data-tone": tone === "accent" ? "info" : tone,
    "data-variant": variant,
    "data-size": size === "default" ? undefined : size,
    "data-count": count || undefined,
    "data-truncate": truncate || undefined,
    title: title ?? (truncate && typeof children === "string" ? children : undefined),
    style: dotColor ? ({ "--fui-badge-dot": dotColor, ...style } as CSSProperties) : style,
    ...props,
  };
  const dotMark = dot ? <span aria-hidden className="fui-badge-dot" data-hollow={dot === "hollow" || undefined} data-pulse={pulse || undefined} /> : null;
  const words = truncate ? <span className="fui-badge-text">{children}</span> : children;
  return { attributes, dotMark, words };
}

function RenderedBadge({ render, ...props }: BadgeProps & { render: useRender.RenderProp }) {
  const { attributes, dotMark, words } = badgeParts(props);
  // The words carry the tag's type in their own span: a host reset that is not in a cascade layer (button { font: inherit })
  // reaches the button or link itself, never the span inside it.
  const children = (
    <>
      {dotMark}
      <span className="fui-badge-label">{words}</span>
    </>
  );
  return useRender({ defaultTagName: "span", render, props: { ...attributes, children } });
}

export function Badge({ render, ...props }: BadgeProps) {
  if (render) return <RenderedBadge render={render} {...props} />;
  const { attributes, dotMark, words } = badgeParts(props);
  return (
    <span {...attributes}>
      {dotMark}
      {words}
    </span>
  );
}

export type TableLabels = {
  /** The name of the scroll region round a table, given the table's own `aria-label` when it has one. */
  region: (name?: string) => string;
};

const TABLE_LABELS: TableLabels = {
  region: (name) => (name ? `${name} table` : "Scrollable table"),
};

function useRegionLabel(regionLabel: string | undefined, name: unknown) {
  const labels = useLabels("table", TABLE_LABELS);
  return regionLabel ?? labels.region(typeof name === "string" ? name : undefined);
}

export function Table({
  className,
  children,
  regionLabel,
  stickyHeader = false,
  ...props
}: ComponentProps<"table"> & { regionLabel?: string; stickyHeader?: boolean }) {
  const region = useRef<HTMLDivElement | null>(null);
  const tabStop = useOverflowTabStop(region);
  return (
    <div
      ref={region}
      className="fui-table-scroll"
      data-sticky-header={stickyHeader || undefined}
      tabIndex={tabStop}
      role="region"
      aria-label={useRegionLabel(regionLabel, props["aria-label"])}
    >
      <table className={classes("fui-table", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

/**
 * The tabs root. Horizontal tabs need no layout of their own; with `orientation="vertical"` the list sits beside
 * the panel (a rail: `TabsList` styles itself for it) and the panel takes the rest.
 */
export function Tabs({ className, ...props }: StyledProps<BaseTabs.Root.Props>) {
  return <BaseTabs.Root data-slot="tabs" className={classes("fui-tabs", className)} {...props} />;
}

export function TableHeader(props: ComponentProps<"thead">) {
  return <thead {...props} />;
}
export function TableBody(props: ComponentProps<"tbody">) {
  return <tbody {...props} />;
}
export function TableFooter(props: ComponentProps<"tfoot">) {
  return <tfoot {...props} />;
}
export function TableRow(props: ComponentProps<"tr">) {
  return <tr {...props} />;
}
export function TableHead({
  numeric,
  ...props
}: ComponentProps<"th"> & { numeric?: boolean }) {
  return <th scope="col" data-numeric={numeric || undefined} {...props} />;
}
export function TableCell({
  numeric,
  ...props
}: ComponentProps<"td"> & { numeric?: boolean }) {
  return <td data-numeric={numeric || undefined} {...props} />;
}
export function TableCaption(props: ComponentProps<"caption">) {
  return <caption {...props} />;
}

/** Keeps the selected tab of a scrolling list in view: when it is (partly) out of the list's box, the list scrolls its OWN box until the tab is centred. Never scrolls the page or a dialog, works in RTL, and only acts when the selection changes (or on mount), so it never fights a manual scroll. */
function useRevealSelectedTab(ref: RefObject<HTMLDivElement | null>, enabled: boolean) {
  useEffect(() => {
    const list = ref.current;
    if (!enabled || !list) return;
    const reveal = () => {
      const tab = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
      if (!tab) return;
      const box = list.getBoundingClientRect();
      const at = tab.getBoundingClientRect();
      if (at.left >= box.left + 8 && at.right <= box.right - 8) return;
      const reduce = prefersReducedMotion();
      // Physical geometry, so the same delta is right in left-to-right and right-to-left lists.
      list.scrollBy({ left: at.left + at.width / 2 - (box.left + box.width / 2), behavior: reduce ? "auto" : "smooth" });
    };
    const frame = requestAnimationFrame(reveal);
    const observer = new MutationObserver(reveal);
    observer.observe(list, { attributes: true, attributeFilter: ["aria-selected"], subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [ref, enabled]);
}

export function TabsList({
  className,
  variant = "underline",
  scrollable = false,
  ref,
  ...props
}: StyledProps<BaseTabs.List.Props> & {
  variant?: "underline" | "segmented";
  /**
   * One line that scrolls sideways instead of wrapping: no scrollbar, snap to the tabs, and the selected tab is kept
   * in view. `true` always; `"narrow"` only below 48rem of viewport (wraps above it, for a few tabs on a wide screen).
   */
  scrollable?: boolean | "narrow";
}) {
  const own = useRef<HTMLDivElement | null>(null);
  useRevealSelectedTab(own, scrollable !== false);
  const setRef = (node: HTMLDivElement | null) => {
    own.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
  };
  return (
    <BaseTabs.List
      data-variant={variant}
      data-scrollable={scrollable === false ? undefined : scrollable === true ? "always" : scrollable}
      className={tabsListVariants({ variant, className })}
      ref={setRef}
      {...props}
    >
      {props.children}
      {variant === "segmented" ? (
        <BaseTabs.Indicator className="fui-tabs-plate" />
      ) : (
        <BaseTabs.Indicator className="fui-tabs-indicator" />
      )}
    </BaseTabs.List>
  );
}

export function TabsTrigger({
  className,
  ...props
}: StyledProps<BaseTabs.Tab.Props>) {
  return <BaseTabs.Tab className={classes("fui-tab", className)} {...props} />;
}

export function TabsContent({
  className,
  ...props
}: StyledProps<BaseTabs.Panel.Props>) {
  return (
    <BaseTabs.Panel
      className={classes("fui-tab-panel", className)}
      {...props}
    />
  );
}
