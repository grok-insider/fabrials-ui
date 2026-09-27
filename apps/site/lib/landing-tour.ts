import captions from "@/video/remotion/captions.json";
import timing from "@/video/remotion/timing.json";

// End after the human decision, before the film's promotional outro.
export const landingTourDuration = timing.scenes[5].from / timing.fps;
export const landingPrompt =
  "Find a machine for a 32 cm counter that works with my 58 mm accessories.";
export const landingPromptStart = captions.find(
  (caption) => caption.text === "Two flat whites.",
)!.start;
export function landingPromptLength(time: number) {
  return Math.floor(
    Math.min(1, Math.max(0, (time - landingPromptStart) / 5.2)) *
      landingPrompt.length,
  );
}
