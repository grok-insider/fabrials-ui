import { useEffect, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArtifactFrame, useAsyncRender, type ArtifactSlot } from "@fabrials/ai-ui";
import { Showcase } from "../showcase";
import type { ExampleSet } from "../../apps/site/components/examples/types";

const description =
  "The frame around something drawn inside an answer: a title bar with its source, a copy, the downloads the drawing offers and a full-screen view; a body that keeps its height while the drawing arrives; and a failure that shows the reason and the source instead of an empty box.";

const CHART = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270" viewBox="0 0 480 270" style="max-width:100%;height:auto" role="img" aria-label="Sign-ups each month">
  <g fill="#2a63c4">
    <rect x="62" y="150" width="34" height="60" rx="3"/>
    <rect x="122" y="120" width="34" height="90" rx="3"/>
    <rect x="182" y="132" width="34" height="78" rx="3"/>
    <rect x="242" y="84" width="34" height="126" rx="3"/>
    <rect x="302" y="66" width="34" height="144" rx="3"/>
    <rect x="362" y="42" width="34" height="168" rx="3"/>
  </g>
</svg>`;

/** A drawing that offers itself and says when it is there, as a renderer does. */
function Chart({ slot }: { slot: ArtifactSlot }) {
  const ready = useRef(slot.onReady);
  const exportIt = useRef(slot.onExport);
  useEffect(() => {
    exportIt.current({ svg: () => CHART });
    ready.current();
  }, []);
  return <div dangerouslySetInnerHTML={{ __html: CHART }} />;
}

function Basic() {
  return (
    <ArtifactFrame kind="Chart" source={CHART} sourceLanguage="xml" title="Sign-ups each month">
      {(slot) => <Chart slot={slot} />}
    </ArtifactFrame>
  );
}

function WithSource() {
  return (
    <ArtifactFrame defaultView="source" kind="Chart" source={CHART} sourceLanguage="xml" title="Sign-ups each month">
      {(slot) => <Chart slot={slot} />}
    </ArtifactFrame>
  );
}

function Failed() {
  const [tries, setTries] = useState(0);
  return (
    <ArtifactFrame
      error={tries === 0 ? "Unexpected token '<' at line 3." : null}
      kind="Diagram"
      onRetry={() => setTries((count) => count + 1)}
      source={'svg: <rect width="10" height="10"'}
      sourceLanguage="xml"
      title="Floor plan"
    >
      {(slot) => (tries === 0 ? null : <Chart slot={slot} />)}
    </ArtifactFrame>
  );
}

function Loading() {
  const drawn = useAsyncRender(() => new Promise<string>((resolve) => setTimeout(() => resolve(CHART), 1_200)), []);
  return (
    <ArtifactFrame
      error={drawn.error ? "The chart could not be loaded." : null}
      kind="Chart"
      onRetry={drawn.retry}
      pending={drawn.status === "loading"}
      ratio={2}
      source={drawn.value ?? undefined}
      title="Retention by cohort"
    >
      {(slot) => (drawn.value ? <Chart slot={slot} /> : null)}
    </ArtifactFrame>
  );
}

const examples: ExampleSet = {
  preview: () => <Basic />,
  previewCode: `<ArtifactFrame
  kind="Chart"
  title="Sign-ups each month"
  source={chartSource}
>
  {({ onReady, onExport, onError }) => <TheChart onReady={onReady} onExport={onExport} onError={onError} />}
</ArtifactFrame>`,
  examples: [
    {
      id: "source",
      title: "The source, and a download",
      description:
        "`source` turns on the source toggle, copy and the source download. The children offer the image downloads through the slot; a PNG is made from the SVG when only an SVG was offered.",
      code: `<ArtifactFrame kind="Chart" title="Sign-ups" source={chartSource} defaultView="source">
  {(slot) => <TheChart {...slot} />}
</ArtifactFrame>`,
      render: () => <WithSource />,
      align: "start",
    },
    {
      id: "failure",
      title: "A drawing that fails",
      description:
        "`error` (or a child that throws, caught inside the frame) shows the reason in an inline strip and keeps the source. `onRetry` adds the key that tries again, and a new `source` clears the failure.",
      code: `<ArtifactFrame
  kind="Diagram"
  title="Floor plan"
  source={floorPlanSource}
  error={reason}
  onRetry={drawAgain}
>
  {(slot) => <TheDiagram {...slot} />}
</ArtifactFrame>`,
      render: () => <Failed />,
      align: "start",
    },
    {
      id: "loading",
      title: "A height kept while it loads",
      description:
        "`pending` shows a labelled busy state until the children call `onReady`. `ratio` or `minHeight` is the height of both the skeleton and the drawing, so nothing shifts when it arrives. Here `useAsyncRender` loads the drawing, keeps the last one while it reloads and drops an answer that arrives after its deps changed.",
      code: `const drawn = useAsyncRender(() => fetchDrawing(), []);

<ArtifactFrame
  kind="Chart"
  title="Retention"
  pending={drawn.status === "loading"}
  ratio={2}
  source={drawn.value}
  onRetry={drawn.retry}
>
  {(slot) => (drawn.value ? <TheChart {...slot} /> : null)}
</ArtifactFrame>`,
      render: () => <Loading />,
      align: "start",
    },
  ],
};

const meta = {
  title: "Agents/Artifact frame",
  component: ArtifactFrame,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: {
    kind: "Chart",
    title: "Sign-ups each month",
    source: CHART,
    sourceLanguage: "xml",
    pending: false,
    streaming: false,
    minHeight: "10rem",
    contentDir: "ltr",
    fullScreen: true,
    zoomable: true,
    sourceExtension: "txt",
    defaultView: "render",
  },
  argTypes: {
    kind: { control: "text" },
    title: { control: "text" },
    source: { control: "text" },
    status: { control: "inline-radio", options: [undefined, "loading", "ready", "error"] },
    pending: { control: "boolean" },
    streaming: { control: "boolean" },
    ratio: { control: { type: "number" } },
    minHeight: { control: "text" },
    contentDir: { control: "inline-radio", options: ["ltr", "rtl"] },
    fullScreen: { control: "boolean" },
    zoomable: { control: "boolean" },
    view: { control: "inline-radio", options: [undefined, "render", "source"] },
    error: { control: "text" },
    children: { control: false },
    labels: { control: false },
    onRetry: { control: false },
  },
} satisfies Meta<typeof ArtifactFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Agents" set={examples} title="Artifact frame" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div style={{ maxWidth: "44rem" }}>
      <ArtifactFrame {...args}>{(slot) => <Chart slot={slot} />}</ArtifactFrame>
    </div>
  ),
};
