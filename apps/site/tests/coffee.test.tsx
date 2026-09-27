// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CoffeeDemo } from "@/components/coffee-demo";
import { compareCoffee } from "@/lib/coffee-demo";
afterEach(cleanup);
it("keeps comparison, cart, manual correction and human review in the same state", async () => {
  const user = userEvent.setup();
  render(<CoffeeDemo />);
  await user.click(screen.getByRole("button", { name: "Find the right fit" }));
  expect(screen.getByRole("status").textContent).toContain(
    "Studio Dual fits your setup",
  );
  expect(document.querySelectorAll("[data-highlighted]")).toHaveLength(2);
  await user.click(screen.getAllByRole("button", { name: "Choose" })[0]);
  const cart = screen.getByRole("complementary");
  await user.click(
    within(cart).getByRole("button", { name: /Add compatible filter/ }),
  );
  expect(within(cart).getByText("€1,314")).toBeTruthy();
  await user.click(within(cart).getByRole("button", { name: /Filter added/ }));
  expect(within(cart).queryByText("€1,314")).toBeNull();
  await user.click(
    within(cart).getByRole("button", { name: /Review selection/ }),
  );
  expect(screen.getByRole("dialog").textContent).toContain("€1,290");
  await user.click(screen.getByRole("button", { name: "Save demo selection" }));
  expect(screen.getByText("Selection saved for this demo.")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Reset coffee demo" }));
  expect(document.querySelectorAll("[data-highlighted]")).toHaveLength(0);
  expect(screen.queryByText("Selection saved for this demo.")).toBeNull();
});
it("does not recommend a product when neither matches both requirements", () => {
  expect(compareCoffee(28, "58 mm").some((p) => p.fits && p.compatible)).toBe(
    false,
  );
  expect(
    compareCoffee(40, "54 mm").find((p) => p.fits && p.compatible)?.id,
  ).toBe("atelier");
});
