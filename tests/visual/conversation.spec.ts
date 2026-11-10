import assert from "node:assert/strict";
import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// The conversation in a real browser: it opens at the end without animating there, follows content that keeps arriving, lets
// go on the first wheel turn away from the end, and comes back when asked. Assertions read state and geometry; distances are
// sampled inside requestAnimationFrame loops, never after a fixed sleep.
const BENCH = "/iframe.html?id=tests-conversation--pieces&viewMode=story";
const STREAM = "/iframe.html?id=tests-conversation--streaming&viewMode=story";
const PAGE = "/iframe.html?id=agents-conversation--overview&viewMode=story";
const PLAYGROUND = "/iframe.html?id=agents-conversation--playground&viewMode=story";

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

async function open(page: Page, theme = "light", story = BENCH) {
  await page.goto(`${story}&globals=theme:${theme}`);
  // A story Storybook has not compiled yet takes a while on a cold Vite under load.
  await expect(page.locator("#storybook-root h1").first()).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => document.fonts.ready);
}

/** Every conversation of the bench, in the order of the page. */
const boards = (page: Page) => page.locator(".fui-conversation");
const logOf = (board: Locator) => board.locator(":scope > .fui-conversation-content");

const distance = (log: Locator) => log.evaluate((node) => node.scrollHeight - node.clientHeight - node.scrollTop);
const top = (log: Locator) => log.evaluate((node) => node.scrollTop);

/**
 * The distance to the end at every growth of the content, read from a `ResizeObserver` registered after the conversation's
 * own: it runs in the same delivery, after the engine has put the view at the end, and before that frame is painted.
 */
async function watchGrowth(page: Page, board: Locator) {
  await board.evaluate((root) => {
    const column = root.querySelector<HTMLElement>(":scope > .fui-conversation-content > .fui-conversation-column")!;
    const log = root.querySelector<HTMLElement>(":scope > .fui-conversation-content")!;
    const record: number[] = [];
    (window as unknown as { __growth: number[] }).__growth = record;
    new ResizeObserver(() => {
      record.push(log.scrollHeight - log.clientHeight - log.scrollTop);
    }).observe(column);
  });
}
const grown = (page: Page) => page.evaluate(() => (window as unknown as { __growth: number[] }).__growth);

/** One frame later: what the scroll position is after whatever just happened settled into the next paint. */
function nextFrame(page: Page, board: Locator) {
  return board.evaluate(
    (root) =>
      new Promise<{ top: number; distance: number; atEnd: boolean }>((resolve) => {
        const node = root.querySelector<HTMLElement>(":scope > .fui-conversation-content")!;
        requestAnimationFrame(() =>
          resolve({ top: node.scrollTop, distance: node.scrollHeight - node.clientHeight - node.scrollTop, atEnd: node.scrollHeight - node.clientHeight - node.scrollTop <= 1 }),
        );
      }),
  );
}

/** The scroll position once the browser has stopped moving it: a wheel or a key eases for a frame or two. */
async function settledTop(log: Locator) {
  let last = await top(log);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await log.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve(null))));
    const now = await top(log);
    if (Math.abs(now - last) < 0.5) return now;
    last = now;
  }
  return last;
}

const jump = (board: Locator) => board.locator(".fui-conversation-jump");
const rail = (board: Locator) => board.locator(".fui-conversation-rail");
const markers = (board: Locator) => board.locator(".fui-conversation-marker");

/* ------------------------------------------------------------- the references */

for (const theme of ["light", "dark"]) {
  for (const width of [390, 768, 1440]) {
    test(`conversation ${theme} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 960 });
      await open(page, theme);
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark).*$/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const result = await audit(page);
      expect(result.violations).toEqual([]);
      await expect(page).toHaveScreenshot(`conversation-${theme}-${width}.png`, { fullPage: true });
    });
  }
}

/* ----------------------------------------------------------------- behaviour */

test("it opens at the end, and the first frames it is painted in are already there", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  // Without reduced motion too: a smooth initial scroll would show a large distance in the frames that follow.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    const frames: number[] = [];
    (window as unknown as { __first: number[] }).__first = frames;
    const tick = () => {
      const log = document.querySelector<HTMLElement>(".fui-conversation > .fui-conversation-content");
      // The preview iframe has no height at all until Storybook sizes it: the first frames that are a conversation to look at
      // are the ones with a viewport.
      if (log && log.clientHeight > 0) frames.push(log.scrollHeight - log.clientHeight - log.scrollTop);
      if (frames.length < 6) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await open(page);
  const board = boards(page).first();
  const first = await page.evaluate(() => (window as unknown as { __first: number[] }).__first);
  assert(first.length >= 2, `frames recorded: ${first.length}`);
  // It settles in the first frame it is painted in, at one jump: an eased scroll from the top would leave a series of
  // distances shrinking over the frames that follow.
  const settled = first.findIndex((value) => value < 1);
  assert(settled <= 1, `at the end within a frame: ${first.join(", ")}`);
  assert(first.slice(settled).every((value) => value < 1), `and it stays there: ${first.join(", ")}`);
  expect(await top(logOf(board))).toBeGreaterThan(100);
  expect(await logOf(board).evaluate((node) => getComputedStyle(node).scrollBehavior)).toBe("auto");
});

test("while an answer streams the end stays within a pixel on every sampled frame", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, "light", STREAM);
  const board = boards(page).first();
  const log = logOf(board);
  const before = await log.evaluate((node) => ({ height: node.scrollHeight, viewport: node.clientHeight }));
  await watchGrowth(page, board);
  await page.getByTestId("stream-replay").click();
  await expect(page.getByTestId("stream-state")).toContainText("5 of 5");
  const sampled = await grown(page);
  // A chunk that fits on the line it is already on does not change the column's height: only the wraps count as growth.
  assert(sampled.length >= 2, `growths recorded: ${sampled.length}`);
  assert(sampled.every((value) => value < 1), `the end after every growth: ${sampled.join(", ")}`);
  const after = await log.evaluate((node) => node.scrollHeight);
  expect(after).toBeGreaterThan(before.height + 40);
  expect(await log.evaluate((node) => node.clientHeight)).toBe(before.viewport);
});

test("one wheel away from the end lets go: growth stops moving it, the key appears, and pressing it follows again", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, "light", STREAM);
  const board = boards(page).first();
  const log = logOf(board);
  const key = jump(board);
  await expect(key).toBeHidden();
  await page.getByTestId("stream-replay").click();
  await expect(page.getByTestId("stream-state")).toContainText("streaming");
  const box = (await log.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, -180);
  await expect.poll(() => distance(log)).toBeGreaterThan(20);
  const held = await settledTop(log);
  // The stream keeps arriving; the view stays where the reader put it.
  await expect(page.getByTestId("stream-state")).toContainText("5 of 5");
  expect(Math.abs((await top(log)) - held)).toBeLessThanOrEqual(1);
  // The key says what it is, and it is there.
  await expect(key).toBeVisible();
  await expect(key).toHaveAttribute("aria-label", /^Jump to latest/);
  await expect(key).toHaveCSS("visibility", "visible");
  await key.click();
  await expect.poll(() => distance(log)).toBeLessThan(1);
  await expect(key).toBeHidden();
  // And growth follows it again from there.
  await watchGrowth(page, board);
  await page.getByTestId("stream-replay").click();
  await expect(page.getByTestId("stream-state")).toContainText("5 of 5");
  const following = await grown(page);
  assert(following.length >= 2, `growths recorded: ${following.length}`);
  assert(following.every((value) => value < 1), `following again: ${following.join(", ")}`);
});

test("the keyboard: PageUp in the log lets go, End comes back", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, "light", STREAM);
  const board = boards(page).first();
  const log = logOf(board);
  await log.focus();
  await expect(log).toBeFocused();
  await page.keyboard.press("PageUp");
  await expect.poll(() => distance(log)).toBeGreaterThan(40);
  const held = await settledTop(log);
  await page.getByTestId("stream-replay").click();
  await expect(page.getByTestId("stream-state")).toContainText("5 of 5");
  expect(Math.abs((await top(log)) - held)).toBeLessThanOrEqual(1);
  await log.focus();
  await page.keyboard.press("End");
  await expect.poll(() => distance(log)).toBeLessThan(1);
  await watchGrowth(page, board);
  await page.getByTestId("stream-replay").click();
  await expect(page.getByTestId("stream-state")).toContainText("5 of 5");
  const locked = await grown(page);
  assert(locked.length >= 2, `growths recorded: ${locked.length}`);
  assert(locked.every((value) => value < 1), `End locks again: ${locked.join(", ")}`);
});

test("a picture that loads late above the fold grows the content: the end is still in view", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, "light", STREAM);
  const board = boards(page).first();
  const log = logOf(board);
  const before = await log.evaluate((node) => node.scrollHeight);
  await page.getByTestId("late-image").click();
  await expect(page.getByTestId("late-slot").locator("img")).toHaveCount(1);
  await expect.poll(async () => page.getByTestId("late-slot").locator("img").evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
  await expect.poll(() => log.evaluate((node) => node.scrollHeight)).toBeGreaterThan(before + 20);
  expect(await distance(log)).toBeLessThan(1);
});

test("resizing the viewport while it follows keeps the end in view", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const board = boards(page).first();
  const log = logOf(board);
  expect(await distance(log)).toBeLessThan(1);
  await page.setViewportSize({ width: 1280, height: 680 });
  await expect.poll(() => distance(log)).toBeLessThan(1);
  await page.setViewportSize({ width: 900, height: 900 });
  await expect.poll(() => distance(log)).toBeLessThan(1);
});

test("a message sent while the reader is away jumps to the end and follows there", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, "light", STREAM);
  const board = boards(page).first();
  const log = logOf(board);
  const box = (await log.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, -400);
  await expect.poll(() => distance(log)).toBeGreaterThan(40);
  await page.getByTestId("send").click();
  expect((await nextFrame(page, board)).distance).toBeLessThan(1);
  await expect(log.getByText("Sent message 1")).toBeVisible();
  await expect(jump(board)).toBeHidden();
});

test("the rail follows the reading, brings a message to the top, and is one tab stop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const board = boards(page).first();
  const log = logOf(board);
  const railOf = rail(board);
  const list = markers(board);
  await expect(railOf).toBeVisible();
  await expect(list).toHaveCount(6);
  // At the end, the last message is the one being read.
  await expect(list.nth(5)).toHaveAttribute("aria-current", "true");
  // Scrolled to the top, the first is.
  await log.evaluate((node) => node.scrollTo({ top: 0 }));
  await expect.poll(async () => list.nth(0).getAttribute("aria-current")).toBe("true");
  // Back down a little: the marker of the message now at the reading line.
  await log.evaluate((node) => node.scrollTo({ top: 700 }));
  await expect.poll(async () => (await list.nth(0).getAttribute("aria-current")) === null).toBe(true);
  const active = await list.evaluateAll((nodes) => nodes.findIndex((node) => node.getAttribute("aria-current") === "true"));
  expect(active).toBeGreaterThan(0);
  // Pressing a marker brings its message to the top, a line of air above it.
  await list.nth(1).click();
  const message = page.locator("#turn-3");
  await expect.poll(async () => {
    const messageTop = (await message.boundingBox())!.y;
    const logTop = (await log.boundingBox())!.y;
    return messageTop - logTop;
  }).toBeGreaterThanOrEqual(-1);
  const offset = (await message.boundingBox())!.y - (await log.boundingBox())!.y;
  expect(offset).toBeLessThan(24);
  await expect(list.nth(1)).toHaveAttribute("aria-current", "true");
  // One tab stop, and the arrows move between markers.
  expect(await railOf.locator('[tabindex="0"]').count()).toBe(1);
  // A key press first: a tooltip opens on focus the way the keyboard reaches it, not a focus a pointer left behind.
  await page.keyboard.press("Tab");
  await list.nth(1).focus();
  await page.keyboard.press("ArrowDown");
  await expect(list.nth(2)).toBeFocused();
  // The preview repeats the message beside its marker; it is a tooltip of the library, which names it through the button.
  await expect(page.locator(".fui-conversation-preview")).toContainText("Message 3 of 6");
  await page.keyboard.press("ArrowUp");
  await expect(list.nth(1)).toBeFocused();
  // The space above the rail is reserved: no marker sits over the words.
  const column = board.locator(".fui-conversation-column");
  const padding = await column.evaluate((node) => Number.parseFloat(getComputedStyle(node).paddingInlineEnd));
  expect(padding).toBeGreaterThan(24);
});

test("with reduced motion a marker's jump is instant; without it, it eases", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  const board = boards(page).first();
  const list = markers(board);
  await list.nth(1).click();
  const instant = await nextFrame(page, board);
  expect(instant.distance).toBeGreaterThan(40);
  const settled = await top(logOf(board));
  expect(settled).toBeGreaterThan(0);
  // One frame after the press it is already where it goes.
  const still = await nextFrame(page, board);
  expect(Math.abs(still.top - settled)).toBeLessThan(1);
  // Without reduced motion the same press is still travelling a frame later.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page);
  const smooth = boards(page).first();
  await markers(smooth).nth(0).click();
  const early = await nextFrame(page, smooth);
  const late = await nextFrame(page, smooth);
  expect(Math.abs(late.top - early.top)).toBeGreaterThan(1);
});

test("the log is a tab stop only while it overflows, and its ring is drawn inside", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const board = boards(page).first();
  const log = logOf(board);
  await expect(log).toHaveAttribute("tabindex", "0");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await log.focus();
  const ring = await board.evaluate((node) => {
    const style = getComputedStyle(node, "::after");
    return `${style.outlineStyle} ${style.outlineWidth} ${style.outlineOffset} ${style.opacity}`;
  });
  expect(ring).toBe("solid 2px -2px 1");
  // A conversation that fits is not a tab stop, and one without a log has nothing to stop at.
  await expect(logOf(boards(page).nth(4))).toHaveCount(1);
  await expect(logOf(boards(page).nth(4))).not.toHaveAttribute("tabindex", /.*/);
  await expect(logOf(boards(page).nth(5))).toHaveCount(0);
});

test("right to left: the rail moves to the left edge", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const rtl = page.locator('[dir="rtl"] .fui-conversation');
  await expect(rtl).toHaveCount(1);
  const frame = (await rtl.boundingBox())!;
  const strip = (await rtl.locator(".fui-conversation-rail").boundingBox())!;
  expect(strip.x - frame.x).toBeLessThan(24);
  // And in the left-to-right bench it is on the other side.
  const ltr = (await boards(page).first().boundingBox())!;
  const ltrRail = (await rail(boards(page).first()).boundingBox())!;
  expect(ltr.x + ltr.width - (ltrRail.x + ltrRail.width)).toBeLessThan(24);
});

test("the measure: prose keeps its measure, a table takes the column, and a bubble stops at 80%", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const on = boards(page).nth(2);
  const off = boards(page).nth(3);
  const content = async (board: Locator) =>
    board.locator(".fui-conversation-column").evaluate((node) => {
      const style = getComputedStyle(node);
      return node.clientWidth - Number.parseFloat(style.paddingInlineStart) - Number.parseFloat(style.paddingInlineEnd);
    });
  const width = await content(on);
  const widthOff = await content(off);
  expect(width).toBeGreaterThan(400);
  expect(Math.abs(width - widthOff)).toBeLessThan(40);
  const proseOn = (await on.locator('.fui-chat-message[data-role="assistant"] > .fui-chat-message-body').first().boundingBox())!.width;
  const tableOn = (await on.locator('.fui-chat-message[data-role="assistant"] > .fui-chat-message-body').last().boundingBox())!.width;
  const proseOff = (await off.locator('.fui-chat-message[data-role="assistant"] > .fui-chat-message-body').first().boundingBox())!.width;
  expect(proseOn).toBeLessThan(width - 24);
  expect(tableOn).toBeGreaterThanOrEqual(width - 2);
  expect(Math.abs(proseOff - widthOff)).toBeLessThan(2);
  const bubble = (await on.locator('.fui-chat-message[data-role="user"] > .fui-chat-message-body').first().boundingBox())!.width;
  expect(bubble).toBeLessThanOrEqual(Math.min(width * 0.8, 640) + 1);
  // A bubble too near the column's width would be the old 85% rule showing through.
  expect(bubble).toBeLessThanOrEqual(width);
});

test("the page and its playground: the pieces in their page, and a message sent that the log follows", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, "light", PAGE);
  await expect(page.getByRole("heading", { level: 1, name: "Conversation" })).toBeVisible();
  await expect(page.locator(".fui-conversation-rail")).toHaveCount(1);
  await page.goto(`${PLAYGROUND}&globals=theme:light`);
  const board = page.locator(".fui-conversation");
  await expect(board).toBeVisible();
  const log = logOf(board);
  const box = (await log.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, -400);
  await expect.poll(() => distance(log)).toBeGreaterThan(20);
  await page.getByRole("textbox", { name: "Message" }).fill("A follow-up from the playground");
  await page.keyboard.press("Enter");
  await expect(board.getByText("A follow-up from the playground")).toBeVisible();
  await expect.poll(() => distance(log)).toBeLessThan(1);
});

test("no sideways scroll at 390 px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await open(page, "dark");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  for (const board of await boards(page).all()) {
    expect(await board.evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(0);
  }
});

test("forced colors: the key and the current marker keep a form", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  await page.emulateMedia({ forcedColors: "active" });
  const away = boards(page).nth(1);
  const key = jump(away);
  await expect(key).toHaveCSS("visibility", "visible");
  const border = await key.evaluate((node) => getComputedStyle(node).borderTopColor);
  expect(border).not.toBe("rgba(0, 0, 0, 0)");
  const current = away.locator('.fui-conversation-marker[aria-current="true"] .fui-conversation-marker-tick').first();
  await expect(current).toHaveCount(1);
  const ink = await current.evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(ink).not.toBe("rgba(0, 0, 0, 0)");
  expect(ink).not.toBe(await markers(away).nth(0).locator(".fui-conversation-marker-tick").evaluate((node) => getComputedStyle(node).backgroundColor));
});
