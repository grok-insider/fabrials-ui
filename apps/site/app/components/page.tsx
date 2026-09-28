import Link from "next/link";
import { PageHeader } from "@fabrials/ui";
import { buttonVariants } from "@fabrials/ui/button-variants";
import { DocsShell } from "@/components/docs/docs-shell";
import { ComponentIndex } from "@/components/component-index";
import { componentSections } from "@/lib/docs-nav";
export const metadata = {
  title: "Components",
  description:
    "Shared Fabrials UI controls, plus WebMCP and MCP blocks you can copy into an app.",
};
export default function Components() {
  return (
    <DocsShell
      toc={componentSections.map((section) => ({
        title: section.name,
        url: `#${section.id}`,
        depth: 2,
      }))}
      header={
        <PageHeader
          eyebrow="The registry"
          title="Components"
          description="Shared controls from @fabrials/ui and @fabrials/ai-ui, plus WebMCP and MCP blocks you can copy into an app. Design-system pages are previews. Agent blocks stay installable from the registry."
          actions={
            <>
              <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/docs/installation">
                Installation guide
              </Link>
              <Link className={buttonVariants({ variant: "ghost", size: "sm" })} href="/playground">
                See them in use
              </Link>
            </>
          }
        />
      }
    >
      <ComponentIndex />
    </DocsShell>
  );
}
