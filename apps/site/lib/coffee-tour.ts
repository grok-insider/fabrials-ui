import timing from "@/video/remotion/timing.json";
import { selectionMotion } from "@/video/remotion/motion";
export const tourDuration = timing.durationInFrames / timing.fps;
const at = (scene: number, frame = 0) =>
  (timing.scenes[scene].from + frame) / timing.fps;
export const tourCues = {
  compare: at(1, 295),
  choose: at(3, selectionMotion.machineArrives),
  filter: at(3, selectionMotion.filterArrives),
  remove: at(4, selectionMotion.removeClick),
  review: at(4, selectionMotion.reviewClick + 10),
  outro: at(5),
};
export function tourSnapshot(seconds: number) {
  return {
    compared: seconds >= tourCues.compare,
    id: seconds >= tourCues.choose ? ("studio" as const) : null,
    filter: seconds >= tourCues.filter && seconds < tourCues.remove,
    review: seconds >= tourCues.review && seconds < tourCues.outro,
  };
}
export function tourChapter(seconds: number) {
  if (seconds < at(1)) return "One task. One shared interface.";
  if (seconds < at(2)) return "Start with your requirements";
  if (seconds < at(3)) return "See the evidence behind a recommendation";
  if (seconds < at(4)) return "Build your selection";
  if (seconds < at(5)) return "Review and make the final decision";
  return "Your turn — take control of the same interface";
}
export function tourTarget(seconds: number) {
  if (seconds >= tourCues.review - 1 && seconds < tourCues.outro)
    return "review";
  if (seconds >= tourCues.remove - 1 && seconds < tourCues.remove + 2)
    return "filter";
  if (seconds >= tourCues.filter - 1 && seconds < tourCues.filter + 2)
    return "filter";
  if (seconds >= tourCues.choose - 1 && seconds < tourCues.choose + 1)
    return "choose";
  if (seconds >= tourCues.compare - 1 && seconds < tourCues.compare + 3)
    return "compare";
  return "";
}
