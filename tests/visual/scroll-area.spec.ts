// ScrollArea in a real browser: a tab stop with its ring drawn inside the region, keys that scroll it, edges that fade only
// where there is more, and a round thumb that deepens under the pointer. Assertions read state and geometry, never pixels.
import { expect, test, type Page } from "@playwright/test";

const open = async (page: Page, args = "") => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`/iframe.html?id=components-scroll-area--playground&viewMode=story&globals=theme:light${args ? `&args=${args}` : ""}`);
  await expect(page.getByRole("listitem").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
};

test("while it overflows the region is a tab stop: its ring is drawn inside it and the keys scroll it", async ({ page }) => {
  await open(page);
  const viewport = page.locator(".fui-scroll-area-viewport");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("region", { name: "Labels" })).toBeFocused();
  const ring = await page.locator(".fui-scroll-area").evaluate((node) => {
    const style = getComputedStyle(node);
    return `${style.outlineStyle} ${style.outlineWidth} ${style.outlineOffset}`;
  });
  expect(ring).toBe("solid 2px -2px");
  await page.keyboard.press("End");
  await expect.poll(() => viewport.evaluate((node) => node.scrollHeight - node.clientHeight - node.scrollTop)).toBeLessThan(1);
  await page.keyboard.press("Home");
  await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBe(0);
  // A pointer click does not draw the ring.
  await page.mouse.click(5, 5);
  await viewport.click();
  expect(await page.locator(".fui-scroll-area").evaluate((node) => getComputedStyle(node).outlineStyle)).toBe("none");
});

test("fade: the end fades while there is more after it, the start only once there is more before it", async ({ page }) => {
  await open(page);
  const viewport = page.locator(".fui-scroll-area-viewport");
  const mask = () => viewport.evaluate((node) => getComputedStyle(node).maskImage);
  // The first gradient runs down the region: an opaque stop where the top fade ends, another where the bottom fade begins.
  const vertical = async () => (await mask()).split("linear-gradient(")[1] ?? "";
  // At the top: no fade above (opaque from 0) and 2rem (32 px) of fade below.
  await expect.poll(vertical).toMatch(/\) 0px, .*\) calc\(100% - 32px\), /);
  await viewport.evaluate((node) => node.scrollTo({ top: 60 }));
  await expect.poll(vertical).toMatch(/\) 32px, .*\) calc\(100% - 32px\), /);
  await viewport.evaluate((node) => node.scrollTo({ top: node.scrollHeight }));
  await expect.poll(vertical).toMatch(/\) 32px, .*\) (100%|calc\(100% - 0px\)), /);
  // Without fade there is no mask.
  await open(page, "fade:!false");
  expect(await mask()).toBe("none");
});

test("the thumb is round and deepens while the pointer is over the region, and again under the pointer", async ({ page }) => {
  await open(page);
  const thumb = page.locator(".fui-scrollbar-thumb");
  const ink = () => thumb.evaluate((node) => getComputedStyle(node).backgroundColor);
  const box = (await thumb.boundingBox())!;
  expect(box.width).toBeCloseTo(6, 0);
  expect(await thumb.evaluate((node) => parseFloat(getComputedStyle(node).borderTopLeftRadius))).toBeGreaterThanOrEqual(3);
  await page.mouse.move(1200, 850);
  const rest = await ink();
  await page.locator(".fui-scroll-area").hover({ position: { x: 40, y: 40 } });
  await expect.poll(ink).not.toBe(rest);
  const over = await ink();
  await thumb.hover();
  await expect.poll(ink).not.toBe(over);
});
