// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExplorerDemo } from "@/components/demos";
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
import { WebMCPStore } from "@/registry/webmcp/store";
it("shows repeated simulated results and resets filters, selection and pagination", async () => {
  const user = userEvent.setup();
  render(<ExplorerDemo compact />);
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(within(screen.getByRole("table")).getByText("Base UI")).toBeTruthy();
  await user.click(screen.getAllByRole("checkbox")[0]);
  await user.click(screen.getByRole("button", { name: "Run simulated tool" }));
  expect(screen.getByRole("combobox")).toHaveProperty("value", "Browser");
  expect(screen.getByText('{"visible":2}')).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Run simulated tool" }));
  expect(screen.getByText(/Simulator · success · Call 3/)).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Reset demo" }));
  expect(screen.getByRole("combobox")).toHaveProperty("value", "");
  expect(screen.getByText("1–4 of 6 records")).toBeTruthy();
  expect(screen.getByText(/The result will appear here/)).toBeTruthy();
  expect(
    screen
      .getAllByRole("checkbox")
      .every((c) => c.getAttribute("aria-checked") === "false"),
  ).toBe(true);
});
it("manual filters use shared tools and recover from empty results", async () => {
  const user = userEvent.setup();
  render(<ExplorerDemo compact />);
  await user.type(
    screen.getByRole("textbox", { name: "Search records…" }),
    "missing",
  );
  expect(screen.getByText("No matching records.")).toBeTruthy();
  expect(screen.getByText(/Manual · success/)).toBeTruthy();
  await user.clear(screen.getByRole("textbox", { name: "Search records…" }));
  expect(screen.getByText("1–4 of 6 records")).toBeTruthy();
});

it("shows tool failures and allows recovery", async () => {
  const user = userEvent.setup();
  const failing = vi
    .spyOn(WebMCPStore.prototype, "run")
    .mockRejectedValueOnce(new Error("Tool temporarily unavailable"));
  render(<ExplorerDemo compact />);
  await user.click(screen.getByRole("button", { name: "Run simulated tool" }));
  expect(screen.getByRole("alert").textContent).toBe(
    "Tool temporarily unavailable",
  );
  failing.mockRestore();
  await user.click(screen.getByRole("button", { name: "Run simulated tool" }));
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByText('{"visible":2}')).toBeTruthy();
});
