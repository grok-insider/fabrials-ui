import { describe, it, expect } from "vitest";
import { createMCPClient } from "@/registry/mcp/client";
import { demoHandler } from "@/lib/demo-server";
const localFetch: typeof fetch = async (input, init) =>
  demoHandler.fetch(new Request(input, init));
describe("official SDK protocol integration", () => {
  for (const version of ["current", "legacy"] as const)
    it(`discovers and executes with ${version}`, async () => {
      const { client, transport } = createMCPClient({
        endpoint: "https://demo.example/mcp",
        protocol: version,
        fetch: localFetch,
      });
      try {
        await client.connect(transport);
        expect(client.getNegotiatedProtocolVersion()).toBe(
          version === "current" ? "2026-07-28" : "2025-11-25",
        );
        const { tools } = await client.listTools();
        expect(tools.map((t) => t.name)).toContain("search_catalog");
        const result = await client.callTool({
          name: "search_catalog",
          arguments: { query: "WebMCP", category: "All" },
        });
        expect(result.structuredContent).toMatchObject({
          records: [{ name: "WebMCP" }],
        });
        expect((await client.listResources()).resources).toHaveLength(1);
        expect(
          (await client.listResourceTemplates()).resourceTemplates,
        ).toHaveLength(1);
        expect(
          (await client.readResource({ uri: "fabrials://catalog" }))
            .contents[0],
        ).toHaveProperty("text");
        expect(
          (
            await client.getPrompt({
              name: "compare_projects",
              arguments: { first: "WebMCP", second: "MCP" },
            })
          ).messages[0].content,
        ).toMatchObject({ text: expect.stringContaining("WebMCP") });
      } finally {
        await client.close();
      }
    });
  it("negotiates current era automatically and fulfills additional input", async () => {
    const { client, transport } = createMCPClient({
      endpoint: "https://demo.example/mcp",
      fetch: localFetch,
    });
    client.setRequestHandler("elicitation/create", async () => ({
      action: "accept",
      content: { name: "Alex" },
    }));
    try {
      await client.connect(transport);
      expect(client.getProtocolEra()).toBe("modern");
      const result = await client.callTool({
        name: "personalize_greeting",
        arguments: {},
      });
      expect(result.content[0]).toMatchObject({
        text: expect.stringContaining("Hello, Alex"),
      });
    } finally {
      await client.close();
    }
  });
  it("reports progress and aborts an active tool without replay", async () => {
    let calls = 0;
    const progress: number[] = [];
    const counted: typeof fetch = async (input, init) => {
      if (String(init?.body).includes('"name":"build_report"')) calls++;
      return localFetch(input, init);
    };
    const { client, transport } = createMCPClient({
      endpoint: "https://demo.example/mcp",
      protocol: "current",
      fetch: counted,
    });
    try {
      await client.connect(transport);
      const abort = new AbortController();
      await expect(
        client.callTool(
          { name: "build_report", arguments: { topic: "Testing" } },
          {
            signal: abort.signal,
            onprogress: (p) => {
              progress.push(p.progress);
              abort.abort();
            },
          },
        ),
      ).rejects.toThrow();
      expect(progress.length).toBeGreaterThan(0);
      expect(calls).toBe(1);
    } finally {
      await client.close();
    }
  });
  it("rejects insecure remote endpoints", () => {
    expect(() =>
      createMCPClient({ endpoint: "http://example.com/mcp" }),
    ).toThrow("HTTPS");
    expect(() =>
      createMCPClient({ endpoint: "https://user:secret@example.com/mcp" }),
    ).toThrow("credentials");
  });
});
it("opens and closes modern catalog subscriptions", async () => {
  const { client, transport } = createMCPClient({
    endpoint: "https://demo.example/mcp",
    protocol: "current",
    fetch: localFetch,
  });
  const changed = new Promise<void>((resolve) =>
    client.setNotificationHandler(
      "notifications/tools/list_changed",
      async () => resolve(),
    ),
  );
  try {
    await client.connect(transport);
    const subscription = await client.listen({ toolsListChanged: true });
    demoHandler.notify.toolsChanged();
    await changed;
    await subscription.close();
  } finally {
    await client.close();
  }
});
