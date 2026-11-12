// The pure half of the avatar: no directive, so a Server Component can compute initials and their tint. Both are still
// exported from "./avatar".

/** One of the five data hues for a fallback's text, the same on the server and in the browser (FNV-1a over its code points). */
export function avatarTint(text: string): 1 | 2 | 3 | 4 | 5 {
  let hash = 0x811c9dc5;
  for (const char of text.trim().toLocaleUpperCase("en")) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return ((hash % 5) + 1) as 1 | 2 | 3 | 4 | 5;
}

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter("en", { granularity: "grapheme" }) : null;

function firstGrapheme(word: string): string {
  if (segmenter) for (const part of segmenter.segment(word)) return part.segment;
  return Array.from(word)[0] ?? "";
}

/**
 * The text of an avatar fallback. A name gives the first letters of its first and last word; an address (no space) gives
 * the first letter of its local part. Grapheme-safe (an emoji or an accented letter is one) and upper-cased in `locale`,
 * English by default (pass it for Turkish or Lithuanian names, whose letters grow differently); `fallback` when there is
 * nothing to show.
 */
/** What may follow a family name without being one. */
const SUFFIX = /^(?:jr|sr|ii|iii|iv|phd|md|esq)\.?,?$/iu;

export function avatarInitials(value: string, fallback = "?", locale?: string): string {
  const text = value.trim();
  if (!text) return fallback;
  const all = /\s/u.test(text) ? text.split(/\s+/u) : [text.split("@")[0] || text];
  // "Christopher Montgomery III" is C M, not C I: what follows the family name is not a name. Kept when nothing else is left.
  const named = all.filter((word, index) => index === 0 || !SUFFIX.test(word));
  const words = named.length > 1 || all.length === 1 ? named : all;
  const letters =
    words.length > 1
      ? [firstGrapheme(words[0]), firstGrapheme(words[words.length - 1])]
      : [firstGrapheme(words[0])];
  return letters.join("").toLocaleUpperCase(locale ?? "en") || fallback;
}
