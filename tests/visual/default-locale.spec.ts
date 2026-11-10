// 0.12's house rule in a real browser: a reader whose own language writes numbers and dates differently still sees the same
// English text a server would print, until a product asks for their language once with a `LabelsProvider`. Each test runs with
// a Spanish or Japanese reader and fails on any console error or hydration complaint.
import { expect, test, type Page } from "@playwright/test";

const BENCH = "/iframe.html?id=tests-default-locale--pieces&viewMode=story";
const LABELS = "/iframe.html?id=tests-labels--pieces&viewMode=story";
const CALENDARS = "/iframe.html?id=tests-labels--calendars&viewMode=story";
const HYDRATION = "/iframe.html?id=tests-foundations-0-12--local-time-default-hydration&viewMode=story";

/** Every console error, and every word about hydration, from a fresh page: a mismatch must never pass quietly. */
function complaints(page: Page) {
  const found: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || /hydrat|didn't match|did not match/i.test(message.text())) found.push(message.text());
  });
  page.on("pageerror", (error) => found.push(String(error)));
  return found;
}

async function open(page: Page, story: string, theme = "light") {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto(`${story}&globals=theme:${theme}`);
  await expect(page.locator("#storybook-root")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

test.describe("a reader whose browser is Spanish", () => {
  test.use({ locale: "es-ES", timezoneId: "Europe/Madrid" });

  test("every piece that writes a number, a date or a time writes English, and one provider turns it Spanish", async ({ page }) => {
    const found = complaints(page);
    await open(page, BENCH);
    const english = page.locator('[data-locale-frame="english"]');
    const spanish = page.locator('[data-locale-frame="spanish"]');

    // A month in English, the week starting on Sunday as English does, a day "Nov 10, 2026", 12-hour times with AM and PM.
    await expect(english.locator('[data-piece="calendar"]')).toContainText("November 2026");
    await expect(english.locator('[data-piece="calendar"] thead th').first()).toHaveText("Mon");
    await expect(english.locator('[data-piece="date-picker"]')).toContainText("Nov 10, 2026");

    // A spreadsheet: the numbers as typed, a date in English, a date and time with AM.
    await expect(english.locator('[data-piece="spreadsheet"]')).toContainText("Jan 5, 2026");
    await expect(english.locator('[data-piece="spreadsheet"]')).toContainText("41250");
    await expect(english.locator('[data-piece="spreadsheet"]')).toContainText("Jan 15, 2026, 9:30 AM");

    // Relative and absolute times in English, and the stamp of a message.
    await expect(english.locator('[data-piece="relative"]')).toHaveText("Sep 27, 2026 · 3 minutes ago");
    await expect(english.locator('[data-piece="stamp"]')).toHaveText("Sep 27, 9:31 AM");
    await expect(english.locator('[data-piece="local-time"]')).toHaveText("Sep 27, 2026, 9:31 AM");

    // Sizes, counts and percentages: a decimal point, a comma for the group, a bare per cent sign, no Spanish digits.
    await expect(english.locator('[data-piece="sizes"]')).toHaveText("25 MB · 1.5 kB");
    await expect(english.locator('[data-piece="counts"]')).toContainText("12.5K");
    await expect(english.locator('[data-piece="counts"]')).toContainText("281");
    await expect(english.locator('[data-piece="meters"]')).toContainText("64%");
    await expect(english.locator('[data-piece="accounts"]')).toContainText("$2.56");
    await expect(english.locator('[data-piece="accounts"]')).toContainText("322,560");

    // The provider: Spanish month, Spanish digits, a space before the per cent sign, Spanish currency.
    await expect(spanish.locator('[data-piece="calendar"]')).toContainText("noviembre de 2026");
    await expect(spanish.locator('[data-piece="relative"]')).toHaveText("27 sept 2026 · hace 3 minutos");
    await expect(spanish.locator('[data-piece="counts"]')).toContainText("12,5 mil");
    await expect(spanish.locator('[data-piece="meters"]')).toContainText("64 %");
    await expect(spanish.locator('[data-piece="accounts"]')).toContainText("2,56 US$");
    await expect(spanish.locator('[data-piece="accounts"]')).toContainText("322.560");
    await expect(spanish.locator('[data-piece="spreadsheet"]')).toContainText("5 ene 2026");

    expect(found).toEqual([]);
  });

  test("the labels bench and the plain calendar are English until the provider says otherwise", async ({ page }) => {
    const found = complaints(page);
    await open(page, LABELS);
    const english = page.locator('[data-labels-frame="english"]');
    const spanish = page.locator('[data-labels-frame="spanish"]');
    // A count in the compact form, a size and a percentage in the English shape.
    await expect(english).toContainText("12.5K");
    await expect(english).toContainText("PDF · 2.3 MB");
    await expect(english).toContainText("29%");
    // The provider's Spanish.
    await expect(spanish).toContainText("12,5 mil");
    await expect(spanish).toContainText("PDF · 2,3 MB");
    await expect(spanish).toContainText("29 %");

    // A calendar with no locale: English names and the English week, in a Spanish browser.
    await open(page, CALENDARS);
    const plain = page.locator('[data-calendar="plain"]');
    await expect(plain).toContainText("November 2026");
    await expect(plain.locator("th").first()).toHaveText("Sun");
    // A provider of its own still wins, here Japanese.
    await expect(page.locator('[data-calendar="japanese"]')).toContainText("2026年11月");
    expect(found).toEqual([]);
  });

  test("the same page in the dark theme writes the same words", async ({ page }) => {
    const found = complaints(page);
    await open(page, BENCH, "dark");
    const english = page.locator('[data-locale-frame="english"]');
    await expect(english.locator('[data-piece="calendar"]')).toContainText("November 2026");
    await expect(english.locator('[data-piece="relative"]')).toHaveText("Sep 27, 2026 · 3 minutes ago");
    expect(found).toEqual([]);
  });
});

test.describe("a reader whose browser is Japanese, in Tokyo", () => {
  test.use({ locale: "ja-JP", timezoneId: "Asia/Tokyo" });

  test("a time has the same shape before and after hydration: English, with the reader's zone arriving at once", async ({ page }) => {
    const found = complaints(page);
    await open(page, HYDRATION);
    const report = page.getByTestId("hydration-report");
    await expect(report).not.toHaveText("measuring");

    type Box = { text: string; width: number; height: number; hidden: boolean; title: string | null };
    const { before, after, afterTop, errors } = JSON.parse((await report.textContent())!) as {
      before: Record<string, Box>;
      after: Record<string, Box>;
      afterTop: [number, number];
      errors: string[];
    };

    // What the server sent: the instant in UTC, in English, hidden, and with no tooltip to read the server's zone from.
    expect(before["reader-time"]).toMatchObject({ text: "7:31 AM", hidden: true, title: null });
    expect(before["reader-date-time"]).toMatchObject({ text: "Sep 27, 2026, 7:31 AM", hidden: true, title: null });
    // What the reader sees: Tokyo's time, still English, in the same 12-hour shape.
    expect(after["reader-time"]).toMatchObject({ text: "4:31 PM", hidden: false });
    expect(after["reader-date-time"]).toMatchObject({ text: "Sep 27, 2026, 4:31 PM", hidden: false });
    expect(after["reader-time"]!.title).toMatch(/^Sunday, September 27, 2026 at 4:31:00 PM GMT\+9$/);

    // Nothing moves: same height, and a width that differs only by the digits ("7" and "A" against "4" and "P").
    for (const name of ["reader-time", "reader-date-time"]) {
      expect(before[name]!.width).toBeGreaterThan(20);
      expect(Math.abs(after[name]!.width - before[name]!.width)).toBeLessThan(4);
      expect(after[name]!.height).toBe(before[name]!.height);
    }
    expect(Math.abs(afterTop[1] - afterTop[0])).toBeLessThan(0.5);

    // A time with a zone of its own is the same before and after, and was never hidden.
    expect(before["fixed-time"]).toMatchObject({ text: "9:31 AM", hidden: false });
    expect(after["fixed-time"]).toEqual(before["fixed-time"]);

    expect(errors).toEqual([]);
    expect(found).toEqual([]);
  });

  test("the pieces are English in Tokyo too, and the zone is the reader's", async ({ page }) => {
    const found = complaints(page);
    await open(page, BENCH);
    const english = page.locator('[data-locale-frame="english"]');
    await expect(english.locator('[data-piece="calendar"]')).toContainText("November 2026");
    await expect(english.locator('[data-piece="local-time"]')).toHaveText("Sep 27, 2026, 4:31 PM");
    expect(found).toEqual([]);
  });
});
