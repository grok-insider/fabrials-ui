import { afterEach, expect, it, vi } from "vitest";
import { serveDemoMedia } from "@/lib/demo-media";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
function config() {
  vi.stubEnv("S3_ENDPOINT", "http://10.0.0.3:9000");
  vi.stubEnv("S3_ACCESS_KEY", "test");
  vi.stubEnv("S3_SECRET_KEY", "test");
}
it("rejects arbitrary keys and reports unconfigured media", async () => {
  vi.stubEnv("S3_ENDPOINT", "");
  expect(
    (await serveDemoMedia(new Request("https://ui.test/video"), "../secret"))
      .status,
  ).toBe(404);
  expect(
    (await serveDemoMedia(new Request("https://ui.test/video"), "demo.mp4"))
      .status,
  ).toBe(503);
});
it("streams ranges and preserves seeking and download headers", async () => {
  config();
  const upstream = vi.fn().mockResolvedValue(
    new Response(new Uint8Array([1, 2]), {
      status: 200,
      headers: { "content-range": "bytes 0-1/100", "content-length": "2" },
    }),
  );
  vi.stubGlobal("fetch", upstream);
  const response = await serveDemoMedia(
    new Request("https://ui.test/video?download=1", {
      headers: { range: "bytes=0-1" },
    }),
    "demo.mp4",
  );
  expect(response.status).toBe(206);
  expect(response.headers.get("content-encoding")).toBe("identity");
  expect(response.headers.get("cache-control")).toContain("no-transform");
  expect(response.headers.get("content-range")).toBe("bytes 0-1/100");
  expect(response.headers.get("content-disposition")).toContain("attachment");
  expect((await response.arrayBuffer()).byteLength).toBe(2);
  expect(upstream.mock.calls[0][1].headers.range).toBe("bytes=0-1");
  expect(upstream.mock.calls[0][0].pathname).toBe(
    "/apps/videos/fabrials-ui/v4/demo.mp4",
  );
});
it("supports HEAD and rejects malformed ranges before fetching", async () => {
  config();
  const upstream = vi
    .fn()
    .mockResolvedValue(
      new Response(null, { headers: { "content-length": "100" } }),
    );
  vi.stubGlobal("fetch", upstream);
  const head = await serveDemoMedia(
    new Request("https://ui.test/video", { method: "HEAD" }),
    "demo.mp4",
  );
  expect(head.body).toBeNull();
  expect(head.headers.get("content-length")).toBe("100");
  expect(
    (
      await serveDemoMedia(
        new Request("https://ui.test/video", {
          headers: { range: "bytes=0-1,4-5" },
        }),
        "demo.mp4",
      )
    ).status,
  ).toBe(416);
  expect(upstream).toHaveBeenCalledTimes(1);
});
it("returns a recoverable error if storage fails", async () => {
  config();
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  expect(
    (await serveDemoMedia(new Request("https://ui.test/video"), "demo.mp4"))
      .status,
  ).toBe(502);
});
