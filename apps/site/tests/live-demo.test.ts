import { afterEach, expect, it, vi } from "vitest";
import {
  DemoSessions,
  demoSessions,
  allowedOrigin,
} from "@/lib/live-demo-sessions";
import { POST, GET } from "@/app/api/demo/session/mcp/route";
import { createMCPClient } from "@/registry/mcp/client";
afterEach(() => vi.useRealTimers());
it("isolates owner/client capabilities and revokes queued work on disconnect", async () => {
  const store = new DemoSessions();
  const a = store.create();
  const b = store.create();
  expect(store.find(a.token, "owner")).toBeUndefined();
  expect(store.find(a.owner, "client")).toBeUndefined();
  const sa = store.find(a.token, "client")!;
  const sb = store.find(b.owner, "owner")!;
  const result = store.call(sa, "set_coffee_cart", { productId: "studio" });
  const job = await store.poll(sa, new AbortController().signal);
  expect(store.reply(sb, job!.id, { wrong: true })).toBe(false);
  store.reply(sa, job!.id, { productId: "studio" });
  expect(await result).toEqual({ productId: "studio" });
  const pending = store.call(sa, "set_coffee_filter", { included: true });
  store.close(sa);
  await expect(pending).rejects.toThrow("disconnected");
  expect(store.find(a.token, "client")).toBeUndefined();
  store.close(sb);
});
it("delivers once, times out without replay and expires abandoned sessions", async () => {
  vi.useFakeTimers();
  const store = new DemoSessions();
  const tokens = store.create();
  const session = store.find(tokens.owner, "owner")!;
  const pending = store.call(session, "set_coffee_cart", {});
  const rejection = expect(pending).rejects.toThrow("may have run");
  const command = await store.poll(session, new AbortController().signal);
  expect(command).toBeTruthy();
  await vi.advanceTimersByTimeAsync(15_001);
  await rejection;
  expect(store.reply(session, command!.id, {})).toBe(false);
  await vi.advanceTimersByTimeAsync(45_001);
  expect(store.find(tokens.token, "client")).toBeUndefined();
});
it("rejects foreign origins and missing credentials", async () => {
  expect(
    allowedOrigin(
      new Request("https://ui.fabrials.com", {
        headers: { origin: "https://evil.example" },
      }),
    ),
  ).toBe(false);
  expect(
    (
      await POST(
        new Request("https://ui.fabrials.com/api/demo/session/mcp", {
          method: "POST",
        }),
      )
    ).status,
  ).toBe(401);
  expect(
    (await GET(new Request("https://ui.fabrials.com/api/demo/session/mcp")))
      .status,
  ).toBe(401);
});
for (const protocol of ["current", "legacy"] as const)
  it(`bridges an official ${protocol} MCP client to only its browser session`, async () => {
    const tokens = demoSessions.create();
    const session = demoSessions.find(tokens.owner, "owner")!;
    const localFetch: typeof fetch = async (input, init) => {
      const r = new Request(input, init);
      return r.method === "POST" ? POST(r) : GET(r);
    };
    const { client, transport } = createMCPClient({
      endpoint: "https://ui.fabrials.com/api/demo/session/mcp",
      token: tokens.token,
      protocol,
      fetch: localFetch,
    });
    try {
      await client.connect(transport);
      expect((await client.listTools()).tools).toHaveLength(5);
      const pending = client.callTool({
        name: "set_coffee_cart",
        arguments: { productId: "studio" },
      });
      const command = await demoSessions.poll(
        session,
        new AbortController().signal,
      );
      expect(command).toMatchObject({
        name: "set_coffee_cart",
        args: { productId: "studio" },
      });
      demoSessions.reply(session, command!.id, { total: 1290 });
      expect((await pending).content[0]).toMatchObject({
        text: '{"total":1290}',
      });
      const invalid = await client.callTool({
        name: "set_coffee_cart",
        arguments: { productId: "arbitrary" },
      });
      expect(invalid.isError).toBe(true);
    } finally {
      demoSessions.close(session);
      await client.close();
    }
  });
