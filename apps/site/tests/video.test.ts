import { describe, it, expect } from "vitest";
import timing from "../video/remotion/timing.json";
import { narration } from "../video/remotion/script";
import { readFileSync } from "node:fs";
describe("film delivery", () => {
  it("keeps every voice clip within its scene and the timeline contiguous", () => {
    let next = 0;
    timing.scenes.forEach((scene, i) => {
      expect(scene.id).toBe(narration[i].id);
      expect(scene.from).toBe(next);
      expect(15 + Math.ceil(scene.speechSeconds * timing.fps)).toBeLessThan(
        scene.frames,
      );
      next += scene.frames;
    });
    expect(next).toBe(timing.durationInFrames);
  });
  it("includes every narrated sentence in the captions", () => {
    const vtt = readFileSync("video/transcript.vtt", "utf8");
    narration.forEach((scene) => {
      for (const sentence of scene.text.match(/[^.!?]+[.!?]+/g) || [])
        expect(vtt).toContain(sentence.trim());
    });
  });
});
