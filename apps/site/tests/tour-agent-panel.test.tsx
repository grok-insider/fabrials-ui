// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TourAgentPanel } from "@/components/tour-agent-panel";
import { tourCues } from "@/lib/coffee-tour";
afterEach(cleanup);
it("keeps illustrated calls, human correction and totals synchronized when seeking backwards", async () => {
  const { rerender } = render(<TourAgentPanel time={tourCues.filter + 0.1} />);
  expect(screen.getByText("set_coffee_filter")).toBeTruthy();
  expect(screen.getByText("€1,314")).toBeTruthy();
  rerender(<TourAgentPanel time={tourCues.remove + 0.1} />);
  expect(screen.getByText("Human action")).toBeTruthy();
  expect(screen.getByText("€1,290")).toBeTruthy();
  rerender(<TourAgentPanel time={0} />);
  expect(screen.queryByText("set_coffee_filter")).toBeNull();
  expect(screen.getByText("Waiting for the requirements")).toBeTruthy();
  await userEvent.click(
    screen.getByRole("button", { name: "Collapse MCP activity" }),
  );
  expect(
    screen
      .getByRole("button", { name: "Expand MCP activity" })
      .getAttribute("aria-expanded"),
  ).toBe("false");
});

it("types the request from tour time and rewinds with the timeline", () => {
  const { container, rerender } = render(<TourAgentPanel time={0} />);
  expect(container.querySelector("[data-tour-typed]")?.textContent).toBe("");
  rerender(<TourAgentPanel time={10} />);
  expect(container.querySelector("[data-tour-typed]")?.textContent).toBe("");
  rerender(<TourAgentPanel time={12.5} />);
  const partial =
    container.querySelector("[data-tour-typed]")?.textContent ?? "";
  expect(partial.length).toBeGreaterThan(10);
  expect(partial).not.toContain("accessories");
  rerender(<TourAgentPanel time={15.3} />);
  expect(container.querySelector("[data-tour-typed]")?.textContent).toContain(
    "58 mm accessories.",
  );
  rerender(<TourAgentPanel time={0} />);
  expect(container.querySelector("[data-tour-typed]")?.textContent).toBe("");
});
it("shows a human review summary without an empty JSON block", () => {
  const { container } = render(<TourAgentPanel time={tourCues.review + 1} />);
  expect(screen.getByText("Ready for your review")).toBeTruthy();
  expect(screen.getByText("Studio Dual")).toBeTruthy();
  expect(container.querySelector("pre")).toBeNull();
});
