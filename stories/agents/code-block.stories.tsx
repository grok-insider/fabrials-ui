import type { Meta, StoryObj } from "@storybook/react-vite";
import { CodeBlock } from "@fabrials/ai-ui";
import { Showcase } from "../showcase";
import { codeBlockExamples } from "../../apps/site/components/examples/code-block";

const description =
  "The code in an answer, highlighted in the same inks as CodePanel, with copy and download, line numbers, marked lines, a change's added and removed lines, boxed names and soft wrapping; and the styles for the rest of the rendered markdown.";

const sample = `export async function syncMailbox(id: string) {
  return withRetry(() => fetchHeaders(id), {
    attempts: 5,
    retryOn: [429, 503],
  });
}`;

const meta = {
  title: "Agents/Code block",
  component: CodeBlock,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: {
    code: sample,
    language: "ts",
    filename: "sync.ts",
    lineNumbers: true,
    highlightLines: [3, 4],
    wrap: false,
    download: true,
    copyable: true,
  },
  argTypes: {
    language: { control: "select", options: ["ts", "tsx", "json", "bash", "css", "html", "py", "rs", "go", "sql", "yaml", "toml", "diff", "text"] },
    children: { control: false },
    actions: { control: false },
    onCopy: { control: false },
  },
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Agents" set={codeBlockExamples} title="Code block" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div style={{ maxWidth: "40rem" }}>
      <CodeBlock {...args} />
    </div>
  ),
};
