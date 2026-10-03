// Geometry and behaviour of the 0.8 overlay, command and auth pieces in a real browser: what jsdom cannot see (layout, scrolling,
// hit testing, the library's own event order). Engine-agnostic on purpose: the assertions read computed geometry, never pixels.
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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

test("the launcher in a site header is the width of its content and the header stays one row from 390 to 2560 px; fit does it elsewhere", async ({ page }) => {
  const read = () =>
    page.evaluate(() => {
      const trigger = document.querySelector<HTMLElement>(".fui-site-header .fui-command-trigger")!;
      return {
        header: Math.round(document.querySelector(".fui-site-header")!.getBoundingClientRect().height),
        width: Math.round(trigger.getBoundingClientRect().width),
        height: Math.round(trigger.getBoundingClientRect().height),
        label: getComputedStyle(trigger.querySelector(".fui-command-trigger-label")!).display,
        sideways: document.documentElement.scrollWidth > innerWidth,
      };
    });
  // A phone: brand, launcher, appearance and menu on one row; the launcher is its icon, a 44 px target.
  await open(page, "fabrials-commands--in-the-site-header", 390);
  const phone = await read();
  expect(phone).toEqual({ header: 61, width: 44, height: 44, label: "none", sideways: false });
  // A wide screen: the same markup shows its label and keys, in the width of its content, still one row.
  await open(page, "fabrials-commands--in-the-site-header", 2560, 1315);
  const wide = await read();
  expect(wide.header).toBe(61);
  expect(wide.label).not.toBe("none");
  expect(wide.width).toBeGreaterThan(120);
  expect(wide.width).toBeLessThan(260);
  expect(wide.sideways).toBe(false);
  // Elsewhere the launcher fills its container (the default) and `fit` is the width of its content.
  const widths = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>("main .fui-command-trigger")].map((button) => Math.round(button.getBoundingClientRect().width)));
  expect(widths).toHaveLength(2);
  expect(widths[0]).toBeGreaterThan(400);
  expect(widths[1]).toBeGreaterThan(120);
  expect(widths[1]).toBeLessThan(300);
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

// ------------------------------------------------- 0.8.1: the drawer, the Close variant, the sticky footer

const drawerId = (rtl: boolean) => `fabrials-overlays--drawer-under-header${rtl ? "-rtl" : ""}`;
const openTheme = async (page: Page, id: string, theme: "light" | "dark", width = 1440, height = 900) => {
  await page.setViewportSize({ width, height });
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`);
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
};

for (const rtl of [false, true]) {
  test(`a drawer under a header (${rtl ? "right to left" : "left to right"}): under the header, on the inline end, next to its trigger, with its own level, no scrim and no focus taken`, async ({ page }) => {
    await open(page, drawerId(rtl), 1440, 900);
    const drawer = page.getByRole("dialog", { name: "Tools" });
    await expect(drawer).toBeVisible();
    const geometry = await page.evaluate(() => {
      const popup = document.querySelector<HTMLElement>(".fui-dialog")!;
      const box = popup.getBoundingClientRect();
      const header = document.querySelector("header")!.getBoundingClientRect();
      return {
        top: Math.round(box.top), headerBottom: Math.round(header.bottom), left: Math.round(box.left), right: Math.round(box.right),
        width: Math.round(box.width), bottom: Math.round(box.bottom), viewport: [innerWidth, innerHeight],
        z: getComputedStyle(popup).zIndex, inHeader: !!popup.closest("header"), side: popup.dataset.side,
        scrims: document.querySelectorAll(".fui-backdrop").length, inside: popup.contains(document.activeElement),
      };
    });
    expect(geometry.top).toBe(geometry.headerBottom); // --fui-sheet-inset-block-start
    expect(geometry.bottom).toBe(geometry.viewport[1]);
    expect(geometry.width).toBe(384); // --fui-sheet-width: 24rem
    if (rtl) expect(geometry.left).toBe(0);
    else expect(geometry.right).toBe(geometry.viewport[0]);
    expect(geometry.z).toBe("40"); // --fui-sheet-z
    expect(geometry.side).toBe("end");
    expect(geometry.inHeader).toBe(true); // container: portalled where the host asked
    expect(geometry.scrims).toBe(0);
    expect(geometry.inside).toBe(false); // initialFocus={false}
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(result.violations).toEqual([]);
  });
}

test("a drawer under a header: Tab goes from the trigger into the drawer; Escape closes it only from inside and hands focus back", async ({ page }) => {
  await open(page, drawerId(false), 1440, 900);
  const drawer = page.getByRole("dialog", { name: "Tools" });
  const trigger = page.getByRole("button", { name: "Tools", exact: true });
  const search = drawer.getByLabel("Search the tools");
  await expect(drawer).toBeVisible();
  // the drawer comes right after its trigger in the tab order
  await trigger.focus();
  await page.keyboard.press("Tab");
  await expect(search).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(drawer.getByRole("button", { name: "Close tools" })).toBeFocused();
  // Escape from the composer, from the page and from the trigger leaves it open
  await page.getByLabel("Reply").focus();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeVisible();
  await trigger.focus();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeVisible();
  // Escape that ends an input method composition inside it does not close it either
  await search.focus();
  await search.evaluate((element) => element.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", isComposing: true, bubbles: true, cancelable: true })));
  await page.waitForTimeout(150);
  await expect(drawer).toBeVisible();
  // a plain Escape from inside closes it and focus returns to the trigger
  await search.fill("kept");
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(trigger).toBeFocused();
  // kept mounted: hidden with display none, and what was typed is still there when it opens again
  expect(await page.locator(".fui-dialog").count()).toBe(1);
  expect(await page.locator(".fui-dialog").evaluate((element) => getComputedStyle(element).display)).toBe("none");
  await page.keyboard.press("Enter");
  await expect(drawer).toBeVisible();
  await expect(search).toHaveValue("kept");
  // opening it from the keyboard did not move focus into it either: the trigger keeps it
  await expect(trigger).toBeFocused();
});

test("a sheet with no options keeps its geometry: full height, 26rem, at the overlay level, on the physical side", async ({ page }) => {
  await open(page, "fabrials-overlays--modal-sheet", 1440, 900);
  const geometry = await page.evaluate(() => {
    const popup = document.querySelector<HTMLElement>(".fui-dialog")!;
    const box = popup.getBoundingClientRect();
    return { top: box.top, left: box.left, width: box.width, height: box.height, z: getComputedStyle(popup).zIndex, side: popup.dataset.side, inBody: popup.closest("body") !== null && popup.parentElement?.parentElement === document.body };
  });
  expect(geometry).toEqual({ top: 0, left: 0, width: 416, height: 900, z: "51", side: "left", inBody: true });
});

test("a close variant: the footer Close takes the variant of the content, the footer's own wins, the default stays secondary", async ({ page }) => {
  await open(page, "fabrials-overlays--close-variant", 1440, 900);
  const dialog = page.getByRole("dialog", { name: "Discard your changes?" });
  await expect(dialog).toBeVisible();
  const variant = (name: string) => dialog.getByRole("button", { name, exact: true }).getAttribute("data-variant");
  expect(await variant("Close")).toBe("outline");
  expect(await variant("Keep editing")).toBe("outline");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Footer wins" }).click();
  const second = page.getByRole("dialog", { name: "The footer decides" });
  await expect(second).toBeVisible();
  expect(await second.getByRole("button", { name: "Close", exact: true }).getAttribute("data-variant")).toBe("ghost");
  await page.keyboard.press("Escape");
  await open(page, "fabrials-overlays--fixed-dialog", 1440, 900);
  expect(await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).getAttribute("data-variant")).toBe("secondary");
});

/**
 * Tab through every field of the long form: each one must end up fully above the sticky footer (and inside the window). A
 * field that is not there yet is given a second to get there: WebKit scrolls a focused field smoothly, and slowly.
 */
const tabThroughFields = async (page: Page) => {
  await page.locator(".fui-dialog input").first().focus();
  const measure = () =>
    page.evaluate(() => {
      const active = document.activeElement;
      if (!(active instanceof HTMLInputElement)) return null;
      const footer = document.querySelector(".fui-dialog-footer")!;
      const sticky = getComputedStyle(footer).position === "sticky";
      const box = active.getBoundingClientRect();
      const floor = sticky ? footer.getBoundingClientRect().top : document.querySelector(".fui-dialog-body")!.getBoundingClientRect().bottom;
      return { sticky, bottom: box.bottom, footer: floor, ok: box.bottom <= floor + 0.5 && box.top >= 0 };
    });
  const seen: NonNullable<Awaited<ReturnType<typeof measure>>>[] = [];
  for (let step = 0; step < 12; step += 1) {
    await page.keyboard.press("Tab");
    let result = await measure();
    for (let wait = 0; result && !result.ok && wait < 10; wait += 1) {
      await page.waitForTimeout(100);
      result = await measure();
    }
    if (result) seen.push(result);
  }
  return seen;
};

for (const [width, height, text] of [[568, 320, 100], [1024, 400, 100], [320, 568, 200]] as const) {
  test(`a focused field is never under the sticky footer of a fixed dialog ${width}x${height} at ${text}% text`, async ({ page, browserName }) => {
    test.skip(text === 200 && browserName !== "chromium", "the browser's default font size can only be set through CDP here; Firefox is checked with its own preference by hand");
    await page.setViewportSize({ width, height });
    // 200 % text is the browser's default font size doubled: it moves the rem of the media query too, which a root style does not
    if (text === 200) await (await page.context().newCDPSession(page)).send("Page.setFontSizes", { fontSizes: { standard: 32, fixed: 26 } });
    await page.goto("/iframe.html?id=fabrials-overlays--long-form-dialog&viewMode=story&globals=theme:light");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const dialog = page.locator(".fui-dialog");
    // the layout under test: the dialog scrolls as a whole and only the footer sticks
    expect(await page.locator(".fui-dialog-footer").evaluate((element) => getComputedStyle(element).position)).toBe("sticky");
    const size = await dialog.evaluate((element) => parseFloat(element.style.getPropertyValue("--fui-dialog-footer-size")));
    expect(size).toBeGreaterThan(40);
    expect(await dialog.evaluate((element) => Math.round(parseFloat(getComputedStyle(element).scrollPaddingBlockEnd)) - Math.round(parseFloat(element.style.getPropertyValue("--fui-dialog-footer-size"))))).toBeGreaterThanOrEqual(16); // the footer plus some air (a spacing token)
    const seen = await tabThroughFields(page);
    expect(seen.length).toBeGreaterThanOrEqual(10);
    expect(seen.filter((field) => !field.ok)).toEqual([]);
    // the proof that the test sees the problem: without the padding the same walk leaves fields under the footer
    await dialog.evaluate((element) => element.style.setProperty("scroll-padding-block-end", "0px", "important"));
    await dialog.evaluate((element) => (element.scrollTop = 0));
    const without = await tabThroughFields(page);
    expect(without.filter((field) => !field.ok).length).toBeGreaterThan(0);
  });
}

test("a dialog whose footer is not sticky gets no scroll padding", async ({ page }) => {
  await open(page, "fabrials-overlays--long-form-dialog", 1440, 900);
  const dialog = page.locator(".fui-dialog");
  expect(await page.locator(".fui-dialog-footer").evaluate((element) => getComputedStyle(element).position)).not.toBe("sticky");
  expect(await dialog.evaluate((element) => getComputedStyle(element).scrollPaddingBlockEnd)).toBe("auto");
  expect(await dialog.locator(".fui-dialog-body").evaluate((element) => getComputedStyle(element).scrollPaddingBlockEnd)).toBe("auto");
  // a dialog with no DialogBody is the plain padded box: it has no rule for it either
  await open(page, "fabrials-overlays--keep-mounted", 1440, 900);
  await page.getByRole("button", { name: "Dialog" }).click();
  expect(await page.locator(".fui-dialog").evaluate((element) => getComputedStyle(element).scrollPaddingBlockEnd)).toBe("auto");
});

// visual references
for (const [name, id, theme] of [
  ["drawer-under-header-light", drawerId(false), "light"],
  ["drawer-under-header-dark", drawerId(false), "dark"],
  ["drawer-under-header-rtl-light", drawerId(true), "light"],
  ["close-variant-light", "fabrials-overlays--close-variant", "light"],
] as const) {
  test(`visual: ${name} 1440`, async ({ page }) => {
    await openTheme(page, id, theme);
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot(`${name}-1440.png`);
  });
}

test("visual: a long form in a short window, the last field focused above the footer 568x320", async ({ page }) => {
  await openTheme(page, "fabrials-overlays--long-form-dialog", "light", 568, 320);
  await page.locator(".fui-dialog input[data-last]").focus();
  await page.waitForTimeout(300);
  await expect(page).toHaveScreenshot("long-form-short-window-568x320.png");
});
