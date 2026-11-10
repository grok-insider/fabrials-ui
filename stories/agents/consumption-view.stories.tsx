import type { Meta, StoryObj } from "@storybook/react-vite";
import { ConsumptionView } from "@fabrials/ai-ui";
import { EMPTY_REPORT, REPORT } from "../accounts-fixtures";

const description =
  "What a set of clients spent, as three readings and one table: tokens, known cost and how many sources reported, then the breakdown by day, session, client, model or project. Each row says when a figure is partial, and the sources underneath say which one stopped, so a total is never read as complete when it is not.";

const meta = {
  title: "Agents/Consumption view",
  component: ConsumptionView,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: description } },
    layout: "padded",
  },
  args: { report: REPORT, synchronized: false, headingLevel: 2 },
  argTypes: {
    report: { control: false },
    synchronized: { control: "boolean" },
    headingLevel: { control: "inline-radio", options: [1, 2, 3, 4, 5, 6] },
    labels: { control: false },
    locale: { control: "select", options: [undefined, "en", "es", "fr"] },
  },
} satisfies Meta<typeof ConsumptionView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => (
    <div style={{ maxWidth: "48rem" }}>
      <ConsumptionView report={REPORT} />
    </div>
  ),
};

export const Playground: Story = {
  render: (args) => (
    <div style={{ maxWidth: "48rem" }}>
      <ConsumptionView {...args} report={args.synchronized ? { ...REPORT, sessions: [], projects: [] } : REPORT} />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div style={{ maxWidth: "48rem" }}>
      <ConsumptionView report={EMPTY_REPORT} />
    </div>
  ),
};
