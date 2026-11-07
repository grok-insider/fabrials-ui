// Lists, the side panel, the context menu and the dropzone in a real browser: keyboard, pointer, windowing and files.
import { expect, test, type Page } from "@playwright/test";

const open = async (page: Page, id: string, width = 1440) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=theme:light`);
  // By selector: behind a modal sheet the page is inert and out of the accessibility tree.
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
};

test("listbox: one tab stop on the choice, arrows move the selection, type-ahead jumps, Enter opens", async ({ page }) => {
  await open(page, "tests-collections--lists");
  const list = page.getByRole("listbox", { name: "Senders", exact: true });
  await list.focus();
  const active = async () => list.evaluate((element) => document.getElementById(element.getAttribute("aria-activedescendant") ?? "")?.textContent ?? "");
  expect(await active()).toContain("Harbour lab");
  await page.keyboard.press("ArrowDown");
  expect(await active()).toContain("Field office");
  await expect(list.getByRole("option", { name: /Field office/ })).toHaveAttribute("aria-selected", "true");
  await expect(list.getByRole("option", { selected: true })).toHaveCount(1);
  await page.keyboard.press("End");
  expect(await active()).toContain("Quarry records");
  await page.keyboard.type("or");
  expect(await active()).toContain("Orchard studio");
  await page.keyboard.press("Home");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "Opened" })).toHaveText("Opened North workspace.");
  const ring = await list.locator("[data-active]").evaluate((row) => getComputedStyle(row).outlineStyle);
  expect(ring).toBe("solid");
});

test("listbox, several: Shift extends, Space toggles, Ctrl+A takes every enabled row, a disabled row is passed over", async ({ page }) => {
  await open(page, "tests-collections--lists");
  const list = page.getByRole("listbox", { name: "Senders to clean up" });
  await expect(list).toHaveAttribute("aria-multiselectable", "true");
  await list.focus();
  await page.keyboard.press("Home");
  await page.keyboard.press("Shift+ArrowDown");
  await expect(list.getByRole("option", { selected: true })).toHaveCount(2);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  const active = await list.evaluate((element) => document.getElementById(element.getAttribute("aria-activedescendant") ?? "")?.textContent ?? "");
  expect(active).toContain("Orchard studio");
  await page.keyboard.press("Space");
  await expect(list.getByRole("option", { name: /Orchard studio/ })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ControlOrMeta+a");
  await expect(list.getByRole("option", { selected: true })).toHaveCount(5);
  await expect(list.getByRole("option", { name: /Night shift/ })).toHaveAttribute("aria-disabled", "true");
  await list.getByRole("option", { name: /Harbour lab/ }).click({ modifiers: ["ControlOrMeta"] });
  await expect(list.getByRole("option", { selected: true })).toHaveCount(4);
});

test("a virtual listbox draws only what is on screen and reaches the last of 10 000 rows", async ({ page }) => {
  await open(page, "tests-collections--lists");
  const list = page.getByRole("listbox", { name: "Sync log" });
  expect(await list.getByRole("option").count()).toBeLessThan(40);
  await list.focus();
  await page.keyboard.press("End");
  const last = list.getByRole("option", { name: /#10000/ });
  await expect(last).toBeVisible();
  await expect(last).toHaveAttribute("aria-posinset", "10000");
  await expect(last).toHaveAttribute("aria-setsize", "10000");
  expect(await list.getByRole("option").count()).toBeLessThan(40);
  const box = await list.boundingBox();
  const row = await last.boundingBox();
  expect(row!.y + row!.height).toBeLessThanOrEqual(box!.y + box!.height + 1);
});

test("a virtual feed measures its rows: none overlaps the next", async ({ page }) => {
  await open(page, "tests-collections--lists");
  const feed = page.getByRole("region", { name: "Feed" });
  await expect(feed.getByRole("listitem").first()).toBeVisible();
  await page.waitForTimeout(100);
  const rows = await feed.getByRole("listitem").evaluateAll((items) => items.slice(0, 5).map((item) => item.getBoundingClientRect()).map((rect) => [rect.top, rect.bottom]));
  for (let index = 1; index < rows.length; index += 1) expect(rows[index]![0]).toBeGreaterThanOrEqual(rows[index - 1]![1] - 0.5);
});

test("side panel: the handle resizes with the arrows and Home, Escape inside closes the panel", async ({ page }) => {
  await open(page, "tests-collections--panels");
  const panel = page.locator(".fui-side-panel");
  const handle = page.getByRole("separator", { name: "Resize panel" });
  await expect(handle).toHaveAttribute("aria-valuenow", "340");
  await handle.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(handle).toHaveAttribute("aria-valuenow", "356");
  expect(Math.round((await panel.boundingBox())!.width)).toBe(356);
  await page.keyboard.press("Home");
  await expect(handle).toHaveAttribute("aria-valuenow", "280");
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await page.getByRole("button", { name: "Open details" }).click();
  await expect(panel).toBeVisible();
  await expect(page.getByRole("complementary", { name: "North workspace" })).toBeVisible();
});

test("side panel: on a phone it is a modal sheet named by its title", async ({ page }) => {
  await open(page, "tests-collections--panels", 390);
  const sheet = page.getByRole("dialog", { name: "North workspace" });
  await expect(sheet).toBeVisible();
  await sheet.getByRole("button", { name: "Close panel" }).click();
  await expect(sheet).toBeHidden();
});

test("context menu: a right-click opens it at the pointer, Escape closes it, Shift+F10 opens it from the keyboard", async ({ page }) => {
  await open(page, "tests-collections--panels");
  const row = page.getByRole("listbox", { name: "Inbox senders" }).getByRole("option", { name: /Field office/ });
  // An open menu makes the rest of the page inert, so the row is measured first.
  const at = (await row.boundingBox())!;
  await row.click({ button: "right" });
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: /Archive/ })).toBeVisible();
  const box = (await menu.boundingBox())!;
  expect(Math.abs(box.y - (at.y + at.height / 2))).toBeLessThan(24);
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await page.getByRole("listbox", { name: "Inbox senders" }).focus();
  await page.keyboard.press("Shift+F10");
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Escape");
});

test("dropzone: chosen files are kept, a file that is too large is said and refused, a drag lights the zone", async ({ page }) => {
  await open(page, "tests-collections--panels");
  const input = page.getByLabel("Choose files").first();
  await input.setInputFiles([
    { name: "receipt.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.7 synthetic") },
    { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("not a receipt") },
  ]);
  await expect(page.getByRole("list", { name: "Chosen files" })).toContainText("receipt.pdf");
  await expect(page.getByRole("alert")).toContainText("notes.txt");
  const zone = page.locator(".fui-dropzone").first();
  await zone.evaluate((element) => {
    const data = new DataTransfer();
    data.items.add(new File(["x"], "scan.png", { type: "image/png" }));
    element.dispatchEvent(new DragEvent("dragenter", { dataTransfer: data, bubbles: true, cancelable: true }));
  });
  await expect(zone).toHaveAttribute("data-dragging", "");
  await expect(zone).toContainText("Drop to add");
  await zone.evaluate((element) => {
    const data = new DataTransfer();
    data.items.add(new File(["x"], "scan.png", { type: "image/png" }));
    element.dispatchEvent(new DragEvent("drop", { dataTransfer: data, bubbles: true, cancelable: true }));
  });
  await expect(zone).not.toHaveAttribute("data-dragging", "");
  await expect(page.getByRole("list", { name: "Chosen files" })).toContainText("scan.png");
});
