"use client";
import type { JsonSchema } from "@/registry/mcp/types";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@fabrials/ui";
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
    <div className="space-y-8">
      <ConnectionPanel
        status={mcp.status}
        error={mcp.error}
        protocol={mcp.protocol}
        onConnect={mcp.connect}
        onDisconnect={mcp.disconnect}
        defaultEndpoint={defaultEndpoint}
      />
      {mcp.status === "connected" && (
        <>
          <Tabs defaultValue="tools">
            <TabsList>
              <TabsTrigger value="tools">
                Tools ({mcp.tools.length})
              </TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="prompts">Prompts</TabsTrigger>
            </TabsList>
            <TabsContent value="tools" className="mt-5">
              <div className="grid gap-6 md:grid-cols-2">
                <ToolCatalog
                  tools={tools}
                  selected={tool?.name}
                  onSelect={(t) => setSelected(t.name)}
                />
                {tool ? (
                  <div className="rounded-lg border p-5">
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
            <TabsContent value="resources" className="mt-5">
              <ResourceExplorer
                resources={mcp.resources}
                templates={mcp.templates}
                onRead={mcp.readResource}
              />
            </TabsContent>
            <TabsContent value="prompts" className="mt-5">
              <PromptCatalog prompts={mcp.prompts} onGet={mcp.getPrompt} />
            </TabsContent>
          </Tabs>
          <ExecutionLog
            executions={mcp.executions}
            onCancel={mcp.cancel}
            onClear={mcp.clearHistory}
          />
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
