// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

let path = "/components";
vi.mock("next/navigation", () => ({ usePathname: () => path }));
vi.mock("fumadocs-ui/contexts/search", () => ({ useSearchContext: () => ({ enabled: false, setOpenSearch: () => {} }) }));

const { DocsFrame, DocsShell } = await import("@/components/docs/docs-shell");
const { ComponentIndex } = await import("@/components/component-index");

afterEach(() => {
  cleanup();
  vi.useRealTimers();
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
  path = "/components";
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

it("shows a live hover preview beside the sidebar on desktop and dismisses on Escape", () => {
  path = "/components";
  vi.useFakeTimers();
  Object.defineProperty(window, "innerWidth", { value: 1440, configurable: true });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ stars: null, forks: null })));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  render(
    <DocsFrame>
      <ComponentsPage />
    </DocsFrame>,
  );

  const buttonLink = screen.getByRole("link", { name: "Button" });
  fireEvent.pointerEnter(buttonLink);
  expect(screen.queryByTestId("docs-hover-preview")).toBeNull();

  act(() => {
    vi.advanceTimersByTime(100);
  });
  const preview = screen.getByTestId("docs-hover-preview");
  expect(preview.textContent).toContain("Button");
  expect(preview.textContent).toContain("Controls");

  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.queryByTestId("docs-hover-preview")).toBeNull();
});

it("filters the visual component gallery by category and search query", () => {
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
  render(<ComponentIndex />);

  const brandChip = screen.getByRole("button", { name: /Brand/ });
  fireEvent.click(brandChip);
  expect(brandChip.getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByRole("link", { name: "Radiant glyph" })).toBeTruthy();
  expect(screen.queryByRole("link", { name: "Button" })).toBeNull();

  const search = screen.getByRole("searchbox", { name: "Search components" });
  fireEvent.change(search, { target: { value: "corner" } });
  expect(screen.getByRole("status").textContent).toBe("1 component");
  expect(screen.getByRole("link", { name: "Corner marks" })).toBeTruthy();
});
