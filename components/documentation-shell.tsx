import type { ReactNode } from "react";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { Item, Root } from "fumadocs-core/page-tree";
import { catalog, guides } from "@/lib/catalog";
import { uiCatalog, uiGroups } from "@/lib/ui-catalog";
import { DocsToolbar } from "@/components/docs-toolbar";

const page = (name: string, url: string): Item => ({ type: "page", name, url });

const agentGroups = ["Interaction", "WebMCP", "MCP", "Foundation"] as const;

const tree: Root = {
  name: "Fabrials UI",
  children: [
    {
      type: "folder",
      name: "Components",
      root: true,
      description: "Shared interface controls",
      index: page("All components", "/components"),
      children: [
        page("All components", "/components"),
        ...uiGroups.map((group) => ({
          type: "folder" as const,
          name: group.name,
          children: uiCatalog
            .filter((item) => item.group === group.name)
            .map((item) => page(item.title, `/docs/${item.slug}`)),
        })),
      ],
    },
    {
      type: "folder",
      name: "Agents",
      root: true,
      description: "WebMCP and MCP",
      index: page("Comparison", "/docs/comparison"),
      children: agentGroups.map((category) => ({
        type: "folder" as const,
        name: category,
        children: catalog
          .filter((item) => item.category === category)
          .sort((a, b) => a.title.localeCompare(b.title))
          .map((item) => page(item.title, `/docs/${item.slug}`)),
      })),
    },
    {
      type: "folder",
      name: "Guides",
      root: true,
      description: "Install and operate the registry",
      index: page("Introduction", "/docs/introduction"),
      children: guides.map((guide) => page(guide.title, `/docs/${guide.slug}`)),
    },
  ],
};

export function DocumentationShell({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={tree}
      nav={{ title: "Documentation", url: "/docs/introduction" }}
      sidebar={{ defaultOpenLevel: 0 }}
      slots={{ header: DocsToolbar }}
      themeSwitch={{ enabled: false }}
      searchToggle={{ enabled: true }}
      containerProps={{ className: "fabrials-docs" }}
    >
      {children}
    </DocsLayout>
  );
}
