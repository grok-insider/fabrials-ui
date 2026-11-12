// The flat combobox parts in a real browser (0.12): the references of the bench, then the keyboard, the keys of the field,
// where the list opens, right to left and forced colors. Assertions read state and geometry, never pixels.
import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const story = (name: string, theme = "light") => `/iframe.html?id=tests-combobox--${name}&viewMode=story&globals=theme:${theme}`;

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

async function open(page: Page, name = "parts", theme = "light", width = 1440) {
  await page.setViewportSize({ width, height: 960 });
  await page.goto(story(name, theme));
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

for (const theme of ["light", "dark"]) {
  for (const width of [390, 768, 1440]) {
    test(`combobox ${theme} ${width}`, async ({ page }) => {
      await open(page, "parts", theme, width);
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark).*$/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const result = await audit(page);
      expect(result.violations).toEqual([]);
      await expect(page).toHaveScreenshot(`combobox-${theme}-${width}.png`, { fullPage: true });
    });
  }
}

for (const [name, theme, width] of [
  ["open", "light", 1440],
  ["open", "dark", 390],
  ["open-with-chips", "dark", 1440],
  ["open-with-chips", "light", 390],
] as const) {
  test(`combobox ${name} ${theme} ${width}: the open list`, async ({ page }) => {
    await open(page, name, theme, width);
    await expect(page.getByRole("listbox")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const result = await audit(page);
    expect(result.violations).toEqual([]);
    await expect(page).toHaveScreenshot(`combobox-${name}-${theme}-${width}.png`);
  });
}

const field = (page: Page, name: string) => page.getByRole("combobox", { name, exact: true });
const box = async (locator: Locator) => (await locator.boundingBox())!;
const options = (page: Page) => page.getByRole("listbox").getByRole("option");

test("typing filters the list, and a query with no match says so in a polite status", async ({ page }) => {
  await open(page);
  const input = field(page, "Workspace");
  await input.click();
  await expect(options(page)).toHaveCount(6);
  await input.pressSequentially("ou");
  await expect(options(page)).toHaveText(["South", "Harbour", "Lighthouse"]);
  await input.fill("zz");
  await expect(options(page)).toHaveCount(0);
  const status = page.locator(".fui-combobox-empty");
  await expect(status).toHaveText("No matches.");
  await expect(status).toHaveAttribute("role", "status");
  await expect(status).toHaveAttribute("aria-live", "polite");
});

test("the arrows move the highlight, Enter chooses and closes, and the field shows the choice", async ({ page }) => {
  await open(page);
  const input = field(page, "Workspace");
  await input.focus();
  // The first arrow opens the list on its first row; focus stays in the input, which points at the row.
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(input).toHaveAttribute("aria-expanded", "true");
  const highlighted = page.getByRole("option").and(page.locator("[data-highlighted]"));
  await expect(highlighted).toHaveText("North");
  expect(await input.getAttribute("aria-activedescendant")).toBe(await highlighted.getAttribute("id"));
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(highlighted).toHaveText("East");
  await page.keyboard.press("ArrowUp");
  await expect(highlighted).toHaveText("South");
  await expect(highlighted).toHaveCount(1);
  await expect(input).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(input).toHaveValue("South");
  await expect(input).toBeFocused();
});

test("Escape closes the list and keeps the value, a second Escape empties the field; Tab leaves it", async ({ page }) => {
  await open(page);
  const input = field(page, "Workspace, chosen");
  await input.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("listbox")).toBeVisible();
  // The chosen row carries the tick and says it is selected.
  const selected = page.getByRole("option", { name: "Harbour" });
  await expect(selected).toHaveAttribute("aria-selected", "true");
  await expect(selected.locator(".fui-menu-indicator svg")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(input).toHaveValue("Harbour");
  await expect(input).toBeFocused();
  // The keys of the field are for the pointer: Tab goes past them (and past the field that is off), to the next field.
  await page.keyboard.press("Tab");
  await expect(field(page, "Tags")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(input).toBeFocused();
  // With the list closed, Escape is Base UI's clear.
  await page.keyboard.press("Escape");
  await expect(input).toHaveValue("");
});

test("the clear key is there only with a value, empties the field and hands focus to the input", async ({ page }) => {
  await open(page);
  const empty = page.locator(".fui-combobox-field").filter({ has: field(page, "Workspace") });
  await expect(empty.getByRole("button", { name: "Clear" })).toHaveCount(0);
  await expect(empty.getByRole("button", { name: "Show options" })).toBeVisible();
  const input = field(page, "Workspace, chosen");
  const chosen = page.locator(".fui-combobox-field").filter({ has: input });
  const clear = chosen.getByRole("button", { name: "Clear" });
  await expect(clear).toBeVisible();
  await clear.click();
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await expect(chosen.getByRole("button", { name: "Clear" })).toHaveCount(0);
});

test("the trigger key opens and closes the list with the pointer", async ({ page }) => {
  await open(page);
  const input = field(page, "Workspace");
  // While the list is open Base UI hides everything but the input and the list from assistive technology, the keys included.
  const key = page.locator(".fui-combobox-field").filter({ has: input }).locator('[data-slot="combobox-trigger"]');
  await expect(key).toHaveAccessibleName("Show options");
  await expect(key).toHaveAttribute("tabindex", "-1");
  await key.click();
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(key).toHaveAttribute("aria-expanded", "true");
  await key.click();
  await expect(page.getByRole("listbox")).toHaveCount(0);
});

test("the list opens under the field, 6 px away, aligned with its start and at least as wide", async ({ page }) => {
  await open(page);
  const input = field(page, "Workspace");
  await input.click();
  await expect(page.getByRole("listbox")).toBeVisible();
  const anchor = await box(page.locator(".fui-combobox-field").filter({ has: input }));
  const popup = await box(page.locator(".fui-combobox-content"));
  expect(popup.y - (anchor.y + anchor.height)).toBeCloseTo(6, 0);
  expect(popup.x).toBeCloseTo(anchor.x, 0);
  expect(popup.width).toBeGreaterThanOrEqual(anchor.width - 0.5);
  await expect(page.locator(".fui-positioner").filter({ has: page.locator(".fui-combobox-content") })).toHaveAttribute("data-side", "bottom");
});

test("a multiple combobox keeps the list open on Enter and each Enter adds or takes back a chip", async ({ page }) => {
  await open(page);
  const input = field(page, "Tags, two chosen");
  const chips = page.locator(".fui-combobox-field").filter({ has: input }).locator(".fui-combobox-chip");
  await expect(chips).toHaveText(["billing", "invoices"]);
  await input.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("option", { name: "billing" })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(chips).toHaveText(["billing", "invoices", "quarterly"]);
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(page.getByRole("option", { name: "quarterly" })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Enter");
  await expect(chips).toHaveText(["billing", "invoices"]);
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(chips).toHaveCount(2);
  await expect(input).toBeFocused();
});

test("a typed query narrows a multiple list, Enter takes the match and clears the query, and Backspace in the empty input removes the last chip", async ({ page }) => {
  await open(page);
  const input = field(page, "Tags, two chosen");
  const chips = page.locator(".fui-combobox-field").filter({ has: input }).locator(".fui-combobox-chip");
  await input.focus();
  await input.pressSequentially("qua");
  await expect(options(page)).toHaveText(["quarterly"]);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(chips).toHaveText(["billing", "invoices", "quarterly"]);
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await page.keyboard.press("Backspace");
  await expect(chips).toHaveText(["billing", "invoices"]);
  await page.keyboard.press("Backspace");
  await expect(chips).toHaveText(["billing"]);
  await expect(input).toBeFocused();
});

test("the chips are walked with the arrows from the input, and each has a named key that removes it", async ({ page }) => {
  await open(page);
  const input = field(page, "Tags, two chosen");
  const group = page.locator(".fui-combobox-field").filter({ has: input });
  const chips = group.locator(".fui-combobox-chip");
  await input.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(chips.nth(1)).toBeFocused();
  expect(await chips.nth(1).evaluate((node) => getComputedStyle(node).outlineStyle)).toBe("solid");
  await page.keyboard.press("ArrowLeft");
  await expect(chips.nth(0)).toBeFocused();
  await page.keyboard.press("Backspace");
  await expect(chips).toHaveText(["invoices"]);
  await group.getByRole("button", { name: "Remove invoices" }).click();
  await expect(chips).toHaveCount(0);
});

test("the list of a multiple combobox opens under the whole box of chips, and the box grows instead of scrolling sideways", async ({ page }) => {
  await open(page, "parts", "light", 390);
  const input = field(page, "Tags, more than a line");
  const group = page.locator(".fui-combobox-field").filter({ has: input });
  expect((await box(group)).height).toBeGreaterThan(60);
  expect(await group.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  await input.click();
  await expect(page.getByRole("listbox")).toBeVisible();
  const anchor = await box(group);
  const popup = await box(page.locator(".fui-combobox-content"));
  const side = await page.locator(".fui-positioner").filter({ has: page.locator(".fui-combobox-content") }).getAttribute("data-side");
  if (side === "bottom") expect(popup.y - (anchor.y + anchor.height)).toBeCloseTo(6, 0);
  else expect(anchor.y - (popup.y + popup.height)).toBeCloseTo(6, 0);
  // A row longer than the field widens the list up to the window, which then keeps it on screen.
  expect(popup.width).toBeGreaterThanOrEqual(anchor.width - 0.5);
  expect(popup.x).toBeGreaterThanOrEqual(0);
  expect(popup.x + popup.width).toBeLessThanOrEqual(390);
});

test("a row that is switched off says so and cannot be chosen", async ({ page }) => {
  await open(page);
  const input = field(page, "Region");
  await expect(input).toHaveValue("Helsinki");
  await input.click();
  const off = page.getByRole("option", { name: "Ashburn" });
  await expect(off).toHaveAttribute("aria-disabled", "true");
  expect(await off.evaluate((node) => Number(getComputedStyle(node).opacity))).toBeLessThan(1);
  await off.click({ force: true });
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(input).toHaveValue("Helsinki");
});

test("groups carry their heading, and a long list scrolls inside its popup to the highlighted row", async ({ page }) => {
  await open(page);
  await field(page, "Team").click();
  const groups = page.getByRole("listbox").getByRole("group");
  await expect(groups).toHaveCount(2);
  await expect(page.getByRole("group", { name: "Platform" }).getByRole("option")).toHaveText(["Infrastructure", "Security"]);
  await page.keyboard.press("Escape");
  // The first list fades out for 100 ms (also under reduced motion): the next one is looked for once it is gone.
  await expect(page.locator(".fui-combobox-content")).toHaveCount(0);
  const input = field(page, "Room");
  await input.focus();
  await page.keyboard.press("ArrowDown");
  const popup = page.locator(".fui-combobox-content");
  await expect(popup).toBeVisible();
  expect(await popup.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
  for (let step = 0; step < 30; step += 1) await page.keyboard.press("ArrowDown");
  const active = page.locator(`[id="${await input.getAttribute("aria-activedescendant")}"]`);
  const row = await box(active);
  const frame = await box(popup);
  expect(row.y).toBeGreaterThanOrEqual(frame.y - 0.5);
  expect(row.y + row.height).toBeLessThanOrEqual(frame.y + frame.height + 0.5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("a combobox that is off cannot be opened and says so", async ({ page }) => {
  await open(page);
  const input = field(page, "Workspace, off");
  await expect(input).toBeDisabled();
  const group = page.locator(".fui-combobox-field").filter({ has: input });
  await expect(group.getByRole("button", { name: "Show options" })).toBeDisabled();
  await group.click({ force: true });
  await expect(page.getByRole("listbox")).toHaveCount(0);
});

test("right to left: the keys sit at the left end, the tick at the left of its row, and the list aligns with the right edge", async ({ page }) => {
  await open(page);
  // A right-to-left app sets the direction on its root, which is what the list (a portal in the body) inherits.
  await page.evaluate(() => (document.documentElement.dir = "rtl"));
  const input = field(page, "الجهة");
  const group = page.locator(".fui-combobox-field").filter({ has: input });
  const key = await box(group.getByRole("button", { name: "Show options" }));
  const text = await box(input);
  expect(key.x + key.width).toBeLessThanOrEqual(text.x + 0.5);
  expect(key.x - (await box(group)).x).toBeLessThan(12);
  await input.click();
  await expect(page.getByRole("listbox")).toBeVisible();
  const anchor = await box(group);
  const popup = await box(page.locator(".fui-combobox-content"));
  expect(popup.x + popup.width).toBeCloseTo(anchor.x + anchor.width, 0);
  const selected = page.getByRole("option", { name: "الشرق" });
  const row = await box(selected);
  const tick = await box(selected.locator(".fui-menu-indicator"));
  expect(tick.x - row.x).toBeLessThan(row.width / 4);
  await page.keyboard.press("Escape");
  // The chips read from the right: the first chosen is the rightmost, and the arrow that walks towards them is the right one.
  const tags = field(page, "الجهات");
  const chips = page.locator(".fui-combobox-field").filter({ has: tags }).locator(".fui-combobox-chip");
  expect((await box(chips.nth(0))).x).toBeGreaterThan((await box(chips.nth(1))).x);
  await tags.focus();
  await page.keyboard.press("ArrowRight");
  await expect(chips.nth(1)).toBeFocused();
});

test("forced colors: the highlighted row, the chips and the field's focus keep an edge", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await open(page);
  const input = field(page, "Tags, two chosen");
  const group = page.locator(".fui-combobox-field").filter({ has: input });
  const chip = group.locator(".fui-combobox-chip").first();
  expect(await chip.evaluate((node) => getComputedStyle(node).borderTopStyle)).toBe("solid");
  await input.focus();
  expect(await group.evaluate((node) => getComputedStyle(node).outlineStyle)).toBe("solid");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  const active = page.locator(`[id="${await input.getAttribute("aria-activedescendant")}"]`);
  expect(await active.evaluate((node) => getComputedStyle(node).outlineStyle)).toBe("solid");
  expect(await active.evaluate((node) => getComputedStyle(node).outlineWidth)).toBe("2px");
});

test("on touch the keys of the field and of a chip reach 44 px without growing", async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(story("parts"));
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
  const input = field(page, "Tags, two chosen");
  const remove = page.locator(".fui-combobox-field").filter({ has: input }).getByRole("button", { name: "Remove billing" });
  const reach = (locator: Locator) =>
    locator.evaluate((node) => {
      const own = node.getBoundingClientRect();
      const before = getComputedStyle(node, "::before");
      return { own: own.width, target: own.width - parseFloat(before.left) - parseFloat(before.right) };
    });
  const chipKey = await reach(remove);
  expect(chipKey.own).toBeLessThanOrEqual(20);
  expect(chipKey.target).toBeGreaterThanOrEqual(44);
  const fieldKey = await reach(page.locator(".fui-combobox-field").filter({ has: field(page, "Workspace") }).getByRole("button", { name: "Show options" }));
  expect(fieldKey.target).toBeGreaterThanOrEqual(44);
  await context.close();
});

test("the playground's controls reach the field: no keys when both are off, and the names are the ones given", async ({ page }) => {
  const playground = (args: string) => `/iframe.html?id=components-combobox--playground&viewMode=story&globals=theme:light&args=${args}`;
  await page.goto(playground("showTrigger:!false;showClear:!false"));
  const input = page.getByRole("combobox", { name: "Workspace" });
  await expect(input).toHaveValue("Harbour");
  await expect(page.locator(".fui-combobox-field").getByRole("button")).toHaveCount(0);
  await page.goto(playground("triggerLabel:Ver+opciones;clearLabel:Vaciar"));
  await expect(page.getByRole("button", { name: "Ver opciones" })).toBeVisible();
  await page.getByRole("button", { name: "Vaciar" }).click();
  await expect(page.getByRole("combobox", { name: "Workspace" })).toHaveValue("");
  const result = await audit(page);
  expect(result.violations).toEqual([]);
});
