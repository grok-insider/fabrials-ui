// The pure part of reading aloud: what of an answer is said, where a long text is cut, and which of the browser's voices
// speaks a language. No React and no browser.

/** Plain words for speech: no code blocks, maths, pictures, citation marks or markdown symbols. A link keeps its words. */
export function speakableText(markdown: string): string {
  return markdown
    .replace(/(```|~~~)[\s\S]*?(\1|$)/g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/\\\[[\s\S]*?\\\]/g, " ")
    .replace(/\\\([\s\S]*?\\\)/g, " ")
    .replace(/\$[^$\n]+\$/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\[\[\d+\]\]|\[\^[^\]]+\]|\[\d+\](?!\()/g, "")
    .replace(/<\/?[a-zA-Z][^>]*>/g, " ")
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, " ")
    .replace(/^\s*[-:| ]+$/gm, " ")
    .replace(/[*_`#>|~]+/g, " ")
    .replace(/\s+([.,;:!?؟،؛。，！？])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

// Where a sentence ends. The first set ends one only before a space or the end of the text ("3.14" is not two sentences);
// the full-width marks of Chinese and Japanese end one wherever they stand, since nothing separates the next sentence.
const ENDS = new Set([".", "!", "?", "…", "؟", "۔", "‼", "⁇"]);
const WIDE_ENDS = new Set(["。", "！", "？", "．"]);
const CLOSERS = new Set(['"', "'", "»", "”", "’", ")", "]", "」", "』", "）", "》"]);
const CLAUSES = new Set([",", ";", ":", "،", "؛", "、", "，", "；", "："]);

function sentencesOf(text: string): string[] {
  const out: string[] = [];
  let start = 0;
  let at = 0;
  while (at < text.length) {
    const mark = text[at]!;
    if (!ENDS.has(mark) && !WIDE_ENDS.has(mark)) {
      at += 1;
      continue;
    }
    let end = at + 1;
    let wide = WIDE_ENDS.has(mark);
    while (end < text.length && (ENDS.has(text[end]!) || WIDE_ENDS.has(text[end]!))) {
      wide ||= WIDE_ENDS.has(text[end]!);
      end += 1;
    }
    while (end < text.length && CLOSERS.has(text[end]!)) end += 1;
    if (wide || end === text.length || text[end] === " ") {
      while (end < text.length && text[end] === " ") end += 1;
      out.push(text.slice(start, end));
      start = end;
    }
    at = end;
  }
  if (start < text.length) out.push(text.slice(start));
  return out;
}

type Segmenter = { segment: (text: string) => Iterable<{ index: number; segment: string }> };
const segmenter = (granularity: "word" | "grapheme"): Segmenter | null => {
  const Maker = (Intl as unknown as { Segmenter?: new (locale: undefined, options: { granularity: string }) => Segmenter }).Segmenter;
  return Maker ? new Maker(undefined, { granularity }) : null;
};

/** The last boundary of `kind` at or before `max`, never 0: a cut that keeps words (or at least written characters) whole. */
function boundary(text: string, max: number, kind: "word" | "grapheme"): number {
  const cutter = segmenter(kind);
  if (!cutter) {
    // No segmenter: at least never between the two halves of a surrogate pair.
    const code = text.charCodeAt(max - 1);
    return code >= 0xd800 && code <= 0xdbff ? max - 1 : max;
  }
  let last = 0;
  for (const part of cutter.segment(text)) {
    const end = part.index + part.segment.length;
    if (end > max) return last > 0 ? last : kind === "grapheme" ? end : 0;
    last = end;
    if (end === max) break;
  }
  return last;
}

/** Where to cut a sentence longer than a chunk: after a comma, else at a space, else between words, else between characters. */
function cutAt(text: string, max: number): number {
  let clause = -1;
  let space = -1;
  for (let at = 0; at < max; at += 1) {
    const mark = text[at]!;
    if (mark === " ") space = at;
    else if (CLAUSES.has(mark) && (text[at + 1] === " " || mark > "\u2fff")) clause = at + 1;
  }
  if (clause > max / 3) return clause;
  if (space > 0) return space;
  if (text[max] === " ") return max;
  return boundary(text, max, "word") || boundary(text, max, "grapheme") || max;
}

/**
 * Splits text for speech into pieces of at most `max` characters, at sentence ends where it can (Latin, Arabic, Chinese
 * and Japanese marks), then after commas, then at spaces, and never inside a word or a written character, so the voice
 * pauses where a reader would.
 */
export function speechChunks(text: string, max = 1200): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const limit = Math.max(1, Math.floor(max));
  const chunks: string[] = [];
  let current = "";
  const push = () => {
    if (current.trim()) chunks.push(current.trim());
    current = "";
  };
  for (const sentence of sentencesOf(clean)) {
    if ((current + sentence).trimEnd().length <= limit) {
      current += sentence;
      continue;
    }
    push();
    let rest = sentence;
    while (rest.trimEnd().length > limit) {
      const at = cutAt(rest, limit);
      chunks.push(rest.slice(0, at).trim());
      rest = rest.slice(at).trimStart();
    }
    current = rest;
  }
  push();
  return chunks.filter(Boolean);
}

/** The voice for a language among the browser's: the same tag, else the same language in another region. */
export function matchVoice<Voice extends { lang: string }>(voices: readonly Voice[], lang: string | undefined): Voice | undefined {
  if (!lang) return undefined;
  const wanted = lang.toLowerCase().replace(/_/g, "-");
  const base = wanted.split("-")[0]!;
  const tag = (voice: Voice) => voice.lang.toLowerCase().replace(/_/g, "-");
  return voices.find((voice) => tag(voice) === wanted) ?? voices.find((voice) => tag(voice).split("-")[0] === base);
}
