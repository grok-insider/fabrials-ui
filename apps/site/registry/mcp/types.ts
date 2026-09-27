export type JsonSchema =
  | boolean
  | {
      [key: string]: unknown;
      type?: string | string[];
      properties?: Record<string, JsonSchema>;
      required?: string[];
      enum?: unknown[];
      description?: string;
      title?: string;
      items?: JsonSchema;
    };
export interface ToolDefinition {
  name: string;
  title?: string;
  description?: string;
  inputSchema: JsonSchema;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    untrustedContentHint?: boolean;
    consequentialHint?: boolean;
    [key: string]: unknown;
  };
}
export interface Execution {
  id: string;
  name: string;
  source: "human" | "agent" | "simulator";
  status: "running" | "success" | "error" | "cancelled";
  startedAt: number;
  completedAt?: number;
  args: Record<string, unknown>;
  result?: unknown;
  error?: string;
  progress?: { progress: number; total?: number; message?: string };
}
export type Support = "checking" | "native" | "legacy" | "unsupported";
export interface ToolContext {
  signal: AbortSignal;
  source: Execution["source"];
}
export interface WebTool extends ToolDefinition {
  execute: (
    args: Record<string, unknown>,
    context: ToolContext,
  ) => unknown | Promise<unknown>;
}
export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The operation failed.";
}
