import Link from "next/link";
import {
  DitherScene,
  SectionHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
import { externalIndex } from "@/lib/external-index.generated";
import { shimIndex } from "@/lib/shims-index.generated";
import { uiCatalog } from "@/lib/ui-catalog";

const externalCount = externalIndex.reduce((sum, library) => sum + library.items.length, 0);

const kinds = [
  {
    count: uiCatalog.length + catalog.length,
    title: "Fabrials components",
    text: "The controls, patterns and chat pieces Fabrials products are built with, plus WebMCP and MCP blocks for interfaces people and agents share.",
    href: "/components",
    label: "Browse components",
  },
  {
    count: shimIndex.length,
    title: "Shims",
    text: "shadcn's button, dialog, select and more, backed by the Fabrials controls. Code written for shadcn keeps working and matches the app.",
    href: "/docs/shims",
    label: "How shims work",
  },
  {
    count: externalCount,
    title: "From other libraries",
    text: `Components from ${externalIndex.map((library) => library.title).join(" and ")}, copied at a reviewed snapshot with their license checked and credited.`,
    href: "/libraries",
    label: "See the libraries",
  },
];

export default function Home() {
  return (
    <main id="main-content" className="w-full px-(--fui-page-padding)">
      <section className="home-hero relative -mx-(--fui-page-padding) px-(--fui-page-padding) pt-16 pb-24 lg:pt-24" aria-labelledby="home-title">
        <DitherScene className="home-storm" />
        <div className="relative z-10 max-w-[38rem]">
          <h1
            id="home-title"
            className="font-display text-[clamp(2.5rem,6vw,4.75rem)] leading-[0.98] font-semibold tracking-[-0.015em] text-balance"
          >
            The Fabrials design system, ready to install.
          </h1>
          <p className="mt-6 max-w-[46ch] text-lg leading-7 text-muted-foreground">
            Fabrials components, shims that give shadcn primitives the Fabrials look, and open-source components from
            other libraries with their license checked. One command sets an app up.
          </p>
          <div className="mt-8 max-w-[34rem]">
            <CodeBlock variant="command" code="npx shadcn@latest init https://ui.fabrials.com/r/init.json" label="Terminal" />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/docs/installation" className={buttonVariants({ size: "lg" })}>
              Set an app up
            </Link>
            <Link href="/components" className="text-sm text-foreground underline underline-offset-4">
              Browse components
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t py-14" aria-labelledby="kinds-title">
        <h2 id="kinds-title" className="font-display text-[1.75rem] leading-tight font-semibold">
          What you can install
        </h2>
        <p className="mt-2 max-w-[58ch] text-muted-foreground">
          Every entry installs as source you own, through the shadcn CLI.
        </p>
        <ul className="mt-8 border-t">
          {kinds.map((kind) => (
            <li
              key={kind.title}
              className="grid grid-cols-[4rem_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1 border-b py-5 md:grid-cols-[5rem_minmax(0,3fr)_minmax(0,6fr)_minmax(0,2fr)] md:gap-x-6"
            >
              <span className="font-display text-3xl font-semibold tabular-nums">{kind.count}</span>
              <h3 className="font-display text-[1.375rem] leading-tight font-semibold">{kind.title}</h3>
              <p className="col-start-2 text-muted-foreground md:col-start-auto">{kind.text}</p>
              <Link href={kind.href} className="col-start-2 text-sm text-brand-ink underline underline-offset-4 md:col-start-auto md:justify-self-end">
                {kind.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section id="try-it" className="scroll-mt-24 border-t py-14">
        <SectionHeader
          title="Watch an agent use the interface you use."
          description="Every step is a real WebMCP tool call against this page's state. Run the built-in agent, take over at any moment, or connect your browser's own agent. You make the final decision."
          actions={
            <Link href="/docs/comparison" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Build this interaction
            </Link>
          }
        />
        <Tabs defaultValue="live">
          <TabsList aria-label="Demo format">
            <TabsTrigger value="live">Live demo</TabsTrigger>
            <TabsTrigger value="tour">Narrated tour, 53 s</TabsTrigger>
          </TabsList>
          <TabsContent value="live" keepMounted>
            <LandingDemo />
          </TabsContent>
          <TabsContent value="tour">
            <LandingTour />
          </TabsContent>
        </Tabs>
      </section>

      <section className="border-t py-14" aria-labelledby="libraries-title">
        <SectionHeader
          title={<span id="libraries-title">Components from other libraries</span>}
          description="Published unchanged with their license at the top of every file. Each page says where the component departs from the Fabrials principles."
          actions={
            <Link href="/libraries" className={buttonVariants({ variant: "outline", size: "sm" })}>
              How a library gets in
            </Link>
          }
        />
        <Table aria-label="Libraries">
          <TableHeader>
            <TableRow>
              <TableHead>Library</TableHead>
              <TableHead>License</TableHead>
              <TableHead>Components</TableHead>
              <TableHead>Snapshot</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {externalIndex.map((library) => (
              <TableRow key={library.name}>
                <TableCell>
                  <Link href={`/libraries#${library.name}`}>{library.title}</Link>
                </TableCell>
                <TableCell>{library.license}</TableCell>
                <TableCell>{library.items.map((item) => item.title).join(", ")}</TableCell>
                <TableCell className="tabular-nums">{library.fetchedAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="border-t py-12" aria-labelledby="start-title">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <h2 id="start-title" className="font-display text-xl font-semibold">
              Start with a working example.
            </h2>
            <p className="mt-1 text-muted-foreground">A product comparison, a reservation flow and a live MCP console.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/playground" className={buttonVariants()}>
              Open the playground
            </Link>
            <Link href="/docs/design" className={buttonVariants({ variant: "outline" })}>
              Read the design principles
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
