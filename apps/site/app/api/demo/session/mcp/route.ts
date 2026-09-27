import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";
import { z } from "zod";
import {
  allowedOrigin,
  bearer,
  demoSessions,
  privateJson,
  smallJson,
} from "@/lib/live-demo-sessions";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
export async function POST(request: Request) {
  if (!allowedOrigin(request))
    return privateJson({ error: "Origin not allowed." }, 403);
  const session = demoSessions.find(bearer(request), "client");
  if (!session)
    return privateJson(
      { error: "Connect from the demo page and use its current bearer token." },
      401,
    );
  let body;
  try {
    body = await smallJson(request);
  } catch {
    return privateJson({ error: "Invalid request." }, 400);
  }
  const handler = createMcpHandler(
    () => {
      const server = new McpServer(
        { name: "fabrials-live-coffee", version: "0.1.0" },
        {
          supportedProtocolVersions: ["2026-07-28", "2025-11-25"],
          capabilities: { tools: {} },
        },
      );
      const register = (
        name: string,
        description: string,
        inputSchema: z.ZodObject,
      ) =>
        server.registerTool(
          name,
          { description, inputSchema },
          async (args) => {
            try {
              const result = await demoSessions.call(
                session,
                name,
                args as Record<string, unknown>,
              );
              return {
                content: [
                  { type: "text" as const, text: JSON.stringify(result) },
                ],
              };
            } catch (e) {
              return {
                isError: true,
                content: [
                  {
                    type: "text" as const,
                    text: e instanceof Error ? e.message : "Action failed",
                  },
                ],
              };
            }
          },
        );
      register(
        "get_coffee_state",
        "Read the current visible comparison, constraints and cart in the connected visitor's tab.",
        z.object({}),
      );
      register(
        "compare_coffee_machines",
        "Compare fictional machines against available space and accessories. Highlights evidence in the visitor's tab.",
        z.object({
          maxWidth: z.number().min(20).max(100),
          fitting: z.enum(["58 mm", "54 mm"]),
        }),
      );
      register(
        "set_coffee_cart",
        "Choose one fictional machine, or clear the cart with an empty productId. No order or payment.",
        z.object({ productId: z.enum(["studio", "atelier", ""]) }),
      );
      register(
        "set_coffee_filter",
        "Add or remove the compatible filter. Requires a selected machine.",
        z.object({ included: z.boolean() }),
      );
      register(
        "review_coffee_cart",
        "Open human review in the tab. Requires a selected machine. Only the human can save; no purchase is made.",
        z.object({}),
      );
      return server;
    },
    { legacy: "stateless", responseMode: "auto" },
  );
  const response = await handler.fetch(
    new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify(body),
      signal: request.signal,
    }),
  );
  response.headers.set("Cache-Control", "no-store");
  return response;
}
export async function GET(request: Request) {
  if (!allowedOrigin(request)) return privateJson({}, 403);
  if (!demoSessions.find(bearer(request), "client"))
    return privateJson({}, 401);
  return new Response(null, {
    status: 405,
    headers: { Allow: "POST", "Cache-Control": "no-store" },
  });
}
