import { createSearchAPI } from "fumadocs-core/search/server";
import { readFile } from "node:fs/promises";
import { catalog, guides } from "@/lib/catalog";
import { externalIndex } from "@/lib/external-index.generated";
import { uiCatalog } from "@/lib/ui-catalog";
export const { GET } = createSearchAPI("simple", {
  indexes: async () => {
    const registry = await Promise.all(
      [...catalog, ...guides].map(async (page) => {
        const item = catalog.find((c) => c.slug === page.slug);
        return {
          title: page.title,
          url: `/docs/${page.slug}`,
          description: item?.description ?? "Fabrials UI guide",
          content:
            (item
              ? `${item.description} ${item.note} ${item.props.flat().join(" ")}`
              : "") +
            " " +
            (await readFile(
              page.slug === "design" ? "../../DESIGN.md" : `content/${page.slug}.mdx`,
              "utf8",
            ).catch(() => "")),
        };
      }),
    );
    const controls = uiCatalog.map((item) => ({
      title: item.title,
      url: `/docs/${item.slug}`,
      description: item.description,
      content: `${item.description} ${item.note} ${item.usage} ${item.props.flat().join(" ")}`,
    }));
    const external = externalIndex.flatMap((library) =>
      library.items.map((item) => ({
        title: `${item.title} (${library.title})`,
        url: `/docs/${item.slug}`,
        description: item.description,
        content: `${item.description} ${library.title} ${library.license} ${library.description}`,
      })),
    );
    return [
      {
        title: "Libraries",
        url: "/libraries",
        description: "Components from other open-source libraries and how they get in.",
        content: `license gate MIT Apache-2.0 ISC BSD community tier ${externalIndex.map((library) => library.title).join(" ")}`,
      },
      ...external,
      {
        title: "All components",
        url: "/components",
        description: "Shared Fabrials UI controls and the WebMCP registry.",
        content: "components catalogue button chart command sidebar",
      },
      ...controls,
      ...registry,
    ];
  },
});
