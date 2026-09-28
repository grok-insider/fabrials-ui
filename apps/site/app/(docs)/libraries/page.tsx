import Link from "next/link";
import {
  Badge,
  DescriptionDetails,
  DescriptionItem,
  DescriptionList,
  DescriptionTerm,
  PageHeader,
  RepoInfo,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fabrials/ui";
import { DocsShell } from "@/components/docs/docs-shell";
import { loadExternal } from "@/lib/external";
import { ALLOWED_LICENSES } from "@/lib/license";
import { repoStats } from "@/lib/github";

export const metadata = {
  title: "Libraries",
  description: "Components from other open-source libraries, and the rules they pass to be published here.",
};

export default async function Libraries() {
  const libraries = loadExternal();
  const stats = await Promise.all(libraries.map(({ snapshot }) => repoStats(snapshot.repository)));
  const toc = [
    { title: "How a library gets in", url: "#policy", depth: 2 },
    { title: "Tiers", url: "#tiers", depth: 2 },
    ...libraries.map(({ snapshot }) => ({ title: snapshot.title, url: `#${snapshot.name}`, depth: 2 })),
    { title: "Suggest a library", url: "#suggest", depth: 2 },
  ];
  return (
    <DocsShell
      toc={toc}
      header={
        <PageHeader
          eyebrow="The registry"
          title="Libraries"
          description="Fabrials UI also publishes components from other open-source libraries, so one registry covers more of an app. Each one is copied at a reviewed snapshot and keeps its license and its origin."
        />
      }
    >
      <section className="docs-section docs-section-first" aria-labelledby="policy">
        <h2 id="policy" className="docs-heading">
          <a href="#policy" className="docs-heading-anchor">
            How a library gets in
          </a>
        </h2>
        <ol className="docs-steps">
          <li className="docs-step">
            <p>
              <strong>A permissive license.</strong> The library&apos;s license file, read at the exact commit being
              copied, must be one of {ALLOWED_LICENSES.join(", ")}. So must every npm package a component imports,
              including the ones its registry entry forgot to declare. Copyleft licenses, &ldquo;MIT with a clause&rdquo;
              and anything that cannot be classified are refused: in doubt, the gate closes.
            </p>
          </li>
          <li className="docs-step">
            <p>
              <strong>A reviewed snapshot.</strong> The sync stores the registry entry byte for byte with its sha256.
              The build checks those hashes, the license and the dependency list again before publishing, so nothing
              changes without a new review.
            </p>
          </li>
          <li className="docs-step">
            <p>
              <strong>It compiles against the shims.</strong> A component&apos;s shadcn primitives are served by{" "}
              <Link href="/docs/shims">Fabrials shims</Link>, and this site builds every published component against
              them. One that only works with Radix primitives stays out.
            </p>
          </li>
          <li className="docs-step">
            <p>
              <strong>Unchanged, with credit.</strong> Files are republished as the library wrote them, with its
              license text at the top of each one. Missing registry dependencies are filled in from the imports so the
              install works.
            </p>
          </li>
        </ol>
      </section>

      <section className="docs-section" aria-labelledby="tiers">
        <h2 id="tiers" className="docs-heading">
          <a href="#tiers" className="docs-heading-anchor">
            Tiers
          </a>
        </h2>
        <p>
          <strong>Community</strong> components are published as the library designed them, themed by your tokens. Each
          page lists its design notes: where it uses literal colours, continuous motion, gradients or glow, which the{" "}
          <Link href="/docs/design">Fabrials principles</Link> avoid. Use them in prototypes and products that choose
          that look.
        </p>
        <p>
          <strong>Fabrials</strong> components have no design notes. A community component is promoted by adapting it
          to the principles and moving it into the Fabrials packages, with a story, a keyboard test and a visual
          reference. Fabrials products use Fabrials-tier components only.
        </p>
      </section>

      {libraries.map(({ snapshot, items }, index) => (
        <section key={snapshot.name} className="docs-section" aria-labelledby={snapshot.name}>
          <h2 id={snapshot.name} className="docs-heading">
            <a href={`#${snapshot.name}`} className="docs-heading-anchor">
              {snapshot.title}
            </a>
          </h2>
          <p>{snapshot.description}</p>
          <RepoInfo
            owner={snapshot.repository.split("/")[0]!}
            repo={snapshot.repository.split("/")[1]!}
            stars={stats[index]!.stars}
            forks={stats[index]!.forks}
            className="docs-repo"
          />
          <DescriptionList>
            <DescriptionItem>
              <DescriptionTerm>License</DescriptionTerm>
              <DescriptionDetails>
                {snapshot.license.spdx}, {snapshot.license.copyright}
              </DescriptionDetails>
            </DescriptionItem>
            <DescriptionItem>
              <DescriptionTerm>Source</DescriptionTerm>
              <DescriptionDetails>
                <a href={`https://github.com/${snapshot.repository}/tree/${snapshot.commit}`}>
                  {snapshot.repository}@{snapshot.commit.slice(0, 7)}
                </a>
              </DescriptionDetails>
            </DescriptionItem>
            <DescriptionItem>
              <DescriptionTerm>Snapshot</DescriptionTerm>
              <DescriptionDetails>{snapshot.fetchedAt}</DescriptionDetails>
            </DescriptionItem>
            <DescriptionItem>
              <DescriptionTerm>Tier</DescriptionTerm>
              <DescriptionDetails>{snapshot.tier === "fabrials" ? "Fabrials" : "Community"}</DescriptionDetails>
            </DescriptionItem>
          </DescriptionList>
          <Table aria-label={`${snapshot.title} components`}>
            <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead>Design notes</TableHead>
                <TableHead>Packages</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items
                .filter(({ item }) => !item.hidden)
                .map(({ slug, item }) => (
                  <TableRow key={slug}>
                    <TableCell>
                      <Link href={`/docs/${slug}`}>{item.title}</Link>
                    </TableCell>
                    <TableCell>
                      {item.conformance.length ? (
                        <Badge tone="warning">
                          {item.conformance.length} {item.conformance.length === 1 ? "note" : "notes"}
                        </Badge>
                      ) : (
                        <span className="fui-description">None</span>
                      )}
                    </TableCell>
                    <TableCell className="fui-description">
                      {item.dependencies.map((dep) => dep.name).join(", ") || "None"}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </section>
      ))}

      <section className="docs-section" aria-labelledby="suggest">
        <h2 id="suggest" className="docs-heading">
          <a href="#suggest" className="docs-heading-anchor">
            Suggest a library
          </a>
        </h2>
        <p>
          A library needs a public shadcn registry and a permissive license. Add a manifest in{" "}
          <code>apps/site/upstreams/</code> with the components you want, run <code>bun run registry:sync</code>, and
          open a pull request with the snapshot it writes. The sync explains any refusal.
        </p>
      </section>
    </DocsShell>
  );
}
