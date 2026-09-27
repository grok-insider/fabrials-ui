// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { WebMCPStore } from "@/registry/webmcp/store";
import { validateArguments } from "@/registry/mcp/schema";
afterEach(() => {
  Reflect.deleteProperty(document, "modelContext");
});
describe("WebMCP lifecycle and shared logic", () => {
  it("keeps human and simulator state in sync without browser support", async () => {
    const store = new WebMCPStore();
    let value = "";
    store.detect();
    expect(store.getSnapshot().support).toBe("unsupported");
    const remove = store.register({
      name: "search",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
      execute: (args) => {
        value = String(args.query);
        return value;
      },
    });
    await store.run("search", { query: "human" });
    expect(value).toBe("human");
    await store.run("search", { query: "agent" }, "simulator");
    expect(value).toBe("agent");
    expect(store.getSnapshot().executions[0].source).toBe("simulator");
    await expect(store.run("search", { query: 4 })).rejects.toThrow();
    expect(value).toBe("agent");
    remove();
    expect(store.getSnapshot().tools).toHaveLength(0);
  });
  it("aborts native registrations and permits a strict-mode remount", () => {
    const signals: AbortSignal[] = [];
    const registerTool = vi.fn(
      (_tool: object, options: { signal: AbortSignal }) => {
        signals.push(options.signal);
      },
    );
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: { registerTool },
    });
    const store = new WebMCPStore();
    const tool = {
      name: "test",
      inputSchema: { type: "object" },
      execute: () => ({ ok: true }),
    };
    const first = store.register(tool);
    expect(() => store.register(tool)).toThrow("Duplicate");
    first();
    expect(signals[0].aborted).toBe(true);
    const second = store.register(tool);
    expect(signals[1].aborted).toBe(false);
    second();
  });
  it("uses the agent callback with its source and signal", async () => {
    let callback: (
      args: Record<string, unknown>,
      options: { signal: AbortSignal },
    ) => Promise<unknown> = async () => undefined;
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        registerTool: (tool: { execute: typeof callback }) => {
          callback = tool.execute;
        },
      },
    });
    const store = new WebMCPStore();
    store.register({
      name: "agent",
      inputSchema: { type: "object" },
      execute: (_args, ctx) => ({ source: ctx.source }),
    });
    expect(
      await callback({}, { signal: new AbortController().signal }),
    ).toEqual({ source: "agent" });
    expect(store.getSnapshot().executions[0].source).toBe("agent");
  });
  it("validates compositions instead of silently accepting unsupported schemas", () => {
    expect(
      validateArguments(
        {
          type: "object",
          properties: {
            value: {
              oneOf: [{ type: "integer" }, { type: "string", minLength: 3 }],
            },
          },
          required: ["value"],
        },
        { value: "a" },
      ),
    ).toBeTruthy();
    expect(
      validateArguments({ $ref: "https://example.com/schema" }, {}),
    ).toContain("cannot be validated");
  });
});
