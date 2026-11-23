import Link from "next/link";
import { Badge, DitherScene, GridGuides, RADIANT_ORDERS, StatusDot } from "@fabrials/ui";
import { buttonVariants } from "@fabrials/ui/button-variants";
import { CodeBlock } from "@/components/code-block";
import { HomeDemo } from "@/components/demo/home-demo";
import { HeroInstrument } from "@/components/landing/hero-instrument";
import { OrdersShowcase } from "@/components/landing/orders-showcase";
import { catalog } from "@/lib/catalog";
import { shimIndex } from "@/lib/shims-index.generated";
import { uiCatalog } from "@/lib/ui-catalog";
import uiPackage from "../../../packages/ui/package.json";

const totalComponents = uiCatalog.length + catalog.length;
const aiComponentCount = uiCatalog.filter((item) => item.group === "AI").length;
const coreComponentCount = uiCatalog.length - aiComponentCount;

const pillars = [
  {
    count: coreComponentCount,
    title: "Core interface",
    pkg: "@fabrials/ui",
    text: "Controls, overlays, data tables, virtualized lists, spreadsheets, ruler meters, loading skeletons and workspace shells built on Base UI. Ships plain CSS layers with zero Tailwind lock-in.",
    tags: ["Base UI", "OKLCH tokens", "RTL & forced colors", "IBM Plex"],
    href: "/components",
    label: "Browse core components",
  },
  {
    count: aiComponentCount,
    title: "Agent & chat runtime",
    pkg: "@fabrials/ai-ui",
    text: "Streaming conversations, tool-call inspectors, working-light indicators, citations, source tallies, attachments and provider telemetry designed for interfaces where people work beside agents.",
    tags: ["WorkingLight", "ToolCall", "Conversation", "SourceTally"],
    href: "/docs/chat-message",
    label: "Explore AI components",
  },
  {
    count: shimIndex.length,
    title: "Drop-in shadcn shims",
    pkg: "npx shadcn@latest add @fabrials/…",
    text: "Generated shims back shadcn's primitive names with Fabrials controls, so existing code adopts the Deep Stormwall palette, material bevels and keyboard accessibility without rewriting imports.",
    tags: ["registry:ui", "Source owned", "Zero drift"],
    href: "/docs/shims",
    label: "How shims work",
  },
  {
    count: catalog.length,
    title: "Shared human + agent blocks",
    pkg: "WebMCP & MCP 2026-07-28",
    text: "Composable comparison tables, schema-driven argument forms, execution logs and human-approval dialogs that both visitors and browser agents operate through the same live state.",
    tags: ["WebMCP", "Human review", "ExecutionLog"],
    href: "/docs/comparison",
    label: "Inspect agent blocks",
  },
] as const;

export default function Home() {
  return (
    <main id="main-content" className="landing-main">
      <section className="landing-hero" aria-labelledby="home-title">
        <GridGuides />
        <DitherScene className="landing-hero-storm" />
        <div className="landing-hero-grid">
          <div className="landing-hero-copy">
            <div className="landing-hero-meta">
              <StatusDot tone="info" label={`@fabrials/ui ${uiPackage.version}`} />
              <span aria-hidden="true">·</span>
              <span>React 19 · Base UI · MIT</span>
            </div>

            <h1 id="home-title" className="landing-hero-title">
              Calibrated interfaces for products and agents.
            </h1>

            <p className="landing-hero-lead">
              The Fabrials design system and shadcn registry. Two focused packages for dense operational software,
              streaming AI workflows and shared WebMCP blocks — accessible by default and installable as source you
              own.
            </p>

            <div className="landing-hero-install">
              <CodeBlock
                variant="command"
                code="npx shadcn@latest init https://ui.fabrials.com/r/init.json"
                label="Initialize project"
              />
            </div>

            <div className="landing-hero-actions">
              <Link href="/docs/installation" className={buttonVariants({ size: "lg" })}>
                Set up your app
              </Link>
              <Link href="/components" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Browse components
              </Link>
              <Link href="/playground" className={buttonVariants({ variant: "ghost", size: "lg" })}>
                Open playground
              </Link>
            </div>

            <dl className="landing-hero-metrics" aria-label="System inventory">
              <div>
                <dt>Components</dt>
                <dd>{totalComponents}</dd>
              </div>
              <div>
                <dt>shadcn shims</dt>
                <dd>{shimIndex.length}</dd>
              </div>
              <div>
                <dt>Packages</dt>
                <dd>2</dd>
              </div>
              <div>
                <dt>Radiant orders</dt>
                <dd>{RADIANT_ORDERS.length}</dd>
              </div>
            </dl>
          </div>

          <HeroInstrument />
        </div>
      </section>

      <section className="landing-section" aria-labelledby="architecture-title">
        <div className="landing-section-head">
          <div className="landing-section-title-group">
            <p className="landing-label-voice">System architecture · Owned source or npm packages</p>
            <h2 id="architecture-title" className="landing-section-title">
              One coherent kit from form controls to live agent runs.
            </h2>
            <p className="landing-section-lead">
              Install individual blocks through the shadcn CLI or depend directly on the packages. Every surface shares
              the same OKLCH tokens, keyboard semantics and motion grammar.
            </p>
          </div>
          <Link href="/docs/design" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Read design principles
          </Link>
        </div>

        <ul className="landing-pillars">
          {pillars.map((pillar) => (
            <li key={pillar.title} className="landing-pillar">
              <span className="landing-pillar-count">{pillar.count}</span>
              <div className="landing-pillar-name">
                <h3>{pillar.title}</h3>
                <code>{pillar.pkg}</code>
              </div>
              <div className="landing-pillar-desc">
                <p>{pillar.text}</p>
                <div className="landing-pillar-tags">
                  {pillar.tags.map((tag) => (
                    <Badge key={tag} size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <Link href={pillar.href} className="landing-pillar-link">
                {pillar.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section id="orders" className="landing-section scroll-mt-20" aria-labelledby="orders-title">
        <div className="landing-section-head">
          <div className="landing-section-title-group">
            <p className="landing-label-voice">Brand identity · The Ten Polestones &amp; Knights Radiant glyphs</p>
            <h2 id="orders-title" className="landing-section-title">
              Ten canonical orders, one disciplined mark system.
            </h2>
            <p className="landing-section-lead">
              Every Fabrials product signs its mark with a polestone while keeping Stormlight as the sole interaction
              colour. Select an order to inspect its bilaterally symmetrical glyph at icon and plate scale.
            </p>
          </div>
          <Link href="/docs/radiant-glyph" className={buttonVariants({ variant: "outline", size: "sm" })}>
            RadiantGlyph docs
          </Link>
        </div>
        <OrdersShowcase />
      </section>

      <section id="try-it" className="landing-section scroll-mt-20" aria-labelledby="try-title">
        <div className="landing-section-head">
          <div className="landing-section-title-group">
            <p className="landing-label-voice">Shared WebMCP reference · Human + agent interface</p>
            <h2 id="try-title" className="landing-section-title">
              Watch an agent use the interface you use.
            </h2>
            <p className="landing-section-lead">
              Follow the narrated walkthrough or switch to Try it yourself: the page registers live WebMCP tools for
              your browser&apos;s agent, and you can invoke every tool directly. People keep the final approval.
            </p>
          </div>
          <Link href="/docs/comparison" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Build this interaction
          </Link>
        </div>
        <HomeDemo />
      </section>

      <section className="landing-section" aria-labelledby="start-title">
        <div className="landing-close">
          <div className="grid gap-2">
            <p className="landing-label-voice">Ready for production</p>
            <h2 id="start-title" className="landing-section-title">
              Start with the registry or explore every component live.
            </h2>
            <p className="m-0 text-sm leading-relaxed text-muted-foreground">
              Every component ships with accessible keyboard paths, light and dark themes, right-to-left support and
              first-load skeleton states.
            </p>
          </div>
          <div className="landing-close-actions">
            <Link href="/docs/installation" className={buttonVariants({ size: "lg" })}>
              Installation guide
            </Link>
            <Link href="/components" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Component catalogue
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
