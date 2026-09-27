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
export async function GET(request: Request) {
  if (!allowedOrigin(request)) return privateJson({}, 403);
  const s = demoSessions.find(bearer(request), "owner");
  if (!s) return privateJson({ error: "Session expired. Connect again." }, 410);
  try {
    return privateJson({ command: await demoSessions.poll(s, request.signal) });
  } catch {
    return privateJson({}, 409);
  }
}
export async function POST(request: Request) {
  if (!allowedOrigin(request)) return privateJson({}, 403);
  const s = demoSessions.find(bearer(request), "owner");
  if (!s) return privateJson({}, 410);
  try {
    const body = await smallJson(request);
    if (
      typeof body.id !== "string" ||
      (body.error !== undefined && typeof body.error !== "string")
    )
      return privateJson({}, 400);
    return privateJson({
      accepted: demoSessions.reply(s, body.id, body.result, body.error),
    });
  } catch {
    return privateJson({}, 400);
  }
}
export async function DELETE(request: Request) {
  if (!allowedOrigin(request)) return privateJson({}, 403);
  const s = demoSessions.find(bearer(request), "owner");
  if (s) demoSessions.close(s);
  return privateJson({ disconnected: true });
}
