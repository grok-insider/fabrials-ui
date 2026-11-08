import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { ShimmerText, WorkingLight } from "../../packages/ui/src";
import {
  AgentMark,
  AgentThinking,
  agentActivities,
  AttachmentChip,
  Attachments,
  ChatComposer,
  ContextMeter,
  GenerationFrame,
  TaskList,
  formatTokens,
  formatWorkTime,
} from "../../packages/ai-ui/src/index";

const aiStyles = readFileSync(new URL("../../packages/ai-ui/src/styles.css", import.meta.url), "utf8");

test("work time reads short: tenths under ten seconds, then seconds, minutes and hours", () => {
  assert.equal(formatWorkTime(0), "0.0s");
  assert.equal(formatWorkTime(2_849), "2.8s");
  assert.equal(formatWorkTime(12_400), "12s");
  assert.equal(formatWorkTime(64_000), "1m 04s");
  assert.equal(formatWorkTime(3_720_000), "1h 02m");
  assert.equal(formatWorkTime(-5), "0.0s");
});

test("tokens read compact", () => {
  assert.equal(formatTokens(812), "812");
  assert.equal(formatTokens(42_100), "42.1k");
  assert.equal(formatTokens(200_000), "200k");
  assert.equal(formatTokens(1_250_000), "1.3M");
});

test("the working light is decorative, and the light on a label is opt-in", () => {
  assert.equal(
    renderToStaticMarkup(<WorkingLight />),
    '<span aria-hidden="true" data-slot="working-light" class="fui-working-light"><span class="fui-working-light-bloom"></span></span>',
  );
  assert.match(renderToStaticMarkup(<ShimmerText tone="light">Reading</ShimmerText>), /data-tone="light"/);
  assert.doesNotMatch(renderToStaticMarkup(<ShimmerText>Loading</ShimmerText>), /data-tone/);
});

test("agent thinking is a polite status whose time is hidden from assistive technology", () => {
  const html = renderToStaticMarkup(<AgentThinking label="Reading the schema" variant="orbit" />);
  assert.match(html, /^<div class="fui-agent-thinking" data-tone="light" role="status">/);
  assert.match(html, /<svg aria-hidden="true" class="fui-agent-mark" data-tone="light" data-variant="orbit"/);
  assert.match(html, /Reading the schema/);
  assert.match(html, /<span aria-hidden="true" class="fui-agent-thinking-time"><\/span>/);
  const still = renderToStaticMarkup(<AgentThinking shimmer={false} timer={false} />);
  assert.doesNotMatch(still, /fui-shimmer-text|fui-agent-thinking-time/);
});

test("each mark is square cells in the dither's voice", () => {
  const count = (variant: Parameters<typeof AgentMark>[0]["variant"]) => (renderToStaticMarkup(<AgentMark variant={variant} />).match(/<rect /g) ?? []).length;
  assert.equal(count("wave"), 9);
  assert.equal(count("orbit"), 9);
  assert.equal(count("dither"), 16);
  for (const variant of ["scan", "lines", "type", "raster", "fill"] as const) assert.equal(count(variant), 16, variant);
  assert.match(renderToStaticMarkup(<AgentMark />), /shape-rendering="crispEdges"/);
});

test("each kind of work has its own mark and words, and a step that runs shows its kind", () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(agentActivities).map(([activity, kind]) => [activity, kind.variant])),
    { thinking: "wave", searching: "scan", reading: "lines", writing: "type", running: "orbit", rendering: "raster", uploading: "fill" },
  );
  const searching = renderToStaticMarkup(<AgentThinking activity="searching" />);
  assert.match(searching, /data-variant="scan"/);
  assert.match(searching, />Searching</);
  assert.match(renderToStaticMarkup(<AgentThinking activity="reading" label="Reading 14 files" variant="dither" />), /data-variant="dither"[\s\S]*Reading 14 files/);
  // Every cell of a scan holds a still frame; a filling mark's cells carry their place in the order.
  const scan = renderToStaticMarkup(<AgentMark variant="scan" />);
  assert.equal((scan.match(/--fui-agent-still:1"/g) ?? []).length, 4);
  assert.match(renderToStaticMarkup(<AgentMark variant="fill" />), /<rect data-band="1" height="2" style="--fui-agent-step:3"/);
  assert.match(renderToStaticMarkup(<AgentMark variant="lines" />), /--fui-agent-step:5;--fui-agent-row:1/);
  const plan = renderToStaticMarkup(<TaskList label="Plan" tasks={[{ id: "a", title: "Search the docs", status: "running", activity: "searching" }]} />);
  assert.match(plan, /class="fui-agent-mark fui-task-mark-running"[^>]*data-variant="scan"/);
  assert.match(renderToStaticMarkup(<TaskList label="Plan" tasks={[{ id: "a", title: "Copy", status: "running" }]} />), /data-variant="orbit"/);
});

test("a settled line keeps its status, puts the light out and holds a tick or a cross with its time", () => {
  const done = renderToStaticMarkup(
    <AgentThinking activity="searching" endedAt={Date.UTC(2026, 10, 8, 9, 0, 12)} label="Searched 12 sources" startedAt={Date.UTC(2026, 10, 8, 9, 0, 0)} status="done" />,
  );
  assert.match(done, /^<div class="fui-agent-thinking" data-status="done" data-tone="light" role="status">/);
  assert.match(done, /<svg aria-hidden="true" class="fui-agent-mark" data-outcome="done" data-tone="light" focusable="false"/);
  assert.doesNotMatch(done, /data-variant|fui-shimmer-text/);
  assert.match(done, /<span class="fui-agent-thinking-label fui-scramble-text">Searched 12 sources<\/span>/);
  assert.match(done, /<span aria-hidden="true" class="fui-agent-thinking-time">12s<\/span>/);
  // The tick and the cross are drawn in the same 16 cells.
  const lit = (outcome: "done" | "failed") => (renderToStaticMarkup(<AgentMark outcome={outcome} />).match(/data-on="true"/g) ?? []).length;
  assert.equal(lit("done"), 4);
  assert.equal(lit("failed"), 8);
  // Settled without a start, it shows no invented time.
  assert.match(renderToStaticMarkup(<AgentThinking label="Done" status="done" />), /<span aria-hidden="true" class="fui-agent-thinking-time"><\/span>/);
});

test("a task list says each state in words, marks the running step and announces it", () => {
  const html = renderToStaticMarkup(
    <TaskList
      tasks={[
        { id: "a", title: "Read", status: "done", meta: "0.9s" },
        { id: "b", title: "Copy", status: "running", detail: "Batch 7 of 12" },
        { id: "c", title: "Verify", status: "pending" },
      ]}
      title="Plan"
    />,
  );
  assert.match(html, /<section aria-labelledby="[^"]+" class="fui-task-list">/);
  assert.match(html, /<span class="fui-sr-only">Done: <\/span>Read/);
  assert.match(html, /<li aria-current="step" class="fui-task" data-status="running">/);
  assert.match(html, /<span class="fui-task-list-count">1 of 3<\/span>/);
  assert.match(html, /<p class="fui-sr-only" role="status">In progress: Copy<\/p>/);
  assert.match(html, /<span class="fui-task-detail">Batch 7 of 12<\/span>/);
  const settled = renderToStaticMarkup(<TaskList label="Steps" tasks={[{ id: "a", title: "Read", status: "done" }]} />);
  assert.match(settled, /aria-label="Steps"/);
  assert.match(settled, /data-settled="true"/);
  assert.match(settled, /role="status">All 1 task settled</);
  const failed = renderToStaticMarkup(<TaskList tasks={[{ id: "a", title: "Upload", status: "failed" }, { id: "b", title: "Tag", status: "pending" }]} />);
  assert.match(failed, /role="status">Failed: Upload</);
});

test("the context meter is one meter that reads in full and turns at its thresholds", () => {
  const html = renderToStaticMarkup(<ContextMeter limit={200_000} parts={[{ label: "Files", value: 30_000 }, { label: "Chat", value: 12_100 }]} />);
  assert.match(html, /role="meter"/);
  assert.match(html, /aria-valuetext="42,100 of 200,000 tokens, 21%"/);
  assert.match(html, /42\.1k of 200k/);
  assert.match(html, /Free<\/span><span class="fui-context-meter-value">158k/);
  assert.doesNotMatch(html, /data-tone=/);
  assert.match(renderToStaticMarkup(<ContextMeter limit={100} parts={[{ label: "a", value: 85 }]} />), /data-tone="warning"/);
  assert.match(renderToStaticMarkup(<ContextMeter limit={100} parts={[{ label: "a", value: 99 }]} />), /data-tone="danger"/);
});

test("a picture being made is a status while it works, an alert when it fails, and an image when done", () => {
  const working = renderToStaticMarkup(<GenerationFrame alt="Harbour" progress={0.42} status="generating" />);
  assert.match(working, /class="fui-generation-status" role="status"/);
  assert.match(working, /Making the image/);
  assert.match(working, /<span class="fui-sr-only">42%<\/span>/);
  assert.match(working, /fui-working-light/);
  const done = renderToStaticMarkup(<GenerationFrame alt="Harbour" src="/harbour.png" status="done" />);
  // The server's markup never hides the image: only the client marks one still on its way.
  assert.match(done, /<img alt="Harbour" class="fui-generation-image" decoding="async" src="\/harbour\.png"\/>/);
  assert.match(done, /class="fui-sr-only" role="status">Image ready</);
  assert.doesNotMatch(done, /fui-working-light/);
  const failed = renderToStaticMarkup(<GenerationFrame alt="Harbour" error="Edit the prompt" status="failed" />);
  assert.match(failed, /role="alert"/);
});

test("an upload with a progress is a progressbar with a ring; a finished one fades its count", () => {
  const uploading = renderToStaticMarkup(
    <AttachmentChip item={{ id: "a", name: "q3.xlsx", mediaType: "application/vnd.ms-excel", status: "uploading", progress: 0.64 }} variant="grid" />,
  );
  assert.match(uploading, /role="progressbar"/);
  assert.match(uploading, /aria-valuenow="64"/);
  assert.match(uploading, /fui-attachment-ring/);
  assert.match(uploading, /stroke-dashoffset:36/);
  const done = renderToStaticMarkup(<AttachmentChip item={{ id: "a", name: "q3.xlsx", mediaType: "application/pdf", status: "ready", progress: 1 }} variant="grid" />);
  assert.match(done, /<span aria-hidden="true" class="fui-attachment-percent" data-done="true">100%<\/span>/);
  assert.doesNotMatch(done, /fui-attachment-ring/);
  const chip = renderToStaticMarkup(<AttachmentChip item={{ id: "a", name: "q3.xlsx", mediaType: "application/pdf", status: "uploading", progress: 0.5 }} />);
  assert.match(chip, /Uploading 50%/);
  assert.match(renderToStaticMarkup(<Attachments items={[{ id: "a", name: "a.pdf", mediaType: "application/pdf" }]} size="sm" variant="grid" />), /data-size="sm"/);
});

test("the composer carries the working light while busy, unless told not to", () => {
  const busy = renderToStaticMarkup(<ChatComposer onSubmit={() => {}} status="streaming" />);
  assert.match(busy, /data-working="true"/);
  assert.match(busy, /fui-working-light/);
  assert.doesNotMatch(renderToStaticMarkup(<ChatComposer onSubmit={() => {}} status="streaming" working={false} />), /fui-working-light/);
  assert.doesNotMatch(renderToStaticMarkup(<ChatComposer onSubmit={() => {}} />), /fui-working-light/);
});

test("the agent pieces move only without reduced motion and keep a form in forced colors", () => {
  const block = aiStyles.slice(aiStyles.indexOf("/* 0.11 agent pieces."));
  for (const animation of [
    "fui-agent-wave",
    "fui-agent-orbit",
    "fui-agent-dither",
    "fui-agent-hop",
    "fui-agent-lines",
    "fui-agent-cells",
    "fui-agent-rows",
    "fui-generation-ripple",
    "fui-task-running",
  ]) {
    const at = block.indexOf(`animation: ${animation}`);
    assert.ok(at > 0, animation);
    const before = block.slice(0, at);
    assert.ok(before.lastIndexOf("@media (prefers-reduced-motion: no-preference)") > before.lastIndexOf("@media (prefers-reduced-motion: reduce)"), animation);
  }
  assert.match(block, /@media \(forced-colors: active\) \{[\s\S]*\.fui-agent-mark rect \{\s*fill: CanvasText;/);
  // Gradients in the agent pieces are the dot field, the ripple and a mask: all working light, all in the light tokens.
  for (const match of block.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*gradient\([^{}]*)\}/g)) {
    assert.match(match[1]!.trim(), /\.fui-generation-(field|ripple|refine|band|scan|page)|\.fui-generation-refine > \[data-layer\]/, match[1]);
  }
});
