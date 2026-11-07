import type { Meta, StoryObj } from "@storybook/react-vite";
import { Accordion } from "@fabrials/ui";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { accordionExamples } from "../../apps/site/components/examples/structure";

const description =
  "Sections that open in place: questions and answers, or a stack of tools as rows.";

const meta = {
  title: "Components/Accordion",
  component: Accordion,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { variant: "default", multiple: false },
  argTypes: { variant: { control: "inline-radio", options: ["default", "rows"] } },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={accordionExamples} title="Accordion" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <Accordion {...args} style={{ maxWidth: "28rem" }}>
      <AccordionItem value="share">
        <AccordionTrigger>What does sharing publish?</AccordionTrigger>
        <AccordionContent>Provider, plan and usage summaries.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="offline">
        <AccordionTrigger>Does Spanreed work offline?</AccordionTrigger>
        <AccordionContent>Yes. Sharing waits for the connection.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
