import { expect, test, type Page } from "@playwright/test";
import { componentSlugs, openPreview, settle, shiftOnToggle, summarise } from "./support";

/*
 * (a) Zero shift with content the demo did not plan for. Each variation is
 * applied to the live preview before toggling (text nodes rewritten, rows
 * duplicated, the container narrowed, positioned elements added), measured
 * with loading on and off, then undone. Every slug, 1440 px, light theme, in
 * all three engines.
 */
const long = "Placeholder copy that runs much longer than anyone designed the component for, ".repeat(4).trim();
const text: Record<string, string> = {
  empty: "",
  "one character": "M",
  "very long": long,
  "one 60-character word": "Incomprehensibilities".repeat(3).slice(0, 60),
  CJK: "骨架屏加载中的内容保持原有布局不会移动位置",
  "RTL Arabic": "جارٍ تحميل المحتوى، ولا شيء يتحرك",
  emoji: "📦 🚀 ✅ 🔒 🗞️",
};

type Variation = { name: string; apply: (page: Page) => Promise<unknown>; undo: (page: Page) => Promise<unknown> };
const variations: Variation[] = [
  ...Object.entries(text).map(([name, value]) => ({
    name: `text: ${name}`,
    apply: (page: Page) => page.evaluate((v) => window.__lqa.mutateText(v), value),
    undo: (page: Page) => page.evaluate(() => window.__lqa.restoreText()),
  })),
  {
    name: "duplicated rows",
    apply: (page) => page.evaluate(() => window.__lqa.duplicateRows()),
    undo: (page) => page.evaluate(() => window.__lqa.removeDuplicates()),
  },
  {
    name: "narrow container (280 px)",
    apply: (page) => page.evaluate(() => window.__lqa.narrow(280)),
    undo: (page) => page.evaluate(() => window.__lqa.narrow(null)),
  },
  {
    name: "narrow container with very long text",
    apply: (page) => page.evaluate((v) => (window.__lqa.narrow(280), window.__lqa.mutateText(v)), long),
    undo: (page) => page.evaluate(() => (window.__lqa.narrow(null), window.__lqa.restoreText())),
  },
  {
    name: "fixed and absolute descendants",
    apply: (page) => page.evaluate(() => window.__lqa.positioned(true)),
    undo: (page) => page.evaluate(() => window.__lqa.positioned(false)),
  },
];

for (const slug of componentSlugs())
  test(`zero shift with variations ${slug}`, async ({ page }) => {
    await openPreview(page, slug, { clock: true });
    for (const variation of variations) {
      await variation.apply(page);
      await settle(page);
      const result = await shiftOnToggle(page);
      expect.soft(summarise(result.on), `${slug} ${variation.name}: boxes moved when loading turned on`).toEqual([]);
      expect.soft(summarise(result.off), `${slug} ${variation.name}: boxes moved when loading turned off`).toEqual([]);
      await variation.undo(page);
    }
  });
