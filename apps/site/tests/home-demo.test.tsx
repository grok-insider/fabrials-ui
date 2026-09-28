// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomeDemo } from "@/components/demo/home-demo";

afterEach(cleanup);

it("opens on the narrated tour with chapters and subtitles", () => {
  render(<HomeDemo />);
  expect(screen.getByRole("button", { name: "Narrated tour" }).getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByRole("heading", { name: "A better morning" })).toBeTruthy();
  const chapters = screen.getByRole("list", { name: "Chapters" });
  expect(within(chapters).getAllByRole("button")).toHaveLength(5);
  expect(screen.getByLabelText("Subtitles").textContent).toMatch(/Press play/);
  expect(screen.getByRole("button", { name: /Play the tour/ })).toBeTruthy();
});

it("jumps to a chapter and syncs the store and the agent", async () => {
  const user = userEvent.setup();
  render(<HomeDemo />);
  await user.click(screen.getByRole("button", { name: /Chapter 5: Review the choice/ }));
  expect(screen.getByRole("heading", { name: "Review the choice" })).toBeTruthy();
  expect(screen.getByText("Chapter 5 of 5")).toBeTruthy();
  expect(screen.getAllByText("Selected").length).toBeGreaterThan(0);
});

it("lets a visitor call the store's tools themselves in free mode", async () => {
  const user = userEvent.setup();
  render(<HomeDemo />);
  await user.click(screen.getByRole("button", { name: "Try it yourself" }));
  const console = screen.getByRole("complementary", { name: "Your agent" });
  expect(within(console).getByText(/This page registers 2 tools/)).toBeTruthy();
  // No built-in agent any more: the visitor or their own agent acts.
  expect(screen.queryByText(/Built-in agent/)).toBeNull();
  await user.click(within(console).getByRole("button", { name: "Call the tool" }));
  expect(await within(console).findByText("You, as the agent")).toBeTruthy();
  await user.click(screen.getAllByRole("button", { name: "Choose" })[0]!);
  expect(await within(console).findByText(/This page registers 4 tools/)).toBeTruthy();
  expect(within(console).getAllByText("You, on the page").length).toBeGreaterThan(0);
});
