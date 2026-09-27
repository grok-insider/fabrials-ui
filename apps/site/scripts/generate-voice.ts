import { mkdir, writeFile, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { narration } from "../video/remotion/script";
const key = process.env.AI_RELAY_VIRTUAL_KEY;
if (!key)
  throw new Error(
    "Set AI_RELAY_VIRTUAL_KEY. Requests go through ai.fabrials.com.",
  );
const folder = "artifacts/remotion-public";
await mkdir(folder, { recursive: true });
const timings = [];
let from = 0;
for (const [index, scene] of narration.entries()) {
  const params = {
    text: scene.text,
    voice_id: "eve",
    language: "en",
    speed: 1.0,
    with_timestamps: true,
    output_format: { codec: "mp3", sample_rate: 44100, bit_rate: 192000 },
    replace: { Fabrials: "/ˈfæbriəlz/", UI: "U I", MCP: "M C P" },
  };
  const fingerprint = createHash("sha256")
    .update(JSON.stringify(params))
    .digest("hex");
  const file = `${folder}/voice-${index}.mp3`;
  let cached = false;
  try {
    cached = (await readFile(`${file}.sha256`, "utf8")) === fingerprint;
  } catch {}
  if (!cached) {
    const response = await fetch("https://ai.fabrials.com/v1/tts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "User-Agent": "Fabrials-UI-Video/2.0",
      },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(90000),
    });
    if (!response.ok)
      throw new Error(
        `Relay TTS failed (${response.status}): ${(await response.text()).slice(0, 160)}`,
      );
    const payload = await response.json();
    if (!payload.audio || !payload.audio_timestamps?.graph_times)
      throw new Error("Missing Grok audio alignment");
    const bytes = Buffer.from(payload.audio, "base64");
    await writeFile(
      `${file}.alignment.json`,
      JSON.stringify(payload.audio_timestamps),
    );
    await writeFile(file, bytes);
    await writeFile(`${file}.sha256`, fingerprint);
  }
  const duration = Number(
    execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=nw=1:nk=1",
        file,
      ],
      { encoding: "utf8" },
    ),
  );
  const frames = Math.ceil((duration + 1.1) * 30);
  timings.push({
    id: scene.id,
    from,
    frames,
    speechSeconds: duration,
    audio: `voice-${index}.mp3`,
  });
  from += frames;
  console.log(`${scene.id}: ${duration.toFixed(2)} seconds via Grok TTS`);
}
await writeFile(
  "video/remotion/timing.json",
  JSON.stringify(
    { fps: 30, durationInFrames: from, scenes: timings },
    null,
    2,
  ) + "\n",
);
console.log(`Timeline: ${(from / 30).toFixed(2)} seconds`);
