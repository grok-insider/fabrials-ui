// The calendar's keyboard and the date pickers in a real browser: focus, month changes, the popover and the form value.
import { expect, test, type Locator, type Page } from "@playwright/test";

const day = (scope: Locator, iso: string) => scope.locator(`[data-day="${iso}"]:not([data-outside])`);

const open = async (page: Page, id: string, theme = "light") => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
};

test("calendar: one tab stop on the chosen day; arrows, Home, End and Page keys move; Enter chooses", async ({ page }) => {
  await open(page, "tests-dates--calendars");
  const calendar = page.locator(".fui-calendar").first();
  await calendar.getByRole("button", { name: "Next month" }).focus();
  await page.keyboard.press("Tab");
  await expect(day(calendar, "2026-11-12")).toBeFocused();
  expect(await calendar.locator('[data-slot="calendar-day"][tabindex="0"]').count()).toBe(1);
  await page.keyboard.press("ArrowRight");
  await expect(day(calendar, "2026-11-13")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(day(calendar, "2026-11-20")).toBeFocused();
  await page.keyboard.press("PageDown");
  await expect(calendar.getByText("December 2026")).toBeVisible();
  await expect(day(calendar, "2026-12-20")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(day(calendar, "2026-12-14")).toBeFocused();
  await page.keyboard.press("End");
  await expect(day(calendar, "2026-12-20")).toBeFocused();
  await page.keyboard.press("Shift+PageUp");
  await expect(calendar.getByText("December 2025")).toBeVisible();
  await page.keyboard.press("Shift+PageDown");
  await page.keyboard.press("Enter");
  await expect(calendar.locator("td[aria-selected=true]")).toHaveCount(1);
  await expect(calendar.locator("td[aria-selected=true] button")).toHaveAttribute("data-day", "2026-12-20");
  await expect(calendar.locator("td[aria-selected=true] button")).toHaveAccessibleName(/Sunday,? 20 December 2026/);
  await expect(day(calendar, "2026-12-05")).not.toHaveAttribute("aria-current");
});

test("calendar: disabled days are passed over by the arrows but cannot be chosen", async ({ page }) => {
  await open(page, "tests-dates--calendars");
  const calendar = page.locator(".fui-calendar").nth(1);
  await day(calendar, "2026-11-20").focus();
  await page.keyboard.press("ArrowRight");
  const saturday = day(calendar, "2026-11-21");
  await expect(saturday).toBeFocused();
  await expect(saturday).toHaveAttribute("aria-disabled", "true");
  await page.keyboard.press("Enter");
  await expect(calendar.locator("td[aria-selected=true] button")).toHaveAttribute("data-day", "2026-11-20");
});

test("a range calendar chooses a start and an end, and previews the band in between", async ({ page }) => {
  await open(page, "tests-dates--calendars");
  const calendar = page.locator('.fui-calendar[data-mode="range"]');
  await day(calendar, "2026-11-23").click();
  await expect(calendar).toHaveAttribute("data-range", "partial");
  await day(calendar, "2026-12-03").hover();
  await expect(calendar).toHaveAttribute("data-preview", "");
  await expect(calendar.locator("[data-range-middle]")).toHaveCount(9);
  await day(calendar, "2026-12-03").click();
  await expect(calendar).toHaveAttribute("data-range", "complete");
  await expect(calendar.locator("td[aria-selected=true]")).toHaveCount(11);
});

test("date picker: opens on the chosen day, Enter chooses and closes, focus returns, the form gets yyyy-mm-dd", async ({ page }) => {
  await open(page, "tests-dates--pickers");
  const trigger = page.getByRole("button", { name: "Due date" }).first();
  await expect(trigger).toContainText("12 Nov 2026");
  await trigger.click();
  const popover = page.locator(".fui-date-picker-popover");
  await expect(popover).toBeVisible();
  await expect(day(popover, "2026-11-12")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(popover).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toContainText("13 Nov 2026");
  await expect(page.locator('input[type=hidden][name="due"]')).toHaveValue("2026-11-13");
  await trigger.click();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Escape");
  await expect(popover).toBeHidden();
  await expect(trigger).toContainText("13 Nov 2026");
  await page.locator(".fui-date-picker").first().getByRole("button", { name: "Clear date" }).click();
  await expect(trigger).toContainText("Pick a date");
  await expect(page.locator('input[type=hidden][name="due"]')).toHaveValue("");
});

test("date range picker: the second choice ends the range and closes; the trigger reads the range", async ({ page }) => {
  await open(page, "tests-dates--pickers");
  const trigger = page.getByRole("button", { name: "Report period" });
  await trigger.click();
  const popover = page.locator(".fui-date-picker-popover");
  await day(popover, "2026-11-10").click();
  await expect(popover).toBeVisible();
  await day(popover, "2026-11-14").click();
  await expect(popover).toBeHidden();
  await expect(trigger).toContainText(/10\s?–\s?14 Nov 2026/);
});

for (const theme of ["light", "dark"])
  test(`the open date picker, ${theme}`, async ({ page }) => {
    await open(page, "tests-dates--pickers", theme);
    await page.getByRole("button", { name: "Trip" }).click();
    const popover = page.locator(".fui-date-picker-popover");
    await expect(day(popover, "2026-12-21")).toBeFocused();
    await expect(popover).toHaveScreenshot(`date-range-picker-${theme}.png`);
  });
