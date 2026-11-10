"use client";
// Origin: Fabrials, 0.12 (from Radiant's feature error boundary).

import { Component, createRef, type ErrorInfo, type ReactNode } from "react";
import { Button } from "./controls";
import { StatePanel, type StatePanelProps } from "./patterns";

export type ErrorBoundaryLabels = {
  title: string;
  description: string;
  retry: string;
};

const LABELS: ErrorBoundaryLabels = {
  title: "This part could not be shown",
  description: "Something went wrong while drawing it. The rest of the page still works.",
  retry: "Try again",
};

export type ErrorBoundaryFallbackProps = Omit<StatePanelProps, "state" | "title" | "description" | "actions"> & {
  /** Called by "Try again". Without it there is no button. */
  reset?: () => void;
  labels?: Partial<ErrorBoundaryLabels>;
};

/** What `ErrorBoundary` shows by default: an inline error with "Try again". Also the body of a route's error file. */
export function ErrorBoundaryFallback({ reset, labels, headingLevel = 3, size = "sm", variant = "inline", ...props }: ErrorBoundaryFallbackProps) {
  const text = { ...LABELS, ...labels };
  return (
    <StatePanel
      data-slot="error-boundary-fallback"
      {...props}
      state="error"
      size={size}
      variant={variant}
      headingLevel={headingLevel}
      title={text.title}
      description={text.description || undefined}
      actions={
        reset ? (
          <Button variant="secondary" size="sm" onClick={reset}>
            {text.retry}
          </Button>
        ) : undefined
      }
    />
  );
}

export type ErrorBoundaryProps = {
  children?: ReactNode;
  /** What to show instead: a node, or a function given the error and `reset`. Default: `ErrorBoundaryFallback`. */
  fallback?: ReactNode | ((props: { error: unknown; reset: () => void }) => ReactNode);
  /** When it changes, the children get a fresh attempt: the id of what is drawn, a corrected input. */
  resetKey?: unknown;
  onError?: (error: unknown, info: ErrorInfo) => void;
  /** Called when "Try again" (or a fallback's `reset`) clears the error. */
  onReset?: () => void;
  /** The words of the default fallback. */
  labels?: Partial<ErrorBoundaryLabels>;
  /** The heading level of the default fallback's title. Default 3. */
  headingLevel?: 2 | 3 | 4;
};

type State = { failed: boolean; error: unknown; resetKey: unknown };

/** Where the restored content starts: the element itself, focusable for this one visit. */
function focusStart(element: HTMLElement) {
  if (!element.hasAttribute("tabindex")) {
    element.setAttribute("tabindex", "-1");
    element.addEventListener("blur", () => element.removeAttribute("tabindex"), { once: true });
  }
  element.focus();
}

/**
 * Keeps one broken part from taking the page down: what throws while rendering below it is replaced by a fallback, and
 * the rest of the screen stays. Anything drawn from input nobody wrote by hand (a model's answer, a file, a plugin) belongs
 * inside one.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  state: State = { failed: false, error: undefined, resetKey: this.props.resetKey };

  private panel = createRef<HTMLDivElement>();
  private restore: { parent: Element; index: number } | null = null;

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { failed: true, error };
  }

  static getDerivedStateFromProps(props: ErrorBoundaryProps, state: State): Partial<State> | null {
    if (Object.is(props.resetKey, state.resetKey)) return null;
    return { failed: false, error: undefined, resetKey: props.resetKey };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  componentDidUpdate() {
    const restore = this.restore;
    this.restore = null;
    // "Try again" was focused and is gone: without this, focus falls to the top of the page.
    if (!restore || (document.activeElement !== null && document.activeElement !== document.body)) return;
    // Still broken: React drew the fallback anew, so the key that was pressed is a new one.
    if (this.state.failed) return this.panel.current?.querySelector("button")?.focus();
    const first = restore.parent.children[restore.index];
    if (first instanceof HTMLElement) focusStart(first);
  }

  reset = () => {
    const panel = this.panel.current;
    const parent = panel?.parentElement;
    this.restore = panel && parent && panel.contains(document.activeElement) ? { parent, index: Array.prototype.indexOf.call(parent.children, panel) } : null;
    this.props.onReset?.();
    this.setState({ failed: false, error: undefined });
  };

  render() {
    if (!this.state.failed) return this.props.children;
    const { fallback, labels, headingLevel } = this.props;
    if (typeof fallback === "function") return fallback({ error: this.state.error, reset: this.reset });
    if (fallback !== undefined) return fallback;
    return <ErrorBoundaryFallback ref={this.panel} reset={this.reset} labels={labels} headingLevel={headingLevel} />;
  }
}
