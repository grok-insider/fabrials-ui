"use client";

import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button, Input, StatePanel } from "@fabrials/ui";
import { componentSections } from "@/lib/docs-nav";

export function ComponentIndex() {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const visible = componentSections
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
        <p role="status" className="fui-description">
          {count} {count === 1 ? "component" : "components"}
        </p>
      </div>
      {visible.map((section) => (
        <section key={section.name} className="docs-section" aria-labelledby={section.id}>
          <h2 id={section.id} className="docs-heading">
            <a href={`#${section.id}`} className="docs-heading-anchor">
              {section.name}
            </a>
          </h2>
          <p>{section.description}</p>
          <ul className="docs-index-grid">
            {section.items.map((item) => (
              <li key={item.slug}>
                <Link href={`/docs/${item.slug}`}>
                  <span className="docs-index-title">{item.title}</span>
                  <span className="docs-index-description">{item.description}</span>
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
          description="Try a name like “button”, “chart” or “form”."
          actions={
            <Button variant="outline" onClick={() => setQuery("")}>
              Clear search
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
