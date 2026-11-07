import type { Meta, StoryObj } from "@storybook/react-vite";
import { Table } from "@fabrials/ui";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { tableExamples } from "../../apps/site/components/examples/data";

const description =
  "Records as rows in one plate: a head in the label voice on an inset band, soft lines between rows, tabular numbers.";

const meta = {
  title: "Components/Table",
  component: Table,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: {},
  argTypes: {},
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={tableExamples} title="Table" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <Table {...args}>
      <TableHeader>
        <TableRow>
          <TableHead>Account</TableHead>
          <TableHead numeric>Requests</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Personal</TableCell>
          <TableCell numeric>12,840</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Work</TableCell>
          <TableCell numeric>9,312</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};
