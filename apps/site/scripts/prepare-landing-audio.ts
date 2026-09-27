import { execFileSync } from "node:child_process";
import { landingTourDuration } from "../lib/landing-tour";
// Separate deliverable: the social film and its complete soundtrack stay intact.
execFileSync(
  "ffmpeg",
  [
    "-y",
    "-i",
    "artifacts/remotion-film/demo-audio.m4a",
    "-t",
    String(landingTourDuration),
    "-af",
    `afade=t=out:st=${landingTourDuration - 0.55}:d=0.55`,
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    "artifacts/remotion-film/landing-audio.m4a",
  ],
  { stdio: "inherit" },
);
