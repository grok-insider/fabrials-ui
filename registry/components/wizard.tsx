"use client";
import { useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@fabrials/ui";
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
  const current = steps[Math.max(0, Math.min(step, steps.length - 1))];
  if (!current) return null;
  return (
    <section className="space-y-6">
      <ol className="flex flex-wrap gap-5" aria-label="Progress">
        {steps.map((item, i) => (
          <li
            key={i}
            aria-current={i === step ? "step" : undefined}
            className={`flex items-center gap-2 text-xs ${i === step ? "text-foreground" : "text-muted-foreground"}`}
          >
            <span
              className={`flex size-6 items-center justify-center rounded-full border tabular-nums ${i === step ? "border-transparent bg-[var(--brand)] text-[var(--brand-foreground)]" : ""}`}
            >
              {i + 1}
            </span>
            {item.title}
          </li>
        ))}
      </ol>
      <div
        ref={region}
        tabIndex={-1}
        aria-labelledby={id}
        className="space-y-4 outline-none"
      >
        <h3 id={id} className="font-medium">
          {current.title}
        </h3>
        {current.content}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-between">
        <Button
          variant="outline"
          disabled={step === 0 || pending}
          onClick={() => {
            setError("");
            onStepChange(step - 1);
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
              if (step < steps.length - 1) {
                onStepChange(step + 1);
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
            : step === steps.length - 1
              ? "Complete"
              : "Continue"}
        </Button>
      </div>
    </section>
  );
}
