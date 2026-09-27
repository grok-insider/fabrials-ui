import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, DitherBand, DitherGem, DitherScene, Snippet, type GemName } from "@fabrials/ui";
import "./highstorm.css";

const meta = {
  title: "Fabrials/Highstorm",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

// Synthetic product index; the gem per product is the 0.7 proposal.
const products: [string, GemName, string, string][] = [
  ["Spanreed", "ruby", "Shows what your AI coding subscriptions use and cost, from the terminal or the tray.", "Install Spanreed"],
  ["Syl", "sapphire", "Lets your agents drive and test desktop, browser and Android apps through a CLI and MCP.", "Read the Syl docs"],
  ["Usage AI", "heliodor", "Weekly numbers from Spanreed users who choose to share them.", "See this week"],
  ["ai.fabrials.com", "amethyst", "A hosted relay for Grok, Cursor Cloud Agents and Nous, with per-key limits.", "Open the relay"],
];

const gems: GemName[] = ["stormlight", "heliodor", "sapphire", "ruby", "emerald", "zircon", "smokestone", "amethyst"];

function Landing() {
  return (
    <div className="hs">
      <section className="hs-hero">
        <DitherScene />
        <div className="hs-hero-text">
          <h1>Tools for people who work beside AI agents.</h1>
          <p>Spanreed shows what your coding subscriptions cost. Syl lets your agents drive and test real apps. Both run on your own machine.</p>
          <div className="hs-actions">
            <Button>Install Spanreed</Button>
            <a href="#tools">Browse all tools</a>
          </div>
        </div>
      </section>
      <section className="hs-section" id="tools" aria-labelledby="hs-tools">
        <h2 id="hs-tools">Everything on fabrials.com</h2>
        <ul className="hs-index">
          {products.map(([name, gem, text, link]) => (
            <li key={name}>
              <DitherGem gem={gem} size={28} />
              <h3>{name}</h3>
              <p>{text}</p>
              <a href="#tools">{link}</a>
            </li>
          ))}
        </ul>
      </section>
      <section className="hs-section hs-split" aria-labelledby="hs-usage">
        <div className="hs-panel">
          <DitherBand />
          <div className="hs-panel-body">
            <h2 id="hs-usage">Usage AI</h2>
            <p>Anonymous weekly totals from Spanreed users who share a snapshot. Updated every Monday.</p>
            <Snippet>curl -fsSL https://fabrials.com/install/spanreed.sh | sh</Snippet>
          </div>
        </div>
        <div className="hs-gems" aria-label="Product gems">
          {gems.map((gem) => (
            <span key={gem}>
              <DitherGem gem={gem} size={40} />
              {gem}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function SignIn() {
  return (
    <div className="hs-login">
      <DitherScene variant="full" />
      <form className="hs-login-card" onSubmit={(event) => event.preventDefault()}>
        <DitherGem gem="stormlight" size={24} />
        <h1>Sign in to Fabrials</h1>
        <p>One account for fabrials.com, ai.fabrials.com and the admin console.</p>
        <Button type="submit">Continue with X</Button>
        <small>We read your X handle and avatar, nothing else.</small>
      </form>
    </div>
  );
}

export const Landing_: Story = { name: "Landing", render: () => <Landing /> };
export const SignIn_: Story = { name: "Sign in", render: () => <SignIn /> };
