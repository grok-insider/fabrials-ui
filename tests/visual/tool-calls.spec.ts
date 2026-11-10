// Tool calls and follow-ups in a real browser: the viewport that zooms and pans a drawing, a tool call's disclosure and the
// follow-up chips. Assertions read state, focus and geometry; the six references are of the bench.
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const STORY = "/iframe.html?id=tests-tool-calls--pieces&viewMode=story";
const NOW = new Date("2026-11-10T09:00:00Z");

// Storybook's own accessibility panel may be running axe in the same frame: wait for it rather than fail.
async function audit(page: Page) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    } catch (error) {
      if (!String(error).includes("Axe is already running") || attempt === 3) throw error;
      await page.waitForTimeout(200);
    }
  }
}

async function open(page: Page, theme = "light") {
  await page.clock.setFixedTime(NOW);
  await page.goto(`${STORY}&globals=theme:${theme}`);
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

for (const theme of ["light", "dark"] as const) {
  for (const width of [390, 768, 1440]) {
    test(`tool calls ${theme} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1200 });
      await open(page, theme);
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark).*$/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const result = await audit(page);
      expect(result.violations).toEqual([]);
      await expect(page).toHaveScreenshot(`tool-calls-${theme}-${width}.png`, { fullPage: true });
    });
  }
}

const frame = (page: Page, id: string) => page.getByTestId(id);

async function openBase(page: Page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
}

// ------------------------------------------------------------------- zoom and pan

const zoomRegion = (page: Page) => page.getByRole("region", { name: "Room plan, zoomable" });
const level = (page: Page) => page.getByTestId("zoom-interactive").locator(".fui-zoom-pan-level");

async function scrollTop(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 0));
}

test("Ctrl with the wheel zooms around the pointer, which stays under it", async ({ page }) => {
  await openBase(page);
  const region = zoomRegion(page);
  await region.scrollIntoViewIfNeeded();
  await expect(level(page)).toHaveText("100%");
  const marker = page.getByTestId("zoom-marker");
  const box = (await marker.boundingBox())!;
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(point.x, point.y);
  await page.keyboard.down("Control");
  await page.mouse.wheel(0, -100);
  await page.keyboard.up("Control");
  await expect(level(page)).toHaveText("125%");
  const after = (await marker.boundingBox())!;
  expect(Math.abs(after.x + after.width / 2 - point.x)).toBeLessThan(2);
  expect(Math.abs(after.y + after.height / 2 - point.y)).toBeLessThan(2);
});

test("a plain wheel scrolls the page and never zooms in ctrl mode", async ({ page }) => {
  await openBase(page);
  const region = zoomRegion(page);
  await expect(region).toBeVisible();
  await scrollTop(page);
  await expect(level(page)).toHaveText("100%");
  // Over the page's own text a plain turn scrolls the page, and the viewport is where it was. (Over the viewport itself the
  // wheel is contained by the box, which is what keeps a page from scrolling under a drawing that is being panned.)
  const prose = page.locator("#storybook-root p").first();
  const box = (await prose.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, 240);
  await page.waitForTimeout(150);
  await expect(level(page)).toHaveText("100%");
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  expect(await page.locator(".fui-zoom-pan[data-zoomed]").count()).toBe(0);
});

test("the keys zoom, fit and pan while the region has focus", async ({ page }) => {
  await openBase(page);
  const region = zoomRegion(page);
  await region.focus();
  await expect(region).toBeFocused();
  await page.keyboard.press("+");
  await expect(level(page)).toHaveText("125%");
  await page.keyboard.press("+");
  await expect(level(page)).toHaveText("156%");
  await page.keyboard.press("-");
  await expect(level(page)).toHaveText("125%");
  await page.keyboard.press("0");
  await expect(level(page)).toHaveText("100%");
  expect(await region.evaluate((node) => node.scrollLeft)).toBe(0);
  // Zoomed, an arrow moves the view; the page stays where it is.
  await page.keyboard.press("+");
  await page.keyboard.press("+");
  await page.keyboard.press("+");
  const before = await region.evaluate((node) => node.scrollLeft);
  await page.keyboard.press("ArrowRight");
  expect(await region.evaluate((node) => node.scrollLeft)).toBeGreaterThan(before);
  await page.keyboard.press("Home");
  await expect(level(page)).toHaveText("100%");
  expect(await region.evaluate((node) => node.scrollLeft)).toBe(0);
});

test("dragging pans once there is more to see, and a click without movement still reaches the drawing's own control", async ({ page }) => {
  await openBase(page);
  const region = zoomRegion(page);
  await page.getByTestId("inside-button").click();
  await expect(page.getByTestId("inside-clicks")).toHaveText("1");
  await region.focus();
  await page.keyboard.press("+");
  await page.keyboard.press("+");
  await page.keyboard.press("+");
  const box = (await region.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const start = await region.evaluate((node) => node.scrollLeft);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 140, box.y + box.height / 2 - 40, { steps: 6 });
  await page.mouse.up();
  expect(await region.evaluate((node) => node.scrollLeft)).toBeGreaterThan(start);
  // The release of a drag does not count as a click on what was under the pointer.
  await expect(page.getByTestId("inside-clicks")).toHaveText("1");
});

test("a non-interactive box takes no key, no role and no wheel", async ({ page }) => {
  await openBase(page);
  const plain = frame(page, "zoom-static");
  await expect(plain.getByRole("region")).toHaveCount(0);
  expect(await plain.locator("[tabindex]").count()).toBe(0);
  expect(await plain.locator(".fui-zoom-pan-controls").count()).toBe(0);
  await scrollTop(page);
  const box = (await plain.boundingBox())!;
  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  expect(await page.locator(".fui-zoom-pan[data-zoomed]").count()).toBe(0);
});

// ------------------------------------------------------------------- tool calls

test("a tool call opens by itself only when it failed, and its disclosure works from the keyboard", async ({ page }) => {
  await openBase(page);
  await expect(frame(page, "tool-error").getByRole("button", { name: /read_file failed/ })).toHaveAttribute("aria-expanded", "true");
  await expect(frame(page, "tool-done").getByRole("button", { name: /Ran search_docs/ })).toHaveAttribute("aria-expanded", "false");
  await expect(frame(page, "tool-pending").getByRole("button", { name: /Waiting to run search_docs/ })).toHaveAttribute("aria-expanded", "false");
  const done = frame(page, "tool-done").getByRole("button", { name: /Ran search_docs/ });
  await done.focus();
  await page.keyboard.press("Enter");
  await expect(done).toHaveAttribute("aria-expanded", "true");
  await expect(frame(page, "tool-done").locator(".fui-tool-call-code").first()).toContainText("refund policy");
  await page.keyboard.press("Enter");
  await expect(done).toHaveAttribute("aria-expanded", "false");
  // Its words, never a stock colour: the mark settles on a tick or a cross.
  await expect(frame(page, "tool-error").locator('svg.fui-agent-mark[data-outcome="failed"]')).toHaveCount(1);
  await expect(frame(page, "tool-done").locator('svg.fui-agent-mark[data-outcome="done"]')).toHaveCount(1);
});

// ------------------------------------------------------------------- follow-ups

test("the chips are one tab stop, the arrows move between them and Enter chooses once", async ({ page }) => {
  await openBase(page);
  const group = page.getByRole("group", { name: "Follow-ups" }).first();
  const chips = group.getByRole("button");
  const log = page.getByTestId("chip-log").first();
  await expect(log).toHaveText("Chosen: none");
  await chips.first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(chips.nth(1)).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(chips.nth(2)).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(chips.nth(1)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(log).toHaveText("Chosen: visual");
  await page.keyboard.press("Enter");
  await expect(log).toHaveText("Chosen: visual, visual");
  // One tab stop: Tab leaves the group from wherever the arrows left it.
  await page.keyboard.press("Tab");
  expect(await group.evaluate((node) => node.contains(document.activeElement))).toBe(false);
});

test("a disabled group blocks every chip", async ({ page }) => {
  await openBase(page);
  const groups = page.getByRole("group", { name: "Follow-ups" });
  const disabled = groups.nth(1);
  const chip = disabled.getByRole("button").first();
  await expect(chip).toBeDisabled();
  await chip.click({ force: true });
  await expect(page.getByTestId("chip-log").nth(1)).toHaveText("Chosen: none");
});

// --------------------------------------------------------------- forced colors

test("in forced colors a failed call keeps an edge instead of a tint", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await openBase(page);
  const strip = frame(page, "tool-error").locator(".fui-tool-call-error");
  await expect(strip).toBeVisible();
  const border = await strip.evaluate((node) => getComputedStyle(node).borderTopColor);
  expect(border).not.toBe("rgba(0, 0, 0, 0)");
  const code = frame(page, "tool-error").locator(".fui-tool-call-code").first();
  const outline = await code.evaluate((node) => getComputedStyle(node).outlineStyle);
  expect(outline).not.toBe("none");
});

test("with reduced motion neither the chips nor the arrivals animate", async ({ page }) => {
  await openBase(page);
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
  const names = await page.locator(".fui-suggestion-chip").evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).animationName));
  expect(names.length).toBeGreaterThan(0);
  expect(new Set(names)).toEqual(new Set(["none"]));
  // A chip that arrives later is a rise in the rules; under reduced motion it is already there.
  expect(await page.locator(".fui-suggestion-chip.fui-rise").count()).toBe(0);
});
