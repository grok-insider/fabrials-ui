"use client";
import { useId, useState } from "react";
import { useWebMCP } from "@/registry/webmcp/provider";
import { ArgumentsForm } from "@/registry/components/arguments-form";
import { ExecutionLog } from "@/registry/components/execution-log";

export function ToolPlayground() {
  const mcp = useWebMCP();
  const id = useId();
  const [selected, setSelected] = useState("");
  const tool = mcp.tools.find((t) => t.name === selected) ?? mcp.tools[0];
  return (
    <section
      aria-label="Tool playground"
      className="mt-8 rounded-xl border bg-muted/20 p-5 sm:p-6"
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">Take the agent’s seat</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit a tool’s inputs, run it, then change the result using the
            interface above.
          </p>
        </div>
        <span className="rounded-full border bg-background px-3 py-1 text-xs">
          Local tool runner
        </span>
      </div>
      <div className="grid min-w-0 gap-8 lg:grid-cols-2">
        <div className="min-w-0 space-y-4">
          <label htmlFor={id} className="block text-sm font-medium">
            Available tool
          </label>
          <select
            id={id}
            value={tool?.name ?? ""}
            onChange={(e) => setSelected(e.target.value)}
            className="h-10 w-full min-w-0 rounded-lg border bg-background px-3 text-sm"
          >
            {!tool && <option>Waiting for tools…</option>}
            {mcp.tools.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
          {tool && (
            <>
              <p className="text-sm leading-6 text-muted-foreground">
                {tool.description}
              </p>
              <ArgumentsForm
                key={tool.name}
                schema={tool.inputSchema}
                submitLabel="Execute tool"
                onSubmit={(args) => mcp.run(tool.name, args, "simulator")}
              />
            </>
          )}
          <p className="text-xs leading-5 text-muted-foreground">
            Runs the same handler as native WebMCP. No connected AI is required.
          </p>
        </div>
        <div className="min-w-0 max-h-[480px] overflow-auto">
          <ExecutionLog
            executions={mcp.executions}
            onClear={mcp.clearHistory}
            onCancel={mcp.cancel}
          />
        </div>
      </div>
    </section>
  );
}
