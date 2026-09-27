import {
  Client,
  StreamableHTTPClientTransport,
  type OAuthClientProvider,
  type ClientOptions,
} from "@modelcontextprotocol/client";
export const MCP_PROTOCOL_VERSION = "2026-07-28";
export interface ConnectionOptions {
  endpoint: string;
  token?: string;
  oauth?: OAuthClientProvider;
  protocol?: "auto" | "current" | "legacy";
  fetch?: typeof fetch;
}
export function createMCPClient(
  options: ConnectionOptions,
  handlers: Pick<ClientOptions, "listChanged"> = {},
) {
  const url = new URL(
    options.endpoint,
    typeof location !== "undefined" ? location.origin : undefined,
  );
  if (
    url.username ||
    url.password ||
    url.hash ||
    !["https:", "http:"].includes(url.protocol)
  )
    throw new Error(
      "Use an HTTP(S) endpoint without embedded credentials or a fragment.",
    );
  if (
    url.protocol === "http:" &&
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  )
    throw new Error("Remote connections require HTTPS.");
  const client = new Client(
    { name: "fabrials-webmcp", version: "0.1.0" },
    {
      ...handlers,
      capabilities: { elicitation: { form: {}, url: {} } },
      versionNegotiation: {
        mode:
          options.protocol === "legacy"
            ? "legacy"
            : options.protocol === "current"
              ? { pin: MCP_PROTOCOL_VERSION }
              : "auto",
        probe: { timeoutMs: 10_000, maxRetries: 0 },
      },
      inputRequired: { maxRounds: 8 },
      listMaxPages: 64,
    },
  );
  const transport = new StreamableHTTPClientTransport(url, {
    authProvider:
      options.oauth ??
      (options.token ? { token: async () => options.token! } : undefined),
    fetch: options.fetch,
    reconnectionOptions: {
      maxRetries: 0,
      maxReconnectionDelay: 0,
      initialReconnectionDelay: 0,
      reconnectionDelayGrowFactor: 1,
    },
  });
  return { client, transport };
}
