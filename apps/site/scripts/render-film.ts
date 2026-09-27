import { execFileSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import {
  selectComposition,
  renderMedia,
  renderStill,
} from "@remotion/renderer";
import "./generate-captions";
import { mkdir, copyFile } from "node:fs/promises";
import { resolve } from "node:path";
const browserExecutable = process.env.CHROME_BIN;
if (!browserExecutable)
  throw new Error("Set CHROME_BIN to the actual Chrome binary.");
await copyFile(
  "public/fonts/IBMPlexSans.woff2",
  "artifacts/remotion-public/IBMPlexSans.woff2",
);
const serveUrl = await bundle({
  entryPoint: resolve("video/remotion/index.tsx"),
  publicDir: resolve("artifacts/remotion-public"),
  outDir: resolve("artifacts/remotion-bundle"),
});
const composition = await selectComposition({
  serveUrl,
  id: "FabrialsFilm",
  browserExecutable,
});
await mkdir("artifacts/remotion-film", { recursive: true });
const frames = process.env.PREVIEW_FRAMES?.split(",").map(Number);
if (frames) {
  for (const frame of frames) {
    await renderStill({
      serveUrl,
      composition,
      browserExecutable,
      frame,
      output: resolve(`artifacts/remotion-film/frame-${frame}.png`),
    });
    console.log(`Preview ${frame}`);
  }
} else {
  let last = -1;
  await renderMedia({
    serveUrl,
    composition,
    browserExecutable,
    codec: "h264",
    audioCodec: "aac",
    audioBitrate: "192k",
    crf: 18,
    x264Preset: "fast",
    pixelFormat: "yuv420p",
    concurrency: 4,
    outputLocation: resolve("artifacts/remotion-film/demo.mp4"),
    onProgress: (p) => {
      const progress = Math.floor(p.progress * 10) * 10;
      if (progress !== last) {
        last = progress;
        console.log(`Render ${progress}%`);
      }
    },
  });
  await renderStill({
    serveUrl,
    composition,
    browserExecutable,
    frame: 90,
    output: resolve("artifacts/remotion-film/poster.jpg"),
    imageFormat: "jpeg",
  });
  execFileSync("ffmpeg", [
    "-v",
    "error",
    "-i",
    "artifacts/remotion-film/demo.mp4",
    "-vn",
    "-c:a",
    "copy",
    "-movflags",
    "+faststart",
    "-y",
    "artifacts/remotion-film/demo-audio.m4a",
  ]);
  await import("./prepare-landing-audio");
  console.log("Remotion film complete");
}
