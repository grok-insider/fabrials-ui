// The 0.12 media pieces in a real browser: a gallery's columns, the line over a tile, a picture that opens the viewer from
// its group, a broken tile dropped, a finger dragging the picture down, a double click that zooms where it landed, the small
// copy under a picture that is loading, the neighbours asked for, and the name a download saves.
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PIECES = "/iframe.html?id=tests-media-0-12--pieces&viewMode=story";
const VIEWER = "/iframe.html?id=tests-media-0-12--viewer&viewMode=story";
const REMOTE = "/iframe.html?id=tests-media-0-12--viewer-remote&viewMode=story";
const DOUBLE = "/iframe.html?id=tests-media-0-12--double-click&viewMode=story";

// The full pictures of the remote stories are served here, at the size of the small copies, so the two boxes can be compared.
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1500" viewBox="0 0 2400 1500"><rect width="2400" height="1500" fill="#2f4a63"/><circle cx="1700" cy="450" r="180" fill="#e9d8a6"/></svg>`;

async function audit(page: Page) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    } catch (error) {
      if (!String(error).includes("Axe is already running") || attempt === 3) throw error;
      await page.waitForTimeout(200);
    }
  }
}

async function open(page: Page, story = PIECES, width = 1440, theme = "light") {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`${story}&globals=theme:${theme}`);
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

for (const theme of ["light", "dark"]) {
  for (const width of [390, 768, 1440]) {
    test(`media 0.12 ${theme} ${width}`, async ({ page }) => {
      await open(page, PIECES, width, theme);
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark).*$/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const result = await audit(page);
      expect(result.violations).toEqual([]);
      await expect(page).toHaveScreenshot(`media-012-${theme}-${width}.png`, { fullPage: true });
    });
  }
}

// Chrome writes equal tracks as `repeat(4, minmax(0px, 1fr))`, so the count is read from there when it does.
const tracks = (page: Page, name: string) =>
  page.getByRole("group", { name }).locator(".fui-media-grid").evaluate((node) => {
    const value = getComputedStyle(node).gridTemplateColumns;
    const repeated = value.match(/^repeat\((\d+),/);
    if (repeated) return Number(repeated[1]);
    let depth = 0;
    let count = 1;
    for (const character of value) {
      if (character === "(") depth += 1;
      else if (character === ")") depth -= 1;
      else if (character === " " && depth === 0) count += 1;
    }
    return count;
  });

test("a gallery's columns follow how many tiles it has and how wide its container is", async ({ page }) => {
  await open(page, PIECES);
  const wide: Array<[string, number]> = [
    ["1 picture", 1],
    ["2 pictures", 2],
    ["3 pictures", 3],
    ["4 pictures", 2],
    ["5 pictures", 4],
    ["6 pictures", 3],
    ["7 pictures", 4],
    ["8 pictures", 4],
  ];
  for (const [name, count] of wide) expect(await tracks(page, name), name).toBe(count);

  await page.setViewportSize({ width: 390, height: 900 });
  for (const name of ["1 picture", "3 pictures", "4 pictures", "5 pictures", "8 pictures"]) expect(await tracks(page, name), name).toBe(name === "1 picture" ? 1 : 2);
  // An odd count on a narrow container lets the first tile span both columns, so no cell is left empty.
  const gallery = page.getByRole("group", { name: "3 pictures" });
  const [grid, first, second] = await Promise.all([
    gallery.locator(".fui-media-grid").boundingBox(),
    gallery.locator(".fui-media-grid-tile").first().boundingBox(),
    gallery.locator(".fui-media-grid-tile").nth(1).boundingBox(),
  ]);
  expect(first!.width).toBeGreaterThan(grid!.width * 0.95);
  expect(Math.abs(first!.height - (first!.width * 9) / 16)).toBeLessThan(2);
  expect(second!.width).toBeLessThan(grid!.width * 0.55);
});

test("a picture of a group opens the viewer at its own place, with its neighbours, and Escape goes back to it", async ({ page }) => {
  await open(page, PIECES);
  const second = page.getByRole("button", { name: "Open Orchard terraces on the north side" });
  await second.click();
  await expect(page.getByRole("dialog", { name: "Photos, 2 of 3" })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("dialog", { name: "Photos, 3 of 3" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(second).toBeFocused();
});

test("outside a provider a picture is a picture, not a control that does nothing", async ({ page }) => {
  await open(page, PIECES);
  const block = page.locator("section").filter({ hasText: "A picture with no provider" });
  await expect(block.getByRole("button")).toHaveCount(0);
  await expect(block.getByRole("img", { name: "The yard at first light" })).toBeVisible();
});

test("a tile's line comes with the keyboard and stays on a touch screen; a broken tile leaves the grid and the viewer's set", async ({ page }) => {
  await open(page, PIECES);
  const kept = page.getByRole("button", { name: /A harbour at dusk under a pale sun \(1 of 2\)/ });
  const line = page.getByRole("button", { name: /A harbour at dusk under a pale sun \(1 of 2\)/ }).locator(".fui-media-grid-caption");
  expect(await line.evaluate((node) => getComputedStyle(node).opacity)).toBe("0");
  await kept.focus();
  await expect.poll(() => line.evaluate((node) => getComputedStyle(node).opacity)).toBe("1");

  // The picture that fails is gone: two tiles, named of two, and the viewer's set is those two.
  await expect(page.getByText("Gone", { exact: true })).toHaveCount(0);
  await kept.click();
  await expect(page.getByRole("dialog", { name: "Results, 1 of 2" })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("dialog", { name: "Results, 2 of 2" })).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Escape");
  await expect(kept).toBeFocused();
});

const stagePoint = (page: Page, type: string, x: number, y: number) =>
  page.evaluate(
    ({ type, x, y }) => {
      const stage = document.querySelector(".fui-viewer-stage");
      if (!stage) throw new Error("the viewer is not open");
      stage.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          pointerType: "touch",
          isPrimary: true,
          button: 0,
          buttons: type === "pointerup" ? 0 : 1,
          clientX: x,
          clientY: y,
        }),
      );
    },
    { type, x, y },
  );

/** A finger dragging on the stage, one event every 20 ms, so the flick test measures a speed a hand could make. */
async function finger(page: Page, from: { x: number; y: number }, to: { x: number; y: number }, steps = 6) {
  await stagePoint(page, "pointerdown", from.x, from.y);
  for (let step = 1; step <= steps; step += 1) {
    await page.waitForTimeout(20);
    await stagePoint(page, "pointermove", from.x + ((to.x - from.x) * step) / steps, from.y + ((to.y - from.y) * step) / steps);
  }
  await page.waitForTimeout(20);
  await stagePoint(page, "pointerup", to.x, to.y);
}

test.describe("a finger on the viewer", () => {
  test.use({ hasTouch: true });

  const openViewer = async (page: Page) => {
    await open(page, VIEWER);
    await expect(page.getByRole("dialog", { name: "Photos, 1 of 6" })).toBeVisible();
    await expect(page.locator(".fui-viewer-canvas")).toHaveAttribute("data-state", "loaded");
    return (await page.locator(".fui-viewer-stage").boundingBox())!;
  };

  test("dragging the fitted picture down past the threshold closes the viewer", async ({ page }) => {
    const stage = await openViewer(page);
    const middle = { x: stage.x + stage.width / 2, y: stage.y + stage.height / 2 };
    await finger(page, middle, { x: middle.x, y: middle.y + 150 });
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("a short drag springs back and the viewer stays; it is marked while it moves and clean after", async ({ page }) => {
    const stage = await openViewer(page);
    const middle = { x: stage.x + stage.width / 2, y: stage.y + stage.height / 2 };
    await stagePoint(page, "pointerdown", middle.x, middle.y);
    for (let step = 1; step <= 6; step += 1) {
      await page.waitForTimeout(20);
      await stagePoint(page, "pointermove", middle.x, middle.y + (40 * step) / 6);
      if (step === 3) {
        await expect(page.locator(".fui-viewer")).toHaveAttribute("data-dragging", "");
        const moved = await page.locator(".fui-viewer-canvas").evaluate((node) => getComputedStyle(node).translate);
        expect(moved).not.toBe("none");
      }
    }
    await page.waitForTimeout(20);
    await stagePoint(page, "pointerup", middle.x, middle.y + 40);
    await expect(page.locator(".fui-viewer")).toHaveAttribute("data-settling", "");
    await expect(page.getByRole("dialog", { name: "Photos, 1 of 6" })).toBeVisible();
    await expect(page.locator(".fui-viewer")).not.toHaveAttribute("data-dragging", "");
    // The marks of the drag leave once the picture is back in its place.
    await page.waitForTimeout(400);
    await expect(page.locator(".fui-viewer")).not.toHaveAttribute("data-settling", "");
  });

  test("a sideways drag still moves to the neighbour", async ({ page }) => {
    const stage = await openViewer(page);
    const middle = { x: stage.x + stage.width / 2, y: stage.y + stage.height / 2 };
    await finger(page, middle, { x: middle.x - 150, y: middle.y });
    await expect(page.getByRole("dialog", { name: "Photos, 2 of 6" })).toBeVisible();
  });

  test("a mouse drag down does not close it", async ({ page }) => {
    const stage = await openViewer(page);
    const middle = { x: stage.x + stage.width / 2, y: stage.y + stage.height / 2 };
    await page.mouse.move(middle.x, middle.y);
    await page.mouse.down();
    await page.mouse.move(middle.x, middle.y + 200, { steps: 8 });
    await page.mouse.up();
    await expect(page.getByRole("dialog", { name: "Photos, 1 of 6" })).toBeVisible();
    await expect(page.locator(".fui-viewer")).not.toHaveAttribute("data-dragging", "");
  });
});

test("two clicks zoom around the point pressed; a single one does nothing", async ({ page }) => {
  await open(page, DOUBLE);
  const viewer = page.locator(".fui-viewer");
  const image = page.getByRole("img", { name: "A harbour at dusk under a pale sun" });
  await expect(image).toBeVisible();
  const box = (await image.boundingBox())!;
  const at = { x: box.x + box.width * 0.6, y: box.y + box.height * 0.5 };
  await page.mouse.click(at.x, at.y);
  await expect(viewer).not.toHaveAttribute("data-zoomed", "");
  await page.mouse.dblclick(at.x, at.y);
  await expect(viewer).toHaveAttribute("data-zoomed", "");
  const under = await image.evaluate((element, point) => {
    const frame = element.getBoundingClientRect();
    return { x: frame.left + frame.width * 0.6, y: frame.top + frame.height * 0.5, point };
  }, at);
  expect(Math.abs(under.x - at.x)).toBeLessThan(2);
  expect(Math.abs(under.y - at.y)).toBeLessThan(2);
});

test("the small copy stands under the picture until the full one arrives, in the same place and size", async ({ page }) => {
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/media/held.svg", async (route) => {
    await held;
    await route.fulfill({ contentType: "image/svg+xml", body: SVG });
  });
  await page.route("**/media/photo-*.svg", (route) => route.fulfill({ contentType: "image/svg+xml", body: SVG }));
  await open(page, REMOTE);
  const canvas = page.locator(".fui-viewer-canvas");
  await expect(canvas).toHaveAttribute("data-state", "loading");
  const under = page.locator(".fui-viewer-under");
  await expect(under).toBeVisible();
  // No spinner behind a small copy: the copy is what says the picture is on its way.
  await expect(page.locator(".fui-viewer-loading")).toHaveCount(0);
  const before = (await under.boundingBox())!;
  release();
  await expect(canvas).toHaveAttribute("data-state", "loaded");
  const after = (await page.locator("img[data-viewer-image]").boundingBox())!;
  expect(Math.abs(after.width - before.width)).toBeLessThan(1);
  expect(Math.abs(after.height - before.height)).toBeLessThan(1);
  expect(Math.abs(after.x - before.x)).toBeLessThan(1);
  expect(Math.abs(after.y - before.y)).toBeLessThan(1);
});

test("the neighbours are asked for once, when a picture is shown", async ({ page }) => {
  const asked: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/media/")) asked.push(url.pathname);
  });
  await page.route("**/media/*.svg", (route) => route.fulfill({ contentType: "image/svg+xml", body: SVG }));
  await open(page, REMOTE);
  await expect(page.locator(".fui-viewer-canvas")).toHaveAttribute("data-state", "loaded");
  await expect.poll(() => [...new Set(asked)].sort()).toEqual(["/media/held.svg", "/media/photo-2.svg"]);
  expect(asked.filter((path) => path === "/media/photo-2.svg")).toHaveLength(1);
});

test("a download key saves the file the item names, and the credit says who made it", async ({ page }) => {
  await open(page, VIEWER);
  const download = page.getByRole("link", { name: "Download" });
  await expect(download).toHaveAttribute("download", "harbour-at-dusk.svg");
  const credit = page.locator(".fui-viewer-credit");
  await expect(credit).toContainText("Photo: Ada Rivera");
  await expect(credit).toHaveAttribute("dir", "auto");
  const source = page.getByRole("link", { name: "unsplash.com" });
  await expect(source).toHaveAttribute("rel", "noreferrer noopener");
  await expect(source).toHaveAttribute("target", "_blank");
  // It is the label voice, not body text.
  expect(await credit.evaluate((node) => getComputedStyle(node).fontFamily)).toBe(await page.locator(".fui-viewer-count").evaluate((node) => getComputedStyle(node).fontFamily));
});

test("in forced colors a line over a tile keeps its edge and the dots their shape", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await open(page, PIECES);
  const line = page.getByRole("button", { name: /A harbour at dusk under a pale sun \(1 of 2\)/ }).locator(".fui-media-grid-caption");
  await expect.poll(() => line.evaluate((node) => getComputedStyle(node).borderBlockStartWidth)).toBe("1px");
});
