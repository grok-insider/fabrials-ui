import {
  McpServer,
  ResourceTemplate,
  createMcpHandler,
  inputRequired,
  acceptedContent,
} from "@modelcontextprotocol/server";
import { z } from "zod";
const releases = [
  {
    id: "01",
    name: "WebMCP",
    category: "Browser",
    status: "Preview",
    description: "Structured tools for the web.",
  },
  {
    id: "02",
    name: "Model Context Protocol",
    category: "Protocol",
    status: "Stable",
    description: "An open protocol for tools and context.",
  },
  {
    id: "03",
    name: "shadcn/ui",
    category: "Interface",
    status: "Stable",
    description: "Open code. Beautiful components.",
  },
  {
    id: "04",
    name: "Fabrials UI",
    category: "Interface",
    status: "Preview",
    description: "Interfaces for people and agents.",
  },
  {
    id: "05",
    name: "Chrome DevTools",
    category: "Browser",
    status: "Stable",
    description: "Inspect and understand your application.",
  },
  {
    id: "06",
    name: "Base UI",
    category: "Interface",
    status: "Stable",
    description: "Accessible, unstyled UI primitives.",
  },
];
export { releases };
export function createDemoServer() {
  const server = new McpServer(
    { name: "fabrials-demo", version: "0.1.0" },
    {
      supportedProtocolVersions: ["2026-07-28", "2025-11-25"],
      capabilities: {
        tools: { listChanged: true },
        resources: { listChanged: true },
        prompts: { listChanged: true },
      },
    },
  );
  server.registerTool(
    "search_catalog",
    {
      title: "Search the catalog",
      description:
        "Find browser, protocol and interface projects in the example catalog.",
      inputSchema: z.object({
        query: z.string().default(""),
        category: z
          .enum(["All", "Browser", "Protocol", "Interface"])
          .default("All"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ query, category }) => {
      const records = releases.filter(
        (r) =>
          `${r.name} ${r.description}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (category === "All" || r.category === category),
      );
      return {
        content: [
          { type: "text" as const, text: `Found ${records.length} projects.` },
        ],
        structuredContent: { records },
      };
    },
  );
  server.registerTool(
    "build_report",
    {
      title: "Build a report",
      description:
        "Stream progress while preparing an example report. No data is persisted.",
      inputSchema: z.object({ topic: z.string().min(1).max(100) }),
    },
    async ({ topic }, ctx) => {
      for (let i = 1; i <= 4; i++) {
        await new Promise<void>((resolve, reject) => {
          const abort = () => {
            clearTimeout(timer);
            reject(new Error("Cancelled"));
          };
          const timer = setTimeout(() => {
            ctx.mcpReq.signal.removeEventListener("abort", abort);
            resolve();
          }, 300);
          if (ctx.mcpReq.signal.aborted) abort();
          else
            ctx.mcpReq.signal.addEventListener("abort", abort, { once: true });
        });
        if (ctx.mcpReq._meta?.progressToken !== undefined)
          await ctx.mcpReq.notify({
            method: "notifications/progress",
            params: {
              progressToken: ctx.mcpReq._meta.progressToken,
              progress: i,
              total: 4,
              message: [
                "Collecting records",
                "Comparing sources",
                "Preparing summary",
                "Report ready",
              ][i - 1],
            },
          });
      }
      return {
        content: [
          {
            type: "text" as const,
            text: `Report: ${topic}\n\nYour example report is ready. This demo reads the local sample catalog.`,
          },
        ],
        structuredContent: { topic, projects: releases.length },
      };
    },
  );
  server.registerTool(
    "personalize_greeting",
    {
      title: "Ask for a name",
      description:
        "Demonstrate a human-in-the-loop form using MCP elicitation.",
      inputSchema: z.object({}),
    },
    async (_args, ctx) => {
      const answer = acceptedContent<{ name: string }>(
        ctx.mcpReq.inputResponses,
        "profile",
      );
      if (answer && typeof answer.name === "string")
        return {
          content: [
            {
              type: "text" as const,
              text: `Hello, ${answer.name.slice(0, 100)}. The agent and the interface share this result.`,
            },
          ],
        };
      if (ctx.mcpReq.inputResponses && "profile" in ctx.mcpReq.inputResponses)
        return {
          content: [
            { type: "text" as const, text: "You declined to share your name." },
          ],
        };
      if (ctx.mcpReq.envelope)
        return inputRequired({
          inputRequests: {
            profile: inputRequired.elicit({
              message: "What should this example call you?",
              requestedSchema: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "A display name for this demo.",
                  },
                },
                required: ["name"],
              },
            }),
          },
        });
      return {
        content: [
          {
            type: "text" as const,
            text: "Connect using MCP 2026-07-28 to try this multi-round-trip demo.",
          },
        ],
      };
    },
  );
  server.registerResource(
    "catalog",
    "fabrials://catalog",
    {
      description: "The sample project catalog.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(releases, null, 2),
        },
      ],
    }),
  );
  server.registerResource(
    "project",
    new ResourceTemplate("fabrials://project/{id}", { list: undefined }),
    { description: "A sample project by ID.", mimeType: "application/json" },
    async (uri, vars) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(
            releases.find((r) => r.id === vars.id) ?? {
              error: "Project not found",
            },
          ),
        },
      ],
    }),
  );
  server.registerPrompt(
    "compare_projects",
    {
      title: "Compare projects",
      description: "Generate a comparison prompt for two projects.",
      argsSchema: z.object({ first: z.string(), second: z.string() }),
    },
    ({ first, second }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Compare ${first} and ${second}. Explain their purposes, where they overlap, and how they can work together.`,
          },
        },
      ],
    }),
  );
  return server;
}
export const demoHandler = createMcpHandler(createDemoServer, {
  legacy: "stateless",
  responseMode: "auto",
});
