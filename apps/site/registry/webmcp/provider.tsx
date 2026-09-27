"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { WebMCPStore } from "@/registry/webmcp/store";
import type { WebTool } from "@/registry/mcp/types";
const Context = createContext<WebMCPStore | null>(null);
export function WebMCPProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => new WebMCPStore());
  useEffect(() => store.detect(), [store]);
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useWebMCP() {
  const store = useContext(Context);
  if (!store) throw new Error("Wrap this component in WebMCPProvider.");
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  return {
    ...snapshot,
    run: store.run.bind(store),
    cancel: store.cancel,
    clearHistory: store.clearHistory,
  };
}
export function useWebMCPTool(tool: WebTool, enabled = true) {
  const store = useContext(Context);
  if (!store) throw new Error("Wrap this component in WebMCPProvider.");
  const latest = useRef(tool.execute);
  useEffect(() => {
    latest.current = tool.execute;
  }, [tool.execute]);
  const metadata = JSON.stringify({
    name: tool.name,
    title: tool.title,
    description: tool.description,
    inputSchema: tool.inputSchema,
    annotations: tool.annotations,
  });
  useEffect(() => {
    if (!enabled) return;
    return store.register({
      ...JSON.parse(metadata),
      execute: (args, context) => latest.current(args, context),
    });
  }, [store, metadata, enabled]);
}
