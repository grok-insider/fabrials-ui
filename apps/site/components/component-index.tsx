"use client";

import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { Badge, Button, Input, StatePanel, ToggleGroup, ToggleGroupItem } from "@fabrials/ui";
import { componentSections, type ComponentSource } from "@/lib/docs-nav";

type Filter = "all" | ComponentSource;

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "fabrials", label: "Fabrials" },
  { value: "external", label: "Other libraries" },
];

export function ComponentIndex() {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<Filter>("all");
  const needle = query.trim().toLowerCase();
  const visible = componentSections
    .filter((section) => source === "all" || section.source === source)
    .map((section) => ({
      ...section,
      items: section.items
        .filter((item) => `${item.title} ${item.description} ${section.name}`.toLowerCase().includes(needle))
        .sort((a, b) => a.title.localeCompare(b.title)),
    }))
    .filter((section) => section.items.length > 0);
  const count = visible.reduce((sum, section) => sum + section.items.length, 0);
  return (
    <>
      <div className="docs-index-toolbar">
        <div className="docs-index-search">
          <Search aria-hidden="true" />
          <Input
            type="search"
            aria-label="Search components"
            placeholder="Search components…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <ToggleGroup
          aria-label="Where components come from"
          size="sm"
          value={[source]}
          onValueChange={(next) => next[0] && setSource(next[0] as Filter)}
        >
          {filters.map((filter) => (
            <ToggleGroupItem key={filter.value} value={filter.value}>
              {filter.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p role="status" className="fui-description docs-index-count">
          {count} {count === 1 ? "component" : "components"}
        </p>
      </div>
      {visible.map((section) => (
        <section key={section.id} className="docs-section" aria-labelledby={section.id}>
          <h2 id={section.id} className="docs-heading">
            <a href={`#${section.id}`} className="docs-heading-anchor">
              {section.name}
            </a>
          </h2>
          <p>
            {section.description}
            {section.source === "external" && (
              <>
                {" "}
                <Link href={`/libraries#${section.id}`}>Origin and license</Link>.
              </>
            )}
          </p>
          <ul className="docs-index-grid">
            {section.items.map((item) => (
              <li key={item.slug}>
                <Link href={`/docs/${item.slug}`}>
                  <span className="docs-index-title">
                    {item.title}
                    {section.source === "external" && <Badge variant="outline">{section.license}</Badge>}
                  </span>
                  <span className="docs-index-description">{item.description}</span>
                  {!!item.notes && (
                    <span className="docs-index-note">
                      {item.notes} design {item.notes === 1 ? "note" : "notes"}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {!count && (
        <StatePanel
          state="empty"
          title="No components found"
          description="Try a name like “button”, “kanban” or “form”, or show every source."
          actions={
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setSource("all");
              }}
            >
              Clear filters
            </Button>
          }
        />
      )}
      <p className="docs-index-footer">
        Looking for a complete flow? <Link href="/playground">Open the playground</Link>. Wondering how other libraries get
        in? <Link href="/libraries">Read the policy</Link>.
      </p>
    </>
  );
}
