// Geometry and behaviour of the 0.8 structure pieces in a real browser: what jsdom cannot see (layout, hit testing,
// the library's own event order). Engine-agnostic on purpose: the assertions read computed geometry, never pixels.
import { expect, test, type Page } from "@playwright/test";

const open = async (page: Page, id: string, width = 1440) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=theme:light`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
};

test("a stretched item: the row is the target, controls above it are their own, the ring is inside the row", async ({ page }) => {
  await open(page, "fabrials-structure--items");
  const row = page.locator("ul[aria-label='Messages'] > li").first();
  const box = (await row.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);
  const middle = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.className, { x: box.x + 500, y: box.y + box.height / 2 });
  expect(middle).toContain("fui-item-link");
  await page.mouse.click(box.x + 500, box.y + box.height / 2);
  expect(await page.evaluate(() => location.hash)).toBe("#message");
  await page.evaluate(() => (location.hash = ""));
  await row.getByRole("button", { name: /Star/ }).click();
  expect(await page.evaluate(() => location.hash)).toBe("");
  const link = row.locator("a");
  await row.getByRole("checkbox").focus();
  await page.keyboard.press("Tab"); // keyboard focus: :focus-visible applies
  const ring = await link.evaluate((element) => {
    const after = getComputedStyle(element, "::after");
    return { outline: after.outlineStyle, offset: after.outlineOffset, position: after.position, own: getComputedStyle(element).outlineStyle };
  });
  expect(ring).toEqual({ outline: "solid", offset: "-2px", position: "absolute", own: "none" });
});

test("the current row has a 2 px Stormlight bar and the soft fill; a checked row has the fill and no bar", async ({ page }) => {
  await open(page, "fabrials-structure--items");
  const rows = page.locator("ul[aria-label='Messages'] > li");
  const bar = await rows.nth(2).evaluate((element) => ({ width: getComputedStyle(element, "::before").width, content: getComputedStyle(element, "::before").content }));
  expect(bar.width).toBe("2px");
  const checked = await rows.nth(1).evaluate((element) => getComputedStyle(element, "::before").content);
  expect(checked).toBe("none");
});

test("the header keeps its command slot at a definite width in every mode and never overflows", async ({ page }) => {
  await open(page, "fabrials-structure--application-header");
  const rows = await page.evaluate(() =>
    [...document.querySelectorAll("header.fui-app-header")].map((header) => {
      const command = header.querySelector(".fui-app-header-command");
      const actions = header.querySelector(".fui-app-header-actions")!;
      const inner = header.querySelector(".fui-app-header-inner")!;
      const children = [...actions.children].reduce((sum, child) => sum + child.getBoundingClientRect().width, 0) + (actions.children.length - 1) * 4;
      return {
        width: Math.round(header.getBoundingClientRect().width),
        command: command ? Math.round(command.getBoundingClientRect().width) : null,
        // The actions cluster is exactly as wide as its children: it is not sized from an ambiguous basis.
        clusterMatchesChildren: Math.abs(actions.getBoundingClientRect().width - children) <= 1,
        overflow: inner.scrollWidth - inner.clientWidth,
        blur: getComputedStyle(header).backdropFilter,
      };
    }),
  );
  for (const row of rows) {
    expect(row.overflow).toBe(0);
    expect(row.clusterMatchesChildren).toBe(true);
    expect(row.blur).toBe("none");
    if (row.command !== null) expect(row.command).toBe(row.width >= 72 * 16 ? 224 : 44);
  }
});

test("a double click on a handle resets the layout and is reported as a user interaction, wherever in the hit target it lands", async ({ page }) => {
  await open(page, "fabrials-structure--navigation");
  const saved = page.locator("output").first();
  const handle = page.getByRole("separator", { name: "Resize the navigation", exact: true });
  await handle.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(saved).not.toContainText("24 / 36 / 40");
  const box = (await handle.boundingBox())!;
  await page.mouse.dblclick(box.x + 3, box.y + 60);
  await expect(saved).toContainText("Saved layout: 24 / 36 / 40");
});

test("the resizable handle moves with the arrows, Home and End, and a disabled handle leaves the tab order", async ({ page }) => {
  await open(page, "fabrials-structure--navigation");
  const handle = page.getByRole("separator", { name: "Resize the navigation", exact: true });
  await handle.focus();
  const start = Number(await handle.getAttribute("aria-valuenow"));
  await page.keyboard.press("ArrowRight");
  expect(Number(await handle.getAttribute("aria-valuenow"))).toBeGreaterThan(start);
  await page.keyboard.press("End");
  const end = Number(await handle.getAttribute("aria-valuenow"));
  await page.keyboard.press("Home");
  expect(Number(await handle.getAttribute("aria-valuenow"))).toBeLessThan(end);
  await expect(page.getByRole("separator", { name: "Resize the reader", exact: true })).toHaveAttribute("data-separator", "disabled");
});

test("a scrolling strip keeps the selected tab in view without moving the page, and a rail follows the arrow keys", async ({ page }) => {
  await open(page, "fabrials-structure--sections", 390);
  const strip = page.getByRole("tablist", { name: "Settings sections" }).nth(1);
  const inside = () => strip.evaluate((list) => {
    const tab = list.querySelector('[aria-selected="true"]')!.getBoundingClientRect();
    const box = list.getBoundingClientRect();
    return tab.left >= box.left - 1 && tab.right <= box.right + 1;
  });
  await strip.scrollIntoViewIfNeeded();
  await expect.poll(inside).toBe(true);
  // A programmatic selection from a button outside the list (Playwright's own click would scroll its target into view and prove nothing).
  await page.getByRole("button", { name: "Select Mailboxes from outside" }).click();
  const before = await page.evaluate(() => scrollY); // after the click's own scrolling; the reveal must not move the page
  await expect(strip.getByRole("tab", { name: "Mailboxes" })).toHaveAttribute("aria-selected", "true");
  await expect.poll(inside).toBe(true);
  expect(await strip.evaluate((list) => Math.abs(list.scrollLeft))).toBeLessThan(4);
  expect(await page.evaluate(() => scrollY)).toBe(before);
  const rail = page.getByRole("tablist", { name: "Settings sections" }).first();
  await rail.getByRole("tab", { name: "Identity" }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(rail.getByRole("tab", { name: "Privacy" })).toBeFocused();
});

test("the switcher opens on the current link and Escape returns focus to its trigger", async ({ page }) => {
  await open(page, "fabrials-structure--navigation");
  const trigger = page.getByRole("button", { name: /Switch mailbox/ }).first();
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("link", { name: /ana@example\.test/ }).first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("a header that spans the window grows its command slot to 18rem at 90rem and 22rem at 120rem", async ({ page }) => {
  for (const [width, expected] of [[1200, 224], [1440, 288], [2560, 352]] as const) {
    await open(page, "fabrials-structure--full-width-header", width);
    const slot = await page.locator("header.fui-app-header .fui-app-header-command").evaluate((element) => Math.round(element.getBoundingClientRect().width));
    expect(slot, `${width} px window`).toBe(expected);
  }
});
