// States and time in a real browser: questions asked in place, a clock that counts to a deadline, the theme choice, the
// back key and the sticky bar. Assertions read state, focus and geometry; the six references are of the bench.
import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { themeInitScript } from "../../packages/ui/src/theme-script";

const story = (name: string, theme = "light") => `/iframe.html?id=tests-states-and-time--${name}&viewMode=story&globals=theme:${theme}`;
// The same moment the bench reads its clocks against.
const NOW = Date.UTC(2026, 10, 10, 9, 0, 0);

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

async function open(page: Page, name: string, theme = "light") {
  await page.goto(story(name, theme));
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

for (const theme of ["light", "dark"] as const) {
  for (const width of [390, 768, 1440]) {
    test(`states ${theme} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 960 });
      await page.clock.setFixedTime(new Date(NOW));
      // The theme island follows the device, as the page does.
      await page.emulateMedia({ colorScheme: theme });
      await open(page, "pieces", theme);
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark).*$/);
      await expect(page.getByTestId("theme-island")).toHaveClass(theme);
      await expect(page.getByRole("alert").filter({ hasText: "Tick the box to continue" })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const result = await audit(page);
      expect(result.violations).toEqual([]);
      await expect(page).toHaveScreenshot(`states-${theme}-${width}.png`, { fullPage: true });
    });
  }
}

// ------------------------------------------------------------------ inline confirm

const bar = (page: Page) => page.getByRole("group", { name: "Session actions" });
const log = (page: Page) => page.getByTestId("log");

async function openFlow(page: Page, size = { width: 1024, height: 700 }) {
  await page.setViewportSize(size);
  await open(page, "confirm-flow");
}

test("opening moves focus to the safe answer; Escape is that answer and gives focus back to the control that asked", async ({ page }) => {
  await openFlow(page);
  const trigger = bar(page).getByRole("button", { name: "End session" });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.focus();
  await page.keyboard.press("Enter");
  const question = page.getByRole("group", { name: "End the session early?" });
  await expect(question).toBeVisible();
  await expect(question).toHaveAccessibleDescription("What you answered so far is kept.");
  // In place, not a dialog: nothing claims to be modal and the page stays reachable.
  await expect(page.locator('[role="alertdialog"], [role="dialog"], [aria-modal]')).toHaveCount(0);
  await expect(question.getByRole("button", { name: "Keep going" })).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(question).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(log(page)).toHaveText("kept going");
  // The safe button does the same.
  await page.keyboard.press("Enter");
  await expect(question.getByRole("button", { name: "Keep going" })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(question).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(log(page)).toHaveText("kept going, kept going");
});

test("the question opens whole above the sticky bar, at the end of a long page", async ({ page }) => {
  await openFlow(page);
  const strip = page.locator(".fui-action-bar");
  // The bar sticks to the bottom of the window while the page is at its top.
  expect(await page.evaluate(() => scrollY)).toBe(0);
  const resting = (await strip.boundingBox())!;
  expect(Math.abs(resting.y + resting.height - 700)).toBeLessThan(1);
  await bar(page).getByRole("button", { name: "End session" }).click();
  const question = page.getByRole("group", { name: "End the session early?" });
  await expect(question.getByRole("button", { name: "Keep going" })).toBeFocused();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(200);
  const block = (await question.boundingBox())!;
  const stuck = (await strip.boundingBox())!;
  expect(Math.abs(stuck.y + stuck.height - 700)).toBeLessThan(1);
  expect(block.y).toBeGreaterThanOrEqual(0);
  // Its bottom edge clears the bar by the margin the stylesheet asks for (8 px), not by luck.
  const gap = stuck.y - (block.y + block.height);
  expect(gap).toBeGreaterThanOrEqual(7);
  expect(gap).toBeLessThan(14);
  // That margin is the bar's own measured height, published on its container.
  const published = await strip.evaluate((node) => (node.parentElement as HTMLElement).style.getPropertyValue("--fui-action-bar-size"));
  expect(published).toBe(`${Math.ceil(stuck.height)}px`);
  const margin = await question.evaluate((node) => parseFloat(getComputedStyle(node).scrollMarginBottom));
  expect(margin).toBe(Math.ceil(stuck.height) + 8);
});

test("an answer that takes time loads, ignores a second press and Escape, then closes and gives focus back", async ({ page }) => {
  await openFlow(page);
  const trigger = bar(page).getByRole("button", { name: "End session" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const question = page.getByRole("group", { name: "End the session early?" });
  await expect(question.getByRole("button", { name: "Keep going" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(question.getByRole("button", { name: "End session" })).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  const answer = question.getByRole("button", { name: "Ending" });
  await expect(answer).toHaveAttribute("aria-busy", "true");
  await expect(answer).toBeFocused();
  await expect(question).toHaveAttribute("data-pending", "true");
  await expect(question.getByRole("button", { name: "Keep going" })).toHaveAttribute("aria-disabled", "true");
  await page.keyboard.press("Escape");
  await expect(question).toBeVisible();
  await expect(question).toHaveCount(0, { timeout: 3000 });
  // One request, however many presses.
  await expect(log(page)).toHaveText("ending, ended");
  await expect(trigger).toBeFocused();
});

test("a failed answer says why in an alert and stays open to try again", async ({ page }) => {
  await openFlow(page);
  const trigger = bar(page).getByRole("button", { name: "Abandon" });
  await trigger.click();
  const question = page.getByRole("group", { name: "Abandon the exam?" });
  await expect(question).toHaveAttribute("data-destructive", "true");
  await expect(question.getByRole("button", { name: "Keep going" })).toBeFocused();
  const answer = question.getByRole("button", { name: "Abandon the exam" });
  await expect(answer).toHaveAttribute("data-variant", "destructive");
  await answer.click();
  await expect(question.getByRole("alert")).toHaveText("The connection dropped. Try again.");
  await expect(question).toBeVisible();
  await expect(answer).not.toHaveAttribute("aria-busy", "true");
  await expect(log(page)).toHaveText("");
  await answer.click();
  // The old failure goes while the new attempt runs.
  await expect(question.getByRole("alert")).toHaveCount(0);
  await expect(question).toHaveCount(0);
  await expect(log(page)).toHaveText("abandoned");
  await expect(trigger).toBeFocused();
});

test("pressed with its box empty the answer says what is missing and moves to the box; a new agreement empties it", async ({ page }) => {
  await openFlow(page);
  const trigger = bar(page).getByRole("button", { name: "Keep recording" });
  await trigger.click();
  const question = page.getByRole("group", { name: "Keep this recording?" });
  const box = question.getByRole("checkbox", { name: "I agree that this recording is kept for 30 days." });
  const answer = question.getByRole("button", { name: "Keep the recording" });
  await expect(box).not.toBeChecked();
  await expect(box).toHaveAttribute("aria-required", "true");
  // Never disabled: a dead button would not say why.
  await expect(answer).toBeEnabled();
  await answer.click();
  await expect(question.getByRole("alert")).toHaveText("Tick the box to keep the recording");
  await expect(box).toBeFocused();
  await expect(box).toHaveAttribute("aria-invalid", "true");
  await expect(box).toHaveAccessibleDescription("Tick the box to keep the recording");
  await expect(question).toBeVisible();
  await expect(log(page)).toHaveText("");
  await page.keyboard.press("Space");
  await expect(box).toBeChecked();
  await expect(question.getByRole("alert")).toHaveCount(0);
  await expect(box).not.toHaveAttribute("aria-invalid", "true");
  // What is agreed to changes: the tick does not carry over.
  await question.getByRole("button", { name: "Keep it for 90 days instead" }).click();
  const longer = question.getByRole("checkbox", { name: "I agree that this recording is kept for 90 days." });
  await expect(longer).not.toBeChecked();
  await answer.click();
  await expect(longer).toBeFocused();
  await expect(question.getByRole("alert")).toBeVisible();
  await longer.check();
  await answer.click();
  await expect(question).toHaveCount(0);
  await expect(log(page)).toHaveText("kept for 90 days, agreed true");
  await expect(trigger).toBeFocused();
});

test("the question rises in only when motion is welcome", async ({ page }) => {
  await openFlow(page);
  await bar(page).getByRole("button", { name: "End session" }).click();
  const question = page.getByRole("group", { name: "End the session early?" });
  expect(await question.evaluate((node) => getComputedStyle(node).animationName)).toBe("none");
  await page.keyboard.press("Escape");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await bar(page).getByRole("button", { name: "End session" }).click();
  expect(await question.evaluate((node) => getComputedStyle(node).animationName)).toBe("fui-inline-confirm-in");
});

// ------------------------------------------------------------------ action bar

test("the bar keeps its height published as it wraps, and its actions share a row on a phone", async ({ page }) => {
  await openFlow(page);
  const strip = page.locator(".fui-action-bar");
  const published = () => strip.evaluate((node) => (node.parentElement as HTMLElement).style.getPropertyValue("--fui-action-bar-size"));
  const height = async () => `${Math.ceil((await strip.boundingBox())!.height)}px`;
  const wide = await published();
  expect(wide).toBe(await height());
  expect(await strip.evaluate((node) => getComputedStyle(node).position)).toBe("sticky");
  const actions = strip.locator(".fui-action-bar-end");
  expect((await actions.boundingBox())!.width).toBeLessThan((await strip.boundingBox())!.width / 2);
  await page.setViewportSize({ width: 390, height: 700 });
  // No render happens: the variable follows the ResizeObserver.
  await expect.poll(published).not.toBe(wide);
  expect(await published()).toBe(await height());
  const row = (await strip.boundingBox())!;
  const end = (await actions.boundingBox())!;
  expect(end.width).toBeGreaterThan(row.width - 40);
  for (const button of await actions.getByRole("button").all()) expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  // useViewportInsets publishes the keyboard's inset on the root: nothing covers the page here.
  expect(await page.evaluate(() => document.documentElement.style.getPropertyValue("--fui-keyboard-inset"))).toBe("0px");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

// ------------------------------------------------------------------ countdown

const timer = (page: Page) => page.getByRole("timer", { name: "Time left" });
const clock = (page: Page) => timer(page).locator(".fui-countdown-clock");
const spoken = (page: Page) => page.locator(".fui-countdown").first().getByRole("status");
const hook = async (page: Page) => JSON.parse((await page.getByTestId("hook").textContent())!);

async function openClock(page: Page) {
  await page.setViewportSize({ width: 800, height: 600 });
  await page.clock.install({ time: new Date(NOW) });
  await open(page, "ticking");
  // The story's deadline is 365 s after NOW: a minute in, with the clock stopped, 5:05 is left.
  await page.clock.pauseAt(new Date(NOW + 60_000));
  await expect(clock(page)).toHaveText("5:05");
}

test("the clock is a timer that is never live and speaks only when a mark is passed", async ({ page }) => {
  await openClock(page);
  await expect(timer(page)).not.toHaveAttribute("aria-live", /.*/);
  await expect(clock(page)).toHaveAttribute("aria-hidden", "true");
  await expect(clock(page)).toHaveAttribute("dir", "ltr");
  await expect(timer(page).locator(".fui-sr-only")).toHaveText("5 minutes 5 seconds left");
  await expect(spoken(page)).toHaveAttribute("aria-live", "polite");
  await expect(spoken(page)).toHaveText("");
  await expect(page.locator(".fui-countdown").first()).toHaveAttribute("data-tone", "calm");
  expect(await hook(page)).toEqual({ remainingMs: 305_000, seconds: 305, done: false, tone: "calm", crossed: null });
  await page.clock.runFor(4_000);
  await expect(clock(page)).toHaveText("5:01");
  await expect(spoken(page)).toHaveText("");
  await page.clock.runFor(2_000);
  await expect(clock(page)).toHaveText("4:59");
  await expect(spoken(page)).toHaveText("5 minutes left");
  await expect(page.locator(".fui-countdown").first()).toHaveAttribute("data-tone", "low");
  expect(await hook(page)).toEqual({ remainingMs: 299_000, seconds: 299, done: false, tone: "low", crossed: 300 });
  // It keeps saying the same thing, so it is spoken once.
  await page.clock.runFor(30_000);
  await expect(clock(page)).toHaveText("4:29");
  await expect(spoken(page)).toHaveText("5 minutes left");
});

test("a tab that slept reads the right time on waking, says only the latest mark, and ends once", async ({ page }) => {
  await openClock(page);
  // The lid closes for almost five minutes: no timer runs, then the page is shown again.
  await page.clock.setSystemTime(new Date(NOW + 60_000 + 298_200));
  await expect(clock(page)).toHaveText("5:05");
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await expect(clock(page)).toHaveText("0:07");
  // Three marks went by (300, 60 and 10 seconds): only the last is news.
  await expect(spoken(page)).toHaveText("10 seconds left");
  await expect(page.locator(".fui-countdown").first()).toHaveAttribute("data-tone", "urgent");
  // The second clock on the page shares the ticker and woke with it.
  await expect(page.getByRole("timer", { name: "The same deadline" }).locator(".fui-countdown-clock")).toHaveText("0:07");
  await expect(page.getByTestId("done")).toHaveText("Done 0");
  // Rounded up: with 0.8 s left it reads 0:01, not zero.
  await page.clock.runFor(6_000);
  await expect(clock(page)).toHaveText("0:01");
  await expect(page.getByTestId("done")).toHaveText("Done 0");
  await page.clock.runFor(1_000);
  await expect(clock(page)).toHaveText("0:00");
  await expect(spoken(page)).toHaveText("Time is up");
  await expect(timer(page).locator(".fui-countdown-label")).toHaveText("Time is up");
  await expect(page.locator(".fui-countdown").first()).toHaveAttribute("data-done", "true");
  await expect(page.locator(".fui-countdown").first()).toHaveAttribute("data-tone", "urgent");
  await expect(page.getByTestId("done")).toHaveText("Done 1");
  expect(await hook(page)).toEqual({ remainingMs: 0, seconds: 0, done: true, tone: "urgent", crossed: 0 });
  await page.clock.runFor(10_000);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(clock(page)).toHaveText("0:00");
  await expect(page.getByTestId("done")).toHaveText("Done 1");
});

test("the window taking focus and a page restored from the cache also read the clock again", async ({ page }) => {
  await openClock(page);
  await page.clock.setSystemTime(new Date(NOW + 60_000 + 5_500));
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(clock(page)).toHaveText("5:00");
  await page.clock.setSystemTime(new Date(NOW + 60_000 + 65_000));
  await page.evaluate(() => window.dispatchEvent(new Event("pageshow")));
  await expect(clock(page)).toHaveText("4:00");
});

// ------------------------------------------------------------------ theme

const reading = (page: Page) => page.getByTestId("theme-reading");
const island = (page: Page) => page.getByTestId("theme-island");
const themeColor = (page: Page) => page.evaluate(() => document.querySelector('meta[name="theme-color"]:not([media])')?.getAttribute("content") ?? null);
const scheme = (target: Locator) => target.evaluate((node) => (node as HTMLElement).style.colorScheme);

test("a choice sets the class, the colour scheme and theme-color, and is kept", async ({ page }) => {
  await open(page, "theme");
  await expect(reading(page)).toHaveText("Choice system, painted light");
  await expect(island(page)).toHaveClass("light");
  expect(await scheme(island(page))).toBe("light");
  expect(await themeColor(page)).toBe("#f6f7f8");
  await page.getByRole("button", { name: "Dark" }).click();
  await expect(reading(page)).toHaveText("Choice dark, painted dark");
  await expect(island(page)).toHaveClass("dark");
  expect(await scheme(island(page))).toBe("dark");
  expect(await themeColor(page)).toBe("#08090b");
  expect(await page.evaluate(() => localStorage.getItem("fui-story-theme"))).toBe("dark");
  // The box is painted with the dark tokens, inside a light page.
  const [inside, outside] = await page.evaluate(() => [getComputedStyle(document.querySelector('[data-testid="theme-island"]')!).backgroundColor, getComputedStyle(document.body).backgroundColor]);
  expect(inside).not.toBe(outside);
  // The root is not this provider's to touch: it was given a target.
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(page.getByRole("button", { name: "Dark" })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(reading(page)).toHaveText("Choice dark, painted dark");
  await expect(island(page)).toHaveClass("dark");
});

test("while the choice is system the device decides, and stops deciding once a theme is chosen", async ({ page }) => {
  await open(page, "theme");
  await expect(reading(page)).toHaveText("Choice system, painted light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(reading(page)).toHaveText("Choice system, painted dark");
  await expect(island(page)).toHaveClass("dark");
  expect(await scheme(island(page))).toBe("dark");
  expect(await themeColor(page)).toBe("#08090b");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(reading(page)).toHaveText("Choice system, painted light");
  await expect(island(page)).toHaveClass("light");
  await page.getByRole("button", { name: "Light" }).click();
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(reading(page)).toHaveText("Choice light, painted light");
  await expect(island(page)).toHaveClass("light");
  await page.getByRole("button", { name: "System" }).click();
  await expect(reading(page)).toHaveText("Choice system, painted dark");
});

test("a second tab follows the first", async ({ page, context }) => {
  await open(page, "theme");
  const other = await context.newPage();
  await open(other, "theme");
  await expect(reading(other)).toHaveText("Choice system, painted light");
  await page.getByRole("button", { name: "Dark" }).click();
  await expect(reading(other)).toHaveText("Choice dark, painted dark");
  await expect(island(other)).toHaveClass("dark");
  await other.getByRole("button", { name: "Light" }).click();
  await expect(reading(page)).toHaveText("Choice light, painted light");
  await expect(island(page)).toHaveClass("light");
});

test("storage that refuses the write still changes the theme, in memory", async ({ page }) => {
  await page.addInitScript(() => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === "fui-story-theme") throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
      setItem.call(this, key, value);
    };
  });
  await open(page, "theme");
  await page.getByRole("button", { name: "Dark" }).click();
  await expect(reading(page)).toHaveText("Choice dark, painted dark");
  await expect(island(page)).toHaveClass("dark");
  expect(await page.evaluate(() => localStorage.getItem("fui-story-theme"))).toBe(null);
  await page.getByRole("button", { name: "Light" }).click();
  await expect(reading(page)).toHaveText("Choice light, painted light");
});

test("the init script paints the stored theme before anything else on the page runs", async ({ page, context, baseURL }) => {
  const colours = { light: "#f6f7f8", dark: "#08090b" };
  const blank = (options: Parameters<typeof themeInitScript>[0]) => `<!doctype html><html lang="en"><head><title>Blank</title>
    <meta name="theme-color" content="#ffffff"><script>${themeInitScript(options)}</script></head>
    <body><script>window.atBody = { name: document.documentElement.className, theme: document.documentElement.getAttribute("data-theme"), scheme: document.documentElement.style.colorScheme }</script><h1>Blank</h1></body></html>`;
  await context.route("**/blank-class.html", (route) => route.fulfill({ contentType: "text/html", body: blank({ storageKey: "fui-blank-theme", defaultTheme: "light", themeColor: colours }) }));
  await context.route("**/blank-attribute.html", (route) => route.fulfill({ contentType: "text/html", body: blank({ storageKey: "fui-blank-theme", attribute: "data-theme" }) }));
  await context.addInitScript(() => {
    if (location.pathname.startsWith("/blank-") && !location.hash) localStorage.setItem("fui-blank-theme", "dark");
  });
  // No React and no stylesheet on this page: what is there when the body starts is the script's doing.
  await page.goto(`${baseURL}/blank-class.html`);
  expect(await page.evaluate(() => (window as unknown as { atBody: unknown }).atBody)).toEqual({ name: "dark", theme: null, scheme: "dark" });
  expect(await themeColor(page)).toBe(colours.dark);
  await page.goto(`${baseURL}/blank-attribute.html`);
  expect(await page.evaluate(() => (window as unknown as { atBody: unknown }).atBody)).toEqual({ name: "", theme: "dark", scheme: "dark" });
  // Nothing stored: the default, and "system" follows the device.
  await page.evaluate(() => localStorage.removeItem("fui-blank-theme"));
  await page.goto(`${baseURL}/blank-class.html#kept`);
  expect(await page.evaluate(() => (window as unknown as { atBody: unknown }).atBody)).toEqual({ name: "light", theme: null, scheme: "light" });
  expect(await themeColor(page)).toBe(colours.light);
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(`${baseURL}/blank-attribute.html#kept`);
  expect(await page.evaluate(() => (window as unknown as { atBody: unknown }).atBody)).toEqual({ name: "", theme: "system", scheme: "dark" });
});

// ------------------------------------------------------------------ back button, pages

async function openBack(page: Page) {
  await open(page, "back-keys");
  return new URL(page.url());
}

/** The story as a link opened in a new tab: the one way a page starts with nothing to go back to. */
async function openInNewTab(page: Page) {
  await openBack(page);
  const [tab] = await Promise.all([page.waitForEvent("popup"), page.evaluate((url) => void window.open(url), story("back-keys"))]);
  await expect(tab.locator("#storybook-root h1").first()).toBeVisible();
  expect(await tab.evaluate(() => history.length)).toBe(1);
  return tab;
}

test("with no history the back key follows its fallback, by itself or through the host's router", async ({ page }) => {
  const tab = await openInNewTab(page);
  await tab.getByRole("button", { name: "Back with a router" }).click();
  await expect(tab.getByTestId("went")).toHaveText("/inbox");
  expect(new URL(tab.url()).hash).toBe("");
  await tab.getByRole("button", { name: "Go back" }).focus();
  await tab.keyboard.press("Enter");
  await expect.poll(() => new URL(tab.url()).hash).toBe("#fallback");
});

test("as a link it is a link, and with no history its own href is the fallback", async ({ page }) => {
  const tab = await openInNewTab(page);
  const link = tab.getByRole("link", { name: "Back as a link" });
  await expect(link).toHaveAttribute("href", "#linked");
  await expect(link).not.toHaveAttribute("type", /.*/);
  await expect(link).not.toHaveAttribute("role", /.*/);
  await link.click();
  await expect.poll(() => new URL(tab.url()).hash).toBe("#linked");
});

test("with history every form of the back key goes back", async ({ page }) => {
  const start = await openBack(page);
  for (const name of ["Go back", "Back with a router", "Back as a link"]) {
    await page.evaluate(() => history.pushState(null, "", "#step-2"));
    expect(new URL(page.url()).hash).toBe("#step-2");
    await page.getByText(name, { exact: true }).click();
    await expect.poll(() => page.url()).toBe(start.href);
    await expect(page.getByTestId("went")).toHaveText("");
  }
});

test("right to left: the arrow turns, the safe answer leads from the right and the clock keeps its order", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await open(page, "pieces");
  const frame = page.locator('[dir="rtl"]').last();
  const arrow = frame.locator(".fui-back-button-icon");
  expect(await arrow.evaluate((node) => getComputedStyle(node).scale)).toBe("-1 1");
  expect(await page.locator(".fui-back-button-icon").first().evaluate((node) => getComputedStyle(node).scale)).toBe("none");
  const question = frame.getByRole("group", { name: "إنهاء الجلسة مبكرًا؟" });
  const safe = (await question.getByRole("button", { name: "متابعة" }).boundingBox())!;
  const answer = (await question.getByRole("button", { name: "إنهاء الجلسة" }).boundingBox())!;
  expect(safe.x).toBeGreaterThan(answer.x);
  const digits = frame.locator(".fui-countdown-clock");
  await expect(digits).toHaveText("٤:٥٩");
  expect(await digits.evaluate((node) => getComputedStyle(node).direction)).toBe("ltr");
  // The bar's leading slot is on the right, its actions on the left.
  const strip = frame.locator(".fui-action-bar");
  const start = (await strip.locator(".fui-action-bar-start").boundingBox())!;
  const end = (await strip.locator(".fui-action-bar-end").boundingBox())!;
  expect(start.x).toBeGreaterThan(end.x);
});

test("a state page anchors to the gutter in its upper third, and an error state can be retried from the keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "pieces");
  const missing = page.locator('.fui-state-page[data-align="start"]');
  const frame = (await missing.boundingBox())!;
  const body = (await missing.locator(".fui-state-page-body").boundingBox())!;
  const gutter = await missing.evaluate((node) => parseFloat(getComputedStyle(node).paddingInlineStart));
  expect(Math.abs(body.x - frame.x - gutter)).toBeLessThan(1);
  // Twice the free space under the content as between the brand and it.
  const brand = (await missing.locator(".fui-state-page-brand").boundingBox())!;
  const above = body.y - (brand.y + brand.height);
  const below = frame.y + frame.height - (body.y + body.height);
  expect(Math.abs(below - 2 * above)).toBeLessThan(2);
  await expect(missing.getByRole("heading", { name: "This page does not exist" })).toBeVisible();
  expect(await missing.locator(".fui-state-page-code").evaluate((node) => getComputedStyle(node).textTransform)).toBe("none");
  const centred = (await page.locator('.fui-state-page[data-align="center"] .fui-state-page-body').boundingBox())!;
  const centredFrame = (await page.locator('.fui-state-page[data-align="center"]').boundingBox())!;
  expect(Math.abs(centred.x + centred.width / 2 - (centredFrame.x + centredFrame.width / 2))).toBeLessThan(1);

  const failed = page.locator(".fui-error-state").first();
  await expect(failed).toHaveAttribute("role", "alert");
  await expect(failed.locator(".fui-error-state-reference")).toContainText("Reference 3f9a1c07");
  const retry = failed.getByRole("button", { name: "Try again" });
  await retry.focus();
  await expect(retry).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(failed.getByRole("link", { name: "Go home" })).toBeFocused();
  await expect(failed.getByRole("button", { name: "Copy reference" })).toBeVisible();
  await expect(page.locator(".fui-error-state").nth(2).getByRole("button", { name: "Try again" })).toHaveAttribute("aria-busy", "true");
});

test("forced colors: each tone of the clock and a destructive question keep a shape of their own", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.setViewportSize({ width: 1024, height: 900 });
  await open(page, "pieces");
  const edge = (target: Locator) =>
    target.evaluate((node) => {
      const style = getComputedStyle(node);
      return { width: style.borderTopWidth, line: style.borderTopStyle, colour: style.borderTopColor, canvas: getComputedStyle(document.body).backgroundColor };
    });
  const tones = page.locator('.fui-countdown[data-size="md"]');
  const calm = await edge(tones.nth(0));
  const low = await edge(tones.nth(1));
  const urgent = await edge(tones.nth(2));
  expect([calm.width, calm.line]).toEqual(["1px", "solid"]);
  expect([low.width, low.line]).toEqual(["1px", "dashed"]);
  expect([urgent.width, urgent.line]).toEqual(["2px", "solid"]);
  for (const tone of [calm, low, urgent]) expect(tone.colour).not.toBe(tone.canvas);
  // And an icon of its own each, the end included.
  const icons = await tones.evaluateAll((nodes) => nodes.slice(0, 4).map((node) => node.querySelector("svg")!.getAttribute("class")));
  expect(new Set(icons).size).toBe(4);
  const plain = await edge(page.getByRole("group", { name: "End the session early?" }));
  const destructive = await edge(page.getByRole("group", { name: "Abandon the exam?" }));
  expect(plain.width).toBe("1px");
  expect(destructive.width).toBe("2px");
  expect(plain.colour).not.toBe(plain.canvas);
  expect(destructive.colour).not.toBe(destructive.canvas);
  expect(destructive.colour).not.toBe(plain.colour);
  const hairline = await page.locator(".fui-action-bar").first().evaluate((node) => [getComputedStyle(node).borderTopColor, getComputedStyle(document.body).backgroundColor]);
  expect(hairline[0]).not.toBe(hairline[1]);
});

// ------------------------------------------------------------------ the component pages

test("the pages of Inline confirm and Countdown render and their playgrounds answer", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.goto("/iframe.html?id=components-inline-confirm--overview&viewMode=story&globals=theme:light");
  await expect(page.getByRole("heading", { name: "Inline confirm", level: 1 })).toBeVisible();
  // The two examples that start open are on the page when it loads: they leave focus and the scroll alone.
  await expect(page.getByRole("group", { name: "Keep this recording?" })).toBeVisible();
  expect(await page.evaluate(() => [document.activeElement === document.body, scrollY])).toEqual([true, 0]);
  await page.goto("/iframe.html?id=components-inline-confirm--playground&viewMode=story&globals=theme:light&args=destructive:!true;error:The+connection+dropped");
  await page.getByRole("button", { name: "End session" }).click();
  const question = page.getByRole("group", { name: "End the session early?" });
  await expect(question).toHaveAttribute("data-destructive", "true");
  await expect(question.getByRole("alert")).toHaveText("The connection dropped");
  await expect(question.getByRole("button", { name: "Keep going" })).toBeFocused();
  await page.goto("/iframe.html?id=components-countdown--overview&viewMode=story&globals=theme:light");
  await expect(page.getByRole("heading", { name: "Countdown", level: 1 })).toBeVisible();
  await expect(page.getByRole("timer", { name: "Section 2", exact: true }).locator(".fui-countdown-clock")).toHaveText(/^5:0\d$/);
  await page.goto("/iframe.html?id=components-countdown--playground&viewMode=story&globals=theme:light&args=size:sm;hideLabel:!true;tone:calm");
  const small = page.locator(".fui-countdown");
  await expect(small).toHaveAttribute("data-size", "sm");
  await expect(small.locator(".fui-countdown-clock")).toHaveText("4:59");
  // The tone the thresholds give (low, under five minutes) gives way to the one asked for.
  await expect(small).toHaveAttribute("data-tone", "calm");
  await expect(small.locator(".fui-countdown-label")).toHaveCount(0);
  expect(errors).toEqual([]);
});
