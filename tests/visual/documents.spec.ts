// The spreadsheet in a real browser: one tab stop, the arrows, the corners, merged cells, copying, tabs and files.
import { expect, test, type Page } from "@playwright/test";

const open = async (page: Page) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/iframe.html?id=fabrials-documents--sheets&viewMode=story&globals=theme:light`);
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
};

test("the grid: arrows move the active cell, the bar follows, Ctrl+End reaches the last cell of a merged block", async ({ page }) => {
  await open(page);
  const grid = page.getByRole("grid", { name: "Usage export, Usage" });
  const address = page.locator(".fui-spreadsheet-address").first();
  await grid.focus();
  await expect(address).toHaveText("A1");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowRight");
  await expect(address).toHaveText("B3");
  await expect(page.locator(".fui-spreadsheet-contents").first()).toHaveText("8,819");
  const active = await grid.getAttribute("aria-activedescendant");
  await expect(page.locator(`[id="${active}"]`)).toHaveText("8,819");
  await page.keyboard.press("ControlOrMeta+End");
  await expect(address).toHaveText("D243");
  await expect(page.locator(".fui-spreadsheet-contents").first()).toHaveText("Totals come from the source file.");
  await expect(grid).toHaveAttribute("aria-activedescendant", /r242c3$/);
  const merged = page.locator(`[id="${await grid.getAttribute("aria-activedescendant")}"]`);
  await expect(merged).toBeVisible();
  await expect(merged).toHaveAttribute("data-merged", "");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(address).toHaveText("B243");
  await expect(page.locator(".fui-spreadsheet-formula").first()).toHaveText("=SUM(B2:B241)");
  await page.keyboard.press("ControlOrMeta+Home");
  await expect(address).toHaveText("A1");
  expect(await grid.evaluate((element) => element.scrollTop)).toBe(0);
  const rows = await grid.locator("[role=row]").count();
  expect(rows).toBeLessThan(60);
});

test("a click chooses a cell; Ctrl+C copies its text", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await open(page);
  const grid = page.getByRole("grid", { name: "Usage export, Usage" });
  await grid.getByRole("gridcell", { name: "€264.57" }).click();
  await expect(page.locator(".fui-spreadsheet-address").first()).toHaveText("C3");
  await page.keyboard.press("ControlOrMeta+c");
  await expect(page.getByText("C3 copied")).toBeAttached();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("€264.57");
});

test("sheet tabs: a click or the arrows change the sheet; an empty sheet says so", async ({ page }) => {
  await open(page);
  const tabs = page.getByRole("tablist", { name: "Sheets" });
  await tabs.getByRole("tab", { name: "Notes" }).click();
  await expect(page.getByRole("grid", { name: "Usage export, Notes" })).toBeVisible();
  await expect(tabs.getByRole("tab", { name: "Notes" })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowRight");
  await expect(tabs.getByRole("tab", { name: "Empty" })).toBeFocused();
  await expect(page.getByText("This sheet is empty.")).toBeVisible();
});

test("files: an .xlsx opens in the browser; an old .xls is refused with the reason", async ({ page }) => {
  await open(page);
  const input = page.getByLabel("Choose a spreadsheet");
  await input.setInputFiles("tests/fixtures/workbook.xlsx");
  const grid = page.getByRole("grid", { name: "workbook.xlsx, Usage" });
  await expect(grid).toBeVisible();
  await expect(grid.getByRole("gridcell", { name: "41,250" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Notes" }).last()).toBeVisible();
  await input.setInputFiles({ name: "old.xls", mimeType: "application/vnd.ms-excel", buffer: Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]) });
  await expect(page.getByRole("alert")).toContainText("old .xls");
});
