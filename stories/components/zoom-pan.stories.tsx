import type { Meta, StoryObj } from "@storybook/react-vite";
import { ZoomPan } from "@fabrials/ui";
import { Showcase } from "../showcase";
import type { ExampleSet } from "../../apps/site/components/examples/types";

const description =
  "A viewport that zooms and pans anything: a diagram, a canvas, a wide table. The wheel steps the same on every device and around the pointer, a pinch follows the fingers, a drag pans once there is more to see, and the keys work while the region has focus.";

const PLAN = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="450" viewBox="0 0 1200 450" style="max-width:100%;height:auto" role="img" aria-label="A plan of four rooms">
  <rect width="1200" height="450" fill="none"/>
  <g fill="none" stroke="#8b93a0" stroke-width="2">
    <rect x="16" y="16" width="1168" height="418" rx="8"/>
    <line x1="416" y1="16" x2="416" y2="434"/>
    <line x1="816" y1="16" x2="816" y2="434"/>
    <line x1="416" y1="230" x2="1200" y2="230"/>
  </g>
  <g fill="#565d68" font-family="IBM Plex Mono, monospace" font-size="18">
    <text x="46" y="56">Hall</text>
    <text x="446" y="56">Kitchen</text>
    <text x="846" y="56">Study</text>
    <text x="446" y="270">Store</text>
  </g>
</svg>`;

const box = { blockSize: "18rem", border: "1px solid var(--border)", borderRadius: "var(--fui-radius-plate)", padding: "var(--fui-space-3)" } as const;

function Wide() {
  return (
    <ZoomPan style={box}>
      <div dangerouslySetInnerHTML={{ __html: PLAN }} />
    </ZoomPan>
  );
}

function Static() {
  return (
    <ZoomPan interactive={false} style={box}>
      <div dangerouslySetInnerHTML={{ __html: PLAN }} />
    </ZoomPan>
  );
}

function Full() {
  return (
    <ZoomPan maxScale={8} minScale={0.5} wheel="zoom" style={{ ...box, blockSize: "22rem" }}>
      <div dangerouslySetInnerHTML={{ __html: PLAN }} />
    </ZoomPan>
  );
}

const examples: ExampleSet = {
  preview: () => <Wide />,
  previewCode: `<ZoomPan label="Floor plan">
  <ThePlan />
</ZoomPan>`,
  examples: [
    {
      id: "static",
      title: "In a page that scrolls",
      description:
        "`interactive={false}` makes it an ordinary box: the wheel scrolls the page, nothing takes a key. Use it for a drawing inside an answer and make it interactive in the full-screen view.",
      code: `<ZoomPan interactive={false}>
  <ThePlan />
</ZoomPan>`,
      render: () => <Static />,
      align: "start",
    },
    {
      id: "full",
      title: "A view that owns the screen",
      description:
        "`wheel=\"zoom\"` zooms on every turn, as a viewer does. `minScale` and `maxScale` widen the range; the keys show the level and Fit brings the whole drawing back.",
      code: `<ZoomPan wheel="zoom" minScale={0.5} maxScale={8} label={title}>
  <ThePlan />
</ZoomPan>`,
      render: () => <Full />,
      align: "start",
    },
  ],
};

const meta = {
  title: "Components/Zoom pan",
  component: ZoomPan,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: {
    interactive: true,
    wheel: "ctrl",
    controls: true,
    minScale: 1,
    maxScale: 4,
    label: "Floor plan, zoomable",
  },
  argTypes: {
    wheel: { control: "inline-radio", options: ["ctrl", "zoom"] },
    interactive: { control: "boolean" },
    controls: { control: "boolean" },
    minScale: { control: { type: "number", min: 0.25, max: 2, step: 0.05 } },
    maxScale: { control: { type: "number", min: 1, max: 12, step: 0.5 } },
    children: { control: false },
    labels: { control: false },
  },
} satisfies Meta<typeof ZoomPan>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={examples} title="Zoom pan" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div style={{ maxWidth: "40rem" }}>
      <ZoomPan {...args} style={box}>
        <div dangerouslySetInnerHTML={{ __html: PLAN }} />
      </ZoomPan>
    </div>
  ),
};
