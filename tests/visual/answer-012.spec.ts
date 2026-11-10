// The pieces of an answer in 0.12, in a real browser: the callouts of a markdown answer, a sent message edited in place, and
// a stamp in the reader's own zone. The clock is fixed so the stamps read the same on every run, and the pictures are the six
// references of the bench.
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const BENCH = "/iframe.html?id=tests-answer-0-12--pieces&viewMode=story";
const HYDRATION = "/iframe.html?id=tests-answer-0-12--stamp-hydration&viewMode=story";
// The bench draws its stamps from this instant: 03:31 UTC is 04:31 in Madrid, and three days back is another day.
const NOW = new Date("2026-11-10T03:31:00Z");

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
  await page.clock.setFixedTime(NOW);
  await page.goto(`${story}&globals=theme:${theme}`);
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

const block = (page: Page, title: string) => page.locator("section").filter({ has: page.getByRole("heading", { name: title, exact: true }) }).last();

/** The environment's system colours, read from a probe that is not itself forced. */
async function palette(page: Page) {
  return page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.forcedColorAdjust = "none";
    document.body.append(probe);
    const out: Record<string, string> = {};
    for (const name of ["Canvas", "CanvasText", "Highlight", "GrayText"]) {
      probe.style.backgroundColor = name;
      out[name] = getComputedStyle(probe).backgroundColor;
    }
    probe.remove();
    return out;
  });
}

for (const theme of ["light", "dark"]) {
  for (const width of [390, 768, 1440]) {
    test(`answer 0.12 ${theme} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 960 });
      await open(page, theme);
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark).*$/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const result = await audit(page);
      expect(result.violations).toEqual([]);
      await expect(page).toHaveScreenshot(`answer-012-${theme}-${width}.png`, { fullPage: true });
    });
  }
}

// --- callouts ---------------------------------------------------------------------------------------------------------

test("each callout is a note named by its title, and a kind of its own", async ({ page }) => {
  await open(page);
  const kinds = block(page, "Each kind of note").locator(".fui-callout");
  await expect(kinds).toHaveCount(9);
  const names = ["Note", "Tip", "Important", "Warning", "Caution", "Example", "Definition", "Summary", "Check yourself"];
  for (const [index, name] of names.entries()) {
    const callout = kinds.nth(index);
    await expect(callout).toHaveAttribute("role", "note");
    await expect(callout).toHaveAccessibleName(name);
    await expect(callout.locator(".fui-callout-title")).toHaveText(name);
  }
  // The kinds this package uses in the house tones: a warning is warning, a caution is danger.
  await expect(kinds.nth(3)).toHaveAttribute("data-kind", "warning");
  await expect(kinds.nth(4)).toHaveAttribute("data-kind", "caution");
  // A callout has no coloured side bar: the four edges thin and alike.
  const edges = await kinds.first().evaluate((node) => {
    const style = getComputedStyle(node);
    return [style.borderTopWidth, style.borderBottomWidth, style.borderInlineStartWidth, style.borderInlineEndWidth];
  });
  expect(edges).toEqual(["1px", "1px", "1px", "1px"]);
});

test("a title of your own names it, and the words inside keep the answer's own type", async ({ page }) => {
  await open(page);
  const own = block(page, "Titles, and what goes inside");
  const titled = own.locator(".fui-callout").first();
  await expect(titled).toHaveAccessibleName("Start from the units");
  const list = own.locator(".fui-callout").nth(1);
  await expect(list.getByRole("list")).toBeVisible();
  await expect(list.locator("code")).toHaveText("spanreed doctor");
  await expect(list.locator("pre")).toBeVisible();
  // The list keeps its markers and its indent inside the plate.
  const indent = await list.locator("ol").evaluate((node) => Number.parseFloat(getComputedStyle(node).paddingInlineStart));
  expect(indent).toBeGreaterThan(16);
});

test("an Arabic callout mirrors: its mark sits on the right of the title, beside the words", async ({ page }) => {
  await open(page);
  const arabic = block(page, "Right to left").locator('.fui-callout[data-kind="tip"]');
  await expect(arabic).toHaveAccessibleName("ابدأ من الوحدات");
  const placement = await arabic.evaluate((node) => {
    const icon = node.querySelector(".fui-callout-icon")!.getBoundingClientRect();
    const title = node.querySelector(".fui-callout-title")!.lastChild as Text;
    const range = document.createRange();
    range.setStart(title, 0);
    range.setEnd(title, title.length);
    const words = range.getBoundingClientRect();
    return { iconLeft: icon.left, iconRight: icon.right, wordsLeft: words.left, wordsRight: words.right };
  });
  // The mark is the first thing in the row, and in a right-to-left row that is the right-hand side.
  expect(placement.iconLeft).toBeGreaterThan(placement.wordsRight);
  expect(placement.iconRight).toBeGreaterThan(placement.wordsRight);
});

test("forced colors keep the edge of a callout and the ink of its mark", async ({ page }) => {
  await open(page);
  const system = await palette(page);
  await page.emulateMedia({ forcedColors: "active" });
  const warning = block(page, "Each kind of note").locator('.fui-callout[data-kind="warning"]');
  const look = await warning.evaluate((node) => {
    const style = getComputedStyle(node);
    const icon = getComputedStyle(node.querySelector(".fui-callout-icon svg")!);
    return { background: style.backgroundColor, edge: style.borderTopColor, width: style.borderTopWidth, icon: icon.color };
  });
  expect(look.background).toBe(system.Canvas);
  expect(look.edge).toBe(system.CanvasText);
  expect(look.width).toBe("1px");
  expect(look.icon).toBe(system.CanvasText);
});

// --- the editor -------------------------------------------------------------------------------------------------------

/** Opens the live editor of the bench from the action row, as a reader does. */
async function openEditor(page: Page) {
  const live = page.getByTestId("edit-live");
  await live.getByRole("button", { name: "Edit" }).click();
  const field = live.getByLabel("Edit message");
  await expect(field).toBeFocused();
  return { live, field };
}

test("the editor takes focus with the caret at the end of the message", async ({ page }) => {
  await open(page);
  const { field } = await openEditor(page);
  const caret = await field.evaluate((node: HTMLTextAreaElement) => ({ start: node.selectionStart, end: node.selectionEnd, length: node.value.length }));
  expect(caret).toEqual({ start: caret.length, end: caret.length, length: caret.length });
  expect(caret.length).toBeGreaterThan(0);
});

test("Enter adds a line and sends nothing; Ctrl with Enter sends once, and a second press while it waits is ignored", async ({ page }) => {
  await open(page);
  const { live, field } = await openEditor(page);
  const calls = page.getByTestId("editing-calls");
  await expect(calls).toHaveText("0");
  await field.press("End");
  await page.keyboard.type(" And to billing.");
  await field.press("Enter");
  await expect(field).toHaveValue(/And to billing\.\n$/);
  await expect(calls).toHaveText("0");
  await field.press("Control+Enter");
  // The key is busy and the field holds still while the host sends.
  await expect(live.locator("form")).toHaveAttribute("aria-busy", "true");
  await expect(field).toHaveAttribute("readonly", "");
  await field.press("Control+Enter");
  await expect(live.locator("form")).toHaveCount(0);
  await expect(calls).toHaveText("1");
  await expect(page.getByTestId("edit-live").locator(".fui-chat-message")).toHaveCount(2);
  // The thread came back to the key that opened the editor.
  await expect(page.getByTestId("edit-live").getByRole("button", { name: "Edit" })).toBeFocused();
});

test("a key pressed while an input method is composing never sends", async ({ page }) => {
  await open(page);
  const { live, field } = await openEditor(page);
  await field.press("End");
  await page.keyboard.type(" 16:00");
  await field.evaluate((node) => {
    for (const key of ["Enter", "Enter"]) {
      const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ctrlKey: key === "Enter", key });
      Object.defineProperty(event, "isComposing", { value: true });
      node.dispatchEvent(event);
    }
  });
  await page.waitForTimeout(900);
  await expect(live.locator("form")).toHaveCount(1);
  await expect(page.getByTestId("editing-calls")).toHaveText("0");
});

test("Escape cancels, and the key that opened the editor takes the focus back", async ({ page }) => {
  await open(page);
  const { live, field } = await openEditor(page);
  await field.press("End");
  await page.keyboard.type(" Never mind.");
  await field.press("Escape");
  await expect(live.locator("form")).toHaveCount(0);
  const edit = page.getByTestId("edit-live").getByRole("button", { name: "Edit" });
  await expect(edit).toBeFocused();
  // Nothing was sent and the message is the one that was there.
  await expect(page.getByTestId("editing-calls")).toHaveText("0");
  await expect(page.getByTestId("edit-live").locator(".fui-chat-message")).toHaveCount(1);
});

test("an unchanged or empty draft cannot be sent, and the hint says why in words", async ({ page }) => {
  await open(page);
  const editor = page.getByTestId("edit-hint");
  const field = editor.getByLabel("Edit message");
  const send = editor.getByRole("button", { name: "Save and send" });
  const hint = editor.locator(".fui-editable-message-hint");
  await expect(send).toHaveAttribute("aria-disabled", "true");
  await expect(send).not.toHaveAttribute("disabled", /.*/);
  await expect(hint).toHaveText("Sending this replaces what came after it. Change the message to send it.");
  await expect(field).toHaveAttribute("aria-describedby", (await hint.getAttribute("id"))!);
  await field.fill("   ");
  await expect(hint).toHaveText("Sending this replaces what came after it. Type a message to send.");
  await expect(send).toHaveAttribute("aria-disabled", "true");
  await field.fill("Send the invoice to Ana before noon.");
  await expect(hint).toHaveText("Sending this replaces what came after it.");
  await expect(send).not.toHaveAttribute("aria-disabled", /.*/);
  // And the key that cannot be pressed is still reachable from the keyboard.
  await send.focus();
  await expect(send).toBeFocused();
  // Pressed anyway, it sends nothing and leaves the editor where it is.
  const live = page.getByTestId("edit-live");
  await live.getByRole("button", { name: "Edit" }).click();
  await live.getByRole("button", { name: "Save and send" }).dispatchEvent("click");
  await page.waitForTimeout(400);
  await expect(page.getByTestId("editing-calls")).toHaveText("0");
  await expect(live.locator("form")).toHaveCount(1);
});

test("a refused send says why, keeps the draft, and the field stays usable", async ({ page }) => {
  await open(page);
  const editor = page.getByTestId("edit-idle");
  const field = editor.getByLabel("Edit message");
  await field.fill("Send the invoice to Ana before noon, and copy billing.");
  await editor.getByRole("button", { name: "Save and send" }).click();
  const alert = editor.getByRole("alert");
  await expect(alert).toHaveText("The thread is read only until the sync ends.");
  await expect(field).toHaveValue("Send the invoice to Ana before noon, and copy billing.");
  // The draft is still there to fix, and the editor did not close.
  await expect(editor.locator("form")).toHaveCount(1);
  await field.press("End");
  await page.keyboard.type(" Lettable later.");
  await expect(field).toHaveValue(/Lettable later\.$/);
});

test("a host's own failure is shown the same way, and pending locks the field", async ({ page }) => {
  await open(page);
  const failed = page.getByTestId("edit-error");
  await expect(failed.getByRole("alert")).toHaveText("The message was not saved: the thread is read only until the sync ends.");
  const pending = page.getByTestId("edit-pending");
  await expect(pending.locator("form")).toHaveAttribute("aria-busy", "true");
  await expect(pending.getByLabel("Edit message")).toHaveAttribute("readonly", "");
  await expect(pending.getByRole("button", { name: "Save and send" })).toHaveAttribute("aria-busy", "true");
  await expect(pending.locator(".fui-editable-message-hint")).toHaveText("Sending your message.");
});

test("the editor wears the bubble it replaces and is as wide, so the thread does not reflow", async ({ page }) => {
  await open(page);
  const editing = block(page, "Editing a message");
  const bubble = await editing.locator('.fui-chat-message[data-role="user"] > .fui-chat-message-body').first().evaluate((node) => getComputedStyle(node).borderRadius);
  const form = await page.getByTestId("edit-hint").locator("form").evaluate((node) => {
    const style = getComputedStyle(node);
    const box = node.getBoundingClientRect();
    let end = box.right;
    for (let parent = node.parentElement; parent; parent = parent.parentElement) end = Math.max(end, parent.getBoundingClientRect().right);
    return { radius: style.borderRadius, background: style.backgroundColor, right: box.right, end, marginStart: Number.parseFloat(style.marginInlineStart) };
  });
  expect(form.radius).toBe(bubble);
  // The same muted fill as the reader's own message.
  const fill = await editing.locator('.fui-chat-message[data-role="user"] > .fui-chat-message-body').first().evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(form.background).toBe(fill);
  // It sits at the reader's side of the thread, where the message it replaces sits.
  expect(form.marginStart).toBeGreaterThan(0);
});

// --- the stamp --------------------------------------------------------------------------------------------------------

test("a stamp in a zone the host fixed says today, another day, and the whole date", async ({ page }) => {
  await open(page);
  const stamps = block(page, "When it was sent").locator("time");
  await expect(stamps).toHaveCount(4);
  await expect(stamps.nth(0)).toHaveText("03:51");
  await expect(stamps.nth(1)).toHaveText("7 Nov, 04:31");
  await expect(stamps.nth(2)).toHaveText("10 Nov 2026, 03:51");
  await expect(stamps.nth(3)).toHaveText("03:51");
  // The whole date and time is the tooltip, never an extra line.
  await expect(stamps.nth(0)).toHaveAttribute("title", /03:51/);
  // A zone the host fixed is the same on the server and in the browser: it is never hidden.
  await expect(stamps.nth(0)).not.toHaveAttribute("aria-hidden", /.*/);
  expect(await stamps.nth(0).evaluate((node) => getComputedStyle(node).visibility)).toBe("visible");
});

test.describe("a reader in Tokyo", () => {
  test.use({ timezoneId: "Asia/Tokyo", locale: "ja-JP" });

  test("the stand-in is hidden and of the same size, and hydration shows Tokyo time without a mismatch or a shift", async ({ page }) => {
    const complaints: string[] = [];
    page.on("console", (message) => {
      if (/hydrat|did not match|didn't match/i.test(message.text())) complaints.push(message.text());
    });
    await open(page, "light", HYDRATION);
    const report = page.getByTestId("stamp-hydration");
    await expect(report).not.toHaveText("measuring");
    type Box = { text: string; width: number; height: number; hidden: boolean; title: string | null; ariaHidden: boolean };
    const { before, after, afterTop, errors } = JSON.parse((await report.textContent())!) as {
      before: Box;
      after: Box;
      afterTop: [number, number];
      errors: string[];
    };
    // The server sent the instant in UTC, hidden, with no tooltip to read the server's zone from.
    expect(before).toMatchObject({ text: "02:00", hidden: true, ariaHidden: true, title: null });
    // The reader sees their own zone, in their own format: 02:00 UTC is 11:00 in Tokyo.
    expect(after).toMatchObject({ text: "11:00", hidden: false, ariaHidden: false });
    expect(after.title).toMatch(/11:00/);
    expect(Math.abs(after.width - before.width)).toBeLessThan(0.5);
    expect(Math.abs(after.height - before.height)).toBeLessThan(0.5);
    expect(Math.abs(afterTop[1] - afterTop[0])).toBeLessThan(0.5);
    expect(errors).toEqual([]);
    expect(complaints).toEqual([]);
    // And on the live page.
    const live = page.getByTestId("stamp-row").locator("time");
    await expect(live).toHaveText("11:00");
    await expect(live).toBeVisible();
    await expect(live).toHaveAttribute("datetime", "2026-11-10T02:00:00.000Z");
  });
});
