"use client";
import { useId, useState } from "react";
import { Badge, Label, NativeSelect } from "@fabrials/ui";
import { useWebMCP } from "@/registry/webmcp/provider";
import { ArgumentsForm } from "@/registry/components/arguments-form";
import { ExecutionLog } from "@/registry/components/execution-log";

export function ToolPlayground() {
  const mcp = useWebMCP();
  const id = useId();
  const [selected, setSelected] = useState("");
  const tool = mcp.tools.find((t) => t.name === selected) ?? mcp.tools[0];

  return (
    <section aria-label="Tool playground" className="playground-tool-runner">
      <div className="playground-tool-runner-head">
        <div>
          <h3>Take the agent&apos;s seat</h3>
          <p>
            Edit a tool&apos;s inputs, execute it against the live interface above, then make a manual correction.
          </p>
        </div>
        <Badge tone="info" size="sm">
          Local WebMCP runner
        </Badge>
      </div>
      <div className="grid min-w-0 gap-8 lg:grid-cols-2">
        <div className="min-w-0 space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor={id}>Available tool</Label>
            <NativeSelect
              id={id}
              value={tool?.name ?? ""}
              onChange={(e) => setSelected(e.target.value)}
            >
              {!tool && <option>Waiting for tools…</option>}
              {mcp.tools.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          {tool && (
            <>
              <p className="text-sm leading-6 text-muted-foreground">{tool.description}</p>
              <ArgumentsForm
                key={tool.name}
                schema={tool.inputSchema}
                submitLabel="Execute tool"
                onSubmit={(args) => mcp.run(tool.name, args, "simulator")}
              />
            </>
          )}
          <p className="font-mono text-xs leading-5 text-muted-foreground">
            Runs the same handler as native WebMCP. No connected AI is required.
          </p>
        </div>
        <div className="min-w-0 max-h-[480px] overflow-auto">
          <ExecutionLog executions={mcp.executions} onClear={mcp.clearHistory} onCancel={mcp.cancel} />
        </div>
      </div>
    </section>
  );
}
