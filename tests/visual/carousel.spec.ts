// The carousel in a real browser: which keys move a slide and from where, both axes and both writing directions, the two
// keys' names and ends, and a field in a slide that keeps its arrows. Assertions read state and geometry; the six
// references are of the bench at rest.
import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const STORY = "/iframe.html?id=tests-carousel--pieces&viewMode=story";

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
  await page.goto(`${STORY}&globals=theme:${theme}`);
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  // Embla names the slides once it has measured them.
  await expect(page.getByRole("region", { name: "Reports" }).getByRole("group", { name: "1 of 5" })).toBeVisible();
}

/** The slide in view: the one whose box covers the centre of the viewport. */
const current = (carousel: Locator) =>
  carousel.evaluate((root) => {
    const viewport = root.querySelector(".fui-carousel-viewport")!.getBoundingClientRect();
    const x = viewport.left + viewport.width / 2;
    const y = viewport.top + viewport.height / 2;
    return [...root.querySelectorAll('[data-slot="carousel-item"]')].findIndex((slide) => {
      const rect = slide.getBoundingClientRect();
      return rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom;
    });
  });

const box = async (locator: Locator) => {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error("no box");
  return { ...rect, right: rect.x + rect.width, bottom: rect.y + rect.height, cx: rect.x + rect.width / 2, cy: rect.y + rect.height / 2 };
};

for (const theme of ["light", "dark"]) {
  for (const width of [390, 768, 1440]) {
    test(`carousel ${theme} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 960 });
      await open(page, theme);
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark).*$/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const result = await audit(page);
      expect(result.violations).toEqual([]);
      await expect(page).toHaveScreenshot(`carousel-${theme}-${width}.png`, { fullPage: true });
    });
  }
}

test("the region is a named tab stop with its ring inside; its arrows, Home and End move a slide", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const carousel = page.getByRole("region", { name: "Reports" });
  await expect(carousel).toHaveAttribute("aria-roledescription", "carousel");
  await page.keyboard.press("Tab");
  await expect(carousel).toBeFocused();
  const ring = await carousel.evaluate((root) => {
    const own = getComputedStyle(root);
    const viewport = getComputedStyle(root.querySelector(".fui-carousel-viewport")!);
    return { own: own.outlineStyle, style: viewport.outlineStyle, width: viewport.outlineWidth, offset: viewport.outlineOffset };
  });
  expect(ring).toEqual({ own: "none", style: "solid", width: "2px", offset: "-2px" });

  expect(await current(carousel)).toBe(0);
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => current(carousel)).toBe(1);
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => current(carousel)).toBe(2);
  await page.keyboard.press("ArrowLeft");
  await expect.poll(() => current(carousel)).toBe(1);
  // Up and Down are the page's in a row; a modifier is the browser's.
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Alt+ArrowRight");
  await page.keyboard.press("Shift+ArrowRight");
  expect(await current(carousel)).toBe(1);
  await page.keyboard.press("End");
  await expect.poll(() => current(carousel)).toBe(4);
  await page.keyboard.press("ArrowRight");
  expect(await current(carousel)).toBe(4);
  await page.keyboard.press("Home");
  await expect.poll(() => current(carousel)).toBe(0);
});

test("the two keys have names, are off at the ends without losing focus, and take the arrows too", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const carousel = page.getByRole("region", { name: "Reports" });
  const previous = carousel.getByRole("button", { name: "Previous slide" });
  const next = carousel.getByRole("button", { name: "Next slide" });
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
  // Every slide says its place.
  for (const place of [1, 2, 3, 4, 5]) await expect(carousel.getByRole("group", { name: `${place} of 5` })).toHaveCount(1);
  await expect(carousel.getByRole("group", { name: "1 of 5" })).toHaveAttribute("aria-roledescription", "slide");

  await next.click();
  await expect.poll(() => current(carousel)).toBe(1);
  await expect(previous).toBeEnabled();
  await expect(next).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => current(carousel)).toBe(2);
  await page.keyboard.press("End");
  await expect.poll(() => current(carousel)).toBe(4);
  // At the end the key is off but keeps focus, so the next arrow is still heard.
  await expect(next).toBeDisabled();
  await expect(next).toBeFocused();
  await page.keyboard.press("Enter");
  expect(await current(carousel)).toBe(4);
  await page.keyboard.press("ArrowLeft");
  await expect.poll(() => current(carousel)).toBe(3);
  await expect(next).toBeEnabled();

  // The keys are outside the slides, previous at the left and next at the right.
  const viewport = await box(carousel.locator(".fui-carousel-viewport"));
  expect((await box(previous)).right).toBeLessThanOrEqual(viewport.x);
  expect((await box(next)).x).toBeGreaterThanOrEqual(viewport.right);
  expect(await previous.locator("svg").evaluate((node) => getComputedStyle(node).transform)).toBe("none");
});

test("arrows typed in a field inside a slide move the caret, not the slide", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const carousel = page.getByRole("region", { name: "Onboarding" });
  const field = carousel.getByRole("textbox", { name: "Name the workspace" });
  const caret = () => field.evaluate((node: HTMLInputElement) => node.selectionStart);
  await field.focus();
  await field.evaluate((node: HTMLInputElement) => node.setSelectionRange(node.value.length, node.value.length));
  expect(await caret()).toBe(7);
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  expect(await caret()).toBe(5);
  await page.keyboard.press("ArrowRight");
  expect(await caret()).toBe(6);
  await page.keyboard.press("Home");
  expect(await caret()).toBe(0);
  await page.keyboard.press("End");
  expect(await caret()).toBe(7);
  await page.keyboard.type("s");
  await expect(field).toHaveValue("Harbours");
  await page.waitForTimeout(200);
  expect(await current(carousel)).toBe(0);
  await expect(field).toBeFocused();
  // From the region itself the same key moves the slide.
  await carousel.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => current(carousel)).toBe(1);
});

test("a column answers Up and Down, and leaves Left and Right alone", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const carousel = page.getByRole("region", { name: "Release notes" });
  await expect(carousel).toHaveAttribute("data-orientation", "vertical");
  await carousel.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(150);
  expect(await current(carousel)).toBe(0);
  await page.keyboard.press("ArrowDown");
  await expect.poll(() => current(carousel)).toBe(1);
  await page.keyboard.press("ArrowDown");
  await expect.poll(() => current(carousel)).toBe(2);
  await page.keyboard.press("ArrowUp");
  await expect.poll(() => current(carousel)).toBe(1);
  await page.keyboard.press("End");
  await expect.poll(() => current(carousel)).toBe(3);
  await page.keyboard.press("Home");
  await expect.poll(() => current(carousel)).toBe(0);
  // Its keys sit above and below the slides.
  const viewport = await box(carousel.locator(".fui-carousel-viewport"));
  expect((await box(carousel.getByRole("button", { name: "Previous slide" }))).bottom).toBeLessThanOrEqual(viewport.y);
  expect((await box(carousel.getByRole("button", { name: "Next slide" }))).y).toBeGreaterThanOrEqual(viewport.bottom);
});

test("right to left: the first slide is at the right, Left goes on and Right goes back, the keys change sides and turn", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const carousel = page.getByRole("region", { name: "التقارير" });
  const previous = carousel.getByRole("button", { name: "الشريحة السابقة" });
  const next = carousel.getByRole("button", { name: "الشريحة التالية" });
  await expect(carousel.getByRole("group", { name: "1 من 4" })).toHaveCount(1);
  await expect(previous).toBeDisabled();
  const viewport = await box(carousel.locator(".fui-carousel-viewport"));
  expect((await box(previous)).x).toBeGreaterThanOrEqual(viewport.right);
  expect((await box(next)).right).toBeLessThanOrEqual(viewport.x);
  for (const key of [previous, next]) {
    expect(await key.locator("svg").evaluate((node) => getComputedStyle(node).transform)).toBe("matrix(-1, 0, 0, 1, 0, 0)");
  }
  // The second slide waits to the left of the first.
  const slides = carousel.locator('[data-slot="carousel-item"]');
  expect((await box(slides.nth(1))).x).toBeLessThan((await box(slides.nth(0))).x);

  await carousel.focus();
  expect(await current(carousel)).toBe(0);
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(150);
  expect(await current(carousel)).toBe(0);
  await page.keyboard.press("ArrowLeft");
  await expect.poll(() => current(carousel)).toBe(1);
  await page.keyboard.press("ArrowLeft");
  await expect.poll(() => current(carousel)).toBe(2);
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => current(carousel)).toBe(1);
  await next.click();
  await expect.poll(() => current(carousel)).toBe(2);
  await page.keyboard.press("End");
  await expect.poll(() => current(carousel)).toBe(3);
  await expect(next).toBeDisabled();
  await page.keyboard.press("Home");
  await expect.poll(() => current(carousel)).toBe(0);
});

test("under reduced motion a slide arrives at once; otherwise it travels", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const frames = (count: number) =>
    page.evaluate(
      (left) =>
        new Promise<void>((done) => {
          const tick = () => (left-- > 0 ? requestAnimationFrame(tick) : done());
          tick();
        }),
      count,
    );
  const offset = (carousel: Locator) =>
    carousel.evaluate((root) => {
      const viewport = root.querySelector(".fui-carousel-viewport")!.getBoundingClientRect();
      const second = root.querySelectorAll('[data-slot="carousel-item"]')[1]!.getBoundingClientRect();
      return Math.round(second.left - viewport.left);
    });

  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  let carousel = page.getByRole("region", { name: "Reports" });
  await carousel.focus();
  const rest = await offset(carousel);
  expect(rest).toBeGreaterThan(100);
  await page.keyboard.press("ArrowRight");
  await frames(3);
  // The second slide is where the first was: its own padding from the viewport's edge.
  const arrived = await offset(carousel);
  expect(arrived).toBeLessThanOrEqual(0);

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page);
  carousel = page.getByRole("region", { name: "Reports" });
  await carousel.focus();
  await page.keyboard.press("ArrowRight");
  await frames(3);
  const travelling = await offset(carousel);
  expect(travelling).toBeGreaterThan(arrived + 20);
  expect(travelling).toBeLessThan(rest);
  await expect.poll(() => offset(carousel)).toBe(arrived);
});

test.describe("under a finger", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test("the two keys are 44 px and a tap moves a slide", async ({ page }) => {
    await open(page);
    expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
    const carousel = page.getByRole("region", { name: "Reports" });
    for (const name of ["Previous slide", "Next slide"]) {
      const key = await box(carousel.getByRole("button", { name }));
      expect(key.width, name).toBeGreaterThanOrEqual(44);
      expect(key.height, name).toBeGreaterThanOrEqual(44);
    }
    await carousel.getByRole("button", { name: "Next slide" }).tap();
    await expect.poll(() => current(carousel)).toBe(1);
  });
});
