"use client";

import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { Card, Cards } from "fumadocs-ui/components/card";
import { catalog } from "@/lib/catalog";
import { uiCatalog, uiGroups } from "@/lib/ui-catalog";
import { Button } from "@/components/ui/button";

const agentGroups = [
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

const sections = [
  ...uiGroups.map((group) => ({
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
  ...agentGroups.map((group) => ({
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

export function ComponentIndex() {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const visible = sections
    .map((section) => ({
      ...section,
      items: section.items
        .filter((item) =>
          `${item.title} ${item.description} ${section.name}`
            .toLowerCase()
            .includes(needle),
        )
        .sort((a, b) => a.title.localeCompare(b.title)),
    }))
    .filter((section) => section.items.length > 0);
  const count = visible.reduce((sum, section) => sum + section.items.length, 0);
  return (
    <>
      <div className="mt-9 flex flex-wrap items-center justify-between gap-4 border-b pb-6">
        <div className="relative w-full sm:max-w-sm">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-3 size-4 text-muted-foreground"
          />
          <input
            aria-label="Search components"
            placeholder="Search components…"
            className="h-10 w-full rounded-lg border bg-card pl-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <p role="status" className="text-sm text-muted-foreground">
          {count} {count === 1 ? "component" : "components"}
        </p>
      </div>
      {visible.map((section) => (
        <section
          key={section.name}
          id={section.name.toLowerCase()}
          className="scroll-mt-28 py-9"
        >
          <h2 className="text-xl font-medium tracking-tight">{section.name}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{section.description}</p>
          <Cards className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {section.items.map((item) => (
              <Card
                key={item.slug}
                title={item.title}
                description={item.description}
                href={`/docs/${item.slug}`}
              />
            ))}
          </Cards>
        </section>
      ))}
      {!count && (
        <div className="py-16 text-center">
          <h2 className="font-medium">No components found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a name like “button”, “chart” or “form”.
          </p>
          <Button className="mt-5" variant="outline" onClick={() => setQuery("")}>
            Clear search
          </Button>
        </div>
      )}
      <div className="mt-5 border-t py-8 text-sm text-muted-foreground">
        Looking for a complete flow?{" "}
        <Link
          href="/playground"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Open the playground
        </Link>
        .
      </div>
    </>
  );
}
