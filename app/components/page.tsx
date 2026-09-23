import Link from "next/link";
import { DocumentationShell } from "@/components/documentation-shell";
import {
  DocsPage,
  DocsTitle,
  DocsDescription,
} from "fumadocs-ui/layouts/docs/page";
import { ComponentIndex } from "@/components/component-index";
export const metadata = {
  title: "Components",
  description:
    "Shared Fabrials UI controls, plus WebMCP and MCP blocks you can copy into an app.",
};
export default function Components() {
  return (
    <DocumentationShell>
      <DocsPage id="main-content" full>
        <p className="mb-4 text-xs text-muted-foreground">The registry</p>
        <DocsTitle>Components</DocsTitle>
        <DocsDescription>
          Shared controls from @fabrials/ui, plus WebMCP and MCP blocks you
          can copy into an app. Design-system pages are previews. Agent blocks
          stay installable from the registry.
        </DocsDescription>
        <div className="mt-5 flex gap-5 text-sm">
          <Link
            className="underline underline-offset-4"
            href="/docs/installation"
          >
            Installation guide
          </Link>
          <Link
            className="text-muted-foreground hover:text-foreground"
            href="/playground"
          >
            See them in use ↗
          </Link>
        </div>
        <ComponentIndex />
      </DocsPage>
    </DocumentationShell>
  );
}
