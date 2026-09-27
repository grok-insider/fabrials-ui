import { catalog, guides } from "@/lib/catalog";
import { uiCatalog, uiGroups } from "@/lib/ui-catalog";

export interface DocsNavPage {
  title: string;
  href: string;
  description?: string;
}

export interface DocsNavGroup {
  name: string;
  section: "Guides" | "Components" | "Agents";
  pages: DocsNavPage[];
}

const guideDescriptions: Record<string, string> = {
  introduction: "Components for interfaces shared by people and agents.",
  installation: "Add the registry, a provider and your first tool.",
  webmcp: "Expose page actions to browser agents with WebMCP.",
  "interactive-demo": "Try tools on a live page and a real MCP server.",
  authentication: "Connect remote MCP servers with OAuth.",
  server: "Run the optional Node connector on your backend.",
  compatibility: "Browsers, protocol versions and fallbacks.",
};

export const agentGroups = ["Interaction", "WebMCP", "MCP", "Foundation"] as const;

const byTitle = (a: DocsNavPage, b: DocsNavPage) => a.title.localeCompare(b.title);

export const docsNav: DocsNavGroup[] = [
  {
    name: "Getting started",
    section: "Guides",
    pages: guides.map((guide) => ({
      title: guide.title,
      href: `/docs/${guide.slug}`,
      description: guideDescriptions[guide.slug],
    })),
  },
  {
    name: "Overview",
    section: "Components",
    pages: [
      {
        title: "All components",
        href: "/components",
        description: "Shared controls and the WebMCP registry.",
      },
    ],
  },
  ...uiGroups.map((group) => ({
    name: group.name,
    section: "Components" as const,
    pages: uiCatalog
      .filter((item) => item.group === group.name)
      .map((item) => ({ title: item.title, href: `/docs/${item.slug}`, description: item.description })),
  })),
  ...agentGroups.map((category) => ({
    name: category,
    section: "Agents" as const,
    pages: catalog
      .filter((item) => item.category === category)
      .map((item) => ({ title: item.title, href: `/docs/${item.slug}`, description: item.description }))
      .sort(byTitle),
  })),
];

export const docsPages = docsNav.flatMap((group) =>
  group.pages.map((page) => ({ ...page, group: group.name, section: group.section })),
);

export function docsNeighbours(href: string) {
  const index = docsPages.findIndex((page) => page.href === href);
  return {
    current: docsPages[index],
    previous: index > 0 ? docsPages[index - 1] : undefined,
    next: index >= 0 ? docsPages[index + 1] : undefined,
  };
}

const agentGroupDescriptions = [
  {
    name: "Interaction",
    description: "Forms, choices and actions for a shared interface.",
  },
  {
    name: "WebMCP",
    description: "Expose your interface to agents in the browser.",
  },
  {
    name: "MCP",
    description: "Discover tools, connect to servers and display results.",
  },
  {
    name: "Foundation",
    description: "Clients and adapters that connect everything.",
  },
];

export const componentSections = [
  ...uiGroups.map((group) => ({
    id: group.name.toLowerCase(),
    name: group.name,
    description: group.description,
    items: uiCatalog
      .filter((item) => item.group === group.name)
      .map((item) => ({
        slug: item.slug,
        title: item.title,
        description: item.description,
      })),
  })),
  ...agentGroupDescriptions.map((group) => ({
    id: group.name.toLowerCase(),
    name: group.name,
    description: group.description,
    items: catalog
      .filter((item) => item.category === group.name)
      .map((item) => ({
        slug: item.slug,
        title: item.title,
        description: item.description,
      })),
  })),
];

