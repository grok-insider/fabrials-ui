// The agent pieces in motion: what moves without reduced motion, what holds still with it, and words that settle once.
import { expect, test, type Browser, type Page } from "@playwright/test";

const port = process.env.STORYBOOK_PORT ?? "6041";
const BENCH = `http://127.0.0.1:${port}/iframe.html?id=tests-agents--pieces&viewMode=story&globals=theme:dark`;

async function moving(browser: Browser, url: string) {
  const context = await browser.newContext({ reducedMotion: "no-preference" });
  const page = await context.newPage();
  await page.goto(url);
  await expect(page.locator("#storybook-root > *").first()).toBeVisible();
  return { page, close: () => context.close() };
}

const animations = (page: Page) =>
  page.evaluate(() => {
    const name = (selector: string) => {
      const node = document.querySelector(selector);
      return node ? getComputedStyle(node).animationName : "missing";
    };
    return {
      scan: name('.fui-agent-thinking svg[data-variant="scan"] rect'),
      lines: name('.fui-agent-thinking svg[data-variant="lines"]'),
      type: name('.fui-agent-thinking svg[data-variant="type"]'),
      fill: name('.fui-agent-thinking svg[data-variant="fill"]'),
      dots: name('.fui-pixel-spinner[data-variant="dots"] rect'),
      line: name('.fui-pixel-spinner[data-variant="line"]'),
      strip: name(".fui-progress-scan"),
      letters: name('.fui-shimmer-text[data-variant="letters"]'),
      refine: name(".fui-generation-refine"),
      page: name(".fui-generation-page:not([data-progress])"),
      settled: name('svg.fui-agent-mark[data-outcome="done"] rect'),
    };
  });

test("without reduced motion each piece at work moves, a settled mark stays still, and a known progress moves only with it", async ({ browser }) => {
  const { page, close } = await moving(browser, BENCH);
  const running = await animations(page);
  expect(running).toEqual({
    scan: "fui-agent-hop",
    lines: "fui-agent-lines",
    type: "fui-agent-cells",
    fill: "fui-agent-rows",
    dots: "fui-pixel-dot",
    line: "fui-pixel-line",
    strip: "fui-progress-scan",
    letters: "fui-shimmer-letters",
    refine: "fui-refine-pass, fui-refine-band",
    page: "fui-page-write",
    settled: "none",
  });
  expect(await page.locator(".fui-generation-page[data-progress]").evaluate((node) => getComputedStyle(node).animationName)).toBe("none");
  // The writing mark really steps: its cells light differently a moment later.
  const lit = () => page.locator('.fui-agent-thinking svg[data-variant="type"] rect').evaluateAll((cells) => cells.map((cell) => getComputedStyle(cell).opacity).join(","));
  const before = await lit();
  await expect.poll(lit, { timeout: 3000 }).not.toBe(before);
  await close();
});

test("under reduced motion nothing at work moves", async ({ page }) => {
  await page.goto(BENCH);
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  const still = await animations(page);
  for (const [piece, name] of Object.entries(still)) expect(name, piece).toBe("none");
});

test("a new label scrambles into place once, keeping its width, and settles on the real words", async ({ browser }) => {
  const { page, close } = await moving(browser, `http://127.0.0.1:${port}/iframe.html?id=components-scramble-text--overview&viewMode=story&globals=theme:dark`);
  const text = page.locator(".fui-scramble-text").first();
  await expect(text).toBeVisible();
  await page.waitForFunction(() => document.querySelector(".fui-scramble-text")?.hasAttribute("data-scrambling"), null, { timeout: 5000, polling: 16 });
  const during = await text.evaluate((node) => ({ width: node.getBoundingClientRect().width, frame: node.querySelector(".fui-scramble-text-frame")?.getAttribute("aria-hidden"), words: node.firstChild?.textContent }));
  expect(during.frame).toBe("true");
  await expect(text).not.toHaveAttribute("data-scrambling", /.*/, { timeout: 2000 });
  const after = await text.evaluate((node) => ({ width: node.getBoundingClientRect().width, words: node.textContent }));
  expect(after.words).toBe(during.words);
  expect(Math.abs(after.width - during.width)).toBeLessThan(0.5);
  await close();
});

test("a streaming caret blinks only once the answer pauses", async ({ browser }) => {
  const { page, close } = await moving(browser, `http://127.0.0.1:${port}/iframe.html?id=agents-chat-message--overview&viewMode=story&globals=theme:dark`);
  const caret = page.locator(".fui-chat-message[data-streaming] .fui-stream-caret").first();
  await expect(caret).toBeVisible();
  // The preview pauses half way: the caret is marked stalled and blinks, then the stream ends and it goes.
  await expect(caret).toHaveAttribute("data-stalled", "", { timeout: 4000 });
  expect(await caret.evaluate((node) => getComputedStyle(node).animationName)).toBe("fui-caret-blink");
  await close();
});

