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

test("the wheel zooms by steps around the pointer and back; a drag with the left button looks around; a click fits it", async ({ page }) => {
  await open(page, "tests-media--viewer");
  const viewer = page.locator(".fui-viewer");
  const stage = page.locator(".fui-viewer-stage");
  const image = page.getByRole("img", { name: "A harbour at dusk under a pale sun" });
  await expect(page.getByRole("button", { name: "Real size" })).toBeEnabled();
  const readout = page.locator(".fui-viewer-zoom");
  const level = async () => Number.parseInt((await readout.textContent()) ?? "", 10);
  const fitted = await level();
  expect(fitted).toBeGreaterThan(10);
  expect(fitted).toBeLessThan(100);
  const box = (await image.boundingBox())!;
  const at = { x: box.x + box.width * 0.7, y: box.y + box.height * 0.3 };
  const under = () =>
    image.evaluate((element, point) => {
      const frame = element.getBoundingClientRect();
      return { fx: (point.x - frame.left) / frame.width, fy: (point.y - frame.top) / frame.height };
    }, at);
  await page.mouse.move(at.x, at.y);
  const levels = [fitted];
  // The first notch grows the picture around the pointer as far as the stage can scroll; from then on the point under the
  // pointer stays exactly under it.
  let kept = { fx: 0.7, fy: 0.3 };
  for (let notch = 0; notch < 3; notch += 1) {
    await page.mouse.wheel(0, -100);
    await expect.poll(level).toBeGreaterThan(levels.at(-1)!);
    levels.push(await level());
    const point = await under();
    const tolerance = notch === 0 ? 0.05 : 0.005;
    expect(Math.abs(point.fx - kept.fx)).toBeLessThan(tolerance);
    expect(Math.abs(point.fy - kept.fy)).toBeLessThan(tolerance);
    kept = point;
  }
  await expect(viewer).toHaveAttribute("data-zoomed", "");
  expect(levels[2]! / levels[1]!).toBeGreaterThan(1.2);
  expect(levels[2]! / levels[1]!).toBeLessThan(1.3);

  const before = await stage.evaluate((element) => ({ left: element.scrollLeft, top: element.scrollTop }));
  await page.mouse.down();
  await page.mouse.move(at.x - 200, at.y - 100, { steps: 8 });
  await page.mouse.up();
  const after = await stage.evaluate((element) => ({ left: element.scrollLeft, top: element.scrollTop }));
  expect(Math.abs(after.left - before.left - 200)).toBeLessThan(2);
  expect(Math.abs(after.top - before.top - 100)).toBeLessThan(2);
  await expect(viewer).toHaveAttribute("data-zoomed", "");
  expect(await level()).toBe(levels.at(-1));

  for (let notch = 0; notch < 8; notch += 1) await page.mouse.wheel(0, 100);
  await expect(viewer).not.toHaveAttribute("data-zoomed", "");
  await expect(readout).toHaveText(`${fitted}%`);
  expect(await stage.evaluate((element) => element.scrollLeft + element.scrollTop)).toBe(0);

  await page.mouse.wheel(0, -100);
  await expect(viewer).toHaveAttribute("data-zoomed", "");
  await page.mouse.click(at.x, at.y);
  await expect(viewer).not.toHaveAttribute("data-zoomed", "");
  await expect(page.getByRole("dialog", { name: "Photos, 1 of 6" })).toBeVisible();
});

test("+ and − step the zoom, 0 fits, and a right click does not start a drag", async ({ page }) => {
  await open(page, "tests-media--viewer");
  const viewer = page.locator(".fui-viewer");
  const readout = page.locator(".fui-viewer-zoom");
  await expect(page.getByRole("button", { name: "Real size" })).toBeEnabled();
  const fitted = await readout.textContent();
  await page.keyboard.press("+");
  await expect(viewer).toHaveAttribute("data-zoomed", "");
  await expect(readout).not.toHaveText(fitted!);
  await page.keyboard.press("-");
  await expect(viewer).not.toHaveAttribute("data-zoomed", "");
  await expect(readout).toHaveText(fitted!);
  await page.keyboard.press("+");
  await page.keyboard.press("+");
  const stage = page.locator(".fui-viewer-stage");
  const box = (await stage.boundingBox())!;
  const before = await stage.evaluate((element) => element.scrollLeft);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down({ button: "right" });
  await page.mouse.move(box.x + box.width / 2 - 150, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up({ button: "right" });
  expect(await stage.evaluate((element) => element.scrollLeft)).toBe(before);
  await page.keyboard.press("0");
  await expect(viewer).not.toHaveAttribute("data-zoomed", "");
  await expect(readout).toHaveText(fitted!);
});

test("fitted, the whole picture is inside the stage, also when the stage is shorter than the picture", async ({ page }) => {
  await open(page, "tests-media--viewer");
  const image = page.getByRole("img", { name: "A harbour at dusk under a pale sun" });
  await expect(page.getByRole("button", { name: "Real size" })).toBeEnabled();
  for (const height of [900, 560]) {
    await page.setViewportSize({ width: 1440, height });
    await expect
      .poll(async () => {
        const [stage, picture] = await Promise.all([page.locator(".fui-viewer-stage").boundingBox(), image.boundingBox()]);
        return (
          picture!.y >= stage!.y - 0.5 &&
          picture!.y + picture!.height <= stage!.y + stage!.height + 0.5 &&
          picture!.x >= stage!.x - 0.5 &&
          picture!.x + picture!.width <= stage!.x + stage!.width + 0.5
        );
      })
      .toBe(true);
  }
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
