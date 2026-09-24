import { useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toaster, toast } from "@fabrials/ui";

function NoticesPreview() {
  useEffect(() => {
    toast.success("Reset used", { id: "toast-success", duration: Infinity });
    toast.error("Could not save proxy key", {
      id: "toast-error",
      duration: Infinity,
      description: "Check the connection and try again.",
    });
  }, []);
  return (
    <main className="catalogue-toast-stage">
      <h1>Accounts</h1>
      <p>A finished action and a failed action use the same notice.</p>
      <Toaster position="bottom-right" />
    </main>
  );
}

const meta = {
  title: "Fabrials/Toast",
  component: Toaster,
} satisfies Meta<typeof Toaster>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Notices: Story = { render: () => <NoticesPreview /> };
