"use client";

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, ShimmerText, WorkingLight } from "@fabrials/ui";
import { ContextMeter } from "@fabrials/ai-ui";
import type { ExampleSet } from "./types";

const PARTS = [
  { label: "System prompt", value: 3_200 },
  { label: "Tools", value: 11_800 },
  { label: "Files", value: 18_400 },
  { label: "Conversation", value: 8_700 },
];

export const contextMeterExamples: ExampleSet = {
  preview: () => (
    <Card style={{ width: "min(100%, 24rem)" }}>
      <CardHeader>
        <CardTitle>Session</CardTitle>
        <CardDescription>grok-4.7, started 14:02</CardDescription>
      </CardHeader>
      <CardContent>
        <ContextMeter limit={200_000} parts={PARTS} />
      </CardContent>
    </Card>
  ),
  examples: [
    {
      id: "parts",
      title: "What fills the window",
      description:
        "`parts` are drawn in order, each in its series colour, and listed under the bar with what is left free. The bar is one `meter` whose value reads in full: \"42,100 of 200,000 tokens, 21%\".",
      code: `<ContextMeter
  limit={200_000}
  parts={[
    { label: "System prompt", value: 3_200 },
    { label: "Tools", value: 11_800 },
    { label: "Files", value: 18_400 },
    { label: "Conversation", value: 8_700 },
  ]}
/>`,
      render: () => (
        <div style={{ width: "min(100%, 24rem)" }}>
          <ContextMeter limit={200_000} parts={PARTS} />
        </div>
      ),
    },
    {
      id: "thresholds",
      title: "Filling up",
      description:
        "From `warnAt` (80 % by default) the reading turns to the warning ink and the free part of the track takes its tint; from `dangerAt` (95 %) to danger. Say what happens next beside it: a summary, a new session.",
      code: `<ContextMeter limit={200_000} parts={parts} warnAt={0.8} dangerAt={0.95} />`,
      render: () => (
        <div style={{ display: "grid", gap: "var(--fui-space-5)", width: "min(100%, 24rem)" }}>
          <ContextMeter
            legend={false}
            limit={200_000}
            parts={[
              { label: "Files", value: 98_000 },
              { label: "Conversation", value: 69_000 },
            ]}
          />
          <ContextMeter
            label="Context window, almost full"
            legend={false}
            limit={200_000}
            parts={[
              { label: "Files", value: 121_000 },
              { label: "Conversation", value: 72_400 },
            ]}
          />
        </div>
      ),
    },
    {
      id: "format",
      title: "Other units",
      description: "`format` writes each number and `unit` names them for assistive technology, so the meter can count anything with a limit: pages, minutes, credits.",
      code: `<ContextMeter
  label="Monthly credits"
  unit="credits"
  limit={5000}
  parts={[{ label: "Chat", value: 2140 }, { label: "Images", value: 960 }]}
  format={(value) => value.toLocaleString("en")}
/>`,
      render: () => (
        <div style={{ width: "min(100%, 24rem)" }}>
          <ContextMeter
            format={(value) => value.toLocaleString("en")}
            label="Monthly credits"
            limit={5000}
            parts={[
              { label: "Chat", value: 2140 },
              { label: "Images", value: 960 },
            ]}
            unit="credits"
          />
        </div>
      ),
    },
  ],
};

export const workingLightExamples: ExampleSet = {
  preview: () => (
    <Card style={{ position: "relative", width: "min(100%, 24rem)" }}>
      <CardHeader>
        <CardTitle>Weekly summary</CardTitle>
        <CardDescription>
          <ShimmerText as="span" tone="light">
            Reading 1,206 senders
          </ShimmerText>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Badge tone="info">Agent at work</Badge>
      </CardContent>
      <WorkingLight />
    </Card>
  ),
  examples: [
    {
      id: "surface",
      title: "On the surface it works on",
      description:
        "Render `WorkingLight` as the last child of a positioned surface while something works on it, and remove it when the work ends. It takes the surface's corners, turns along its edge and blooms softly outside it. Say the state in words as well: the light is decorative.",
      code: `<Card style={{ position: "relative" }}>
  …
  {summary.status === "working" ? <WorkingLight /> : null}
</Card>`,
      render: () => (
        <div style={{ display: "grid", gap: "var(--fui-space-4)", width: "min(100%, 24rem)" }}>
          <Card style={{ position: "relative" }}>
            <CardHeader>
              <CardTitle>Draft reply</CardTitle>
              <CardDescription>Writing from the last 3 messages</CardDescription>
            </CardHeader>
            <WorkingLight />
          </Card>
          <Button variant="outline" style={{ position: "relative", justifySelf: "start" }}>
            Summarising
            <WorkingLight />
          </Button>
        </div>
      ),
    },
    {
      id: "text",
      title: "Light in a label",
      description:
        "`ShimmerText tone=\"light\"` crosses a short label with the same light, for the words that name the work. The default `tone=\"ink\"` is quieter, for a pending label that is not an agent.",
      code: `<ShimmerText tone="light">Reading 1,206 senders</ShimmerText>
<ShimmerText>Loading folders</ShimmerText>`,
      render: () => (
        <div style={{ display: "grid", gap: "var(--fui-space-2)" }}>
          <ShimmerText tone="light">Reading 1,206 senders</ShimmerText>
          <ShimmerText>Loading folders</ShimmerText>
        </div>
      ),
    },
  ],
};
