import { createHash, createHmac } from "node:crypto";
export const demoAssets = {
  "landing-audio.m4a": {
    key: "videos/fabrials-ui/landing-v1/landing-audio.m4a",
    type: "audio/mp4",
  },
  "demo-audio.m4a": {
    key: "videos/fabrials-ui/v4/demo-audio.m4a",
    type: "audio/mp4",
  },
  "demo.mp4": { key: "videos/fabrials-ui/v4/demo.mp4", type: "video/mp4" },
  "poster.jpg": { key: "videos/fabrials-ui/v4/poster.jpg", type: "image/jpeg" },
  "transcript.vtt": {
    key: "videos/fabrials-ui/v4/transcript.vtt",
    type: "text/vtt; charset=utf-8",
  },
} as const;
export interface MediaConfig {
  endpoint: string;
  bucket: string;
  region: string;
  accessKey: string;
  secretKey: string;
}
export function mediaConfig(): MediaConfig | null {
  const { S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY } = process.env;
  return S3_ENDPOINT && S3_ACCESS_KEY && S3_SECRET_KEY
    ? {
        endpoint: S3_ENDPOINT,
        accessKey: S3_ACCESS_KEY,
        secretKey: S3_SECRET_KEY,
        bucket: process.env.S3_BUCKET || "apps",
        region: process.env.S3_REGION || "garage",
      }
    : null;
}
const hash = (s: string | Buffer) =>
  createHash("sha256").update(s).digest("hex");
const hmac = (k: string | Buffer, s: string) =>
  createHmac("sha256", k).update(s).digest();
export function signMediaRequest(
  config: MediaConfig,
  key: string,
  method: "GET" | "HEAD" | "PUT",
  body?: Buffer,
) {
  const url = new URL(config.endpoint);
  url.pathname = `/${config.bucket}/${key}`;
  const date = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const headers: Record<string, string> = {
    host: url.host,
    "x-amz-date": date,
    "x-amz-content-sha256": hash(body || ""),
  };
  const names = Object.keys(headers).sort();
  const scope = `${date.slice(0, 8)}/${config.region}/s3/aws4_request`;
  const canonical = [
    method,
    url.pathname,
    "",
    names.map((n) => `${n}:${headers[n]}\n`).join(""),
    names.join(";"),
    headers["x-amz-content-sha256"],
  ].join("\n");
  const signing = hmac(
    hmac(
      hmac(hmac(`AWS4${config.secretKey}`, date.slice(0, 8)), config.region),
      "s3",
    ),
    "aws4_request",
  );
  const signature = createHmac("sha256", signing)
    .update(["AWS4-HMAC-SHA256", date, scope, hash(canonical)].join("\n"))
    .digest("hex");
  headers.authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKey}/${scope}, SignedHeaders=${names.join(";")}, Signature=${signature}`;
  return { url, headers };
}
export async function serveDemoMedia(request: Request, asset: string) {
  if (!Object.hasOwn(demoAssets, asset))
    return new Response(null, { status: 404 });
  const config = mediaConfig();
  if (!config) return new Response("Demo media unavailable", { status: 503 });
  const range = request.headers.get("range");
  if (range && !/^bytes=(?:\d+-\d*|-\d+)$/.test(range))
    return new Response(null, { status: 416 });
  const entry = demoAssets[asset as keyof typeof demoAssets];
  const signed = signMediaRequest(
    config,
    entry.key,
    request.method === "HEAD" ? "HEAD" : "GET",
  );
  if (range) signed.headers.range = range;
  try {
    const upstream = await fetch(signed.url, {
      method: request.method,
      headers: signed.headers,
      cache: "no-store",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(60000)]),
    });
    if (![200, 206, 416].includes(upstream.status)) {
      await upstream.body?.cancel();
      return new Response(null, {
        status: upstream.status === 404 ? 404 : 502,
      });
    }
    const headers = new Headers({
      "Content-Type": entry.type,
      "Accept-Ranges": "bytes",
      "Content-Encoding": "identity",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control":
        upstream.status === 416
          ? "no-store"
          : "public, max-age=86400, no-transform",
    });
    for (const key of [
      "content-length",
      "content-range",
      "etag",
      "last-modified",
    ]) {
      const value = upstream.headers.get(key);
      if (value) headers.set(key, value);
    }
    if (new URL(request.url).searchParams.has("download"))
      headers.set(
        "Content-Disposition",
        `attachment; filename="fabrials-ui-${asset}"`,
      );
    // rclone can return a valid partial body with HTTP 200; browsers need 206 for seeking.
    const partial =
      range &&
      /^bytes \d+-\d+\/\d+$/.test(upstream.headers.get("content-range") || "");
    return new Response(request.method === "HEAD" ? null : upstream.body, {
      status: partial && upstream.status === 200 ? 206 : upstream.status,
      headers,
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
