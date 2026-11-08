import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { Progress, ScrambleText, ShimmerText, Spinner, scrambleFrame } from "../../packages/ui/src/index";
import { ChatMessage, GenerationFrame, SourceTally } from "../../packages/ai-ui/src/index";

const uiStyles = readFileSync(new URL("../../packages/ui/src/styles.css", import.meta.url), "utf8");
const aiStyles = readFileSync(new URL("../../packages/ai-ui/src/styles.css", import.meta.url), "utf8");

/** True when the first `animation: name` in `styles` sits inside a block for people who allow motion. */
function movesOnlyWithMotion(styles: string, name: string) {
  const at = styles.search(new RegExp(`animation:\\s+(?:[^;]*,\\s+)?${name} [\\dv]`));
  assert.ok(at > 0, name);
  const before = styles.slice(0, at);
  return before.lastIndexOf("@media (prefers-reduced-motion: no-preference)") > before.lastIndexOf("@media (prefers-reduced-motion: reduce)");
}

test("five busy marks in square cells, each named once and holding a still frame", () => {
  const cells = (html: string) => (html.match(/<rect /g) ?? []).length;
  const ring = renderToStaticMarkup(<Spinner />);
  assert.match(ring, /role="status"[^>]*aria-label="Loading"/);
  assert.doesNotMatch(ring, /data-variant/);
  assert.equal(cells(ring), 8);
  const sizes = { dots: 3, bars: 9, grid: 9, line: 5 } as const;
  for (const [variant, count] of Object.entries(sizes)) {
    const html = renderToStaticMarkup(<Spinner label="Counting" variant={variant as keyof typeof sizes} />);
    assert.match(html, new RegExp(`data-variant="${variant}"`));
    assert.equal(cells(html), count, variant);
    assert.match(html, /--fui-spinner-still:/);
  }
  assert.match(renderToStaticMarkup(<Spinner variant="line" />), /viewBox="0 0 19 3"/);
  for (const name of ["fui-pixel-dot", "fui-pixel-bar-2", "fui-pixel-bar-3", "fui-pixel-grid", "fui-pixel-line"]) assert.ok(movesOnlyWithMotion(uiStyles, name), name);
});

test("a scan is a strip of cells while the total is unknown, and a bar once a value arrives", () => {
  const scan = renderToStaticMarkup(<Progress aria-label="Searching the docs" variant="scan" />);
  assert.match(scan, /role="progressbar"/);
  assert.doesNotMatch(scan, /aria-valuenow/);
  assert.match(scan, /data-variant="scan"/);
  assert.match(scan, /<span aria-hidden="true" class="fui-progress-scan"/);
  const known = renderToStaticMarkup(<Progress aria-label="Searching the docs" value={40} variant="scan" />);
  assert.doesNotMatch(known, /data-variant="scan"|fui-progress-scan/);
  assert.match(known, /fui-progress-indicator/);
  assert.ok(movesOnlyWithMotion(uiStyles, "fui-progress-scan"));
  assert.match(uiStyles, /@media \(forced-colors: active\) \{[\s\S]*?\.fui-progress-scan > span::after \{\s*background: Highlight;/);
});

test("a scramble settles left to right in the new text's own glyphs and holds spaces and punctuation", () => {
  const always = () => 0;
  assert.equal(scrambleFrame("Reading the schema", 1), "Reading the schema");
  const half = scrambleFrame("Reading the schema", 0.5, always);
  assert.equal(Array.from(half).length, Array.from("Reading the schema").length);
  assert.ok(half.startsWith("Reading t"), half);
  assert.equal(half[11], " ");
  assert.equal(scrambleFrame("a, b.", 0, always), "R, R.".replace(/R/g, "a"));
  // Another script scrambles in its own letters.
  const arabic = scrambleFrame("قراءة الملفات", 0, () => 0.99);
  assert.ok(Array.from(arabic).every((char) => /[\u0600-\u06FF ]/.test(char)), arabic);
  // The first render shows the text at once, with no frame over it.
  assert.equal(renderToStaticMarkup(<ScrambleText>Reading the schema</ScrambleText>), '<span class="fui-scramble-text">Reading the schema</span>');
  assert.match(uiStyles, /\.fui-scramble-text-frame \{[^}]*position: absolute;[^}]*overflow: hidden;[^}]*white-space: nowrap;/);
});

test("letter by letter, the words are read once and the letters are decoration", () => {
  const html = renderToStaticMarkup(
    <ShimmerText as="span" tone="light" variant="letters">
      Reading
    </ShimmerText>,
  );
  assert.match(html, /^<span class="fui-shimmer-text" data-tone="light" data-variant="letters" style="--fui-shimmer-count:7;--fui-shimmer-steps:10;--fui-shimmer-duration:2s">/);
  assert.match(html, /<span class="fui-sr-only">Reading<\/span><span aria-hidden="true"><span style="--i:0">R<\/span>/);
  assert.ok(movesOnlyWithMotion(uiStyles, "fui-shimmer-letters"));
});

test("a streaming answer is busy and ends in a caret that is never read", () => {
  const html = renderToStaticMarkup(
    <ChatMessage from="assistant" streaming>
      Import the tokens
    </ChatMessage>,
  );
  assert.match(html, /^<div aria-busy="true" class="fui-chat-message" data-role="assistant" data-streaming="true">/);
  assert.match(html, /Import the tokens<span aria-hidden="true" class="fui-stream-caret"><\/span><\/div>/);
  const done = renderToStaticMarkup(<ChatMessage from="assistant">Import the tokens</ChatMessage>);
  assert.doesNotMatch(done, /aria-busy|fui-stream-caret|data-streaming/);
  assert.ok(movesOnlyWithMotion(aiStyles, "fui-caret-blink"));
});

test("a source tally counts each source once and draws a tile for each, up to its cap", () => {
  const urls = ["https://a.example.org/1", "https://b.example.org/2", "https://a.example.org/1", "https://c.example.org/3"];
  const html = renderToStaticMarkup(<SourceTally max={2} sources={urls} />);
  assert.match(html, /<span class="fui-source-tally-label">Reviewing sources<\/span>/);
  assert.match(html, /<span class="fui-sr-only">3<\/span>/);
  assert.equal((html.match(/class="fui-source-tally-tile"/g) ?? []).length, 2);
  assert.match(html, /<span aria-hidden="true" class="fui-source-tally-tiles">/);
  assert.doesNotMatch(renderToStaticMarkup(<SourceTally sources={[]} />), /fui-source-tally-tiles/);
});

test("a picture can refine or scan, a document is written row by row, and a known progress places the field", () => {
  const refine = renderToStaticMarkup(<GenerationFrame alt="A harbour" effect="refine" status="generating" />);
  assert.match(refine, /data-effect="refine"/);
  assert.match(refine, /<span aria-hidden="true" class="fui-generation-refine"><span data-layer="coarse"><\/span><span data-layer="fine"><\/span><span class="fui-generation-band"><\/span><\/span>/);
  assert.match(refine, /data-variant="raster"/);
  const scan = renderToStaticMarkup(<GenerationFrame alt="A harbour" effect="scan" progress={0.5} status="generating" />);
  assert.match(scan, /<span aria-hidden="true" class="fui-generation-scan" data-progress="true" style="[^"]*--fui-scan-band:50%/);
  const page = renderToStaticMarkup(<GenerationFrame alt="Release notes" kind="document" progress={0.5} status="generating" />);
  assert.match(page, /data-kind="document"/);
  assert.equal((page.match(/--length:/g) ?? []).length, 17);
  assert.match(page, /class="fui-generation-page" data-progress="true" style="--fui-page-t:8.5"/);
  assert.match(page, /data-variant="type"/);
  assert.match(page, /Writing the document/);
  // Done without a picture, the frame holds what the host gives it, and says so.
  const done = renderToStaticMarkup(
    <GenerationFrame alt="Release notes" kind="document" status="done">
      <p>Release notes</p>
    </GenerationFrame>,
  );
  assert.match(done, /<div class="fui-generation-content"><p>Release notes<\/p><\/div>/);
  assert.match(done, /Document ready/);
  for (const name of ["fui-refine-pass", "fui-scan-band", "fui-page-write"]) assert.ok(movesOnlyWithMotion(aiStyles, name), name);
  assert.match(aiStyles, /@media \(forced-colors: active\) \{[\s\S]*?\.fui-generation-refine,\n\s*\.fui-generation-scan,\n\s*\.fui-generation-page,/);
});
