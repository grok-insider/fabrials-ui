import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Toaster, toast } from "@fabrials/ui";
import { Showcase } from "../showcase";
import { toasterExamples } from "../../apps/site/components/examples/status";

const description =
  "Notices that say what happened, from anywhere in the app, as polite announcements that pause on hover.";

const meta = {
  title: "Components/Toast",
  component: Toaster,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: description } } },
  args: { position: "bottom-right", closeButton: false, expand: false },
  argTypes: {
    position: { control: "select", options: ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"] },
  },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => <Showcase description={description} eyebrow="Components" set={toasterExamples} title="Toast" />,
};

export const Playground: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
      <Button onClick={() => toast.success("Account saved", { toasterId: "playground" })} variant="outline">
        Success
      </Button>
      <Button
        onClick={() => toast.error("Could not save the key", { description: "Check the connection and try again.", toasterId: "playground" })}
        variant="outline"
      >
        Error
      </Button>
      <Button
        onClick={() =>
          toast.promise(new Promise((resolve) => window.setTimeout(resolve, 1600)), {
            loading: "Revoking key",
            success: "Key revoked",
            error: "Could not revoke the key",
            toasterId: "playground",
          })
        }
        variant="outline"
      >
        A promise
      </Button>
      <Toaster {...args} id="playground" />
    </div>
  ),
};
