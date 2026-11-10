/**
 * Caret arithmetic for the on-screen keyboard: what a field's value and caret become after a key or a backspace. Offsets
 * are UTF-16 code units, as `selectionStart` and `selectionEnd` report them. Backspace is grapheme aware: a letter keeps
 * its marks (harakat, shadda, a hamza above), so a field is never left with half a cluster. Pure and server-safe.
 */

export type CaretEdit = { value: string; caret: number };

type Segmenter = { segment(input: string): Iterable<{ segment: string; index: number }> };

let segmenter: Segmenter | null | undefined;

function graphemeSegmenter(): Segmenter | null {
  if (segmenter !== undefined) return segmenter;
  const ctor = (Intl as unknown as { Segmenter?: new (locale?: string, options?: { granularity: "grapheme" }) => Segmenter }).Segmenter;
  segmenter = ctor ? new ctor(undefined, { granularity: "grapheme" }) : null;
  return segmenter;
}

const MARK = /^\p{M}$/u;
const JOINER = "\u200d";
const VARIATION_SELECTOR = /^[\u{fe00}-\u{fe0f}]$/u;

/** The start of the cluster that ends at or contains `end - 1`, without `Intl.Segmenter`. */
function clusterStartFallback(value: string, end: number): number {
  const points: { at: number; ch: string }[] = [];
  let at = 0;
  for (const ch of value.slice(0, end)) {
    points.push({ at, ch });
    at += ch.length;
  }
  let i = points.length - 1;
  while (i > 0) {
    const { ch } = points[i]!;
    if (MARK.test(ch) || VARIATION_SELECTOR.test(ch) || ch === JOINER) i -= 1;
    else if (points[i - 1]!.ch === JOINER) i -= 2;
    else break;
  }
  return points[Math.max(0, i)]?.at ?? 0;
}

function clusterBounds(seg: Segmenter | null, value: string, offset: number): { start: number; end: number } {
  if (seg) {
    for (const part of seg.segment(value)) {
      const end = part.index + part.segment.length;
      if (offset >= part.index && offset < end) return { start: part.index, end };
    }
    return { start: offset, end: offset };
  }
  const start = clusterStartFallback(value, offset + 1);
  let end = offset + 1;
  // A code point can be two code units, and marks follow it.
  const cp = value.codePointAt(offset);
  if (cp !== undefined && cp > 0xffff) end = offset + 2;
  for (;;) {
    const next = value.codePointAt(end);
    if (next === undefined) break;
    const ch = String.fromCodePoint(next);
    if (MARK.test(ch) || VARIATION_SELECTOR.test(ch) || ch === JOINER) end += ch.length;
    else if (value[end - 1] === JOINER) end += ch.length;
    else break;
  }
  return { start, end };
}

function clampRange(value: string, selectionStart: number | null, selectionEnd: number | null) {
  const length = value.length;
  const a = Number.isFinite(selectionStart) ? Math.min(Math.max(selectionStart as number, 0), length) : length;
  const b = Number.isFinite(selectionEnd) ? Math.min(Math.max(selectionEnd as number, 0), length) : a;
  return a <= b ? { from: a, to: b } : { from: b, to: a };
}

/** Types `text` at the caret, replacing the selection. The caret ends after it. */
export function insertAtCaret(value: string, selectionStart: number | null, selectionEnd: number | null, text: string): CaretEdit {
  const { from, to } = clampRange(value, selectionStart, selectionEnd);
  return { value: value.slice(0, from) + text + value.slice(to), caret: from + text.length };
}

/** Backspace: the selection, or else the whole cluster before the caret (a caret inside a cluster deletes that cluster). */
export function backspaceAtCaret(value: string, selectionStart: number | null, selectionEnd: number | null): CaretEdit {
  return backspaceWith(graphemeSegmenter(), value, selectionStart, selectionEnd);
}

/** Backspace for runtimes without `Intl.Segmenter`; exported so the fallback is tested. */
export function backspaceAtCaretWithoutSegmenter(value: string, selectionStart: number | null, selectionEnd: number | null): CaretEdit {
  return backspaceWith(null, value, selectionStart, selectionEnd);
}

function backspaceWith(seg: Segmenter | null, value: string, selectionStart: number | null, selectionEnd: number | null): CaretEdit {
  const { from, to } = clampRange(value, selectionStart, selectionEnd);
  if (to > from) return { value: value.slice(0, from) + value.slice(to), caret: from };
  if (from === 0) return { value, caret: 0 };
  const { start, end } = clusterBounds(seg, value, from - 1);
  return { value: value.slice(0, start) + value.slice(Math.max(end, from)), caret: start };
}
