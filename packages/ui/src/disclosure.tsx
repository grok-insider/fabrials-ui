// Origin: Fabrials, 0.8. A styled native disclosure: no JavaScript, the panel is always in the DOM.
import type { ComponentProps, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { classes } from "./shared";

/**
 * A native `details` element. It opens and closes with Enter and Space on its summary without any script, is
 * server-rendered exactly as it hydrates, keeps its panel mounted (form values, a search and the browser's
 * find-in-page all see closed content) and takes `open`, `onToggle` and `name` (an exclusive group) as usual.
 *
 * When a field inside a closed disclosure fails validation the disclosure opens itself, so the browser can
 * focus the field and show its message instead of failing silently; turn it off with `revealInvalid={false}`.
 */
export function Disclosure({
  className,
  revealInvalid = true,
  onInvalidCapture,
  ...props
}: ComponentProps<"details"> & { revealInvalid?: boolean }) {
  return (
    <details
      data-slot="disclosure"
      className={classes("fui-disclosure", className)}
      onInvalidCapture={(event) => {
        onInvalidCapture?.(event);
        if (revealInvalid && !event.currentTarget.open) event.currentTarget.open = true;
      }}
      {...props}
    />
  );
}

/**
 * The always-visible line of a `Disclosure`, a target of at least 44 px (`size="sm"` paints a quiet 13 px line
 * and extends the target invisibly). `count` sits after the label inside the summary, so it is part of the
 * control's name and a screen reader reads "Conversation 12". `chevron="end"` (default) turns from down to up
 * when open; `"start"` points to the inline end when closed and down when open; `"none"` leaves the chevron out.
 */
export function DisclosureSummary({
  className,
  children,
  count,
  chevron = "end",
  size = "md",
  ...props
}: ComponentProps<"summary"> & {
  count?: ReactNode;
  chevron?: "end" | "start" | "none";
  size?: "sm" | "md" | "lg";
}) {
  const icon = <ChevronDown aria-hidden className="fui-disclosure-chevron" />;
  return (
    <summary
      data-slot="disclosure-summary"
      data-size={size}
      data-chevron={chevron}
      className={classes("fui-disclosure-summary", className)}
      {...props}
    >
      {chevron === "start" ? icon : null}
      <span className="fui-disclosure-label">{children}</span>
      {count != null && count !== false ? <span className="fui-disclosure-count">{count}</span> : null}
      {chevron === "end" ? icon : null}
    </summary>
  );
}

/** The content of a `Disclosure`, with the house spacing under the summary. */
export function DisclosurePanel({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="disclosure-panel" className={classes("fui-disclosure-panel", className)} {...props} />;
}
