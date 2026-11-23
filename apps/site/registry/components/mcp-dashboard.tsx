"use client";
import type { JsonSchema } from "@/registry/mcp/types";
import { useState } from "react";
import {
  Stat,
  StatGroup,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@fabrials/ui";
import { MCPProvider, useMCPClient } from "@/registry/mcp/provider";
import { ConnectionPanel } from "@/registry/components/connection-panel";
import { ToolCatalog, ToolDetail } from "@/registry/components/tool-catalog";
import { ExecutionLog } from "@/registry/components/execution-log";
import { ElicitationDialog } from "@/registry/components/elicitation-dialog";
import {
  ResourceExplorer,
  PromptCatalog,
} from "@/registry/components/resource-explorer";

export function MCPDashboardContent({
  defaultEndpoint,
}: {
  defaultEndpoint?: string;
}) {
  const mcp = useMCPClient();
  const [selected, setSelected] = useState("");
  const tools = mcp.tools.map((t) => ({
    ...t,
    inputSchema: t.inputSchema as JsonSchema,
  }));
  const tool = tools.find((t) => t.name === selected) ?? tools[0];

  return (
    <div className="grid gap-5">
      <ConnectionPanel
        status={mcp.status}
        error={mcp.error}
        protocol={mcp.protocol}
        onConnect={mcp.connect}
        onDisconnect={mcp.disconnect}
        defaultEndpoint={defaultEndpoint}
      />

      {mcp.status !== "connected" && (
        <div className="grid gap-0 overflow-hidden rounded-[var(--fui-radius-lg)] border bg-background sm:grid-cols-3 sm:divide-x sm:divide-[var(--fui-separator)]">
          <div className="grid gap-1 p-4">
            <span className="font-mono text-[11px] text-muted-foreground">
              Transport
            </span>
            <span className="text-sm font-medium text-foreground">
              Streamable HTTP &amp; legacy SSE
            </span>
            <span className="text-xs leading-5 text-muted-foreground">
              Auto-negotiates MCP 2026-07-28 and falls back cleanly for older servers.
            </span>
          </div>
          <div className="grid gap-1 border-t border-[var(--fui-separator)] p-4 sm:border-t-0">
            <span className="font-mono text-[11px] text-muted-foreground">
              Session scope
            </span>
            <span className="text-sm font-medium text-foreground">
              Tools, resources &amp; prompts
            </span>
            <span className="text-xs leading-5 text-muted-foreground">
              Schema-driven invocation, elicitation dialogs and live execution tracing.
            </span>
          </div>
          <div className="grid gap-1 border-t border-[var(--fui-separator)] p-4 sm:border-t-0">
            <span className="font-mono text-[11px] text-muted-foreground">
              Credentials
            </span>
            <span className="text-sm font-medium text-foreground">
              Memory-only in browser
            </span>
            <span className="text-xs leading-5 text-muted-foreground">
              Tokens never touch storage or server logs; connect to{" "}
              <code className="font-mono text-[11px]">
                {defaultEndpoint || "/api/demo/mcp"}
              </code>{" "}
              to inspect live tools.
            </span>
          </div>
        </div>
      )}

      {mcp.status === "connected" && (
        <>
          <StatGroup>
            <Stat label="Tools" value={mcp.tools.length} />
            <Stat label="Resources" value={mcp.resources.length} />
            <Stat label="Prompts" value={mcp.prompts.length} />
            <Stat label="Calls" value={mcp.executions.length} />
          </StatGroup>

          <Tabs defaultValue="tools">
            <TabsList>
              <TabsTrigger value="tools">
                Tools ({mcp.tools.length})
              </TabsTrigger>
              <TabsTrigger value="resources">
                Resources ({mcp.resources.length})
              </TabsTrigger>
              <TabsTrigger value="prompts">
                Prompts ({mcp.prompts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tools" className="mt-4">
              <div className="grid gap-5 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
                <ToolCatalog
                  tools={tools}
                  selected={tool?.name}
                  onSelect={(t) => setSelected(t.name)}
                />
                {tool ? (
                  <div className="rounded-[var(--fui-radius-lg)] border bg-background p-4">
                    <ToolDetail
                      key={tool.name}
                      tool={tool}
                      onRun={(args) => mcp.run(tool.name, args)}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This server has no tools.
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="resources" className="mt-4">
              <ResourceExplorer
                resources={mcp.resources}
                templates={mcp.templates}
                onRead={mcp.readResource}
              />
            </TabsContent>

            <TabsContent value="prompts" className="mt-4">
              <PromptCatalog prompts={mcp.prompts} onGet={mcp.getPrompt} />
            </TabsContent>
          </Tabs>

          <div className="rounded-[var(--fui-radius-lg)] border bg-background p-4">
            <ExecutionLog
              executions={mcp.executions}
              onCancel={mcp.cancel}
              onClear={mcp.clearHistory}
            />
          </div>
        </>
      )}
      <ElicitationDialog request={mcp.elicitations[0]} />
    </div>
  );
}

export function MCPDashboard(props: { defaultEndpoint?: string }) {
  return (
    <MCPProvider>
      <MCPDashboardContent {...props} />
    </MCPProvider>
  );
}
