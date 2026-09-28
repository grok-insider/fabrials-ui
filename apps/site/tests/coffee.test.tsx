// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CoffeeDemo } from "@/components/coffee-demo";
import { coffeeMatch, coffeeProducts, compareCoffee } from "@/lib/coffee-demo";
afterEach(cleanup);
it("keeps comparison, cart, manual correction and human review in the same state", async () => {
  const user = userEvent.setup();
  render(<CoffeeDemo />);
  await user.click(screen.getByRole("button", { name: "Find the right fit" }));
  expect(screen.getByRole("status").textContent).toContain(
    "Studio Dual fits your setup",
  );
  // Counter, accessories and milk are highlighted; the count row says who meets all three.
  expect(document.querySelectorAll("[data-highlighted]")).toHaveLength(3);
  expect(screen.getAllByText("Meets all three").length).toBeGreaterThan(0);
  const studio = coffeeProducts.findIndex((p) => p.id === "studio");
  await user.click(screen.getAllByRole("button", { name: "Choose" })[studio]!);
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
it("recommends only a machine that meets all three requirements", () => {
  expect(coffeeMatch(32, "58 mm")?.id).toBe("studio");
  // Each other machine misses something different.
  const misses = Object.fromEntries(
    compareCoffee(32, "58 mm").map((p) => [p.id, [!p.fits && "width", !p.compatible && "fitting", !p.milk && "milk"].filter(Boolean)]),
  );
  expect(misses).toEqual({
    lever: ["fitting", "milk"],
    solo: ["milk"],
    studio: [],
    atelier: ["width", "fitting"],
    twin: ["width"],
  });
  expect(coffeeMatch(28, "58 mm")).toBeUndefined();
  expect(coffeeMatch(40, "54 mm")?.id).toBe("atelier");
  expect(coffeeMatch(46, "58 mm")?.id).toBe("studio");
});
