// Origin: Fabrials, 0.12. The scale rules of `ZoomPan`, apart from the DOM so each can be tested. They are the viewer's
// rules (media-logic), which count from 1 (fitted) to a maximum: a range that starts elsewhere is the same maths counted in
// units of its minimum.

import { clamp, pinchScale, stepScale, wheelScale } from "./media-logic";

export type ZoomRange = { min: number; max: number };

/** The range a host asked for, made safe: positive and finite, with `max` never under `min`. */
export function zoomRange(min = 1, max = 4): ZoomRange {
  const low = Number.isFinite(min) && min > 0 ? min : 1;
  const high = Number.isFinite(max) && max > 0 ? max : 4;
  return { min: low, max: Math.max(low, high) };
}

/** A scale kept inside the range; anything that is not a number is the smallest scale. */
export const clampZoom = (scale: number, range: ZoomRange): number => (Number.isFinite(scale) ? clamp(scale, range.min, range.max) : range.min);

/** Whether two scales are the same to the eye: under a thousandth apart. */
export const sameZoom = (a: number, b: number): boolean => Math.abs(a - b) < 0.001;

export type ZoomWheelEvent = { deltaX?: number; deltaY: number; deltaMode?: number; ctrlKey: boolean; metaKey?: boolean };

/**
 * Whether a turn of the wheel is a zoom. In `zoom` mode every turn is. In `ctrl` mode (the cooperative gesture) only a turn
 * with Ctrl or ⌘ held, which is also how browsers report a pinch on a trackpad; a plain turn scrolls the page.
 */
export const wheelZooms = (event: Pick<ZoomWheelEvent, "ctrlKey" | "metaKey">, mode: "zoom" | "ctrl"): boolean =>
  mode === "zoom" || event.ctrlKey || event.metaKey === true;

/** The scale a turn of the wheel leads to, or null when nothing would change (at a limit, or a sideways turn). */
export function zoomByWheel(event: ZoomWheelEvent, scale: number, range: ZoomRange): number | null {
  const next = wheelScale(event, scale / range.min, range.max / range.min);
  return next === null ? null : clampZoom(next * range.min, range);
}

/** A press of + or −: a quarter more or a quarter less, inside the range. */
export const zoomByStep = (scale: number, direction: 1 | -1, range: ZoomRange): number =>
  clampZoom(stepScale(scale / range.min, direction, range.max / range.min) * range.min, range);

/** Two fingers that landed `startDistance` apart at `startScale` and are now `distance` apart. */
export const zoomByPinch = (startScale: number, startDistance: number, distance: number, range: ZoomRange): number =>
  clampZoom(pinchScale(startScale / range.min, startDistance, distance, range.max / range.min) * range.min, range);

/**
 * The scale at which the whole content shows in the viewport: 1 (its natural layout, as wide as the viewport) unless it is
 * then taller or wider than the viewport, and never outside the range. Unmeasured sizes fit at 1.
 */
export function fitZoom(content: { width: number; height: number }, viewport: { width: number; height: number }, range: ZoomRange): number {
  const ratio = (inner: number, outer: number) => (inner > 0 && outer > 0 ? outer / inner : 1);
  return clampZoom(Math.min(1, ratio(content.width, viewport.width), ratio(content.height, viewport.height)), range);
}

/** A scale as the percentage the controls show. */
export const zoomPercent = (scale: number): number => Math.round(scale * 100);
