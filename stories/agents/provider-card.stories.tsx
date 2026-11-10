import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProviderCard } from "@fabrials/ai-ui";
import { esProvider } from "../accounts-es";
import { GROK_PROVIDER, NOUS_PROVIDER, PROVIDER_WITH_ERROR, RESET_CREDITS } from "../accounts-fixtures";

const description =
  "One provider on an account screen: its name, the plan it is on, each line of quota the provider reports with a bar and the value at its end, the limit reset credits it has left and how old that reading is. Every word is a label and the title's level is the host's, so the card fits an outline and a language it was not written in.";

const meta = {
  title: "Agents/Provider card",
  component: ProviderCard,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: description } },
    layout: "padded",
  },
  args: {
    provider: { ...GROK_PROVIDER, resetInventory: RESET_CREDITS },
    headingLevel: 2,
  },
  argTypes: {
    provider: { control: false },
    headingLevel: { control: "inline-radio", options: [1, 2, 3, 4, 5, 6] },
    labels: { control: false },
    locale: { control: "select", options: [undefined, "en", "es", "fr", "ar"] },
  },
} satisfies Meta<typeof ProviderCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const shell = { maxWidth: "24rem", display: "grid", gap: "var(--fui-space-4)" } as const;

export const Overview: Story = {
  tags: ["!autodocs"],
  render: () => (
    <div style={shell}>
      <ProviderCard provider={{ ...GROK_PROVIDER, resetInventory: RESET_CREDITS }} />
      <ProviderCard provider={NOUS_PROVIDER} />
      <ProviderCard provider={PROVIDER_WITH_ERROR} />
      <ProviderCard labels={esProvider} locale="es" provider={GROK_PROVIDER} />
    </div>
  ),
};

export const Playground: Story = {
  render: (args) => (
    <div style={shell}>
      <ProviderCard {...args} />
    </div>
  ),
};
