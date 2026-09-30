// Geometry and behaviour of the 0.8 structure pieces in a real browser: what jsdom cannot see (layout, hit testing,
// the library's own event order). Engine-agnostic on purpose: the assertions read computed geometry, never pixels.
import { expect, test, type Page } from "@playwright/test";

const open = async (page: Page, id: string, width = 1440) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=theme:light`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
};

test("a stretched item: the row is the target, controls above it are their own, the ring is inside the row", async ({ page }) => {
  await open(page, "fabrials-structure--items");
  const row = page.locator("ul[aria-label='Messages'] > li").first();
  const box = (await row.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);
  const middle = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.className, { x: box.x + 500, y: box.y + box.height / 2 });
  expect(middle).toContain("fui-item-link");
  await page.mouse.click(box.x + 500, box.y + box.height / 2);
  expect(await page.evaluate(() => location.hash)).toBe("#message");
  await page.evaluate(() => (location.hash = ""));
  await row.getByRole("button", { name: /Star/ }).click();
  expect(await page.evaluate(() => location.hash)).toBe("");
  const link = row.locator("a");
  await row.getByRole("checkbox").focus();
  await page.keyboard.press("Tab"); // keyboard focus: :focus-visible applies
  const ring = await link.evaluate((element) => {
    const after = getComputedStyle(element, "::after");
    return { outline: after.outlineStyle, offset: after.outlineOffset, position: after.position, own: getComputedStyle(element).outlineStyle };
  });
  expect(ring).toEqual({ outline: "solid", offset: "-2px", position: "absolute", own: "none" });
});

test("the current row has a 2 px Stormlight bar and the soft fill; a checked row has the fill and no bar", async ({ page }) => {
  await open(page, "fabrials-structure--items");
  const rows = page.locator("ul[aria-label='Messages'] > li");
  const bar = await rows.nth(2).evaluate((element) => ({ width: getComputedStyle(element, "::before").width, content: getComputedStyle(element, "::before").content }));
  expect(bar.width).toBe("2px");
  const checked = await rows.nth(1).evaluate((element) => getComputedStyle(element, "::before").content);
  expect(checked).toBe("none");
});

test("the header keeps its command slot at a definite width in every mode and never overflows", async ({ page }) => {
  await open(page, "fabrials-structure--application-header");
  const rows = await page.evaluate(() =>
    [...document.querySelectorAll("header.fui-app-header")].map((header) => {
      const command = header.querySelector(".fui-app-header-command");
      const actions = header.querySelector(".fui-app-header-actions")!;
      const inner = header.querySelector(".fui-app-header-inner")!;
      const children = [...actions.children].reduce((sum, child) => sum + child.getBoundingClientRect().width, 0) + (actions.children.length - 1) * 4;
      return {
        width: Math.round(header.getBoundingClientRect().width),
        command: command ? Math.round(command.getBoundingClientRect().width) : null,
        // The actions cluster is exactly as wide as its children: it is not sized from an ambiguous basis.
        clusterMatchesChildren: Math.abs(actions.getBoundingClientRect().width - children) <= 1,
        overflow: inner.scrollWidth - inner.clientWidth,
        blur: getComputedStyle(header).backdropFilter,
      };
    }),
  );
  for (const row of rows) {
    expect(row.overflow).toBe(0);
    expect(row.clusterMatchesChildren).toBe(true);
    expect(row.blur).toBe("none");
    if (row.command !== null) expect(row.command).toBe(row.width >= 72 * 16 ? 224 : 44);
  }
});

test("a double click on a handle resets the layout and is reported as a user interaction, wherever in the hit target it lands", async ({ page }) => {
  await open(page, "fabrials-structure--navigation");
  const saved = page.locator("output").first();
  const handle = page.getByRole("separator", { name: "Resize the navigation", exact: true });
  await handle.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(saved).not.toContainText("24 / 36 / 40");
  const box = (await handle.boundingBox())!;
  await page.mouse.dblclick(box.x + 3, box.y + 60);
  await expect(saved).toContainText("Saved layout: 24 / 36 / 40");
});

test("the resizable handle moves with the arrows, Home and End, and a disabled handle leaves the tab order", async ({ page }) => {
  await open(page, "fabrials-structure--navigation");
  const handle = page.getByRole("separator", { name: "Resize the navigation", exact: true });
  await handle.focus();
  const start = Number(await handle.getAttribute("aria-valuenow"));
  await page.keyboard.press("ArrowRight");
  expect(Number(await handle.getAttribute("aria-valuenow"))).toBeGreaterThan(start);
  await page.keyboard.press("End");
  const end = Number(await handle.getAttribute("aria-valuenow"));
  await page.keyboard.press("Home");
  expect(Number(await handle.getAttribute("aria-valuenow"))).toBeLessThan(end);
  await expect(page.getByRole("separator", { name: "Resize the reader", exact: true })).toHaveAttribute("data-separator", "disabled");
});

test("a scrolling strip keeps the selected tab in view without moving the page, and a rail follows the arrow keys", async ({ page }) => {
  await open(page, "fabrials-structure--sections", 390);
  const strip = page.getByRole("tablist", { name: "Settings sections" }).nth(1);
  const inside = () => strip.evaluate((list) => {
    const tab = list.querySelector('[aria-selected="true"]')!.getBoundingClientRect();
    const box = list.getBoundingClientRect();
    return tab.left >= box.left - 1 && tab.right <= box.right + 1;
  });
  await strip.scrollIntoViewIfNeeded();
  await expect.poll(inside).toBe(true);
  // A programmatic selection from a button outside the list (Playwright's own click would scroll its target into view and prove nothing).
  await page.getByRole("button", { name: "Select Mailboxes from outside" }).click();
  const before = await page.evaluate(() => scrollY); // after the click's own scrolling; the reveal must not move the page
  await expect(strip.getByRole("tab", { name: "Mailboxes" })).toHaveAttribute("aria-selected", "true");
  await expect.poll(inside).toBe(true);
  expect(await strip.evaluate((list) => Math.abs(list.scrollLeft))).toBeLessThan(4);
  expect(await page.evaluate(() => scrollY)).toBe(before);
  const rail = page.getByRole("tablist", { name: "Settings sections" }).first();
  await rail.getByRole("tab", { name: "Identity" }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(rail.getByRole("tab", { name: "Privacy" })).toBeFocused();
});

test("the switcher opens on the current link and Escape returns focus to its trigger", async ({ page }) => {
  await open(page, "fabrials-structure--navigation");
  const trigger = page.getByRole("button", { name: /Switch mailbox/ }).first();
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("link", { name: /ana@example\.test/ }).first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("a header that spans the window grows its command slot to 18rem at 90rem and 22rem at 120rem", async ({ page }) => {
  for (const [width, expected] of [[1200, 224], [1440, 288], [2560, 352]] as const) {
    await open(page, "fabrials-structure--full-width-header", width);
    const slot = await page.locator("header.fui-app-header .fui-app-header-command").evaluate((element) => Math.round(element.getBoundingClientRect().width));
    expect(slot, `${width} px window`).toBe(expected);
  }
});

// ---------------------------------------------------------------------------------------- BulkActions parts (0.8.1)

const focusedName = (page: Page) =>
  page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null;
    if (!element) return null;
    if (element.tagName === "SELECT") return (element as HTMLSelectElement).labels?.[0]?.textContent?.trim() ?? "select";
    return element.getAttribute("aria-label") ?? element.textContent?.trim() ?? element.tagName;
  });

test("BulkActions parts: the status is a live region that exists at 0 and is the same node at 1; the hidden actions are out of the tab order and the shown ones follow the title row", async ({ page }) => {
  await open(page, "fabrials-commands--bulk-parts", 1440);
  const root = page.locator(".fui-bulk-actions-root").first();
  const status = root.getByRole("status");
  // 0: the live region is in the DOM, visually hidden (1 px), and the group of actions is not rendered.
  await expect(status).toHaveText("Selected: 0");
  expect(await status.evaluate((element) => ({ live: element.getAttribute("role"), width: element.getBoundingClientRect().width, hidden: element.hasAttribute("data-empty") }))).toEqual({ live: "status", width: 1, hidden: true });
  await expect(root.getByRole("group", { name: "Selection actions" })).toBeHidden();
  await status.evaluate((element) => ((element as HTMLElement & { marked?: boolean }).marked = true));
  // Tab from select-all skips the closed form: the next stop is the first row.
  await root.getByRole("checkbox", { name: "Select all" }).focus();
  await page.keyboard.press("Tab");
  expect(await focusedName(page)).toBe("Select Quarterly planning notes");
  // 1: the same element now says one is selected (a live region that was replaced would not be announced), and the form appears.
  await page.keyboard.press("Space");
  await expect(status).toHaveText("Selected: 1");
  expect(await status.evaluate((element) => (element as HTMLElement & { marked?: boolean }).marked)).toBe(true);
  expect(await status.evaluate((element) => element.hasAttribute("data-empty"))).toBe(false);
  await expect(root.getByRole("group", { name: "Selection actions" })).toBeVisible();
  // The order: select-all, the form's controls, then the rows.
  await root.getByRole("checkbox", { name: "Select all" }).focus();
  const order: (string | null)[] = [];
  for (let index = 0; index < 4; index += 1) {
    await page.keyboard.press("Tab");
    order.push(await focusedName(page));
  }
  expect(order).toEqual(["Action", "Apply", "Clear selection", "Select Quarterly planning notes"]);
  // Clearing empties the region again: the form leaves the tab order and the status is back to hidden, still mounted.
  await root.getByRole("button", { name: "Clear selection" }).click();
  await expect(status).toHaveText("Selected: 0");
  await expect(root.getByRole("group", { name: "Selection actions" })).toBeHidden();
});

test("BulkActions parts on a phone row: the form stays closed (mounted) until the menu button opens it, and the layout does not overflow", async ({ page }) => {
  await open(page, "fabrials-commands--bulk-parts", 390);
  const root = page.locator(".fui-bulk-actions-root").nth(2);
  const group = root.getByRole("group", { name: "Selection actions" });
  await expect(root.getByRole("status")).toHaveText("Selected: 1");
  await expect(group).toBeHidden();
  expect(await root.locator(".fui-bulk-actions-content[hidden]").count()).toBe(1); // mounted, hidden (a role query does not see it)
  const row = await root.locator("> div").first().boundingBox();
  expect(row!.height).toBeLessThanOrEqual(49);
  await root.getByRole("button", { name: "More actions" }).click();
  await expect(group).toBeVisible();
  await expect(root.getByRole("button", { name: "Hide options" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("BulkActions parts: a layout's own display does not reopen a hidden form", async ({ page }) => {
  await open(page, "fabrials-commands--bulk-parts", 1440);
  // The story gives the form `display: flex` inline; [hidden] must still win, or Tab would reach a closed form.
  const form = page.locator(".fui-bulk-actions-root").first().locator(".fui-bulk-actions-content");
  expect(await form.evaluate((element) => ({ hidden: element.hasAttribute("hidden"), display: getComputedStyle(element).display }))).toEqual({ hidden: true, display: "none" });
});

test("a switcher with contain={false} follows the pane named nav-switcher; the default follows its own trigger", async ({ page }) => {
  await open(page, "fabrials-structure--switcher-in-pane");
  const state = () =>
    page.evaluate(() =>
      [...document.querySelectorAll("[data-pane]")].map((pane) => {
        const trigger = pane.querySelector(".fui-nav-switcher-trigger")!;
        const mark = pane.querySelector(".fui-nav-switcher-mark")!;
        return {
          width: Math.round(pane.getBoundingClientRect().width / 16 * 100) / 100,
          container: getComputedStyle(trigger).containerType,
          mark: getComputedStyle(mark).display !== "none",
          tag: getComputedStyle(pane.querySelector(".fui-nav-switcher-tag")!).display !== "none",
          overflow: trigger.scrollWidth - trigger.clientWidth,
        };
      }),
    );
  const rows = await state();
  // Four named panes (14, 17.5, 17.75, 24rem), the default trigger in an 18rem pane, and the resizable one (24rem).
  expect(rows.map((row) => row.container)).toEqual(["normal", "normal", "normal", "normal", "inline-size", "normal"]);
  expect(rows.map((row) => row.mark)).toEqual([false, false, true, true, false, true]);
  for (const row of rows) {
    expect(row.tag).toBe(true);
    expect(row.overflow).toBe(0);
  }
  // Dragging the resizable pane below and above the threshold moves the mark, with no script in the page.
  const pane = page.locator("[data-pane]").last();
  for (const [width, mark] of [[16 * 16, false], [17.4 * 16, false], [17.9 * 16, true]] as const) {
    await pane.evaluate((element, value) => ((element as HTMLElement).style.inlineSize = `${value}px`), width);
    expect(await pane.locator(".fui-nav-switcher-mark").evaluate((element) => getComputedStyle(element).display !== "none")).toBe(mark);
  }
});

// Request 6: a toolbar's targets are pinned in px and beat the package's own touch-and-narrow rule (min 2.75rem), which
// jsdom cannot see (cascade order and media queries). A coarse pointer on a 390 px screen, at 100 % and 200 % root text, set
// before the first paint (Firefox does not re-evaluate rem container queries on a live change).
test.describe("a toolbar on a phone keeps its targets at 44 px", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  for (const scale of [100, 200]) {
    test(`at ${scale} % root text`, async ({ page }) => {
      await page.addInitScript((size) => {
        const set = () => {
          if (!document.documentElement) return false;
          document.documentElement.style.fontSize = `${size}%`;
          return true;
        };
        if (!set()) new MutationObserver((_, observer) => {
          if (set()) observer.disconnect();
        }).observe(document, { childList: true });
      }, scale);
      await page.goto("/iframe.html?id=fabrials-controls--toolbars&viewMode=story&globals=theme:light");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
      const bars = await page.evaluate(() =>
        [...document.querySelectorAll(".fui-toolbar")].map((bar) => ({
          label: bar.getAttribute("aria-label"),
          height: Math.round(bar.getBoundingClientRect().height),
          boxes: [...bar.querySelectorAll(".fui-button")]
            .map((button) => button.getBoundingClientRect())
            .filter((box) => box.width > 0)
            .map((box) => [Math.round(box.width), Math.round(box.height)]),
        })),
      );
      expect(bars.length).toBeGreaterThan(3);
      for (const bar of bars) {
        for (const [width, height] of bar.boxes) {
          expect(height, `${bar.label} button height`).toBe(44);
          expect(width, `${bar.label} button width`).toBeGreaterThanOrEqual(44);
        }
      }
      // An icon button (a ToolbarButton and a class-only back link) stays square, and the row stays one row.
      const touch = bars.find((bar) => bar.label === "Message actions, touch")!;
      expect(touch.height).toBe(44);
      expect(touch.boxes.filter(([width]) => width === 44).length).toBeGreaterThanOrEqual(4);
      // Outside a toolbar the touch rule is untouched: a Button asks for 2.75rem.
      const outside = await page.evaluate(() => {
        const button = document.createElement("button");
        button.className = "fui-button";
        button.dataset.size = "icon";
        document.body.append(button);
        const box = button.getBoundingClientRect();
        button.remove();
        return [Math.round(box.width), Math.round(box.height)];
      });
      expect(outside).toEqual([44 * (scale / 100), 44 * (scale / 100)]);
    });
  }
});

// ---------------------------------------------------------------------------------------- data-hit shapes (0.8.1)

test("data-hit: 44 reaches four sides, y block-wise only, end block-wise and past the end edge only (LTR and RTL)", async ({ page }) => {
  await open(page, "fabrials-structure--hit-areas");
  const reach = (demo: string) =>
    page.locator(`[data-demo="${demo}"] [data-hit]`).first().evaluate((element) => {
      const box = element.getBoundingClientRect();
      const before = getComputedStyle(element, "::before");
      const number = (value: string) => Math.round(parseFloat(value));
      // Pixels the target reaches past each painted edge (a negative inset is reach).
      // The insets are from the padding box, so the border is added back to measure from the painted edge.
      const edge = getComputedStyle(element);
      const top = -(number(before.top) + number(edge.borderTopWidth));
      const bottom = -(number(before.bottom) + number(edge.borderBottomWidth));
      const left = -(number(before.left) + number(edge.borderLeftWidth));
      const right = -(number(before.right) + number(edge.borderRightWidth));
      const hit = (x: number, y: number) => document.elementFromPoint(x, y) === element;
      const mid = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      return {
        top, bottom, left, right,
        painted: { width: Math.round(box.width), height: Math.round(box.height) },
        // Hit testing: the element answers 6 px beyond each edge, or it does not.
        above: hit(mid.x, box.y - 6), below: hit(mid.x, box.bottom + 6), before: hit(box.x - 6, mid.y), after: hit(box.right + 6, mid.y),
      };
    });
  const four = await reach("44");
  expect(four).toMatchObject({ top: 10, bottom: 10, left: 10, right: 10, above: true, below: true, before: true, after: true });
  const y = await reach("y");
  // left and right are -1: inset 0 is the padding box, which sits inside the 1 px border, so there is no reach there.
  expect(y).toMatchObject({ top: 10, bottom: 10, left: -1, right: -1, above: true, below: true, before: false, after: false });
  const end = await reach("end");
  expect(end.left).toBe(-1);
  expect(end.right).toBeGreaterThan(0);
  expect(end.top).toBeGreaterThan(0);
  expect(end).toMatchObject({ above: true, below: true, before: false, after: true });
  // The extension is whole: the target is exactly the control height wide and high, however small the painted control is.
  expect(end.painted.width + end.left + end.right).toBe(44);
  expect(end.left).toBeLessThanOrEqual(0);
  expect(end.painted.height + end.top + end.bottom).toBe(44);
  // Right to left the end edge is on the left.
  const rtl = await reach("end-rtl");
  expect(rtl).toMatchObject({ above: true, below: true, before: true, after: false });
  expect(rtl.left).toBeGreaterThan(0);
  expect(rtl.right).toBe(-1);
});

test("the three data-hit shapes, with the target drawn", async ({ page }) => {
  for (const theme of ["light", "dark"] as const) {
    await page.setViewportSize({ width: 1000, height: 900 });
    await page.goto(`/iframe.html?id=fabrials-structure--hit-areas&viewMode=story&globals=theme:${theme}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("main.catalogue")).toHaveScreenshot(`hit-areas-${theme}.png`);
  }
});

// Request 7: the row's name rule costs no specificity, so a consumer's bare class wins, and a trailing count or tag keeps its width.
test("a menu row cuts a long name by default, keeps a trailing count and tag at their width, and lets a bare consumer class wrap the name", async ({ page }) => {
  await open(page, "fabrials-structure--navigation-labels");
  const measure = () =>
    page.evaluate(() => {
      const row = (label: string, href: string) => document.querySelector(`nav[aria-label="${label}"] a[href="${href}"]`)!;
      const info = (label: string, href: string) => {
        const link = row(label, href);
        const name = [...link.children].find((child) => child.tagName === "SPAN")! as HTMLElement;
        const tail = link.lastElementChild as HTMLElement;
        const style = getComputedStyle(name);
        return {
          whiteSpace: style.whiteSpace,
          ellipsis: style.textOverflow,
          cut: name.scrollWidth > name.clientWidth,
          height: name.getBoundingClientRect().height,
          line: parseFloat(style.lineHeight),
          tailWidth: tail === name ? 0 : Math.round(tail.getBoundingClientRect().width * 10) / 10,
        };
      };
      return {
        cutPlain: info("Cut labels", "#long"),
        cutCount: info("Cut labels", "#count"),
        cutTag: info("Cut labels", "#tag"),
        cutSub: info("Cut labels", "#sub-long"),
        wrapPlain: info("Wrapped labels", "#long"),
        wrapCount: info("Wrapped labels", "#count"),
        wrapSub: info("Wrapped labels", "#sub-long"),
      };
    });
  const narrow = await measure();
  for (const key of ["cutPlain", "cutCount", "cutTag", "cutSub"] as const) {
    expect(narrow[key].whiteSpace, key).toBe("nowrap");
    expect(narrow[key].ellipsis, key).toBe("ellipsis");
    expect(narrow[key].cut, key).toBe(true);
  }
  // A bare `.catalogue-wrap-name { white-space: normal }` (no !important, no row in front) wins, and the name takes more than one line.
  for (const key of ["wrapPlain", "wrapCount", "wrapSub"] as const) {
    expect(narrow[key].whiteSpace, key).toBe("normal");
    expect(narrow[key].height, key).toBeGreaterThan(narrow[key].line * 1.5);
  }
  // The count and the tag are exactly as wide as they are with room to spare: a long name never crushes them.
  await page.evaluate(() => document.querySelectorAll("nav").forEach((nav) => ((nav.parentElement as HTMLElement).style.maxWidth = "900px")));
  const wide = await measure();
  expect(narrow.cutCount.tailWidth).toBe(wide.cutCount.tailWidth);
  expect(narrow.cutTag.tailWidth).toBe(wide.cutTag.tailWidth);
  expect(narrow.cutCount.tailWidth).toBeGreaterThan(0);
  expect(narrow.wrapCount.tailWidth).toBe(wide.wrapCount.tailWidth);
});

// Request 10: size="lg" of a toggle group paints the large control height (44 px) on every pointer; sm and default are unchanged.
const toggleHeights = (page: Page) =>
  page.evaluate(() => {
    const items = (label: string) => [...document.querySelectorAll(`[role="group"][aria-label="${label}"] .fui-toggle`)].map((item) => item.getBoundingClientRect());
    const group = (label: string) => document.querySelector(`[role="group"][aria-label="${label}"]`)!.getBoundingClientRect();
    return {
      sm: items("Range, sm")[0].height,
      base: items("Range, default")[0].height,
      lg: items("Range, lg")[0].height,
      groupLg: group("Range, lg").height,
      themeLg: items("Theme, large").map((box) => [box.width, box.height]),
      pointerCoarse: matchMedia("(pointer: coarse)").matches,
    };
  });
test("a large toggle group and theme switcher paint 44 px on a fine pointer, the group's padding around them", async ({ page }) => {
  await open(page, "fabrials-controls--toggles");
  const heights = await toggleHeights(page);
  expect(heights.pointerCoarse).toBe(false);
  expect(heights.lg).toBe(44);
  expect(heights.groupLg).toBe(50);
  expect(heights.sm).toBe(26);
  expect(heights.base).toBe(34);
  expect(heights.themeLg).toEqual([[44, 44], [44, 44], [44, 44]]);
});
test.describe("on a coarse pointer", () => {
  test.use({ hasTouch: true, isMobile: true });
  test("a large toggle group paints the same 44 px", async ({ page }) => {
    await page.goto("/iframe.html?id=fabrials-controls--toggles&viewMode=story&globals=theme:light");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const heights = await toggleHeights(page);
    expect(heights.pointerCoarse).toBe(true);
    expect(heights.lg).toBe(44);
    expect(heights.groupLg).toBe(50);
    expect(heights.themeLg.every(([width, height]) => width === 44 && height === 44)).toBe(true);
  });
});

// Request 11: the rows variant has its fill as the hover cue and does not underline the title; the default accordion still does.
test("an accordion trigger underlines on hover in the default look and not in the rows variant", async ({ page }) => {
  await open(page, "fabrials-commands--tools");
  const line = (locator: ReturnType<Page["locator"]>) => locator.evaluate((element) => getComputedStyle(element).textDecorationLine);
  const rows = page.locator(".fui-accordion[data-variant='rows'] .fui-accordion-trigger").first();
  const plain = page.locator(".fui-accordion:not([data-variant='rows']) .fui-accordion-trigger").last();
  expect(await line(rows)).toBe("none");
  expect(await line(plain)).toBe("none");
  await rows.hover();
  expect(await line(rows)).toBe("none");
  await plain.hover();
  expect(await line(plain)).toBe("underline");
  await rows.focus();
  await page.keyboard.press("Tab");
  expect(await line(rows)).toBe("none");
});
