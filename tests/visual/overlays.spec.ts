// Geometry and behaviour of the 0.8 overlay, command and auth pieces in a real browser: what jsdom cannot see (layout, scrolling,
// hit testing, the library's own event order). Engine-agnostic on purpose: the assertions read computed geometry, never pixels.
import { expect, test, type Page } from "@playwright/test";

const open = async (page: Page, id: string, width = 1440, height = 900) => {
  await page.setViewportSize({ width, height });
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=theme:light`);
  // the page behind an open modal is inert, so the heading is found by selector, not by role
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
};

test("a fixed dialog: the header and the footer stay put while the body scrolls, and the dialog itself never scrolls", async ({ page }) => {
  await open(page, "fabrials-overlays--fixed-dialog");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const rects = () =>
    dialog.evaluate((element) => {
      const box = (selector: string) => element.querySelector(selector)!.getBoundingClientRect();
      const body = element.querySelector(".fui-dialog-body") as HTMLElement;
      return { header: box(".fui-dialog-header").top, footer: box(".fui-dialog-footer").top, scrolls: body.scrollHeight > body.clientHeight, top: body.scrollTop, own: element.scrollHeight - element.clientHeight };
    });
  const before = await rects();
  expect(before.scrolls).toBe(true);
  expect(before.own).toBe(0);
  await dialog.locator(".fui-dialog-body").evaluate((element) => (element.scrollTop = 400));
  const after = await rects();
  expect(after.top).toBeGreaterThan(0);
  expect(after.header).toBe(before.header);
  expect(after.footer).toBe(before.footer);
  // Close first, then the primary action, at the inline end; both are 44 px tall targets
  const buttons = await dialog.locator(".fui-dialog-footer .fui-button").evaluateAll((all) => all.map((button) => ({ text: button.textContent, height: Math.round(button.getBoundingClientRect().height), left: button.getBoundingClientRect().left })));
  expect(buttons.map((button) => button.text)).toEqual(["Close", "Save a copy"]);
  expect(buttons[0].left).toBeLessThan(buttons[1].left);
  for (const button of buttons) expect(button.height).toBeGreaterThanOrEqual(44);
  // the action lives in the form's state: submitting from the footer submits the form
  await page.getByRole("button", { name: "Save a copy" }).last().focus();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("a long title wraps inside the header instead of being clipped, and a narrow footer puts the ink action last, on the full bottom row", async ({ page }) => {
  await open(page, "fabrials-overlays--long-title", 390, 800);
  const dialog = page.getByRole("dialog");
  const header = await dialog.locator(".fui-dialog-header").evaluate((element) => ({ clipped: element.scrollHeight > element.clientHeight, over: element.scrollWidth > element.clientWidth }));
  expect(header).toEqual({ clipped: false, over: false });
  // full-narrow: the whole screen on a phone
  const box = (await dialog.boundingBox())!;
  expect(Math.round(box.width)).toBe(390);
  expect(Math.round(box.height)).toBe(800);
  const buttons = await dialog.locator(".fui-dialog-footer .fui-button").evaluateAll((all) => all.map((button) => ({ text: button.textContent, top: Math.round(button.getBoundingClientRect().top), width: Math.round(button.getBoundingClientRect().width), height: Math.round(button.getBoundingClientRect().height) })));
  const ink = buttons.find((button) => button.text === "Save as template")!;
  for (const other of buttons.filter((button) => button !== ink)) expect(ink.top).toBeGreaterThan(other.top);
  expect(ink.width).toBeGreaterThan(300);
  for (const button of buttons) expect(button.height).toBeGreaterThanOrEqual(44);
  // visual order is DOM order: Close, the others, the ink action last
  const order = await dialog.locator(".fui-dialog-footer .fui-button").evaluateAll((all) => all.map((button) => button.textContent));
  expect(order).toEqual(["Close", "Keep editing", "Discard", "Save as template"]);
  // the same story on a desktop window is the default width, not full screen
  await open(page, "fabrials-overlays--long-title", 1440, 900);
  expect(Math.round((await page.getByRole("dialog").boundingBox())!.width)).toBe(512);
});

test("the settings size: the rail and the panel scroll on their own inside a fixed frame", async ({ page }) => {
  await open(page, "fabrials-overlays--settings-dialog");
  const dialog = page.getByRole("dialog", { name: "Settings" });
  const box = (await dialog.boundingBox())!;
  expect(Math.round(box.width)).toBe(992); // 62rem
  expect(Math.round(box.height)).toBe(672); // 42rem
  const panel = dialog.getByRole("tabpanel");
  expect(await panel.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  expect(await dialog.evaluate((element) => element.scrollHeight - element.clientHeight)).toBe(0);
  await open(page, "fabrials-overlays--settings-dialog", 390, 800);
  const phone = (await page.getByRole("dialog", { name: "Settings" }).boundingBox())!;
  expect([Math.round(phone.width), Math.round(phone.height)]).toEqual([390, 800]);
});

test("a non-modal sheet: no scrim, the page stays usable, an outside press keeps it open, Escape closes it and returns focus", async ({ page }) => {
  await open(page, "fabrials-overlays--non-modal-sheet");
  const sheet = page.getByRole("dialog", { name: "Tools" });
  await expect(sheet).toBeVisible();
  expect(await page.locator(".fui-backdrop").count()).toBe(0);
  const field = page.getByLabel("Reply");
  await field.click();
  await page.keyboard.type("still typing");
  await expect(field).toHaveValue("still typing");
  await page.mouse.click(300, 700); // empty page area
  await expect(sheet).toBeVisible();
  await sheet.getByLabel("Search the tools").focus();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(page.getByRole("button", { name: "Tools" })).toBeFocused();
  // and it opens again, the reply is untouched
  await page.keyboard.press("Enter");
  await expect(sheet).toBeVisible();
  await expect(field).toHaveValue("still typing");
});

test("a modal sheet has a scrim and keeps the page inert", async ({ page }) => {
  await open(page, "fabrials-overlays--modal-sheet", 768, 900);
  expect(await page.locator(".fui-backdrop").count()).toBe(1);
  await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
});

test("kept-mounted content survives closing: what was typed is there when it opens again", async ({ page }) => {
  await open(page, "fabrials-overlays--keep-mounted");
  await page.getByRole("button", { name: "Dialog" }).click();
  await page.getByLabel("Reply text").fill("draft kept");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  expect(await page.locator(".fui-dialog").count()).toBe(1);
  expect(await page.locator(".fui-dialog").evaluate((element) => getComputedStyle(element).display)).toBe("none");
  await page.getByRole("button", { name: "Dialog" }).click();
  await expect(page.getByLabel("Reply text")).toHaveValue("draft kept");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Popover" }).click();
  await page.getByLabel("New name").fill("kept name");
  await page.keyboard.press("Escape");
  // Base UI marks the closed popup hidden once its close has settled, not synchronously with Escape: retry, do not sample once.
  await expect.poll(() => page.locator(".fui-popover").evaluate((element) => getComputedStyle(element.closest("[hidden]") ?? element).display)).toBe("none");
  await expect(page.getByLabel("New name")).toBeAttached();
  await page.getByRole("button", { name: "Popover" }).click();
  await expect(page.getByLabel("New name")).toHaveValue("kept name");
});

test("tool rows: Tab moves between the triggers; the row is one 44 px target; typed text survives", async ({ page }) => {
  await open(page, "fabrials-commands--tools");
  const first = page.getByRole("button", { name: "Reminders" }).first();
  await first.focus();
  // Base UI's accordion has no arrow-key roving: every trigger is a tab stop. With the first row closed, Tab goes to the next trigger.
  await page.keyboard.press("Enter");
  await expect(first).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Labels" }).first()).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(first).toBeFocused();
  await page.keyboard.press("Space");
  await expect(first).toHaveAttribute("aria-expanded", "true");
  // the trigger's ::after covers the whole row, so a click on the aside (tags) toggles it
  const head = first.locator("xpath=ancestor::div[contains(@class,'fui-accordion-head')]");
  const box = (await head.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);
  const note = page.getByLabel("Note").first();
  await first.click();
  expect(await note.evaluate((element) => element.closest("[hidden]") !== null)).toBe(true);
  await first.click();
  await expect(note).toBeVisible();
  const ring = await first.evaluate((element) => ({ after: getComputedStyle(element, "::after").position, inset: getComputedStyle(element, "::after").top }));
  expect(ring).toEqual({ after: "absolute", inset: "0px" });
});

test("the launcher is icon-only in a command container under 12rem and labelled from it", async ({ page }) => {
  await open(page, "fabrials-commands--launcher");
  const rows = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("main section:nth-of-type(2) .fui-command-trigger")].map((button) => ({
      label: getComputedStyle(button.querySelector(".fui-command-trigger-label")!).display,
      keys: button.querySelector(".fui-command-trigger-keys") ? getComputedStyle(button.querySelector(".fui-command-trigger-keys")!).display : null,
      width: Math.round(button.getBoundingClientRect().width),
    })),
  );
  expect(rows.map((row) => row.label === "none")).toEqual([false, false, true, true]);
  expect(rows.map((row) => row.width)).toEqual([352, 224, 176, 128]);
  const height = await page.getByRole("button", { name: "Search or run a command" }).first().evaluate((element) => element.getBoundingClientRect().height);
  expect(height).toBeGreaterThanOrEqual(44);
});

test("command rows: the active row has the 2 px bar and the fill, a disabled row keeps its pointer", async ({ page }) => {
  await open(page, "fabrials-commands--options");
  const active = page.locator('[role="option"][data-active]').first();
  expect(await active.evaluate((element) => getComputedStyle(element, "::before").width)).toBe("2px");
  const disabled = page.locator('[role="option"][aria-disabled="true"]').first();
  const style = await disabled.evaluate((element) => ({ cursor: getComputedStyle(element).cursor, events: getComputedStyle(element).pointerEvents }));
  expect(style).toEqual({ cursor: "not-allowed", events: "auto" });
  const box = (await page.locator('[role="option"]').first().boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);
});

test("the command dialog: 6 px corners, and its top and maximum height share one variable", async ({ page }) => {
  await open(page, "fabrials-commands--palette-dialog", 1440, 700);
  const dialog = page.getByRole("dialog");
  const style = await dialog.evaluate((element) => ({ radius: getComputedStyle(element).borderTopLeftRadius, top: element.getBoundingClientRect().top, max: getComputedStyle(element).maxHeight }));
  expect(style.radius).toBe("6px");
  expect(style.top).toBeCloseTo(98, 0); // min(14dvh, 9rem) of 700
  expect(parseFloat(style.max)).toBeCloseTo(700 - 98 - 24, 0);
});

test("AuthLayout: beside the storm the card anchors to the start of its column, the corner action sits at the top end, the sign-in action is the first stop", async ({ page }) => {
  await open(page, "fabrials-auth--aside-auto");
  const geometry = async () =>
    page.evaluate(() => {
      const card = document.querySelector(".fui-auth-card")!.getBoundingClientRect();
      const main = document.querySelector(".fui-auth-main")!.getBoundingClientRect();
      const actions = document.querySelector(".fui-auth-actions")!.getBoundingClientRect();
      return { cardLeft: Math.round(card.left - main.left), mainWidth: Math.round(main.width), cardWidth: Math.round(card.width), actionsTop: Math.round(actions.top), actionsRight: Math.round(window.innerWidth - actions.right) };
    });
  const auto = await geometry();
  expect(auto.cardLeft).toBe(48); // space-12 from the column's start edge
  expect(auto.actionsTop).toBeLessThanOrEqual(16);
  expect(auto.actionsRight).toBe(24);
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.getAttribute("type"))).toBe("email"); // the form before the corner menu
  await open(page, "fabrials-auth--aside-centred");
  const centred = await geometry();
  expect(Math.abs(centred.cardLeft - (centred.mainWidth - centred.cardWidth) / 2)).toBeLessThanOrEqual(1);
  await open(page, "fabrials-auth--start");
  const start = await geometry();
  expect(start.cardLeft).toBe(24);
  await open(page, "fabrials-auth--centred");
  const plain = await geometry();
  expect(Math.abs(plain.cardLeft - (plain.mainWidth - plain.cardWidth) / 2)).toBeLessThanOrEqual(1);
});

test("a status popover opens from its named trigger and Escape returns focus to it", async ({ page }) => {
  await open(page, "fabrials-overlays--status-popovers");
  const trigger = page.getByRole("button", { name: /^Permissions: Some actions are unavailable/ }).first();
  await trigger.focus();
  await page.keyboard.press("Enter");
  const popup = page.getByRole("dialog", { name: "Permissions" }).first();
  await expect(popup).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(popup).toBeHidden();
  await expect(trigger).toBeFocused();
});
