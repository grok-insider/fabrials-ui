import { writeFile, mkdir, readFile } from "node:fs/promises";
import { narration } from "../video/remotion/script";
import timing from "../video/remotion/timing.json";
const stamp = (seconds: number) =>
  new Date(seconds * 1000).toISOString().slice(11, 23);
let vtt = "WEBVTT\n\n";
const captions: { start: number; end: number; text: string }[] = [];
for (const [index, scene] of timing.scenes.entries()) {
  const alignment = JSON.parse(
    await readFile(
      `artifacts/remotion-public/voice-${index}.mp3.alignment.json`,
      "utf8",
    ),
  ) as { graph_chars: string[]; graph_times: [number, number][] };
  const graph = alignment.graph_chars.join("");
  let offset = 0;
  for (const sentence of narration[index].text.match(/[^.!?]+[.!?]+/g) || []) {
    const text = sentence.trim();
    const spoken = text
      .replaceAll("Fabrials", "/ˈfæbriəlz/")
      .replaceAll("UI", "U I")
      .replaceAll("MCP", "M C P");
    const at = graph.indexOf(spoken, offset);
    if (at < 0)
      throw Error(`Caption alignment mismatch in ${scene.id}: ${text}`);
    const start = scene.from / 30 + 0.5 + alignment.graph_times[at][0];
    const end =
      scene.from / 30 + 0.5 + alignment.graph_times[at + spoken.length - 1][1];
    captions.push({ start, end, text });
    vtt += `${stamp(start)} --> ${stamp(end)}\n${text}\n\n`;
    offset = at + spoken.length;
  }
}
await mkdir("artifacts/remotion-film", { recursive: true });
await writeFile(
  "video/remotion/captions.json",
  JSON.stringify(captions, null, 2) + "\n",
);
await writeFile("video/transcript.vtt", vtt.trimEnd() + "\n");
await writeFile("artifacts/remotion-film/transcript.vtt", vtt.trimEnd() + "\n");
