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
export const metadata = { title: "Playground" };
export default function Playground() {
  return (
    <main
      id="main-content"
      className="w-full space-y-10 px-6 py-12 lg:px-12 2xl:px-16"
    >
      <header>
        <h1 className="font-serif text-4xl font-medium tracking-tight">Playground</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
          Choose a scenario. Edit tool arguments and execute them against the
          live interface, then try a manual correction. Inspect every result and
          reset to experiment again.
        </p>
      </header>
      <PlaygroundGallery>
        <section id="comparison" className="scroll-mt-28">
          <div className="mb-5 flex items-center gap-4">
            <span className="font-mono text-xs text-muted-foreground">01</span>
            <h2 className="text-xl font-medium tracking-tight">
              From a recommendation to a selection
            </h2>
          </div>
          <p className="mb-4 max-w-2xl text-sm leading-7 text-muted-foreground">
            A shopping assistant helps find a machine that fits your space and
            accessories. Compare the evidence, change the selection and review
            it. This example owns the product rules and cart state.
          </p>
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
          <div className="mb-5 flex items-center gap-4">
            <span className="font-mono text-xs text-muted-foreground">02</span>
            <h2 className="text-xl font-medium tracking-tight">
              A project explorer
            </h2>
          </div>
          <p className="mb-4 text-sm leading-7 text-muted-foreground">
            People and tools update the same filters and selection. Try a manual
            search, then simulate a tool call.
          </p>
          <ComponentLinks
            slugs={[
              ["data-explorer", "Data explorer"],
              ["webmcp-provider", "WebMCP provider"],
            ]}
          />
          <div className="rounded-xl border bg-card p-5 sm:p-8">
            <PlaygroundSandbox>
              <ExplorerDemo playground />
            </PlaygroundSandbox>
          </div>
        </section>
        <section id="reservation" className="scroll-mt-28">
          <div className="mb-5 flex items-center gap-4">
            <span className="font-mono text-xs text-muted-foreground">03</span>
            <h2 className="text-xl font-medium tracking-tight">
              A reservation flow
            </h2>
          </div>
          <p className="mb-4 text-sm leading-7 text-muted-foreground">
            Choose dates and move through a multi-step flow. Validation and
            progress stay in the application.
          </p>
          <ComponentLinks
            slugs={[
              ["wizard", "Multi-step flow"],
              ["date-range", "Date range"],
            ]}
          />
          <div className="rounded-xl border bg-card p-5 sm:p-8">
            <PlaygroundSandbox>
              <BookingDemo playground />
            </PlaygroundSandbox>
          </div>
        </section>
        <section id="console" className="scroll-mt-28">
          <div className="mb-5 flex items-center gap-4">
            <span className="font-mono text-xs text-muted-foreground">04</span>
            <h2 className="text-xl font-medium tracking-tight">
              A real MCP connection
            </h2>
          </div>
          <p className="mb-5 text-sm text-muted-foreground">
            Connect to the included demo server, or enter your own CORS-enabled
            endpoint. The demo supports the current protocol and legacy clients.
          </p>
          <ComponentLinks
            slugs={[
              ["mcp-dashboard", "MCP dashboard"],
              ["connection-panel", "Connection panel"],
              ["tool-catalog", "Tool catalog"],
            ]}
          />
          <div className="rounded-xl border bg-card p-5 sm:p-8">
            <PlaygroundSandbox>
              <MCPDashboard defaultEndpoint="/api/demo/mcp" />
            </PlaygroundSandbox>
          </div>
        </section>
        <section id="travel" className="scroll-mt-24">
          <h2 className="text-2xl font-medium">05 / Plan a quieter weekend</h2>
          <p className="my-4 text-sm text-muted-foreground">
            Compare stays with your budget and preferences. An agent can
            highlight matches and build the same shortlist.
          </p>
          <ComponentLinks
            slugs={[
              ["comparison", "Comparison"],
              ["webmcp-provider", "WebMCP provider"],
            ]}
          />
          <div className="rounded-xl border bg-card p-5 sm:p-8">
            <PlaygroundSandbox>
              <TravelExample playground />
            </PlaygroundSandbox>
          </div>
        </section>
        <section id="support" className="scroll-mt-24">
          <h2 className="text-2xl font-medium">06 / Triage a support queue</h2>
          <p className="my-4 text-sm text-muted-foreground">
            Filter the inbox, inspect a ticket and review its resolution before
            applying the change.
          </p>
          <ComponentLinks
            slugs={[
              ["confirmation-dialog", "Confirmation"],
              ["webmcp-provider", "WebMCP provider"],
            ]}
          />
          <div className="rounded-xl border bg-card p-5 sm:p-8">
            <PlaygroundSandbox>
              <SupportExample playground />
            </PlaygroundSandbox>
          </div>
        </section>
        <section id="onboarding" className="scroll-mt-24">
          <h2 className="text-2xl font-medium">07 / Set up a workspace</h2>
          <p className="my-4 text-sm text-muted-foreground">
            A validated multi-step flow that an agent can prepare and a person
            can finish.
          </p>
          <ComponentLinks
            slugs={[
              ["wizard", "Multi-step flow"],
              ["webmcp-provider", "WebMCP provider"],
            ]}
          />
          <div className="rounded-xl border bg-card p-5 sm:p-8">
            <PlaygroundSandbox>
              <OnboardingExample playground />
            </PlaygroundSandbox>
          </div>
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
          className="rounded-md border px-2.5 py-1.5 hover:bg-muted"
        >
          {title} ↗
        </Link>
      ))}
    </div>
  );
}
