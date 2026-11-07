import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// The agent pieces in fixed states. The clock is fixed so the times beside the labels read the same on every run.
const STORY = "/iframe.html?id=tests-agents--pieces&viewMode=story";
const NOW = new Date("2026-11-07T10:00:00Z");

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
      const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
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
  const working = page.locator('.fui-generation[data-status="generating"]');
  await expect(working.getByRole("status")).toContainText("Making the image");
  await expect(working.getByRole("status")).toContainText("42%");
  await expect(page.locator('.fui-generation[data-status="failed"]').getByRole("alert")).toContainText("The image could not be made");
  await expect(page.locator('.fui-generation[data-status="done"]').getByRole("img", { name: "Orchard terraces" })).toBeVisible();
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
