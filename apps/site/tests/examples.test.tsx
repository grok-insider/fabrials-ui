// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { exampleSets } from "@/components/examples";
import { exampleSlugs } from "@/lib/example-slugs";
import { uiCatalog } from "@/lib/ui-catalog";

afterEach(cleanup);

// jsdom has no ResizeObserver; the charts and the sliding indicators measure with it.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

it("the server's list of pages with examples is the examples' own", () => {
  expect([...exampleSlugs].sort()).toEqual(Object.keys(exampleSets).sort());
});

it("every example belongs to a catalogue page and says what it shows", () => {
  const slugs = new Set(uiCatalog.map((item) => item.slug));
  for (const [slug, set] of Object.entries(exampleSets)) {
    expect(slugs.has(slug), slug).toBe(true);
    expect(set.examples.length, slug).toBeGreaterThan(0);
    const ids = new Set<string>();
    for (const example of set.examples) {
      expect(ids.has(example.id), `${slug}/${example.id} is unique`).toBe(false);
      ids.add(example.id);
      expect(example.title.trim(), `${slug}/${example.id}`).not.toBe("");
      expect(example.description.length, `${slug}/${example.id}`).toBeGreaterThan(40);
      expect(example.code.trim(), `${slug}/${example.id}`).not.toBe("");
      // Backticks mark code in a description; an odd count would leave the rest of it as code.
      expect((example.description.match(/`/g) ?? []).length % 2, `${slug}/${example.id}`).toBe(0);
    }
  }
});

it("every example and preview renders", () => {
  for (const [slug, set] of Object.entries(exampleSets)) {
    for (const example of set.examples) {
      const { container, unmount } = render(<>{example.render()}</>);
      expect(container.innerHTML.length, `${slug}/${example.id}`).toBeGreaterThan(0);
      unmount();
    }
    if (set.preview) {
      const { container, unmount } = render(<>{set.preview()}</>);
      expect(container.innerHTML.length, `${slug} preview`).toBeGreaterThan(0);
      unmount();
    }
  }
});
