/** Node-only adapter. Install this on your own authenticated backend. */
import { lookup } from "node:dns/promises";
import { Agent, fetch as nodeFetch } from "undici";
import ipaddr from "ipaddr.js";
export interface ConnectorDestination {
  endpoint: string;
}
export interface ConnectorOptions {
  destinations: Record<string, ConnectorDestination>;
  allowedOrigins: string[];
  authenticate: (request: Request) => Promise<{ id: string } | null>;
  credentials?: (
    userId: string,
    destination: string,
  ) => Promise<{ accessToken?: string }>;
}
export function isPublicAddress(address: string): boolean {
  try {
    let ip = ipaddr.parse(address);
    if (ip.kind() === "ipv6" && (ip as ipaddr.IPv6).isIPv4MappedAddress())
      ip = (ip as ipaddr.IPv6).toIPv4Address();
    return ip.range() === "unicast";
  } catch {
    return false;
  }
}
export async function resolveDestination(endpoint: string) {
  const url = new URL(endpoint);
  if (url.protocol !== "https:" || url.username || url.password || url.hash)
    throw new Error(
      "Connector destinations must use HTTPS without embedded credentials.",
    );
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some((a) => !isPublicAddress(a.address)))
    throw new Error("Private, loopback and reserved destinations are blocked.");
  return { url, addresses };
}
async function limitedBody(request: Request): Promise<string | undefined> {
  if (request.method !== "POST") return;
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing request body.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1_048_576) {
        await reader.cancel();
        throw new Error("Request exceeds 1 MiB.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks).toString("utf8");
}
export function createConnector(options: ConnectorOptions) {
  // Legacy server session IDs are partitioned by authenticated user and destination.
  const sessions = new Map<string, { remote: string; expires: number }>();
  return async function handle(
    request: Request,
    destinationId: string,
  ): Promise<Response> {
    const origin = request.headers.get("origin");
    if (!origin || !options.allowedOrigins.includes(origin))
      return new Response("Origin not allowed", { status: 403 });
    const user = await options.authenticate(request);
    if (!user) return new Response("Authentication required", { status: 401 });
    const destination = options.destinations[destinationId];
    if (!destination)
      return new Response("Unknown destination", { status: 404 });
    if (!["POST", "GET", "DELETE"].includes(request.method))
      return new Response("Method not allowed", { status: 405 });
    if (
      request.method === "POST" &&
      !request.headers.get("content-type")?.startsWith("application/json")
    )
      return new Response("Expected application/json", { status: 415 });
    for (const [key, value] of sessions)
      if (value.expires < Date.now()) sessions.delete(key);
    if (sessions.size > 1000)
      return new Response("Connector at capacity", { status: 503 });
    let dispatcher: Agent | undefined;
    try {
      const { url, addresses } = await resolveDestination(destination.endpoint);
      // Pin the validated DNS answer for this connection, avoiding a second DNS lookup.
      dispatcher = new Agent({
        connect: {
          lookup: (_hostname, _opts, callback) => {
            const address = addresses[0];
            if (_opts.all) callback(null, addresses);
            else callback(null, address.address, address.family);
          },
        },
      });
      const body = await limitedBody(request);
      const headers = new Headers({
        Accept: "application/json, text/event-stream",
      });
      if (body !== undefined) headers.set("Content-Type", "application/json");
      for (const [name, value] of request.headers)
        if (
          ["mcp-protocol-version", "mcp-method", "mcp-name"].includes(name) ||
          name.startsWith("mcp-param-")
        )
          headers.set(name, value);
      const key = JSON.stringify([user.id, destinationId]);
      const existing = sessions.get(key);
      if (existing) headers.set("mcp-session-id", existing.remote);
      const credentials = await options.credentials?.(user.id, destinationId);
      if (credentials?.accessToken)
        headers.set("Authorization", `Bearer ${credentials.accessToken}`);
      const upstream = await nodeFetch(url, {
        method: request.method,
        headers,
        body,
        redirect: "manual",
        dispatcher,
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(120_000)]),
      });
      if (upstream.status >= 300 && upstream.status < 400) {
        await upstream.body?.cancel();
        await dispatcher.close();
        return new Response("Redirected destinations are not allowed", {
          status: 502,
        });
      }
      const session = upstream.headers.get("mcp-session-id");
      if (session)
        sessions.set(key, {
          remote: session,
          expires: Date.now() + 30 * 60_000,
        });
      if (request.method === "DELETE") sessions.delete(key);
      const responseHeaders = new Headers({ "Cache-Control": "no-store" });
      for (const name of [
        "content-type",
        "mcp-protocol-version",
        "retry-after",
      ]) {
        const value = upstream.headers.get(name);
        if (value) responseHeaders.set(name, value);
      }
      // The browser receives no upstream session IDs or OAuth challenges containing private URLs.
      if (!upstream.body) {
        await dispatcher.close();
        return new Response(null, {
          status: upstream.status,
          headers: responseHeaders,
        });
      }
      const reader = upstream.body.getReader();
      const agent = dispatcher;
      const stream = new ReadableStream<Uint8Array>({
        async pull(controller) {
          try {
            const { value, done } = await reader.read();
            if (done) {
              controller.close();
              await agent.close();
            } else controller.enqueue(value);
          } catch (error) {
            controller.error(error);
            await agent.close();
          }
        },
        async cancel() {
          await reader.cancel();
          await agent.close();
        },
      });
      return new Response(stream, {
        status: upstream.status,
        headers: responseHeaders,
      });
    } catch {
      await dispatcher?.close();
      return new Response("Upstream unavailable or destination blocked", {
        status: 502,
      });
    }
  };
}
