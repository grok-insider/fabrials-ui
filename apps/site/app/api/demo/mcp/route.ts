import { demoHandler } from "@/lib/demo-server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  return demoHandler.fetch(request);
}
export async function GET(request: Request) {
  return demoHandler.fetch(request);
}
export async function DELETE(request: Request) {
  return demoHandler.fetch(request);
}
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: { Allow: "POST, GET, DELETE, OPTIONS" },
  });
}
