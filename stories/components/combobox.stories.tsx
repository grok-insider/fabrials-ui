import type { Meta, StoryObj } from "@storybook/react-vite";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList, Field } from "@fabrials/ui";

const description =
  "A field that filters a list as you type: the input in its box with a key that opens the list and one that empties the field, the list under it, and a sentence for when nothing matches. With `multiple` the chosen values are chips in the same box.";

const meta = {
  title: "Components/Combobox",
  component: ComboboxInput,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { placeholder: "Choose a workspace", showTrigger: true, showClear: true, disabled: false, triggerLabel: "Show options", clearLabel: "Clear" },
  argTypes: {
    showTrigger: { control: "boolean" },
    showClear: { control: "boolean" },
    disabled: { control: "boolean" },
    triggerLabel: { control: "text" },
    clearLabel: { control: "text" },
    placeholder: { control: "text" },
  },
} satisfies Meta<typeof ComboboxInput>;

export default meta;
type Story = StoryObj<typeof meta>;

// Synthetic workspaces.
const workspaces = ["North", "South", "East", "West", "Harbour", "Lighthouse"];

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div style={{ maxWidth: "24rem", minHeight: "20rem" }}>
      <Field label="Workspace">
        {(field) => (
          <Combobox items={workspaces} defaultValue="Harbour" disabled={args.disabled}>
            <ComboboxInput {...field} {...args} />
            <ComboboxContent>
              <ComboboxEmpty>No workspace by that name.</ComboboxEmpty>
              <ComboboxList>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        )}
      </Field>
    </div>
  ),
};
