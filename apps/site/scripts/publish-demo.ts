import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { demoAssets, mediaConfig, signMediaRequest } from "../lib/demo-media";
const config = mediaConfig();
if (!config) throw new Error("S3_* environment variables are required.");
const directory = resolve(
  process.env.VIDEO_OUTPUT || "artifacts/remotion-film",
);
const assets: Record<string, { key: string; type: string }> = { ...demoAssets };
if (process.env.PUBLISH_SOURCES === "1") {
  for (const name of [
    ...Array.from({ length: 6 }, (_, i) => `voice-${i}.mp3`),
    "music.wav",
    ...Array.from({ length: 6 }, (_, i) => `voice-${i}.mp3.alignment.json`),
  ]) {
    assets[`../remotion-public/${name}`] = {
      key: `videos/fabrials-ui/v4/source/${name}`,
      type: name.endsWith("json")
        ? "application/json"
        : name.endsWith("mp3")
          ? "audio/mpeg"
          : "audio/wav",
    };
  }
}
for (const [name, entry] of Object.entries(assets)) {
  if (process.env.PUBLISH_ASSET && name !== process.env.PUBLISH_ASSET) continue;
  const body = await readFile(`${directory}/${name}`);
  const signed = signMediaRequest(config, entry.key, "PUT", body);
  const response = await fetch(signed.url, {
    method: "PUT",
    headers: { ...signed.headers, "Content-Type": entry.type },
    body: new Uint8Array(body),
    signal: AbortSignal.timeout(120000),
  });
  if (!response.ok)
    throw new Error(`Upload failed: ${name} (${response.status})`);
  const check = signMediaRequest(config, entry.key, "HEAD");
  const verification = await fetch(check.url, {
    method: "HEAD",
    headers: check.headers,
  });
  if (
    !verification.ok ||
    Number(verification.headers.get("content-length")) !== body.length
  )
    throw new Error(`Verification failed: ${name}`);
  console.log(`Published ${name}: ${body.length} bytes`);
}
