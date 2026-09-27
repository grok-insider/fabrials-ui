"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  Client,
  Tool,
  Resource,
  ResourceTemplateType,
  Prompt,
  ServerCapabilities,
  ElicitRequestParams,
  ElicitResult,
} from "@modelcontextprotocol/client";
import { createMCPClient, type ConnectionOptions } from "@/registry/mcp/client";
import { errorMessage, type Execution } from "@/registry/mcp/types";
export interface Elicitation {
  id: string;
  params: ElicitRequestParams;
  respond: (result: ElicitResult) => void;
}
function useConnection() {
  const clientRef = useRef<Client | null>(null);
  const generation = useRef(0);
  const active = useRef(new Map<string, AbortController>());
  const pendingInputs = useRef(
    new Map<string, (result: ElicitResult) => void>(),
  );
  const [status, setStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [error, setError] = useState("");
  const [tools, setTools] = useState<Tool[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [templates, setTemplates] = useState<ResourceTemplateType[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [capabilities, setCapabilities] = useState<ServerCapabilities>({});
  const [protocol, setProtocol] = useState("");
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [elicitations, setElicitations] = useState<Elicitation[]>([]);
  const disconnect = useCallback(async () => {
    generation.current++;
    active.current.forEach((c) => c.abort());
    active.current.clear();
    pendingInputs.current.forEach((resolve) => resolve({ action: "cancel" }));
    pendingInputs.current.clear();
    const old = clientRef.current;
    clientRef.current = null;
    setStatus("disconnected");
    setTools([]);
    setPrompts([]);
    setResources([]);
    setTemplates([]);
    setCapabilities({});
    setProtocol("");
    setElicitations([]);
    setExecutions([]);
    setError("");
    await old?.close();
  }, []);
  const refresh = useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;
    const [t, r, p, rt] = await Promise.all([
      client.listTools(),
      client.listResources(),
      client.listPrompts(),
      client.listResourceTemplates(),
    ]);
    if (clientRef.current !== client) return;
    setTools(t.tools);
    setResources(r.resources);
    setPrompts(p.prompts);
    setTemplates(rt.resourceTemplates);
  }, []);
  const connect = useCallback(
    async (options: ConnectionOptions, callback?: URLSearchParams) => {
      await disconnect();
      const current = ++generation.current;
      setStatus("connecting");
      const belongs = () => generation.current === current;
      try {
        const { client, transport } = createMCPClient(options, {
          listChanged: {
            tools: {
              onChanged: (e, values) => {
                if (belongs()) {
                  if (e) setError(errorMessage(e));
                  else setTools(values ?? []);
                }
              },
            },
            prompts: {
              onChanged: (e, values) => {
                if (belongs()) {
                  if (e) setError(errorMessage(e));
                  else setPrompts(values ?? []);
                }
              },
            },
            resources: {
              onChanged: (e, values) => {
                if (belongs()) {
                  if (e) setError(errorMessage(e));
                  else setResources(values ?? []);
                }
              },
            },
          },
        });
        clientRef.current = client;
        client.setRequestHandler(
          "elicitation/create",
          (request, context) =>
            new Promise<ElicitResult>((resolve) => {
              const id = crypto.randomUUID();
              const respond = (result: ElicitResult) => {
                context.mcpReq.signal.removeEventListener("abort", abort);
                pendingInputs.current.delete(id);
                setElicitations((items) => items.filter((x) => x.id !== id));
                resolve(result);
              };
              const abort = () => respond({ action: "cancel" });
              if (context.mcpReq.signal.aborted) return abort();
              context.mcpReq.signal.addEventListener("abort", abort, {
                once: true,
              });
              pendingInputs.current.set(id, respond);
              setElicitations((items) => [
                ...items,
                { id, params: request.params, respond },
              ]);
            }),
        );
        client.onerror = (e) => {
          if (belongs()) setError(errorMessage(e));
        };
        client.onclose = () => {
          if (belongs()) {
            setStatus("disconnected");
            active.current.forEach((c) => c.abort());
            pendingInputs.current.forEach((resolve) =>
              resolve({ action: "cancel" }),
            );
          }
        };
        if (callback) await transport.finishAuth(callback);
        await client.connect(transport);
        if (!belongs()) {
          await client.close();
          return;
        }
        setCapabilities(client.getServerCapabilities() ?? {});
        setProtocol(client.getNegotiatedProtocolVersion() ?? "");
        await refresh();
        if (belongs()) setStatus("connected");
      } catch (e) {
        if (belongs()) {
          const failed = clientRef.current;
          clientRef.current = null;
          await failed?.close().catch(() => {});
          setError(errorMessage(e));
          setStatus("error");
        }
      }
    },
    [disconnect, refresh],
  );
  const run = useCallback(
    async (name: string, args: Record<string, unknown>) => {
      const client = clientRef.current;
      if (!client || status !== "connected")
        throw new Error("Connect to a server first.");
      const id = crypto.randomUUID();
      const controller = new AbortController();
      active.current.set(id, controller);
      setExecutions((items) =>
        [
          {
            id,
            name,
            args,
            source: "human" as const,
            status: "running" as const,
            startedAt: Date.now(),
          },
          ...items,
        ].slice(0, 100),
      );
      const update = (patch: Partial<Execution>) =>
        setExecutions((items) =>
          items.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        );
      try {
        const result = await client.callTool(
          { name, arguments: args },
          {
            signal: controller.signal,
            timeout: 120_000,
            onprogress: (progress) => update({ progress }),
          },
        );
        update({
          status: result.isError ? "error" : "success",
          result,
          completedAt: Date.now(),
        });
        return result;
      } catch (e) {
        update({
          status: controller.signal.aborted ? "cancelled" : "error",
          error: errorMessage(e),
          completedAt: Date.now(),
        });
        throw e;
      } finally {
        active.current.delete(id);
      }
    },
    [status],
  );
  useEffect(
    () => () => {
      generation.current++;
      active.current.forEach((c) => c.abort());
      pendingInputs.current.forEach((resolve) => resolve({ action: "cancel" }));
      void clientRef.current?.close();
    },
    [],
  );
  return {
    status,
    error,
    tools,
    resources,
    templates,
    prompts,
    capabilities,
    protocol,
    executions,
    elicitations,
    connect,
    disconnect,
    refresh,
    run,
    cancel: (id: string) => active.current.get(id)?.abort(),
    clearHistory: () =>
      setExecutions((items) => items.filter((e) => e.status === "running")),
    readResource: async (uri: string) => {
      if (!clientRef.current) throw new Error("Not connected.");
      return clientRef.current.readResource({ uri });
    },
    getPrompt: async (name: string, args: Record<string, string>) => {
      if (!clientRef.current) throw new Error("Not connected.");
      return clientRef.current.getPrompt({ name, arguments: args });
    },
  };
}
const Context = createContext<ReturnType<typeof useConnection> | null>(null);
export function MCPProvider({ children }: { children: ReactNode }) {
  const value = useConnection();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useMCPClient() {
  const value = useContext(Context);
  if (!value) throw new Error("Wrap this component in MCPProvider.");
  return value;
}
