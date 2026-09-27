import { catalog, guides } from "@/lib/catalog";
import { externalIndex } from "@/lib/external-index.generated";
import { uiCatalog, uiGroups } from "@/lib/ui-catalog";

export interface DocsNavPage {
  title: string;
  href: string;
  description?: string;
}

export interface DocsNavGroup {
  name: string;
  section: "Guides" | "Components" | "Agents" | "Libraries";
  pages: DocsNavPage[];
}

const guideDescriptions: Record<string, string> = {
  introduction: "Fabrials components, shims and components from other libraries.",
  installation: "Set an app up, then add components by name.",
  design: "Palette, type, density, dithering and motion.",
  shims: "shadcn primitives backed by Fabrials controls.",
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
  {
    name: "Overview",
    section: "Libraries" as const,
    pages: [{ title: "All libraries", href: "/libraries", description: "Where they come from and how they get in." }],
  },
  ...externalIndex.map((library) => ({
    name: library.title,
    section: "Libraries" as const,
    pages: library.items
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

export type ComponentSource = "fabrials" | "external";

export type ComponentSection = {
  id: string;
  name: string;
  description: string;
  source: ComponentSource;
  license?: string;
  items: { slug: string; title: string; description: string; notes?: number }[];
};

export const componentSections: ComponentSection[] = [
  ...uiGroups.map((group) => ({
    id: group.name.toLowerCase().replace(/\s+/g, "-"),
    name: group.name,
    description: group.description,
    source: "fabrials" as const,
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
    source: "fabrials" as const,
    items: catalog
      .filter((item) => item.category === group.name)
      .map((item) => ({
        slug: item.slug,
        title: item.title,
        description: item.description,
      })),
  })),
  ...externalIndex.map((library) => ({
    id: library.name,
    name: library.title,
    description: `${library.description} ${library.license}, ${library.tier === "community" ? "community tier" : "Fabrials tier"}.`,
    source: "external" as const,
    license: library.license,
    items: library.items.map((item) => ({
      slug: item.slug,
      title: item.title,
      description: item.description,
      notes: item.conformance.length,
    })),
  })),
];
