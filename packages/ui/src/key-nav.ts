/**
 * Where the arrow keys take the focus in the on-screen keyboard: by what is on screen, not by the order of the markup, so a
 * row that wraps or a key twice as wide still finds the key under the finger. Pure and server-safe: the boxes are the
 * `getBoundingClientRect`s the component read.
 */

export type KeyBox = { x: number; y: number; width: number; height: number };

export type KeyDirection = "previous" | "next" | "up" | "down" | "home" | "end";

const centreY = (box: KeyBox) => box.y + box.height / 2;
const centreX = (box: KeyBox) => box.x + box.width / 2;

/** The indices of the keys that share a row with `index`: their middle is within half a key's height of its middle. */
function rowOf(boxes: KeyBox[], index: number): number[] {
  const current = boxes[index];
  if (!current) return [];
  const half = current.height / 2;
  return boxes.flatMap((box, at) => (Math.abs(centreY(box) - centreY(current)) < half ? [at] : []));
}

/**
 * The key the arrow takes focus to, or `-1` when the direction leaves the keyboard. `previous` and `next` follow the
 * reading order of the rows (the caller decides which arrow is which in a right-to-left page); `home` and `end` stay in
 * the key's own row; up and down look at the nearest row in that direction and take the key closest to the one they left.
 */
export function neighbourKey(boxes: KeyBox[], index: number, direction: KeyDirection): number {
  const current = boxes[index];
  if (!current) return -1;
  if (direction === "previous") return index - 1 >= 0 ? index - 1 : -1;
  if (direction === "next") return index + 1 < boxes.length ? index + 1 : -1;
  if (direction === "home" || direction === "end") {
    const row = rowOf(boxes, index);
    if (row.length === 0) return -1;
    const next = direction === "home" ? row[0]! : row[row.length - 1]!;
    return next === index ? -1 : next;
  }
  const half = current.height / 2;
  const away = direction === "down" ? 1 : -1;
  const candidates = boxes.flatMap((box, at) =>
    at !== index && away * (centreY(box) - centreY(current)) > half ? [{ at, box }] : [],
  );
  if (candidates.length === 0) return -1;
  const nearest = Math.min(...candidates.map(({ box }) => Math.abs(centreY(box) - centreY(current))));
  const row = candidates.filter(({ box }) => Math.abs(centreY(box) - centreY(current)) - nearest < half);
  row.sort((a, b) => Math.abs(centreX(a.box) - centreX(current)) - Math.abs(centreX(b.box) - centreX(current)));
  const next = row[0]!.at;
  return next === index ? -1 : next;
}
