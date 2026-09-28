// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

let path = "/components";
vi.mock("next/navigation", () => ({ usePathname: () => path }));
vi.mock("fumadocs-ui/contexts/search", () => ({ useSearchContext: () => ({ enabled: false, setOpenSearch: () => {} }) }));

const { DocsFrame, DocsShell } = await import("@/components/docs/docs-shell");

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// Each route is its own page component, as in Next: only the layout (DocsFrame) is shared.
function ComponentsPage() {
  return (
    <DocsShell header={<h1>Components</h1>}>
      <p>Every component.</p>
    </DocsShell>
  );
}
function CheckboxPage() {
  return (
    <DocsShell header={<h1>Checkbox</h1>}>
      <p>A binary choice.</p>
    </DocsShell>
  );
}

// The same element means the same scroll position and open groups; jsdom has no layout to measure them.
it("keeps the sidebar mounted when the page changes", () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ stars: null, forks: null })));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  const { rerender } = render(
    <DocsFrame>
      <ComponentsPage />
    </DocsFrame>,
  );
  const sidebar = screen.getByRole("complementary", { name: "Documentation sidebar" });
  path = "/docs/checkbox";
  rerender(
    <DocsFrame>
      <CheckboxPage />
    </DocsFrame>,
  );
  expect(screen.getByRole("heading", { name: "Checkbox" })).toBeTruthy();
  expect(screen.getByRole("complementary", { name: "Documentation sidebar" })).toBe(sidebar);
  expect(screen.getByRole("link", { name: "Checkbox", current: "page" })).toBeTruthy();
});
