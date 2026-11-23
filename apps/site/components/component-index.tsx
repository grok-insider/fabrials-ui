"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Button, SearchInput, StatePanel } from "@fabrials/ui";
import { ComponentSpecimen } from "@/components/component-specimen";
import { componentSections, type ComponentSection } from "@/lib/docs-nav";

const BLOCK_SECTION_IDS = new Set(["interaction", "webmcp", "mcp", "foundation"]);

type FilterChipDef = {
  id: string;
  label: string;
  count: number;
};

const totalComponentCount = componentSections.reduce((sum, section) => sum + section.items.length, 0);
const blocksCount = componentSections
  .filter((section) => BLOCK_SECTION_IDS.has(section.id))
  .reduce((sum, section) => sum + section.items.length, 0);

const categoryFilters: FilterChipDef[] = [
  { id: "all", label: "All", count: totalComponentCount },
  ...componentSections
    .filter((section) => !BLOCK_SECTION_IDS.has(section.id))
    .map((section) => ({
      id: section.id,
      label: section.name,
      count: section.items.length,
    })),
  { id: "blocks", label: "Blocks", count: blocksCount },
];

function matchesCategory(section: ComponentSection, activeCategory: string) {
  if (activeCategory === "all") return true;
  if (activeCategory === "blocks") return BLOCK_SECTION_IDS.has(section.id);
  return section.id === activeCategory;
}

export function ComponentIndex() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const needle = query.trim().toLowerCase();

  const visible = componentSections
    .filter((section) => matchesCategory(section, activeCategory))
    .map((section) => ({
      ...section,
      items: section.items
        .filter((item) =>
          `${item.title} ${item.slug} ${item.description} ${section.name}`.toLowerCase().includes(needle),
        )
        .sort((a, b) => a.title.localeCompare(b.title)),
    }))
    .filter((section) => section.items.length > 0);

  const count = visible.reduce((sum, section) => sum + section.items.length, 0);

  return (
    <>
      <div className="docs-gallery-controls">
        <div className="docs-index-toolbar">
          <div className="docs-index-search">
            <SearchInput
              aria-label="Search components"
              placeholder="Search components…"
              value={query}
              onValueChange={setQuery}
            />
          </div>
          <p role="status" className="fui-description docs-index-count">
            {count} {count === 1 ? "component" : "components"}
          </p>
        </div>

        <div className="docs-category-bar" role="group" aria-label="Filter by category">
          {categoryFilters.map((filter) => {
            const selected = activeCategory === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                className="docs-category-chip"
                aria-pressed={selected}
                onClick={() => setActiveCategory(filter.id)}
              >
                <span>{filter.label}</span>
                <span className="docs-category-count">{filter.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {visible.map((section) => (
        <section key={section.id} className="docs-section" aria-labelledby={section.id}>
          <div className="docs-gallery-section-head">
            <h2 id={section.id} className="docs-heading">
              <a href={`#${section.id}`} className="docs-heading-anchor">
                {section.name}
              </a>
            </h2>
            <span className="docs-gallery-section-count">{section.items.length}</span>
          </div>
          <p>{section.description}</p>
          <ul className="docs-gallery-grid">
            {section.items.map((item) => (
              <li key={item.slug} className="docs-gallery-item">
                <article className="docs-gallery-tile">
                  <div className="docs-gallery-stage" aria-hidden="true" inert>
                    <ComponentSpecimen slug={item.slug} category={section.name} title={item.title} />
                  </div>
                  <div className="docs-gallery-meta">
                    <div className="docs-gallery-title-row">
                      <Link href={`/docs/${item.slug}`} className="docs-gallery-link">
                        {item.title}
                      </Link>
                      <Badge size="sm" className="docs-gallery-badge">
                        {section.name}
                      </Badge>
                    </div>
                    <p className="docs-gallery-description">{item.description}</p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {!count && (
        <StatePanel
          state="empty"
          title="No components found"
          description="Try a name like “button”, “table” or “agent”, or switch back to All."
          actions={
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setActiveCategory("all");
              }}
            >
              Reset filters
            </Button>
          }
        />
      )}

      <p className="docs-index-footer">
        Looking for a complete flow? <Link href="/playground">Open the playground</Link>.
      </p>
    </>
  );
}
