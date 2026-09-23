import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Code2,
  MousePointer2,
  Terminal,
} from "lucide-react";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  SectionHeader,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@fabrials/ui";
import { buttonVariants } from "@fabrials/ui/button-variants";
import { CodeBlock } from "@/components/code-block";
import { LandingDemo } from "@/components/landing-demo";
import { LandingTour } from "@/components/landing-tour";
import { catalog } from "@/lib/catalog";
import { uiCatalog } from "@/lib/ui-catalog";

const workflows = [
  {
    id: "travel",
    label: "Travel planning",
    title: "A quiet stay, within budget.",
    detail: "Compare options and build a shortlist.",
  },
  {
    id: "support",
    label: "Customer support",
    title: "A clearer queue. A human decision.",
    detail: "Filter tickets and review each resolution.",
  },
  {
    id: "onboarding",
    label: "Workspace setup",
    title: "From blank form to ready to go.",
    detail: "Validate details across a guided flow.",
  },
];
const collection = [
  {
    title: "Agent-ready interactions",
    icon: MousePointer2,
    text: "Forms, filters, tables and multi-step flows. Familiar to people. Explicit to agents.",
    href: "/docs/webmcp-form",
    label: "Explore WebMCP",
  },
  {
    title: "A window into your tools",
    icon: Terminal,
    text: "Discover tools, inspect results, and follow execution. Bring your own MCP server.",
    href: "/docs/mcp-dashboard",
    label: "Explore MCP components",
  },
  {
    title: "Your code, your decisions",
    icon: Code2,
    text: "Copy what you need. Adapt every detail. No opaque runtime or hosted dependency.",
    href: "/docs/installation",
    label: "Install from the registry",
  },
];

export default function Home() {
  return (
    <main
      id="main-content"
      className="w-full px-5 sm:px-8 lg:px-12 2xl:px-16 [&_.fui-section-header]:mb-8 [&_.fui-section-header_h2]:text-3xl [&_.fui-section-header_h2]:font-medium [&_.fui-section-header_h2]:tracking-tight"
    >
      <section className="grid gap-10 pt-16 pb-14 lg:grid-cols-[1.25fr_1fr] lg:items-end lg:pt-24">
        <div>
          <Link href="/docs/compatibility" className="mb-7 inline-flex">
            <Badge tone="success">
              WebMCP + MCP 2026-07-28
              <ArrowUpRight aria-hidden className="size-3" />
            </Badge>
          </Link>
          <h1 className="text-[clamp(2.7rem,5.5vw,4.8rem)] leading-[1.07] font-medium tracking-[-.055em]">
            Built for people.
            <br />
            <span className="text-muted-foreground">Ready for agents.</span>
          </h1>
          <p className="mt-7 max-w-md text-base leading-7 text-muted-foreground">
            Components for a web we use together. Accessible interfaces,
            structured tools, and shared state. Built on shadcn. Yours to shape.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/docs/installation"
              className={buttonVariants({ size: "lg" })}
            >
              Start building <ArrowRight />
            </Link>
            <a
              href="#try-it"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Try the live demo
            </a>
            <Link
              href="/playground"
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              Open playground
            </Link>
          </div>
        </div>
        <Card>
          <CardHeader>
            <p className="fui-eyebrow">From interface to capability</p>
            <CardTitle className="text-xl leading-8 font-medium tracking-tight">
              The comparison. The selection. The reason behind the
              recommendation.
            </CardTitle>
            <CardDescription>
              Give agents useful actions in the interface your users already
              understand.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock
              variant="command"
              code="bunx shadcn@latest add https://ui.fabrials.com/r/webmcp-provider.json"
            />
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            <Badge>{catalog.length} WebMCP & MCP blocks</Badge>
            <Badge>{uiCatalog.length} shared controls</Badge>
            <span>MIT licensed</span>
          </CardFooter>
        </Card>
      </section>

      <section id="try-it" className="scroll-mt-24 pb-16">
        <SectionHeader
          title="Watch an agent use the interface you use."
          description="Every step is a real WebMCP tool call against this page's state. Run the built-in agent, take over at any moment, or connect your browser's own agent. You make the final decision."
          actions={
            <Link
              href="/docs/comparison"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Build this interaction <ArrowUpRight />
            </Link>
          }
        />
        <Tabs defaultValue="live">
          <TabsList aria-label="Demo format">
            <TabsTrigger value="live">Live demo</TabsTrigger>
            <TabsTrigger value="tour">Narrated tour · 53 s</TabsTrigger>
          </TabsList>
          <TabsContent value="live" keepMounted>
            <LandingDemo />
          </TabsContent>
          <TabsContent value="tour">
            <LandingTour />
          </TabsContent>
        </Tabs>
      </section>

      <section className="border-t py-14">
        <SectionHeader
          title="More ways to put agents to work."
          description="Different tasks. Shared building blocks."
          actions={
            <Link
              href="/playground"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Explore the playground <ArrowRight />
            </Link>
          }
        />
        <div className="grid gap-4 md:grid-cols-3">
          {workflows.map((w, i) => (
            <Link
              key={w.id}
              href={`/playground#${w.id}`}
              className="group rounded-(--fui-radius-lg) focus-visible:outline-2 focus-visible:outline-offset-3"
            >
              <Card className="flex h-full min-h-56 flex-col justify-between transition-colors group-hover:bg-muted/40">
                <span className="flex justify-between font-mono text-xs text-muted-foreground">
                  0{i + 1} / {w.label}
                  <ArrowUpRight aria-hidden className="size-4" />
                </span>
                <div className="mt-8">
                  <CardTitle as="h3" className="text-2xl font-medium">
                    {w.title}
                  </CardTitle>
                  <CardDescription className="mt-2">{w.detail}</CardDescription>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t py-14">
        <SectionHeader
          title="Small pieces. Real possibilities."
          description="The collection."
          actions={
            <Link
              href="/components"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Browse {catalog.length + uiCatalog.length} components{" "}
              <ArrowRight />
            </Link>
          }
        />
        <div className="grid gap-4 md:grid-cols-3">
          {collection.map((card) => (
            <Card key={card.title} className="flex flex-col">
              <card.icon aria-hidden className="size-5 text-muted-foreground" />
              <CardTitle as="h3" className="mt-6">
                {card.title}
              </CardTitle>
              <CardDescription className="mt-2 flex-1">
                {card.text}
              </CardDescription>
              <Link
                href={card.href}
                className={buttonVariants({
                  variant: "link",
                  size: "sm",
                  className: "mt-5 self-start px-0",
                })}
              >
                {card.label} <ArrowUpRight />
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t py-12">
        <Card className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <CardTitle as="h2" className="text-lg font-medium">
              Start with a working example.
            </CardTitle>
            <CardDescription className="mt-1">
              A product comparison, a reservation flow, and a live MCP console.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/playground" className={buttonVariants()}>
              Open playground <ArrowRight />
            </Link>
            <Link
              href="/docs/installation"
              className={buttonVariants({ variant: "outline" })}
            >
              Read the installation guide
            </Link>
          </div>
        </Card>
      </section>
    </main>
  );
}
