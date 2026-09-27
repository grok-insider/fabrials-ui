import { expect, it } from "vitest";
import { landingTourDuration } from "@/lib/landing-tour";
import captions from "@/video/remotion/captions.json";
it("preserves the final decision and excludes the promotional speech from the landing", () => {
  const decision = captions.find(
    (c) => c.text === "You make the final decision.",
  )!;
  const outro = captions.find(
    (c) => c.text === "React and shadcn components.",
  )!;
  expect(landingTourDuration - 0.55).toBeGreaterThan(decision.end);
  expect(landingTourDuration).toBeLessThan(outro.start);
});
