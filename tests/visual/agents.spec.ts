import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// The agent pieces in fixed states. The clock is fixed so the times beside the labels read the same on every run.
const STORY = "/iframe.html?id=tests-agents--pieces&viewMode=story";
const NOW = new Date("2026-11-07T10:00:00Z");

// Storybook's own accessibility panel may be running axe in the same frame: wait for it rather than fail.
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

async function open(page: Page, theme = "light") {
  await page.clock.setFixedTime(NOW);
  await page.goto(`${STORY}&globals=theme:${theme}`);
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

for (const theme of ["light", "dark"]) {
  for (const width of [390, 768, 1440]) {
    test(`agents ${theme} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 960 });
      await open(page, theme);
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark).*$/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const result = await audit(page);
      expect(result.violations).toEqual([]);
      await expect(page).toHaveScreenshot(`agents-${theme}-${width}.png`, { fullPage: true });
    });
  }
}

test("thinking is a status: the label is read, the ticking time is not", async ({ page }) => {
  await open(page);
  const line = page.locator(".fui-agent-thinking").filter({ hasText: "Searching the docs" });
  await expect(line).toHaveAttribute("role", "status");
  await expect(line.locator(".fui-agent-thinking-time")).toHaveAttribute("aria-hidden", "true");
  await expect(line.locator(".fui-agent-thinking-time")).toHaveText("2.8s");
  await expect(line.locator("svg.fui-agent-mark")).toHaveAttribute("aria-hidden", "true");
});

test("a task list says each state in words, marks the running step and announces it", async ({ page }) => {
  await open(page);
  const list = page.getByRole("region", { name: "Release 0.11" });
  await expect(list.locator('[aria-current="step"]')).toContainText("In progress: Copy 48,210 invoices");
  await expect(list.locator(".fui-task").first()).toContainText("Done: Read the billing schema");
  await expect(list.locator('.fui-task[data-status="failed"]')).toContainText("Failed: Upload the coverage");
  await expect(list.getByRole("status")).toHaveText("In progress: Copy 48,210 invoices");
  await expect(list.locator(".fui-task-list-count")).toHaveText("2 of 5");
});

test("an upload is a progressbar and its remove key stays reachable from the keyboard", async ({ page }) => {
  await open(page);
  const bar = page.getByRole("progressbar", { name: "Uploading invoices-q3.xlsx" }).first();
  await expect(bar).toHaveAttribute("aria-valuenow", "64");
  const remove = page.getByRole("button", { name: "Remove invoices-q3.xlsx" }).first();
  await remove.focus();
  await expect(remove).toBeFocused();
  await expect.poll(() => remove.evaluate((node) => Number(getComputedStyle(node).opacity))).toBe(1);
});

test("the composer at work carries the light and keeps Stop in reach", async ({ page }) => {
  await open(page);
  const composer = page.locator(".fui-composer[data-working]").first();
  await expect(composer.locator(".fui-working-light")).toHaveCount(1);
  await expect(composer.locator(".fui-working-light")).toHaveAttribute("aria-hidden", "true");
  const stop = composer.getByRole("button", { name: "Stop" });
  await stop.focus();
  await expect(stop).toBeFocused();
});

test("the context meter is one meter that reads in full", async ({ page }) => {
  await open(page);
  const meter = page.getByRole("meter", { name: "Context window" }).first();
  await expect(meter).toHaveAttribute("aria-valuetext", "42,100 of 200,000 tokens, 21%");
  await expect(page.locator('.fui-context-meter[data-tone="danger"]')).toHaveCount(1);
  await expect(page.locator('.fui-context-meter[data-tone="warning"]')).toHaveCount(1);
});

test("a picture being made says what it does, and a failure is an alert", async ({ page }) => {
  await open(page);
  const working = page.locator('.fui-generation[data-status="generating"]').first();
  await expect(working.getByRole("status")).toContainText("Making the image");
  await expect(working.getByRole("status")).toContainText("42%");
  await expect(page.locator('.fui-generation[data-status="failed"]').getByRole("alert")).toContainText("The image could not be made");
  await expect(page.locator('.fui-generation[data-status="done"]').getByRole("img", { name: "Orchard terraces" })).toBeVisible();
});

test("each kind of work has its own mark, a settled line keeps its status and its time, and a step shows its kind", async ({ page }) => {
  await open(page);
  const block = page.locator("section").filter({ has: page.getByRole("heading", { name: "Each kind of work", exact: true }) }).last();
  const variants = await block.locator(".fui-agent-thinking:not([data-status]) svg.fui-agent-mark").evaluateAll((marks) => marks.map((mark) => mark.getAttribute("data-variant")));
  expect(variants).toEqual(["wave", "scan", "lines", "type", "orbit", "raster", "fill"]);
  const done = block.locator('.fui-agent-thinking[data-status="done"]');
  await expect(done).toHaveAttribute("role", "status");
  await expect(done).toContainText("Searched 12 sources");
  await expect(done.locator(".fui-agent-thinking-time")).toHaveText("12s");
  await expect(done.locator('svg.fui-agent-mark[data-outcome="done"] rect[data-on]')).toHaveCount(4);
  await expect(block.locator('.fui-agent-thinking[data-status="failed"] .fui-agent-thinking-time')).toHaveText("41s");
  // Settled, the light is out: no shimmer on the label.
  await expect(done.locator(".fui-shimmer-text")).toHaveCount(0);
  const plan = page.getByRole("region", { name: "Research plan" });
  await expect(plan.locator('[aria-current="step"] svg.fui-agent-mark')).toHaveAttribute("data-variant", "scan");
});

test("a search is a strip of cells and its sources are counted once; an answer ends in a caret that is never read", async ({ page }) => {
  await open(page);
  const scan = page.getByRole("progressbar", { name: "Searching the docs" });
  await expect(scan).not.toHaveAttribute("aria-valuenow", /.*/);
  expect(await scan.locator(".fui-progress-scan > span").count()).toBeGreaterThan(20);
  const tally = page.locator(".fui-source-tally");
  await expect(tally).toContainText("Reviewing sources");
  await expect(tally.locator(".fui-readout .fui-sr-only")).toHaveText("4");
  await expect(tally.locator(".fui-source-tally-tile")).toHaveCount(4);
  for (const variant of ["ring", "dots", "bars", "grid", "line"]) await expect(page.getByRole("status", { name: `Loading (${variant})` })).toBeVisible();
  const answer = page.locator('.fui-chat-message[data-streaming]');
  await expect(answer).toHaveAttribute("aria-busy", "true");
  const caret = answer.locator(".fui-stream-caret");
  await expect(caret).toHaveAttribute("aria-hidden", "true");
  // The caret sits just after the last character of the text, on its line.
  const placement = await answer.evaluate((node) => {
    const text = node.querySelector(".fui-markdown p")!.firstChild as Text;
    const range = document.createRange();
    range.setStart(text, text.length - 1);
    range.setEnd(text, text.length);
    const letter = range.getBoundingClientRect();
    const mark = node.querySelector(".fui-stream-caret")!.getBoundingClientRect();
    return { gap: mark.left - letter.right, middle: Math.abs(mark.top + mark.height / 2 - (letter.top + letter.height / 2)) };
  });
  expect(placement.gap).toBeGreaterThanOrEqual(0);
  expect(placement.gap).toBeLessThan(6);
  expect(placement.middle).toBeLessThan(3);
});

test("a picture can refine or scan and a page is written; each says what it does", async ({ page }) => {
  await open(page);
  const block = page.locator("section").filter({ has: page.getByRole("heading", { name: "Pictures and pages being made", exact: true }) }).last();
  await expect(block.locator('.fui-generation[data-effect="refine"] .fui-generation-refine > [data-layer]')).toHaveCount(2);
  await expect(block.locator('.fui-generation[data-effect="scan"]').getByRole("status")).toContainText("62%");
  const pages = block.locator('.fui-generation[data-kind="document"]');
  await expect(pages).toHaveCount(2);
  await expect(pages.first().getByRole("status")).toContainText("Writing the document");
  await expect(pages.nth(1).getByRole("status")).toContainText("35%");
});

test("reduced motion stills the light; without it, the light turns", async ({ page, browser }) => {
  await open(page);
  const edge = (target: Page) =>
    target.locator(".fui-composer .fui-working-light").first().evaluate((node) => ({
      animation: getComputedStyle(node, "::before").animationName,
      bloom: getComputedStyle(node.querySelector(".fui-working-light-bloom")!).display,
    }));
  expect(await edge(page)).toEqual({ animation: "none", bloom: "none" });
  const context = await browser.newContext({ reducedMotion: "no-preference" });
  const moving = await context.newPage();
  await moving.goto(`http://127.0.0.1:${process.env.STORYBOOK_PORT ?? "6041"}${STORY}&globals=theme:light`);
  await expect(moving.locator("#storybook-root h1").first()).toBeVisible();
  expect(await edge(moving)).toEqual({ animation: "fui-light-turn", bloom: "block" });
  await context.close();
});
