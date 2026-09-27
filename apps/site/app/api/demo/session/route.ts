import {
  allowedOrigin,
  demoSessions,
  privateJson,
} from "@/lib/live-demo-sessions";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (!allowedOrigin(request) || !request.headers.get("origin"))
    return privateJson({ error: "Open a session from the demo page." }, 403);
  try {
    return privateJson(demoSessions.create(), 201);
  } catch {
    return privateJson({ error: "Demo is busy. Try again shortly." }, 429);
  }
}
