import { isValidElement, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";
import { readFile } from "node:fs/promises";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import { getTableOfContents } from "fumadocs-core/content/toc";
import { Info, Lightbulb } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  PageHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fabrials/ui";
import { WebMCPSetup } from "@/components/webmcp-setup";
import { catalog, guides } from "@/lib/catalog";
import { uiCatalog, uiCatalogItem } from "@/lib/ui-catalog";
import { docsPages } from "@/lib/docs-nav";
import { DocsShell } from "@/components/docs/docs-shell";
import { ComponentPreview } from "@/components/component-preview";
import { CodeBlock } from "@/components/code-block";

export function generateStaticParams() {
  return [...catalog, ...guides, ...uiCatalog].map((x) => ({ slug: x.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return {
    title:
      [...catalog, ...guides, ...uiCatalog].find((x) => x.slug === slug)?.title ??
      "Documentation",
  };
}

function Heading({
  level,
  id,
  children,
}: {
  level: 2 | 3;
  id?: string;
  children: ReactNode;
}) {
  const Tag = level === 2 ? "h2" : "h3";
  return (
    <Tag id={id} className="docs-heading">
      {id ? (
        <a href={`#${id}`} className="docs-heading-anchor">
          {children}
        </a>
      ) : (
        children
      )}
    </Tag>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="docs-section" aria-labelledby={id}>
      <Heading level={2} id={id}>
        {title}
      </Heading>
      {children}
    </section>
  );
}

function Note({
  title,
  children,
  icon = "info",
}: {
  title: string;
  children: ReactNode;
  icon?: "info" | "tip";
}) {
  const Icon = icon === "tip" ? Lightbulb : Info;
  return (
    <Alert className="docs-callout">
      <Icon aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

const mdxComponents = {
  WebMCPSetup,
  h2: ({ id, children }: ComponentProps<"h2">) => (
    <Heading level={2} id={id}>
      {children}
    </Heading>
  ),
  h3: ({ id, children }: ComponentProps<"h3">) => (
    <Heading level={3} id={id}>
      {children}
    </Heading>
  ),
  a: ({ href = "", children }: ComponentProps<"a">) =>
    href.startsWith("/") || href.startsWith("#") ? (
      <Link href={href}>{children}</Link>
    ) : (
      <a href={href} rel="noreferrer" target="_blank">
        {children}
      </a>
    ),
  table: ({ children }: ComponentProps<"table">) => (
    <div className="fui-table-scroll" role="region" aria-label="Reference table" tabIndex={0}>
      <table className="fui-table">{children}</table>
    </div>
  ),
  pre: ({ children }: ComponentProps<"pre">) => {
    if (
      isValidElement<{ children: string; className?: string }>(children) &&
      typeof children.props.children === "string"
    ) {
      return (
        <CodeBlock
          code={children.props.children.trimEnd()}
          label={children.props.className?.replace("language-", "").toUpperCase() || "Code"}
        />
      );
    }
    return <pre tabIndex={0}>{children}</pre>;
  },
};

export default async function Docs({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const registryItem = catalog.find((x) => x.slug === slug);
  const uiItem = uiCatalogItem(slug);
  const item = registryItem ?? uiItem;
  const guide = guides.find((x) => x.slug === slug);
  if (!item && !guide) notFound();
  let source = "";
  if (registryItem) source = await readFile(registryItem.files[0], "utf8");
  const usage = uiItem?.usage ?? "";
  const mdx = await readFile(`content/${slug}.mdx`, "utf8").catch(() => "");
  const contentToc = getTableOfContents(mdx).map(({ title, url, depth }) => ({
    title,
    url,
    depth,
  }));
  const page = docsPages.find((entry) => entry.href === `/docs/${slug}`);
  const toc = item
    ? [
        ...(slug === "server-connector" ? [] : [{ title: "Preview", url: "#preview", depth: 2 }]),
        { title: "Installation", url: "#installation", depth: 2 },
        { title: "API reference", url: "#api", depth: 2 },
        { title: "Behavior", url: "#behavior", depth: 2 },
        { title: "Accessibility", url: "#accessibility", depth: 2 },
        ...contentToc,
      ]
    : contentToc;

  return (
    <DocsShell
      toc={toc}
      header={
        <PageHeader
          eyebrow={page ? `${page.section} / ${page.group}` : "Documentation"}
          title={item?.title ?? guide?.title}
          description={item?.description ?? page?.description}
          actions={
            item && (
              <Badge>{uiItem ? uiItem.package : "Registry"}</Badge>
            )
          }
        />
      }
    >
      {item && (
        <>
          {slug === "server-connector" ? (
            <Note title="Node server adapter">
              Install it on your backend and provide authentication, destination configuration and
              credential storage. See the <Link href="/docs/server">connector guide</Link>.
            </Note>
          ) : (
            <section id="preview" aria-label="Component preview" className="docs-section docs-section-first">
              <ComponentPreview
                slug={slug}
                code={uiItem ? usage : source}
                codeLabel={uiItem ? "Usage" : "Source code"}
              />
            </section>
          )}
          {slug === "comparison" && (
            <Note title="Any set of options" icon="tip">
              Columns, rows and optional highlights are controlled by your app. Product
              recommendations, cart state and tool registration belong to the example.{" "}
              <Link href="/playground#comparison">Explore the shopping example</Link>
            </Note>
          )}
          <Section id="installation" title="Installation">
            {uiItem ? (
              <ol className="docs-steps">
                <li className="docs-step">
                  <p>
                    Import the control from <code>{uiItem.package}</code>. Fabrials products consume a
                    vendored copy. This page is not a registry install.
                  </p>
                  <CodeBlock code={usage} label="TypeScript" />
                </li>
              </ol>
            ) : (
              <ol className="docs-steps">
                <li className="docs-step">
                  <p>Add the registry entry to your app.</p>
                  <CodeBlock
                    variant="command"
                    code={`bunx shadcn@latest add https://ui.fabrials.com/r/${slug}.json`}
                    label="Terminal"
                  />
                </li>
              </ol>
            )}
          </Section>
          <Section id="api" title="API reference">
            <Table aria-label={`${item.title} API`} className="docs-props">
              <TableHeader>
                <TableRow>
                  <TableHead>Prop / export</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.props.map(([name, type, description]) => (
                  <TableRow key={name}>
                    <TableCell>
                      <code>{name}</code>
                    </TableCell>
                    <TableCell>
                      <code className="docs-type">{type}</code>
                    </TableCell>
                    <TableCell>{description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Section>
          <Section id="behavior" title="Behavior">
            <p>{item.note}</p>
          </Section>
          <Section id="accessibility" title="Accessibility">
            <Note title="Keyboard and contrast">
              Keep visible labels, keyboard focus and status announcements when customizing. These
              components inherit your theme; maintain sufficient contrast in both color modes. The
              preview is keyboard operable.
            </Note>
          </Section>
        </>
      )}
      {mdx && (
        <div className="docs-prose">
          <MDXRemote
            source={mdx}
            options={{ mdxOptions: { rehypePlugins: [rehypeSlug] } }}
            components={mdxComponents}
          />
        </div>
      )}
    </DocsShell>
  );
}
