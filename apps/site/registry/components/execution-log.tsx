"use client";
import { ChevronRight } from "lucide-react";
import { Badge, Button, Progress, StatusDot } from "@fabrials/ui";
import { ResultView } from "@/registry/components/result-view";
import type { Execution } from "@/registry/mcp/types";

const statusLabels: Record<string, string> = {
  running: "Running",
  success: "Done",
  error: "Failed",
  cancelled: "Cancelled",
};

const defaultSourceLabels: Record<Execution["source"], string> = {
  human: "You",
  agent: "Agent",
  simulator: "Simulator",
};

export function ExecutionLog({
  executions,
  onCancel,
  onClear,
  sourceLabels = defaultSourceLabels,
}: {
  executions: Execution[];
  onCancel?: (id: string) => void;
  onClear?: () => void;
  /** Who made each call, in the reader's words. */
  sourceLabels?: Partial<Record<Execution["source"], string>>;
}) {
  return (
    <section className="grid gap-3" aria-label="Execution history">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="m-0 text-sm font-medium text-foreground">Activity</h3>
          <Badge size="sm" tone="neutral">
            {executions.length}
          </Badge>
        </div>
        {onClear && (
          <Button
            variant="ghost"
            size="xs"
            disabled={!executions.length}
            onClick={onClear}
          >
            Clear history
          </Button>
        )}
      </header>

      {!executions.length && (
        <div className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-[var(--fui-radius-md)] border border-[var(--fui-separator)] bg-[var(--fui-surface-inset)] px-4 py-6 text-center text-muted-foreground">
          <StatusDot tone="neutral" label="Idle" hideLabel />
          <p className="m-0 text-xs">Run a tool to see its activity here.</p>
        </div>
      )}

      {executions.length > 0 && (
        <div className="grid gap-2">
          {executions.map((e) => {
            const dotTone =
              e.status === "running"
                ? "info"
                : e.status === "success"
                  ? "success"
                  : e.status === "error"
                    ? "danger"
                    : "neutral";
            const statusToneClass =
              e.status === "success"
                ? "text-[var(--fui-success-ink)]"
                : e.status === "error"
                  ? "text-[var(--fui-danger-ink)]"
                  : e.status === "running"
                    ? "text-[var(--brand-ink)]"
                    : "text-muted-foreground";
            return (
              <details
                key={e.id}
                className="group rounded-[var(--fui-radius-md)] border border-[var(--fui-separator)] bg-card transition-colors open:border-border"
                open={e.status === "running" || undefined}
              >
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 px-3 py-2.5 text-xs">
                  <ChevronRight
                    aria-hidden="true"
                    className="size-3.5 text-muted-foreground transition-transform group-open:rotate-90"
                  />
                  <span className="min-w-0 flex-1 truncate font-mono font-medium text-foreground">
                    {e.name}
                  </span>
                  <Badge
                    size="sm"
                    tone={e.source === "agent" ? "info" : "neutral"}
                  >
                    {sourceLabels[e.source] ?? defaultSourceLabels[e.source]}
                  </Badge>
                  <StatusDot
                    tone={dotTone}
                    pulse={e.status === "running"}
                    label={statusLabels[e.status] ?? e.status}
                    role="status"
                    className={`font-mono text-[11px] ${statusToneClass}`}
                  />
                </summary>
                <div className="grid gap-3 border-t border-[var(--fui-separator)] bg-[var(--fui-surface-inset)] p-3">
                  {e.progress && (
                    <div className="grid gap-1.5">
                      <Progress
                        max={100}
                        value={
                          e.progress.total
                            ? (e.progress.progress / e.progress.total) * 100
                            : undefined
                        }
                      />
                      <p
                        role="status"
                        className="m-0 font-mono text-[11px] text-muted-foreground"
                      >
                        {e.progress.message ??
                          `${e.progress.progress} completed`}
                      </p>
                    </div>
                  )}
                  {e.status === "running" && onCancel && (
                    <div>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => onCancel(e.id)}
                      >
                        Cancel request
                      </Button>
                    </div>
                  )}
                  {e.status === "cancelled" && (
                    <p className="m-0 text-xs text-muted-foreground">
                      Request cancelled. Remote effects may have already
                      occurred.
                    </p>
                  )}
                  {e.error && e.status !== "cancelled" && (
                    <p
                      role="alert"
                      className="m-0 text-xs text-[var(--fui-danger-ink)]"
                    >
                      {e.error}
                    </p>
                  )}
                  {e.result !== undefined && <ResultView result={e.result} />}
                  <details className="text-xs">
                    <summary className="cursor-pointer font-mono text-[11px] text-muted-foreground hover:text-foreground">
                      Arguments
                    </summary>
                    <pre className="mt-2 overflow-auto rounded-[var(--fui-radius-sm)] border border-[var(--fui-separator)] bg-[var(--fui-code)] p-3 font-mono text-[11px] leading-relaxed">
                      {JSON.stringify(e.args, null, 2)}
                    </pre>
                  </details>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}
