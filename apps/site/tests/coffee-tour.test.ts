import { expect, it } from "vitest";
import { tourCues, tourSnapshot, tourDuration } from "@/lib/coffee-tour";
it("seeks deterministically through the film's compare/select/filter/review choreography", () => {
  expect(tourSnapshot(0)).toEqual({
    compared: false,
    id: null,
    filter: false,
    review: false,
  });
  expect(tourSnapshot(tourCues.compare).compared).toBe(true);
  expect(tourSnapshot(tourCues.choose)).toMatchObject({
    id: "studio",
    filter: false,
  });
  expect(tourSnapshot(tourCues.filter).filter).toBe(true);
  expect(tourSnapshot(tourCues.remove).filter).toBe(false);
  expect(tourSnapshot(tourCues.review).review).toBe(true);
  expect(tourSnapshot(tourDuration)).toMatchObject({
    id: "studio",
    review: false,
  });
  expect(tourSnapshot(0).id).toBeNull();
});
