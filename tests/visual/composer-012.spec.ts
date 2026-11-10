// The composer pieces in a real browser: uploads a fake uploader holds in its hand, the drop overlay, a pill that picks a
// value, and a key that reads an answer aloud with a synthetic tone. Nothing leaves the page and nothing is heard.
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PIECES = "/iframe.html?id=tests-composer-0-12--pieces&viewMode=story";
const PAGE = "/iframe.html?id=agents-use-attachments--overview&viewMode=story";
const OPEN = "/iframe.html?id=tests-composer-0-12--open&viewMode=story";

// `window.__composerBench` (what the uploader was asked, and what can be done to a held upload) is declared by the story.

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

async function open(page: Page, theme = "light", url = PIECES) {
  await page.goto(`${url}&globals=theme:${theme}`);
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

const block = (page: Page, title: string) =>
  page.locator("section").filter({ has: page.getByRole("heading", { name: title, exact: true }) }).last();
const bench = (page: Page) =>
  page.evaluate(() => {
    const state = window.__composerBench!;
    return { calls: [...state.calls], inFlight: state.inFlight, most: state.most, aborted: [...state.aborted], held: state.held.map((file) => file.name), auto: state.auto };
  });
const png = (name: string) => ({ name, mimeType: "image/png", buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]) });
const text = (name = "notes.txt") => ({ name, mimeType: "text/plain", buffer: Buffer.from("The harbour opens at nine.") });

for (const theme of ["light", "dark"]) {
  for (const width of [390, 768, 1440]) {
    test(`composer 0.12 ${theme} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 960 });
      await open(page, theme);
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark).*$/);
      // The pictures of the files are data URLs: they are there before the picture is taken.
      await expect.poll(() => page.evaluate(() => [...document.querySelectorAll("img")].every((image) => image.complete))).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const result = await audit(page);
      expect(result.violations).toEqual([]);
      await expect(page).toHaveScreenshot(`composer-012-${theme}-${width}.png`, { fullPage: true });
    });
  }
}

for (const [theme, width] of [
  ["light", 1440],
  ["dark", 390],
] as const) {
  test(`composer 0.12 open list ${theme} ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 });
    await open(page, theme, OPEN);
    const list = page.getByRole("listbox");
    await expect(list).toBeVisible();
    await expect(list.getByRole("option")).toHaveCount(3);
    const result = await audit(page);
    expect(result.violations).toEqual([]);
    await expect(page).toHaveScreenshot(`composer-012-open-${theme}-${width}.png`, { fullPage: true });
  });
}

test("the page that explains uploads works: a composer restored with files uploads them by itself", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await open(page, "light", PAGE);
  await expect(page.locator('[data-slot="report"]').last()).toHaveText("2 files, all done.", { timeout: 15_000 });
  expect(errors).toEqual([]);
});

test("files chosen through the hidden input go up one after another, three at a time, with their ring counting", async ({ page }) => {
  await open(page);
  const live = block(page, "A composer that uploads");
  const input = live.locator('input[type="file"]');
  await expect(input).toHaveCount(1);
  await input.setInputFiles([png("harbour.png"), png("scan.png"), text(), png("plan.png"), png("chart.png")]);
  await expect(live.locator(".fui-attachment")).toHaveCount(5);
  // The fake uploader was asked for three, and no more: the queue waits for a slot.
  await expect.poll(async () => (await bench(page)).calls.length).toBe(3);
  let state = await bench(page);
  expect(state.most).toBe(3);
  expect(state.auto).toBe(false);
  expect(state.held.sort()).toEqual(["harbour.png", "notes.txt", "scan.png"]);
  // A queued file is busy without a number; the first one to report draws a ring and counts.
  const busy = live.locator(".fui-attachment").first();
  await expect(busy.locator(".fui-attachment-busy")).toHaveCount(1);
  await page.evaluate(() => window.__composerBench!.progress("harbour.png", 0.36));
  const ring = live.getByRole("progressbar", { name: "Uploading harbour.png" });
  await expect(ring).toHaveAttribute("aria-valuenow", "36");
  await expect(ring).toHaveText("36%");
  await page.evaluate(() => window.__composerBench!.progress("harbour.png", 0.9));
  await expect(live.getByRole("progressbar", { name: "Uploading harbour.png" })).toHaveAttribute("aria-valuenow", "90");
  // Letting one go starts the fourth: the count stays at three.
  await page.evaluate(() => window.__composerBench!.release("harbour.png"));
  await expect.poll(async () => (await bench(page)).calls.length).toBe(4);
  state = await bench(page);
  expect(state.most).toBe(3);
  await expect(live.locator('.fui-attachment[data-status="ready"]')).toHaveCount(1);
});

test("a file removed while it uploads is given up, and the answer that comes late does not bring it back", async ({ page }) => {
  await open(page);
  const live = block(page, "A composer that uploads");
  await live.locator('input[type="file"]').setInputFiles([png("harbour.png"), png("scan.png")]);
  await expect(live.locator(".fui-attachment")).toHaveCount(2);
  await live.getByRole("button", { name: "Remove harbour.png" }).click();
  await expect(live.locator(".fui-attachment")).toHaveCount(1);
  await expect.poll(async () => (await bench(page)).aborted).toEqual(["harbour.png"]);
  // The uploader resolves the file it was given up on: the composer does not take it back.
  await page.evaluate(() => window.__composerBench!.release("harbour.png"));
  await page.waitForTimeout(300);
  await expect(live.locator(".fui-attachment")).toHaveCount(1);
  await expect(live.getByRole("button", { name: "Remove harbour.png" })).toHaveCount(0);
  await expect(live.locator('[data-slot="waited"]')).toHaveText("Nothing has been sent.");
});

test("a failed upload says why, and its retry asks the uploader again", async ({ page }) => {
  await open(page);
  const live = block(page, "A composer that uploads");
  await live.locator('input[type="file"]').setInputFiles([png("scan.png")]);
  await expect.poll(async () => (await bench(page)).held).toEqual(["scan.png"]);
  await page.evaluate(() => window.__composerBench!.fail("scan.png", "The token expired."));
  await expect(live.locator('[data-slot="failed"]')).toHaveText("scan.png: The token expired.");
  await expect(live.locator('[data-slot="failed"]')).toHaveAttribute("role", "alert");
  const tile = live.locator('.fui-attachment[data-status="error"]');
  await expect(tile).toHaveCount(1);
  await expect(tile).toContainText("scan.png: The token expired.");
  const retry = live.getByRole("button", { name: "Retry scan.png" });
  await expect(retry).toBeVisible();
  await retry.click();
  await expect.poll(async () => (await bench(page)).calls).toEqual(["scan.png", "scan.png"]);
  await expect(live.locator('.fui-attachment[data-status="error"]')).toHaveCount(0);
  await expect(live.locator('[data-slot="failed"]')).toHaveText("");
});

test("a refused file is reported with its reason, and the ones that fit still go up", async ({ page }) => {
  await open(page);
  const live = block(page, "A composer that uploads");
  await live.locator('input[type="file"]').setInputFiles([png("harbour.png"), { name: "report.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.7") }]);
  await expect(live.locator('[data-slot="rejected"]')).toHaveText("report.pdf: that kind of file is not accepted.");
  await expect(live.locator(".fui-attachment")).toHaveCount(1);
  await expect.poll(async () => (await bench(page)).calls).toEqual(["harbour.png"]);
});

test("the same file can be picked twice, because the input is emptied after each pick", async ({ page }) => {
  await open(page);
  const live = block(page, "A composer that uploads");
  const input = live.locator('input[type="file"]');
  await input.setInputFiles([png("harbour.png")]);
  await expect(live.locator(".fui-attachment")).toHaveCount(1);
  await input.setInputFiles([png("harbour.png")]);
  await expect(live.locator(".fui-attachment")).toHaveCount(2);
  await expect.poll(async () => (await bench(page)).calls).toEqual(["harbour.png", "harbour.png"]);
  await expect(input).toHaveJSProperty("value", "");
});

test("the attach key opens the picker, and Backspace in an empty composer drops the last file", async ({ page }) => {
  await open(page);
  const live = block(page, "A composer that uploads");
  const [chooser] = await Promise.all([page.waitForEvent("filechooser"), live.getByRole("button", { name: "Attach files" }).click()]);
  await chooser.setFiles([png("picked.png"), text("picked.txt")]);
  await expect(live.locator(".fui-attachment")).toHaveCount(2);
  // The files go in the order they were handed over, and the last one is the one Backspace takes.
  await live.getByRole("textbox", { name: "Message" }).focus();
  await page.keyboard.press("Backspace");
  await expect(live.locator(".fui-attachment")).toHaveCount(1);
  await expect(live.getByRole("button", { name: "Remove picked.png" })).toHaveCount(1);
  await expect(live.getByRole("button", { name: "Remove picked.txt" })).toHaveCount(0);
});

test("sending waits for the files there are: one added while it waits goes with the next message", async ({ page }) => {
  await open(page);
  const live = block(page, "A composer that uploads");
  const input = live.locator('input[type="file"]');
  await input.setInputFiles([png("harbour.png")]);
  await live.getByRole("textbox", { name: "Message" }).fill("Compare these");
  await live.getByRole("button", { name: "Send message" }).click();
  await expect(live.locator('[data-slot="waited"]')).toHaveText("Waiting for the uploads…");
  // A second file arrives while the first is still going: it is not part of this message.
  await input.setInputFiles([png("plan.png")]);
  await page.evaluate(() => window.__composerBench!.release("harbour.png"));
  await expect(live.locator('[data-slot="waited"]')).toHaveText("Sent “Compare these” with 1 file: harbour.png.");
  await expect(live.locator(".fui-attachment")).toHaveCount(1);
  await expect(live.getByRole("button", { name: "Remove plan.png" })).toHaveCount(1);
});

test("a pasted screenshot and a file dropped on the page both land in the composer", async ({ page }) => {
  await open(page);
  const live = block(page, "A composer that uploads");
  await page.evaluate(() => {
    const area = document.querySelector<HTMLTextAreaElement>("#storybook-root .fui-composer-input")!;
    const data = new DataTransfer();
    data.items.add(new File([new Uint8Array([1, 2, 3])], "screenshot.png", { type: "image/png" }));
    area.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: data }));
  });
  await expect(live.locator(".fui-attachment")).toHaveCount(1);
  await expect(live.getByRole("button", { name: "Remove screenshot.png" })).toHaveCount(1);

  // A drag of files shows the panel over the composer, and the drop adds them.
  await page.evaluate(() => {
    const data = new DataTransfer();
    data.items.add(new File([new Uint8Array([1, 2, 3])], "dropped.png", { type: "image/png" }));
    document.body.dispatchEvent(new DragEvent("dragenter", { bubbles: true, cancelable: true, dataTransfer: data }));
  });
  const panel = live.locator(".fui-drop-overlay-panel");
  await expect(panel).toHaveAttribute("aria-hidden", "false");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("Drop files to attach");
  await page.evaluate(() => {
    const data = new DataTransfer();
    data.items.add(new File([new Uint8Array([1, 2, 3])], "dropped.png", { type: "image/png" }));
    document.body.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: data }));
  });
  await expect(live.locator(".fui-attachment")).toHaveCount(2);
  await expect(panel).toHaveAttribute("aria-hidden", "true");

  // A drag of text is not a drag of files: nothing is offered, and nothing is taken.
  await page.evaluate(() => {
    const data = new DataTransfer();
    data.setData("text/plain", "a paragraph someone dragged in");
    document.body.dispatchEvent(new DragEvent("dragenter", { bubbles: true, cancelable: true, dataTransfer: data }));
  });
  await expect(panel).toHaveAttribute("aria-hidden", "true");
  await expect(live.locator(".fui-attachment")).toHaveCount(2);
});

test("the drop panel is announced when it appears, and a drag of the wrong kind says so", async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const data = new DataTransfer();
    data.items.add(new File([new Uint8Array([1])], "report.pdf", { type: "application/pdf" }));
    const area = document.querySelector<HTMLElement>(".fui-drop-overlay")!;
    area.dispatchEvent(new DragEvent("dragenter", { bubbles: true, cancelable: true, dataTransfer: data }));
  });
  const panel = page.locator(".fui-drop-overlay-panel").last();
  await expect(panel).toHaveAttribute("aria-hidden", "false");
  // The live composer accepts pictures and text, so a PDF is refused before it is dropped.
  await expect(block(page, "A composer that uploads").locator(".fui-drop-overlay-panel")).toHaveAttribute("data-refused", "");
  const spoken = page.locator('[data-slot="announcer"][data-live="polite"]');
  await expect(spoken).toHaveText("That kind of file is not accepted");
});

test("the pill that picks opens with the keyboard, moves with the arrows, tells its new value and keeps focus on Escape", async ({ page }) => {
  await open(page);
  const pill = page.locator("#effort-pill");
  await expect(pill).toHaveAttribute("aria-label", "Reasoning effort: Low");
  await expect(pill).toHaveAttribute("data-state", "off");
  const idle = await pill.evaluate((node) => getComputedStyle(node).backgroundColor);

  await pill.focus();
  await page.keyboard.press("Enter");
  const list = page.getByRole("listbox");
  await expect(list).toBeVisible();
  await expect(page.getByRole("option", { name: /^High/ })).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(pill).toHaveAttribute("aria-label", "Reasoning effort: Medium");
  await expect(pill).toHaveAttribute("data-state", "on");
  await expect(pill).toBeFocused();
  const active = await pill.evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(active).not.toBe(idle);

  // Space opens it again; Escape closes it and leaves the focus where it was.
  await page.keyboard.press("Space");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(pill).toBeFocused();
  await expect(pill).toHaveAttribute("aria-label", "Reasoning effort: Medium");

  // Typing the first letters of an option moves to it, as a select does.
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("h");
  await page.keyboard.press("Enter");
  await expect(pill).toHaveAttribute("aria-label", "Reasoning effort: High");

  // The pill of a mode that is not the usual one is tinted from the start.
  const mode = page.locator("#mode-pill");
  await expect(mode).toHaveAttribute("aria-label", "Mode: Tutor");
  await expect(mode).toHaveAttribute("data-state", "on");
});

test("the menu pill opens a menu with Enter and closes it with Escape", async ({ page }) => {
  await open(page);
  const more = block(page, "More controls").getByRole("button", { name: "More controls" });
  await more.focus();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("menu", { name: "Chat controls" });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitemcheckbox", { name: "Search the web" })).toHaveAttribute("aria-checked", "true");
  await expect(menu.getByRole("menuitemradio", { name: "High" })).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(more).toBeFocused();
});

test("a key reads an answer with the host's voices, and a second key stops the first", async ({ page }) => {
  await open(page);
  const voices: string[] = [];
  await page.exposeFunction("__heard", (text: string) => voices.push(text));
  // The name changes while a key reads, so each is found by the answer it belongs to.
  const answer = (text: string) => page.locator(".fui-chat-message").filter({ hasText: text });
  const first = answer("The harbour opens at nine").getByRole("button");
  const second = answer("The orchard is on the north side").getByRole("button");
  await expect(first).toHaveAttribute("aria-label", "Read aloud");
  await expect(page.locator(".fui-message-action[data-reading]")).toHaveCount(2);
  await first.click();
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await expect(first).toHaveAttribute("aria-label", "Stop reading");
  await expect(first).toBeFocused();
  // A second answer, read from its own key, stops the first: one reader at a time on a page.
  await second.click();
  await expect(second).toHaveAttribute("aria-pressed", "true");
  await expect(first).toHaveAttribute("aria-pressed", "false");
  await expect(first).toHaveAttribute("aria-label", "Read aloud");
  // The same key stops it.
  await second.click();
  await expect(second).toHaveAttribute("aria-pressed", "false");
  expect(voices).toEqual([]);
});

test("forced colors: the tinted pill, the drop panel and the key that reads keep a form", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open(page);
  const result = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.forcedColorAdjust = "none";
    document.body.append(probe);
    const system = (name: string) => {
      probe.style.backgroundColor = name;
      return getComputedStyle(probe).backgroundColor;
    };
    const colours = { Highlight: system("Highlight"), Canvas: system("Canvas"), CanvasText: system("CanvasText") };
    probe.remove();
    const pill = document.querySelector<HTMLElement>("#mode-pill")!;
    const panel = document.querySelector<HTMLElement>(".fui-drop-overlay-panel[data-refused]")!;
    const reading = document.querySelector<HTMLElement>(".fui-message-action[data-reading]")!;
    return {
      colours,
      pillRing: [getComputedStyle(pill).outlineStyle, getComputedStyle(pill).outlineColor],
      pillBar: [getComputedStyle(pill, "::after").content, getComputedStyle(pill, "::after").backgroundColor],
      panelEdge: getComputedStyle(panel).borderTopColor,
      panelSurface: getComputedStyle(panel).backgroundColor,
      readingOutline: [getComputedStyle(reading).outlineStyle, getComputedStyle(reading).outlineColor],
    };
  });
  const { Highlight, Canvas, CanvasText } = result.colours;
  expect(result.pillRing).toEqual(["solid", Highlight]);
  expect(result.pillBar).toEqual(['""', Highlight]);
  expect(result.panelEdge).toBe(CanvasText);
  expect(result.panelSurface).toBe(Canvas);
  expect(result.readingOutline).toEqual(["solid", Highlight]);
});

test("under reduced motion the drop panel and the pill do not move", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open(page);
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
  expect(
    await page.evaluate(() =>
      getComputedStyle(document.querySelector(".fui-drop-overlay-panel")!)
        .transitionDuration.split(",")
        .every((value) => value.trim() === "0s"),
    ),
  ).toBe(true);
  expect(await page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === "running").length)).toBe(0);
});

test("right to left: the composer's row follows the page and the files are on the correct side", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open(page);
  const rtl = block(page, "Right to left").locator(".fui-composer");
  const geometry = await rtl.evaluate((node) => {
    const input = node.querySelector(".fui-composer-input")!;
    const send = node.querySelector(".fui-composer-send")!.getBoundingClientRect();
    const tools = node.querySelector(".fui-composer-tools")!.getBoundingClientRect();
    return {
      direction: getComputedStyle(input).direction,
      textAlign: getComputedStyle(input).textAlign,
      toolsAtStart: tools.left < send.left,
      inside: send.right <= node.getBoundingClientRect().right + 0.5,
    };
  });
  expect(geometry).toEqual({ direction: "rtl", textAlign: "start", toolsAtStart: false, inside: true });
});

test.describe("under a finger", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test("the pill and the menu pill are 44 px targets, and a narrow composer keeps only the mark", async ({ page }) => {
    await open(page);
    expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
    const sizes = await page.evaluate(() => {
      const boxes = (selector: string) => [...document.querySelectorAll<HTMLElement>(selector)].map((node) => node.getBoundingClientRect());
      const list = boxes(".fui-composer-select");
      return {
        least: Math.min(...list.map((box) => Math.min(box.width, box.height))),
        iconOnly: boxes(".fui-composer-select").filter((box) => box.width < 60).length,
        menu: Math.min(...boxes(".fui-composer-menu").map((box) => Math.min(box.width, box.height))),
      };
    });
    expect(sizes.least).toBeGreaterThanOrEqual(44);
    expect(sizes.menu).toBeGreaterThanOrEqual(44);
    expect(sizes.iconOnly).toBeGreaterThan(0);
  });
});
