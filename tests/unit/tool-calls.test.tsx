import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { ZoomPan } from "../../packages/ui/src/index";
import { clampZoom, fitZoom, sameZoom, wheelZooms, zoomByPinch, zoomByStep, zoomByWheel, zoomPercent, zoomRange } from "../../packages/ui/src/zoom-pan-logic";
import { SuggestionChips, ToolCall, toolCallLabel, toolPayload } from "../../packages/ai-ui/src/index";
import { uiStyles, aiStyles } from "./read-styles";

const ui = uiStyles();
const ai = aiStyles();
const rule = (sheet: string, selector: string) => {
  const at = sheet.indexOf(selector);
  assert.ok(at >= 0, `missing rule ${selector}`);
  return sheet.slice(at, sheet.indexOf("}", at) + 1);
};
/** The body of a block that opens at `marker`. */
const blockAt = (sheet: string, marker: string) => {
  const start = sheet.indexOf(marker);
  assert.ok(start >= 0, `missing ${marker}`);
  const open = sheet.indexOf("{", start);
  let depth = 0;
  for (let at = open; at < sheet.length; at += 1) {
    if (sheet[at] === "{") depth += 1;
    if (sheet[at] === "}" && --depth === 0) return sheet.slice(open + 1, at);
  }
  throw new Error(`unbalanced block at ${marker}`);
};

/* ------------------------------------------------------------ the rules */

test("a zoom range is made safe: positive, finite, and never upside down", () => {
  assert.deepEqual(zoomRange(1, 4), { min: 1, max: 4 });
  assert.deepEqual(zoomRange(0, 0), { min: 1, max: 4 });
  assert.deepEqual(zoomRange(Number.NaN, -2), { min: 1, max: 4 });
  assert.deepEqual(zoomRange(2, 1), { min: 2, max: 2 });
  assert.equal(clampZoom(9, { min: 1, max: 4 }), 4);
  assert.equal(clampZoom(0.2, { min: 1, max: 4 }), 1);
  assert.equal(clampZoom(Number.NaN, { min: 0.5, max: 4 }), 0.5);
  assert.ok(sameZoom(1.0004, 1));
  assert.ok(!sameZoom(1.01, 1));
  assert.equal(zoomPercent(1.254), 125);
});

test("the wheel zooms in `zoom` mode, only with Ctrl or Cmd in `ctrl` mode, and a notch is a quarter", () => {
  const range = { min: 1, max: 4 };
  assert.equal(wheelZooms({ ctrlKey: false }, "ctrl"), false);
  assert.equal(wheelZooms({ ctrlKey: true }, "ctrl"), true);
  assert.equal(wheelZooms({ ctrlKey: false, metaKey: true }, "ctrl"), true);
  assert.equal(wheelZooms({ ctrlKey: false }, "zoom"), true);
  // A mouse notch (>= 40 px) up is one step of 1.25; down is the same step back.
  assert.equal(zoomByWheel({ deltaY: -100, ctrlKey: false }, 1, range), 1.25);
  assert.equal(zoomByWheel({ deltaY: 100, ctrlKey: false }, 1.25, range), 1);
  // At a limit, nothing changes.
  assert.equal(zoomByWheel({ deltaY: -100, ctrlKey: true }, 4, range), null);
  // Sideways scrolls, never zooms.
  assert.equal(zoomByWheel({ deltaX: -120, deltaY: -10, ctrlKey: true }, 1, range), null);
  // A range that starts below 1 counts its steps from there: 2 is the middle of 0.5 to 3.5.
  assert.equal(zoomByStep(1, 1, { min: 0.5, max: 8 }), 1.25);
  assert.equal(zoomByStep(0.5, -1, { min: 0.5, max: 8 }), 0.5);
  // Two fingers twice as far apart double the scale, inside the range.
  assert.equal(zoomByPinch(1, 100, 200, range), 2);
  assert.equal(zoomByPinch(3, 100, 400, range), 4);
  assert.equal(zoomByPinch(1, 0, 200, range), 1);
});

test("fit shows the whole content up to its natural width, and 1 when nothing was measured", () => {
  assert.equal(fitZoom({ width: 480, height: 270 }, { width: 480, height: 400 }, { min: 1, max: 4 }), 1);
  assert.equal(fitZoom({ width: 480, height: 800 }, { width: 480, height: 400 }, { min: 0.5, max: 4 }), 0.5);
  assert.equal(fitZoom({ width: 480, height: 800 }, { width: 480, height: 400 }, { min: 1, max: 4 }), 1, "a range that starts at 1 cannot fit below it");
  // Fit never enlarges past the natural layout, and the smallest scale catches a drawing that cannot fit.
  assert.equal(fitZoom({ width: 480, height: 270 }, { width: 480, height: 400 }, { min: 0.75, max: 4 }), 1);
  assert.equal(fitZoom({ width: 480, height: 600 }, { width: 480, height: 400 }, { min: 0.75, max: 4 }), 0.75);
  assert.equal(fitZoom({ width: 0, height: 0 }, { width: 300, height: 200 }, { min: 1, max: 4 }), 1);
});

test("a tool call says its state in words, and its payload as JSON only when it is JSON", () => {
  assert.equal(toolCallLabel("pending", "search_docs", undefined), "Waiting to run search_docs");
  assert.equal(toolCallLabel("running", "search_docs", undefined), "Running search_docs");
  assert.equal(toolCallLabel("done", "search_docs", 1_240), "Ran search_docs in 1.2s");
  assert.equal(toolCallLabel("done", "search_docs", undefined), "Ran search_docs");
  assert.equal(toolCallLabel("error", "read_file", undefined), "read_file failed");
  assert.equal(toolCallLabel("denied", "run_tests", undefined), "run_tests was not allowed");
  assert.equal(toolCallLabel("done", "x", 500, { done: (name) => `Finished ${name}` }), "Finished x in 0.5s");
  assert.deepEqual(toolPayload({ a: 1 }), { text: '{\n  "a": 1\n}', language: "json" });
  assert.deepEqual(toolPayload('{"b":2}'), { text: '{\n  "b": 2\n}', language: "json" });
  assert.deepEqual(toolPayload("18 tests passed"), { text: "18 tests passed", language: "text" });
  assert.deepEqual(toolPayload("{not json"), { text: "{not json", language: "text" });
  assert.equal(toolPayload(undefined), null);
  assert.equal(toolPayload("   "), null);
});

/* ------------------------------------------------------------ the markup */

test("the viewport is a named tab stop only while it is interactive", () => {
  const plain = renderToStaticMarkup(
    <ZoomPan interactive={false}>
      <p>Plan</p>
    </ZoomPan>,
  );
  assert.match(plain, /class="fui-zoom-pan"(?!.*data-interactive)/);
  assert.doesNotMatch(plain, /role="region"/);
  assert.doesNotMatch(plain, /tabindex="0"/);
  assert.doesNotMatch(plain, /fui-zoom-pan-controls/);
  const live = renderToStaticMarkup(
    <ZoomPan label="Floor plan, zoomable">
      <p>Plan</p>
    </ZoomPan>,
  );
  assert.match(live, /role="region"/);
  assert.match(live, /aria-label="Floor plan, zoomable"/);
  assert.match(live, /tabindex="0"/);
  assert.match(live, /aria-describedby="[^"]+"/);
  assert.match(live, /role="toolbar"[^>]*aria-label="Zoom"/);
  assert.match(live, /<button[^>]*aria-disabled="true"[^>]*>.*?fui-toolbar-label">Zoom out</);
  assert.match(live, /class="fui-zoom-pan-level"[^>]*>100%</);
  assert.match(live, />Fit</);
});

test("a tool call opens by itself only when it failed, and says each state in words", () => {
  const failed = renderToStaticMarkup(<ToolCall error="The file was not found." input={{ path: "a.md" }} name="read_file" state="error" />);
  assert.match(failed, /data-state="error"/);
  assert.match(failed, /aria-expanded="true"/);
  assert.match(failed, /read_file failed/);
  assert.match(failed, /class="fui-tool-call-error"/);
  assert.match(failed, /fui-token-property">(?:&quot;|")path(?:&quot;|")</);
  assert.match(failed, /a\.md/);
  // The mark is the library's own, settled on a cross: no stock colour classes anywhere.
  assert.match(failed, /data-outcome="failed"/);
  assert.doesNotMatch(failed, /text-(red|green|yellow|blue|orange)-\d/);
  const done = renderToStaticMarkup(<ToolCall duration={1_200} input={{ q: "x" }} name="search_docs" output={{ n: 2 }} state="done" />);
  assert.match(done, /aria-expanded="false"/);
  assert.match(done, /Ran search_docs in 1\.2s/);
  assert.match(done, /data-outcome="done"/);
  assert.doesNotMatch(done, />Input</, "a call that succeeded stays closed");
  const opened = renderToStaticMarkup(<ToolCall defaultOpen duration={900} input={{ q: "x" }} name="search_docs" output={{ n: 2 }} state="done" />);
  assert.match(opened, />Input</);
  assert.match(opened, />Output</);
  assert.match(opened, /aria-expanded="true"/);
  // A call with nothing to show is a line, not a disclosure.
  const bare = renderToStaticMarkup(<ToolCall name="pong" state="running" />);
  assert.match(bare, /role="status"/);
  assert.doesNotMatch(bare, /aria-expanded/);
});

test("follow-up chips are one tab stop with the arrows between them", () => {
  const html = renderToStaticMarkup(
    <SuggestionChips items={[{ id: "a", label: "Quiz me" }, { id: "b", label: "أبسط", lang: "ar" }]} onSelect={() => {}} />,
  );
  assert.match(html, /role="group"[^>]*aria-label="Follow-ups"|aria-label="Follow-ups"[^>]*role="group"/);
  const buttons = html.match(/<button[^>]*data-slot="suggestion-chip"[^>]*>/g) ?? [];
  assert.equal(buttons.length, 2);
  assert.match(buttons[0]!, /tabindex="0"/);
  assert.match(buttons[1]!, /tabindex="-1"/);
  assert.match(buttons[1]!, /dir="auto"/);
  assert.match(buttons[1]!, /lang="ar"/);
  // A disabled group blocks every chip, and an empty one renders nothing.
  const disabled = renderToStaticMarkup(<SuggestionChips disabled items={[{ id: "a", label: "Quiz me" }]} onSelect={() => {}} />);
  assert.match(disabled, /<button[^>]*disabled/);
  assert.equal(renderToStaticMarkup(<SuggestionChips items={[]} onSelect={() => {}} />), "");
});

/* --------------------------------------------------------------- the styles */

test("the zoom viewport takes a touch only where it can zoom, and its ring is drawn inside", () => {
  assert.match(rule(ui, ".fui-zoom-pan[data-interactive] > .fui-zoom-pan-viewport {"), /touch-action: pan-x pan-y;/);
  assert.match(rule(ui, ".fui-zoom-pan[data-interactive] > .fui-zoom-pan-viewport {"), /overflow: auto;/);
  assert.match(rule(ui, ".fui-zoom-pan[data-interactive] > .fui-zoom-pan-viewport:focus-visible {"), /outline-offset: -2px;/);
  assert.equal(ui.match(/touch-action: pan-x pan-y/g)?.length, 1);
  // Zoomed, the scaled box is placed inside the viewport, and the content's origin follows the direction.
  assert.match(rule(ui, ".fui-zoom-pan[data-zoomed] > .fui-zoom-pan-viewport > .fui-zoom-pan-sizer {"), /position: absolute;/);
  assert.match(rule(ui, ".fui-zoom-pan-content {"), /transform-origin: 0 0;/);
  assert.match(rule(ui, ".fui-zoom-pan-content:dir(rtl) {"), /transform-origin: 100% 0;/);
  assert.match(ui, /\.fui-zoom-pan-controls \.fui-button:is\(\[data-size\], \[class\*="fui-button-size"\]\)/);
  assert.match(ui, /@media \(hover: hover\) and \(pointer: fine\) and \(min-width: 768px\) \{/);
  // No transition or animation of its own: a zoom shows at once, and reduced motion has nothing to turn off.
  const zoomBlock = blockAt(ui, "@layer components {\n  /* 0.12: zoom pan */");
  assert.doesNotMatch(zoomBlock, /animation:/);
  assert.doesNotMatch(zoomBlock, /transition:/);
});

test("a follow-up chip is a soft tag that is a button, and a 44 px target on a coarse pointer", () => {
  const chip = rule(ai, ".fui-suggestion-chip {");
  assert.match(chip, /border-radius: var\(--fui-radius-sm\);/);
  assert.match(chip, /min-block-size: 1.75rem;/);
  assert.match(chip, /background: color-mix\(in oklab, var\(--muted-foreground\) var\(--fui-tint-strong\), var\(--card\)\);/);
  assert.match(ai, /@media \(max-width: 767px\), \(pointer: coarse\) \{\s*\.fui-suggestion-chip \{\s*min-block-size: 2\.75rem;/);
  // The pointer deepens the tint, and only where there is a pointer to hover with.
  const hover = blockAt(ai, "@media (hover: hover) and (pointer: fine) {\n    .fui-suggestion-chip:hover");
  assert.match(hover, /--fui-tint-edge/);
  // A call that has not started holds its mark still.
  assert.match(rule(ai, '.fui-tool-call[data-state="pending"] .fui-agent-mark rect {'), /animation: none !important;/);
  // A long payload stops at 14rem and scrolls inside, and its tab stop draws the ring inside.
  assert.match(rule(ai, ".fui-tool-call-code {"), /max-block-size: 14rem;/);
  assert.match(rule(ai, ".fui-tool-call-code:focus-visible {"), /outline-offset: -2px;/);
  // In forced colors a chip and a failed call keep an edge, because a tint is repainted away.
  const forced = blockAt(ai, "@media (forced-colors: active) {\n    .fui-suggestion-chip {");
  assert.match(forced, /\.fui-suggestion-chip \{\s*border: 1px solid ButtonText;/);
  assert.match(forced, /\.fui-tool-call-error \{[\s\S]*?border: 1px solid CanvasText;/);
  assert.match(forced, /\.fui-tool-call-code \{[\s\S]*?outline: 1px solid CanvasText;/);
  // On paper the payload is shown whole.
  const print = blockAt(ai, "@media print {\n    .fui-tool-call-code {");
  assert.match(print, /max-block-size: none;[\s\S]*?overflow: visible;/);
  // A chip that arrives later rises only where motion is allowed: `.fui-rise` lives inside that query, and under the
  // system's reduced motion nothing is started.
  const rise = ui.indexOf(".fui-rise {");
  const motion = ui.lastIndexOf("@media (prefers-reduced-motion: no-preference) {", rise);
  assert.ok(motion > -1 && motion < rise, "the rise rule sits inside a no-preference query");
  assert.equal(ui.slice(motion, rise).split("{").length - ui.slice(motion, rise).split("}").length, 1);
});
