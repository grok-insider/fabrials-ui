"use client";

import { Button } from "@fabrials/ui";
import { GenerationFrame, type GenerationStatus } from "@fabrials/ai-ui";
import type { ExampleSet } from "./types";
import { HARBOUR, ORCHARD, QUARRY } from "./fixtures";
import { ReplayButton, useScript, type Frame } from "./replay";

type Picture = { status: GenerationStatus; progress?: number };

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
