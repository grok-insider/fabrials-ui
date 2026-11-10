// Origin: Fabrials, 0.12 (from Radiant's lib/lang/foreign and exercise/lang-text). No directive, no React: a Server
// Component, a formatter or a test can call it. The tables are fixed, not read from `Intl`, so the server and the browser
// always agree.

type Direction = "ltr" | "rtl";

/** Scripts written right to left, by their ISO 15924 code in lower case. */
const RTL_SCRIPTS = new Set(["arab", "hebr", "thaa", "syrc", "nkoo", "adlm", "rohg", "mand", "samr", "mend", "aran"]);

/** Languages written right to left when the tag names no script. */
const RTL_LANGUAGES = new Set([
  // Arabic and its spoken varieties.
  ..."ar arb arz ary arq aeb apc ajp acm afb ars acw apd shu ayl ayh ayn ayp acx acy acq abv avl adf aao auz".split(" "),
  // Hebrew and Yiddish, with their retired codes.
  ..."he iw yi ji ydd lad".split(" "),
  // Persian, Urdu and the other languages of the Arabic script.
  ..."fa pes prs ur ps pbt pbu sd ug ckb sdh lrc luz bqi mzn glk bal bgn khw ks pnb skr azb rhg".split(" "),
  // Thaana, Syriac, N'Ko, Mandaic, Samaritan.
  ..."dv syr arc aii nqo mid sam".split(" "),
]);

/** Languages whose script follows the country: Arabic there, Latin, Cyrillic or Gurmukhi elsewhere. */
const RTL_REGIONS: Record<string, readonly string[]> = {
  pa: ["pk"],
  az: ["ir", "iq"],
  uz: ["af"],
  ku: ["iq", "ir"],
  kk: ["cn", "ir", "af"],
  ky: ["cn"],
  tk: ["af", "ir"],
  tg: ["af"],
};

/**
 * The direction a language is written in, from its BCP 47 tag: the script subtag when it has one ("az-Arab", "ku-Latn"),
 * else the language ("ar", "he", "fa", "ur", "arz"…), with the few whose script follows the country ("pa-PK"). Anything
 * unknown, empty or missing is left to right.
 */
export function dirOf(lang: string | null | undefined): Direction {
  if (!lang) return "ltr";
  const [language = "", ...rest] = lang.trim().toLowerCase().split(/[-_]/);
  let region: string | undefined;
  for (const part of rest) {
    if (part.length === 1) break;
    if (/^[a-z]{4}$/.test(part)) return RTL_SCRIPTS.has(part) ? "rtl" : "ltr";
    if (!region && (/^[a-z]{2}$/.test(part) || /^\d{3}$/.test(part))) region = part;
  }
  if (language === "sd" && region === "in") return "ltr";
  if (region && RTL_REGIONS[language]?.includes(region)) return "rtl";
  return RTL_LANGUAGES.has(language) ? "rtl" : "ltr";
}

/** The first character with a direction of its own: a letter. Digits, punctuation, spaces and emoji have none. */
const STRONG = /\p{L}/u;

function isRtl(code: number): boolean {
  return (
    (code >= 0x0590 && code <= 0x08ff) ||
    (code >= 0xfb1d && code <= 0xfdff) ||
    (code >= 0xfe70 && code <= 0xfeff) ||
    (code >= 0x10800 && code <= 0x10fff) ||
    (code >= 0x1e800 && code <= 0x1efff)
  );
}

/**
 * The direction of a text by its first letter, as `dir="auto"` decides it, but known before the browser lays it out (and
 * on the server). `undefined` when the text has no letter ("42", "…").
 */
export function scriptDirection(text: string): Direction | undefined {
  const first = STRONG.exec(text)?.[0];
  if (!first) return undefined;
  return isRtl(first.codePointAt(0)!) ? "rtl" : "ltr";
}

/**
 * Text from outside (a file's name, a word in another language, what a person typed) for a place that takes only a string:
 * an `aria-label`, a `title`, a toast, a document title. Wrapped in first-strong isolate marks (U+2068 … U+2069), it keeps
 * its own direction and cannot reorder the words around it. In markup, use `ForeignText` or `Bdi` instead.
 */
export function isolate(text: string): string {
  return text ? `\u2068${text}\u2069` : "";
}
