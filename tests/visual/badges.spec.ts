// Badge 0.11 in a real browser: the count shape, icon sizes, the live dot and a tag that is a button or a link. Engine-agnostic:
// assertions read state and geometry, never pixels.
import { expect, test, type Page } from "@playwright/test";

const open = async (page: Page) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/iframe.html?id=tests-feedback--tags&viewMode=story&globals=theme:light");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
};

const ripple = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((dot) => {
    const after = getComputedStyle(dot, "::after");
    return { content: after.content, animation: after.animationName };
  });

test("a count sits centred in a tag at least as wide as it is tall, and an icon is 12 px, 14 px in lg", async ({ page }) => {
  await open(page);
  for (const size of ["sm", "default", "lg"]) {
    const selector = size === "default" ? '.fui-badge[data-count]:not([data-size]):not([data-variant="solid"]):not([data-variant="outline"])' : `.fui-badge[data-count][data-size="${size}"]`;
    const box = (await page.locator(selector).first().boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(box.height - 0.5);
  }
  const icon = (selector: string) => page.locator(selector).first().boundingBox();
  expect((await icon('.fui-badge:not([data-size]) > svg'))!.width).toBeCloseTo(12, 0);
  expect((await icon('.fui-badge[data-size="lg"] > svg'))!.width).toBeCloseTo(14, 0);
  expect((await page.locator('.fui-badge[data-size="lg"]').first().boundingBox())!.height).toBeCloseTo(24, 0);
});

test("a live dot ripples only without reduced motion, and never in a skeleton", async ({ page }) => {
  await open(page);
  // The suite runs under reduced motion: nothing is drawn.
  expect(await ripple(page, ".fui-badge-dot[data-pulse]")).toEqual({ content: "none", animation: "none" });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  expect(await ripple(page, ".fui-badge-dot[data-pulse]")).toEqual({ content: '""', animation: "fui-pulse" });
  expect(await ripple(page, "[data-fui-loading] .fui-badge-dot[data-pulse]")).toMatchObject({ content: "none" });
});

test("a tag that is a button takes the keyboard, says whether it is pressed, and deepens under the pointer", async ({ page }) => {
  await open(page);
  const labels = page.getByRole("group", { name: "Labels" });
  const receipts = labels.getByRole("button", { name: "Receipts" });
  const travel = labels.getByRole("button", { name: "Travel" });
  await expect(receipts).toHaveAttribute("aria-pressed", "true");
  await expect(travel).toHaveAttribute("aria-pressed", "false");
  const rest = await travel.evaluate((node) => getComputedStyle(node).backgroundColor);
  await travel.focus();
  await expect(travel).toBeFocused();
  expect(await travel.evaluate((node) => getComputedStyle(node).outlineStyle)).toBe("solid");
  await page.keyboard.press("Space");
  await expect(travel).toHaveAttribute("aria-pressed", "true");
  await expect(receipts).toHaveAttribute("aria-pressed", "false");
  // Pressed: the deeper tint and an edge in its colour.
  const pressed = await travel.evaluate((node) => ({ background: getComputedStyle(node).backgroundColor, edge: getComputedStyle(node).boxShadow }));
  expect(pressed.background).not.toBe(rest);
  expect(pressed.edge).not.toBe("none");
  await page.mouse.move(0, 0);
  const family = labels.getByRole("button", { name: "Family" });
  const before = await family.evaluate((node) => getComputedStyle(node).backgroundColor);
  await family.hover();
  await expect.poll(() => family.evaluate((node) => getComputedStyle(node).backgroundColor)).not.toBe(before);
  expect(await family.evaluate((node) => getComputedStyle(node).cursor)).toBe("pointer");
  await expect(labels.getByRole("link", { name: "Current view" })).toHaveAttribute("aria-current", "page");
});
