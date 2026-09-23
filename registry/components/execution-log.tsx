"use client";
import { Check, Circle, Loader2, X } from "lucide-react";
import { Badge, Button, Progress } from "@fabrials/ui";
import { ResultView } from "@/registry/components/result-view";
import type { Execution } from "@/registry/mcp/types";
export function ExecutionLog({
  executions,
  onCancel,
  onClear,
}: {
  executions: Execution[];
  onCancel?: (id: string) => void;
  onClear?: () => void;
}) {
  return (
    <section className="space-y-3" aria-label="Execution history">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          Activity{" "}
          <span className="ml-1 text-muted-foreground">
            {executions.length}
          </span>
        </h3>
        {onClear && (
          <Button variant="ghost" size="xs" onClick={onClear}>
            Clear history
          </Button>
        )}
      </header>
      {!executions.length && (
        <div className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-muted-foreground">
          <Circle className="size-4" />
          <p className="text-xs">Run a tool to see its activity here.</p>
        </div>
      )}
      {executions.map((e) => (
        <details
          key={e.id}
          className="rounded-lg border p-3"
          open={e.status === "running" || undefined}
        >
          <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 text-xs">
            {e.status === "running" ? (
              <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" />
            ) : e.status === "success" ? (
              <Check className="size-3.5 text-[var(--fui-success-ink)]" />
            ) : (
              <X className="size-3.5 text-destructive" />
            )}
            <span className="flex-1 font-mono">{e.name}</span>
            <Badge variant="soft">{e.source}</Badge>
            <span role="status" className="text-muted-foreground">
              {e.status}
            </span>
          </summary>
          <div className="mt-4 space-y-3">
            {e.progress && (
              <>
                <Progress
                  max={100}
                  value={
                    e.progress.total
                      ? (e.progress.progress / e.progress.total) * 100
                      : undefined
                  }
                />
                <p role="status" className="text-xs text-muted-foreground">
                  {e.progress.message ?? `${e.progress.progress} completed`}
                </p>
              </>
            )}
            {e.status === "running" && onCancel && (
              <Button
                size="xs"
                variant="outline"
                onClick={() => onCancel(e.id)}
              >
                Cancel request
              </Button>
            )}
            {e.status === "cancelled" && (
              <p className="text-xs text-muted-foreground">
                Request cancelled. Remote effects may have already occurred.
              </p>
            )}
            {e.error && e.status !== "cancelled" && (
              <p role="alert" className="text-xs text-destructive">
                {e.error}
              </p>
            )}
            {e.result !== undefined && <ResultView result={e.result} />}
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">
                Arguments
              </summary>
              <pre className="mt-2 overflow-auto">
                {JSON.stringify(e.args, null, 2)}
              </pre>
            </details>
          </div>
        </details>
      ))}
    </section>
  );
}
