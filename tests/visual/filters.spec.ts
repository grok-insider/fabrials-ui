// Filter chips and the multi-select in a real browser (0.11): the clear key, the exit, where focus goes, and the multi-select
// as a listbox the keyboard drives. Engine-agnostic: assertions read state and geometry, never pixels.
import { expect, test, type Page } from "@playwright/test";

const open = async (page: Page, width = 1440) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto("/iframe.html?id=tests-controls--filters&viewMode=story&globals=theme:light");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
};

const chips = (page: Page) => page.getByRole("group", { name: "Active filters" });

test("a filter chip is its name and value with one control, the clear key, which carries the filter in its name", async ({ page }) => {
  await open(page);
  const row = chips(page);
  await expect(row.locator(".fui-filter-chip")).toHaveCount(3);
  await expect(row.getByRole("button", { name: "Clear owner filter (ada@example.org)" })).toBeVisible();
  // The name and value are text, not a control: the row's only buttons are the three keys and Clear all.
  await expect(row.getByRole("button")).toHaveCount(4);
  await expect(page.getByRole("link", { name: "Show every type" })).toHaveAttribute("href", "?type=");
  await expect(page.getByRole("button", { name: "Clear mailbox filter (Archive)" })).toBeDisabled();
  // The long value is cut inside its chip, which never grows past its row.
  const long = row.locator(".fui-filter-chip").nth(2);
  const value = long.locator(".fui-filter-chip-value");
  expect(await value.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
  expect((await long.boundingBox())!.width).toBeLessThanOrEqual((await row.boundingBox())!.width + 0.5);
});

test("clearing a chip from the keyboard hands focus to the next chip, then the previous, and the last one to the host", async ({ page }) => {
  await open(page);
  const row = chips(page);
  await row.getByRole("button", { name: /^Clear owner filter/ }).focus();
  await page.keyboard.press("Enter");
  await expect(row.locator(".fui-filter-chip")).toHaveCount(2);
  await expect(row.getByRole("button", { name: /^Clear type filter/ })).toBeFocused();
  // The last chip in the row: focus goes back to the one before it.
  await row.getByRole("button", { name: /^Clear workspace filter/ }).focus();
  await page.keyboard.press("Space");
  await expect(row.locator(".fui-filter-chip")).toHaveCount(1);
  await expect(row.getByRole("button", { name: /^Clear type filter/ })).toBeFocused();
  await row.getByRole("button", { name: "Clear all" }).click();
  await expect(row.locator(".fui-filter-chip")).toHaveCount(0);
  await row.getByRole("button", { name: "Restore filters" }).click();
  await expect(row.locator(".fui-filter-chip")).toHaveCount(3);
});

test("without reduced motion a cleared chip fades out before its host removes it, and cannot be pressed twice", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page);
  const row = chips(page);
  await page.evaluate(() => {
    const record = { counts: [] as number[], leaving: [] as string[] };
    (window as unknown as { chipRecord: typeof record }).chipRecord = record;
    const group = document.querySelector('[role="group"][aria-label="Active filters"]')!;
    new MutationObserver((changes) => {
      for (const change of changes) {
        if (change.type === "childList") record.counts.push(group.querySelectorAll(".fui-filter-chip").length);
        const node = change.target as HTMLElement;
        if (change.type === "attributes" && node.dataset.leaving !== undefined)
          record.leaving.push(`${node.textContent} ${getComputedStyle(node).pointerEvents}`);
      }
    }).observe(group, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-leaving"] });
  });
  await row.getByRole("button", { name: /^Clear owner filter/ }).click();
  await expect(row.locator(".fui-filter-chip")).toHaveCount(2);
  const record = await page.evaluate(() => (window as unknown as { chipRecord: { counts: number[]; leaving: string[] } }).chipRecord);
  // The owner chip was marked as leaving (and out of reach of the pointer) before it went, and it went once.
  expect(record.leaving).toEqual(["Owner:ada@example.org none"]);
  expect(record.counts).toEqual([2]);
});

test("the multi-select is a listbox: arrows move, Enter ticks and keeps it open, Tab reaches Clear, Escape returns to the trigger", async ({ page }) => {
  await open(page);
  const trigger = page.getByRole("combobox", { name: "Providers, several" });
  await expect(trigger).toHaveText(/Grok\+1 and 1 more/);
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  const list = page.getByRole("listbox", { name: "Providers, several" });
  await expect(list).toBeVisible();
  await expect(list).toHaveAttribute("aria-multiselectable", "true");
  await expect(list.getByRole("option", { name: "Grok" })).toHaveAttribute("aria-selected", "true");
  await expect(list.getByRole("option", { name: "Claude Code" })).toHaveAttribute("aria-selected", "false");
  // The popup is at least as wide as its trigger and starts at its edge.
  const [t, l] = [await trigger.boundingBox(), await list.locator("xpath=..").boundingBox()];
  expect(l!.width).toBeGreaterThanOrEqual(t!.width - 0.5);
  expect(Math.abs(l!.x - t!.x)).toBeLessThan(1);
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(list.getByRole("option", { name: "Cursor" })).toHaveAttribute("aria-selected", "true");
  await expect(list).toBeVisible();
  await expect(trigger).toHaveText(/Grok\+2 and 2 more/);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Clear providers, several" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(list).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole("button", { name: "Clear providers, several" }).click();
  await expect(trigger).toHaveText("Any");
  await expect(trigger).toHaveAttribute("data-placeholder", "");
});

test("a multi-select is as wide as its summary within 10rem and 20rem, and a disabled one does not open", async ({ page }) => {
  await open(page);
  for (const name of ["Providers", "Providers, one", "Providers, several"]) {
    const width = (await page.getByRole("combobox", { name, exact: true }).boundingBox())!.width;
    expect(width).toBeGreaterThanOrEqual(160 - 0.5);
    expect(width).toBeLessThanOrEqual(320 + 0.5);
  }
  const off = page.getByRole("combobox", { name: "Providers, disabled" });
  await expect(off).toBeDisabled();
});

test("segmented plates: a toggle group's plate moves its leading edge first and says which way it went; a segmented tab list has one", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/iframe.html?id=tests-controls--toggles&viewMode=story&globals=theme:light");
  await page.evaluate(() => document.fonts.ready);
  const group = page.getByRole("group", { name: "Range, default" });
  await expect(group).toHaveAttribute("data-indicator", "ready");
  // Nothing has been chosen yet: measuring the same choice again (fonts, layout) gives no direction.
  await expect(group).not.toHaveAttribute("data-direction");
  // Slowed twenty times, so the transitions are still running when they are read.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Animation.enable");
  await cdp.send("Animation.setPlaybackRate", { playbackRate: 0.05 });
  const transitions = () =>
    group.evaluate((node) =>
      node
        .getAnimations({ subtree: true })
        .filter((animation): animation is CSSTransition => "transitionProperty" in animation)
        .map((animation) => `${animation.transitionProperty} ${animation.effect?.getTiming().delay}`)
        .sort(),
    );
  await group.getByRole("button", { name: "30 days" }).click();
  await expect(group).toHaveAttribute("data-direction", "right");
  // Moving right, the right edge leaves at once and the left edge 70 ms later.
  await expect.poll(transitions).toEqual(expect.arrayContaining(["left 70", "right 0"]));
  await group.getByRole("button", { name: "24 h" }).click();
  await expect(group).toHaveAttribute("data-direction", "left");
  await expect.poll(transitions).toEqual(expect.arrayContaining(["left 0", "right 70"]));
  await cdp.send("Animation.setPlaybackRate", { playbackRate: 1 });

  const tabs = page.getByRole("tablist", { name: "Mailbox" });
  await expect(tabs.locator(".fui-tabs-plate")).toHaveCount(1);
  await tabs.getByRole("tab", { name: "Drafts" }).click();
  const drafts = (await tabs.getByRole("tab", { name: "Drafts" }).boundingBox())!;
  await expect.poll(async () => Math.abs((await tabs.locator(".fui-tabs-plate").boundingBox())!.x - drafts.x)).toBeLessThan(1);
  await expect.poll(async () => Math.abs((await tabs.locator(".fui-tabs-plate").boundingBox())!.width - drafts.width)).toBeLessThan(1);
});
