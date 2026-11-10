import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { ZoomPan } from "../../packages/ui/src/index";
import { clampZoom, fitZoom, sameZoom, wheelZooms, zoomByPinch, zoomByStep, zoomByWheel, zoomPercent, zoomRange } from "../../packages/ui/src/zoom-pan-logic";
import {
  sourceExtensionFor,
  ArtifactFrame,
  SuggestionChips,
  ToolCall,
  asyncRenderReducer,
  deriveArtifactStatus,
  downloadFormats,
  reasonText,
  toolCallLabel,
  toolPayload,
  type AsyncRenderState,
} from "../../packages/ai-ui/src/index";

const ui = readFileSync(new URL("../../packages/ui/src/styles.css", import.meta.url), "utf8");
const ai = readFileSync(new URL("../../packages/ai-ui/src/styles.css", import.meta.url), "utf8");
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

test("an async render drops the answer of a run that was replaced, and keeps the last value while the next loads", () => {
  const initial: AsyncRenderState<string> = { run: 0, status: "loading", value: null, error: null };
  const started = asyncRenderReducer(initial, { type: "start", run: 1 });
  assert.equal(started.status, "loading");
  const done = asyncRenderReducer(started, { type: "done", run: 1, value: "first" });
  assert.deepEqual(done, { run: 1, status: "ready", value: "first", error: null });
  const again = asyncRenderReducer(done, { type: "start", run: 2 });
  assert.equal(again.status, "loading");
  assert.equal(again.value, "first", "a redraw never blanks");
  // The first run answers late: nothing happens.
  assert.deepEqual(asyncRenderReducer(again, { type: "done", run: 1, value: "stale" }), again);
  assert.deepEqual(asyncRenderReducer(again, { type: "fail", run: 1, error: new Error("stale") }), again);
  const failed = asyncRenderReducer(again, { type: "fail", run: 2, error: new Error("boom") });
  assert.equal(failed.status, "error");
  assert.equal(failed.value, "first");
  assert.deepEqual(asyncRenderReducer(failed, { type: "done", run: 2, value: "second" }), { run: 2, status: "ready", value: "second", error: null });
});

test("the downloads a frame offers come from what the rendering gave it", () => {
  const svg = () => "<svg/>";
  const png = () => new Blob();
  assert.deepEqual(downloadFormats({ exporters: null, source: "x" }), ["source"]);
  assert.deepEqual(downloadFormats({ exporters: { svg } }), ["svg", "png"]);
  assert.deepEqual(downloadFormats({ exporters: { png } }), ["png"]);
  assert.deepEqual(downloadFormats({ exporters: { svg, png }, source: "x" }), ["svg", "png", "source"]);
  // A failed drawing offers its source only.
  assert.deepEqual(downloadFormats({ exporters: { svg, png }, source: "x", failed: true }), ["source"]);
  assert.deepEqual(downloadFormats({ exporters: null }), []);
});

test("a downloaded source takes its extension from its language when the host does not name one", () => {
  assert.equal(sourceExtensionFor("xml"), "xml");
  assert.equal(sourceExtensionFor("SVG"), "svg");
  assert.equal(sourceExtensionFor("python"), "py");
  assert.equal(sourceExtensionFor("mermaid"), "mmd");
  assert.equal(sourceExtensionFor(undefined), "txt");
  assert.equal(sourceExtensionFor("cobol"), "txt");
  assert.equal(sourceExtensionFor("cobol", "cbl"), "cbl");
});

test("the status shown follows the host or the children, and a failure waits for the source to stop arriving", () => {
  assert.equal(deriveArtifactStatus({ ready: false, failed: false, pending: true, streaming: false }), "loading");
  assert.equal(deriveArtifactStatus({ ready: false, failed: false, pending: false, streaming: true }), "loading");
  assert.equal(deriveArtifactStatus({ ready: true, failed: false, pending: true, streaming: false }), "ready");
  assert.equal(deriveArtifactStatus({ ready: false, failed: true, pending: false, streaming: false }), "error");
  assert.equal(deriveArtifactStatus({ ready: false, failed: false, pending: false, streaming: false }), "ready");
  assert.equal(deriveArtifactStatus({ status: "error", ready: true, failed: false, pending: false, streaming: false }), "error");
  assert.equal(reasonText(new Error("no closing brace")), "no closing brace");
  assert.equal(reasonText("  the browser refused  "), "the browser refused");
  assert.equal(reasonText({}), "It failed without a reason.");
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

test("a frame names its notation and title, and keeps the body busy until the drawing is there", () => {
  const html = renderToStaticMarkup(
    <ArtifactFrame kind="Chart" pending source="<svg/>" title="Sign-ups">
      {() => null}
    </ArtifactFrame>,
  );
  assert.match(html, /<figure[^>]*class="fui-artifact"[^>]*data-status="loading"/);
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /class="fui-artifact-kind">Chart</);
  // The title is isolated from the header's direction, so a title in another script keeps its own.
  assert.match(html, /class="fui-artifact-title"[^>]*><bdi>Sign-ups<\/bdi></);
  assert.match(html, /role="status"[^>]*>Loading the chart…</);
  // The body reserves its height, so nothing moves when the drawing arrives.
  assert.match(html, /class="fui-artifact-body"[^>]*style="min-height:10rem"/);
  // The toolbar is one named group, and its source toggle is a pressed key.
  assert.match(html, /role="toolbar"[^>]*aria-label="Drawing actions: Sign-ups"/);
  assert.match(html, /aria-pressed="false"/);
  assert.match(html, /aria-hidden="true" class="fui-skeleton/);
  // No dialog is in the page until it is opened.
  assert.doesNotMatch(html, /fui-artifact-dialog/);
});

test("a failure says its reason in a status and keeps the source, never an empty box", () => {
  const html = renderToStaticMarkup(
    <ArtifactFrame error="Unexpected token '<'." kind="Diagram" source={'svg: <rect width="10"'} title="Floor plan">
      {() => null}
    </ArtifactFrame>,
  );
  assert.match(html, /data-status="error"/);
  assert.match(html, /role="status"[^>]*class="fui-artifact-error"|class="fui-artifact-error"[^>]*role="status"/);
  assert.match(html, /Couldn’t draw this diagram:/);
  assert.match(html, /Unexpected token/);
  assert.match(html, /class="fui-artifact-source fui-code-panel-body"[^>]*tabindex="0"/);
  assert.match(html, /<code>/);
  // A retry key only when the host can try again.
  assert.doesNotMatch(html, /fui-artifact-retry/);
  assert.match(
    renderToStaticMarkup(
      <ArtifactFrame error="nope" onRetry={() => {}} source="x" title="t">
        {() => null}
      </ArtifactFrame>,
    ),
    /class="fui-artifact-retry"[^>]*>Try again</,
  );
});

test("plain children are allowed, and the source view is a tab stop of its own", () => {
  const html = renderToStaticMarkup(
    <ArtifactFrame defaultView="source" source="<svg/>" title="With children">
      <p>Drawn by the host</p>
    </ArtifactFrame>,
  );
  assert.match(html, /Drawn by the host/);
  assert.match(html, /data-view="source"/);
  assert.match(html, /aria-pressed="true"/);
  // The body is there but hidden; the source is the visible half.
  assert.match(html, /class="fui-artifact-body"[^>]*hidden=""/);
});

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

test("the artifact is a plate whose header and body keep their shape in every state", () => {
  const frame = rule(ai, ".fui-artifact {");
  assert.match(frame, /container: fui-artifact \/ inline-size;/);
  assert.match(frame, /border-radius: var\(--fui-radius-plate\);/);
  assert.match(frame, /border: 1px solid var\(--border\);/);
  assert.match(frame, /overflow: clip;/);
  // The notation is the label voice, in sentence case: no uppercase eyebrow.
  const kind = rule(ai, ".fui-artifact-kind {");
  assert.match(kind, /font-family: var\(--fui-font-label\);/);
  assert.doesNotMatch(kind, /text-transform/);
  // The title gives way before the keys do, and the keys wrap under it rather than shrinking it to nothing.
  assert.match(rule(ai, ".fui-artifact-header {"), /flex-wrap: wrap;/);
  assert.match(rule(ai, ".fui-artifact-title {"), /flex: 1 0 8rem;/);
  // A failure is a tinted strip in the danger tone with the tone's ink, not a box.
  const strip = rule(ai, ".fui-artifact-error {");
  assert.match(strip, /background: color-mix\(in oklab, var\(--destructive\) var\(--fui-tint-strength\), var\(--card\)\);/);
  assert.match(strip, /border-block-end: 1px solid color-mix\(in oklab, var\(--destructive\) var\(--fui-tint-edge\), var\(--card\)\);/);
  // The source sits in the code well, left to right whatever the answer's language.
  assert.match(rule(ai, ".fui-artifact-source {"), /background: var\(--fui-code\);/);
  // The full-screen dialog takes the window, and the drawing is the scroller.
  assert.match(rule(ai, ".fui-artifact-dialog {"), /inline-size: min\(96vw, 90rem\);/);
  assert.match(rule(ai, ".fui-artifact-zoom > .fui-zoom-pan-viewport {"), /flex: 1 1 auto;/);
});

test("forced colors give the pressed source toggle and the error strip a form that is not a fill", () => {
  const forced = blockAt(ai, "@media (forced-colors: active) {\n    .fui-artifact {");
  assert.match(forced, /\.fui-artifact \{[\s\S]*?border-color: CanvasText;/);
  assert.match(forced, /\.fui-artifact-error \{[\s\S]*?border-block-end-color: CanvasText;/);
  // A pressed key is a bar under it, drawn on ::after, never a Highlight fill behind the text.
  assert.match(forced, /\.fui-artifact-toolbar \.fui-button\[aria-pressed="true"\]::after \{[\s\S]*?background: Highlight;/);
  assert.match(forced, /\.fui-tool-call-error \{[\s\S]*?border: 1px solid CanvasText;/);
});

test("on paper the frame is flattened and its keys are gone", () => {
  const print = blockAt(ai, "@media print {\n    .fui-artifact-toolbar,");
  assert.match(print, /\.fui-artifact-toolbar,[\s\S]*?display: none;/);
  assert.match(print, /\.fui-artifact \{[\s\S]*?break-inside: avoid;[\s\S]*?background: none;/);
});

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
  // A chip that arrives later rises only where motion is allowed: `.fui-rise` lives inside that query, and under the
  // system's reduced motion nothing is started.
  const rise = ui.indexOf(".fui-rise {");
  const motion = ui.lastIndexOf("@media (prefers-reduced-motion: no-preference) {", rise);
  assert.ok(motion > -1 && motion < rise, "the rise rule sits inside a no-preference query");
  assert.equal(ui.slice(motion, rise).split("{").length - ui.slice(motion, rise).split("}").length, 1);
});
