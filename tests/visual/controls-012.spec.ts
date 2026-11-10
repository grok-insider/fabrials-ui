// The pieces 0.12 added to what existed: a notice that can ask again and brings itself into view, a count under a field,
// the parts of a field, a slider's row and group, a legend of the host's own, a key that stays on, and what a finished
// picture offers. Assertions read state, focus and geometry; the six pictures are of the bench.
import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const BENCH = "/iframe.html?id=tests-controls-0-12--pieces&viewMode=story";
const REVEAL = "/iframe.html?id=tests-controls-0-12--reveal&viewMode=story";

const story = (path: string, theme = "light") => `${path}${path.includes("?") ? "&" : "?"}globals=theme:${theme}`;

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

async function open(page: Page, path = BENCH, theme = "light", ready = "#storybook-root h1") {
  await page.goto(story(path, theme));
  await expect(page.locator(ready).first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

for (const theme of ["light", "dark"] as const) {
  for (const width of [390, 768, 1440]) {
    test(`controls 0.12 ${theme} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 960 });
      await open(page, BENCH, theme);
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark).*$/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const result = await audit(page);
      expect(result.violations).toEqual([]);
      await expect(page).toHaveScreenshot(`controls-012-${theme}-${width}.png`, { fullPage: true });
    });
  }
}

// ------------------------------------------------------------------ asking again

const retry = (page: Page) => page.getByTestId("retry-alert").first();

test("a retry runs once while it is pending, keeps its focus and the notice says the new words", async ({ page }) => {
  await open(page);
  const alert = retry(page);
  await expect(alert).toHaveAttribute("role", "status");
  const button = alert.getByRole("button");
  await expect(button).toHaveText("Try again");
  await button.focus();
  await page.keyboard.press("Enter");
  // Busy rather than gone: the keyboard stays where the person left it, and a second press is ignored.
  await expect(button).toBeFocused();
  await expect(button).toHaveAttribute("aria-busy", "true");
  await expect(button).toHaveAttribute("aria-disabled", "true");
  await expect(button).toHaveText("Trying again");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  // The new words arrive and the live region reads them; one press, one attempt.
  await expect(alert).toContainText("Attempt 2", { timeout: 5_000 });
  await expect(alert).toHaveAttribute("data-attempt", "1");
  await expect(button).toHaveText("Try again");
  await expect(button).toBeFocused();
});

test("an alert that arrives late brings itself into view below the header and above the bar", async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 720 });
  await open(page, REVEAL, "light", '[data-slot="action-bar"]');
  const send = page.getByTestId("reveal-send");
  await send.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => window.scrollY);
  await send.click();
  const alert = page.getByTestId("late-alert");
  await expect(alert).toBeVisible();
  await page.waitForTimeout(400);
  const box = await alert.boundingBox();
  const frame = await page.evaluate(() => {
    const header = document.querySelector("header")!.getBoundingClientRect();
    const bar = document.querySelector('[data-slot="action-bar"]')!.getBoundingClientRect();
    return { header: header.bottom, bar: bar.top, height: innerHeight, scrolled: window.scrollY };
  });
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(frame.header);
  expect(box!.y + box!.height).toBeLessThanOrEqual(frame.bar + 1);
  expect(frame.scrolled).toBeGreaterThan(before);
});

// ------------------------------------------------------------------ counting

const field = (page: Page, id: string) => page.getByTestId(id);
const counter = (container: Locator) => container.locator(".fui-count-value");
const live = (container: Locator) => container.locator('[data-slot="count-live"]');

/** Every change of a live region's words, until the page is done with it. */
async function watch(region: Locator) {
  await region.evaluate((node) => {
    const said: string[] = [];
    (window as unknown as { __said: string[] }).__said = said;
    new MutationObserver(() => said.push(node.textContent ?? "")).observe(node, { childList: true, characterData: true, subtree: true });
  });
}

async function said(region: Locator) {
  return region.evaluate((node) => ((window as unknown as { __said: string[] }).__said ?? []).filter((line) => line.length > 0).concat(node.textContent ? [node.textContent] : []));
}

test("a soft limit never truncates, says how far past it the text is, and the region speaks the crossings once", async ({ page }) => {
  await open(page);
  const area = field(page, "typing");
  const box = area.locator("..");
  const region = live(box);
  const text = "A line that keeps on going past the limit".slice(0, 20);
  // The counter is the field's description, by id.
  const ids = (await area.getAttribute("aria-describedby"))!.split(" ");
  const counted = ids.filter((id) => id.endsWith("-count"));
  expect(counted).toHaveLength(1);
  await expect(page.locator(`#${counted[0]}`)).toHaveClass(/fui-count/);
  await expect(counter(box)).toHaveText("0 / 20");

  await watch(region);
  await area.click();
  for (const char of [...text, ..." and then some more".split("")]) await page.keyboard.type(char);
  const value = await area.inputValue();
  expect(value).toBe(`${text} and then some more`);
  await expect(counter(box)).toHaveText(`${value.length} / 20`);
  await expect(box.locator(".fui-count-over")).toHaveText(`${value.length - 20} over`);
  await expect(box.locator(".fui-count")).toHaveAttribute("data-level", "over");
  // At most one line per crossing (nine tenths, the limit, past it), and the last of them is the one that is true.
  await page.waitForTimeout(600);
  const messages = await said(region);
  expect(messages.length).toBeLessThanOrEqual(3);
  expect(messages.at(-1)).toBe(`${value.length - 20} over`);

  // Coming back under the limit says so.
  await watch(region);
  await area.fill("short");
  await expect(counter(box)).toHaveText("5 / 20");
  await expect(box.locator(".fui-count")).toHaveAttribute("data-level", "under");
  await expect(region).toHaveText("Under the limit again", { timeout: 3_000 });
});

test("a hard limit stops the typing at the limit, and the counter says so", async ({ page }) => {
  await open(page);
  const input = field(page, "hard");
  const box = input.locator("..");
  await input.click();
  for (const char of "abcdefghijklmnopqrstuvwxyz") await page.keyboard.type(char);
  await expect(input).toHaveValue("abcdefghijkl");
  await expect(counter(box)).toHaveText("12 / 12");
  await expect(input).toHaveAttribute("maxlength", "12");
});

test("a Chinese sentence is counted in words, not in runs between spaces", async ({ page }) => {
  await open(page);
  const area = field(page, "chinese");
  const box = area.locator("..");
  const words = Number((await counter(box).textContent())!.trim());
  expect(words).toBeGreaterThan(1);
});

// ------------------------------------------------------------------ fields

test("the parts of a field name its control, describe it with the error, and mark what is required", async ({ page }) => {
  await open(page);
  const parts = page.getByTestId("parts-email");
  const label = parts.getByText("Work email", { exact: false }).first();
  const input = parts.locator("input");
  await expect(input).not.toBeFocused();
  await label.click();
  await expect(input).toBeFocused();
  const described = await input.getAttribute("aria-describedby");
  expect(described).toContain("parts-field-description");
  expect(described).toContain("parts-field-error");
  const error = parts.locator('[role="alert"]');
  await expect(error).toHaveAttribute("id", "parts-field-error");
  await expect(error).toHaveText("That address is not reachable.");
  // The asterisk of a required field carries the word for a reader, and "optional" is a word of its own.
  const required = page.locator('label:has-text("Work email")').first();
  await expect(required.locator(".fui-field-required")).toHaveAttribute("aria-hidden", "true");
  await expect(required.locator(".fui-sr-only")).toHaveText("required");
  await expect(page.locator(".fui-field-optional").first()).toHaveText("optional");
});

// ------------------------------------------------------------------ slider

test("a slider's value follows the arrows, carries its unit, and one press is one commit", async ({ page }) => {
  await open(page);
  const thumb = page.getByRole("slider", { name: "Batch size" });
  await thumb.focus();
  const row = page.locator(".fui-slider[data-label]").filter({ hasText: "Batch size" });
  await expect(row.locator(".fui-slider-value")).toHaveText("40 rows");
  await page.keyboard.press("ArrowRight");
  await expect(thumb).toHaveAttribute("aria-valuenow", "45");
  await expect(row.locator(".fui-slider-value")).toHaveText("45 rows");
  await expect(thumb).toHaveAttribute("aria-valuetext", "45 rows");

  // A panel of sliders: one arrow, one commit.
  const commits = page.getByTestId("slider-commits");
  const rows = page.getByRole("slider", { name: "Rows" });
  await rows.focus();
  await expect(commits).toHaveText("0 committed");
  await page.keyboard.press("ArrowRight");
  await expect(commits).toHaveText("1 committed");
  await page.keyboard.press("ArrowRight");
  await expect(commits).toHaveText("2 committed");
});

test("a group of sliders lines its names and its values up, column by column", async ({ page }) => {
  await open(page);
  const group = page.getByTestId("slider-group");
  const names = await group.locator(".fui-slider-label").evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().left));
  const values = await group.locator(".fui-slider-value").evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().right));
  expect(names).toHaveLength(4);
  for (const left of names) expect(Math.abs(left - names[0]!)).toBeLessThan(1);
  for (const right of values) expect(Math.abs(right - values[0]!)).toBeLessThan(1);
});

test("a slider in a right-to-left row keeps its name at the start, which is the right", async ({ page }) => {
  await open(page);
  const row = page.locator(".fui-slider[data-label]").filter({ hasText: "الحجم" });
  const name = (await row.locator(".fui-slider-label").boundingBox())!;
  const value = (await row.locator(".fui-slider-value").boundingBox())!;
  expect(name.x).toBeGreaterThan(value.x);
});

test("a group under 28rem of its own width puts each name above its track", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await open(page);
  const group = page.getByTestId("slider-group");
  const wide = (await group.locator(".fui-slider-label").first().boundingBox())!;
  const track = (await group.locator(".fui-slider-control").first().boundingBox())!;
  expect(wide.x).toBeLessThan(track.x);
  // The panel is 520 px at most: narrowing the window narrows the group past 28rem of its own width.
  await page.setViewportSize({ width: 390, height: 960 });
  await page.waitForTimeout(200);
  const narrowLabel = (await group.locator(".fui-slider-label").first().boundingBox())!;
  const narrowTrack = (await group.locator(".fui-slider-control").first().boundingBox())!;
  expect(narrowLabel.y + narrowLabel.height).toBeLessThanOrEqual(narrowTrack.y + 1);
});

// ------------------------------------------------------------------ legend, keys and a finished picture

test("a legend of the host's own toggles its series with aria-pressed", async ({ page }) => {
  await open(page);
  const legend = page.getByTestId("legend");
  const errors = legend.getByRole("button", { name: "Show Errors" });
  await expect(errors).toHaveAttribute("aria-pressed", "false");
  await errors.click();
  await expect(legend.getByRole("button", { name: "Hide Errors" })).toHaveAttribute("aria-pressed", "true");
  // "Only" leaves that series alone: the others go off.
  const onlyErrors = legend.getByRole("button", { name: "Show only Errors" });
  await onlyErrors.click();
  await expect(legend.getByRole("button", { name: "Hide Errors" })).toHaveAttribute("aria-pressed", "true");
  await expect(legend.getByRole("button", { name: "Show Requests" })).toHaveAttribute("aria-pressed", "false");
  // A static legend is a row of names, not buttons.
  await expect(page.getByTestId("static-legend").getByRole("button")).toHaveCount(0);
});

test("one key that stays on answers Space and Enter", async ({ page }) => {
  await open(page);
  const bold = page.getByRole("button", { name: "Bold" });
  await bold.focus();
  await expect(bold).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Space");
  await expect(bold).toHaveAttribute("aria-pressed", "true");
  const italic = page.getByRole("button", { name: "Italic" });
  await italic.focus();
  await page.keyboard.press("Enter");
  await expect(italic).toHaveAttribute("aria-pressed", "false");
});

test("the actions of a finished picture are reachable by Tab, show on focus and carry the download name", async ({ page }) => {
  await open(page);
  const link = page.getByRole("link", { name: "Download" }).first();
  const actions = link.locator("..");
  expect(await actions.evaluate((node) => getComputedStyle(node).opacity)).toBe("0");
  // Real Tab presses: the point is that the keys are in the page's own order.
  for (let press = 0; press < 60; press += 1) {
    await page.keyboard.press("Tab");
    if (await page.evaluate(() => document.activeElement?.getAttribute("aria-label") === "Download")) break;
  }
  await expect(link).toBeFocused();
  await expect(link).toHaveAttribute("download", "harbour.png");
  expect(await actions.evaluate((node) => getComputedStyle(node).opacity)).toBe("1");
  await expect(page.locator("video").first()).toHaveAttribute("controls", "");
  await expect(page.locator("video").first()).toHaveAttribute("playsinline", "");
  await expect(page.getByRole("button", { name: "Open" })).toHaveCount(1);
});

test("a picture being made shows the prompt it is working on, cut to two lines", async ({ page }) => {
  await open(page);
  const prompt = page.locator(".fui-generation-prompt");
  await expect(prompt).toHaveText("a harbour at dusk, seen from the quay, long exposure");
  await expect(prompt).toHaveAttribute("dir", "auto");
  const clamp = await prompt.evaluate((node) => getComputedStyle(node).webkitLineClamp);
  expect(clamp).toBe("2");
});
