import { expect, test } from "@playwright/test";

// The suite's browser hides every scrollbar, so nothing in it can see a rail drawn over one. This file runs with scrollbars
// that take room, as a desktop browser on Windows or Linux has them.
test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });

const BENCH = "/iframe.html?id=tests-conversation--pieces&viewMode=story";

test("the rail stands clear of the log's scrollbar, on either side", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${BENCH}&globals=theme:light`);
  await expect(page.locator("#storybook-root h1").first()).toBeVisible({ timeout: 20_000 });

  for (const scope of [".fui-conversation", '[dir="rtl"] .fui-conversation']) {
    const board = page.locator(scope).first();
    await expect(board.locator(".fui-conversation-rail")).toBeVisible();
    const read = () =>
      board.evaluate((root) => {
        const log = root.querySelector<HTMLElement>(":scope > .fui-conversation-content")!;
        const rail = root.querySelector<HTMLElement>(":scope > .fui-conversation-rail")!.getBoundingClientRect();
        const box = log.getBoundingClientRect();
        const bar = log.offsetWidth - log.clientWidth;
        const rtl = getComputedStyle(root).direction === "rtl";
        // The scrollbar is on the end side: the right edge left to right, the left edge right to left.
        const gap = rtl ? rail.left - (box.left + bar) : box.right - bar - rail.right;
        const column = root.querySelector<HTMLElement>(".fui-conversation-column")!;
        const style = getComputedStyle(column);
        const words = column.getBoundingClientRect();
        const text = rtl ? rail.left - (words.left + Number.parseFloat(style.paddingInlineEnd)) : words.right - Number.parseFloat(style.paddingInlineEnd) - rail.left;
        return { bar, gap, text, published: root.style.getPropertyValue("--fui-conversation-scrollbar") };
      });
    await expect.poll(async () => (await read()).published).not.toBe("");
    const { bar, gap, text, published } = await read();
    // This browser's scrollbar takes room, the conversation says how much, and the rail starts 8 px inside it.
    expect(bar).toBeGreaterThan(0);
    expect(published).toBe(`${bar}px`);
    expect(gap).toBeGreaterThanOrEqual(7.5);
    expect(gap).toBeLessThanOrEqual(8.5);
    // And the words still end before the rail begins.
    expect(text).toBeLessThanOrEqual(-3.5);
  }
});
