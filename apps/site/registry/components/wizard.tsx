"use client";
import { useId, useRef, useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { Alert, AlertDescription, Button } from "@fabrials/ui";
import { errorMessage } from "@/registry/mcp/types";

export interface WizardStep {
  title: string;
  content: ReactNode;
  validate?: () => string | null | Promise<string | null>;
}

export function Wizard({
  steps,
  step,
  onStepChange,
  onComplete,
}: {
  steps: WizardStep[];
  step: number;
  onStepChange: (step: number) => void;
  onComplete: () => unknown | Promise<unknown>;
}) {
  const id = useId();
  const region = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const clamped = Math.max(0, Math.min(step, steps.length - 1));
  const current = steps[clamped];
  if (!current) return null;

  return (
    <section className="grid gap-5">
      <ol
        className="m-0 flex flex-wrap items-center gap-2 border-b border-[var(--fui-separator)] pb-4 list-none p-0"
        aria-label="Progress"
      >
        {steps.map((item, i) => {
          const isCurrent = i === clamped;
          const isDone = i < clamped;
          return (
            <li
              key={i}
              aria-current={isCurrent ? "step" : undefined}
              className={`flex items-center gap-2 text-xs ${
                isCurrent
                  ? "font-medium text-foreground"
                  : isDone
                    ? "text-foreground"
                    : "text-muted-foreground"
              }`}
            >
              <span
                className={`flex size-6 items-center justify-center rounded-full border font-mono text-[11px] tabular-nums transition-colors ${
                  isCurrent
                    ? "border-transparent bg-[var(--brand)] text-[var(--brand-foreground)]"
                    : isDone
                      ? "border-[color-mix(in_oklab,var(--fui-success-ink)_35%,transparent)] bg-[color-mix(in_oklab,var(--success)_var(--fui-tint-strength),var(--card))] text-[var(--fui-success-ink)]"
                      : "border-border bg-[var(--fui-surface-inset)] text-muted-foreground"
                }`}
              >
                {isDone ? <Check className="size-3.5" aria-hidden /> : i + 1}
              </span>
              <span>{item.title}</span>
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`mx-1 h-px w-5 sm:w-8 ${
                    isDone ? "bg-[var(--brand-ink)]" : "bg-[var(--fui-separator)]"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>

      <div
        ref={region}
        tabIndex={-1}
        aria-labelledby={id}
        className="grid gap-4 outline-none"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h3 id={id} className="m-0 text-base font-medium tracking-tight text-foreground">
            {current.title}
          </h3>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            Step {clamped + 1} of {steps.length}
          </span>
        </div>
        {current.content}
      </div>

      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-[var(--fui-separator)] pt-4">
        <Button
          variant="outline"
          disabled={clamped === 0 || pending}
          onClick={() => {
            setError("");
            onStepChange(clamped - 1);
          }}
        >
          Back
        </Button>
        <Button
          disabled={pending}
          onClick={async () => {
            setPending(true);
            setError("");
            try {
              const invalid = await current.validate?.();
              if (invalid) {
                setError(invalid);
                return;
              }
              if (clamped < steps.length - 1) {
                onStepChange(clamped + 1);
                region.current?.focus();
              } else await onComplete();
            } catch (e) {
              setError(errorMessage(e));
            } finally {
              setPending(false);
            }
          }}
        >
          {pending
            ? "Working…"
            : clamped === steps.length - 1
              ? "Complete"
              : "Continue"}
        </Button>
      </div>
    </section>
  );
}
