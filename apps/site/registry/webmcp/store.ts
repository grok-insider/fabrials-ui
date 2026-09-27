import {
  errorMessage,
  type Execution,
  type Support,
  type WebTool,
} from "@/registry/mcp/types";
import { validateArguments } from "@/registry/mcp/schema";
export interface NativeContext {
  registerTool(
    tool: object,
    options?: { signal: AbortSignal },
  ): void | Promise<void>;
  unregisterTool?: (name: string) => void;
}
export function detectWebMCP(): { support: Support; context?: NativeContext } {
  if (typeof document === "undefined") return { support: "checking" };
  const modern = (document as Document & { modelContext?: NativeContext })
    .modelContext;
  if (modern?.registerTool) return { support: "native", context: modern };
  const legacy = (navigator as Navigator & { modelContext?: NativeContext })
    .modelContext;
  return legacy?.registerTool
    ? { support: "legacy", context: legacy }
    : { support: "unsupported" };
}
export class WebMCPStore {
  private tools = new Map<string, WebTool>();
  private listeners = new Set<() => void>();
  private active = new Map<string, AbortController>();
  private snapshot: {
    tools: WebTool[];
    executions: Execution[];
    support: Support;
    error?: string;
  } = { tools: [], executions: [], support: "checking" };
  subscribe = (callback: () => void) => {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  };
  getSnapshot = () => this.snapshot;
  private emit(patch: Partial<typeof this.snapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((fn) => fn());
  }
  detect() {
    this.emit({ support: detectWebMCP().support });
  }
  register(tool: WebTool) {
    if (this.tools.has(tool.name))
      throw new Error(`Duplicate WebMCP tool: ${tool.name}`);
    this.tools.set(tool.name, tool);
    this.emit({ tools: [...this.tools.values()] });
    const lifecycle = new AbortController();
    const { context, support } = detectWebMCP();
    const exposed = {
      name: tool.name,
      title: tool.title,
      description: tool.description ?? tool.name,
      inputSchema: tool.inputSchema,
      annotations: {
        readOnlyHint: tool.annotations?.readOnlyHint,
        untrustedContentHint: tool.annotations?.untrustedContentHint,
        consequentialHint: tool.annotations?.consequentialHint,
      },
      execute: (
        args: Record<string, unknown>,
        options?: { signal?: AbortSignal },
      ) => this.run(tool.name, args, "agent", options?.signal),
    };
    try {
      Promise.resolve(
        context?.registerTool(exposed, { signal: lifecycle.signal }),
      ).catch((error) => {
        if (!lifecycle.signal.aborted)
          this.emit({ error: errorMessage(error) });
      });
    } catch (error) {
      this.emit({ error: errorMessage(error) });
    }
    return () => {
      lifecycle.abort();
      if (support === "legacy") context?.unregisterTool?.(tool.name);
      for (const execution of this.snapshot.executions)
        if (execution.name === tool.name)
          this.active.get(execution.id)?.abort();
      this.tools.delete(tool.name);
      this.emit({ tools: [...this.tools.values()] });
    };
  }
  async run(
    name: string,
    args: Record<string, unknown>,
    source: Execution["source"] = "human",
    signal?: AbortSignal,
  ) {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Tool unavailable: ${name}`);
    const invalid = validateArguments(tool.inputSchema, args);
    if (invalid) throw new Error(invalid);
    const id = crypto.randomUUID();
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) abort();
    else signal?.addEventListener("abort", abort, { once: true });
    this.active.set(id, controller);
    this.emit({
      executions: [
        {
          id,
          name,
          args,
          source,
          status: "running" as const,
          startedAt: Date.now(),
        },
        ...this.snapshot.executions,
      ].slice(0, 100),
    });
    const update = (patch: Partial<Execution>) =>
      this.emit({
        executions: this.snapshot.executions.map((e) =>
          e.id === id ? { ...e, ...patch, completedAt: Date.now() } : e,
        ),
      });
    try {
      controller.signal.throwIfAborted();
      const result = await tool.execute(args, {
        signal: controller.signal,
        source,
      });
      controller.signal.throwIfAborted();
      update({ status: "success", result });
      return result;
    } catch (error) {
      update({
        status: controller.signal.aborted ? "cancelled" : "error",
        error: errorMessage(error),
      });
      throw error;
    } finally {
      this.active.delete(id);
      signal?.removeEventListener("abort", abort);
    }
  }
  cancel = (id: string) => this.active.get(id)?.abort();
  clearHistory = () =>
    this.emit({
      executions: this.snapshot.executions.filter(
        (e) => e.status === "running",
      ),
    });
}
