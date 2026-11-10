"use client";
// What an alert needs from the browser (0.12): the retry action that waits for a promise, and the reveal of an alert that
// arrived after the first paint. `Alert` itself stays a plain component a Server Component can render.

import { useEffect, useRef, useState } from "react";
import type { AlertLabels } from "./alert";
import { Button } from "./controls";
import { useLabels } from "./labels";
import { prefersReducedMotion } from "./reduced-motion";

const ALERT_LABELS: AlertLabels = {
  retry: "Try again",
  retrying: "Trying again",
};

export type AlertRetryProps = {
  onRetry: () => void | Promise<void>;
  retrying?: boolean;
  labels?: Partial<AlertLabels>;
};

/**
 * "Try again" in the alert's action place. A promise from `onRetry` keeps it busy until it settles; the button is
 * `aria-disabled` rather than gone, so the keyboard stays where the person left it and a second press is ignored. When the
 * retry changes what the alert says, the alert's own live region reads the new message.
 */
export function AlertRetry({ onRetry, retrying, labels: ownLabels }: AlertRetryProps) {
  const labels = useLabels("alert", ALERT_LABELS, ownLabels);
  const [pending, setPending] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const busy = pending || retrying === true;
  const press = () => {
    if (busy) return;
    const result = onRetry();
    if (!result || typeof (result as Promise<void>)?.then !== "function") return;
    setPending(true);
    void Promise.resolve(result)
      .catch(() => undefined)
      .finally(() => {
        if (mounted.current) setPending(false);
      });
  };
  return (
    <div className="fui-actions fui-alert-action">
      <Button
        aria-busy={busy || undefined}
        loading={busy}
        loadingLabel={busy ? labels.retrying : undefined}
        onClick={press}
        size="sm"
        type="button"
        variant="outline"
      >
        {labels.retry}
      </Button>
    </div>
  );
}

/**
 * Brings an alert that appeared after the first paint into view, as near as it can be without leaving the page where it is.
 * A sticky header above and an `ActionBar` below are kept clear by the alert's `scroll-margin` (see the stylesheet); under
 * reduced motion the scroll is instant.
 */
export function AlertReveal() {
  const node = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const box = node.current?.closest<HTMLElement>('[data-slot="alert"]');
    if (!box) return;
    const reduce = prefersReducedMotion();
    box.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, []);
  return <span aria-hidden="true" hidden ref={node} />;
}
