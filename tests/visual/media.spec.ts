// The viewer, the mosaic and the image frames in a real browser: opening, the keyboard, zoom to real size, focus return.
import { expect, test, type Page } from "@playwright/test";

const open = async (page: Page, id: string, width = 1440) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=theme:light`);
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
};

test("a mosaic tile opens the viewer on its item; arrows move, Home and End go to the ends; Escape returns focus to the tile", async ({ page }) => {
  await open(page, "tests-media--images");
  const tile = page.getByRole("button", { name: /Orchard terraces on the north side \(2 of 4\)/ });
  await tile.click();
  const viewer = page.getByRole("dialog", { name: "Photos, 2 of 4" });
  await expect(viewer).toBeVisible();
  await expect(viewer.getByRole("img", { name: "Orchard terraces on the north side" })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("dialog", { name: "Photos, 3 of 4" })).toBeVisible();
  await page.keyboard.press("End");
  await expect(page.getByRole("dialog", { name: "Photos, 4 of 4" })).toBeVisible();
  await page.keyboard.press("Home");
  await expect(page.getByRole("dialog", { name: "Photos, 1 of 4" })).toBeVisible();
  await expect(page.getByRole("group", { name: "All items" }).getByRole("button").first()).toHaveAttribute("aria-current", "true");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(tile).toBeFocused();
});

test("zoom: Z brings the image to its real size around the middle, the arrows look around, Z fits it again", async ({ page }) => {
  await open(page, "tests-media--viewer");
  const viewer = page.getByRole("dialog", { name: "Photos, 1 of 6" });
  const image = viewer.getByRole("img", { name: "A harbour at dusk under a pale sun" });
  await expect(image).toBeVisible();
  const zoom = viewer.getByRole("button", { name: "Real size" });
  await expect(zoom).toBeEnabled();
  const fitted = (await image.boundingBox())!.width;
  await page.keyboard.press("z");
  await expect(page.locator(".fui-viewer")).toHaveAttribute("data-zoomed", "");
  await expect(viewer.getByRole("button", { name: "Fit to screen" })).toHaveAttribute("aria-pressed", "true");
  expect((await image.boundingBox())!.width).toBeGreaterThan(fitted * 1.5);
  const stage = page.locator(".fui-viewer-stage");
  const before = await stage.evaluate((element) => ({ left: element.scrollLeft, top: element.scrollTop }));
  expect(before.left).toBeGreaterThan(0);
  await page.keyboard.press("ArrowRight");
  const after = await stage.evaluate((element) => element.scrollLeft);
  expect(after).toBeGreaterThan(before.left);
  await expect(page.getByRole("dialog", { name: "Photos, 1 of 6" })).toBeVisible();
  await page.keyboard.press("z");
  await expect(page.locator(".fui-viewer")).not.toHaveAttribute("data-zoomed", "");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("dialog", { name: "Photos, 2 of 6" })).toBeVisible();
});

test("a click on the image zooms where it was pressed; the viewer is dark in the light theme", async ({ page }) => {
  await open(page, "tests-media--viewer");
  const image = page.getByRole("img", { name: "A harbour at dusk under a pale sun" });
  await expect(image).toBeVisible();
  const box = (await image.boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.9, box.y + box.height * 0.5);
  await expect(page.locator(".fui-viewer")).toHaveAttribute("data-zoomed", "");
  const scroll = await page.locator(".fui-viewer-stage").evaluate((element) => element.scrollLeft / (element.scrollWidth - element.clientWidth));
  expect(scroll).toBeGreaterThan(0.75);
  const background = await page.locator(".fui-viewer").evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(background).toMatch(/^(rgb\(\s*[0-9]\D|oklch\(0\.1)/);
});

test("people: a group folds the rest into a count named in full; a badge says its status", async ({ page }) => {
  await open(page, "tests-media--people");
  await expect(page.getByRole("img", { name: "3 more" }).first()).toHaveText("+3");
  await expect(page.getByRole("img", { name: "Busy" })).toBeVisible();
  await expect(page.getByRole("img", { name: "3 unread" })).toHaveText("3");
});

test("an image that fails says what it was", async ({ page }) => {
  await open(page, "tests-media--images");
  const failed = page.locator('.fui-image[data-state="error"]');
  await expect(failed).toHaveCount(1);
  await expect(failed.getByRole("img", { name: "The night shift roster" })).toBeVisible();
});
