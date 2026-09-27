// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  TravelExample,
  SupportExample,
  OnboardingExample,
} from "@/components/workflow-examples";
afterEach(cleanup);
it("filters stays by budget and creates a local shortlist", async () => {
  const u = userEvent.setup();
  render(<TravelExample />);
  await u.click(screen.getByRole("button", { name: "Find quiet stays" }));
  expect(screen.getByRole("status").textContent).toContain("1 quiet stays");
  await u.click(screen.getAllByRole("button", { name: "Shortlist" })[0]);
  expect(screen.getByRole("status").textContent).toContain("Canal House");
});
it("requires confirmation to resolve a ticket", async () => {
  const u = userEvent.setup();
  render(<SupportExample />);
  await u.selectOptions(
    screen.getByRole("combobox", { name: "Priority" }),
    "High",
  );
  expect(screen.queryByText("Invoice address update")).toBeNull();
  await u.click(
    screen.getAllByRole("button", { name: "Review resolution" })[0],
  );
  await u.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.getByRole("status").textContent).toContain("0 resolved");
  await u.click(
    screen.getAllByRole("button", { name: "Review resolution" })[0],
  );
  await u.click(
    within(screen.getByRole("dialog")).getByRole("button", {
      name: "Resolve ticket",
    }),
  );
  expect(screen.getByRole("status").textContent).toContain("1 resolved");
});
it("validates workspace details before completing setup", async () => {
  const u = userEvent.setup();
  render(<OnboardingExample />);
  await u.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByRole("alert").textContent).toContain("name");
  await u.type(screen.getByLabelText("Workspace name"), "Field studio");
  await u.click(screen.getByRole("button", { name: "Continue" }));
  await u.selectOptions(screen.getByLabelText("Team size"), "11–50");
  await u.click(screen.getByRole("button", { name: "Continue" }));
  await u.click(screen.getByRole("button", { name: "Complete" }));
  expect(screen.getByRole("status").textContent).toContain("11–50");
});

it("executes editable playground arguments against the visible travel state", async () => {
  const u = userEvent.setup();
  render(<TravelExample playground />);
  const runner = within(
    screen.getByRole("region", { name: "Tool playground" }),
  );
  await u.type(runner.getByLabelText(/budget/), "250");
  await u.click(runner.getByRole("button", { name: "Execute tool" }));
  expect(screen.getByText(/2 quiet stays/)).toBeTruthy();
  await u.selectOptions(
    runner.getByLabelText("Available tool"),
    "shortlist_stay",
  );
  await u.selectOptions(runner.getByLabelText(/^id/), "garden");
  await u.click(runner.getByRole("button", { name: "Execute tool" }));
  expect(screen.getByText(/Garden Loft is on your shortlist/)).toBeTruthy();
  expect(runner.getAllByText("success")).toHaveLength(2);
});
