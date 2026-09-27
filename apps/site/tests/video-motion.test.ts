import { expect, it } from "vitest";
import {
  choosePath,
  reviewPath,
  cursorAt,
  selectionMotion as m,
  easeBetween,
} from "../video/remotion/motion";
it("holds the pointer on its target throughout each click pulse", () => {
  for (const [path, at, target] of [
    [choosePath, m.chooseClick, { x: 482, y: 836 }],
    [choosePath, m.filterClick, { x: 1765, y: 500 }],
    [reviewPath, m.removeClick, { x: 1765, y: 500 }],
    [reviewPath, m.reviewClick, { x: 1540, y: 716 }],
  ] as const) {
    expect(cursorAt(at, path)).toEqual(target);
    expect(cursorAt(at + 15, path)).toEqual(target);
  }
});
it("orders feedback after the triggering click and clamps movement at its destination", () => {
  expect(m.machineArrives).toBeGreaterThan(m.chooseClick);
  expect(m.filterClick).toBeGreaterThan(m.machineArrives);
  expect(m.filterArrives).toBeGreaterThan(m.filterClick);
  expect(easeBetween(-10, 0, 20, 10, 30)).toBe(10);
  expect(easeBetween(40, 0, 20, 10, 30)).toBe(30);
});
