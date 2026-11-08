import type { Meta, StoryObj } from "@storybook/react-vite";
import { SourceTally } from "@fabrials/ai-ui";
import { Showcase } from "../showcase";
import { sourceTallyExamples } from "../../apps/site/components/examples/source-tally";

const description =
  "The sources a search has found so far: what the agent does with them, how many (a reading that settles when it changes) and a tile for each, which rises in as it arrives.";

const meta = {
  title: "Agents/Source tally",
  component: SourceTally,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: {
    label: "Reviewing sources",
    max: 8,
    sources: [
      "https://www.postgresql.org/docs/current/sql-altertable.html",
      "https://wiki.postgresql.org/wiki/Lock_Monitoring",
      "https://reorg.github.io/pg_repack/",
      "https://docs.example.org/guides/zero-downtime",
    ],
  },
} satisfies Meta<typeof SourceTally>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Agents" set={sourceTallyExamples} title="Source tally" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
};
