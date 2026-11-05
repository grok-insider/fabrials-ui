import { expect, test } from "@playwright/test";

test("corner marks and grid guides never take focus: Tab goes from control to control across the plates", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/iframe.html?id=fabrials-instrument--landing-page&viewMode=story&globals=theme:light");
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  expect(await page.locator(".fui-corner-mark").count()).toBeGreaterThan(0);
  expect(await page.locator(".fui-grid-guides").getAttribute("aria-hidden")).toBe("true");
  for (let step = 0; step < 24; step += 1) {
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => {
      const element = document.activeElement;
      return element ? `${element.tagName}.${element.className}` : "";
    });
    expect(focused).not.toMatch(/fui-corner-mark|fui-grid-guides/);
  }
});

test("a ruler meter is a meter with its value and name, and draws its mark at the value", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/iframe.html?id=fabrials-instrument--pieces-page&viewMode=story&globals=theme:light");
  const meter = page.getByRole("meter", { name: "Disk" });
  await expect(meter).toHaveAttribute("aria-valuenow", "82");
  const ticks = meter.locator(".fui-meter-tick-on");
  expect(await ticks.count()).toBe(34);
  const quota = page.getByRole("meter", { name: "Quota" });
  await expect(quota).toHaveAttribute("data-tone", "neutral");
  await expect(page.getByRole("meter", { name: "Monthly budget" })).toHaveAttribute("data-tone", "danger");
});

test("the chart legend still toggles a dithered series from the keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/iframe.html?id=fabrials-instrument--pieces-page&viewMode=story&globals=theme:dark");
  const hide = page.getByRole("button", { name: "Hide Personal" });
  await hide.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Show Personal" })).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".fui-chart-legend svg.fui-chart-swatch rect").first()).toHaveAttribute("fill", /^url\(#fui-dither-/);
});
