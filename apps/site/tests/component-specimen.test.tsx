// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { ComponentSpecimen, SPECIMEN_SLUGS } from "@/components/component-specimen";
import { componentSections } from "@/lib/docs-nav";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function stubBrowserAPIs() {
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    media: "",
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
}

describe("ComponentSpecimen", () => {
  const allItems = componentSections.flatMap((section) =>
    section.items.map((item) => ({
      slug: item.slug,
      title: item.title,
      category: section.name,
    })),
  );

  it("defines a dedicated specimen for every single catalog slug", () => {
    const defined = new Set(SPECIMEN_SLUGS);
    const missing = allItems.filter((item) => !defined.has(item.slug)).map((item) => item.slug);
    expect(missing).toEqual([]);
  });

  it("renders unique, non-empty markup for every component slug with zero duplicates", () => {
    stubBrowserAPIs();

    const byHtml = new Map<string, string[]>();

    for (const item of allItems) {
      const { container, unmount } = render(
        <ComponentSpecimen slug={item.slug} category={item.category} title={item.title} />,
      );
      const html = container.innerHTML.trim();
      expect(html.length, `Empty specimen for "${item.slug}"`).toBeGreaterThan(0);

      // Strip auto-generated React/Base UI ids so structurally identical specimens cannot hide behind random IDs.
      const normalized = html
        .replace(/\bid="[^"]*"/g, 'id=""')
        .replace(/\bfor="[^"]*"/g, 'for=""')
        .replace(/\baria-controls="[^"]*"/g, 'aria-controls=""')
        .replace(/\baria-labelledby="[^"]*"/g, 'aria-labelledby=""')
        .replace(/\baria-describedby="[^"]*"/g, 'aria-describedby=""');

      const existing = byHtml.get(normalized) ?? [];
      existing.push(item.slug);
      byHtml.set(normalized, existing);
      unmount();
    }

    const duplicates = [...byHtml.values()].filter((slugs) => slugs.length > 1);
    expect(duplicates).toEqual([]);
    expect(byHtml.size).toBe(allItems.length);
  });
});
