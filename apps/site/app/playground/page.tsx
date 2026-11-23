import Link from "next/link";
import { Badge, PageHeader, SectionHeader } from "@fabrials/ui";
import { CoffeeDemo } from "@/components/coffee-demo";
import { BookingDemo, ExplorerDemo } from "@/components/demos";
import { PlaygroundGallery } from "@/components/playground-gallery";
import { PlaygroundSandbox } from "@/components/playground-sandbox";
import { AgentWorkbenchDemo, InstrumentLabDemo } from "@/components/playground/showcase-demos";
import { OnboardingExample, SupportExample, TravelExample } from "@/components/workflow-examples";
import { MCPDashboard } from "@/registry/components/mcp-dashboard";
import uiPackage from "../../../../packages/ui/package.json";

export const metadata = {
  title: "Playground",
  description:
    "Interactive 0.12 workbenches for live AI agent telemetry, Stormlight dithering, Radiant glyphs and shared WebMCP flows.",
};

export default function Playground() {
  return (
    <main id="main-content" className="playground-main">
      <div className="playground-head">
        <PageHeader
          eyebrow={`Interactive lab · @fabrials/ui ${uiPackage.version}`}
          title="Playground"
          description="Explore live @fabrials/ai-ui agent runs, interactive Bayer dither & polestone controls, first-load skeletons, and shared WebMCP workflows. Every sandbox runs locally with synthetic data."
          actions={<Badge tone="info" dot>9 interactive scenarios</Badge>}
        />
      </div>

      <PlaygroundGallery>
        <section id="agent-workbench" className="scroll-mt-28">
          <SectionHeader
            title="Agent & AI runtime workbench"
            description="Step through live operational workflows with AgentThinking, TaskList, ToolCall inspectors, ContextMeter thresholds, streaming ChatMessage carets and GenerationFrame effects."
          />
          <ComponentLinks
            slugs={[
              ["agent-thinking", "AgentThinking"],
              ["task-list", "TaskList"],
              ["tool-call", "ToolCall"],
              ["context-meter", "ContextMeter"],
              ["generation-frame", "GenerationFrame"],
              ["working-light", "WorkingLight"],
            ]}
          />
          <PlaygroundSandbox>
            <AgentWorkbenchDemo />
          </PlaygroundSandbox>
        </section>

        <section id="instrument-lab" className="scroll-mt-28">
          <SectionHeader
            title="Stormlight, Polestones & Dither lab"
            description="Switch across all ten Knights Radiant orders and polestone ramps, tune 8×8 Bayer dot resolution, test compact density, and toggle zero-layout-shift Loading skeletons live."
          />
          <ComponentLinks
            slugs={[
              ["dither-canvas", "DitherCanvas"],
              ["radiant-glyph", "RadiantGlyph"],
              ["loading", "Loading"],
              ["stat-group", "StatGroup"],
              ["progress", "Progress"],
              ["readout", "Readout"],
            ]}
          />
          <PlaygroundSandbox>
            <InstrumentLabDemo />
          </PlaygroundSandbox>
        </section>

        <section id="comparison" className="scroll-mt-28">
          <SectionHeader
            title="From a recommendation to a selection"
            description="A shopping assistant helps find a machine that fits your space and accessories. Compare the evidence, change the selection and review it. This example owns the product rules and cart state."
          />
          <ComponentLinks
            slugs={[
              ["comparison", "Comparison"],
              ["webmcp-provider", "WebMCP provider"],
              ["confirmation-dialog", "Confirmation"],
            ]}
          />
          <PlaygroundSandbox>
            <CoffeeDemo playground />
          </PlaygroundSandbox>
        </section>

        <section id="explorer" className="scroll-mt-28">
          <SectionHeader
            title="A project explorer"
            description="People and tools update the same filters and selection. Try a manual search, then simulate a tool call."
          />
          <ComponentLinks
            slugs={[
              ["data-explorer", "Data explorer"],
              ["webmcp-provider", "WebMCP provider"],
            ]}
          />
          <PlaygroundSandbox>
            <ExplorerDemo playground />
          </PlaygroundSandbox>
        </section>

        <section id="reservation" className="scroll-mt-28">
          <SectionHeader
            title="A reservation flow"
            description="Choose dates and move through a multi-step flow. Validation and progress stay in the application."
          />
          <ComponentLinks
            slugs={[
              ["wizard", "Multi-step flow"],
              ["date-range", "Date range"],
            ]}
          />
          <PlaygroundSandbox>
            <BookingDemo playground />
          </PlaygroundSandbox>
        </section>

        <section id="console" className="scroll-mt-28">
          <SectionHeader
            title="A real MCP connection"
            description="Connect to the included demo server, or enter your own CORS-enabled endpoint. The demo supports the current protocol and legacy clients."
          />
          <ComponentLinks
            slugs={[
              ["mcp-dashboard", "MCP dashboard"],
              ["connection-panel", "Connection panel"],
              ["tool-catalog", "Tool catalog"],
            ]}
          />
          <PlaygroundSandbox>
            <MCPDashboard defaultEndpoint="/api/demo/mcp" />
          </PlaygroundSandbox>
        </section>

        <section id="travel" className="scroll-mt-28">
          <SectionHeader
            title="Plan a quieter weekend"
            description="Compare stays with your budget and preferences. An agent can highlight matches and build the same shortlist."
          />
          <ComponentLinks
            slugs={[
              ["comparison", "Comparison"],
              ["webmcp-provider", "WebMCP provider"],
            ]}
          />
          <PlaygroundSandbox>
            <TravelExample playground />
          </PlaygroundSandbox>
        </section>

        <section id="support" className="scroll-mt-28">
          <SectionHeader
            title="Triage a support queue"
            description="Filter the inbox, inspect a ticket and review its resolution before applying the change."
          />
          <ComponentLinks
            slugs={[
              ["confirmation-dialog", "Confirmation"],
              ["webmcp-provider", "WebMCP provider"],
            ]}
          />
          <PlaygroundSandbox>
            <SupportExample playground />
          </PlaygroundSandbox>
        </section>

        <section id="onboarding" className="scroll-mt-28">
          <SectionHeader
            title="Set up a workspace"
            description="A validated multi-step flow that an agent can prepare and a person can finish."
          />
          <ComponentLinks
            slugs={[
              ["wizard", "Multi-step flow"],
              ["webmcp-provider", "WebMCP provider"],
            ]}
          />
          <PlaygroundSandbox>
            <OnboardingExample playground />
          </PlaygroundSandbox>
        </section>
      </PlaygroundGallery>
    </main>
  );
}

function ComponentLinks({ slugs }: { slugs: readonly [string, string][] }) {
  return (
    <div className="playground-chips">
      <span className="playground-chips-label">Built with</span>
      {slugs.map(([slug, title]) => (
        <Link key={slug} href={`/docs/${slug}`} className="playground-chip-link">
          {title}
        </Link>
      ))}
    </div>
  );
}
