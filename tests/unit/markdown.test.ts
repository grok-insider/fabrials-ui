import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { scriptDirection } from "@fabrials/ui";
import { CALLOUT_KINDS, calloutKind, calloutOf, normalizeMath, textDirection } from "@fabrials/ai-ui/markdown";

// The three pure functions a host wires into its own markdown renderer, ported from Radiant's lib/markdown tests and
// widened: `textDirection` reads one paragraph, `calloutOf` the first line of a quote, `normalizeMath` a whole document.

// --- calloutOf -------------------------------------------------------------------------------------------------------

test("GitHub's alerts and the teaching kinds become callouts, whatever the case", () => {
  for (const [marker, kind] of [
    ["[!NOTE]", "note"],
    ["[!TIP]", "tip"],
    ["[!IMPORTANT]", "important"],
    ["[!warning]", "warning"],
    ["[!Caution]", "caution"],
    ["[!EXAMPLE]", "example"],
    ["[!DEFINITION]", "definition"],
    ["[!SUMMARY]", "summary"],
    ["[!QUESTION]", "question"],
  ] as const) {
    assert.deepEqual(calloutOf(marker), { kind, title: null, rest: "" });
  }
});

test("the names other documents use still read, which is how Radiant's own alerts survive", () => {
  for (const [marker, kind] of [
    ["[!info]", "note"],
    ["[!hint]", "tip"],
    ["[!danger]", "caution"],
    ["[!error]", "caution"],
    ["[!key]", "summary"],
    ["[!key-idea]", "summary"],
    ["[!keyidea]", "summary"],
    ["[!remember]", "summary"],
    ["[!mistake]", "warning"],
    ["[!common-mistake]", "warning"],
    ["[!pitfall]", "warning"],
    ["[!def]", "definition"],
  ] as const) {
    assert.equal(calloutOf(marker)?.kind, kind, marker);
    assert.equal(calloutKind(marker.slice(2, -1)), kind, marker);
  }
  assert.equal(calloutKind("BANANA"), null);
  assert.equal(calloutKind(""), null);
});

test("a plain quote, an unknown marker and an empty string stay quotes", () => {
  assert.equal(calloutOf("Just a quote"), null);
  assert.equal(calloutOf("[!BANANA] not a kind"), null);
  assert.equal(calloutOf(""), null);
  assert.equal(calloutOf("[!]"), null);
  assert.equal(calloutOf("A sentence that mentions [!NOTE] halfway"), null);
});

test("a custom title rides on the marker's line, and the rest of the quote comes back as written", () => {
  assert.deepEqual(calloutOf("[!TIP] Start from the units."), { kind: "tip", title: "Start from the units.", rest: "" });
  assert.deepEqual(calloutOf("[!NOTE]   Padded   "), { kind: "note", title: "Padded", rest: "" });
  assert.deepEqual(calloutOf("[!NOTE]\nBody text\nSecond line"), { kind: "note", title: null, rest: "Body text\nSecond line" });
  assert.deepEqual(calloutOf("[!WARNING] Mind the gap\nA list follows\n- one"), { kind: "warning", title: "Mind the gap", rest: "A list follows\n- one" });
});

test("a quote's own `>` marks, nested or spaced, are left to the caller", () => {
  assert.deepEqual(calloutOf("> [!TIP]\n> Body"), { kind: "tip", title: null, rest: "> Body" });
  assert.deepEqual(calloutOf("> >[!NOTE] Deep"), { kind: "note", title: "Deep", rest: "" });
  assert.deepEqual(calloutOf("  >  [!note]  "), { kind: "note", title: null, rest: "" });
  assert.equal(calloutOf("> A plain quote"), null);
});

test("line endings of either kind are read the same", () => {
  assert.deepEqual(calloutOf("[!TIP]\r\nBody\r\n"), { kind: "tip", title: null, rest: "Body\r\n" });
  assert.deepEqual(calloutOf("[!TIP] A title\r\nBody"), { kind: "tip", title: "A title", rest: "Body" });
});

test("every kind a callout can be is a kind", () => {
  assert.deepEqual([...CALLOUT_KINDS], ["note", "tip", "important", "warning", "caution", "example", "definition", "summary", "question"]);
  for (const kind of CALLOUT_KINDS) assert.equal(calloutOf(`[!${kind.toUpperCase()}]`)?.kind, kind);
});

// --- textDirection ---------------------------------------------------------------------------------------------------

test("the first strong letter decides, as the browser's own dir=auto does", () => {
  assert.equal(textDirection("مرحبا بالعالم"), "rtl");
  assert.equal(textDirection("Hello عالم"), "ltr");
  assert.equal(textDirection("שלום world"), "rtl");
  assert.equal(textDirection("١٢٣ ثم أبجد"), "rtl");
  assert.equal(textDirection("123 — 4.5 %"), null);
  assert.equal(textDirection(""), null);
});

test("URLs are not prose, whichever way they are written", () => {
  assert.equal(textDirection("https://react.dev/reference للمزيد"), "rtl");
  assert.equal(textDirection("www.example.com/path ثم"), "rtl");
  assert.equal(textDirection("<https://example.org/a> نص"), "rtl");
  assert.equal(textDirection("https://example.org/مرحبا and more"), "ltr");
});

test("inline code, mathematics, tags and images do not lead", () => {
  assert.equal(textDirection("`useState` تحفظ الحالة"), "rtl");
  assert.equal(textDirection("$E=mc^2$ هي معادلة"), "rtl");
  assert.equal(textDirection("$$x = 1$$ شرح"), "rtl");
  assert.equal(textDirection("\\(a+b\\) شرح"), "rtl");
  assert.equal(textDirection("<span class=\"x\">نص</span> more"), "rtl");
  assert.equal(textDirection("![صورة](photo.png) then English"), "ltr");
  assert.equal(textDirection("`only code`"), null);
});

test("each block reads its own first letter, so a mixed answer is not one direction", () => {
  const lines = "مرحبا بالعالم\n\nHello world\n\n# عنوان\n\n- استخدم `setCount` لتحديث القيمة\n- Never mutate state directly\n- ثم اقرأ";
  assert.deepEqual(
    lines.split("\n").filter(Boolean).map((line) => textDirection(line)),
    ["rtl", "ltr", "rtl", "rtl", "ltr", "rtl"],
  );
});

test("a quote, a table and a cell each get their own direction", () => {
  assert.equal(textDirection("> قال نيوتن إن كل جسم يجذب كل جسم"), "rtl");
  assert.equal(textDirection("| الكوكب | g |"), "rtl");
  assert.deepEqual(["الكوكب", "g", "الأرض", "9.8"].map((cell) => textDirection(cell)), ["rtl", "ltr", "rtl", null]);
});

test("a code fence, or text without a letter, has no direction", () => {
  assert.equal(textDirection("```py\nprint('مرحبا')\n```"), null);
  assert.equal(textDirection("~~~\nمرحبا\n~~~"), null);
  assert.equal(textDirection("1234"), null);
  assert.equal(textDirection("… — 42 %"), null);
  assert.equal(textDirection("😀 🎉"), null);
});

test("leading markdown symbols and a number do not hide the first letter", () => {
  assert.equal(textDirection("## عنوان"), "rtl");
  assert.equal(textDirection("- بند"), "rtl");
  assert.equal(textDirection("1. بند"), "rtl");
  assert.equal(textDirection("> [!NOTE] نص"), "rtl");
  assert.equal(textDirection("[رابط](https://example.org) نص"), "rtl");
});

// The module is the one place a Node renderer imports, so it must not drag the design system (or React) with it.
test("the markdown module imports nothing at all", () => {
  const source = readFileSync(new URL("../../packages/ai-ui/src/markdown.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /^\s*import\s/m);
  assert.doesNotMatch(source, /\brequire\(/);
  assert.doesNotMatch(source, /"use client"/);
});

// It keeps its own copy of the first-strong-letter rule so it can be imported without the design system: this holds the two
// together. They differ on purpose only where a paragraph holds code, mathematics, a URL or an image.
test("on prose it agrees with @fabrials/ui's own first-strong-letter rule", () => {
  for (const sample of ["مرحبا بالعالم", "Hello عالم", "שלום world", "١٢٣ ثم أبجد", "123 — 4.5 %", "", "…", "# عنوان", "- بند"]) {
    assert.equal(textDirection(sample) ?? undefined, scriptDirection(sample), sample);
  }
});

// --- normalizeMath ---------------------------------------------------------------------------------------------------

test("parenthesis and bracket delimiters become dollars", () => {
  assert.equal(normalizeMath("Area is \\( \\pi r^2 \\)."), "Area is $\\pi r^2$.");
  assert.equal(normalizeMath("So:\n\\[\n  E = mc^2\n\\]\nDone"), "So:\n\n$$\nE = mc^2\n$$\n\nDone");
});

test("an escaped citation is not mathematics", () => {
  assert.equal(normalizeMath("Seen in \\[3\\] and \\[12\\]."), "Seen in \\[3\\] and \\[12\\].");
});

test("a bare display environment is wrapped, and one already in dollars is left whole", () => {
  assert.equal(normalizeMath("\\begin{align*} a &= b \\\\ c &= d \\end{align*}"), "\n$$\n\\begin{align*} a &= b \\\\ c &= d \\end{align*}\n$$\n");
  const wrapped = "$$\n\\begin{aligned} x &= 1 \\end{aligned}\n$$";
  assert.equal(normalizeMath(wrapped), wrapped);
  const inDollars = "$$\\begin{align} x \\end{align}$$";
  assert.equal(normalizeMath(inDollars), inDollars);
});

test("currency is protected and mathematics is not", () => {
  assert.equal(normalizeMath("It costs $5 and $10 later."), "It costs \\$5 and \\$10 later.");
  assert.equal(normalizeMath("Only $20."), "Only \\$20.");
  assert.equal(normalizeMath("Solve $2x + 1 = 5$ now"), "Solve $2x + 1 = 5$ now");
  assert.equal(normalizeMath("Compute $3 \\times 4$."), "Compute $3 \\times 4$.");
  assert.equal(normalizeMath("Let $x$ be $10$ units"), "Let $x$ be $10$ units");
  assert.equal(normalizeMath("Already \\$5 here"), "Already \\$5 here");
});

test("a dollar that closes nothing stays as it was written", () => {
  assert.equal(normalizeMath("A line that ends with $"), "A line that ends with $");
  assert.equal(normalizeMath("Between $ signs $"), "Between $ signs $");
  // A price at the end of a line has no closing dollar on that line, so it is money.
  assert.equal(normalizeMath("It costs $5\nand then $10 later."), "It costs \\$5\nand then \\$10 later.");
});

test("code is never rewritten, and a fence inside a fence is still code", () => {
  const code = "```latex\n\\(x\\) costs $5 and $10\n```";
  assert.equal(normalizeMath(code), code);
  assert.equal(normalizeMath("Run `echo $5 \\(x\\)` then \\(y\\)"), "Run `echo $5 \\(x\\)` then $y$");
  const nested = "````md\n```js\n\\(x\\) and $5\n```\n````";
  assert.equal(normalizeMath(nested), nested);
  const open = "```py\n\\(x\\) and $5";
  assert.equal(normalizeMath(open), open);
  assert.equal(normalizeMath("``a ` b`` and \\(x\\)"), "``a ` b`` and $x$");
});

test("mhchem and display mathematics pass through untouched", () => {
  const chem = "$$\\ce{2H2 + O2 -> 2H2O}$$ and $\\ce{H2O}$";
  assert.equal(normalizeMath(chem), chem);
});

test("running it again changes nothing more", () => {
  const samples = [
    "Area is \\( \\pi r^2 \\).",
    "So:\n\\[\n  E = mc^2\n\\]\nDone",
    "\\begin{align} a &= b \\end{align}",
    "It costs $5 and $10 later.",
    "Seen in \\[3\\] and \\[12\\].",
    "Text with no mathematics at all, and a path C:\\Users\\ana.",
    "```latex\n\\(x\\)\n```\n\\(y\\)",
  ];
  for (const sample of samples) assert.equal(normalizeMath(normalizeMath(sample)), normalizeMath(sample), sample);
});

test("CRLF documents read the same as LF ones", () => {
  assert.equal(normalizeMath("Area is \\( \\pi r^2 \\).\r\nNext line"), "Area is $\\pi r^2$.\r\nNext line");
  const block = "So:\r\n\\[\r\n  E = mc^2\r\n\\]\r\nDone";
  assert.equal(normalizeMath(block), "So:\r\n\n$$\nE = mc^2\n$$\n\r\nDone");
});

test("a document with neither a dollar nor a backslash is returned as it came", () => {
  const plain = "Just a paragraph.\n\n* With a list\n* And no mathematics";
  assert.equal(normalizeMath(plain), plain);
  assert.equal(normalizeMath(""), "");
});
