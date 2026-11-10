import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import {
  AttachmentsError,
  ComposerMenu,
  ComposerSelect,
  DEFAULT_ATTACHMENT_LABELS,
  EMPTY_ATTACHMENTS,
  ReadAloudAction,
  clampProgress,
  createLimiter,
  failureMessage,
  hasPreview,
  isUploading,
  reduceAttachments,
  toAttachmentItems,
  uploadErrorText,
  type AttachmentEntry,
  type AttachmentState,
} from "../../packages/ai-ui/src/index";
import { DropOverlay, DropdownMenuItem, carriesFiles, draggedFilesRefused } from "../../packages/ui/src/index";

const uiStyles = readFileSync(new URL("../../packages/ui/src/styles.css", import.meta.url), "utf8");
const aiStyles = readFileSync(new URL("../../packages/ai-ui/src/styles.css", import.meta.url), "utf8");

// One of the blocks 0.12 appends: its marker, then the declarations of a selector inside it, up to the closing brace.
function block(css: string, marker: string) {
  const at = css.indexOf(marker);
  assert.ok(at >= 0, `missing block ${marker}`);
  const open = css.lastIndexOf("@layer components {", at);
  const start = css.indexOf("{", open);
  let depth = 0;
  for (let cursor = start; cursor < css.length; cursor += 1) {
    if (css[cursor] === "{") depth += 1;
    if (css[cursor] === "}" && --depth === 0) return css.slice(start + 1, cursor);
  }
  throw new Error(`unbalanced block ${marker}`);
}
const ai = block(aiStyles, "/* 0.12: the composer pill that picks");
const ui = block(uiStyles, "/* 0.12: the panel that says files can be dropped here");
const rule = (text: string, selector: string) => {
  const at = text.indexOf(`${selector} {`);
  assert.ok(at >= 0, `missing rule ${selector}`);
  return text.slice(at, text.indexOf("}", at) + 1);
};
const attribute = (html: string, name: string) => html.match(new RegExp(`${name}="([^"]*)"`))?.[1];

const png = (name = "harbour.png") => new File([new Uint8Array([1, 2, 3])], name, { type: "image/png" });

let counter = 0;
function entry(overrides: Partial<AttachmentEntry> = {}): AttachmentEntry {
  counter += 1;
  const file = overrides.file ?? png(`file-${counter}.png`);
  return { id: `f${counter}`, file, name: file.name, mediaType: file.type, size: file.size, status: "pending", ...overrides };
}
const state = (...entries: AttachmentEntry[]): AttachmentState => ({ entries });
const statusOf = (next: AttachmentState, id: string) => next.entries.find((value) => value.id === id)?.status;

// ------------------------------------------------------------------ the state of each file

test("a file is queued, then uploading, then done, and each step is a new state", () => {
  const a = entry({ id: "a" });
  const added = reduceAttachments(state(), { type: "add", entries: [a] });
  assert.deepEqual(added.entries.map((value) => value.status), ["pending"]);
  const started = reduceAttachments(added, { type: "start", id: "a" });
  assert.equal(statusOf(started, "a"), "uploading");
  assert.equal(started.entries[0]!.progress, undefined, "a spinner until the uploader reports a number");
  const reported = reduceAttachments(started, { type: "progress", id: "a", progress: 0.36 });
  assert.equal(reported.entries[0]!.progress, 0.36);
  const done = reduceAttachments(reported, { type: "done", id: "a", result: { url: "s3://one" } });
  assert.equal(statusOf(done, "a"), "done");
  assert.equal(done.entries[0]!.progress, 1);
  assert.deepEqual(done.entries[0]!.result, { url: "s3://one" });
  // Nothing about a file is mutated in place: a product that kept the old state still sees the old one.
  assert.equal(added.entries[0]!.status, "pending");
  assert.equal(reported.entries[0]!.status, "uploading");
});

test("progress is clamped to what a bar can show, and the same number twice is the same state", () => {
  assert.equal(clampProgress(2), 1);
  assert.equal(clampProgress(-3), 0);
  assert.equal(clampProgress(Number.NaN), 0);
  const uploading = reduceAttachments(state(entry({ id: "a", status: "uploading", progress: 0.4 })), { type: "progress", id: "a", progress: 0.4 });
  assert.equal(uploading.entries[0]!.progress, 0.4);
  assert.equal(reduceAttachments(state(entry({ id: "a", status: "uploading" })), { type: "progress", id: "a", progress: 9 }).entries[0]!.progress, 1);
  // A file that has not been given a slot uploads nothing, so a report for it can only be a late one.
  const queued = state(entry({ id: "a" }));
  assert.equal(reduceAttachments(queued, { type: "progress", id: "a", progress: 0.2 }), queued);
});

test("progress is ignored for a file that already finished or failed", () => {
  const done = state(entry({ id: "a", status: "done", progress: 1 }));
  assert.equal(reduceAttachments(done, { type: "progress", id: "a", progress: 0.1 }), done);
  const failed = state(entry({ id: "a", status: "failed", error: "Too big" }));
  assert.equal(reduceAttachments(failed, { type: "progress", id: "a", progress: 0.1 }), failed);
});

test("a file that fails keeps its sentence, and a retry puts it back in the queue", () => {
  const uploading = state(entry({ id: "a", status: "uploading", progress: 0.5 }));
  const failed = reduceAttachments(uploading, { type: "fail", id: "a", error: "The token expired" });
  assert.equal(statusOf(failed, "a"), "failed");
  assert.equal(failed.entries[0]!.error, "The token expired");
  assert.equal(failed.entries[0]!.progress, undefined, "the ring goes: the upload is not on its way any more");
  const queued = reduceAttachments(failed, { type: "retry", id: "a" });
  assert.equal(statusOf(queued, "a"), "pending");
  assert.equal(queued.entries[0]!.error, undefined);
  // Only a failed file is uploaded again; a done one is not disturbed.
  const finished = state(entry({ id: "b", status: "done", result: "kept" }));
  assert.equal(reduceAttachments(finished, { type: "retry", id: "b" }), finished);
});

test("a result that arrives after the file is gone changes nothing at all", () => {
  const one = state(entry({ id: "a" }), entry({ id: "b" }));
  const removed = reduceAttachments(one, { type: "remove", id: "a" });
  assert.deepEqual(removed.entries.map((value) => value.id), ["b"]);
  // The very same object, so React does not paint and nothing comes back to the composer.
  assert.equal(reduceAttachments(removed, { type: "done", id: "a", result: "late" }), removed);
  assert.equal(reduceAttachments(removed, { type: "progress", id: "a", progress: 0.9 }), removed);
  assert.equal(reduceAttachments(removed, { type: "fail", id: "a", error: "late" }), removed);
  assert.equal(reduceAttachments(removed, { type: "start", id: "a" }), removed);
});

test("a file that finished is not undone by a failure that arrives late, and nothing unheard is started", () => {
  const done = state(entry({ id: "a", status: "done", result: "kept", progress: 1 }));
  assert.equal(reduceAttachments(done, { type: "fail", id: "a", error: "late" }), done);
  // `start` only moves a queued file: an uploading one keeps its place and a done one is left alone.
  const uploading = state(entry({ id: "a", status: "uploading", progress: 0.5 }));
  assert.equal(reduceAttachments(uploading, { type: "start", id: "a" }), uploading);
});

test("removing takes one, clearing takes all, and an add appends in the order it was given", () => {
  const three = reduceAttachments(state(entry({ id: "a" })), { type: "add", entries: [entry({ id: "b" }), entry({ id: "c" })] });
  assert.deepEqual(three.entries.map((value) => value.id), ["a", "b", "c"]);
  assert.deepEqual(reduceAttachments(three, { type: "remove", id: "b" }).entries.map((value) => value.id), ["a", "c"]);
  assert.deepEqual(reduceAttachments(three, { type: "clear" }).entries, []);
  assert.equal(reduceAttachments(three, { type: "remove", id: "zzz" }), three);
  assert.equal(reduceAttachments(three, { type: "add", entries: [] }), three);
  assert.equal(reduceAttachments(EMPTY_ATTACHMENTS, { type: "clear" }), EMPTY_ATTACHMENTS);
});

test("a file is uploading until it is done, queued included", () => {
  assert.equal(isUploading([entry({ status: "pending" }), entry({ status: "done" })]), true);
  assert.equal(isUploading([entry({ status: "uploading" })]), true);
  assert.equal(isUploading([entry({ status: "done" }), entry({ status: "failed" })]), false);
  assert.equal(isUploading([]), false);
});

// ------------------------------------------------------------------ the limit of three at once

function deferred() {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((kept, gave) => {
    resolve = kept;
    reject = gave;
  });
  return { promise, resolve, reject };
}
const tick = async () => {
  for (let turn = 0; turn < 8; turn += 1) await Promise.resolve();
};

test("three uploads at once, and the rest in the order they were asked for", async () => {
  const limiter = createLimiter(3);
  const gates = Array.from({ length: 5 }, () => deferred());
  const order: number[] = [];
  const runs = gates.map((gate, at) => limiter.run(async () => {
    order.push(at);
    await gate.promise;
    return at;
  }));
  await tick();
  assert.equal(limiter.active, 3);
  assert.equal(limiter.waiting, 2);
  assert.deepEqual(order, [0, 1, 2]);
  gates[0]!.resolve();
  await tick();
  assert.deepEqual(order, [0, 1, 2, 3], "the fourth starts as the first frees its slot");
  assert.equal(limiter.active, 3, "the count never dips: the slot was handed on");
  gates[1]!.resolve();
  gates[2]!.resolve();
  gates[3]!.resolve();
  gates[4]!.resolve();
  assert.deepEqual(await Promise.all(runs), [0, 1, 2, 3, 4]);
  assert.equal(limiter.active, 0);
  assert.equal(limiter.waiting, 0);
});

test("a task that throws frees its slot for the next one, and the error reaches its caller", async () => {
  const limiter = createLimiter(1);
  const gate = deferred();
  const first = limiter.run(async () => {
    await gate.promise;
    throw new Error("The upload was refused.");
  });
  const second = limiter.run(async () => "second");
  let said = "";
  first.catch((error: Error) => (said = error.message));
  gate.resolve();
  assert.equal(await second, "second");
  await tick();
  assert.equal(said, "The upload was refused.");
  assert.equal(limiter.active, 0);
});

test("a limit of nothing sensible still runs one at a time", async () => {
  for (const limit of [0, -2, Number.NaN, 1.8]) {
    const limiter = createLimiter(limit);
    const gate = deferred();
    const first = limiter.run(async () => {
      await gate.promise;
      return "a";
    });
    const second = limiter.run(async () => "b");
    await tick();
    assert.equal(limiter.active, 1, `limit ${limit}`);
    gate.resolve();
    assert.deepEqual(await Promise.all([first, second]), ["a", "b"]);
  }
});

// ------------------------------------------------------------------ what the view is given

test("the four states the hook keeps are the three the view draws", () => {
  const four = [
    entry({ id: "a", status: "pending" }),
    entry({ id: "b", status: "uploading", progress: 0.36 }),
    entry({ id: "c", status: "done", progress: 1, url: "blob:one" }),
    entry({ id: "d", status: "failed", error: "Too large: the limit is 20 MB" }),
  ];
  const items = toAttachmentItems(four);
  assert.deepEqual(items.map((item) => item.status), ["uploading", "uploading", "ready", "error"]);
  assert.deepEqual(items.map((item) => item.progress), [undefined, 0.36, undefined, undefined]);
  assert.equal(items[2]!.url, "blob:one");
  assert.equal(items[3]!.error, "Too large: the limit is 20 MB");
  // The names and sizes the chip writes come through untouched.
  assert.deepEqual(items.map((item) => item.name), four.map((value) => value.name));
  assert.equal(items[0]!.mediaType, "image/png");
  assert.equal(items[0]!.size, 3);
});

test("only pictures and videos are drawn by the view; anything else is an icon", () => {
  assert.equal(hasPreview("image/png"), true);
  assert.equal(hasPreview("video/mp4"), true);
  assert.equal(hasPreview("IMAGE/PNG; charset=binary"), true);
  assert.equal(hasPreview("application/pdf"), false);
  assert.equal(hasPreview("audio/mpeg"), false);
});

test("a failure says what it threw, and one error names every file that failed", () => {
  assert.equal(uploadErrorText(new Error("The token expired")), "The token expired");
  assert.equal(uploadErrorText("  "), DEFAULT_ATTACHMENT_LABELS.failed);
  assert.equal(uploadErrorText(undefined, { failed: "No se pudo subir el archivo." }), "No se pudo subir el archivo.");
  const error = new AttachmentsError([
    { id: "a", name: "notes.pdf", error: "Too large" },
    { id: "b", name: "scan.tiff", error: "Unsupported" },
  ]);
  assert.ok(error instanceof Error);
  assert.equal(error.name, "AttachmentsError");
  assert.equal(error.message, "Could not upload notes.pdf, scan.tiff.");
  assert.deepEqual(error.failed.map((file) => file.name), ["notes.pdf", "scan.tiff"]);
  // A host writes it in its own words, and the names still reach it.
  const names = ["a.png"];
  assert.equal(failureMessage(names, { uploadFailed: (files) => `${files.length}: ${files.join(" + ")}` }), "1: a.png");
});

test("a drag of text or of a link is not a drag of files, and the acceptance of a drag can be judged", () => {
  assert.equal(carriesFiles(["Files"]), true);
  assert.equal(carriesFiles(["text/plain"]), false);
  assert.equal(carriesFiles(undefined), false);
  assert.equal(draggedFilesRefused(["image/png"], "image/*"), false);
  assert.equal(draggedFilesRefused(["application/pdf"], "image/*,.txt"), true);
  assert.equal(draggedFilesRefused(["image/png", "application/pdf"], "image/*"), false, "one accepted file is enough");
  assert.equal(draggedFilesRefused(["application/pdf"], undefined), false);
  assert.equal(draggedFilesRefused(["application/pdf"], ".pdf"), false, "a drag never gives the name, so it is let through");
  assert.equal(draggedFilesRefused(["text/plain"], "image/*"), true, "a dropped .txt is not a picture either");
  assert.equal(draggedFilesRefused(["Files"], "image/*"), false, "the drag's own word for a file is not a kind");
  assert.equal(draggedFilesRefused([], "image/*"), false, "nothing to judge");
});

// ------------------------------------------------------------------ what is drawn

test("the overlay covers its own area and is hidden from assistive technology until it is shown", () => {
  const hidden = renderToStaticMarkup(
    <DropOverlay label="Drop files to attach">
      <p>the conversation</p>
    </DropOverlay>,
  );
  assert.match(hidden, /^<div class="fui-drop-overlay" data-scope="self">/);
  assert.ok(hidden.indexOf("the conversation") < hidden.indexOf("fui-drop-overlay-panel"));
  assert.equal(attribute(hidden, "aria-hidden"), "true");
  assert.match(hidden, /class="fui-drop-overlay-label">Drop files to attach</);
  assert.match(hidden, /class="lucide lucide-upload fui-drop-overlay-icon" aria-hidden="true"/);
  const shown = renderToStaticMarkup(
    <DropOverlay accept="image/*" active label="Drop files to attach" scope="page">
      <p>the conversation</p>
    </DropOverlay>,
  );
  assert.equal(attribute(shown, "aria-hidden"), "false");
  assert.equal(attribute(shown, "data-scope"), "page");
  const refused = renderToStaticMarkup(
    <DropOverlay active description="PDF, Word, CSV or pictures" refused>
      <p>the conversation</p>
    </DropOverlay>,
  );
  assert.match(refused, /<div aria-hidden="false" class="fui-drop-overlay-panel" data-refused="">/);
  assert.match(refused, /class="fui-drop-overlay-label">That kind of file is not accepted</);
  assert.doesNotMatch(refused, /fui-drop-overlay-description/, "the line that says what may be dropped goes with a healthy drag");
});

test("the pill that picks tells its name with the value in it and is tinted away from the usual one", () => {
  const options = [
    { value: "low", label: "Low", hint: "Fastest replies" },
    { value: "high", label: "High", hint: "Deeper reasoning, slower" },
  ];
  const usual = renderToStaticMarkup(<ComposerSelect label="Reasoning effort" onValueChange={() => {}} options={options} value="low" />);
  assert.match(usual, /^<button [^>]*role="combobox"/);
  assert.equal(attribute(usual, "aria-label"), "Reasoning effort: Low");
  assert.equal(attribute(usual, "data-state"), "off");
  assert.match(usual, /class="fui-input fui-select-trigger fui-composer-pill fui-composer-select"/);
  assert.match(usual, /class="fui-composer-select-value">Low</);
  const chosen = renderToStaticMarkup(<ComposerSelect defaultValue="low" label="Reasoning effort" onValueChange={() => {}} options={options} value="high" />);
  assert.equal(attribute(chosen, "data-state"), "on");
  // The host writes the name, and the value still reaches it.
  const named = renderToStaticMarkup(
    <ComposerSelect
      label="Modo"
      labels={{ name: (field, value) => `${field}: ${value}` }}
      onValueChange={() => {}}
      options={options}
      value="high"
    />,
  );
  assert.equal(attribute(named, "aria-label"), "Modo: High");
  const formatted = renderToStaticMarkup(
    <ComposerSelect formatValue={(option) => option.label.toUpperCase()} label="Effort" onValueChange={() => {}} options={options} value="low" />,
  );
  assert.equal(attribute(formatted, "aria-label"), "Effort: LOW");
  assert.match(formatted, />LOW</);
});

test("the menu pill is a named trigger, alone or with words", () => {
  const alone = renderToStaticMarkup(
    <ComposerMenu icon={<svg />} label="More controls">
      <DropdownMenuItem>Clear the conversation</DropdownMenuItem>
    </ComposerMenu>,
  );
  assert.match(alone, /^<button aria-label="More controls" class="fui-composer-pill fui-composer-menu" data-icon-only="true"/);
  assert.equal(attribute(alone, "aria-haspopup"), "menu");
  assert.equal(attribute(alone, "aria-expanded"), "false");
  const withWords = renderToStaticMarkup(
    <ComposerMenu icon={<svg />} label="Settings" text="Settings">
      <DropdownMenuItem>Clear the conversation</DropdownMenuItem>
    </ComposerMenu>,
  );
  assert.doesNotMatch(withWords, /data-icon-only/);
  assert.match(withWords, /<span>Settings<\/span>/);
  assert.equal(attribute(withWords, "title"), undefined);
});

test("the read-aloud key is not drawn before it can read, and then says what it does now", () => {
  // The server cannot know whether the browser speaks, and a host with no loader gives no promise: nothing is drawn.
  assert.equal(renderToStaticMarkup(<ReadAloudAction text="The harbour opens at nine." />), "");
  const idle = renderToStaticMarkup(
    <ReadAloudAction speech={{ speaking: false, loading: false, currentId: null, speak: async () => {}, stop: () => {} }} text="Hi" />,
  );
  assert.equal(attribute(idle, "aria-label"), "Read aloud");
  assert.equal(attribute(idle, "aria-pressed"), "false");
  assert.match(idle, /class="fui-button fui-message-action"/);
  const reading = renderToStaticMarkup(
    <ReadAloudAction
      labels={{ read: "Leer en voz alta", stop: "Dejar de leer" }}
      speech={{ speaking: true, loading: false, currentId: "read-aloud", speak: async () => {}, stop: () => {} }}
      text="Hola"
    />,
  );
  assert.equal(attribute(reading, "aria-label"), "Dejar de leer");
  assert.equal(attribute(reading, "aria-pressed"), "true");
  assert.equal(attribute(reading, "data-reading"), "");
  // While the first piece loads the key keeps its name and shows a spinner instead of a mark.
  const loading = renderToStaticMarkup(
    <ReadAloudAction speech={{ speaking: true, loading: true, currentId: null, speak: async () => {}, stop: () => {} }} text="Hola" />,
  );
  assert.equal(attribute(loading, "aria-label"), "Stop reading");
  assert.match(loading, /class="fui-pixel-spinner fui-spinner"/);
  assert.doesNotMatch(loading, /<path d="M16 9a5/, "the speaker gives way to the spinner while the first piece loads");
});

// ------------------------------------------------------------------ the rules they stand on

test("the picker wears the pill and not the field, and draws its own focus", () => {
  const trigger = rule(ai, ".fui-composer-select.fui-select-trigger:not(.fui-button)");
  assert.match(trigger, /inline-size: auto;/);
  assert.match(trigger, /block-size: 2rem;/);
  assert.match(trigger, /border: 1px solid transparent;/);
  assert.match(trigger, /background: transparent;/);
  assert.match(trigger, /box-shadow: none;/);
  assert.match(trigger, /border-radius: var\(--fui-radius-md\);/);
  assert.match(trigger, /font-size: var\(--fui-text-xs\);/);
  // Three compounds: it wins over the field rule wherever the two sheets are loaded in either order.
  assert.match(ai, /\.fui-composer-select\.fui-select-trigger:not\(\.fui-button\):focus-visible,\s*\.fui-composer-select\.fui-select-trigger\[data-popup-open\] \{[^}]*box-shadow:/);
  assert.match(rule(ai, ".fui-composer-select.fui-select-trigger[data-popup-open]"), /border-color: var\(--fui-focus\);/);
});

test("the options read on two lines, and the list is as wide as a model name needs", () => {
  assert.match(rule(ai, ".fui-composer-select-menu"), /min-inline-size: 15rem;/);
  const text = rule(ai, ".fui-composer-option-text");
  assert.match(text, /flex-direction: column;/);
  assert.match(rule(ai, ".fui-composer-option-hint"), /color: var\(--muted-foreground\);/);
});

test("a narrow composer keeps the pill's mark alone, by its own width and not the window's", () => {
  assert.match(ai, /\.fui-composer \{\s*container: fui-composer \/ inline-size;/);
  const narrow = ai.slice(ai.indexOf("@container fui-composer (max-width: 22rem)"));
  const inside = narrow.slice(0, narrow.indexOf("}\n  }") + 1);
  assert.match(inside, /inline-size: 2rem;/);
  assert.match(inside, /\.fui-composer-select-value \{\s*display: none;/);
  assert.match(inside, /> span:last-child,\s*\.fui-composer-select-value \{\s*display: none;/);
  // Touch keeps a 44 px target for the pill, folded or not.
  const coarse = ai.slice(ai.indexOf("@media (max-width: 767px), (pointer: coarse)"));
  assert.match(coarse, /min-inline-size: 2\.75rem;/);
  assert.match(coarse, /block-size: 2\.75rem;/);
  assert.match(coarse, /@container fui-composer \(max-width: 22rem\) \{\s*\.fui-composer-select\.fui-select-trigger:not\(\.fui-button\) \{\s*inline-size: 2\.75rem;/);
});

test("forced colors: the tinted pill and the key that reads keep a form", () => {
  const forced = ai.slice(ai.indexOf("@media (forced-colors: active) {"));
  assert.match(forced, /\.fui-composer-select\.fui-select-trigger\[data-state="on"\] \{\s*position: relative;\s*outline: 2px solid Highlight;/);
  assert.match(forced, /\[data-state="on"\]::after \{[^}]*background: Highlight;/);
  assert.match(forced, /\.fui-message-action\[data-reading\] \{\s*outline: 2px solid Highlight;/);
});

test("the panel is a tinted plate with a dashed Stormlight edge, over its own area, without a blur", () => {
  const panel = rule(ui, ".fui-drop-overlay-panel");
  assert.match(panel, /position: absolute;/);
  assert.match(panel, /inset: 0;/);
  assert.match(panel, /border: 2px dashed var\(--brand\);/);
  assert.match(panel, /background: var\(--brand-soft\);/);
  assert.match(panel, /border-radius: var\(--fui-radius-plate\);/);
  assert.match(panel, /pointer-events: none;/);
  assert.doesNotMatch(panel, /blur|gradient/);
  assert.match(rule(ui, '.fui-drop-overlay-panel[aria-hidden="true"]'), /visibility: hidden;\s*opacity: 0;/);
  assert.match(rule(ui, ".fui-drop-overlay"), /position: relative;/);
  // The refused drag is not a place to drop: its edge is solid and in the danger ink.
  const refused = rule(ui, ".fui-drop-overlay-panel[data-refused]");
  assert.match(refused, /border-style: solid;/);
  assert.match(refused, /border-color: var\(--fui-danger-ink\);/);
});
