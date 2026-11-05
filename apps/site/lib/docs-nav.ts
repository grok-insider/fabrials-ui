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
  introduction: "Fabrials components, and shims for shadcn primitives.",
  installation: "Set an app up, then add components by name.",
  design: "Palette, type, density, dithering and motion.",
  shims: "shadcn primitives backed by Fabrials controls.",
  "loading-states": "Skeletons from the real components, with no layout shift.",
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

/**
 * The documentation roots the sidebar switches between: the guides, Fabrials'
 * own components and the agent blocks. The sidebar shows one root at a time.
 */
export type DocsRoot = {
  id: string;
  title: string;
  description: string;
  kind: "guides" | "fabrials" | "agents";
  href: string;
  /** The GitHub repository the sidebar links to (owner/name). */
  repository: string;
  groups: DocsNavGroup[];
};

const FABRIALS_REPOSITORY = "grok-insider/fabrials-ui";

export const docsRoots: DocsRoot[] = [
  {
    id: "guides",
    title: "Guides",
    description: "Set up, principles and WebMCP",
    kind: "guides",
    href: "/docs/introduction",
    repository: FABRIALS_REPOSITORY,
    groups: docsNav.filter((group) => group.section === "Guides"),
  },
  {
    id: "fabrials",
    title: "Fabrials UI",
    description: "Controls, patterns and the brand",
    kind: "fabrials",
    href: "/components",
    repository: FABRIALS_REPOSITORY,
    groups: docsNav.filter((group) => group.section === "Components"),
  },
  {
    id: "agents",
    title: "WebMCP & MCP",
    description: "Blocks people and agents share",
    kind: "agents",
    href: "/docs/webmcp-provider",
    repository: FABRIALS_REPOSITORY,
    groups: docsNav.filter((group) => group.section === "Agents"),
  },
];

/** Repositories the site shows stars for. */
export const knownRepositories = new Set(docsRoots.map((root) => root.repository));

/** The root a page belongs to; anything unknown opens the guides. */
export function rootFor(path: string): DocsRoot {
  return docsRoots.find((root) => root.groups.some((group) => group.pages.some((page) => page.href === path))) ?? docsRoots[0]!;
}

export function docsNeighbours(href: string) {
  const pages = rootFor(href).groups.flatMap((group) => group.pages);
  const index = pages.findIndex((page) => page.href === href);
  return {
    current: pages[index],
    previous: index > 0 ? pages[index - 1] : undefined,
    next: index >= 0 ? pages[index + 1] : undefined,
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

export type ComponentSection = {
  id: string;
  name: string;
  description: string;
  items: { slug: string; title: string; description: string }[];
};

export const componentSections: ComponentSection[] = [
  ...uiGroups.map((group) => ({
    id: group.name.toLowerCase().replace(/\s+/g, "-"),
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
