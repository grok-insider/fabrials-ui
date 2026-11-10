// Origin: Fabrials, 0.12 (from Radiant's lib/markdown/{callouts,bidi,normalize-math} and its segments). No directive and
// no import at all: a host wires these into a remark or a string pipeline, in the browser or in a Node renderer, without
// pulling the design system in. `@fabrials/ai-ui/markdown`.

/* ---------------------------------------------------------------------------------------------- callouts */

/** A GitHub alert, and the teaching kinds a lesson adds. */
export const CALLOUT_KINDS = [
  "note",
  "tip",
  "important",
  "warning",
  "caution",
  "example",
  "definition",
  "summary",
  "question",
] as const;

export type CalloutKind = (typeof CALLOUT_KINDS)[number];

/**
 * Other names for the same kinds, so a document written elsewhere still reads. Radiant writes `[!KEY-IDEA]` and
 * `[!COMMON-MISTAKE]`; GitHub's "info" and "hint" are common too.
 */
const ALIASES: Record<string, CalloutKind> = {
  info: "note",
  hint: "tip",
  danger: "caution",
  error: "caution",
  key: "summary",
  "key-idea": "summary",
  keyidea: "summary",
  remember: "summary",
  mistake: "warning",
  "common-mistake": "warning",
  pitfall: "warning",
  def: "definition",
};

/** The kind a marker word names, or `null` when it names none ("[!BANANA]" stays a plain quote). */
export function calloutKind(word: string): CalloutKind | null {
  const key = word.trim().toLowerCase();
  if ((CALLOUT_KINDS as readonly string[]).includes(key)) return key as CalloutKind;
  return ALIASES[key] ?? null;
}

export type CalloutParse = {
  kind: CalloutKind;
  /** The words after the marker on its line, trimmed; `null` when the marker stands alone. */
  title: string | null;
  /** What follows the marker's line, as it was written: `""` when there is nothing after it. */
  rest: string;
};

// `[!KIND]` at the start of a quote's first line, with any `>` the caller left in, one optional space after each.
const MARKER = /^[ \t]*(?:>[ \t]*)*\[!([A-Za-z-]+)\][ \t]*(.*)$/;

/**
 * Reads the first line of a blockquote: `"[!NOTE]"`, `"[!NOTE] The cache is warm"`, `"> [!warning] Body"`. Case does not
 * matter and the marker may be followed by a custom title. `null` when the line opens no callout, which is what keeps an
 * ordinary quote a quote.
 */
export function calloutOf(text: string): CalloutParse | null {
  const cut = text.indexOf("\n");
  const line = (cut === -1 ? text : text.slice(0, cut)).replace(/\r$/, "");
  const match = MARKER.exec(line);
  if (!match) return null;
  const kind = calloutKind(match[1]!);
  if (!kind) return null;
  const title = match[2]!.trim();
  return { kind, title: title || null, rest: cut === -1 ? "" : text.slice(cut + 1) };
}

/* ---------------------------------------------------------------------------------------------- direction */

/** Scripts written right to left, by the blocks their letters live in. */
const RTL = /[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}]/u;
const LETTER = /\p{L}/u;
/** `https://…`, `ftp://…` and `www.…` up to the next space. */
const URL_LIKE = /(?:[a-z][a-z0-9+.-]*:\/\/|www\.)\S+/gi;
/** A fenced block, open or closed: a model's code is never prose. */
const FENCE = /(?:^|(?<=\n))(`{3,}|~{3,})[^\n]*(?:\n[\s\S]*?(?:\n\1[ \t]*(?=\n|$)|$)|$)/g;
/** An inline code span. */
const CODE_SPAN = /(`+)(?:[^`\n]|[^`\n][^\n]*?[^`\n])\1(?!`)/g;
/** `$…$`, `$$…$$`, `\(…\)` and `\[…\]`: mathematics carries letters that say nothing about the prose. */
const MATH = /\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)/g;
/** An HTML tag or an autolink. */
const TAG = /<[^>\n]*>/g;
/** An image: what a reader sees is the picture, so its alt text does not lead a paragraph. */
const IMAGE = /!\[[^\]]*\]\([^)]*\)/g;
/** A callout's own marker, which is what a caller who passes the quote's first line leaves in. */
const CALLOUT_MARKER = /^\s*(?:>[ \t]*)*\[![A-Za-z-]+\][ \t]*/;

function isRtlLetter(letter: string): boolean {
  return RTL.test(letter);
}

/**
 * The direction of a paragraph from its first strong letter, as a browser decides `dir="auto"`, but with the things that
 * are not prose left out: code, mathematics, tags, images and URLs. A sentence that opens with a number or a link and then
 * speaks Arabic reads right to left. `null` when it has no letter at all ("42", "…"), which takes the direction around it.
 */
export function textDirection(text: string): "rtl" | "ltr" | null {
  const prose = text
    .replace(FENCE, " ")
    .replace(CODE_SPAN, " ")
    .replace(MATH, " ")
    .replace(IMAGE, " ")
    .replace(TAG, " ")
    .replace(URL_LIKE, " ")
    .replace(CALLOUT_MARKER, "");
  const letter = LETTER.exec(prose)?.[0];
  if (!letter) return null;
  return isRtlLetter(letter) ? "rtl" : "ltr";
}

/* ---------------------------------------------------------------------------------------------- mathematics */

/**
 * Fenced blocks (open or closed) and inline code spans: text inside them is literal, so a rewrite leaves it alone.
 */
const CODE_SEGMENT = /(?:^|(?<=\n))(`{3,}|~{3,})[^\n]*(?:\n[\s\S]*?(?:\n\1[ \t]*(?=\n|$)|$)|$)|(`+)(?:[^`\n]|[^`\n][^\n]*?[^`\n])\2(?!`)/g;

/** Applies `rewrite` to every stretch of `text` that is not code. */
function outsideCode(text: string, rewrite: (prose: string) => string): string {
  let out = "";
  let last = 0;
  for (const match of text.matchAll(CODE_SEGMENT)) {
    const start = match.index ?? 0;
    out += rewrite(text.slice(last, start)) + match[0];
    last = start + match[0].length;
  }
  return out + rewrite(text.slice(last));
}

const DISPLAY_BRACKETS = /\\\[([\s\S]+?)\\\]/g;
const INLINE_PARENS = /\\\(([^\n]+?)\\\)/g;
const DISPLAY_MATH = /\$\$[\s\S]*?\$\$/g;
const ENVIRONMENT = /\\begin\{(align|equation|gather|multline|alignat|flalign|eqnarray)(\*?)\}[\s\S]*?\\end\{\1\2\}/g;
/** Prose words (not TeX commands like `\times`) followed by a space. */
const PROSE_WORD = /(?<![\\A-Za-z])[A-Za-z]{3,}\s/;

function convertDelimiters(prose: string): string {
  return prose
    .replace(DISPLAY_BRACKETS, (match, body: string) => (/^\s*\d+\s*$/.test(body) ? match : `\n$$\n${body.trim()}\n$$\n`))
    .replace(INLINE_PARENS, (_match, body: string) => `$${body.trim()}$`);
}

/** Applies `rewrite` outside `$$…$$` blocks, whose body is already what a renderer wants. */
function outsideDisplayMath(text: string, rewrite: (plain: string) => string): string {
  let out = "";
  let last = 0;
  for (const match of text.matchAll(DISPLAY_MATH)) {
    const start = match.index ?? 0;
    out += rewrite(text.slice(last, start)) + match[0];
    last = start + match[0].length;
  }
  return out + rewrite(text.slice(last));
}

function wrapEnvironments(text: string): string {
  return text.replace(ENVIRONMENT, (environment) => `\n$$\n${environment}\n$$\n`);
}

/** Index of the next unescaped `$` on the same line, or -1. */
function closingDollar(text: string, from: number): number {
  for (let at = from; at < text.length; at += 1) {
    const char = text[at];
    if (char === "\n") return -1;
    if (char === "$" && text[at - 1] !== "\\") return at;
  }
  return -1;
}

/**
 * Escapes a `$` before a number when it reads as money: nothing closes it on the same line, or the span up to the next `$`
 * looks like prose ("5 and "). `$2x+1$` and `$3 \times 4$` stay mathematics.
 */
function escapeCurrency(text: string): string {
  if (!text.includes("$")) return text;
  let out = "";
  let at = 0;
  while (at < text.length) {
    const char = text[at]!;
    if (char !== "$" || text[at - 1] === "\\") {
      out += char;
      at += 1;
      continue;
    }
    const close = closingDollar(text, at + 1);
    if (/\d/.test(text[at + 1] ?? "")) {
      const inner = close === -1 ? "" : text.slice(at + 1, close);
      if (close === -1 || /\s$/.test(inner) || PROSE_WORD.test(inner)) {
        out += "\\$";
        at += 1;
        continue;
      }
    }
    if (close === -1) {
      out += char;
      at += 1;
      continue;
    }
    out += text.slice(at, close + 1);
    at = close + 1;
  }
  return out;
}

/**
 * Models mix LaTeX delimiters: `$…$`, `$$…$$`, `\(…\)`, `\[…\]` and a bare `\begin{align}`. The library's renderer reads
 * dollars, so the rest is rewritten into them before rendering. Code is never touched, currency ("$5 and $10") stays text
 * and an escaped citation (`\[3\]`) stays a citation. Running it twice changes nothing more.
 */
export function normalizeMath(markdown: string): string {
  if (!/[$\\]/.test(markdown)) return markdown;
  return outsideCode(markdown, (prose) => outsideDisplayMath(convertDelimiters(prose), (plain) => escapeCurrency(wrapEnvironments(plain))));
}
