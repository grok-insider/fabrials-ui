// When things move and when they do not: nothing on the first paint, nothing behind a key, and the worst a source can
// send stays inside its piece. Read from a real browser that allows motion: running animations, durations and geometry.
import { expect, test, type Browser, type Locator, type Page } from "@playwright/test";

const port = process.env.STORYBOOK_PORT ?? "6041";
const story = (id: string) => `http://127.0.0.1:${port}/iframe.html?id=${id}&viewMode=story&globals=theme:light`;
const BENCH = "tests-motion-craft--pieces";

async function moving(browser: Browser, id: string, viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({ reducedMotion: "no-preference", viewport });
  const page = await context.newPage();
  await page.goto(story(id));
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return { page, close: () => context.close() };
}

/** The transitions and animations running on the element and everything inside it, by property or name. */
const running = (locator: Locator) =>
  locator.evaluate((node) =>
    node
      .getAnimations({ subtree: true })
      .map((animation) => ("transitionProperty" in animation ? String(animation.transitionProperty) : "animationName" in animation ? String(animation.animationName) : "other"))
      .sort(),
  );

const duration = (locator: Locator) => locator.evaluate((node) => getComputedStyle(node).transitionDuration.split(",")[0]!.trim());

test("a box and a radio that load checked are at rest, and a tick is drawn when a person checks one", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  // Asked in the frame the ticks are first painted: a transition from @starting-style would be running here.
  await page.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as { craftSeen: string[] }).craftSeen = seen;
    const look = () => {
      for (const node of document.querySelectorAll("#craft-box-on .fui-control-indicator, #craft-radio-on .fui-radio-indicator"))
        for (const animation of node.getAnimations({ subtree: true })) seen.push("transitionProperty" in animation ? String(animation.transitionProperty) : "animation");
      requestAnimationFrame(look);
    };
    requestAnimationFrame(look);
  });
  await page.goto(story(BENCH));
  await expect(page.locator("#craft-box-on .fui-control-indicator")).toBeVisible();
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => (window as unknown as { craftSeen: string[] }).craftSeen)).toEqual([]);
  expect(await page.locator("#craft-box-on .fui-control-indicator").evaluate((node) => getComputedStyle(node).scale)).toBe("none");

  // Checked by a person, the tick pops and its stroke is drawn.
  await page.locator("#craft-box-off .fui-checkbox").click();
  const tick = page.locator("#craft-box-off .fui-control-indicator");
  await expect(tick).toBeVisible();
  await expect.poll(() => running(tick), { timeout: 1000, intervals: [10, 20, 20, 30] }).toEqual(expect.arrayContaining(["scale", "stroke-dashoffset"]));
  await page.locator("#craft-radio-off .fui-radio").click();
  await expect.poll(() => running(page.locator("#craft-radio-off .fui-radio-indicator")), { timeout: 1000, intervals: [10, 20, 20, 30] }).toContain("scale");
  await context.close();
});

test("the first tooltip of a row fades in 100 ms and the next one is there at once", async ({ browser }) => {
  const { page, close } = await moving(browser, BENCH);
  await page.getByRole("button", { name: "Copy" }).hover();
  const first = page.locator(".fui-tooltip", { hasText: "Copy the reference" });
  await expect(first).toBeVisible();
  expect(await duration(first)).toBe("0.1s");
  expect(await first.getAttribute("data-instant")).toBeNull();
  await page.getByRole("button", { name: "Share" }).hover();
  const next = page.locator(".fui-tooltip", { hasText: "Share the reference" });
  await expect(next).toBeVisible();
  expect(await next.getAttribute("data-instant")).not.toBeNull();
  expect(await duration(next)).toBe("0s");
  await close();
});

test("a menu comes from its trigger under the pointer in 150 ms, is there at once behind a key, and its rows do not fade", async ({ browser }) => {
  const { page, close } = await moving(browser, BENCH);
  const trigger = page.getByRole("button", { name: "File" });
  await trigger.click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  expect(await duration(menu)).toBe("0.15s");
  // The highlighted row is where the arrow keys are, with no transition to trail behind a held key.
  await page.keyboard.press("ArrowDown");
  const row = page.getByRole("menuitem", { name: "Rename" });
  expect(await row.evaluate((node) => getComputedStyle(node).transitionDuration)).toBe("0s");
  // An entry made of a key with no place to break stays inside the menu, and its shortcut stays whole.
  const [box, entry, shortcut] = await Promise.all([
    menu.boundingBox(),
    page.getByRole("menuitem").first().boundingBox(),
    page.locator(".fui-menu-shortcut").evaluate((node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      return { lines: new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size, right: node.getBoundingClientRect().right };
    }),
  ]);
  expect(entry!.x + entry!.width).toBeLessThanOrEqual(box!.x + box!.width + 0.5);
  expect(shortcut.lines).toBe(1);
  expect(shortcut.right).toBeLessThanOrEqual(box!.x + box!.width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();

  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(menu).toBeVisible();
  expect(await menu.getAttribute("data-instant")).toBe("click");
  expect(await duration(menu)).toBe("0s");
  await close();
});

test("the command palette fades in 100 ms and neither travels nor grows", async ({ browser }) => {
  const { page, close } = await moving(browser, BENCH);
  const samples: string[] = [];
  await page.exposeFunction("craftSample", (value: string) => void samples.push(value));
  await page.evaluate(() => {
    const look = () => {
      const node = document.querySelector(".fui-command-dialog");
      if (node) (window as unknown as { craftSample(value: string): void }).craftSample(getComputedStyle(node).transform);
      requestAnimationFrame(look);
    };
    requestAnimationFrame(look);
  });
  await page.getByRole("button", { name: "Open the palette" }).click();
  const palette = page.locator(".fui-command-dialog");
  await expect(palette).toBeVisible();
  await page.waitForTimeout(300);
  expect(await duration(palette)).toBe("0.1s");
  expect(await duration(page.locator(".fui-backdrop"))).toBe("0.1s");
  // Every frame of its arrival has the same transform: centred, at full size, with no offset down.
  expect(samples.length).toBeGreaterThan(3);
  expect(new Set(samples).size, samples.join(" | ")).toBe(1);
  expect(samples[0]).toMatch(/^matrix\(1, 0, 0, 1, -?[\d.]+, 0\)$/);
  await close();
});

test("folding the sidebar with its key resizes the page at once", async ({ browser }) => {
  const { page, close } = await moving(browser, "tests-sidebar--pieces", { width: 1440, height: 900 });
  const gap = page.locator(".fui-sidebar-gap").first();
  const before = (await gap.boundingBox())!.width;
  await page.locator("body").click({ position: { x: 700, y: 10 } });
  await page.keyboard.press("Control+b");
  await expect(page.locator(".fui-sidebar").first()).toHaveAttribute("data-state", "collapsed");
  // In the frame the state changes the gap is already its new width: nothing is on its way there.
  const after = await gap.evaluate((node) => ({ width: node.getBoundingClientRect().width, moving: node.getAnimations().length }));
  expect(after.moving).toBe(0);
  expect(after.width).toBeLessThan(before);
  expect(await page.locator(".fui-sidebar-container").first().evaluate((node) => node.getAnimations().length)).toBe(0);
  await close();
});

test("a number is there at first paint and rolls when it changes", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const close = () => context.close();
  // Watched from the frame it is first painted: a number that counted up to its value would be moving here.
  await page.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as { craftRolled: string[] }).craftRolled = seen;
    const look = () => {
      for (const node of document.querySelectorAll("#craft-ticker .fui-ticker-column"))
        for (const animation of node.getAnimations()) seen.push("transitionProperty" in animation ? String(animation.transitionProperty) : "animation");
      if (!document.querySelector("[data-craft-changed]")) requestAnimationFrame(look);
    };
    requestAnimationFrame(look);
  });
  await page.goto(story(BENCH));
  const ticker = page.locator("#craft-ticker .fui-ticker");
  await expect(ticker).toBeVisible();
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => (window as unknown as { craftRolled: string[] }).craftRolled)).toEqual([]);
  await page.evaluate(() => document.body.setAttribute("data-craft-changed", ""));
  const places = () =>
    ticker.locator(".fui-ticker-column").evaluateAll((columns) =>
      columns.map((column) => {
        const style = getComputedStyle(column);
        const matrix = style.transform.match(/^matrix\(([^)]+)\)$/);
        const dy = matrix ? Number(matrix[1]!.split(",")[5]) : 0;
        return Math.round(-dy / (1.1 * parseFloat(style.fontSize))) || 0;
      }),
    );
  // Already on 1, 2, 4, 8, 0 and at rest: it did not count up to get there.
  expect(await places()).toEqual([1, 2, 4, 8, 0]);
  expect(await running(ticker)).toEqual([]);
  await page.getByRole("button", { name: "A day of traffic arrives" }).click();
  await expect(ticker.locator(".fui-sr-only")).toHaveText("13,617");
  expect(await running(ticker)).toContain("transform");
  expect(await ticker.locator(".fui-ticker-column").first().evaluate((node) => getComputedStyle(node).transitionDuration)).toBe("0.24s");
  await expect.poll(places).toEqual([1, 3, 6, 1, 7]);
  await close();
});

test("under reduced motion a menu and a sheet fade, and neither travels, grows nor slides", async ({ page }) => {
  // The suite's own context: prefers-reduced-motion is reduce.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(story(BENCH));
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
  // Every frame of a surface from the moment it is in the page: how opaque it is and where it is drawn.
  await page.evaluate(() => {
    const seen: Record<string, { opacity: number; left: number; top: number; width: number }[]> = { menu: [], sheet: [] };
    (window as unknown as { craftFrames: typeof seen }).craftFrames = seen;
    const look = () => {
      for (const [name, selector] of [["menu", ".fui-menu"], ["sheet", '.fui-dialog[data-side]']] as const) {
        const node = document.querySelector(selector);
        if (!node) continue;
        const box = node.getBoundingClientRect();
        seen[name]!.push({ opacity: Number(getComputedStyle(node).opacity), left: Math.round(box.left), top: Math.round(box.top), width: Math.round(box.width) });
      }
      requestAnimationFrame(look);
    };
    requestAnimationFrame(look);
  });
  const frames = (name: string) => page.evaluate((key) => (window as unknown as { craftFrames: Record<string, { opacity: number; left: number; top: number; width: number }[]> }).craftFrames[key]!, name);
  const places = (list: { opacity: number; left: number; top: number; width: number }[]) => new Set(list.filter((frame) => frame.opacity > 0.01).map((frame) => `${frame.left},${frame.top},${frame.width}`)).size;

  await page.getByRole("button", { name: "File" }).click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  expect(await menu.evaluate((node) => getComputedStyle(node).transitionProperty)).toBe("opacity");
  expect(await menu.evaluate((node) => getComputedStyle(node).transitionDuration)).toBe("0.15s");
  await page.waitForTimeout(250);
  const arriving = await frames("menu");
  // It was seen part of the way in (a fade, not a cut), and every frame that showed it showed it in one place at one size.
  expect(arriving.some((frame) => frame.opacity > 0.05 && frame.opacity < 0.95), JSON.stringify(arriving.slice(0, 12))).toBe(true);
  expect(places(arriving)).toBe(1);
  await page.mouse.click(900, 700);
  await expect(menu).toBeHidden();
  const whole = await frames("menu");
  expect(whole.slice(arriving.length).some((frame) => frame.opacity > 0.05 && frame.opacity < 0.95)).toBe(true);
  expect(places(whole)).toBe(1);

  // A sheet, which slides when motion is allowed: here it fades in its place and fades out of it.
  await page.getByRole("button", { name: "Open the sheet" }).click();
  const sheet = page.locator('.fui-dialog[data-side]');
  await expect(sheet).toBeVisible();
  await page.waitForTimeout(250);
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  const slid = await frames("sheet");
  expect(slid.some((frame) => frame.opacity > 0.05 && frame.opacity < 0.95), JSON.stringify(slid.slice(0, 12))).toBe(true);
  expect(places(slid)).toBe(1);
});

for (const width of [390, 1280]) {
  test(`the worst a source can send stays inside its piece at ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(story(BENCH));
    await expect(page.locator("#storybook-root h1").first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await check(page);
  });
}

async function check(page: Page) {
  // A total of thirteen characters is one line, inside its cell, and no larger than the figure's own size.
  const figure = page.locator("#craft-stats .fui-stat-value").first();
  const fit = await figure.evaluate((node) => {
    const text = node.firstChild as Text;
    const range = document.createRange();
    range.selectNodeContents(text);
    const cell = (node.closest(".fui-stat") as HTMLElement).getBoundingClientRect();
    const rects = [...range.getClientRects()];
    return { lines: new Set(rects.map((rect) => Math.round(rect.top))).size, right: Math.max(...rects.map((rect) => rect.right)), cell: cell.right, size: parseFloat(getComputedStyle(node).fontSize) };
  });
  expect(fit.lines).toBe(1);
  expect(fit.right).toBeLessThanOrEqual(fit.cell);
  expect(fit.size).toBeGreaterThanOrEqual(20);
  expect(fit.size).toBeLessThanOrEqual(40);
  // A short figure beside it keeps the full size: only the long one gives way.
  expect(await page.locator("#craft-stats .fui-stat-value").nth(1).evaluate((node) => parseFloat(getComputedStyle(node).fontSize))).toBe(40);
  // And is not measured against its cell at all: a figure of six characters fits any cell of a group.
  await expect(page.locator("#craft-stats .fui-stat-value").nth(2)).not.toHaveAttribute("data-fit");
  await expect(figure).toHaveAttribute("data-fit", "");

  // "+1,280" is read whole: the count is wider than a face and as tall.
  const count = page.locator("#craft-faces .fui-avatar-group-count");
  const pill = await count.evaluate((node) => ({ width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height, cut: node.scrollWidth > node.clientWidth }));
  expect(pill.cut).toBe(false);
  expect(pill.height).toBe(32);
  expect(pill.width).toBeGreaterThan(32);

  // A term from data takes two fifths of the list at most, and its details keep words whole.
  const list = page.locator("#craft-terms");
  const [whole, term, details] = await Promise.all([list.boundingBox(), list.locator("dt").boundingBox(), list.locator("dd").boundingBox()]);
  expect(term!.width).toBeLessThanOrEqual(whole!.width * 0.4 + 0.5);
  expect(details!.width).toBeGreaterThan(whole!.width * 0.45);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}
