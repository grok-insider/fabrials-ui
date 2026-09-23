// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LandingDemo } from "@/components/landing-demo";
import { chooseFromComparison } from "@/lib/coffee-agent";
import { compareCoffee } from "@/lib/coffee-demo";
afterEach(cleanup);
it("runs the agent through registered tools and leaves the decision to the person", async () => {
  const user = userEvent.setup();
  render(<LandingDemo pace={0} />);
  expect(screen.getByText("2 tools registered")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Run the agent" }));
  const dialog = await screen.findByRole("dialog");
  expect(dialog.textContent).toContain("€1,314");
  const log = screen.getByRole("list", { name: "Agent activity" });
  for (const tool of [
    "compare_coffee_machines",
    "set_coffee_cart",
    "set_coffee_filter",
    "review_coffee_cart",
  ])
    expect(within(log).getByText(tool)).toBeTruthy();
  expect(screen.getByText("4 tools registered")).toBeTruthy();
  expect(screen.getByText("Waiting for you")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Save demo selection" }));
  expect(
    await within(log).findByText(/You approved the selection/),
  ).toBeTruthy();
  expect(screen.getByText("Done")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Remove filter" }));
  expect(await within(log).findByText("Filter removed · €1,290")).toBeTruthy();
  expect(within(log).getByText("You")).toBeTruthy();
});
it("does not choose a machine when nothing meets both requirements", async () => {
  const user = userEvent.setup();
  render(<LandingDemo pace={0} />);
  await user.click(screen.getByRole("button", { name: "28 cm · 58 mm" }));
  await user.click(screen.getByRole("button", { name: "Run the agent" }));
  expect(await screen.findByText(/I won't pick one for you/)).toBeTruthy();
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.getByText("2 tools registered")).toBeTruthy();
});
it("chooses only from the comparison result", () => {
  expect(
    chooseFromComparison({ products: compareCoffee(40, "54 mm") }).choice?.id,
  ).toBe("atelier");
  expect(
    chooseFromComparison({ products: compareCoffee(28, "58 mm") }).choice,
  ).toBeNull();
  expect(chooseFromComparison("unexpected").verdicts).toEqual([]);
});
