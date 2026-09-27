import { serveDemoMedia } from "@/lib/demo-media";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  context: { params: Promise<{ asset: string }> },
) {
  return serveDemoMedia(request, (await context.params).asset);
}
export const HEAD = GET;
