import { isValidElement, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";
import { readFile } from "node:fs/promises";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { remarkCodeTitle } from "@/lib/remark-code-title";
import { getTableOfContents } from "fumadocs-core/content/toc";
import { Info, Lightbulb } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  DescriptionDetails,
  DescriptionItem,
  DescriptionList,
  DescriptionTerm,
  File,
  Files,
  Folder,
  PageHeader,
  RepoInfo,
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
import { InstalledFiles } from "@/components/installed-files";
import { repoStats } from "@/lib/github";
import { ExternalPreview } from "@/components/external-preview";
import { loadExternal, type ExternalItem } from "@/lib/external";
import { shimIndex } from "@/lib/shims-index.generated";
import { publishExternalItem } from "@/lib/upstreams";

const REGISTRY = "https://ui.fabrials.com/r";
const shimNames = new Set(shimIndex.map((shim) => shim.name));
const external = loadExternal();
const externalItems = external.flatMap((library) => library.items.filter((entry) => !entry.item.hidden));

export function generateStaticParams() {
  return [...catalog, ...guides, ...uiCatalog, ...externalItems].map((x) => ({ slug: x.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = externalItems.find((x) => x.slug === slug);
  return {
    title: entry
      ? `${entry.item.title} (${entry.library.title})`
      : [...catalog, ...guides, ...uiCatalog].find((x) => x.slug === slug)?.title ?? "Documentation",
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

function ShimTable() {
  return (
    <div className="fui-table-scroll" role="region" aria-label="Shims" tabIndex={0}>
      <table className="fui-table">
        <thead>
          <tr>
            <th>Primitive</th>
            <th>Install</th>
            <th>Exports</th>
          </tr>
        </thead>
        <tbody>
          {shimIndex.map((shim) => (
            <tr key={shim.name}>
              <td>
                <code>{shim.name}</code>
              </td>
              <td>
                <code>@fabrials/{shim.name}</code>
              </td>
              <td>{shim.exports.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const mdxComponents = {
  WebMCPSetup,
  Files,
  Folder,
  File,
  ShimTable,
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
      isValidElement<{ children: string; className?: string; "data-title"?: string }>(children) &&
      typeof children.props.children === "string"
    ) {
      const language = children.props.className?.replace("language-", "");
      const code = children.props.children.trimEnd();
      return (
        <CodeBlock
          code={code}
          language={language}
          variant={language && /^(bash|sh|shell)$/.test(language) ? "command" : "code"}
          label={children.props["data-title"] ?? language?.toUpperCase() ?? "Code"}
          title={children.props["data-title"]}
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
  const externalEntry = externalItems.find((x) => x.slug === slug);
  if (externalEntry) return <ExternalDocs entry={externalEntry} />;
  const registryItem = catalog.find((x) => x.slug === slug);
  const uiItem = uiCatalogItem(slug);
  const item = registryItem ?? uiItem;
  const guide = guides.find((x) => x.slug === slug);
  if (!item && !guide) notFound();
  let source = "";
  if (registryItem) source = await readFile(registryItem.files[0], "utf8");
  const usage = uiItem?.usage ?? "";
  const designDoc = slug === "design";
  const mdx = designDoc
    ? (await readFile("../../DESIGN.md", "utf8")).replace(/^# .*\n+/, "")
    : await readFile(`content/${slug}.mdx`, "utf8").catch(() => "");
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
                    Import the control from <code>{uiItem.package}</code>, after{" "}
                    <Link href="/docs/installation">setting the app up</Link>.
                  </p>
                  <CodeBlock code={usage} label="TypeScript" />
                </li>
                {shimNames.has(slug) && (
                  <li className="docs-step">
                    <p>
                      Or install it under shadcn&apos;s name, so code that imports{" "}
                      <code>@/components/ui/{slug}</code> gets this control. See{" "}
                      <Link href="/docs/shims">shims</Link>.
                    </p>
                    <CodeBlock variant="command" code={`npx shadcn@latest add @fabrials/${slug}`} label="Terminal" />
                  </li>
                )}
              </ol>
            ) : (
              <ol className="docs-steps">
                <li className="docs-step">
                  <p>Add the registry entry to your app.</p>
                  <CodeBlock variant="command" code={`npx shadcn@latest add @fabrials/${slug}`} label="Terminal" />
                  <p>
                    Without the <Link href="/docs/installation#add-the-registry">named registry</Link>, use the
                    address: <code>{`${REGISTRY}/${slug}.json`}</code>
                  </p>
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
            options={{ mdxOptions: { remarkPlugins: [remarkGfm, remarkCodeTitle], rehypePlugins: [rehypeSlug], format: designDoc ? "md" : "mdx" } }}
            components={mdxComponents}
          />
        </div>
      )}
    </DocsShell>
  );
}

/** Where shadcn writes a registry file in a default Next.js app: its target, or the folder for its type. */
function installedPath(file: { path: string; target?: string | null; type: string }) {
  if (file.target) return file.target;
  const name = file.path.split("/").pop()!;
  const folder = { "registry:lib": "lib", "registry:hook": "hooks", "registry:ui": "components/ui" }[file.type] ?? "components";
  return `${folder}/${name}`;
}

const CHECK_TITLES: Record<string, string> = {
  "literal-colours": "Literal colours",
  "continuous-motion": "Continuous motion",
  "ignores-reduced-motion": "Reduced motion",
  gradients: "Gradients",
  glow: "Glow",
  "overrides-theme": "Theme tokens",
};

async function ExternalDocs({ entry }: { entry: ExternalItem }) {
  const { library, item, raw, slug } = entry;
  const parent = external.find((x) => x.snapshot.name === library.name)!;
  const published = publishExternalItem(raw, item, library, parent.licenseText, {
    origin: "https://ui.fabrials.com",
    shims: shimNames,
  });
  const files = published.files.map((file) => ({ path: installedPath(file), code: file.content }));
  const shims = published.registryDependencies
    .filter((dep) => dep.startsWith("https://ui.fabrials.com/r/"))
    .map((dep) => ({ path: `components/ui/${dep.slice("https://ui.fabrials.com/r/".length, -".json".length)}.tsx`, note: "Fabrials shim" }));
  const [owner, repo] = library.repository.split("/") as [string, string];
  const stats = await repoStats(library.repository);
  const upstreamUrl = library.registry.replace("{name}", item.name);
  const toc = [
    { title: "Preview", url: "#preview", depth: 2 },
    { title: "Installation", url: "#installation", depth: 2 },
    { title: "Origin and license", url: "#origin", depth: 2 },
    { title: "Design notes", url: "#design-notes", depth: 2 },
  ];
  return (
    <DocsShell
      toc={toc}
      header={
        <PageHeader
          eyebrow={`From ${library.title}`}
          title={item.title}
          description={item.description}
          actions={
            <>
              <Badge variant="outline">{library.license.spdx}</Badge>
              <Badge tone={library.tier === "fabrials" ? "success" : "neutral"}>
                {library.tier === "fabrials" ? "Fabrials tier" : "Community tier"}
              </Badge>
            </>
          }
        />
      }
    >
      <section id="preview" aria-label="Component preview" className="docs-section docs-section-first">
        <ExternalPreview
          slug={slug}
          files={files}
          credit={
            item.demo
              ? `Demo from ${library.title}, shown with the Fabrials theme.`
              : `${library.title} publishes no demo; Fabrials wrote this one with synthetic data.`
          }
        />
      </section>
      <Section id="installation" title="Installation">
        <ol className="docs-steps">
          <li className="docs-step">
            <p>Add it by name, once the app knows the Fabrials registry.</p>
            <CodeBlock variant="command" code={`npx shadcn@latest add @fabrials/${slug}`} label="Terminal" />
            <p>
              Or by address: <code>{`${REGISTRY}/${slug}.json`}</code>
            </p>
          </li>
          <li className="docs-step">
            <p>
              shadcn copies the source into your app and installs what it needs.
              {shims.length > 0 &&
                " Its shadcn primitives come from Fabrials shims, so buttons and panels match the rest of the app."}
            </p>
            <InstalledFiles files={[...files.map((file) => ({ path: file.path, note: "new" })), ...shims]} />
            {published.dependencies.length > 0 && (
              <ul className="docs-deps" aria-label="npm dependencies">
                {item.dependencies.map((dep) => (
                  <li key={dep.name}>
                    <Badge variant="outline">
                      {dep.name} {dep.license}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </li>
        </ol>
      </Section>
      <Section id="origin" title="Origin and license">
        <p>
          ui.fabrials.com republishes this component unchanged, with {library.title}&apos;s license at the top of every
          file. The copy was taken on {library.fetchedAt} and passed the{" "}
          <Link href="/libraries#policy">license gate</Link>.
        </p>
        <RepoInfo owner={owner} repo={repo} stars={stats.stars} forks={stats.forks} description={library.title} className="docs-repo" />
        <DescriptionList>
          <DescriptionItem>
            <DescriptionTerm>Library</DescriptionTerm>
            <DescriptionDetails>
              <a href={library.homepage}>{library.title}</a>
            </DescriptionDetails>
          </DescriptionItem>
          <DescriptionItem>
            <DescriptionTerm>License</DescriptionTerm>
            <DescriptionDetails>
              {library.license.spdx}, {library.license.copyright}
            </DescriptionDetails>
          </DescriptionItem>
          <DescriptionItem>
            <DescriptionTerm>Upstream entry</DescriptionTerm>
            <DescriptionDetails>
              <a href={upstreamUrl}>{upstreamUrl}</a>
            </DescriptionDetails>
          </DescriptionItem>
          <DescriptionItem>
            <DescriptionTerm>Source at</DescriptionTerm>
            <DescriptionDetails>
              <a href={`https://github.com/${library.repository}/tree/${library.commit}`}>
                {library.repository}@{library.commit.slice(0, 7)}
              </a>
            </DescriptionDetails>
          </DescriptionItem>
          <DescriptionItem>
            <DescriptionTerm>Snapshot</DescriptionTerm>
            <DescriptionDetails>
              <code>sha256 {item.sha256.slice(0, 16)}…</code>
            </DescriptionDetails>
          </DescriptionItem>
        </DescriptionList>
      </Section>
      <Section id="design-notes" title="Design notes">
        {item.conformance.length ? (
          <>
            <p>
              Where this component departs from the <Link href="/docs/design">Fabrials design principles</Link>. It
              still works; decide whether it fits your product.
            </p>
            <ul className="docs-findings">
              {item.conformance.map((finding) => (
                <li key={finding.check}>
                  <strong>{CHECK_TITLES[finding.check] ?? finding.check}</strong>
                  <span>{finding.message}</span>
                  <code>{finding.evidence}</code>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>
            A static reading found nothing against the <Link href="/docs/design">design principles</Link>: theme tokens
            only, no continuous motion, gradients or glow.
          </p>
        )}
      </Section>
    </DocsShell>
  );
}
