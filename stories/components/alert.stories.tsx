import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Alert } from "@fabrials/ui";
import { AlertDescription, AlertTitle } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { alertExamples } from "../../apps/site/components/examples/status";

const description =
  "A message about the page in a tinted plate: what happened and what to do, with the icon in the tone's ink.";

const meta = {
  title: "Components/Alert",
  component: Alert,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { variant: "warning" },
  argTypes: { variant: { control: "select", options: ["default", "info", "success", "warning", "destructive"] }, layout: { control: "inline-radio", options: ["stacked", "inline"] } },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={alertExamples} title="Alert" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <Alert {...args} style={{ maxWidth: "34rem" }}>
      <AlertTitle>Observation is 3 hours old</AlertTitle>
      <AlertDescription>The relay has not reported since 11:42.</AlertDescription>
    </Alert>
  ),
};

/**
 * A notice that can ask again: the action waits for a promise, stays busy rather than disappearing (so the keyboard stays
 * where it was), and the notice's own live region reads the new words when they arrive. A retry that cannot help — an
 * allowance already spent — gets no `onRetry`.
 */
export const Retry: Story = {
  parameters: { layout: "padded" },
  render: () => <RetryDemo />,
};

function RetryDemo() {
  const [attempt, setAttempt] = useState(0);
  const retry = () =>
    new Promise<void>((resolve) => {
      window.setTimeout(() => {
        setAttempt((current) => current + 1);
        resolve();
      }, 800);
    });
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-3)", maxWidth: "34rem" }}>
      <Alert onRetry={retry} variant="warning">
        <AlertTitle>The relay did not answer</AlertTitle>
        <AlertDescription>
          {attempt === 0 ? "Nothing was lost. The request can be sent again." : `Attempt ${attempt + 1} did not reach the relay either.`}
        </AlertDescription>
      </Alert>
      <Alert tone="danger">
        <AlertTitle>The daily allowance is spent</AlertTitle>
        <AlertDescription>Asking again cannot help today. Your work is kept, and the allowance returns at midnight.</AlertDescription>
      </Alert>
      <Alert layout="inline" onRetry={retry} tone="info">
        <AlertTitle>Two queues are behind</AlertTitle>
        <AlertDescription>The relay is reachable again, but two runs are still waiting.</AlertDescription>
      </Alert>
    </div>
  );
}
