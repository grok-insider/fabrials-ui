"use client";

import { Button } from "@fabrials/ui";
import { GenerationFrame, type GenerationStatus } from "@fabrials/ai-ui";
import type { ExampleSet } from "./types";
import { HARBOUR, ORCHARD, QUARRY } from "./fixtures";
import { ReplayButton, useScript, type Frame } from "./replay";

type Picture = { status: GenerationStatus; progress?: number };

type Draft = { status: GenerationStatus; progress?: number };

const DRAFT: Frame<Draft>[] = [
  { at: 0, state: { status: "generating", progress: 0 } },
  { at: 700, state: { status: "generating", progress: 0.18 } },
  { at: 1500, state: { status: "generating", progress: 0.41 } },
  { at: 2300, state: { status: "generating", progress: 0.66 } },
  { at: 3100, state: { status: "generating", progress: 0.9 } },
  { at: 3700, state: { status: "done" } },
];

function Draft() {
  const { state, replay, done } = useScript(DRAFT);
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-3)", width: "min(100%, 18rem)" }}>
      <GenerationFrame alt="Release notes for 0.11" aspectRatio="3 / 4" caption="release-notes-0.11.md" kind="document" progress={state.progress} status={state.status}>
        <div className="fui-markdown" style={{ padding: "var(--fui-space-4)", fontSize: "var(--fui-text-xs)" }}>
          <h4>Release notes, 0.11</h4>
          <p>The agent pieces move their own way for each kind of work, and settle on a tick or a cross.</p>
          <ul>
            <li>Marks for searching, reading, writing, rendering and uploads.</li>
            <li>Labels that scramble into place when they change.</li>
          </ul>
        </div>
      </GenerationFrame>
      {done ? (
        <div>
          <ReplayButton label="Write it again" onClick={replay} />
        </div>
      ) : null}
    </div>
  );
}

const FRAMES: Frame<Picture>[] = [
  { at: 0, state: { status: "queued" } },
  { at: 900, state: { status: "generating", progress: 0.04 } },
  { at: 1700, state: { status: "generating", progress: 0.27 } },
  { at: 2600, state: { status: "generating", progress: 0.55 } },
  { at: 3500, state: { status: "generating", progress: 0.81 } },
  { at: 4300, state: { status: "generating", progress: 0.97 } },
  { at: 4900, state: { status: "done" } },
];

function LiveGeneration() {
  const { state, replay, done } = useScript(FRAMES);
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-3)", width: "min(100%, 22rem)" }}>
      <GenerationFrame
        alt="A harbour at dusk under a pale sun"
        caption="harbour at dusk, pale sun, 1024 × 1024"
        progress={state.progress}
        src={HARBOUR}
        status={state.status}
      />
      {done ? (
        <div>
          <ReplayButton onClick={replay} />
        </div>
      ) : null}
    </div>
  );
}

export const generationExamples: ExampleSet = {
  preview: () => <LiveGeneration />,
  previewCode: `import { GenerationFrame, type GenerationStatus } from "@fabrials/ai-ui";

// \`job\` is the image request as your backend reports it: queued,
// generating with a progress, then done with its URL.
export function Picture({
  job,
}: {
  job: { status: GenerationStatus; progress?: number; url?: string };
}) {
  return (
    <GenerationFrame
      alt="A harbour at dusk under a pale sun"
      caption="harbour at dusk, pale sun, 1024 × 1024"
      progress={job.progress}
      src={job.url}
      status={job.status}
    />
  );
}`,
  examples: [
    {
      id: "progress",
      title: "Known progress",
      description:
        "While `status` is `generating`, light ripples across a field of square dots and the working light turns along the edge. With `progress` (0 to 1) the status counts the percentage and fills a line; it is read out as a polite status.",
      code: `<GenerationFrame status="generating" progress={job.progress} alt={prompt} />`,
      render: () => (
        <div style={{ width: "min(100%, 18rem)" }}>
          <GenerationFrame alt="A quarry lake at sunset" aspectRatio="3 / 4" progress={0.42} status="generating" />
        </div>
      ),
    },
    {
      id: "elapsed",
      title: "Unknown progress",
      description:
        "Without `progress` the frame says how long it has been working instead. `startedAt` counts from the server's start; `label` says what it is doing in your words. `queued` waits with the same field.",
      code: `<GenerationFrame status="generating" startedAt={job.startedAt} label="Painting the sky" alt={prompt} />
<GenerationFrame status="queued" alt={prompt} />`,
      render: () => (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))", gap: "var(--fui-space-4)", width: "min(100%, 26rem)" }}>
          <GenerationFrame alt="An orchard" label="Painting the sky" startedAt={Date.now() - 12_400} status="generating" />
          <GenerationFrame alt="An orchard" status="queued" />
        </div>
      ),
    },
    {
      id: "effects",
      title: "Three ways to make a picture",
      description:
        "`effect` sets how the field moves while it works. `ripple` (the default): light ripples through square dots. `refine`: square cells in the working light grow finer, pass after pass, behind a band moving down, as a picture resolves. `scan`: a band of light sweeps down the dots. With a `progress`, the band and the passes follow it instead of running on their own. All three hold still under reduced motion.",
      code: `<GenerationFrame status="generating" effect="ripple" alt={prompt} />
<GenerationFrame status="generating" effect="refine" alt={prompt} />
<GenerationFrame status="generating" effect="scan" alt={prompt} />`,
      render: () => (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(9rem, 1fr))", gap: "var(--fui-space-4)", width: "min(100%, 34rem)" }}>
          <GenerationFrame alt="A harbour at dusk" effect="ripple" label="Ripple" status="generating" />
          <GenerationFrame alt="A harbour at dusk" effect="refine" label="Refine" status="generating" />
          <GenerationFrame alt="A harbour at dusk" effect="scan" label="Scan" status="generating" />
        </div>
      ),
    },
    {
      id: "document",
      title: "A document being written",
      description:
        "`kind=\"document\"` makes the frame a page whose rows are written from the top in square cells, the row being written in the light; a `progress` says how far down it is. When it is done without a `src`, `children` take the frame: the document itself or a preview of it.",
      code: `<GenerationFrame kind="document" status={job.status} progress={job.progress} alt="Release notes for 0.11" aspectRatio="3 / 4">
  <Markdown>{job.text}</Markdown>
</GenerationFrame>`,
      render: () => <Draft />,
    },
    {
      id: "done",
      title: "The picture arrives",
      description:
        "With `status=\"done\"` and a `src`, the image arrives through the dither once it has loaded, and \"Image ready\" is announced (`doneLabel`). `aspectRatio` keeps the frame's shape before and after; `caption` sits under it in the label voice.",
      code: `<GenerationFrame
  status="done"
  src={image.url}
  alt="Orchard terraces on the north side"
  aspectRatio={16 / 10}
  caption="orchard, north side, 1024 × 640"
/>`,
      render: () => (
        <div style={{ width: "min(100%, 26rem)" }}>
          <GenerationFrame alt="Orchard terraces on the north side" aspectRatio={16 / 10} caption="orchard, north side, 1024 × 640" src={ORCHARD} status="done" />
        </div>
      ),
    },
    {
      id: "failed",
      title: "When it fails",
      description: "`status=\"failed\"` turns the frame into a tinted plate that is announced; `error` says what to do next, and can hold the retry.",
      code: `<GenerationFrame
  status="failed"
  alt={prompt}
  error={
    <>
      <p>The prompt asks for a real person's face.</p>
      <Button size="sm" variant="outline" onClick={edit}>Edit the prompt</Button>
    </>
  }
/>`,
      render: () => (
        <div style={{ width: "min(100%, 18rem)" }}>
          <GenerationFrame
            alt="A portrait"
            error={
              <div style={{ display: "grid", gap: "var(--fui-space-2)", justifyItems: "center" }}>
                <span>The prompt asks for a real person&apos;s face.</span>
                <Button size="sm" variant="outline">
                  Edit the prompt
                </Button>
              </div>
            }
            src={QUARRY}
            status="failed"
          />
        </div>
      ),
    },
  ],
};
