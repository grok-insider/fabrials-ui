import { expect, test, type Page } from "@playwright/test";
import { openPreview, setLoading } from "./support";

/*
 * Host opt-outs (data-skeleton), on the card preview, in all three engines:
 * - keep: the part paints as it does without loading (its colour, its text,
 *   no bar), apart from colour, which Loading removes everywhere;
 * - hide: its space stays and nothing paints there;
 * - block: one uniform neutral block;
 * - fill: a solid shape, like a button, with no bar inside.
 */
// A clip of the page, not an element screenshot: those wait for the element to be visible.
const shot = async (page: Page, selector: string) => {
  const box = (await page.locator(`.docs-preview-stage ${selector}`).boundingBox())!;
  return (await page.screenshot({ clip: box, animations: "disabled" })).toString("base64");
};
const mark = (page: Page, selector: string, value: string) =>
  page.evaluate(([selector, value]) => document.querySelector(`.docs-preview-stage ${selector}`)!.setAttribute("data-skeleton", value), [selector, value]);
// Kept text may antialias differently once its layer blends; count only real changes in lightness.
const compare = (page: Page, a: string, b: string) => page.evaluate(([a, b]) => window.__lqa.compare(a, b, 0.15), [a, b] as const);

const title = "[data-slot=\"card-title\"]";
const description = "[data-slot=\"card-description\"]";
const content = "[data-slot=\"card-content\"]";

test("keep, hide and block", async ({ page }) => {
  await openPreview(page, "card");
  await mark(page, title, "keep");
  await mark(page, description, "hide");
  await mark(page, content, "block");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  const kept = await shot(page, title);
  const colour = await page.locator(`.docs-preview-stage ${title}`).evaluate((el) => getComputedStyle(el).color);
  await setLoading(page, true);

  const keep = await compare(page, kept, await shot(page, title));
  expect(keep.differ, "a kept part paints as usual").toBeLessThan(0.02);
  expect(await page.locator(`.docs-preview-stage ${title}`).evaluate((el) => getComputedStyle(el).color)).toBe(colour);

  const hidden = await compare(page, kept, await shot(page, description));
  expect(hidden.spread, "a hidden part paints nothing").toBeLessThan(0.02);

  const block = await compare(page, kept, await shot(page, content));
  expect(block.spread, "a block is one colour").toBeLessThan(0.02);
  const surface = await page.locator(`.docs-preview-stage ${content}`).evaluate((el) => getComputedStyle(el).getPropertyValue("--fui-skeleton-surface"));
  expect(surface).not.toBe("");
});

test("fill", async ({ page }) => {
  await openPreview(page, "card");
  await mark(page, description, "fill");
  await setLoading(page, true);
  const png = await shot(page, description);
  const fill = await compare(page, png, png);
  expect(fill.spread, "a filled part is one solid shape, with no bar inside").toBeLessThan(0.02);
});
