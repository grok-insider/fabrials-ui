// The sidebar in a real browser: its shortcut and cookie, the phone sheet and what closes it, rings drawn inside the rows,
// the action centred on its row with a 44 px target under a finger, both writing directions, and the current row's tokens.
// Assertions read state and geometry; the six references are of the bench at rest.
import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const STORY = "/iframe.html?id=tests-sidebar--pieces&viewMode=story";

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
  await page.goto(`${STORY}&globals=theme:${theme}`);
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

const box = async (locator: Locator) => {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error("no box");
  return { ...rect, right: rect.x + rect.width, bottom: rect.y + rect.height, cx: rect.x + rect.width / 2, cy: rect.y + rect.height / 2 };
};

const ring = (locator: Locator) =>
  locator.evaluate((node) => {
    const style = getComputedStyle(node);
    return { style: style.outlineStyle, width: style.outlineWidth, offset: parseFloat(style.outlineOffset) };
  });

for (const theme of ["light", "dark"]) {
  for (const width of [390, 768, 1440]) {
    test(`sidebar ${theme} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 960 });
      await open(page, theme);
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark).*$/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const result = await audit(page);
      expect(result.violations).toEqual([]);
      await expect(page).toHaveScreenshot(`sidebar-${theme}-${width}.png`, { fullPage: true });
    });
  }
}

test("Ctrl+B folds the sidebar and writes the cookie, and leaves the key to a field a person types in", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const shell = page.getByTestId("shell").first();
  const sidebar = shell.locator(".fui-sidebar");
  const cookie = () => page.evaluate(() => document.cookie);
  await expect(sidebar).toHaveAttribute("data-state", "expanded");
  expect(await cookie()).not.toContain("sidebar_state");

  await page.keyboard.press("Control+b");
  await expect(sidebar).toHaveAttribute("data-state", "collapsed");
  await expect(sidebar).toHaveAttribute("data-collapsible", "offcanvas");
  expect(await cookie()).toContain("sidebar_state=false");
  await expect(shell.locator(".fui-sidebar-trigger")).toHaveAttribute("aria-expanded", "false");
  // The other sidebars of the page have no shortcut.
  await expect(page.getByTestId("shell").nth(1).locator(".fui-sidebar")).toHaveAttribute("data-state", "expanded");

  await page.keyboard.press("Control+b");
  await expect(sidebar).toHaveAttribute("data-state", "expanded");
  expect(await cookie()).toContain("sidebar_state=true");

  // Ctrl+B is Bold in an editor: while the caret is in a field, the sidebar stays.
  await shell.getByRole("textbox", { name: "Notes" }).focus();
  await page.keyboard.press("Control+b");
  await expect(sidebar).toHaveAttribute("data-state", "expanded");
  await shell.getByRole("searchbox", { name: "Search projects" }).focus();
  await page.keyboard.press("Control+b");
  await expect(sidebar).toHaveAttribute("data-state", "expanded");
  expect(await cookie()).toContain("sidebar_state=true");
});

test("on a phone the trigger opens a sheet; its close key, Escape and a change of page close it, and focus goes back to the trigger", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  const shell = page.getByTestId("shell").first();
  // By class: while the sheet is open the page behind it is inert, so the trigger has no role to be found by.
  const trigger = shell.locator(".fui-sidebar-trigger");
  await expect(trigger).toHaveAccessibleName("Toggle navigation");
  const sheet = page.getByRole("dialog", { name: "Navigation" });
  await expect(shell.locator(".fui-sidebar")).toHaveCount(0);

  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(sheet).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  const close = sheet.getByRole("button", { name: "Close navigation" });
  const key = await box(close);
  expect(key.width).toBeGreaterThanOrEqual(44);
  expect(key.height).toBeGreaterThanOrEqual(44);
  // The sheet is at the left edge and its key at the inline end of the header.
  await expect.poll(async () => (await box(sheet)).x).toBe(0);
  const panel = await box(sheet);
  expect(key.right).toBeLessThanOrEqual(panel.right);
  expect(key.x).toBeGreaterThan(panel.cx);
  await page.screenshot({ path: testInfo.outputPath("sheet-open.png") });

  await close.click();
  await expect(sheet).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");

  await page.keyboard.press("Enter");
  await expect(sheet).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(trigger).toBeFocused();

  // A row takes the person to another page: the host's navigation key changes and the sheet closes by itself.
  await page.keyboard.press("Enter");
  await expect(sheet).toBeVisible();
  await sheet.getByRole("button", { name: "Invoices" }).click();
  await expect(sheet).toBeHidden();
  await expect(shell.getByTestId("route")).toHaveText("Page: Invoices");

  // Opening it again on the same page keeps it open: only a change closes it.
  await trigger.click();
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("button", { name: "Invoices" })).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
});

test("on a phone: the default close key has its own row, and a start sidebar in a right-to-left page opens from the right", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  // The third shell asks for the default key (sheetCloseButton) and has none in its header.
  const third = page.getByTestId("shell").nth(2);
  await third.locator(".fui-sidebar-trigger").click();
  const sheet = page.getByRole("dialog", { name: "Navigation" });
  await expect(sheet).toBeVisible();
  await expect(sheet.locator(".fui-sidebar-sheet-bar").getByRole("button", { name: "Close navigation" })).toBeVisible();
  await expect(sheet.getByRole("button", { name: "Close navigation" })).toHaveCount(1);
  const bar = await box(sheet.locator(".fui-sidebar-sheet-bar"));
  const header = await box(sheet.locator(".fui-sidebar-header"));
  expect(bar.bottom).toBeLessThanOrEqual(header.y + 0.5);
  await sheet.getByRole("button", { name: "Close navigation" }).click();
  await expect(sheet).toBeHidden();

  const rtl = page.getByTestId("shell").nth(1);
  await rtl.locator(".fui-sidebar-trigger").click();
  const arabic = page.getByRole("dialog", { name: "التنقل" });
  await expect(arabic).toBeVisible();
  await expect.poll(async () => (await box(arabic)).right).toBe(390);
  const close = arabic.getByRole("button", { name: "أغلق التنقل" });
  expect((await box(close)).cx).toBeLessThan((await box(arabic)).cx);
  await close.click();
  await expect(arabic).toBeHidden();
});

test("the focus ring is drawn inside every row, the sub rows and the action keys", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const shell = page.getByTestId("shell").first();
  // Tab from the search through the sidebar, reading the ring of each kind of stop on the way.
  await shell.getByRole("searchbox", { name: "Search projects" }).focus();
  const seen = new Map<string, { style: string; width: string; offset: number }>();
  for (let step = 0; step < 9; step += 1) {
    await page.keyboard.press("Tab");
    const stop = await page.evaluate(() => {
      const node = document.activeElement as HTMLElement;
      const style = getComputedStyle(node);
      const kind = [...node.classList].find((name) => name.startsWith("fui-sidebar-")) ?? node.className;
      return { kind, style: style.outlineStyle, width: style.outlineWidth, offset: parseFloat(style.outlineOffset), visible: node.matches(":focus-visible") };
    });
    expect(stop.visible).toBe(true);
    seen.set(stop.kind, stop);
  }
  for (const kind of ["fui-sidebar-group-action", "fui-sidebar-menu-button", "fui-sidebar-menu-action", "fui-sidebar-menu-sub-button"]) {
    expect(seen.get(kind), kind).toMatchObject({ style: "solid", width: "2px", offset: -2 });
  }

  // Small, large and touch rows: Tab from each list's add key to its first row.
  for (const [size, offset] of [["sm", -2], ["lg", -2], ["touch", -4]] as const) {
    const still = page.getByTestId(`still-${size}`);
    await still.getByRole("button", { name: "Add a project" }).focus();
    await page.keyboard.press("Tab");
    const row = still.getByRole("button", { name: "Overview" });
    await expect(row).toBeFocused();
    await expect(row).toHaveAttribute("data-size", size);
    expect(await ring(row), size).toEqual({ style: "solid", width: "2px", offset });
  }
});

test("the action and the floating count sit centred on their row at its inline end, above a sub menu too", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open(page);
  for (const [id, height] of [["still-default", 34], ["still-sm", 28], ["still-lg", 48], ["still-touch", 44]] as const) {
    const still = page.getByTestId(id);
    const row = await box(still.getByRole("button", { name: "Projects", exact: true }));
    const action = await box(still.getByRole("button", { name: "More for Projects" }));
    const item = await box(still.locator(".fui-sidebar-menu-item").nth(1));
    expect(row.height, id).toBe(height);
    // The item also holds the sub menu, so it is much taller than the row the action belongs to.
    expect(item.height, id).toBeGreaterThan(row.height + 40);
    expect(action.width, id).toBe(20);
    expect(Math.abs(action.cy - row.cy), id).toBeLessThanOrEqual(0.5);
    expect(row.right - action.right, id).toBeCloseTo(4, 1);
    const count = await box(still.locator(".fui-sidebar-menu-item > .fui-sidebar-menu-badge"));
    const invoices = await box(still.getByRole("button", { name: "Invoices" }));
    expect(Math.abs(count.cy - invoices.cy), id).toBeLessThanOrEqual(0.5);
    expect(invoices.right - count.right, id).toBeCloseTo(4, 1);
  }
  // Right to left: the same, from the left edge of the row; the group's add key is at the left too.
  const rtl = page.getByTestId("still-default-rtl");
  const row = await box(rtl.getByRole("button", { name: "المشاريع", exact: true }));
  const action = await box(rtl.getByRole("button", { name: "المزيد: المشاريع" }));
  expect(Math.abs(action.cy - row.cy)).toBeLessThanOrEqual(0.5);
  expect(action.x - row.x).toBeCloseTo(4, 1);
  const count = await box(rtl.locator(".fui-sidebar-menu-item > .fui-sidebar-menu-badge"));
  const invoices = await box(rtl.getByRole("button", { name: "الفواتير" }));
  expect(count.x - invoices.x).toBeCloseTo(4, 1);
  const add = await box(rtl.getByRole("button", { name: "أضف مشروعاً" }));
  expect(add.cx).toBeLessThan(row.cx);
  // The sub menu hangs from the inline start: its guide line is on the right.
  const sub = rtl.locator(".fui-sidebar-menu-sub");
  expect(await sub.evaluate((node) => getComputedStyle(node).borderRightWidth)).toBe("1px");
  expect(await sub.evaluate((node) => getComputedStyle(node).borderLeftWidth)).toBe("0px");
  expect(await sub.evaluate((node) => getComputedStyle(node).marginLeft)).toBe("0px");
});

test("a start sidebar in a right-to-left page is at the right edge: border, rail, trigger icon and off-canvas side follow", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const ltr = page.getByTestId("shell").first();
  const rtl = page.getByTestId("shell").nth(1);
  for (const [shell, edge] of [[ltr, "left"], [rtl, "right"]] as const) {
    const frame = await box(shell);
    const container = shell.locator(".fui-sidebar-container");
    const panel = await box(container);
    // The frame has a 1 px border of its own.
    if (edge === "left") expect(panel.x - frame.x).toBeCloseTo(1, 1);
    else expect(frame.right - panel.right).toBeCloseTo(1, 1);
    const borders = await container.evaluate((node) => [getComputedStyle(node).borderLeftWidth, getComputedStyle(node).borderRightWidth]);
    expect(borders).toEqual(edge === "left" ? ["0px", "1px"] : ["1px", "0px"]);
    // The rail straddles the inner edge.
    const rail = await box(shell.locator(".fui-sidebar-rail"));
    expect(rail.width).toBe(16);
    expect(Math.abs(rail.cx - (edge === "left" ? panel.right : panel.x))).toBeLessThanOrEqual(1);
    const mirrored = await shell.locator(".fui-sidebar-trigger-icon").evaluate((node) => getComputedStyle(node).transform);
    expect(mirrored).toBe(edge === "left" ? "none" : "matrix(-1, 0, 0, 1, 0, 0)");
  }
  // Folded, it leaves through its own edge.
  await rtl.locator(".fui-sidebar-trigger").click();
  await expect(rtl.locator(".fui-sidebar")).toHaveAttribute("data-state", "collapsed");
  const frame = await box(rtl);
  await expect.poll(async () => (await rtl.locator(".fui-sidebar-container").evaluate((node) => node.getBoundingClientRect().left))).toBeGreaterThanOrEqual(frame.right - 1);
});

test("collapsed to icons, a row's tooltip opens away from the sidebar in both directions", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  for (const [index, name, away] of [[2, "Invoices", "right"], [3, "الفواتير", "left"]] as const) {
    const shell = page.getByTestId("shell").nth(index);
    await expect(shell.locator(".fui-sidebar")).toHaveAttribute("data-collapsible", "icon");
    const row = shell.getByRole("button", { name });
    await row.hover();
    const tip = page.locator(".fui-tooltip").filter({ hasText: name });
    await expect(tip).toBeVisible();
    await expect(tip).toHaveAttribute("data-side", away);
    const frame = await box(shell);
    const panel = await box(shell.locator(".fui-sidebar-container"));
    const key = await box(row);
    const bubble = await box(tip);
    // The sidebar is at the frame's left edge (right in the right-to-left frame) and the tooltip is past the row, towards the page.
    if (away === "right") {
      expect(panel.x - frame.x).toBeLessThanOrEqual(1);
      expect(bubble.x).toBeGreaterThanOrEqual(key.right);
    } else {
      expect(frame.right - panel.right).toBeLessThanOrEqual(1);
      expect(bubble.right).toBeLessThanOrEqual(key.x);
    }
    await page.mouse.move(0, 0);
    await expect(tip).toBeHidden();
  }
  // Open, the same rows have no tooltip: the name is in the row.
  const open1 = page.getByTestId("shell").first();
  await open1.getByRole("button", { name: "Invoices" }).hover();
  await page.waitForTimeout(700);
  await expect(page.locator(".fui-tooltip:visible")).toHaveCount(0);
});

test("the current row follows its tokens; forced colors shows its bar even when the token hides it", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open(page);
  const read = (locator: Locator) =>
    locator.evaluate((node) => {
      const style = getComputedStyle(node);
      const bar = getComputedStyle(node, "::before");
      const icon = getComputedStyle(node.querySelector("svg")!);
      return { shadow: style.boxShadow, ink: style.color, bar: bar.backgroundColor, barContent: bar.content, icon: icon.color };
    });
  const plain = await read(page.getByTestId("still-default").getByRole("button", { name: "Projects", exact: true }));
  const tinted = await read(page.getByTestId("still-default-tokens").getByRole("button", { name: "Invoices" }));
  const touch = await read(page.getByTestId("still-touch-tokens").getByRole("button", { name: "Invoices" }));
  expect(plain.shadow).not.toBe("none");
  expect(plain.bar).not.toBe("rgba(0, 0, 0, 0)");
  expect(plain.icon).toBe(plain.ink);
  for (const row of [tinted, touch]) {
    expect(row.shadow).toBe("none");
    expect(row.bar).toBe("rgba(0, 0, 0, 0)");
    expect(row.barContent).toBe('""');
    // The icon takes the brand ink the host gave it, the label another one.
    expect(row.icon).not.toBe(row.ink);
    expect(row.icon).toBe(plain.bar);
  }

  await page.emulateMedia({ forcedColors: "active" });
  const forced = await read(page.getByTestId("still-default-tokens").getByRole("button", { name: "Invoices" }));
  const forcedTouch = await read(page.getByTestId("still-touch-tokens").getByRole("button", { name: "Invoices" }));
  const highlight = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.backgroundColor = "Highlight";
    document.body.append(probe);
    const colour = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return colour;
  });
  expect(forced.bar).toBe(highlight);
  expect(forcedTouch.bar).toBe(highlight);
});

test("the sidebar's search clears with its key and with Escape, and takes the direction of what is typed", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const shell = page.getByTestId("shell").first();
  const search = shell.getByRole("searchbox", { name: "Search projects" });
  await expect(search).toHaveAttribute("dir", "auto");
  await search.fill("light");
  await shell.getByRole("button", { name: "Clear search" }).click();
  await expect(search).toHaveValue("");
  await expect(search).toBeFocused();
  await search.fill("مرفأ");
  expect(await search.evaluate((node) => getComputedStyle(node).direction)).toBe("rtl");
  await page.keyboard.press("Escape");
  await expect(search).toHaveValue("");
  expect(await search.evaluate((node) => getComputedStyle(node).direction)).toBe("ltr");
});

test.describe("under a finger", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test("rows are 44 px, the action stays centred on them and its target is 44 px", async ({ page }) => {
    await open(page);
    expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
    for (const id of ["still-default", "still-sm", "still-default-rtl"]) {
      const still = page.getByTestId(id);
      const item = still.locator(".fui-sidebar-menu-item").nth(1);
      const row = await box(item.locator("> .fui-sidebar-menu-button"));
      const action = item.locator("> .fui-sidebar-menu-action");
      const key = await box(action);
      expect(row.height, id).toBeGreaterThanOrEqual(44);
      expect(key.width, id).toBe(20);
      expect(Math.abs(key.cy - row.cy), id).toBeLessThanOrEqual(0.5);
      // 21 px from its centre in every direction is still the action: a 44 px target around a 20 px key.
      await action.scrollIntoViewIfNeeded();
      const hits = await action.evaluate((node) => {
        const rect = node.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        return [[-21, 0], [21, 0], [0, -21], [0, 21], [-21, -21], [21, 21]].map(([dx, dy]) => document.elementFromPoint(x + dx!, y + dy!) === node);
      });
      expect(hits, id).toEqual([true, true, true, true, true, true]);
      const add = still.locator(".fui-sidebar-group-action");
      const around = await add.evaluate((node) => {
        const rect = node.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        return [[-21, 0], [21, 0], [0, -21], [0, 21]].map(([dx, dy]) => document.elementFromPoint(x + dx!, y + dy!) === node);
      });
      expect(around, `${id} add`).toEqual([true, true, true, true]);
    }
  });
});
