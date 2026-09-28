import {
  TravelExample,
  SupportExample,
  OnboardingExample,
} from "@/components/workflow-examples";
import { PlaygroundSandbox } from "@/components/playground-sandbox";
import Link from "next/link";
import { PlaygroundGallery } from "@/components/playground-gallery";
import { CoffeeDemo } from "@/components/coffee-demo";
import { ExplorerDemo, BookingDemo } from "@/components/demos";
import { MCPDashboard } from "@/registry/components/mcp-dashboard";
import { Card, CardContent, PageHeader, SectionHeader } from "@fabrials/ui";
export const metadata = { title: "Playground" };
export default function Playground() {
  return (
    <main id="main-content" className="w-full px-(--fui-page-padding) py-12">
      <PageHeader
        title="Playground"
        description="Choose a scenario. Edit tool arguments and execute them against the live interface, then try a manual correction. Inspect every result and reset to experiment again."
      />
      <PlaygroundGallery>
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
          <Card>
            <CardContent>
              <PlaygroundSandbox>
                <ExplorerDemo playground />
              </PlaygroundSandbox>
            </CardContent>
          </Card>
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
          <Card>
            <CardContent>
              <PlaygroundSandbox>
                <BookingDemo playground />
              </PlaygroundSandbox>
            </CardContent>
          </Card>
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
          <Card>
            <CardContent>
              <PlaygroundSandbox>
                <MCPDashboard defaultEndpoint="/api/demo/mcp" />
              </PlaygroundSandbox>
            </CardContent>
          </Card>
        </section>
        <section id="travel" className="scroll-mt-24">
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
          <Card>
            <CardContent>
              <PlaygroundSandbox>
                <TravelExample playground />
              </PlaygroundSandbox>
            </CardContent>
          </Card>
        </section>
        <section id="support" className="scroll-mt-24">
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
          <Card>
            <CardContent>
              <PlaygroundSandbox>
                <SupportExample playground />
              </PlaygroundSandbox>
            </CardContent>
          </Card>
        </section>
        <section id="onboarding" className="scroll-mt-24">
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
          <Card>
            <CardContent>
              <PlaygroundSandbox>
                <OnboardingExample playground />
              </PlaygroundSandbox>
            </CardContent>
          </Card>
        </section>
      </PlaygroundGallery>
    </main>
  );
}

function ComponentLinks({ slugs }: { slugs: string[][] }) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
      <span className="mr-1 text-muted-foreground">Built with</span>
      {slugs.map(([slug, title]) => (
        <Link
          key={slug}
          href={`/docs/${slug}`}
          className="rounded-md border px-2.5 py-1.5 text-foreground hover:bg-accent"
        >
          {title}
        </Link>
      ))}
    </div>
  );
}
