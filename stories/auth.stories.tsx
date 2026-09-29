import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Languages } from "lucide-react";
import { AuthLayout, Button, DitherScene, Field, Input, ProductLockup } from "@fabrials/ui";

const meta = {
  title: "Fabrials/Auth",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Form({ children }: { children?: ReactNode }) {
  return (
    <form className="catalogue-stack" onSubmit={(event) => event.preventDefault()}>
      <Field label="Email address">{(props) => <Input {...props} type="email" autoComplete="username" placeholder="you@example.com" />}</Field>
      <Button type="submit" size="lg">
        Sign in
      </Button>
      {children}
    </form>
  );
}

const corner = (
  <Button variant="ghost" size="lg">
    <Languages aria-hidden />
    English
  </Button>
);

const brand = <ProductLockup product="Open Email" tagline="by Fabrials" gem="emerald" size="lg" />;

/** With an aside the card anchors to the inline start of its column, next to the storm (DESIGN.md). The corner control follows the card in the DOM. */
function Aside({ align }: { align?: "start" | "center" }) {
  return (
    <AuthLayout
      brand={brand}
      title="Sign in to your mailbox"
      description="Use your mailbox password. Your administrator can reset it."
      footer="Your password is used only by this server and is never shared with AI providers."
      aside={<DitherScene variant="full" />}
      actions={corner}
      align={align}
    >
      <Form />
    </AuthLayout>
  );
}

function Plain({ align }: { align?: "start" | "center" }) {
  return (
    <AuthLayout
      brand={brand}
      title="Sign in to your mailbox"
      description="Use your mailbox password. Your administrator can reset it."
      footer="Your password is used only by this server and is never shared with AI providers."
      actions={corner}
      align={align}
    >
      <Form />
    </AuthLayout>
  );
}

export const AsideAuto: Story = { name: "Beside the storm", render: () => <Aside /> };
export const AsideCentred: Story = { name: "Beside the storm, centred", render: () => <Aside align="center" /> };
export const Centred: Story = { name: "No aside", render: () => <Plain /> };
export const Start: Story = { name: "Anchored to the start", render: () => <Plain align="start" /> };
