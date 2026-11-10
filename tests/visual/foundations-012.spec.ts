// The small pieces of 0.12 in a real browser: a time in the reader's zone that does not shift the page, an error boundary
// that hands focus back, text that keeps its direction, hotkeys with their guards, tokens as hex, exports and the
// announcer. Assertions read state and geometry; the pictures are the six references of the bench.
import { readFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const BENCH = "/iframe.html?id=tests-foundations-0-12--pieces&viewMode=story";
const HYDRATION = "/iframe.html?id=tests-foundations-0-12--local-time-hydration&viewMode=story";

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

async function open(page: Page, theme = "light", story = BENCH) {
  await page.goto(`${story}&globals=theme:${theme}`);
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

const block = (page: Page, title: string) => page.locator("section").filter({ has: page.getByRole("heading", { name: title, exact: true }) });

for (const theme of ["light", "dark"]) {
  for (const width of [390, 768, 1440]) {
    test(`foundations 0.12 ${theme} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 960 });
      await open(page, theme);
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark).*$/);
      // The swatches are measured and resolved after the first paint.
      await expect(page.getByTestId("tokens-The page").locator('[data-token="--chart-1"]')).toHaveAttribute("data-hex", /^#[0-9a-f]{6}$/);
      await expect(page.getByTestId("tokens-The page").getByTestId("measured")).toHaveText("measured");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const result = await audit(page);
      expect(result.violations).toEqual([]);
      await expect(page).toHaveScreenshot(`foundations-012-${theme}-${width}.png`, { fullPage: true });
    });
  }
}

// --- Hotkeys ---------------------------------------------------------------------------------------------------------

const hotkeyState = (page: Page) => page.getByTestId("hotkeys-state");
const blur = (page: Page) => page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

test("hotkeys fire from the page, and a key held down fires once", async ({ page }) => {
  await open(page);
  const state = hotkeyState(page);
  await blur(page);
  await page.keyboard.press("2");
  await expect(state).toHaveAttribute("data-picked", "1");
  await expect(state).toHaveAttribute("data-fired", "1");
  await expect(page.getByRole("button", { name: "2 la mesa" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "2 la mesa" })).toHaveAttribute("aria-keyshortcuts", "2");
  // From another button too: a digit is not that button's key.
  await page.getByRole("button", { name: "Another action" }).focus();
  await page.keyboard.press("3");
  await expect(state).toHaveAttribute("data-picked", "2");
  await expect(state).toHaveAttribute("data-fired", "2");
  // Held: the browser repeats the key, the hotkey does not.
  await blur(page);
  await page.keyboard.down("4");
  await page.keyboard.down("4");
  await page.keyboard.down("4");
  await page.keyboard.up("4");
  await expect(state).toHaveAttribute("data-picked", "3");
  await expect(state).toHaveAttribute("data-fired", "3");
});

test("hotkeys leave typing, the island, modified keys, composition and handled keys alone", async ({ page }) => {
  await open(page);
  const state = hotkeyState(page);
  await blur(page);
  await page.keyboard.press("1");
  await expect(state).toHaveAttribute("data-fired", "1");

  const note = page.getByRole("textbox", { name: "A note" });
  await note.focus();
  await page.keyboard.type("234");
  await expect(note).toHaveValue("234");
  await page.keyboard.press("Enter");
  await expect(state).toHaveAttribute("data-fired", "1");
  await expect(state).toHaveAttribute("data-checked", "0");
  // A binding that asks for it works while typing.
  await page.keyboard.press("Control+k");
  await expect(state).toHaveAttribute("data-picked", "");

  await page.getByRole("button", { name: "Report a problem" }).focus();
  await page.keyboard.press("2");
  await page.keyboard.press("Enter");
  await expect(state).toHaveAttribute("data-fired", "1");
  await expect(state).toHaveAttribute("data-picked", "");

  await blur(page);
  for (const chord of ["Control+2", "Alt+2", "Meta+2"]) await page.keyboard.press(chord);
  await expect(state).toHaveAttribute("data-fired", "1");

  // An IME composing text, and a key another handler already took.
  const sent = await page.evaluate(() => {
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "2", bubbles: true, cancelable: true, isComposing: true }));
    const taken = new KeyboardEvent("keydown", { key: "2", bubbles: true, cancelable: true });
    document.body.addEventListener("keydown", (event) => event.preventDefault(), { once: true });
    document.body.dispatchEvent(taken);
    // The one that does fire is cancelled, so the browser does nothing else with it.
    const plain = new KeyboardEvent("keydown", { key: "2", bubbles: true, cancelable: true });
    document.body.dispatchEvent(plain);
    return plain.defaultPrevented;
  });
  expect(sent).toBe(true);
  await expect(state).toHaveAttribute("data-fired", "2");
  await expect(state).toHaveAttribute("data-picked", "1");
});

test("Enter checks from the page, and on a focused button it presses that button only", async ({ page }) => {
  await open(page);
  const state = hotkeyState(page);
  await blur(page);
  await page.keyboard.press("Enter");
  await expect(state).toHaveAttribute("data-checked", "1");
  await page.keyboard.press("Shift+Enter");
  await expect(state).toHaveAttribute("data-checked", "1");

  await page.getByRole("button", { name: "Another action" }).focus();
  await page.keyboard.press("Enter");
  await expect(state).toHaveAttribute("data-pressed", "1");
  await page.keyboard.press("Space");
  await expect(state).toHaveAttribute("data-pressed", "2");
  await expect(state).toHaveAttribute("data-checked", "1");
});

test("a scoped hotkey answers only while focus is inside its scope", async ({ page }) => {
  await open(page);
  const state = hotkeyState(page);
  await blur(page);
  await page.keyboard.press("ArrowRight");
  await page.getByRole("button", { name: "Another action" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(state).toHaveAttribute("data-scoped", "0");
  await page.getByRole("button", { name: "Focus me" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(state).toHaveAttribute("data-scoped", "1");
});

// --- ErrorBoundary ---------------------------------------------------------------------------------------------------

const frame = (page: Page, index: number) => block(page, "Error boundary").locator(".catalogue-grid > div").nth(index);

test("a part that throws shows the fallback, and Try again restores it and hands focus to where it starts", async ({ page }) => {
  await open(page);
  const part = frame(page, 0);
  await expect(part.getByTestId("diagram")).toBeVisible();
  await part.getByRole("button", { name: "Break the diagram" }).click();
  const fallback = part.getByRole("alert");
  await expect(fallback).toContainText("This part could not be shown");
  await expect(fallback.getByRole("heading", { level: 3 })).toHaveText("This part could not be shown");
  await expect(part.getByTestId("diagram")).toHaveCount(0);
  await expect(part.getByTestId("caught")).toHaveText("Errors reported to the host: 1");
  // The rest of the page still works.
  await expect(frame(page, 2).getByTestId("custom-fallback")).toBeVisible();

  const retry = fallback.getByRole("button", { name: "Try again" });
  await retry.focus();
  await page.keyboard.press("Enter");
  const diagram = part.getByTestId("diagram");
  await expect(diagram).toBeVisible();
  await expect(part.getByRole("alert")).toHaveCount(0);
  // Focus did not fall to the top of the page: it is on the restored part, and Tab goes on into it.
  await expect(diagram).toBeFocused();
  await expect(diagram).toHaveAttribute("tabindex", "-1");
  await page.keyboard.press("Tab");
  await expect(part.getByRole("button", { name: "Break the diagram" })).toBeFocused();
  // The part was focusable for that one visit.
  await expect(diagram).not.toHaveAttribute("tabindex");
});

test("Try again on a part that is still broken keeps the fallback and the focus on the button", async ({ page }) => {
  await open(page);
  const part = frame(page, 1);
  const retry = part.getByRole("button", { name: "Try again" });
  await retry.focus();
  await page.keyboard.press("Enter");
  await expect(part.getByRole("alert")).toContainText("This part could not be shown");
  await expect(retry).toBeFocused();
});

test("a fallback of the host's gets the error, and a new resetKey gives the part another go", async ({ page }) => {
  await open(page);
  const part = frame(page, 2);
  await expect(part.getByTestId("custom-fallback")).toHaveText("Source 1 could not be drawn: The diagram has a node with no name.");
  await part.getByRole("button", { name: "Load another source" }).click();
  await expect(part.getByTestId("custom-fallback")).toHaveCount(0);
  await expect(part.getByTestId("diagram")).toContainText("Source 2");
  await part.getByRole("button", { name: "Break the diagram" }).click();
  await expect(part.getByTestId("custom-fallback")).toContainText("Source 2 could not be drawn");
  await part.getByRole("button", { name: "Load another source" }).click();
  await expect(part.getByTestId("diagram")).toContainText("Source 3");
});

// --- LocalTime -------------------------------------------------------------------------------------------------------

test.describe("a reader in Tokyo", () => {
  test.use({ timezoneId: "Asia/Tokyo" });

  test("the server's stand-in is hidden and of the same size, and hydration swaps in Tokyo time without a mismatch or a shift", async ({ page }) => {
    const complaints: string[] = [];
    page.on("console", (message) => {
      if (/hydrat|did not match|didn't match/i.test(message.text())) complaints.push(message.text());
    });
    await open(page, "light", HYDRATION);
    const report = page.getByTestId("hydration-report");
    await expect(report).not.toHaveText("measuring");
    type Box = { text: string; width: number; height: number; hidden: boolean; title: string | null };
    const { before, after, afterTop, errors } = JSON.parse((await report.textContent())!) as {
      before: Record<string, Box>;
      after: Record<string, Box>;
      afterTop: [number, number];
      errors: string[];
    };
    // What the server sent: the instant in UTC, hidden, with no tooltip to read the server's zone from.
    expect(before["reader-time"]).toMatchObject({ text: "07:31", hidden: true, title: null });
    expect(before["reader-date-time"]).toMatchObject({ text: "27 Sept 2026, 07:31", hidden: true, title: null });
    // What the reader sees: their own zone.
    expect(after["reader-time"]).toMatchObject({ text: "16:31", hidden: false });
    expect(after["reader-date-time"]).toMatchObject({ text: "27 Sept 2026, 16:31", hidden: false });
    expect(after["reader-time"]!.title).toMatch(/^Sunday,? 27 September 2026 at 16:31:00 (GMT\+9|JST)$/);
    for (const name of ["reader-time", "reader-date-time"]) {
      expect(before[name]!.width).toBeGreaterThan(20);
      expect(Math.abs(after[name]!.width - before[name]!.width)).toBeLessThan(0.5);
      expect(Math.abs(after[name]!.height - before[name]!.height)).toBeLessThan(0.5);
    }
    expect(Math.abs(afterTop[1] - afterTop[0])).toBeLessThan(0.5);
    // A time with a zone of its own is the same before and after, and was never hidden.
    expect(before["fixed-time"]).toMatchObject({ text: "09:31", hidden: false });
    expect(after["fixed-time"]).toEqual(before["fixed-time"]);
    expect(errors).toEqual([]);
    expect(complaints).toEqual([]);
    // And on the live page.
    await expect(page.getByTestId("reader-time")).toHaveText("16:31");
    await expect(page.getByTestId("reader-time")).toBeVisible();
    await expect(page.getByTestId("reader-time")).toHaveAttribute("datetime", "2026-09-27T07:31:00.000Z");
    await expect(page.getByTestId("reader-time")).not.toHaveAttribute("aria-hidden");
    await expect(page.getByTestId("fixed-time")).toHaveText("09:31");
  });

  test("the bench's times stay in the zone they name, and the playground follows the reader", async ({ page }) => {
    await open(page);
    const times = block(page, "Local time").locator("time");
    await expect(times.first()).toHaveText("09:31");
    await expect(times.nth(2)).toHaveText("25 Sept, 23:05");
    await expect(times.nth(3)).toHaveText("2 Jan 2025, 11:00");
    await expect(times.nth(4)).toHaveText("27 Sept 2026, 09:31");
    await expect(times.nth(6)).toHaveText("27 Sept");
    await expect(times.nth(9)).toHaveText("Enviado 09:31");
    await expect(times.nth(10)).toHaveText("Sep 27, 2026, 3:31 AM");
    await expect(times.first()).toHaveCSS("font-variant-numeric", "tabular-nums");
    await expect(times.first()).toHaveCSS("white-space", "nowrap");

    await page.goto("/iframe.html?id=components-local-time--playground&viewMode=story&args=format:time;locale:en-GB");
    await expect(page.locator("time.fui-local-time")).toHaveText("16:31");
  });
});

// --- ForeignText -----------------------------------------------------------------------------------------------------

const direction = (locator: Locator) => locator.evaluate((node) => getComputedStyle(node).direction);

test("each fragment in another language is isolated in its own direction, whichever way the line runs", async ({ page }) => {
  await open(page);
  const text = block(page, "Text in another language");
  const leftToRight = text.locator(".catalogue-grid > div").first();
  const rightToLeft = text.locator(".catalogue-grid > div").nth(1);

  const arabic = leftToRight.locator('bdi[lang="ar"]').first();
  await expect(arabic).toHaveAttribute("dir", "rtl");
  expect(await direction(arabic)).toBe("rtl");
  await expect(arabic).toHaveCSS("unicode-bidi", "isolate");
  expect(await direction(leftToRight.locator('bdi[lang="he"]'))).toBe("rtl");
  expect(await direction(leftToRight.locator("p").first())).toBe("ltr");
  // The fragment sits inside the sentence, between the words around it.
  const word = await arabic.boundingBox();
  const line = await leftToRight.locator("p").first().boundingBox();
  expect(word!.x).toBeGreaterThan(line!.x + 40);

  // Names of unknown language: the browser finds each one's direction.
  const names = leftToRight.locator('bdi[data-slot="bdi"]');
  await expect(names).toHaveCount(3);
  expect(await direction(names.nth(0))).toBe("rtl");
  expect(await direction(names.nth(1))).toBe("ltr");
  expect(await direction(names.nth(2))).toBe("rtl");
  // A string put into a message is isolated; a string for an attribute carries the isolate marks.
  const file = leftToRight.locator("bdi", { hasText: "تقرير-٢٠٢٦.pdf" });
  await expect(file).toHaveCSS("unicode-bidi", "isolate");
  await expect(leftToRight.getByRole("button", { name: /^Remove/ })).toHaveAttribute("aria-label", "Remove \u2068تقرير-٢٠٢٦.pdf\u2069");

  // In a right-to-left frame the Spanish and English fragments run left to right.
  expect(await direction(rightToLeft.locator("p").first())).toBe("rtl");
  const spanish = rightToLeft.locator('bdi[lang="es"]');
  await expect(spanish).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) expect(await direction(spanish.nth(index))).toBe("ltr");
  expect(await direction(rightToLeft.locator('bdi[lang="en"]'))).toBe("ltr");
  await expect(rightToLeft.locator('bdi[lang="es"]').last()).toHaveText("¿Cómo estás?");
  // The Arabic sentence starts at the right edge of its frame.
  const paragraph = rightToLeft.locator("p").first();
  expect(await paragraph.evaluate((node) => getComputedStyle(node).textAlign)).toMatch(/start|right/);
  await expect(rightToLeft.locator("time")).toHaveText(/٢٠٢٦/);
  await expect(rightToLeft.getByRole("button", { name: "حاول مرة أخرى" })).toBeVisible();
});

// --- Resolved tokens -------------------------------------------------------------------------------------------------

test("tokens resolve to hex for the page and for a part with its own theme, and follow the theme when it changes", async ({ page }) => {
  await open(page);
  const hexes = (label: string) => page.getByTestId(`tokens-${label}`).locator("li").evaluateAll((items) => items.map((item) => item.getAttribute("data-hex")));
  const whole = page.getByTestId("tokens-The page");
  await expect(whole).toHaveAttribute("data-theme-read", "light");
  await expect(page.getByTestId("tokens-A dark part")).toHaveAttribute("data-theme-read", "dark");
  await expect(page.getByTestId("tokens-A light part")).toHaveAttribute("data-theme-read", "light");
  await expect.poll(async () => (await hexes("The page")).every((hex) => /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/.test(hex ?? ""))).toBe(true);
  const light = await hexes("The page");
  const dark = await hexes("A dark part");
  expect(light).toHaveLength(11);
  expect(light.slice(0, 10).every((hex) => /^#[0-9a-f]{6}$/.test(hex!))).toBe(true);
  expect(new Set(light.slice(0, 6)).size).toBe(6);
  expect(await hexes("A light part")).toEqual(light);
  expect(dark).not.toEqual(light);
  expect(dark.slice(0, 10).every((hex) => /^#[0-9a-f]{6}$/.test(hex ?? ""))).toBe(true);
  // A colour that is not a token and is not opaque: resolved for the element (its --brand), with its alpha.
  const brand = (list: (string | null)[]) => [1, 3, 5].map((at) => Number.parseInt(list[6]!.slice(at, at + 2), 16));
  for (const list of [light, dark]) {
    expect(list[10]).toMatch(/^#[0-9a-f]{6}(7f|80)$/);
    const mixed = [1, 3, 5].map((at) => Number.parseInt(list[10]!.slice(at, at + 2), 16));
    mixed.forEach((channel, index) => expect(Math.abs(channel - brand(list)[index]!)).toBeLessThanOrEqual(2));
  }
  expect(dark[10]).not.toBe(light[10]);
  // The swatch is painted with the hex it prints.
  const swatch = whole.locator('li[data-token="--chart-1"] > span').first();
  const painted = await swatch.evaluate((node) => getComputedStyle(node).backgroundColor);
  const [red, green, blue] = [1, 3, 5].map((at) => Number.parseInt(light[0]!.slice(at, at + 2), 16));
  expect(painted).toBe(`rgb(${red}, ${green}, ${blue})`);
  await expect(whole.getByTestId("fonts")).toHaveAttribute("data-font-sans", /IBM Plex Sans/);
  await expect(whole.getByTestId("fonts")).toHaveAttribute("data-font-mono", /IBM Plex Mono/);
  await expect(whole.getByTestId("measured")).toHaveText("measured");

  // The theme changes under the page, as the toolbar does it: the page's colours become the dark ones, the parts keep theirs.
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await expect(whole).toHaveAttribute("data-theme-read", "dark");
  await expect.poll(() => hexes("The page")).toEqual(dark);
  expect(await hexes("A light part")).toEqual(light);
  await page.evaluate(() => document.documentElement.classList.remove("dark"));
  await expect.poll(() => hexes("The page")).toEqual(light);

  // And with the theme global itself.
  await open(page, "dark");
  await expect(page.getByTestId("tokens-The page")).toHaveAttribute("data-theme-read", "dark");
  await expect.poll(() => hexes("The page")).toEqual(dark);
});

// --- Export ----------------------------------------------------------------------------------------------------------

test("the drawing downloads as an SVG that stands alone and as a PNG of twice its size, named from its title", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const exports = block(page, "Export");
  const drawing = exports.locator("svg[role=img]");
  const size = (await drawing.boundingBox())!;
  expect(Math.round(size.width)).toBe(320);

  const [vector] = await Promise.all([page.waitForEvent("download"), exports.getByRole("button", { name: "Download SVG" }).click()]);
  expect(vector.suggestedFilename()).toBe("ventas-q3-مبيعات-2026.svg");
  const markup = readFileSync(await vector.path(), "utf8");
  expect(markup).toMatch(/^<svg [^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  expect(markup).toMatch(/^<svg [^>]*width="320"/);
  expect(markup).toMatch(/^<svg [^>]*height="160"/);
  expect(markup).toMatch(/^<svg [^>]*viewBox="0 0 320 160"/);
  // The paint is written on each element in plain sRGB: no stylesheet and no custom property is needed to draw it.
  const styles = [...markup.matchAll(/style="([^"]*)"/g)].map((match) => match[1]!);
  expect(styles.length).toBeGreaterThanOrEqual(9);
  const fills = styles.map((style) => /(?:^|; ?)fill: (rgb\(\d+, \d+, \d+\));/.exec(style)?.[1]).filter(Boolean);
  expect(fills.length).toBeGreaterThanOrEqual(7);
  // Five bars, five series colours.
  expect(new Set(fills).size).toBeGreaterThanOrEqual(6);
  expect(styles.join("\n")).not.toMatch(/var\(|oklch\(|color-mix\(/);
  expect(styles.some((style) => /font-family: (?:&quot;)?IBM Plex Sans/.test(style))).toBe(true);
  await expect(exports.getByTestId("export-status")).toContainText("Saved ventas-q3-مبيعات-2026.svg");

  const [raster] = await Promise.all([page.waitForEvent("download"), exports.getByRole("button", { name: "Download PNG" }).click()]);
  expect(raster.suggestedFilename()).toBe("ventas-q3-مبيعات-2026.png");
  const bytes = readFileSync(await raster.path());
  expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  expect(bytes.subarray(12, 16).toString("latin1")).toBe("IHDR");
  expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([640, 320]);
  // It is the drawing, not an empty sheet: the bars are in it.
  const painted = await page.evaluate(async (base64) => {
    const image = await createImageBitmap(await (await fetch(`data:image/png;base64,${base64}`)).blob());
    const canvas = new OffscreenCanvas(image.width, image.height);
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    const colours = new Set<string>();
    for (const [x, y] of [[88, 200], [200, 200], [312, 200], [424, 200], [536, 200]] as const) colours.add(context.getImageData(x, y, 1, 1).data.join(","));
    return colours.size;
  }, bytes.toString("base64"));
  expect(painted).toBe(5);
});

test("the title and the picture go to the clipboard, and the result is said through the announcer", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await open(page);
  const exports = block(page, "Export");
  await exports.getByRole("button", { name: "Copy title" }).click();
  await expect(exports.getByTestId("export-status")).toContainText("Copied the title");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("Ventas / Q3 — «مبيعات» 2026");
  // No provider above this block: the hook speaks through its own regions at the end of the body.
  const shared = page.locator('body > [data-slot="announcer"]');
  await expect(shared).toHaveCount(2);
  await expect(shared.and(page.locator('[aria-live="polite"]'))).toHaveText("Copied the title");

  await exports.getByRole("button", { name: "Copy picture" }).click();
  await expect(exports.getByTestId("export-status")).toContainText("Copied the picture");
  const types = await page.evaluate(async () => (await navigator.clipboard.read()).flatMap((item) => [...item.types]));
  expect(types).toContain("image/png");
});

// --- Announcer -------------------------------------------------------------------------------------------------------

test("the announcer's regions are always in the page, only clipped, and say the same sentence again", async ({ page }) => {
  await open(page);
  const speaker = block(page, "Announcer");
  const polite = speaker.locator('[data-slot="announcer"][aria-live="polite"]');
  const assertive = speaker.locator('[data-slot="announcer"][aria-live="assertive"]');
  // There before anything is said, and reachable by assistive technology: clipped, not removed.
  for (const region of [polite, assertive]) {
    await expect(region).toHaveCount(1);
    await expect(region).toHaveText("");
    await expect(region).toHaveAttribute("aria-atomic", "true");
    expect(await region.evaluate((node) => [getComputedStyle(node).display, getComputedStyle(node).visibility])).toEqual(["block", "visible"]);
    const box = (await region.boundingBox())!;
    expect([box.width, box.height]).toEqual([1, 1]);
  }
  await expect(polite).toHaveAttribute("role", "status");
  await expect(assertive).toHaveAttribute("role", "alert");

  await polite.evaluate((node) => {
    const log: string[] = [];
    (window as unknown as { spoken: string[] }).spoken = log;
    new MutationObserver(() => log.push(node.textContent ?? "")).observe(node, { childList: true, characterData: true, subtree: true });
  });
  const save = speaker.getByRole("button", { name: "Save the draft" });
  await save.click();
  await expect(polite).toHaveText("Draft saved");
  await expect(speaker.getByTestId("saves")).toContainText("Saved 1 time;");
  // The same words again: the region is emptied and filled, which is what makes a screen reader read them.
  await save.click();
  await expect(speaker.getByTestId("saves")).toContainText("Saved 2 times;");
  await expect.poll(() => page.evaluate(() => (window as unknown as { spoken: string[] }).spoken)).toEqual(["Draft saved", "", "Draft saved"]);
  await expect(polite).toHaveText("Draft saved");

  await speaker.getByRole("button", { name: "Lose the connection" }).click();
  await expect(assertive).toHaveText("The connection was lost");
  await expect(polite).toHaveText("Draft saved");
});
