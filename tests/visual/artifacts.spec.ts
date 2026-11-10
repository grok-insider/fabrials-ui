// Artifacts in a real browser: the frame around a drawing (toolbar, source, downloads, full screen, failures that keep the
// source), the viewport that zooms and pans, a tool call's disclosure and the follow-up chips. Assertions read state, focus
// and geometry; the six references are of the bench.
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const STORY = "/iframe.html?id=tests-artifacts--pieces&viewMode=story";
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
    test(`artifacts ${theme} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1200 });
      await open(page, theme);
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark).*$/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const result = await audit(page);
      expect(result.violations).toEqual([]);
      await expect(page).toHaveScreenshot(`artifacts-${theme}-${width}.png`, { fullPage: true });
    });
  }
}

// ------------------------------------------------------------------- the frame

const frame = (page: Page, id: string) => page.getByTestId(id);
const toolbar = (page: Page, id: string) => frame(page, id).getByRole("toolbar");

async function openBase(page: Page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
}

test("the toolbar is one tab stop: Tab enters it once and leaves it, the arrows move between its keys", async ({ page }) => {
  await openBase(page);
  const bar = toolbar(page, "artifact-ready");
  const keys = bar.locator("button");
  const count = await keys.count();
  expect(count).toBeGreaterThanOrEqual(4);
  // Tab reaches the bar once; every key after the first is behind an arrow, not a Tab.
  let tabs = 0;
  for (; tabs < 40; tabs += 1) {
    await page.keyboard.press("Tab");
    if (await bar.evaluate((node) => node.contains(document.activeElement))) break;
  }
  expect(tabs).toBeLessThan(40);
  await expect(keys.first()).toBeFocused();
  await page.keyboard.press("Tab");
  expect(await bar.evaluate((node) => node.contains(document.activeElement))).toBe(false);
  // Back in, and the arrows stay inside.
  await keys.first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(keys.nth(1)).toBeFocused();
  // The overflow trigger is disabled while it is CSS-hidden, so End lands on the last key a person can reach.
  await page.keyboard.press("End");
  await expect(bar.locator("button:not([disabled])").last()).toBeFocused();
});

test("the source toggle swaps the drawing and its source, and says so as a pressed key", async ({ page }) => {
  await openBase(page);
  const artifact = frame(page, "artifact-ready");
  const toggle = artifact.getByRole("button", { name: "Show source" });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(artifact.locator(".fui-artifact-source")).toHaveCount(0);
  await toggle.click();
  const pressed = artifact.getByRole("button", { name: "Show rendering" });
  await expect(pressed).toHaveAttribute("aria-pressed", "true");
  await expect(artifact.locator(".fui-artifact-render")).toBeHidden();
  const source = artifact.locator(".fui-artifact-source");
  await expect(source).toBeVisible();
  await expect(source).toContainText("viewBox=\"0 0 480 270\"");
  await pressed.click();
  await expect(artifact.locator(".fui-artifact-render")).toBeVisible();
  await expect(artifact.locator(".fui-artifact-source")).toHaveCount(0);
});

test("copy puts the source on the clipboard and says it did", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:6061" });
  await openBase(page);
  const artifact = frame(page, "artifact-ready");
  await artifact.getByRole("button", { name: "Copy source" }).click();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain("<svg");
  expect(clipboard).toContain('viewBox="0 0 480 270"');
  await expect(page.locator('[data-slot="announcer"][data-live="polite"]')).toHaveText(/Copied/);
});

test("download offers the SVG, a PNG at twice the size and the source, each named from the title", async ({ page }) => {
  await openBase(page);
  const artifact = frame(page, "artifact-ready");
  const openMenu = async () => {
    await artifact.getByRole("button", { name: "Download" }).click();
    await expect(page.getByRole("menu")).toBeVisible();
  };
  await openMenu();
  await expect(page.getByRole("menuitem")).toHaveText(["SVG image", "PNG image", "Source (.xml)"]);
  const svgDownload = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "SVG image" }).click();
  const svg = await svgDownload;
  expect(svg.suggestedFilename()).toBe("sign-ups-each-month.svg");
  const svgText = readFileSync((await svg.path())!, "utf8");
  expect(svgText.startsWith("<svg")).toBe(true);
  expect(svgText).toContain('viewBox="0 0 480 270"');

  await openMenu();
  const pngDownload = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "PNG image" }).click();
  const png = await pngDownload;
  expect(png.suggestedFilename()).toBe("sign-ups-each-month.png");
  const bytes = readFileSync((await png.path())!);
  expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  // Rasterised at twice the drawing's size.
  expect(bytes.readUInt32BE(16)).toBe(960);
  expect(bytes.readUInt32BE(20)).toBe(540);

  await openMenu();
  const sourceDownload = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Source (.xml)" }).click();
  const source = await sourceDownload;
  expect(source.suggestedFilename()).toBe("sign-ups-each-month.xml");
  expect(readFileSync((await source.path())!, "utf8")).toContain("<svg");
});

test("full screen opens a dialog where the child was given expanded, and Escape gives focus back to its key", async ({ page }) => {
  await openBase(page);
  const artifact = frame(page, "artifact-ready");
  const key = artifact.getByRole("button", { name: "Full screen" });
  await key.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByTestId("chart-ready")).toHaveAttribute("data-expanded", "true");
  await expect(dialog.locator(".fui-zoom-pan-viewport")).toHaveAttribute("role", "region");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(key).toBeFocused();
  await expect(artifact.getByTestId("chart-ready")).toHaveAttribute("data-expanded", "false");
});

test("a child that throws shows its reason and the source, and a new source clears the failure", async ({ page }) => {
  await openBase(page);
  const thrown = frame(page, "artifact-throws");
  const strip = thrown.locator(".fui-artifact-error");
  await expect(strip).toBeVisible();
  await expect(strip).toContainText("The drawing came back empty");
  await expect(thrown.locator(".fui-artifact-source")).toBeVisible();
  await expect(thrown.locator(".fui-artifact-body")).toBeHidden();
  // Never an empty box: the header, the reason and the source are all there.
  expect((await thrown.boundingBox())!.height).toBeGreaterThan(80);

  const recovery = frame(page, "artifact-recovery");
  await expect(recovery.locator(".fui-artifact-error")).toBeVisible();
  await expect(recovery.locator(".fui-artifact-source")).toBeVisible();
  await recovery.getByRole("button", { name: "Change the source" }).click();
  await expect(recovery.locator(".fui-artifact-error")).toHaveCount(0);
  await expect(recovery.locator(".fui-artifact-render")).toBeVisible();
  await expect(recovery.locator(".fui-artifact-source")).toHaveCount(0);
});

test("the loading state keeps the height of the drawing that arrives", async ({ page }) => {
  await openBase(page);
  const loading = (await frame(page, "artifact-height-loading").boundingBox())!;
  const ready = (await frame(page, "artifact-height-ready").boundingBox())!;
  expect(Math.round(loading.height)).toBe(Math.round(ready.height));
  const busy = frame(page, "artifact-height-loading");
  await expect(busy).toHaveAttribute("aria-busy", "true");
  await expect(busy.getByRole("status")).toContainText("Loading the chart");
  // A drawing still streaming says it is drawing, and the same box holds.
  const streaming = frame(page, "artifact-streaming");
  await expect(streaming.getByRole("status")).toContainText("Drawing the diagram");
  expect(Math.round((await streaming.boundingBox())!.height)).toBeGreaterThan(0);
});

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
  await region.scrollIntoViewIfNeeded();
  await scrollTop(page);
  await expect(level(page)).toHaveText("100%");
  const box = (await region.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, 240);
  await page.waitForTimeout(150);
  await expect(level(page)).toHaveText("100%");
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
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

test("in forced colors a pressed source toggle and an error strip keep a form", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await openBase(page);
  const artifact = frame(page, "artifact-ready");
  await artifact.getByRole("button", { name: "Show source" }).click();
  const pressed = artifact.getByRole("button", { name: "Show rendering" });
  const bar = await pressed.evaluate((node) => {
    const style = getComputedStyle(node, "::after");
    return { content: style.content, background: style.backgroundColor, position: getComputedStyle(node).position };
  });
  expect(bar.position).toBe("relative");
  expect(bar.content).not.toBe("none");
  expect(bar.background).not.toBe("rgba(0, 0, 0, 0)");
  const strip = frame(page, "artifact-error").locator(".fui-artifact-error");
  const border = await strip.evaluate((node) => getComputedStyle(node).borderBottomColor);
  expect(border).not.toBe("rgba(0, 0, 0, 0)");
  const frameEdge = await frame(page, "artifact-error").evaluate((node) => getComputedStyle(node).borderTopColor);
  expect(frameEdge).not.toBe("rgba(0, 0, 0, 0)");
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
