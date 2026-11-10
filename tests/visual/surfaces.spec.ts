// 0.12, surfaces and targets in a real browser: the six references of the bench, then what only a browser can say: where Tab
// stops, what a popover does in a short window, how tall a touch button is under a fine pointer, and what every floating
// surface computes when a host sets the overlay tokens. Assertions read state and geometry, never pixels.
import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const STORY = "/iframe.html?id=tests-surfaces--pieces&viewMode=story";

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

async function open(page: Page, { theme = "light", width = 1440, height = 960 } = {}) {
  await page.setViewportSize({ width, height });
  await page.goto(`${STORY}&globals=theme:${theme}`);
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

const box = async (locator: Locator) => (await locator.boundingBox())!;

/** What a surface computes for the four things the overlay tokens set. */
const surface = (locator: Locator) =>
  locator.evaluate((node) => {
    const style = getComputedStyle(node);
    return { background: style.backgroundColor, border: style.borderTopColor, shadow: style.boxShadow, filter: style.backdropFilter };
  });

/** What the same four properties compute to from the given declarations, on a probe in the page. */
const computed = (page: Page, declarations: Record<string, string>) =>
  page.evaluate((styles) => {
    const probe = document.createElement("div");
    probe.style.border = "1px solid";
    for (const [property, value] of Object.entries(styles)) probe.style.setProperty(property, value);
    document.body.append(probe);
    const style = getComputedStyle(probe);
    const result = { background: style.backgroundColor, border: style.borderTopColor, shadow: style.boxShadow, filter: style.backdropFilter };
    probe.remove();
    return result;
  }, declarations);

for (const theme of ["light", "dark"]) {
  for (const width of [390, 768, 1440]) {
    test(`surfaces ${theme} ${width}`, async ({ page }) => {
      await open(page, { theme, width });
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark).*$/);
      // The overflowing regions have been measured.
      await expect(page.locator("pre.fui-code-panel-body").nth(1)).toHaveAttribute("tabindex", "0");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const result = await audit(page);
      expect(result.violations).toEqual([]);
      await expect(page).toHaveScreenshot(`surfaces-${theme}-${width}.png`, { fullPage: true });
    });
  }
}

// ------------------------------------------------------------ scroll regions

test("Tab skips a code panel that fits and stops on one that overflows, where the arrows scroll it", async ({ page }) => {
  await open(page);
  const fits = page.locator("pre.fui-code-panel-body").nth(0);
  const long = page.locator("pre.fui-code-panel-body").nth(1);
  await expect(long).toHaveAttribute("tabindex", "0");
  await expect(fits).not.toHaveAttribute("tabindex");
  const copies = page.locator(".fui-code-panel").getByRole("button", { name: "Copy code" });
  await copies.nth(0).focus();
  await page.keyboard.press("Tab");
  await expect(copies.nth(1)).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(long).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => long.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
});

test("every scroll region follows the same rule: the table, the code block and the snippet", async ({ page }) => {
  await open(page);
  const blocks = page.locator(".fui-code-block-body");
  await expect(blocks.nth(1)).toHaveAttribute("tabindex", "0");
  await expect(blocks.nth(0)).not.toHaveAttribute("tabindex");
  // The region keeps its role and its name either way.
  await expect(page.getByRole("region", { name: "fits.ts code" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Parcels that overflow table" })).toHaveAttribute("tabindex", "0");
  await expect(page.getByRole("region", { name: "Parcels that fit table" })).not.toHaveAttribute("tabindex");
  await expect(page.locator("pre.fui-snippet-code")).not.toHaveAttribute("tabindex");
});

test("a region becomes a tab stop when its box shrinks under its content, and stops being one when it fits again", async ({ page }) => {
  await open(page);
  const fits = page.locator("pre.fui-code-panel-body").nth(0);
  await expect(fits).not.toHaveAttribute("tabindex");
  await fits.evaluate((node) => ((node.parentElement as HTMLElement).style.inlineSize = "6rem"));
  await expect(fits).toHaveAttribute("tabindex", "0");
  await fits.evaluate((node) => ((node.parentElement as HTMLElement).style.inlineSize = ""));
  await expect(fits).not.toHaveAttribute("tabindex");
});

// ------------------------------------------------------------------- popover

test("the popover's close key closes it and hands focus back to the trigger, by pointer and by keyboard", async ({ page }) => {
  await open(page);
  const trigger = page.getByRole("button", { name: "Parcel details" });
  await trigger.click();
  const popover = page.getByRole("dialog", { name: "Shipping to Lisbon" });
  await expect(popover).toBeVisible();
  const close = popover.getByRole("button", { name: "Close" });
  await close.click();
  await expect(popover).toBeHidden();
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(popover).toBeVisible();
  // The key is last in the tab order of the popover, so focus lands on it from the keyboard.
  await expect(close).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(popover).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("the close key sits in the corner and takes no room: the content starts where it would without it", async ({ page }) => {
  await open(page);
  const popover = page.locator('[data-sample="popover-inline"]').first();
  const outer = await box(popover);
  const key = await box(popover.getByRole("button", { name: "Close" }));
  const header = await box(popover.locator(".fui-popover-header"));
  // 6 px from the top and from the inline end, inside the 1 px edge.
  expect(key.y - outer.y).toBeCloseTo(7, 0);
  expect(outer.x + outer.width - (key.x + key.width)).toBeCloseTo(7, 0);
  // The header starts at the popover's own padding (12 px), and its text ends before the key.
  expect(header.y - outer.y).toBeCloseTo(13, 0);
  const title = await box(popover.locator(".fui-popover-title"));
  expect(title.x + title.width).toBeLessThanOrEqual(key.x);
});

test("right to left, the close key is in the other corner", async ({ page }) => {
  await open(page);
  const popover = page.locator('[data-sample="popover-inline"][dir="rtl"]');
  const outer = await box(popover);
  const key = await box(popover.getByRole("button", { name: "إغلاق" }));
  expect(key.x - outer.x).toBeCloseTo(7, 0);
  const title = await box(popover.locator(".fui-popover-title"));
  expect(title.x).toBeGreaterThanOrEqual(key.x + key.width);
});

test("in a short window the popover is no taller than its room and scrolls inside, with the close key still in the corner", async ({ page }) => {
  await open(page, { width: 1280, height: 400 });
  await page.getByRole("button", { name: "Parcel details" }).click();
  const popover = page.getByRole("dialog", { name: "Shipping to Lisbon" });
  await expect(popover).toBeVisible();
  await expect.poll(async () => (await box(popover)).height).toBeLessThan(400);
  const outer = await box(popover);
  expect(outer.y).toBeGreaterThanOrEqual(0);
  expect(outer.y + outer.height).toBeLessThanOrEqual(400);
  const scroll = await popover.evaluate((node) => ({ overflow: node.scrollHeight - node.clientHeight, style: getComputedStyle(node).overflowY }));
  expect(scroll.style).toBe("auto");
  expect(scroll.overflow).toBeGreaterThan(40);
  const close = popover.getByRole("button", { name: "Close" });
  const before = await box(close);
  await popover.evaluate((node) => node.scrollTo({ top: node.scrollHeight }));
  await expect.poll(() => popover.evaluate((node) => node.scrollTop)).toBeGreaterThan(40);
  const after = await box(close);
  expect(after.y).toBeCloseTo(before.y, 0);
  expect(after.y - outer.y).toBeCloseTo(7, 0);
  // The last line is on screen, inside the popover.
  const last = await box(popover.locator("p").last());
  expect(last.y + last.height).toBeLessThanOrEqual(outer.y + outer.height);
  // The key still closes it from down here.
  await close.click();
  await expect(popover).toBeHidden();
});

test("a popover that fits has no limit to show: it is as tall as its content", async ({ page }) => {
  await open(page, { width: 1280, height: 1400 });
  await page.getByRole("button", { name: "Parcel details" }).click();
  const popover = page.getByRole("dialog", { name: "Shipping to Lisbon" });
  await expect(popover).toBeVisible();
  expect(await popover.evaluate((node) => node.scrollHeight - node.clientHeight)).toBe(0);
});

// ------------------------------------------------------------------- buttons

test("touch buttons are 44 px under a fine pointer and in compact density; the default size is not", async ({ page }) => {
  await open(page);
  expect(await page.evaluate(() => matchMedia("(pointer: fine)").matches)).toBe(true);
  const buttons = page.getByTestId("buttons");
  const height = async (name: string) => (await box(buttons.getByRole("button", { name, exact: true }))).height;
  expect(await height("Default")).toBe(40);
  expect(await height("Touch")).toBe(44);
  expect(await height("Listen again")).toBe(44);
  const icons = page.getByTestId("icon-buttons");
  expect(await box(icons.getByRole("button", { name: "Play", exact: true }))).toMatchObject({ width: 40, height: 40 });
  expect(await box(icons.getByRole("button", { name: "Play, touch" }))).toMatchObject({ width: 44, height: 44 });
  // The padding and the type are the default size's.
  const face = (name: string) =>
    buttons.getByRole("button", { name, exact: true }).evaluate((node) => {
      const style = getComputedStyle(node);
      return `${style.paddingInlineStart} ${style.fontSize} ${style.borderRadius}`;
    });
  expect(await face("Touch")).toBe(await face("Default"));
  await page.evaluate(() => document.documentElement.setAttribute("data-density", "compact"));
  expect(await height("Default")).toBe(32);
  expect(await height("Touch")).toBe(44);
  expect(await box(icons.getByRole("button", { name: "Play, touch" }))).toMatchObject({ width: 44, height: 44 });
});

test("a loading button says its loading label, which is its name, and cannot be pressed twice", async ({ page }) => {
  await open(page);
  const saving = page.getByRole("button", { name: "Saving" }).first();
  await expect(saving).toHaveAttribute("aria-busy", "true");
  await expect(saving).toHaveAttribute("aria-disabled", "true");
  await expect(saving).toHaveText("Saving");
  // Not loading, the label is not shown.
  await expect(page.getByRole("button", { name: "Save", exact: true }).first()).toHaveText("Save");
});

// ------------------------------------------------------------ overlay tokens

const SET = {
  "--fui-overlay-surface": "rgb(1, 2, 3)",
  "--fui-overlay-border": "rgb(4, 5, 6)",
  "--fui-overlay-shadow": "rgb(7, 8, 9) 0px 0px 0px 2px",
  "--fui-overlay-filter": "blur(3px)",
};
const FOLLOWS = { background: "rgb(1, 2, 3)", border: "rgb(4, 5, 6)", shadow: "rgb(7, 8, 9) 0px 0px 0px 2px", filter: "blur(3px)" };

test("unset, every surface computes what it drew before the tokens existed", async ({ page }) => {
  await open(page);
  const overlay = await computed(page, { background: "var(--popover)", "border-color": "var(--border)", "box-shadow": "var(--fui-shadow-md), var(--fui-highlight)" });
  expect(overlay.filter).toBe("none");
  const samples = page.getByTestId("overlay-default");
  for (const name of ["menu", "popover", "nav-menu"]) expect(await surface(samples.locator(`[data-sample="${name}"]`)), name).toEqual(overlay);
  const tip = await computed(page, { background: "var(--popover)", "border-color": "var(--border)", "box-shadow": "var(--fui-shadow-md)" });
  expect(await surface(samples.locator('[data-sample="chart-tip"]'))).toEqual(tip);
  const dialog = await computed(page, { background: "var(--popover)", "border-color": "var(--border)", "box-shadow": "var(--fui-shadow-lg), var(--fui-highlight)" });
  expect(await surface(samples.locator('[data-sample="dialog"]'))).toEqual(dialog);
  expect((await surface(samples.locator('[data-sample="command"] .fui-command'))).background).toBe(overlay.background);
  // The real ones, through their portals.
  await page.getByRole("button", { name: "Parcel details" }).click();
  expect(await surface(page.getByRole("dialog", { name: "Shipping to Lisbon" }))).toEqual(overlay);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Row actions" }).click();
  expect(await surface(page.getByRole("menu"))).toEqual(overlay);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Notify" }).click();
  const toastSurface = page.locator("[data-sonner-toast]").first();
  await expect(toastSurface).toBeVisible();
  expect(await surface(toastSurface)).toEqual(overlay);
  await page.getByRole("button", { name: "Rename parcel" }).click();
  expect(await surface(page.getByRole("dialog", { name: "Rename parcel" }))).toEqual(dialog);
});

test("set on a parent, the four tokens reach every surface under it", async ({ page }) => {
  await open(page);
  const samples = page.getByTestId("overlay-tinted");
  const expected = await computed(page, {
    background: "var(--brand-soft)",
    "border-color": "var(--brand-ink)",
    "box-shadow": "0 0 0 3px color-mix(in oklab, var(--brand) 28%, transparent)",
    "backdrop-filter": "blur(2px)",
  });
  for (const name of ["menu", "popover", "nav-menu"]) expect(await surface(samples.locator(`[data-sample="${name}"]`)), name).toEqual(expected);
  // The chart tip and the dialog keep their own shadow until their own token is set.
  for (const name of ["chart-tip", "dialog"]) {
    const read = await surface(samples.locator(`[data-sample="${name}"]`));
    expect({ ...read, shadow: expected.shadow }, name).toEqual(expected);
    expect(read.shadow, name).not.toBe(expected.shadow);
  }
  expect((await surface(samples.locator('[data-sample="command"] .fui-command'))).background).toBe(expected.background);
});

test("set on the root, the four tokens reach the real overlays through their portals: popover, menu, dialog and toast", async ({ page }) => {
  await open(page);
  await page.evaluate((tokens) => {
    for (const [name, value] of Object.entries(tokens)) document.documentElement.style.setProperty(name, value);
  }, SET);
  await page.getByRole("button", { name: "Parcel details" }).click();
  const popover = page.getByRole("dialog", { name: "Shipping to Lisbon" });
  expect(await surface(popover)).toEqual(FOLLOWS);
  // The sticky close key is drawn on the popover's own surface.
  expect(await popover.getByRole("button", { name: "Close" }).evaluate((node) => getComputedStyle(node).backgroundColor)).toBe(FOLLOWS.background);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Row actions" }).click();
  expect(await surface(page.getByRole("menu"))).toEqual(FOLLOWS);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Notify" }).click();
  const toastSurface = page.locator("[data-sonner-toast]").first();
  await expect(toastSurface).toBeVisible();
  expect(await surface(toastSurface)).toEqual(FOLLOWS);
  // A dialog takes the surface, the edge and the filter, and keeps its larger shadow until --fui-dialog-shadow is set.
  await page.getByRole("button", { name: "Rename parcel" }).click();
  const dialog = page.getByRole("dialog", { name: "Rename parcel" });
  const first = await surface(dialog);
  expect({ ...first, shadow: FOLLOWS.shadow }).toEqual(FOLLOWS);
  expect(first.shadow).not.toBe(FOLLOWS.shadow);
  await page.evaluate(() => document.documentElement.style.setProperty("--fui-dialog-shadow", "rgb(7, 8, 9) 0px 0px 0px 2px"));
  expect(await surface(dialog)).toEqual(FOLLOWS);
  // And its own tokens win over the overlay's.
  await page.evaluate(() => document.documentElement.style.setProperty("--fui-dialog-surface", "rgb(9, 9, 9)"));
  expect((await surface(dialog)).background).toBe("rgb(9, 9, 9)");
  await page.evaluate(() => document.documentElement.style.setProperty("--fui-toast-surface", "rgb(8, 8, 8)"));
  expect((await surface(toastSurface)).background).toBe("rgb(8, 8, 8)");
});

// --------------------------------------------------------------------- fonts

const family = (page: Page, token: string) =>
  page.evaluate((name) => {
    const probe = document.createElement("span");
    probe.style.fontFamily = `var(${name})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).fontFamily;
    probe.remove();
    return value;
  }, token);

test("the font stacks are the ones of 0.11 until --fui-font-fallback is set, and then hold it after the Plex faces", async ({ page }) => {
  await open(page);
  const SANS = '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif';
  const DISPLAY = '"IBM Plex Sans Condensed", "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif';
  const MONO = '"IBM Plex Mono", ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace';
  expect(await family(page, "--fui-font-sans")).toBe(SANS);
  expect(await family(page, "--fui-font-display")).toBe(DISPLAY);
  expect(await family(page, "--fui-font-mono")).toBe(MONO);
  expect(await family(page, "--fui-font-label")).toBe(MONO);
  // What the page itself is set in.
  expect(await page.locator(".fui-popover").first().evaluate((node) => getComputedStyle(node).fontFamily)).toBe(SANS);
  await page.evaluate(() => document.documentElement.style.setProperty("--fui-font-fallback", '"IBM Plex Sans Arabic"'));
  expect(await family(page, "--fui-font-sans")).toBe('"IBM Plex Sans", "IBM Plex Sans Arabic", system-ui, sans-serif');
  expect(await family(page, "--fui-font-display")).toBe('"IBM Plex Sans Condensed", "IBM Plex Sans", "IBM Plex Sans Arabic", system-ui, sans-serif');
  expect(await family(page, "--fui-font-label")).toBe('"IBM Plex Mono", "IBM Plex Sans Arabic", SFMono-Regular, Consolas, "Liberation Mono", monospace');
  expect(await page.locator(".fui-popover").first().evaluate((node) => getComputedStyle(node).fontFamily)).toContain('"IBM Plex Sans Arabic"');
});

// ------------------------------------------------------- state panel, toolbar

test("a state panel's children sit under its description and before its actions, centred when the panel is", async ({ page }) => {
  await open(page);
  const panel = page.locator(".fui-state-panel").filter({ hasText: "No invoices match" });
  const chips = await box(panel.locator(".fui-state-content"));
  const description = await box(panel.locator(".fui-description"));
  expect(chips.y).toBeGreaterThanOrEqual(description.y + description.height);
  await expect(panel.locator(".fui-state-content").getByRole("button")).toHaveCount(3);
  const centred = page.locator(".fui-state-panel").filter({ hasText: "No parcels yet" });
  const outer = await box(centred);
  const first = await box(centred.locator(".fui-state-content button").first());
  const last = await box(centred.locator(".fui-state-content button").last());
  expect((first.x + last.x + last.width) / 2).toBeCloseTo(outer.x + outer.width / 2, 0);
});

test("the toolbar's search shares its row on a wide window and takes it on a phone", async ({ page }) => {
  await open(page);
  const toolbar = page.getByRole("group", { name: "Parcels" });
  const search = toolbar.locator(".fui-search");
  const action = toolbar.getByRole("button", { name: "New parcel" });
  expect((await box(action)).y).toBeLessThan((await box(search)).y + (await box(search)).height);
  await page.setViewportSize({ width: 390, height: 960 });
  const outer = await box(toolbar);
  await expect.poll(async () => (await box(search)).width).toBeCloseTo(outer.width, 0);
  expect((await box(action)).y).toBeGreaterThanOrEqual((await box(search)).y + (await box(search)).height);
});

// ------------------------------------------------------------- forced colors

test("forced colors: the popover keeps its edge, its close key is on the system surface, and a touch button keeps its size", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await open(page);
  const popover = page.locator('[data-sample="popover-inline"]').first();
  const edge = await popover.evaluate((node) => {
    const style = getComputedStyle(node);
    return { width: style.borderTopWidth, color: style.borderTopColor, background: style.backgroundColor };
  });
  expect(edge.width).toBe("1px");
  expect(edge.color).not.toBe(edge.background);
  const key = popover.getByRole("button", { name: "Close" });
  await expect(key).toBeVisible();
  expect(await key.evaluate((node) => getComputedStyle(node).backgroundColor)).toBe(edge.background);
  expect((await box(page.getByTestId("buttons").getByRole("button", { name: "Touch", exact: true }))).height).toBe(44);
});
