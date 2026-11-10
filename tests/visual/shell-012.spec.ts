// The shell pieces of 0.12 in a real browser: the six references of the bench with axe, then what the dither canvas paints,
// what the account menu does, how the inset's bar and frame behave, a title renamed in place and the keyboard for a script
// the device lacks. Assertions read state, geometry and the canvas's own pixels, never a picture of them.
import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const STORY = "/iframe.html?id=tests-shell-0-12--pieces&viewMode=story";
const RENAME = "/iframe.html?id=tests-shell-0-12--rename-behaviour&viewMode=story";

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

async function open(page: Page, theme = "light", story = STORY) {
  await page.goto(`${story}&globals=theme:${theme}`);
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

/** Console errors and uncaught throws, for the tests that promise there are none. */
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

const box = async (locator: Locator) => {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error("no box");
  return { ...rect, right: rect.x + rect.width, bottom: rect.y + rect.height, cx: rect.x + rect.width / 2, cy: rect.y + rect.height / 2 };
};

for (const theme of ["light", "dark"]) {
  for (const width of [390, 768, 1440]) {
    test(`shell 0.12 ${theme} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 960 });
      await open(page, theme);
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark).*$/);
      // The pictures load and paint; the one that does not load still keeps its surface.
      await expect(page.locator('[data-testid="dither-source-ramp"] canvas[data-painted]')).toBeVisible();
      await expect(page.locator('[data-testid="dither-source-broken"] canvas[data-failed]')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const result = await audit(page);
      expect(result.violations).toEqual([]);
      await expect(page).toHaveScreenshot(`shell-012-${theme}-${width}.png`, { fullPage: true });
    });
  }
}

// --- the dither canvas ------------------------------------------------------------------------------------------------

const SKY = {
  light: ["c9ced4", "a3abb5", "7b8593", "56606e", "3a434f"],
  dark: ["1b2029", "43474e", "6f7d92", "a9c3e8", "dbe8ff"],
};
const PICTURE_LIGHT = ["f4e6d2", "e7c9a4", "d59a70", "a9684f", "6b3d41", "3a2437"];
const bytes = (hex: string) => [0, 2, 4].map((at) => Number.parseInt(hex.slice(at, at + 2), 16)).join(",");
const set = (ramp: string[]) => ramp.map((hex) => `${bytes(hex)},255`);

/** Every colour the canvas holds, and the surface it would fall back to (its ramp's first stop, resolved). */
async function canvasColours(page: Page, testId: string) {
  return page.evaluate((id) => {
    const canvas = document.querySelector<HTMLCanvasElement>(`[data-testid="${id}"] canvas`);
    if (!canvas) throw new Error(`no canvas in ${id}`);
    const context = canvas.getContext("2d");
    if (!context) throw new Error(`no context in ${id}`);
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const colours = new Map<string, number>();
    for (let at = 0; at < data.length; at += 4) {
      const key = `${data[at]},${data[at + 1]},${data[at + 2]},${data[at + 3]}`;
      colours.set(key, (colours.get(key) ?? 0) + 1);
    }
    const style = getComputedStyle(canvas);
    const surface = style.getPropertyValue("--fui-dither-bg").trim() || style.getPropertyValue("--background").trim();
    const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    let background = "";
    if (probe) {
      probe.fillStyle = "#000";
      probe.fillStyle = surface;
      probe.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data;
      background = `${r},${g},${b},${a}`;
    }
    const total = data.length / 4;
    return {
      colours: [...colours.keys()],
      dominant: [...colours.entries()].sort((a, b) => b[1] - a[1])[0]![0],
      transparent: [...colours.keys()].filter((key) => key.endsWith(",0")).length / total,
      background,
      width: canvas.width,
      painted: canvas.dataset.painted !== undefined,
      failed: canvas.dataset.failed !== undefined,
    };
  }, testId);
}

test("a scene the host paints and a picture both arrive as ramp colours, never as an empty box", async ({ page }) => {
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  for (const id of ["dither-paint-page", "dither-paint-card"]) {
    const canvas = await canvasColours(page, id);
    expect(canvas.painted).toBe(true);
    expect(canvas.failed).toBe(false);
    expect(canvas.transparent).toBe(0);
    // More than one colour: it is a dither, not a flat fill.
    expect(canvas.colours.length).toBeGreaterThan(1);
    // The star is drawn after the dithering, so it is the one colour that is not a ramp stop.
    const allowed = new Set([...set(SKY.light), canvas.background, "255,246,224,255"]);
    for (const colour of canvas.colours) expect(allowed.has(colour), `${id}: ${colour}`).toBe(true);
  }
  // A picture in ramp mode: the ramp's colours only, and the same picture in `contain` keeps its two bare edges.
  for (const id of ["dither-source-ramp", "dither-source-toned", "dither-source-contain"]) {
    const canvas = await canvasColours(page, id);
    expect(canvas.painted).toBe(true);
    expect(canvas.colours.length).toBeGreaterThan(2);
    const allowed = new Set([...set(PICTURE_LIGHT), canvas.background]);
    for (const colour of canvas.colours) expect(allowed.has(colour), `${id}: ${colour}`).toBe(true);
  }
  // Channels keep more than one step per channel: the hues survive.
  const channels = await canvasColours(page, "dither-source-channels");
  expect(channels.colours.length).toBeGreaterThan(6);
  // A picture that does not load leaves the plain surface, is marked, and says nothing to the console.
  const broken = await canvasColours(page, "dither-source-broken");
  expect(broken.failed).toBe(true);
  expect(broken.colours).toEqual([broken.background]);
  expect(errors).toEqual([]);
});

test("the canvas paints again when the theme changes", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const before = await canvasColours(page, "dither-paint-page");
  expect([...set(SKY.light)].some((colour) => before.colours.includes(colour))).toBe(true);
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await expect
    .poll(async () => (await canvasColours(page, "dither-paint-page")).dominant, { timeout: 4000 })
    .not.toBe(before.dominant);
  const after = await canvasColours(page, "dither-paint-page");
  const dark = new Set([...set(SKY.dark), after.background, "255,246,224,255"]);
  for (const colour of after.colours) expect(dark.has(colour), colour).toBe(true);
  expect(after.colours.some((colour) => set(SKY.dark).includes(colour))).toBe(true);
  await page.evaluate(() => document.documentElement.classList.remove("dark"));
});

// --- the account row --------------------------------------------------------------------------------------------------

const accountIn = (page: Page, testId: string) => page.locator(`[data-testid="${testId}"]`).getByRole("button", { name: "Account menu for Ada Lovelace" });

test("the account row opens a menu above itself, and its items and theme answer the keys", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const trigger = accountIn(page, "account-expanded");
  await expect(trigger).toHaveAccessibleName("Account menu for Ada Lovelace");
  const row = await box(trigger);
  // 44 px tall, and the second line with the address is in the row.
  expect(row.height).toBeGreaterThanOrEqual(43.5);
  await expect(trigger).toContainText("Ada Lovelace");
  await expect(trigger).toContainText("ada@harbour.test");

  await trigger.click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  const popup = await box(menu);
  expect(popup.bottom).toBeLessThanOrEqual(row.y + 1);
  expect(Math.abs(popup.x - row.x)).toBeLessThanOrEqual(2);
  // Who you are, your items, and the theme.
  await expect(menu).toContainText("ada@harbour.test");
  const items = page.getByRole("menuitem");
  await expect(items).toHaveCount(3);
  await expect(page.getByRole("menuitemradio")).toHaveCount(3);

  // The arrows move the highlight through the items, and the focus stays in the menu.
  const highlighted = async () => (await page.locator('.fui-menu [data-highlighted]').first().textContent())?.trim();
  await page.keyboard.press("ArrowDown");
  expect(await highlighted()).toBe("Settings");
  await page.keyboard.press("ArrowDown");
  expect(await highlighted()).toBe("Members");
  await page.keyboard.press("ArrowDown");
  expect(await highlighted()).toBe("Sign out");
  await page.keyboard.press("ArrowUp");
  expect(await highlighted()).toBe("Members");
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest('[role="menu"]')))).toBe(true);

  // The theme radio calls back, and the choice shows.
  await page.getByRole("menuitemradio", { name: "Dark" }).click();
  await expect(page.getByTestId("account-theme")).toHaveText("Theme: dark");

  // Escape closes it and gives the focus back to the row.
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("a menu of the theme only: three radios, named by a group label", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  await accountIn(page, "account-expanded").click();
  const group = page.getByRole("group").filter({ has: page.getByRole("menuitemradio") });
  await expect(group).toHaveCount(1);
  await page.getByRole("menuitemradio", { name: "Light" }).click();
  await expect(page.getByTestId("account-theme")).toHaveText("Theme: light");
});

test("a sidebar folded to icons keeps only the picture, and its menu still opens", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const stage = page.getByTestId("full-sidebar");
  const sidebar = stage.locator(".fui-sidebar");
  await expect(sidebar).toHaveAttribute("data-state", "expanded");
  const trigger = stage.getByRole("button", { name: "Account menu for Ada Lovelace" });
  await expect(trigger).toContainText("Ada Lovelace");

  await stage.getByRole("button", { name: "Toggle navigation" }).click();
  await expect(sidebar).toHaveAttribute("data-state", "collapsed");
  await expect(sidebar).toHaveAttribute("data-collapsible", "icon");
  await expect(trigger.locator(".fui-sidebar-account-text")).toBeHidden();
  await expect(trigger.locator(".fui-sidebar-account-chevron")).toBeHidden();
  await expect(trigger.locator('[data-slot="avatar"]')).toBeVisible();
  const folded = await box(trigger);
  expect(folded.width).toBeLessThan(60);
  expect(folded.height).toBeGreaterThanOrEqual(39);

  await trigger.click();
  await expect(page.getByRole("menu")).toBeVisible();
  await expect(page.getByRole("menuitem")).toHaveCount(3);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

// --- the inset's bar and frame ----------------------------------------------------------------------------------------

test("the phone's bar carries actions rendered from inside the content, and the framed inset scrolls under it", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  const inset = page.getByTestId("inset-mobile");
  const header = inset.locator('[data-slot="sidebar-inset-header"]');
  await expect(header).toBeVisible();
  const bar = await box(header);
  expect(bar.height).toBeGreaterThanOrEqual(55);
  // The title truncates rather than pushing the actions out.
  const title = header.locator(".fui-sidebar-inset-title");
  await expect(title).toHaveAttribute("dir", "auto");
  expect(await title.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
  // The trigger is a 44 px target, and the primary action sits at the end.
  expect((await box(header.getByRole("button", { name: "Toggle navigation" }))).width).toBeGreaterThanOrEqual(43.5);
  expect((await box(header.getByRole("button", { name: "New report" }))).right).toBeLessThanOrEqual(bar.right);

  // An action rendered deep in the content lands in the bar's slot.
  const search = inset.getByRole("button", { name: "Search the reports" });
  await expect(search).toHaveCount(1);
  await expect(page.getByTestId("inset-mobile").getByRole("button", { name: "Search the settings" })).toHaveCount(0);
  expect(await search.evaluate((node) => Boolean(node.closest('[data-slot="sidebar-inset-header"]')))).toBe(true);
  expect(await search.evaluate((node) => Boolean(node.closest('[data-slot="sidebar-inset-content"]')))).toBe(false);

  // The content scrolls inside the frame and the bar stays where it is.
  const content = inset.locator('[data-slot="sidebar-inset-content"]');
  expect(await content.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
  const headerBefore = await box(header);
  await content.evaluate((node) => {
    node.scrollTop = 220;
  });
  expect(await content.evaluate((node) => node.scrollTop)).toBeGreaterThan(100);
  const headerAfter = await box(header);
  expect(headerAfter.y).toBeCloseTo(headerBefore.y, 0);

  // Past the phone width the bar that asked for `mobile` is not drawn, and the one that asked for `always` is.
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(header).toBeHidden();
  await expect(page.getByTestId("inset-always").locator('[data-slot="sidebar-inset-header"]')).toBeVisible();
});

// --- a title renamed in place -----------------------------------------------------------------------------------------

const renameState = (page: Page) => page.getByTestId("rename-state");
const field = (page: Page, name = "Rename chat") => page.getByRole("textbox", { name });

test("a rename takes the field with its text selected, commits once, and gives the focus back", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, "light", RENAME);
  await expect(renameState(page)).toHaveText("Commits: 0. Refusals: 0. Value: Harbour at night");
  const starter = page.getByRole("button", { name: "Rename the chat" });
  await starter.click();
  const input = field(page);
  await expect(input).toBeFocused();
  expect(await input.evaluate((node: HTMLInputElement) => [node.selectionStart, node.selectionEnd, node.value])).toEqual([0, 16, "Harbour at night"]);
  await input.fill("Harbour by day");
  await page.keyboard.press("Enter");
  await expect(renameState(page)).toHaveText("Commits: 1. Refusals: 0. Value: Harbour by day");
  await expect(input).toHaveCount(0);
  // Only once: the blur that ends the field commits nothing more.
  await page.waitForTimeout(150);
  await expect(renameState(page)).toHaveText("Commits: 1. Refusals: 0. Value: Harbour by day");
  // The focus goes back to the pencil that opened the field, which is drawn again now.
  await expect(starter).toBeFocused();
});

test("Escape cancels the rename, and a row that is a link keeps its navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, "light", RENAME);
  const starter = page.getByRole("button", { name: "Rename the chat" });
  await starter.click();
  await field(page).fill("Never mind");
  await page.keyboard.press("Escape");
  await expect(field(page)).toHaveCount(0);
  await expect(renameState(page)).toHaveText("Commits: 0. Refusals: 0. Value: Harbour at night");
  await expect(starter).toBeFocused();

  // Empty and unchanged are no change, so nobody is called.
  await starter.click();
  await page.keyboard.press("Enter");
  await expect(renameState(page)).toHaveText("Commits: 0. Refusals: 0. Value: Harbour at night");
  await starter.click();
  await field(page).fill("   ");
  await page.keyboard.press("Enter");
  await expect(renameState(page)).toHaveText("Commits: 0. Refusals: 0. Value: Harbour at night");

  // Leaving the field commits; the text is trimmed.
  await starter.click();
  await field(page).fill("  Harbour at dawn  ");
  await page.getByTestId("rename-states").getByRole("button", { name: "Rename the refused chat" }).focus();
  await expect(renameState(page)).toHaveText("Commits: 1. Refusals: 0. Value: Harbour at dawn");
});

test("a title renamed in a row that is a link does not navigate, and gives the focus back to the text", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const row = page.locator('a[href="#harbour"]');
  const text = row.locator(".fui-editable-text-value");
  const calls = page.getByTestId("rename-calls");
  await expect(calls).toHaveText("Commits: 0. Navigations: 0");
  // The row is still a row: one click on it navigates.
  await text.click();
  await expect(calls).toHaveText("Commits: 0. Navigations: 1");
  // A double click opens the field, and from then on the row is left alone.
  await text.dblclick();
  const input = row.getByRole("textbox", { name: "Rename chat" });
  await expect(input).toBeFocused();
  expect(await calls.textContent()).toBe("Commits: 0. Navigations: 2");
  await input.fill("Harbour at dawn");
  await input.click();
  expect(await calls.textContent()).toBe("Commits: 0. Navigations: 2");
  await page.keyboard.press("Escape");
  await expect(row.getByRole("textbox")).toHaveCount(0);
  // The text it started from has the focus back.
  await expect(text).toBeFocused();
  expect(await calls.textContent()).toBe("Commits: 0. Navigations: 2");
});

test("a commit the host refuses puts the old text back and says why", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, "light", RENAME);
  await page.getByRole("button", { name: "Rename the refused chat" }).click();
  await field(page, "Rename the refused chat").fill("Something else");
  await page.keyboard.press("Enter");
  await expect(renameState(page)).toHaveText("Commits: 0. Refusals: 1. Value: Harbour at night");
  await expect(page.getByText("Refused title")).toBeVisible();
});

test("Escape in a rename does not close the sheet around it", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page, "light", RENAME);
  await page.getByRole("button", { name: "Rename inside a sheet" }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible();
  const input = sheet.getByRole("textbox", { name: "Rename chat" });
  await expect(input).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("textbox", { name: "Rename chat" })).toHaveCount(0);
});

// --- the keyboard -----------------------------------------------------------------------------------------------------

const key = (keyboard: Locator, name: string) => keyboard.getByRole("button", { name, exact: true });

test("the keyboard is one tab stop, and the arrows take the focus by what is on screen", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const keyboard = page.getByTestId("keyboard-latin");
  const keys = keyboard.locator('[data-slot="on-screen-key"]');
  expect(await keys.count()).toBe(30);
  expect(await keys.evaluateAll((nodes) => nodes.filter((node) => node.getAttribute("tabindex") === "0").length)).toBe(1);

  const keyOf = (index: number) => keys.nth(index);
  await keyOf(2).focus();
  await expect(keyboard.locator('[data-key-index="2"]')).toHaveAttribute("tabindex", "0");
  // The key under it, by geometry: whichever of the row below has its middle closest to this key's middle.
  const expected = await keys.evaluateAll((nodes, from) => {
    const boxes = nodes.map((node) => node.getBoundingClientRect());
    const current = boxes[from]!;
    const centreY = current.top + current.height / 2;
    const centreX = current.left + current.width / 2;
    const others = boxes
      .map((box, at) => ({ at, box }))
      .filter(({ box }) => box.top + box.height / 2 - centreY > current.height / 2);
    const nearest = Math.min(...others.map(({ box }) => box.top + box.height / 2 - centreY));
    const row = others.filter(({ box }) => box.top + box.height / 2 - centreY - nearest < current.height / 2);
    row.sort(
      (a, b) =>
        Math.abs(a.box.left + a.box.width / 2 - centreX) - Math.abs(b.box.left + b.box.width / 2 - centreX),
    );
    return row[0]!.at;
  }, 2);
  await page.keyboard.press("ArrowDown");
  expect(await keys.evaluateAll((nodes) => nodes.findIndex((node) => node === document.activeElement))).toBe(expected);
  expect(expected).not.toBe(3);
  // Home and End stay in the row the focus is in.
  await page.keyboard.press("End");
  const end = await keys.evaluateAll((nodes) => nodes.findIndex((node) => node === document.activeElement));
  await page.keyboard.press("Home");
  const home = await keys.evaluateAll((nodes) => nodes.findIndex((node) => node === document.activeElement));
  expect(home).toBeLessThan(end);
  expect(Math.floor(home / 10)).toBe(Math.floor(end / 10));
  // Enter types the key the focus is on.
  await keys.nth(0).focus();
  const value = page.getByTestId("keyboard-value-latin");
  await page.keyboard.press("Enter");
  await expect(value).toHaveText("q");
});

test("a key types at the caret and the field keeps the focus and the value", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const keyboard = page.getByTestId("keyboard-latin");
  const input = page.getByTestId("keyboard-field-latin");
  const value = page.getByTestId("keyboard-value-latin");
  // The device's own keyboard stays down while this one is up.
  await expect(input).toHaveAttribute("inputmode", "none");

  await input.click();
  await key(keyboard, "q").click();
  await key(keyboard, "w").click();
  await expect(value).toHaveText("qw");
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("qw");

  // The caret is where it was: ArrowLeft in the field, then a key goes in the middle.
  await page.keyboard.press("ArrowLeft");
  await key(keyboard, "e").click();
  await expect(input).toHaveValue("qew");
  await expect(value).toHaveText("qew");
  await expect(input).toBeFocused();

  // A selection is replaced.
  await input.evaluate((node: HTMLInputElement) => node.setSelectionRange(1, 2));
  await key(keyboard, "z").click();
  await expect(input).toHaveValue("qzw");

  // Hiding the keyboard gives the device's own back.
  await page.getByTestId("keyboard-latin").getByRole("button", { name: "Hide the keyboard" }).click();
  await expect(page.getByTestId("keyboard-latin").locator('[data-slot="on-screen-key"]')).toHaveCount(0);
  await expect(input).not.toHaveAttribute("inputmode", "none");
});

test("backspace held down deletes a whole cluster at a time, and the release adds nothing", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const keyboard = page.getByTestId("keyboard-latin");
  const input = page.getByTestId("keyboard-field-latin");
  await input.fill("abcdefgh👨‍👩‍👧");
  await expect(input).toHaveValue("abcdefgh👨‍👩‍👧");
  const back = key(keyboard, "Backspace");
  // One click takes the joined emoji as one cluster.
  await back.click();
  await expect(input).toHaveValue("abcdefgh");
  await back.click();
  await expect(input).toHaveValue("abcdefg");
  // Held: it repeats after 450 ms, then every 55 ms.
  const target = await box(back);
  await page.mouse.move(target.cx, target.cy);
  await page.mouse.down();
  await page.waitForTimeout(720);
  await page.mouse.up();
  const held = await input.inputValue();
  expect("abcdefg".startsWith(held)).toBe(true);
  expect(held.length).toBeLessThanOrEqual(5);
  expect(/[\uD800-\uDFFF]/.test(held)).toBe(false);
  await page.waitForTimeout(200);
  await expect(input).toHaveValue(held);
});

test("a right-to-left keyboard puts its first key at the right", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const keyboard = page.getByTestId("keyboard-arabic");
  await expect(keyboard.locator(".fui-keyboard")).toHaveAttribute("dir", "rtl");
  const first = await box(keyboard.locator('[data-key-index="0"]'));
  const second = await box(keyboard.locator('[data-key-index="1"]'));
  expect(first.x).toBeGreaterThan(second.x);
  // The same keyboard in a left-to-right page reads the other way round.
  const latin = page.getByTestId("keyboard-latin");
  const left = await box(latin.locator('[data-key-index="0"]'));
  const right = await box(latin.locator('[data-key-index="1"]'));
  expect(left.x).toBeLessThan(right.x);
  // A press with the pointer leaves the caret in the field it types into.
  const input = page.getByTestId("keyboard-field-arabic");
  await input.click();
  await keyboard.getByRole("button", { name: "ض", exact: true }).click();
  await expect(input).toHaveValue("ض");
  await expect(input).toBeFocused();
});

// --- system colours ---------------------------------------------------------------------------------------------------

test("in system colours the current account row and a key's focus are edges, not fills", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  await page.emulateMedia({ forcedColors: "active" });
  const plate = page.getByTestId("account-active").getByRole("button", { name: "Account menu for Beacon Operations" });
  const drawn = await plate.evaluate((node) => {
    const style = getComputedStyle(node);
    return { outline: style.outlineStyle, width: style.outlineWidth, shadow: style.boxShadow, colour: style.outlineColor };
  });
  expect(drawn.outline).toBe("solid");
  expect(drawn.width).toBe("2px");
  expect(drawn.shadow).toBe("none");
  expect(drawn.colour).not.toBe("rgba(0, 0, 0, 0)");
  const key = page.getByTestId("keyboard-latin").locator('[data-slot="on-screen-key"]').first();
  await key.focus();
  const ring = await key.evaluate((node) => {
    const style = getComputedStyle(node);
    return { outline: style.outlineStyle, colour: style.outlineColor };
  });
  expect(ring.outline).toBe("solid");
  expect(ring.colour).not.toBe("rgba(0, 0, 0, 0)");
});
