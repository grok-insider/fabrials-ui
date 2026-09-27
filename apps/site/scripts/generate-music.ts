import { writeFile, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import timing from "../video/remotion/timing.json";
// Original ambient score: no downloaded samples, copyrighted recordings, or vocals.
const rate = 48000;
const seconds = timing.durationInFrames / timing.fps;
const frames = Math.ceil(seconds * rate);
const samples = Buffer.alloc(frames * 4);
const chords = [
  [146.832, 220, 277.183, 329.628],
  [123.471, 185, 246.942, 293.665],
  [98, 146.832, 185, 246.942],
  [110, 164.814, 220, 293.665],
];
const beat = 60 / 84;
let seed = 731;
const noise = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2147483648 - 1;
};
let low = 0;
for (let i = 0; i < frames; i++) {
  const t = i / rate;
  const bar = t / (beat * 8);
  const chord = chords[Math.floor(bar) % 4];
  const fade = Math.min(1, t / 3, (seconds - t) / 4);
  const attack = Math.min(1, (bar % 1) * 8);
  let left = 0,
    right = 0;
  for (let n = 0; n < chord.length; n++) {
    const f = chord[n];
    const amp = 0.028 * attack;
    left +=
      amp *
      (Math.sin(2 * Math.PI * f * t) +
        0.22 * Math.sin(2 * Math.PI * f * 2 * t)) *
      (0.88 + 0.12 * Math.sin(t * 0.31 + n));
    right +=
      amp *
      (Math.sin(2 * Math.PI * (f * 1.001) * t) +
        0.22 * Math.sin(2 * Math.PI * f * 2.001 * t)) *
      (0.88 + 0.12 * Math.cos(t * 0.27 + n));
  }
  const pluckTime = t % (beat / 2);
  const note = chord[Math.floor(t / (beat / 2)) % 4] * 2;
  const pluck =
    0.023 *
    Math.exp(-pluckTime * 9) *
    (Math.sin(2 * Math.PI * note * pluckTime) +
      0.22 * Math.sin(2 * Math.PI * note * 2 * pluckTime));
  const pulse = t % beat;
  const kick =
    0.026 *
    Math.sin(2 * Math.PI * (48 + 15 * Math.exp(-pulse * 35)) * pulse) *
    Math.exp(-pulse * 15);
  const white = noise();
  low += 0.15 * (white - low);
  const hat = (white - low) * 0.006 * Math.exp(-pluckTime * 70);
  left = (left + pluck + kick + hat) * fade;
  right = (right + pluck * 0.8 + kick - hat) * fade;
  samples.writeInt16LE(
    Math.max(-32767, Math.min(32767, Math.round(left * 32767))),
    i * 4,
  );
  samples.writeInt16LE(
    Math.max(-32767, Math.min(32767, Math.round(right * 32767))),
    i * 4 + 2,
  );
}
const header = Buffer.alloc(44);
header.write("RIFF");
header.writeUInt32LE(36 + samples.length, 4);
header.write("WAVEfmt ", 8);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(2, 22);
header.writeUInt32LE(rate, 24);
header.writeUInt32LE(rate * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(samples.length, 40);
await mkdir("artifacts/remotion-public", { recursive: true });
await writeFile(
  "artifacts/remotion-public/music-source.wav",
  Buffer.concat([header, samples]),
);
execFileSync("ffmpeg", [
  "-y",
  "-loglevel",
  "error",
  "-i",
  "artifacts/remotion-public/music-source.wav",
  "-af",
  "lowpass=f=5000,loudnorm=I=-25:TP=-3:LRA=7",
  "-ar",
  "48000",
  "artifacts/remotion-public/music.wav",
]);
console.log(`Original score: ${seconds.toFixed(2)}s`);
