"use client";

// The data and brand pieces 0.12 added: the key of a chart, a ramp, a canvas the host paints, a viewport that zooms, and the
// panel of a file being dragged. Packages only, fixed data, nothing running by itself.
import { useState } from "react";
import {
  Button,
  ChartLegend,
  ColorRamp,
  DitherCanvas,
  DropOverlay,
  LegendItem,
  Swatch,
  ZoomPan,
  type DitherPaint,
} from "@fabrials/ui";
import type { ExampleSet } from "./types";

const plate = {
  border: "1px solid var(--border)",
  borderRadius: "var(--fui-radius-lg)",
  display: "grid",
  gap: "var(--fui-space-4)",
  padding: "var(--fui-space-4)",
  background: "var(--card)",
} as const;
const muted = { margin: 0, color: "var(--muted-foreground)" } as const;
const mono = {
  margin: 0,
  color: "var(--muted-foreground)",
  fontFamily: "var(--fui-font-label)",
  fontSize: "var(--fui-text-label)",
} as const;

/* ---------------------------------------------------------------- the key of a chart */

const SERIES = [
  {
    id: "requests",
    label: "Requests",
    color: "var(--chart-1)",
    pattern: "solid" as const,
  },
  {
    id: "sessions",
    label: "Sessions",
    color: "var(--chart-2)",
    pattern: "dashed" as const,
  },
  {
    id: "keys",
    label: "Keys",
    color: "var(--chart-3)",
    pattern: "dither" as const,
  },
];

function ToggleLegend() {
  const [hidden, setHidden] = useState<readonly string[]>([]);
  return (
    <ChartLegend aria-label="Series">
      {SERIES.map((one) => (
        <LegendItem
          color={one.color}
          hidden={hidden.includes(one.id)}
          key={one.id}
          label={one.label}
          onOnly={() => setHidden(SERIES.filter((other) => other.id !== one.id).map((other) => other.id))}
          onToggle={() => setHidden(hidden.includes(one.id) ? hidden.filter((id) => id !== one.id) : [...hidden, one.id])}
          pattern={one.pattern}
        />
      ))}
    </ChartLegend>
  );
}

export const chartLegendExamples: ExampleSet = {
  examples: [
    {
      id: "toggles",
      title: "A legend that hides a series",
      description:
        "With `onToggle` an item is a button with `aria-pressed`, named Hide requests, and `onOnly` adds an Only key beside it. A hidden series is struck through and its key dimmed, so the state reads without colour.",
      code: `<ChartLegend aria-label="Series">
  {series.map((one) => (
    <LegendItem
      key={one.id}
      label={one.label}
      color={one.color}
      pattern={one.pattern}
      hidden={hidden.includes(one.id)}
      onToggle={() => toggle(one.id)}
      onOnly={() => only(one.id)}
    />
  ))}
</ChartLegend>`,
      render: () => (
        <div style={{ ...plate, gap: "var(--fui-space-3)" }}>
          <ToggleLegend />
        </div>
      ),
      align: "start",
    },
    {
      id: "ramp",
      title: "A ramp is painted in steps",
      description:
        "`ColorRamp` is the continuous legend of a map or a heat map: `stops` are sampled into `steps` cells, with `marks` as ticks and a text alternative in words. It is stepped on purpose, because a colour that encodes a value is data.",
      code: `<ColorRamp
  min={0}
  max={100}
  label="Sessions per day"
  stops={["var(--muted)", "var(--chart-1)", "var(--brand-ink)"]}
  marks={[{ value: 0, label: "none" }, { value: 60, label: "busy" }]}
/>`,
      render: () => (
        <div style={{ ...plate, inlineSize: "min(100%, 30rem)" }}>
          <ColorRamp
            label="Sessions per day"
            marks={[
              { label: "none", value: 0 },
              { label: "busy", value: 60 },
            ]}
            max={100}
            min={0}
            stops={["var(--muted)", "var(--chart-1)", "var(--brand-ink)"]}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--fui-space-2)",
            }}
          >
            <span style={mono}>Swatch</span>
            <Swatch color="var(--chart-1)" />
            <Swatch color="var(--chart-2)" pattern="dashed" />
            <Swatch color="var(--chart-3)" pattern="dither" />
          </div>
        </div>
      ),
      align: "start",
    },
  ],
};

/* ---------------------------------------------------------------- a canvas the host paints */

// A picture made in the page, so nothing comes from the network: two hills and a sun, as an SVG.
const PICTURE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300"><rect width="480" height="300" fill="#7d8ea6"/><circle cx="352" cy="128" r="40" fill="#f2e6c8"/><path d="M0 300 L134 176 L264 300 Z" fill="#22303c"/><path d="M192 300 L374 202 L480 300 Z" fill="#141d26"/></svg>',
)}`;

const RAMP = {
  dark: ["background", "#11141a", "#1b2029", "#3a4351", "#6f7d92", "#9cc4ff"],
  light: ["background", "#e2e5e8", "#b9c0c8", "#8e98a5", "#5f6a79", "#2a63c4"],
};

// A synthetic picture, drawn in the page: a horizon, two hills and a low sun. No photograph, nothing from the network.
const SKETCH: DitherPaint = (context, size) => {
  const { width, height } = size;
  const sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#0d1420");
  sky.addColorStop(0.62, "#7d8ea6");
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#f2e6c8";
  context.beginPath();
  context.arc(width * 0.72, height * 0.55, Math.max(2, width * 0.05), 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#22303c";
  context.beginPath();
  context.moveTo(0, height);
  context.lineTo(width * 0.28, height * 0.66);
  context.lineTo(width * 0.55, height);
  context.closePath();
  context.fill();
  context.fillStyle = "#141d26";
  context.beginPath();
  context.moveTo(width * 0.4, height);
  context.lineTo(width * 0.78, height * 0.72);
  context.lineTo(width, height);
  context.closePath();
  context.fill();
};

function SourceCanvas() {
  const [failed, setFailed] = useState("");
  return (
    <div
      style={{
        display: "grid",
        gap: "var(--fui-space-2)",
        inlineSize: "min(100%, 30rem)",
      }}
    >
      <div
        style={{
          position: "relative",
          isolation: "isolate",
          blockSize: "12rem",
          overflow: "hidden",
          borderRadius: "var(--fui-radius-lg)",
        }}
      >
        <DitherCanvas
          fit="contain"
          mode="channels"
          onError={(reason) => setFailed(`The picture could not be read (${reason}).`)}
          ramp={RAMP}
          source={PICTURE}
        />
      </div>
      <p style={muted} role="status">
        {failed || "A picture that fails leaves the plain surface: the page never breaks."}
      </p>
    </div>
  );
}

export const ditherCanvasExamples: ExampleSet = {
  examples: [
    {
      id: "paint",
      title: "A picture drawn in code",
      description:
        '`paint` draws a scene with Canvas 2D and it is read back onto the same ramp, so a product\'s own backdrop sits on the brand material. `fit` and `tone` map a picture into a luminance range that keeps the text over it readable; `mode="channels"` keeps the colours.',
      code: `<div style={{ position: "relative", isolation: "isolate", blockSize: "16rem" }}>
  <DitherCanvas ramp={ramp} paint={sketch} cell={3} tone={{ contrast: 1.15 }} />
</div>`,
      render: () => (
        <div
          style={{
            position: "relative",
            isolation: "isolate",
            blockSize: "16rem",
            overflow: "hidden",
            borderRadius: "var(--fui-radius-lg)",
          }}
        >
          <DitherCanvas cell={3} paint={SKETCH} ramp={RAMP} />
        </div>
      ),
      align: "start",
    },
    {
      id: "source",
      title: "A picture, and one that cannot be read",
      description:
        "`source` takes a picture or its address, drawn at once when it is already decoded and waited for while it loads; a canvas with a source stays invisible until it arrives. `fit` fills or fits it, `tone` keeps the text over it readable, and a picture from another origin without CORS leaves the plain surface and calls `onError` once instead of throwing.",
      code: `<DitherCanvas ramp={ramp} source={photo} fit="cover" mode="channels" levels={5} onError={(reason) => say(reason)} />`,
      render: () => <SourceCanvas />,
      align: "start",
    },
  ],
};

/* ---------------------------------------------------------------- a viewport that zooms */

const DAYS = [18, 26, 21, 34, 29, 12, 31, 24, 38, 27, 19, 33];

function Plan() {
  return (
    <svg aria-hidden="true" height={180} viewBox="0 0 720 180" width={720}>
      <line stroke="var(--border)" x1="0" x2="720" y1="179" y2="179" />
      {DAYS.map((value, index) => (
        <rect fill="var(--brand)" height={value * 4} key={index} width={34} x={20 + index * 58} y={179 - value * 4} />
      ))}
    </svg>
  );
}

export const zoomPanExamples: ExampleSet = {
  examples: [
    {
      id: "diagram",
      title: "A drawing, read closer",
      description:
        '`ZoomPan` holds anything: a diagram, a canvas, a wide table. In a page that scrolls it stays a plain box (`interactive={false}`) and becomes interactive in the full-screen view; `wheel="zoom"` gives it the wheel for a view that owns the screen.',
      code: `<div style={{ blockSize: "18rem", overflow: "hidden" }}>
  <ZoomPan label="Sessions per day">
    <Plan />
  </ZoomPan>
</div>`,
      render: () => (
        <div
          style={{
            blockSize: "18rem",
            border: "1px solid var(--border)",
            borderRadius: "var(--fui-radius-lg)",
            inlineSize: "min(100%, 40rem)",
            overflow: "hidden",
          }}
        >
          <ZoomPan label="Sessions per day">
            <Plan />
          </ZoomPan>
        </div>
      ),
      align: "start",
    },
    {
      id: "still",
      title: "A box that does not take the page's gestures",
      description:
        "`interactive={false}` draws the content as it is: no key, no wheel, no touch and no controls. Use it for a drawing inside a page that scrolls, and make it interactive in the full-screen view of a frame.",
      code: `<ZoomPan interactive={false} controls={false} label="Sessions per day">
  <Plan />
</ZoomPan>`,
      render: () => (
        <div
          style={{
            blockSize: "12rem",
            border: "1px solid var(--border)",
            borderRadius: "var(--fui-radius-lg)",
            inlineSize: "min(100%, 30rem)",
            overflow: "hidden",
          }}
        >
          <ZoomPan controls={false} interactive={false} label="Sessions per day, still">
            <Plan />
          </ZoomPan>
        </div>
      ),
      align: "start",
    },
  ],
};

/* ---------------------------------------------------------------- a file being dragged */

const FILES = ["harbour.png", "orchard.png"];

function AttachmentArea() {
  const [files, setFiles] = useState<string[]>(FILES);
  return (
    <div
      style={{
        display: "grid",
        gap: "var(--fui-space-2)",
        inlineSize: "min(100%, 30rem)",
      }}
    >
      <div style={{ position: "relative" }}>
        <DropOverlay
          accept="image/png,image/jpeg"
          description="PNG or JPEG, up to 8 MB each."
          label="Drop files to attach"
          onDrop={(dropped) => setFiles([...files, ...dropped.map((file) => file.name)])}
        >
          <div style={{ ...plate, blockSize: "9rem", alignContent: "start" }} />
        </DropOverlay>
      </div>
      <div style={{ ...plate, gap: "var(--fui-space-1)" }}>
        <p style={mono}>Attached</p>
        {files.map((name) => (
          <p key={name} style={{ ...mono, color: "var(--foreground)" }}>
            {name}
          </p>
        ))}
      </div>
    </div>
  );
}

function HostPanel() {
  const [refused, setRefused] = useState(false);
  return (
    <div
      style={{
        display: "grid",
        gap: "var(--fui-space-2)",
        inlineSize: "min(100%, 28rem)",
      }}
    >
      <div style={{ blockSize: "8rem", position: "relative" }}>
        <DropOverlay active label="Drop files to attach" refused={refused} scope="self">
          <div style={{ ...plate, blockSize: "6rem" }} />
        </DropOverlay>
      </div>
      <Button onClick={() => setRefused(!refused)} size="sm" variant="outline">
        {refused ? "Show files that fit" : "Show a file that does not"}
      </Button>
    </div>
  );
}

export const dropOverlayExamples: ExampleSet = {
  examples: [
    {
      id: "area",
      title: "Over its own area",
      description:
        "The panel shows over the element it wraps, never over the window, takes no pointer events, and says what appeared in a polite region because a drag cannot be heard. `accept` lets it say that what is being dragged is not accepted.",
      code: `<DropOverlay accept="image/png,image/jpeg" label="Drop files to attach" description="PNG or JPEG, up to 8 MB each." onDrop={attach}>
  …the area…
</DropOverlay>`,
      render: () => <AttachmentArea />,
      align: "start",
    },
    {
      id: "host",
      title: "Shown by the host, or refused",
      description:
        '`active` shows or hides the panel from the host (a story, or a host that watches its own drags) and `refused` says the files are not accepted; `disabled` removes the watch entirely. With `scope="page"` a file dropped anywhere counts, for a chat that takes one that way.',
      code: `<DropOverlay active={dragging} refused={refused} label="Drop files to attach" onDrop={attach}>
  …if the host watches its own drags…
</DropOverlay>`,
      render: () => <HostPanel />,
      align: "start",
    },
  ],
};
