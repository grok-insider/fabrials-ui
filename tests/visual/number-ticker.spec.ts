// The number ticker: its pictures at rest, and the roll itself — the digits turning, the number spoken staying still, a change
// from wherever the columns are, and nothing moving at all under reduced motion.
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const STORY = "/iframe.html?id=tests-number-ticker--pieces&viewMode=story";

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
  await page.goto(`${STORY}&globals=theme:${theme}`);
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

for (const theme of ["light", "dark"]) {
  for (const width of [390, 768, 1440]) {
    test(`number ticker ${theme} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 960 });
      await open(page, theme);
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark).*$/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const result = await audit(page);
      expect(result.violations).toEqual([]);
      await expect(page).toHaveScreenshot(`number-ticker-${theme}-${width}.png`, { fullPage: true });
    });
  }
}

/**
 * The number a person sees: each rolling column is a stack of 0-9 moved by its transform, so its digit is how far it has moved
 * divided by the height of one glyph. A column at rest, a non-digit and a locale with its own digits are read as text.
 */
const visibleNumber = (selector: string) =>
  [...document.querySelector(selector)!.querySelector<HTMLElement>(".fui-ticker-row")!.children]
    .map((child) => {
      const column = child.querySelector<HTMLElement>(".fui-ticker-column");
      const glyph = column?.querySelector<HTMLElement>(".fui-ticker-glyph");
      if (!column || !glyph) return child.textContent ?? "";
      const height = glyph.getBoundingClientRect().height;
      const transform = getComputedStyle(column).transform;
      const moved = transform === "none" ? 0 : new DOMMatrix(transform).f;
      return String(Math.round(-moved / height));
    })
    .join("");

const read = (page: Page, selector: string) => page.evaluate(visibleNumber, selector);

test.describe("the roll", () => {
  test.use({ contextOptions: { reducedMotion: "no-preference" } });

  test("the number spoken is the last one from the first frame, while the digits are still turning", async ({ page }) => {
    await open(page);
    const spoken = page.locator("#ticker-live .fui-sr-only");
    expect(await spoken.textContent()).toBe("48,210");
    await expect.poll(() => read(page, "#ticker-live")).toBe("48,210");

    await page.getByRole("button", { name: "Set 12,840" }).click();
    // In the same beat the value is announced whole, and what moves has not got there.
    expect(await spoken.textContent()).toBe("12,840");
    const moving = await read(page, "#ticker-live");
    expect(moving, `the columns are mid-roll: ${moving}`).toMatch(/^\d{2},\d{3}$/);
    expect(moving).not.toBe("12,840");

    // It arrives and stops: the transition ends, leaves nothing running and no further frame changes it.
    await expect.poll(() => read(page, "#ticker-live"), { timeout: 5000 }).toBe("12,840");
    const running = () =>
      page.evaluate(() => [...document.querySelectorAll("#ticker-live .fui-ticker-column")].reduce((total, node) => total + node.getAnimations().length, 0));
    await expect.poll(running, { timeout: 5000 }).toBe(0);
    await page.waitForTimeout(400);
    expect(await read(page, "#ticker-live")).toBe("12,840");
    expect(await running()).toBe(0);
  });

  test("a column keeps its width while it turns, so the number does not jitter", async ({ page }) => {
    await open(page);
    await expect.poll(() => read(page, "#ticker-live")).toBe("48,210");
    const widths = await page.evaluate(
      () =>
        new Promise<number[]>((resolve) => {
          const seen: number[] = [];
          const ticker = document.querySelector("#ticker-live .fui-ticker")!;
          const start = performance.now();
          (document.querySelectorAll("#ticker-live button")[0] as HTMLElement).click();
          const tick = () => {
            seen.push(ticker.getBoundingClientRect().width);
            if (performance.now() - start < 1200) requestAnimationFrame(tick);
            else resolve(seen);
          };
          requestAnimationFrame(tick);
        }),
    );
    expect(widths.length).toBeGreaterThan(20);
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(0.5);
    expect(await page.locator("#ticker-live .fui-ticker").evaluate((node) => getComputedStyle(node).fontVariantNumeric)).toBe("tabular-nums");
  });

  test("a change in the middle of a roll starts from where the digits are, and ends on the last value", async ({ page }) => {
    await open(page);
    await expect.poll(() => read(page, "#ticker-live")).toBe("48,210");
    await page.getByRole("button", { name: "Set 12,840" }).click();
    await page.waitForTimeout(250);
    const before = await read(page, "#ticker-live");
    expect(before).not.toBe("12,840");
    await page.getByRole("button", { name: "Set 48,210" }).click();
    const after = await read(page, "#ticker-live");
    for (const [index, digit] of [...after].entries()) {
      if (digit === ",") continue;
      const from = Number(before[index]);
      expect(Math.abs(Number(digit) - from), `${digit} did not jump back from ${before} to ${after}`).toBeLessThanOrEqual(3);
    }
    await expect.poll(() => read(page, "#ticker-live"), { timeout: 5000 }).toBe("48,210");
  });

  test("a change to a shorter number leaves the last value", async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: "Set 960" }).click();
    await expect.poll(() => read(page, "#ticker-live"), { timeout: 5000 }).toBe("960");
  });

  test("a number that is below the fold counts up when it is seen, not before", async ({ page }) => {
    await page.goto(`/iframe.html?id=tests-number-ticker--on-view&viewMode=story`);
    await expect(page.locator("#ticker-on-view")).toBeAttached();
    await page.evaluate(() => document.fonts.ready);
    expect(await read(page, "#ticker-on-view")).toBe("00,000");
    await page.locator("#ticker-on-view").scrollIntoViewIfNeeded();
    await expect.poll(() => read(page, "#ticker-on-view"), { timeout: 5000 }).toBe("48,210");
    // It rolled there instead of appearing: the columns carried the transition.
    const columns = await page.evaluate(() => document.querySelectorAll("#ticker-on-view .fui-ticker-column").length);
    expect(columns).toBe(5);
  });

  test("the roll happens once on first paint and then holds still", async ({ page }) => {
    await open(page);
    const first = await read(page, "#ticker-plain");
    expect(first).not.toBe("12480");
    await expect.poll(() => read(page, "#ticker-plain"), { timeout: 5000 }).toBe("12480");
    const running = () =>
      page.evaluate(() => [...document.querySelectorAll("#ticker-plain .fui-ticker-column")].reduce((total, node) => total + node.getAnimations().length, 0));
    await expect.poll(running, { timeout: 5000 }).toBe(0);
    await page.waitForTimeout(400);
    expect(await read(page, "#ticker-plain")).toBe("12480");
  });
});

test("under reduced motion the value is there at once and nothing is left running", async ({ page }) => {
  await open(page);
  // The columns are not built at all: a value at rest, no keyframes and no transition to run.
  await expect(page.locator("#ticker-plain .fui-ticker-column")).toHaveCount(0);
  expect(await read(page, "#ticker-plain")).toBe("12480");
  expect(await page.locator("#ticker-plain .fui-ticker").evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(0);
  await page.getByRole("button", { name: "Set 12,840" }).click();
  expect(await read(page, "#ticker-live")).toBe("12,840");
  expect(await page.locator("#ticker-live .fui-ticker").evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(0);
  await page.waitForTimeout(300);
  expect(await read(page, "#ticker-live")).toBe("12,840");
});

test("a value is one number for assistive technology and a hidden row of glyphs for the eye", async ({ page }) => {
  await open(page);
  const ticker = page.locator("#ticker-affixes .fui-ticker");
  await expect(ticker.locator(".fui-sr-only")).toHaveText("$7 kg");
  await expect(ticker.locator(".fui-ticker-row")).toHaveAttribute("aria-hidden", "true");
  expect(await ticker.ariaSnapshot()).toContain("$7 kg");
});

test("a locale with its own digits writes them, and they do not roll", async ({ page }) => {
  await open(page);
  await expect(page.locator("#ticker-arabic .fui-sr-only")).toHaveText("١٢٬٤٨٠");
  await expect(page.locator("#ticker-arabic .fui-ticker-column")).toHaveCount(0);
  await expect(page.locator("#ticker-arabic .fui-ticker-char")).toHaveText(["١", "٢", "٬", "٤", "٨", "٠"]);
  // The same in a right-to-left frame: it is one inline run, in the order of the number.
  await expect(page.locator("#ticker-rtl .fui-ticker-char")).toHaveCount(6);
  await expect(page.locator("#ticker-rtl .fui-sr-only")).toHaveText("٤٨٬٢١٠");
});
