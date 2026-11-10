// What a keyboard user and a screen reader rely on in the pieces that had only a picture and an axe pass:
// HoverCard, NavigationMenu, Collapsible, Tooltip, Pagination and Breadcrumb, NumberTicker, the dropdown and context
// menus, AlertDialog, Sheet, the input and button groups, and the chat pieces of @fabrials/ai-ui.
// Assertions read state, roles and geometry, never pixels. A test marked fixme documents behaviour that is wrong today;
// its description says what the component promises.
import { expect, test, type Page } from "@playwright/test";

const port = process.env.STORYBOOK_PORT ?? "6041";
const story = (id: string, theme = "light") =>
  `/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`;

async function open(page: Page, id: string, options: { width?: number; theme?: string } = {}) {
  await page.setViewportSize({ width: options.width ?? 1280, height: 900 });
  await page.goto(story(id, options.theme));
  await page.waitForFunction(() => (document.querySelector("#storybook-root")?.children.length ?? 0) > 0);
  await page.evaluate(() => document.fonts.ready);
}

/** Tabs until the locator is the focused element, like a person would; fails after `limit` stops. */
async function tabUntil(page: Page, target: ReturnType<Page["locator"]>, limit = 40) {
  for (let step = 0; step < limit; step += 1) {
    if (await target.evaluate((node) => node === document.activeElement).catch(() => false)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(`Tab did not reach ${await target.evaluate((node) => node.textContent?.slice(0, 20))} in ${limit} stops`);
}

const focused = (page: Page) =>
  page.evaluate(() => {
    const node = document.activeElement;
    if (!node) return "none";
    return (node.getAttribute("aria-label") ?? node.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
  });

test.describe("HoverCard", () => {
  const id = "tests-behaviour--hover-card";

  test("opens on keyboard focus as on hover, Escape closes it, it traps nothing and its link is not a dead stop", async ({ page }) => {
    await open(page, id);
    const trigger = page.getByRole("link", { name: "Cascade layers in practice" });
    const card = page.locator(".fui-hover-card");
    await page.keyboard.press("Tab");
    await expect(trigger).toBeFocused();
    await expect(card).toBeVisible();
    // It is a preview, not a dialog: nothing behind it becomes inert and focus stays on the trigger.
    await expect(card).not.toHaveAttribute("role", "dialog");
    await expect(trigger).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(card).toBeHidden();
    await expect(trigger).toBeFocused();
    // Escape is not a trap: the next Tab leaves the trigger, and a fresh focus opens the preview again.
    await page.keyboard.press("Tab");
    expect(await focused(page)).toBe("Next control");
    await expect(card).toBeHidden();
    await page.keyboard.press("Shift+Tab");
    await expect(trigger).toBeFocused();
    await expect(card).toBeVisible();
  });

  test("a pointer over the trigger opens it and moving off closes it", async ({ page }) => {
    await open(page, id);
    const trigger = page.getByRole("link", { name: "Cascade layers in practice" });
    const card = page.locator(".fui-hover-card");
    const box = (await trigger.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
    await expect(card).toBeVisible();
    await page.mouse.move(5, 700, { steps: 6 });
    await expect(card).toBeHidden();
  });

  test.fixme("the preview is announced: the trigger is described by the panel while it is open", async ({ page }) => {
    // Today the trigger carries no aria-describedby and the panel no role: a screen reader is never told a preview exists
    // (Base UI PreviewCard sets tabindex -1 on the panel and no relationship). Expected: aria-describedby on the trigger
    // naming the open panel, as Tooltip should do too.
    await open(page, id);
    const trigger = page.getByRole("link", { name: "Cascade layers in practice" });
    await page.keyboard.press("Tab");
    const describedBy = await trigger.getAttribute("aria-describedby");
    expect(describedBy).not.toBeNull();
    await expect(page.locator(`#${describedBy}`)).toContainText("Cascade layers in practice");
  });
});

test.describe("NavigationMenu", () => {
  const id = "tests-behaviour--navigation-menu";
  const menu = (page: Page) => page.getByRole("navigation", { name: "Main" });
  const triggers = (page: Page) => menu(page).getByRole("button");

  test("Tab reaches the first trigger and Enter, Space or ArrowDown open its panel", async ({ page }) => {
    await open(page, id);
    const [first, second] = [triggers(page).first(), triggers(page).nth(1)];
    await page.keyboard.press("Tab");
    await expect(first).toBeFocused();
    await expect(first).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Enter");
    await expect(first).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("link", { name: "Overview" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(first).toHaveAttribute("aria-expanded", "false");
    await expect(first).toBeFocused();
    await page.keyboard.press("Space");
    await expect(first).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await second.focus();
    await page.keyboard.press("ArrowDown");
    await expect(second).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("link", { name: "API reference" })).toBeVisible();
  });

  test("Tab and the arrows move into the panel's links, Escape returns to the trigger, and arrows walk the triggers", async ({ page }) => {
    await open(page, id);
    const first = triggers(page).first();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(first).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Tab");
    expect(await focused(page)).toBe("Overview");
    await page.keyboard.press("ArrowDown");
    expect(await focused(page)).toBe("Changelog");
    await page.keyboard.press("Escape");
    await expect(first).toBeFocused();
    await expect(first).toHaveAttribute("aria-expanded", "false");
    // Between the triggers, and the plain link is part of the row.
    await page.keyboard.press("ArrowRight");
    expect(await focused(page)).toBe("Resources");
    await page.keyboard.press("ArrowRight");
    expect(await focused(page)).toBe("Docs");
    await page.keyboard.press("ArrowLeft");
    expect(await focused(page)).toBe("Resources");
  });

  test("the current page is marked and the panel sits under its trigger", async ({ page }) => {
    await open(page, id);
    await expect(menu(page).getByRole("link", { name: "Docs" })).toHaveAttribute("aria-current", "page");
    const trigger = triggers(page).first();
    await trigger.click();
    const popup = page.locator(".fui-nav-menu-popup").first();
    await expect(popup).toBeVisible();
    const [t, p] = [(await trigger.boundingBox())!, (await popup.boundingBox())!];
    expect(p.y).toBeGreaterThanOrEqual(t.y + t.height - 1);
    expect(Math.abs(p.x - t.x)).toBeLessThan(2);
  });

  test("a pointer over the neighbour switches the open panel", async ({ page }) => {
    await open(page, id);
    const [first, second] = [triggers(page).first(), triggers(page).nth(1)];
    const popup = page.locator(".fui-nav-menu-popup").first();
    const centre = async (locator: typeof first) => {
      const box = (await locator.boundingBox())!;
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    };
    const start = await centre(first);
    await page.mouse.move(start.x, start.y, { steps: 3 });
    await expect(first).toHaveAttribute("aria-expanded", "true");
    await expect(popup).toContainText("Overview");
    const next = await centre(second);
    await page.mouse.move(next.x, next.y, { steps: 4 });
    await expect(second).toHaveAttribute("aria-expanded", "true");
    await expect(first).toHaveAttribute("aria-expanded", "false");
    await expect(popup).toContainText("API reference");
  });

  test("a right-to-left menu mirrors the arrow that walks the triggers", async ({ page }) => {
    await open(page, id);
    const rtl = page.getByRole("navigation", { name: "القائمة" });
    const items = rtl.getByRole("button");
    await items.first().focus();
    await page.keyboard.press("ArrowLeft");
    await expect(items.nth(1)).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(items.first()).toBeFocused();
  });
});

test.describe("Collapsible", () => {
  const id = "tests-behaviour--collapsible";

  test("the trigger names the panel it controls, Enter and Space toggle, and a closed panel leaves the tab order", async ({ page }) => {
    await open(page, id);
    const trigger = page.getByRole("button", { name: "How sync works" });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    // Closed, the panel is not rendered: its link cannot be reached by Tab.
    await expect(page.getByRole("link", { name: "Read the sync guide" })).toHaveCount(0);
    await page.keyboard.press("Tab");
    await expect(trigger).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    const controls = await trigger.getAttribute("aria-controls");
    expect(controls).not.toBeNull();
    const panel = page.locator(`#${controls}`);
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("link", { name: "Read the sync guide" })).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(panel.getByRole("link", { name: "Read the sync guide" })).toBeFocused();
    // Closed again, the link goes with the panel.
    await trigger.focus();
    await page.keyboard.press("Space");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator(`#${controls}`)).toHaveCount(0);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Delete after 30 days" })).toBeFocused();
  });

  test("a panel that starts open is already expanded and its content is reachable", async ({ page }) => {
    await open(page, id);
    const expanded = page.getByRole("button", { name: "Delete after 30 days" });
    await expect(expanded).toHaveAttribute("aria-expanded", "true");
    const controls = await expanded.getAttribute("aria-controls");
    await expect(page.locator(`#${controls}`)).toContainText("removed after 30 days");
    await expect(expanded).toHaveAttribute("data-panel-open", "");
  });
});

test.describe("Tooltip", () => {
  const id = "tests-behaviour--tooltip";

  test("keyboard focus shows it, it never takes focus, and it leaves the trigger's own name alone", async ({ page }) => {
    await open(page, id);
    const key = page.getByRole("button", { name: "Copy the reference" });
    await page.keyboard.press("Tab");
    await expect(key).toBeFocused();
    const tooltip = page.locator(".fui-tooltip").filter({ hasText: "Copy the reference" });
    await expect(tooltip).toBeVisible();
    // The popup is not a tab stop and focus did not move into it.
    await expect(key).toBeFocused();
    expect(await tooltip.evaluate((node) => node.tabIndex)).toBe(-1);
    expect(await tooltip.evaluate((node) => node.querySelectorAll("a, button, input, [tabindex='0']").length)).toBe(0);
    // A button that already has a name keeps it: the hint describes it and does not rename it.
    const named = page.getByRole("button", { name: "Sync now" });
    await page.keyboard.press("Tab");
    await expect(named).toBeFocused();
    await expect(tooltip).toBeHidden();
    await expect(page.locator(".fui-tooltip").filter({ hasText: "Fetch new headers only" })).toBeVisible();
    await expect(named).toHaveAccessibleName("Sync now");
  });

  test("inside a dialog Escape hides the tooltip and leaves the dialog open", async ({ page }) => {
    await open(page, id);
    await page.getByRole("button", { name: "Rename workspace" }).click();
    const dialog = page.getByRole("dialog", { name: "Rename workspace" });
    await expect(dialog).toBeVisible();
    // Opening by pointer does not count as keyboard focus: come back to the button with the keyboard.
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    const trigger = page.getByRole("button", { name: "Why rename?" });
    await expect(trigger).toBeFocused();
    const tooltip = page.locator(".fui-tooltip").filter({ hasText: "Renaming keeps" });
    await expect(tooltip).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(tooltip).toBeHidden();
    await expect(dialog).toBeVisible();
    await expect(trigger).toBeFocused();
  });

  test.fixme("the tooltip is tied to its trigger: role=tooltip and aria-describedby", async ({ page }) => {
    // Today TooltipContent renders a plain div: no role and no id, and the trigger carries no aria-describedby, so a
    // screen reader never hears the hint. Base UI leaves this to the host; the component owns it.
    await open(page, id);
    const key = page.getByRole("button", { name: "Copy the reference" });
    await page.keyboard.press("Tab");
    const describedBy = await key.getAttribute("aria-describedby");
    expect(describedBy).not.toBeNull();
    const tooltip = page.locator(`#${describedBy}`);
    await expect(tooltip).toHaveAttribute("role", "tooltip");
    await expect(tooltip).toHaveText("Copy the reference");
  });
});

test.describe("Pagination and Breadcrumb", () => {
  const id = "tests-behaviour--navigation";

  test("both are named landmarks and the current item is marked", async ({ page }) => {
    await open(page, id);
    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    const pagination = page.getByRole("navigation", { name: "Pagination" });
    await expect(breadcrumb).toHaveCount(1);
    await expect(pagination).toHaveCount(1);
    await expect(breadcrumb.getByText("Invoices, 2025")).toHaveAttribute("aria-current", "page");
    await expect(pagination.getByRole("link", { name: "1", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(pagination.getByRole("link", { name: "2", exact: true })).not.toHaveAttribute("aria-current", "page");
    // The ellipsis carries a name for a screen reader.
    await expect(breadcrumb.locator(".fui-breadcrumb-ellipsis")).toHaveText("More pages");
    await expect(pagination.locator(".fui-pagination-ellipsis")).toHaveText("More pages");
  });

  test("a step with no page is not a dead link in the tab order, and the trail is walked in order", async ({ page }) => {
    await open(page, id);
    const previous = page.locator(".fui-pagination-step").first();
    await expect(previous).toHaveAttribute("aria-disabled", "true");
    await expect(previous).not.toHaveAttribute("href", /.*/);
    const order: string[] = [];
    for (let index = 0; index < 7; index += 1) {
      await page.keyboard.press("Tab");
      order.push(await focused(page));
    }
    expect(order).toEqual(["Mailboxes", "Archive", "1", "2", "3", "12", "Next"]);
  });
});

test.describe("NumberTicker", () => {
  const id = "tests-behaviour--number-ticker";
  const readable = (page: Page, index: number) =>
    page.locator(".fui-ticker").nth(index).locator(".fui-sr-only").textContent();

  test("the text a screen reader gets is the final value, never the rolling digits", async ({ page }) => {
    await open(page, id);
    await expect(page.locator(".fui-ticker")).toHaveCount(4);
    expect(await readable(page, 0)).toBe("128");
    expect(await readable(page, 1)).toBe("48,210");
    expect(await readable(page, 2)).toBe("$00042.00");
    expect(await readable(page, 3)).toBe("1200");
    // The visible row is decoration: every glyph column is hidden from assistive technology.
    await expect(page.locator(".fui-ticker-row").first()).toHaveAttribute("aria-hidden", "true");
  });

  test("under reduced motion nothing rolls: the digits are already their value", async ({ page }) => {
    await open(page, id);
    await expect(page.locator(".fui-ticker-column")).toHaveCount(0);
    const digits = await page.locator(".fui-ticker").first().locator(".fui-ticker-digit").allTextContents();
    expect(digits).toEqual(["1", "2", "8"]);
  });

  test("a new value is announced at once, and without reduced motion the roll settles on it", async ({ page, browser }) => {
    await open(page, id);
    const ticker = page.locator(".fui-ticker").nth(3);
    await page.getByRole("button", { name: "Add a thousand" }).click();
    await expect(ticker.locator(".fui-sr-only")).toHaveText("2200");
    expect(await ticker.locator(".fui-ticker-digit").allTextContents()).toEqual(["2", "2", "0", "0"]);

    const context = await browser.newContext({ reducedMotion: "no-preference" });
    const moving = await context.newPage();
    await moving.goto(`http://127.0.0.1:${port}${story(id)}`);
    await expect(moving.locator("#storybook-root h1").first()).toBeVisible();
    await moving.evaluate(() => document.fonts.ready);
    const rolled = (index: number) =>
      moving.locator(".fui-ticker").nth(index).locator(".fui-ticker-column").evaluateAll((columns) =>
        columns.map((column) => {
          const style = getComputedStyle(column);
          const transform = style.transform;
          const matrix = transform.match(/^matrix\(([^)]+)\)$/);
          const translate = transform.match(/translateY?\((-?[\d.]+)(px|em)?\)/);
          const dy = transform === "none" ? 0 : matrix ? Number(matrix[1].split(",")[5]) : translate ? Number(translate[1]) * (translate[2] === "em" ? parseFloat(style.fontSize) : 1) : Number.NaN;
          return Math.round(-dy / (1.1 * parseFloat(style.fontSize)));
        }),
      );
    await expect.poll(() => rolled(0)).toEqual([1, 2, 8]);
    expect(await moving.locator(".fui-ticker").first().locator(".fui-ticker-column").count()).toBe(3);
    expect(await moving.locator(".fui-ticker").first().locator(".fui-sr-only").textContent()).toBe("128");
    await context.close();
  });
});

test.describe("DropdownMenu and ContextMenu", () => {
  const id = "tests-behaviour--menus";

  test("a checkbox item is a menuitemcheckbox that Space toggles without closing", async ({ page }) => {
    await open(page, id);
    await page.getByRole("button", { name: "View" }).click();
    const menu = page.getByRole("menu", { name: "View" });
    await expect(menu).toBeVisible();
    const sidebar = page.getByRole("menuitemcheckbox", { name: "Sidebar" });
    await expect(sidebar).toHaveAttribute("aria-checked", "true");
    await sidebar.focus();
    await page.keyboard.press("Space");
    await expect(sidebar).toHaveAttribute("aria-checked", "false");
    await expect(menu).toBeVisible();
    // Enter toggles too: a checkbox row in this menu does not close it.
    await page.keyboard.press("Enter");
    await expect(sidebar).toHaveAttribute("aria-checked", "true");
    await expect(menu).toBeVisible();
  });

  test("a radio item is a menuitemradio and choosing one leaves its group marked", async ({ page }) => {
    await open(page, id);
    await page.getByRole("button", { name: "View" }).click();
    const compact = page.getByRole("menuitemradio", { name: "Compact" });
    const comfortable = page.getByRole("menuitemradio", { name: "Comfortable" });
    await expect(compact).toHaveAttribute("aria-checked", "true");
    await expect(comfortable).toHaveAttribute("aria-checked", "false");
    await comfortable.focus();
    await page.keyboard.press("Space");
    await expect(comfortable).toHaveAttribute("aria-checked", "true");
    await expect(compact).toHaveAttribute("aria-checked", "false");
    await expect(page.getByRole("menu", { name: "View" })).toBeVisible();
  });

  test("ArrowRight opens a submenu on the first row, ArrowLeft closes it back to its row, and typing jumps", async ({ page }) => {
    await open(page, id);
    await page.getByRole("button", { name: "View" }).click();
    const share = page.getByRole("menuitem", { name: "Share" });
    await share.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("menu", { name: "Share" })).toBeVisible();
    expect(await focused(page)).toBe("Copy link⌘C");
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("menu", { name: "Share" })).toBeHidden();
    await expect(share).toBeFocused();
    await page.keyboard.type("dup");
    await expect(page.getByRole("menuitem", { name: "Duplicate" })).toBeFocused();
    // A new menu, so the second search starts from its first letter rather than continuing the last one.
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "View" }).click();
    await page.getByRole("menu", { name: "View" }).press("ArrowDown");
    await page.keyboard.type("archi");
    await expect(page.getByRole("menuitem", { name: "Archive" })).toBeFocused();
  });

  test("the context menu opens with Shift+F10, with the Menu key, and at the pointer", async ({ page }) => {
    await open(page, id);
    const area = page.getByText("Invoice 2025-0412");
    await area.focus();
    await page.keyboard.press("Shift+F10");
    const menu = page.locator("[role=menu]");
    await expect(menu).toBeVisible();
    await expect(page.getByRole("menuitemcheckbox", { name: "Mark as read" })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("menuitemradio", { name: "Euros" })).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await area.focus();
    await page.keyboard.press("ContextMenu");
    await expect(menu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    const box = (await area.boundingBox())!;
    await page.mouse.click(box.x + 24, box.y + 12, { button: "right" });
    await expect(menu).toBeVisible();
    const [m, point] = [(await menu.boundingBox())!, { x: box.x + 24, y: box.y + 12 }];
    expect(Math.abs(m.x - point.x)).toBeLessThan(20);
    expect(Math.abs(m.y - point.y)).toBeLessThan(20);
  });

  test.fixme("in a right-to-left page the submenu opens at the inline end, on the left", async ({ page }) => {
    // The submenu's positioner is pinned to the physical "right" (menu.tsx:34 and context-menu.tsx:96), so in a
    // right-to-left page it opens over the parent menu instead of at the inline end. Keys are mirrored already.
    await open(page, "tests-behaviour--menus-rtl");
    await page.getByRole("button", { name: "View" }).click();
    const share = page.getByRole("menuitem", { name: "Share" });
    await share.focus();
    await page.keyboard.press("ArrowLeft");
    const submenu = page.getByRole("menu", { name: "Share" });
    await expect(submenu).toBeVisible();
    const [t, s] = [(await share.boundingBox())!, (await submenu.boundingBox())!];
    expect(s.x + s.width).toBeLessThanOrEqual(t.x + 1);
  });
});

test.describe("AlertDialog", () => {
  const id = "tests-behaviour--alert-dialog";

  test("it is an alertdialog opened on the safe action, and Escape or Cancel leave without confirming", async ({ page }) => {
    await open(page, id);
    const trigger = page.getByRole("button", { name: "Delete workspace" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("alertdialog", { name: "Delete “Harbour”?" });
    await expect(dialog).toBeVisible();
    // Focus lands on the least destructive action, so a stray Enter keeps the workspace.
    await expect(page.getByRole("button", { name: "Keep it" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(dialog).toBeVisible();
    await page.getByRole("button", { name: "Keep it" }).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test.fixme("the destructive action confirms and closes the alert dialog", async ({ page }) => {
    // AlertDialogAction is a plain Button (dialog.tsx:425), not a close part as in shadcn: pressing Delete leaves the
    // dialog open with nothing happening. Expected: it closes the dialog after its onClick, as AlertDialogCancel does.
    await open(page, id);
    await page.getByRole("button", { name: "Delete workspace" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(dialog).toBeHidden();
  });
});

test.describe("Sheet", () => {
  const id = "tests-behaviour--sheet";

  test("it is a dialog with a header, a body and a footer, and its close key and Escape leave from the trigger", async ({ page }) => {
    await open(page, id);
    const trigger = page.getByRole("button", { name: "Open filters" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    const sheet = page.getByRole("dialog", { name: "Filters" });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("heading", { name: "Filters" })).toBeVisible();
    await expect(sheet).toContainText("Draft");
    await expect(sheet.getByRole("button", { name: "Apply" })).toBeVisible();
    expect(await sheet.evaluate((node) => node.getAttribute("data-side"))).toBe("right");
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(sheet).toBeVisible();
    await sheet.getByRole("button", { name: "Cancel" }).click();
    await expect(sheet).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});

test.describe("InputGroup and ButtonGroup", () => {
  const id = "tests-behaviour--input-groups";

  test("an input group is one group whose ring is drawn once, around the field", async ({ page }) => {
    await open(page, id);
    const group = page.getByRole("group", { name: "Workspace address" });
    await expect(group).toBeVisible();
    const field = group.getByRole("textbox", { name: "Workspace address" });
    await expect(field).toHaveCount(1);
    // At rest the frame is a hairline; the ring only appears around the frame when the field has focus.
    const resting = await group.evaluate((node) => getComputedStyle(node).boxShadow);
    expect(resting).not.toContain("0px 0px 0px 4px");
    await field.focus();
    await page.keyboard.press("Shift");
    await expect.poll(() => group.evaluate((node) => getComputedStyle(node).boxShadow)).toContain("0px 0px 0px 4px");
    // The field itself has no second ring.
    expect(await field.evaluate((node) => getComputedStyle(node).boxShadow)).toBe("none");
    expect(await field.evaluate((node) => getComputedStyle(node).outlineStyle)).toBe("none");
    // The addon is part of the field: pressing it puts the caret back in the field.
    await page.getByRole("group", { name: "Workspace address" }).locator(".fui-input-group-addon").first().click();
    await expect(field).toBeFocused();
    // The key inside the group has a name of its own.
    await expect(group.getByRole("button", { name: "Copy the address" })).toBeVisible();
  });

  test("a textarea group keeps the block addon outside the field's ring, and the button group rings each key", async ({ page }) => {
    await open(page, id);
    const note = page.getByRole("group", { name: "Note to the team" });
    const textarea = note.getByRole("textbox", { name: "Note to the team" });
    await textarea.focus();
    await page.keyboard.press("Shift");
    await expect.poll(() => note.evaluate((node) => getComputedStyle(node).boxShadow)).toContain("0px 0px 0px 4px");
    expect(await textarea.evaluate((node) => getComputedStyle(node).boxShadow)).toBe("none");
    await expect(note.getByRole("button", { name: "Send" })).toBeVisible();

    const range = page.getByRole("group", { name: "Range" });
    await expect(range).toBeVisible();
    const keys = range.getByRole("button");
    expect(await keys.allTextContents()).toEqual(["Day", "Week", "Month"]);
    await keys.nth(1).focus();
    await page.keyboard.press("Shift");
    // Every key keeps a ring of its own, lifted over its neighbours so the join does not clip it.
    const ring = await keys.nth(1).evaluate((node) => {
      const style = getComputedStyle(node);
      return { outline: style.outlineStyle, z: style.zIndex };
    });
    expect(ring.outline).toBe("solid");
    expect(ring.z).toBe("1");
    expect(await range.locator(".fui-button-group-text").textContent()).toContain("Updated 2 min ago");
  });
});

test.describe("Select parts", () => {
  test.fixme("a long list scrolls inside its popup, between the two scroll keys", async ({ page }) => {
    // SelectContent puts its children (including SelectScrollUpButton and SelectScrollDownButton) inside Select.List
    // (select.tsx:63-73) instead of around it, and nothing bounds the list's height, so a long list is clipped by the
    // popup and the keys never render: the rows past the popup cannot be reached at all.
    await open(page, "tests-parts--select-parts");
    const list = page.getByRole("listbox");
    await expect(list).toBeVisible();
    expect(await list.evaluate((node) => node.scrollHeight > node.clientHeight + 1)).toBe(true);
    await expect(page.locator(".fui-menu [data-slot=select-scroll-up], .fui-menu [data-slot=select-scroll-down]")).toHaveCount(2);
  });
});

test.describe("Chat pieces", () => {
  test("the composer sends on Enter, breaks on Shift+Enter, and swaps Send for Stop while it works", async ({ page }) => {
    await open(page, "tests-ai-chat--composer");
    const composer = page.locator(".fui-composer").first();
    const field = composer.getByRole("textbox", { name: "Message the assistant" });
    const send = composer.getByRole("button", { name: "Send message" });
    await expect(send).toBeDisabled();
    await field.fill("Hello there");
    await expect(send).toBeEnabled();
    await field.press("Shift+Enter");
    expect(await field.inputValue()).toBe("Hello there\n");
    await field.press("Enter");
    await expect(composer.locator("textarea")).toHaveValue("");
    await expect(composer).toHaveAttribute("data-status", "streaming");
    await expect(composer.getByRole("button", { name: "Stop" })).toBeVisible();
    await expect(composer.getByRole("button", { name: /Send message|Queue message/ })).toHaveCount(0);
    await expect(page.locator(".fb-muted").first()).toHaveText("Sent: Hello there");
  });

  test("Enter during an input method composition sends nothing, a pasted file becomes an attachment, and Backspace takes the last one away", async ({ page }) => {
    await open(page, "tests-behaviour--composer-extras");
    const composer = page.locator(".fui-composer").first();
    const field = composer.getByRole("textbox", { name: "Message the assistant" });
    await field.fill("abc");
    await field.evaluate((node) => {
      node.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
      node.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true, isComposing: true }));
      node.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true }));
    });
    await expect(page.getByTestId("sent")).toHaveText("Nothing sent");
    expect(await field.inputValue()).toBe("abc");
    await field.evaluate((node) => {
      const data = new DataTransfer();
      data.items.add(new File(["synthetic"], "notes.txt", { type: "text/plain" }));
      node.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: data }));
    });
    await expect(page.locator("#storybook-root")).toContainText("Attached: notes.txt");

    // Backspace in an empty field takes the last attachment of the bench's composer.
    await open(page, "tests-ai-chat--composer");
    const ready = page.locator(".fui-composer").first();
    const empty = ready.getByRole("textbox", { name: "Message the assistant" });
    await expect(ready.locator(".fui-attachment")).toHaveCount(2);
    await empty.focus();
    await page.keyboard.press("Backspace");
    await expect(ready.locator(".fui-attachment")).toHaveCount(1);
    await expect(ready).not.toContainText("quarterly-report");
  });

  test("message actions are tab stops with names, and Enter on Copy copies the message", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await open(page, "tests-ai-chat--messages");
    const actions = page.locator(".fui-message-actions").first();
    // By position: the copy action renames itself after copying, so a name-based locator would move to the next message.
    const copy = actions.locator("button").first();
    await expect(copy).toHaveAccessibleName("Copy");
    await tabUntil(page, copy);
    await expect(copy).toBeFocused();
    await page.keyboard.press("Enter");
    // Read as one state: the copied flag lives for two seconds only.
    await expect
      .poll(async () => ({ copied: await copy.getAttribute("data-copied"), name: await copy.getAttribute("aria-label") }))
      .toEqual({ copied: "true", name: "Copied" });
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("How should hosts import the shared styles?");
    await expect(actions.getByRole("button", { name: "Edit" })).toBeVisible();
  });

  test.fixme("copying is announced, not only renamed: a live region says so", async ({ page }) => {
    // Today CopyMessageAction only renames the focused button ("Copy" becomes "Copied"), which a screen reader does not
    // reliably announce; CopyButton in @fabrials/ui has an aria-live span for exactly this. Expected: a polite live
    // region that says "Copied" while the button keeps its name.
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await open(page, "tests-ai-chat--messages");
    const actions = page.locator(".fui-message-actions").first();
    await actions.locator("button").first().focus();
    await page.keyboard.press("Enter");
    const announcement = page.locator("[aria-live=polite]").filter({ hasText: "Copied" });
    await expect(announcement).toHaveCount(1);
  });

  test("the voice key says what it does in each state and marks the recording one", async ({ page }) => {
    await open(page, "tests-ai-chat--voice-input");
    const buttons = page.locator(".fui-voice-button");
    await expect(buttons).toHaveCount(7);
    const states = await buttons.evaluateAll((nodes) =>
      nodes.map((node) => ({
        label: node.getAttribute("aria-label"),
        pressed: node.getAttribute("aria-pressed"),
        busy: node.getAttribute("aria-busy"),
        status: node.getAttribute("data-status"),
      })),
    );
    expect(states.map((state) => `${state.status}:${state.label}`)).toEqual([
      "idle:Dictate",
      "requesting:Waiting for microphone",
      "recording:Stop recording",
      "transcribing:Transcribing",
      "error:Dictate",
      "idle:Dictate",
      "idle:Dictate",
    ]);
    expect(states.filter((state) => state.pressed === "true")).toHaveLength(1);
    expect(states.filter((state) => state.busy === "true")).toHaveLength(2);
    // The blocked microphone is announced in a live region, not only drawn.
    await expect(page.getByRole("status").filter({ hasText: "Microphone access is blocked." })).toHaveCount(1);
  });

  test("a citation chip opens its preview on focus and keeps its link", async ({ page }) => {
    await open(page, "tests-ai-chat--citations-and-sources");
    const chip = page.getByRole("link", { name: /^Source 1:/ }).first();
    await expect(chip).toHaveAttribute("href", "https://docs.example.org/guides/cascade-layers");
    await expect(chip).toHaveAttribute("target", "_blank");
    await chip.focus();
    await page.keyboard.press("Shift");
    const card = page.locator(".fui-citation-card").first();
    await expect(card).toBeVisible();
    await expect(card).toContainText("Cascade layers in practice");
    await expect(card.getByRole("link")).toHaveAttribute("href", "https://docs.example.org/guides/cascade-layers");
    await page.keyboard.press("Escape");
    await expect(card).toBeHidden();
    // Enter on the focused chip follows the link: the preview did not swallow the press.
    const [opened] = await Promise.all([page.waitForEvent("popup"), page.keyboard.press("Enter")]);
    await opened.close();
  });

  test("a reasoning or search block toggles from the keyboard and says whether it is open", async ({ page }) => {
    await open(page, "tests-ai-chat--activity");
    const reasoning = page.locator(".fui-activity").filter({ hasText: "Thought for 4s" }).first();
    const trigger = reasoning.locator(".fui-activity-trigger");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    const panel = page.locator(`#${await trigger.getAttribute("aria-controls")}`);
    await expect(panel).toContainText("The host imports tokens first");
    await page.keyboard.press("Space");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    const searching = page.locator(".fui-activity").filter({ hasText: "Searching the web" }).first();
    const searchingTrigger = searching.locator(".fui-activity-trigger");
    await searchingTrigger.focus();
    await page.keyboard.press("Enter");
    await expect(searchingTrigger).toHaveAttribute("aria-expanded", "true");
  });
});
