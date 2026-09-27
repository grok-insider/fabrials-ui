export const selectionMotion = {
  chooseClick: 42,
  machineArrives: 70,
  filterClick: 108,
  filterArrives: 122,
  removeClick: 65,
  reviewClick: 145,
} as const;
export function easeBetween(
  frame: number,
  start: number,
  end: number,
  from = 0,
  to = 1,
) {
  const t = Math.max(0, Math.min(1, (frame - start) / (end - start)));
  return from + (to - from) * (t * t * (3 - 2 * t));
}
export function cursorAt(
  frame: number,
  points: readonly (readonly [number, number, number])[],
) {
  for (let i = 1; i < points.length; i++) {
    if (frame <= points[i][0])
      return {
        x: easeBetween(
          frame,
          points[i - 1][0],
          points[i][0],
          points[i - 1][1],
          points[i][1],
        ),
        y: easeBetween(
          frame,
          points[i - 1][0],
          points[i][0],
          points[i - 1][2],
          points[i][2],
        ),
      };
  }
  return { x: points.at(-1)![1], y: points.at(-1)![2] };
}
export const choosePath = [
  [0, 720, 925],
  [32, 482, 836],
  [62, 482, 836],
  [96, 1765, 500],
  [128, 1765, 500],
  [156, 1810, 900],
] as const;
export const reviewPath = [
  [0, 1810, 900],
  [54, 1765, 500],
  [84, 1765, 500],
  [132, 1540, 716],
  [160, 1540, 716],
] as const;
