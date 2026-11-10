import type { ComponentProps } from "react";
import { AlertReveal, AlertRetry } from "./alert-live";
import { classes } from "./shared";

/** The tones a notice can be in. `danger` looks like `destructive`, `neutral` like `default`. */
export type AlertTone = "neutral" | "info" | "success" | "warning" | "danger";

/** The looks an alert has had since 0.4. A `tone` sets the same look under another name. */
export type AlertVariant = "default" | "info" | "success" | "warning" | "destructive";

export type AlertLabels = {
  /** The action that asks again. */
  retry: string;
  /** Said on the action while the retry is in flight. */
  retrying: string;
};

/** A tone is a variant under the name the rest of 0.12 uses for status. */
const TONE_LOOK: Record<AlertTone, AlertVariant> = {
  neutral: "default",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "destructive",
};

export type AlertProps = ComponentProps<"div"> & {
  variant?: AlertVariant;
  /** The same looks under `neutral`…`danger`. When both are given, `tone` wins. */
  tone?: AlertTone;
  /**
   * The action that asks again, drawn in the alert's action place. A promise from it keeps the action busy until it settles
   * (and ignores a second press meanwhile); a retry that cannot help — a daily allowance already spent — gets no `onRetry`.
   */
  onRetry?: () => void | Promise<void>;
  /** The busy state, when the host owns it (`onRetry` returning a promise shows it by itself). */
  retrying?: boolean;
  /**
   * The alert appeared after the first paint (an answer came back, a step failed) and scrolls itself into view, keeping clear
   * of a sticky header above it and of an `ActionBar` below.
   */
  revealOnMount?: boolean;
  /** The words of the retry action. A `LabelsProvider` sets them for every alert (scope `alert`). */
  labels?: Partial<AlertLabels>;
  /**
   * `inline` is a slim notice for the top of a page or a pane: from a width of 48rem the title and the description share
   * one line and the action sits at the end; narrower it stacks like the default. It measures its own width, so it fills
   * its container (give it `flex: 1` in a flex row). Not for status that refreshes periodically: a notice is a one-off.
   */
  layout?: "stacked" | "inline";
};

export function Alert({
  className,
  variant,
  tone,
  layout = "stacked",
  onRetry,
  retrying,
  revealOnMount,
  labels,
  children,
  ...props
}: AlertProps) {
  const look = tone ? TONE_LOOK[tone] : (variant ?? "default");
  const action = onRetry ? <AlertRetry labels={labels} onRetry={onRetry} retrying={retrying} /> : null;
  return (
    <div
      role={look === "destructive" ? "alert" : "status"}
      data-slot="alert"
      data-variant={look}
      {...(tone ? { "data-tone": tone } : null)}
      data-layout={layout === "inline" ? "inline" : undefined}
      data-reveal={revealOnMount || undefined}
      className={classes("fui-alert", className)}
      {...props}
    >
      {layout === "inline" ? (
        <div className="fui-alert-body">
          {children}
          {action}
        </div>
      ) : (
        <>
          {children}
          {action}
        </>
      )}
      {revealOnMount ? <AlertReveal /> : null}
    </div>
  );
}

export function AlertTitle({ className, ...props }: ComponentProps<"div">) {
  return <div className={classes("fui-alert-title", className)} {...props} />;
}

export function AlertDescription({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={classes("fui-description", "fui-alert-description", className)}
      {...props}
    />
  );
}

export function AlertAction({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={classes("fui-actions", "fui-alert-action", className)}
      {...props}
    />
  );
}
