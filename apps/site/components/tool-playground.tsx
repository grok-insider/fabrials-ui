"use client";
import { useId, useState } from "react";
import { Terminal } from "lucide-react";
import { Badge, Label, NativeSelect, StatusDot } from "@fabrials/ui";
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
            Invoke any registered WebMCP tool directly against the live interface above, then make a manual edit.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral" size="sm">
            {mcp.tools.length} {mcp.tools.length === 1 ? "tool" : "tools"}
          </Badge>
          <Badge tone={mcp.support === "native" ? "success" : "info"} dot size="sm">
            {mcp.support === "native" ? "Native WebMCP" : "Local WebMCP runner"}
          </Badge>
        </div>
      </div>

      <div className="pg-split-even">
        <div className="pg-well">
          <div className="pg-well-head">
            <span className="inline-flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
              <Terminal className="size-3.5" aria-hidden />
              Tool invocation
            </span>
            {tool && (
              <code className="font-mono text-[11px] text-foreground">{tool.name}</code>
            )}
          </div>

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
              <p className="m-0 text-xs leading-relaxed text-muted-foreground">{tool.description}</p>
              <ArgumentsForm
                key={tool.name}
                schema={tool.inputSchema}
                submitLabel="Execute tool"
                onSubmit={(args) => mcp.run(tool.name, args, "simulator")}
              />
            </>
          )}

          <div className="pg-status-strip">
            <StatusDot
              tone="info"
              label="Runs the same handler as native WebMCP · no connected AI required"
            />
          </div>
        </div>

        <div className="pg-well max-h-[30rem] overflow-auto">
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
