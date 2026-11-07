import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowUpRight } from "lucide-react";
import { Badge, DitherGem, ShimmerText, WorkingLight } from "@fabrials/ui";
import { AgentThinking, ContextMeter, TaskList } from "@fabrials/ai-ui";
import "./overview.css";

const sections = [
  {
    gem: "zircon",
    name: "Foundations",
    line: "The palette, the type, the dither and the motion every piece is built from.",
    href: "/?path=/story/foundations-motion--vocabulary",
  },
  {
    gem: "stormlight",
    name: "Components",
    line: "Each control on its own page: in context, every way of using it with the code, and a playground of its props.",
    href: "/?path=/docs/components-button--docs",
  },
  {
    gem: "amethyst",
    name: "Agents",
    line: "An agent at work: thinking, its plan, its research, the files it is given, the picture it is making.",
    href: "/?path=/story/agents-agent-thinking--overview",
  },
  {
    gem: "heliodor",
    name: "Patterns",
    line: "Whole pages: the instrument workspace, product consoles, settings, landings and sign-in.",
    href: "/?path=/story/patterns-instrument--workspace-page",
  },
  {
    gem: "smokestone",
    name: "Tests",
    line: "The benches the visual suite photographs: edge cases, narrow panes, right to left, forced colors.",
    href: "/?path=/story/tests-controls--icon-buttons",
  },
] as const;

const principles = [
  ["Calm surfaces, grouped by space", "What belongs together shares one plate; space and a tint separate before a line does."],
  ["A state is a tint", "Alerts, selections and tags take their tone into the card and its ink for their words."],
  ["Motion answers", "What you press goes down, what arrives rises into place, what you choose slides there."],
  ["Light is dithered, or it is work", "The brand's light is an ordered dither; the only other light is an agent at work."],
] as const;

function WelcomePage() {
  return (
    <main className="ov">
      <section className="ov-hero" aria-labelledby="ov-title">
        <div className="ov-copy">
          <p className="ov-eyebrow">
            <DitherGem gem="zircon" size={20} /> Fabrials UI 0.11
          </p>
          <h1 id="ov-title">An instrument, with life.</h1>
          <p className="ov-lead">
            The shared interface of the Fabrials products: calm slate surfaces grouped by space, states as tints, a mono voice for readings, data drawn in
            dither, and motion that answers what people and agents do.
          </p>
          <p className="ov-links">
            <a href="/?path=/docs/components-button--docs" target="_top">
              Browse the components
            </a>
            <a href="https://ui.fabrials.com" rel="noreferrer" target="_blank">
              ui.fabrials.com <ArrowUpRight aria-hidden size={14} />
            </a>
          </p>
        </div>
        <div className="ov-run" aria-label="An agent at work, synthetic">
          <div className="ov-run-head">
            <span className="ov-run-title">Migration run</span>
            <Badge dot tone="info">
              Live
            </Badge>
          </div>
          <AgentThinking label="Copying invoices in batches" startedAt={Date.now() - 74_000} variant="orbit" />
          <TaskList
            label="Plan"
            tasks={[
              { id: "a", title: "Read the billing schema", status: "done", meta: "0.9s" },
              { id: "b", title: "Copy 48,210 invoices", status: "running", detail: "Batch 7 of 12" },
              { id: "c", title: "Compare the row counts", status: "pending" },
            ]}
          />
          <ContextMeter
            legend={false}
            limit={200_000}
            parts={[
              { label: "Tools", value: 11_800 },
              { label: "Files", value: 38_400 },
              { label: "Conversation", value: 22_700 },
            ]}
          />
          <WorkingLight />
        </div>
      </section>

      <section className="ov-section" aria-labelledby="ov-start">
        <h2 id="ov-start">Where to start</h2>
        <ul className="ov-index">
          {sections.map((section) => (
            <li key={section.name}>
              <DitherGem gem={section.gem} size={28} />
              <h3>{section.name}</h3>
              <p>{section.line}</p>
              <a href={section.href} target="_top">
                Open {section.name.toLowerCase()}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="ov-section" aria-labelledby="ov-rules">
        <h2 id="ov-rules">Four rules</h2>
        <ol className="ov-rules">
          {principles.map(([title, line], index) => (
            <li key={title}>
              <span className="ov-rule-number">{String(index + 1).padStart(2, "0")}</span>
              <h3>{index === 3 ? <ShimmerText as="span" tone="light">{title}</ShimmerText> : title}</h3>
              <p>{line}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}

const meta = {
  title: "Overview/Introduction",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Welcome: Story = { render: () => <WelcomePage /> };
