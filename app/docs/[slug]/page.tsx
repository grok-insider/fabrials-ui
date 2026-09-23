import { isValidElement } from "react";
import { WebMCPSetup } from "@/components/webmcp-setup";
import Link from "next/link";
import { readFile } from "node:fs/promises";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Callout } from "fumadocs-ui/components/callout";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { catalog, guides } from "@/lib/catalog";
import { uiCatalog, uiCatalogItem } from "@/lib/ui-catalog";
import { DocumentationShell } from "@/components/documentation-shell";
import {
  DocsPage,
  DocsTitle,
  DocsDescription,
  DocsBody,
} from "fumadocs-ui/layouts/docs/page";
import defaultMdxComponents from "fumadocs-ui/mdx";
import rehypeSlug from "rehype-slug";
import { getTableOfContents } from "fumadocs-core/content/toc";
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
  const contentToc = getTableOfContents(mdx);
  return (
    <DocumentationShell>
      <DocsPage
        id="main-content"
        toc={
          item
            ? [
                { title: "Preview", url: "#preview", depth: 2 },
                { title: "Installation", url: "#installation", depth: 2 },
                { title: "API", url: "#api", depth: 2 },
                {
                  title: "Behavior & compatibility",
                  url: "#behavior",
                  depth: 2,
                },
                { title: "Accessibility", url: "#accessibility", depth: 2 },
                ...contentToc,
              ]
            : contentToc
        }
      >
        <DocsTitle>{item?.title ?? guide?.title}</DocsTitle>
        {item && <DocsDescription>{item.description}</DocsDescription>}
        {item && (
          <>
            {slug === "server-connector" ? (
              <Callout title="Node server adapter">
                Install it on your backend and provide authentication,
                destination configuration and credential storage. See the{" "}
                <Link href="/docs/server">connector guide</Link>.
              </Callout>
            ) : (
              <section
                id="preview"
                aria-label="Component preview"
                className="scroll-mt-28"
              >
                <ComponentPreview
                  slug={slug}
                  code={uiItem ? usage : source}
                  codeLabel={uiItem ? "Usage" : "Source code"}
                />
              </section>
            )}
            {slug === "comparison" && (
              <Callout title="Any set of options">
                Columns, rows and optional highlights are controlled by your
                app. Product recommendations, cart state and tool registration
                belong to the example.{" "}
                <Link href="/playground#comparison">Explore the shopping example</Link>
              </Callout>
            )}
            <h2
              id="installation"
              className="scroll-mt-28 mt-10 mb-4 text-xl font-medium tracking-tight"
            >
              Installation
            </h2>
            {uiItem ? (
              <Steps>
                <Step>
                  <p>
                    Import the control from <code>@fabrials/ui</code>. Fabrials
                    products consume a vendored copy. This page is not a
                    registry install.
                  </p>
                  <CodeBlock code={usage} label="TypeScript" />
                </Step>
              </Steps>
            ) : (
              <Steps>
                <Step>
                  <p>Add the registry entry to your app.</p>
                  <CodeBlock
                    variant="command"
                    code={`bunx shadcn@latest add https://ui.fabrials.com/r/${slug}.json`}
                    label="Terminal"
                  />
                </Step>
              </Steps>
            )}
            <h2
              id="api"
              className="scroll-mt-28 mt-10 mb-4 text-xl font-medium tracking-tight"
            >
              API
            </h2>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="p-3 font-medium">Prop / export</th>
                    <th className="p-3 font-medium">Type</th>
                    <th className="p-3 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {item.props.map(([name, type, description]) => (
                    <tr key={name} className="border-t">
                      <td className="p-3 font-mono">{name}</td>
                      <td className="p-3 font-mono text-muted-foreground">
                        {type}
                      </td>
                      <td className="p-3 leading-6 text-muted-foreground">
                        {description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h2
              id="behavior"
              className="scroll-mt-28 mt-10 mb-4 text-xl font-medium tracking-tight"
            >
              Behavior & compatibility
            </h2>
            <Callout title="Behavior">{item.note}</Callout>
            <h2
              id="accessibility"
              className="scroll-mt-28 mt-8 mb-3 text-xl font-medium tracking-tight"
            >
              Accessibility
            </h2>
            <Callout type="info" title="Keyboard and contrast">
              Keep visible labels, keyboard focus and status announcements when
              customizing. These components inherit your theme; maintain
              sufficient contrast in both color modes. The preview is keyboard
              operable.
            </Callout>
          </>
        )}
        {mdx && (
          <DocsBody>
            <MDXRemote
              source={mdx}
              options={{ mdxOptions: { rehypePlugins: [rehypeSlug] } }}
              components={{
                ...defaultMdxComponents,
                WebMCPSetup,
                pre: ({ children }) => {
                  if (
                    isValidElement<{ children: string; className?: string }>(
                      children,
                    ) &&
                    typeof children.props.children === "string"
                  ) {
                    return (
                      <div className="not-prose my-6">
                        <CodeBlock
                          code={children.props.children.trimEnd()}
                          label={
                            children.props.className
                              ?.replace("language-", "")
                              .toUpperCase() || "Code"
                          }
                        />
                      </div>
                    );
                  }
                  return <pre tabIndex={0}>{children}</pre>;
                },
              }}
            />
          </DocsBody>
        )}
      </DocsPage>
    </DocumentationShell>
  );
}
