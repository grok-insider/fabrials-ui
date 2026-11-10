// Pure text helpers of MarkedText and TextDiff: where marks fall in a text and what changed between two texts.
// No React and no DOM, so a server can call them.

export type TextRangeSeverity = "error" | "warning" | "note";

export type TextRange = {
  /** Where the passage starts, in UTF-16 code units (what `String.prototype.slice` counts). */
  start: number;
  /** Where it ends (exclusive). */
  end: number;
  /** The id of the note that explains it: the mark is described by that element. */
  id?: string;
  /** Default `error`. */
  severity?: TextRangeSeverity;
  /** Spoken instead of the default prefix ("Mistake 1"). */
  label?: string;
};

export type PlacedRange = {
  /** The range's place in the list it came from: its number is `index + 1`, whatever was dropped around it. */
  index: number;
  start: number;
  end: number;
};

export type TextSegment = {
  text: string;
  start: number;
  end: number;
  /** The place of the range that marks this piece, or `null` for plain text. */
  index: number | null;
};

type Segmenter = { segment(input: string): Iterable<{ segment: string; index: number; isWordLike?: boolean }> };
type SegmenterConstructor = new (locale?: Intl.LocalesArgument, options?: { granularity: "grapheme" | "word" }) => Segmenter;

const segmenterOf = (granularity: "grapheme" | "word", locale?: Intl.LocalesArgument): Segmenter | null => {
  const constructor = (Intl as unknown as { Segmenter?: SegmenterConstructor }).Segmenter;
  if (typeof constructor !== "function") return null;
  try {
    return new constructor(locale, { granularity });
  } catch {
    return null;
  }
};

const COMBINING = /^[\p{M}\u200d\ufe0e\ufe0f]$/u;

/** Where a cut may fall without splitting what a reader sees as one character. Without `Intl.Segmenter`: never inside a
 * surrogate pair, and never before a combining mark, a joiner or a variation selector. */
export function graphemeBoundaries(text: string): number[] {
  const segmenter = segmenterOf("grapheme");
  const boundaries = [0];
  if (segmenter) {
    for (const part of segmenter.segment(text)) if (part.index > 0) boundaries.push(part.index);
  } else {
    let at = 0;
    for (const char of text) {
      if (at > 0 && !COMBINING.test(char) && text[at - 1] !== "\u200d") boundaries.push(at);
      at += char.length;
    }
  }
  if (text.length > 0) boundaries.push(text.length);
  return boundaries;
}

/** The last boundary at or before `offset` (`down`), or the first at or after it. `boundaries` is sorted and holds 0 and the length. */
function snap(boundaries: readonly number[], offset: number, down: boolean): number {
  let low = 0;
  let high = boundaries.length - 1;
  while (low < high) {
    const middle = down ? Math.ceil((low + high) / 2) : Math.floor((low + high) / 2);
    if (down) {
      if (boundaries[middle]! <= offset) low = middle;
      else high = middle - 1;
    } else if (boundaries[middle]! >= offset) high = middle;
    else low = middle + 1;
  }
  return boundaries[low] ?? 0;
}

/**
 * The ranges as they can be drawn: inside the text, widened to whole characters (a mark never cuts an emoji or a letter from
 * its accent), in reading order, and never overlapping. Where two overlap, the one that starts first keeps its passage (the
 * longer one, when they start together; the earlier in the list, when they are the same) and the other keeps what is left
 * after it. A range with nothing left (empty, outside the text, not a number, or wholly inside another) is dropped; the
 * others keep their `index`, so their numbers still match the list they came from.
 */
export function placeRanges(text: string, ranges: readonly Pick<TextRange, "start" | "end">[]): PlacedRange[] {
  const length = text.length;
  if (length === 0) return [];
  const boundaries = graphemeBoundaries(text);
  const placed: PlacedRange[] = [];
  ranges.forEach((range, index) => {
    if (range == null || !Number.isFinite(range.start) || !Number.isFinite(range.end)) return;
    const from = Math.min(length, Math.max(0, Math.trunc(range.start)));
    const to = Math.min(length, Math.max(0, Math.trunc(range.end)));
    if (to <= from) return;
    placed.push({ index, start: snap(boundaries, from, true), end: snap(boundaries, to, false) });
  });
  placed.sort((a, b) => a.start - b.start || b.end - a.end || a.index - b.index);
  const out: PlacedRange[] = [];
  let at = 0;
  for (const range of placed) {
    const start = Math.max(range.start, at);
    if (range.end <= start) continue;
    out.push({ index: range.index, start, end: range.end });
    at = range.end;
  }
  return out;
}

/** The text cut into plain and marked pieces, in order; joined, the pieces are the text. */
export function segmentText(text: string, ranges: readonly Pick<TextRange, "start" | "end">[]): TextSegment[] {
  const segments: TextSegment[] = [];
  let at = 0;
  for (const range of placeRanges(text, ranges)) {
    if (range.start > at) segments.push({ text: text.slice(at, range.start), start: at, end: range.start, index: null });
    segments.push({ text: text.slice(range.start, range.end), start: range.start, end: range.end, index: range.index });
    at = range.end;
  }
  if (at < text.length) segments.push({ text: text.slice(at), start: at, end: text.length, index: null });
  return segments;
}

export type DiffPart = { type: "equal" | "insert" | "delete"; text: string };

/** A text as the pieces a word diff compares: words, runs of spaces, and each other sign on its own. */
export function wordTokens(text: string, locale?: Intl.LocalesArgument): string[] {
  if (text.length === 0) return [];
  const segmenter = segmenterOf("word", locale);
  if (segmenter) return Array.from(segmenter.segment(text), (part) => part.segment);
  return text.match(/\s+|[\p{L}\p{N}\p{M}_'’]+|[^\s\p{L}\p{N}\p{M}_'’]/gu) ?? [text];
}

// Above this many cells the table of the longest common subsequence is not built: what differs between the shared start and
// the shared end is shown as one removal and one addition.
const MAX_CELLS = 4_000_000;

function push(parts: DiffPart[], type: DiffPart["type"], text: string) {
  if (text.length === 0) return;
  const last = parts[parts.length - 1];
  if (last && last.type === type) last.text += text;
  else parts.push({ type, text });
}

/** Puts each run of changes as what was removed, then what was added, so a replaced word reads "old, new". */
function settle(parts: DiffPart[]): DiffPart[] {
  const out: DiffPart[] = [];
  let removed = "";
  let added = "";
  const flush = () => {
    push(out, "delete", removed);
    push(out, "insert", added);
    removed = "";
    added = "";
  };
  for (const part of parts) {
    if (part.type === "delete") removed += part.text;
    else if (part.type === "insert") added += part.text;
    else {
      flush();
      push(out, "equal", part.text);
    }
  }
  flush();
  return out;
}

/**
 * What changed from `before` to `after`, word by word: the longest run of words the two share stays `equal`, what only
 * `before` has is a `delete`, what only `after` has an `insert`. Joined, the equal and deleted parts are `before`; the equal
 * and inserted parts are `after`. Words are found with `Intl.Segmenter` (so a language without spaces is still cut into
 * words) in `locale`.
 */
export function diffWords(before: string, after: string, locale?: Intl.LocalesArgument): DiffPart[] {
  const a = wordTokens(before, locale);
  const b = wordTokens(after, locale);
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head += 1;
  let tail = 0;
  while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail += 1;
  const left = a.slice(head, a.length - tail);
  const right = b.slice(head, b.length - tail);
  const parts: DiffPart[] = [];
  push(parts, "equal", a.slice(0, head).join(""));
  if (left.length * right.length > MAX_CELLS) {
    push(parts, "delete", left.join(""));
    push(parts, "insert", right.join(""));
  } else {
    const rows = left.length + 1;
    const columns = right.length + 1;
    const table = new Uint32Array(rows * columns);
    for (let i = left.length - 1; i >= 0; i -= 1) {
      for (let j = right.length - 1; j >= 0; j -= 1) {
        table[i * columns + j] =
          left[i] === right[j] ? table[(i + 1) * columns + j + 1]! + 1 : Math.max(table[(i + 1) * columns + j]!, table[i * columns + j + 1]!);
      }
    }
    let i = 0;
    let j = 0;
    while (i < left.length && j < right.length) {
      if (left[i] === right[j]) {
        push(parts, "equal", left[i]!);
        i += 1;
        j += 1;
      } else if (table[(i + 1) * columns + j]! >= table[i * columns + j + 1]!) {
        push(parts, "delete", left[i]!);
        i += 1;
      } else {
        push(parts, "insert", right[j]!);
        j += 1;
      }
    }
    push(parts, "delete", left.slice(i).join(""));
    push(parts, "insert", right.slice(j).join(""));
  }
  push(parts, "equal", a.slice(a.length - tail).join(""));
  return settle(parts);
}
