"use client";
// Origin: Radiant's missing page, route error and history back button (the behaviour only). 0.12.

import type { ComponentProps, MouseEvent, ReactNode } from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { ArrowLeft, RotateCcw } from "lucide-react";
import type { ButtonStyleProps } from "./button-variants";
import { Button } from "./controls";
import { StatePanel, type StatePanelProps } from "./patterns";
import { classes } from "./shared";
import { CopyButton } from "./snippet";

export type StatePageProps = Omit<ComponentProps<"main">, "title"> & {
  /** The page's landmark. A host that already renders a `<main>` passes `"div"`. */
  as?: "main" | "div" | "section";
  /** The product's mark as a link home, at the top start. */
  brand?: ReactNode;
  /** A short reading above the title: "404", "Offline". */
  code?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  headingLevel?: 1 | 2 | 3;
  /** `start` anchors the content to the page gutter, as every page; `center` is for a product that centres its states. */
  align?: "start" | "center";
};

/**
 * A whole-page state outside the app shell: not found, gone, a root error, offline. It fills the viewport, keeps clear of
 * the device's safe areas, and sets the content in the upper third, anchored to the page gutter.
 */
export function StatePage({
  as = "main",
  brand,
  code,
  title,
  description,
  actions,
  headingLevel = 1,
  align = "start",
  className,
  children,
  ...props
}: StatePageProps) {
  // One element type for the compiler: the three share every prop that is passed on.
  const Tag = as as "main";
  const Heading = `h${headingLevel}` as "h1" | "h2" | "h3";
  return (
    <Tag data-slot="state-page" {...props} className={classes("fui-state-page", className)} data-align={align}>
      {brand ? <div className="fui-state-page-brand">{brand}</div> : null}
      <div className="fui-state-page-body">
        {code ? <p className="fui-state-page-code">{code}</p> : null}
        <Heading className="fui-state-page-title">{title}</Heading>
        {description ? <p className="fui-state-page-description">{description}</p> : null}
        {actions ? <div className="fui-actions fui-state-page-actions">{actions}</div> : null}
        {children}
      </div>
    </Tag>
  );
}

export type ErrorStateLabels = {
  title: string;
  description: string;
  retry: string;
  home: string;
  /** The line that carries the reference: `reference("abc123")` is "Reference abc123". */
  reference: (id: string) => string;
  copyReference: string;
  copied: string;
};

const errorLabels: ErrorStateLabels = {
  title: "Something went wrong",
  description: "This page could not load. Try again.",
  retry: "Try again",
  home: "Go home",
  reference: (id) => `Reference ${id}`,
  copyReference: "Copy reference",
  copied: "Copied",
};

export type ErrorStateProps = Omit<StatePanelProps, "state" | "title" | "description" | "actions"> & {
  /** The error that was caught. Only its `digest` is shown (the reference a server logs); its message never is. */
  error?: unknown;
  /** A reference to quote to support, when it does not come from `error.digest`. */
  reference?: string;
  title?: ReactNode;
  description?: ReactNode;
  /** Shows "Try again". */
  onRetry?: () => void;
  retrying?: boolean;
  /** Shows a link home. */
  homeHref?: string;
  homeLabel?: ReactNode;
  /** More actions, after the two above. */
  actions?: ReactNode;
  labels?: Partial<ErrorStateLabels>;
};

function digestOf(error: unknown) {
  if (typeof error !== "object" || error === null || !("digest" in error)) return undefined;
  return typeof error.digest === "string" && error.digest ? error.digest : undefined;
}

/** A route or a region that failed: what happened, a way to try again, a way out, and the reference to quote. */
export function ErrorState({
  error,
  reference,
  title,
  description,
  onRetry,
  retrying = false,
  homeHref,
  homeLabel,
  actions,
  labels,
  className,
  ...props
}: ErrorStateProps) {
  const text = { ...errorLabels, ...labels };
  const id = reference ?? digestOf(error);
  return (
    <StatePanel
      {...props}
      className={classes("fui-error-state", className)}
      state="error"
      title={title ?? text.title}
      description={
        <>
          {description ?? text.description}
          {id ? (
            <span className="fui-error-state-reference">
              <span>{text.reference(id)}</span>
              <CopyButton copiedLabel={text.copied} label={text.copyReference} size="icon-xs" value={id} />
            </span>
          ) : null}
        </>
      }
      actions={
        onRetry || homeHref || actions ? (
          <>
            {onRetry ? (
              <Button loading={retrying} onClick={() => onRetry()} type="button">
                {retrying ? null : <RotateCcw aria-hidden />}
                {text.retry}
              </Button>
            ) : null}
            {homeHref ? (
              <a className="fui-button" data-size="default" data-variant="outline" href={homeHref}>
                {homeLabel ?? text.home}
              </a>
            ) : null}
            {actions}
          </>
        ) : undefined
      }
    />
  );
}

export type BackButtonProps = Omit<useRender.ComponentProps<"button">, "children"> &
  Omit<ButtonStyleProps, "className"> & {
    /** Where to go when there is no history to go back to (a page opened in a new tab). */
    fallbackHref?: string;
    /** Follows the fallback with the host's router instead of a full page load. */
    onNavigate?: (href: string) => void;
    children?: ReactNode;
  };

/**
 * Goes back in history, and to `fallbackHref` when there is none. It knows no router: `onNavigate` hands the fallback to
 * one. With `render={<a href="…" />}` it is a link whose own href is the fallback. The arrow follows the direction.
 */
export function BackButton({
  fallbackHref = "/",
  onNavigate,
  children = "Go back",
  variant = "outline",
  size = "default",
  className,
  render,
  ...props
}: BackButtonProps) {
  const onClick = (event: MouseEvent<HTMLElement>) => {
    if (event.defaultPrevented) return;
    const target = event.currentTarget;
    const link = target instanceof HTMLAnchorElement && target.hasAttribute("href");
    // A modified click on a link is the browser's: a new tab, a download.
    if (link && (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
    if (window.history.length > 1) {
      event.preventDefault();
      window.history.back();
      return;
    }
    if (onNavigate) {
      event.preventDefault();
      onNavigate(fallbackHref);
      return;
    }
    if (!link) window.location.assign(fallbackHref);
  };
  return useRender({
    defaultTagName: "button",
    render,
    props: mergeProps<"button">(
      {
        ...(render ? {} : { type: "button" as const }),
        className: classes("fui-button", "fui-back-button", className),
        onClick,
        children: (
          <>
            <ArrowLeft aria-hidden className="fui-back-button-icon" />
            {children}
          </>
        ),
      },
      { "data-slot": "back-button", "data-variant": variant, "data-size": size } as ComponentProps<"button">,
      props,
    ),
  });
}
