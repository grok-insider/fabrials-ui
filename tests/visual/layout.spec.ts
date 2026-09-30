// Layout facts that differ by engine or by width, read as computed geometry in chromium, firefox and webkit
// (the pinned container has all three): NativeRadioGroup grid columns (0.8.1) and DescriptionList auto layout (0.8.1).
// The engines are launched here because Playwright cannot switch browserName inside a describe group.
import { expect, test, chromium, firefox, webkit, type Browser, type Page } from "@playwright/test";

const engines = { chromium, firefox, webkit } as const;
const base = `http://127.0.0.1:${process.env.STORYBOOK_PORT ?? "6041"}`;

async function open(page: Page, id: string, width: number) {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=theme:light`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

let browser: Browser;
async function launchPage(engine: keyof typeof engines) {
  browser = await engines[engine].launch();
  return (await browser.newContext({ reducedMotion: "reduce" })).newPage();
}
test.afterEach(async () => {
  await browser?.close();
});

for (const engine of Object.keys(engines) as (keyof typeof engines)[]) {
  test.describe(`${engine}`, () => {
    test("a native radio grid with long labels drops to fewer columns and no label is cut or overlapped", async () => {
      const page = await launchPage(engine);
      const read = (frame: string) =>
        page.locator(`[data-frame="${frame}"] .fui-native-radio-options`).evaluate((grid) => {
          const boxes = [...grid.querySelectorAll("label")].map((label) => {
            const box = label.getBoundingClientRect();
            const text = label.querySelector(":scope > span") as HTMLElement;
            return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, cut: text.scrollWidth > text.clientWidth + 1 };
          });
          const overlap = boxes.some((a, index) => boxes.slice(index + 1).some((b) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5));
          const columns = new Set(boxes.map((box) => Math.round(box.left))).size;
          return { columns, overlap, cut: boxes.some((box) => box.cut), overflow: grid.scrollWidth - grid.clientWidth, template: getComputedStyle(grid).gridTemplateColumns.split(" ").length };
        });
      // A 320 px window: the pane has no room for two 9rem columns, so it is one column.
      await open(page, "fabrials-controls--native-radio-grid", 320);
      expect(await read("default")).toMatchObject({ columns: 1, overlap: false, cut: false, overflow: 0, template: 1 });
      // A 390 px window: two columns by default, one when the group sets a wider minimum; the wide pane keeps two.
      await open(page, "fabrials-controls--native-radio-grid", 390);
      expect(await read("default")).toMatchObject({ columns: 2, overlap: false, cut: false, overflow: 0, template: 2 });
      expect(await read("wide-min")).toMatchObject({ columns: 1, overlap: false, cut: false, overflow: 0, template: 1 });
      expect(await read("wide")).toMatchObject({ columns: 2, overlap: false, cut: false, overflow: 0 });
      // A 1440 px window: the 358 px pane still has two columns of 9rem, the 640 px pane has four; the floor never adds columns.
      await open(page, "fabrials-controls--native-radio-grid", 1440);
      expect(await read("default")).toMatchObject({ columns: 2, overlap: false, cut: false });
      expect(await read("wide")).toMatchObject({ columns: 4, overlap: false, cut: false });
    });

    test("the default minimum is what it was for short labels: four columns of the 640 px frame, as it always was", async () => {
      const page = await launchPage(engine);
      await open(page, "fabrials-controls--field-sets", 1440);
      const columns = await page.locator(".fui-native-radio-options[data-layout='grid']").first().evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length);
      expect(columns).toBe(4);
    });
  });
}
