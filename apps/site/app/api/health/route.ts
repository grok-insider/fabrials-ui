export function GET() {
  return Response.json({
    status: "ok",
    version: "0.1.0",
    protocol: "2026-07-28",
  });
}
