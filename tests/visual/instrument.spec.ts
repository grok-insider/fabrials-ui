import { expect, test } from "@playwright/test";

test("corner marks and grid guides never take focus: Tab goes from control to control across the plates", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/iframe.html?id=fabrials-instrument--landing-page&viewMode=story&globals=theme:light");
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  expect(await page.locator(".fui-corner-mark").count()).toBeGreaterThan(0);
  expect(await page.locator(".fui-grid-guides").getAttribute("aria-hidden")).toBe("true");
  for (let step = 0; step < 24; step += 1) {
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => {
      const element = document.activeElement;
      return element ? `${element.tagName}.${element.className}` : "";
    });
    expect(focused).not.toMatch(/fui-corner-mark|fui-grid-guides/);
  }
});

test("a ruler meter is a meter with its value and name, and draws its mark at the value", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/iframe.html?id=fabrials-instrument--pieces-page&viewMode=story&globals=theme:light");
  const meter = page.getByRole("meter", { name: "Disk" });
  await expect(meter).toHaveAttribute("aria-valuenow", "82");
  const ticks = meter.locator(".fui-meter-tick-on");
  expect(await ticks.count()).toBe(34);
  const quota = page.getByRole("meter", { name: "Quota", exact: true });
  await expect(quota).toHaveAttribute("data-tone", "neutral");
  await expect(page.getByRole("meter", { name: "Monthly budget" })).toHaveAttribute("data-tone", "danger");
});

test("the chart legend still toggles a dithered series from the keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/iframe.html?id=fabrials-instrument--pieces-page&viewMode=story&globals=theme:dark");
  const hide = page.getByRole("button", { name: "Hide Personal" });
  await hide.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Show Personal" })).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".fui-chart-legend svg.fui-chart-swatch rect").first()).toHaveAttribute("fill", /^url\(#fui-dither-/);
});

const pieces = "/iframe.html?id=fabrials-instrument--pieces-page&viewMode=story&globals=theme:dark";

test("a single-choice toggle group slides one indicator to the pressed item, from the keyboard too", async ({ page }) => {
  await page.goto(pieces);
  const group = page.getByRole("group", { name: "Range" });
  await expect(group).toHaveAttribute("data-indicator", "ready");
  const x = () => group.evaluate((element) => (element as HTMLElement).style.getPropertyValue("--fui-toggle-x"));
  const seven = await page.getByRole("button", { name: "7 days" }).evaluate((element) => `${(element as HTMLElement).offsetLeft}px`);
  expect(await x()).toBe(seven);
  await page.getByRole("button", { name: "7 days" }).focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  const thirty = await page.getByRole("button", { name: "30 days" }).evaluate((element) => `${(element as HTMLElement).offsetLeft}px`);
  await expect.poll(x).toBe(thirty);
  expect(await page.locator(".fui-toggle-group[data-indicator] > .fui-toggle[data-pressed]").count()).toBe(1);
});

test("a readout settles on its new value and assistive technology only ever reads the final text", async ({ page }) => {
  await page.goto(pieces);
  const readout = page.locator(".fui-readout").first();
  await expect(readout.locator(".fui-sr-only")).toHaveText("14:32 UTC");
  await page.getByRole("button", { name: "Sync now" }).click();
  await expect(readout.locator(".fui-sr-only")).toHaveText("14:47 UTC");
  await expect(readout.locator('[aria-hidden="true"]')).toHaveText("14:47 UTC");
});

test("under reduced motion a readout changes at once and the busy mark holds still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(pieces);
  // Every text the visible readout shows on its way, recorded: under reduced motion there is none between the two values
  // (reading the text right after the click raced React's render and failed under load).
  await page.locator('.fui-readout [aria-hidden="true"]').first().evaluate((node) => {
    const seen: string[] = [node.textContent ?? ""];
    (window as unknown as { readoutTexts: string[] }).readoutTexts = seen;
    new MutationObserver(() => seen.push(node.textContent ?? "")).observe(node, { childList: true, characterData: true, subtree: true });
  });
  await page.getByRole("button", { name: "Sync now" }).click();
  await expect(page.locator('.fui-readout [aria-hidden="true"]').first()).toHaveText("14:47 UTC");
  const texts = await page.evaluate(() => (window as unknown as { readoutTexts: string[] }).readoutTexts);
  expect([...new Set(texts)]).toEqual(["14:32 UTC", "14:47 UTC"]);
  const spinner = page.locator('.fui-spinner[aria-label="Reading INBOX"]');
  expect(await spinner.locator("rect").first().evaluate((rect) => getComputedStyle(rect).animationName)).toBe("none");
  expect(await page.locator(".fui-toggle-group[data-indicator]").evaluate((group) => getComputedStyle(group, "::before").transitionDuration)).toMatch(/^0s/);
});

test("the busy mark is one status with a name, eight cells and a stepped animation", async ({ page }) => {
  // The suite runs under reduced motion; the animation exists only without it.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(pieces);
  const spinner = page.locator('.fui-spinner[role="status"][aria-label="Reading INBOX"]');
  await expect(spinner).toBeVisible();
  expect(await spinner.locator("rect").count()).toBe(8);
  expect(await spinner.locator("rect").nth(3).evaluate((rect) => getComputedStyle(rect).animationName)).toBe("fui-pixel");
  await expect(page.getByRole("button", { name: "Saving" })).toHaveAttribute("aria-busy", "true");
});

test("data-theme=system follows the operating system with no class: tokens and the dither canvas", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/iframe.html?id=fabrials-instrument--landing-page&viewMode=story&globals=theme:light");
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.dataset.theme = "system";
  });
  const background = () => page.evaluate(() => getComputedStyle(document.body).getPropertyValue("--background").trim());
  expect(await background()).toBe("oklch(0.139 0.006 262)");
  await page.emulateMedia({ colorScheme: "light" });
  expect(await background()).toBe("oklch(0.975 0.004 250)");
});

test("a non-modal sheet says so on its popup, and a modal one does not", async ({ page }) => {
  await page.goto("/iframe.html?id=fabrials-overlays--non-modal-sheet&viewMode=story&globals=theme:light");
  await expect(page.getByRole("dialog", { name: "Tools" })).toHaveAttribute("data-modal", "false");
  await page.goto("/iframe.html?id=fabrials-overlays--modal-sheet&viewMode=story&globals=theme:light");
  await expect(page.locator('.fui-dialog[data-modal="false"]')).toHaveCount(0);
});

test("a toggle group is as wide as its items in a grid column, and a stretched card keeps its footer on its bottom edge", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/iframe.html?id=fabrials-components--gallery&viewMode=story&globals=theme:dark");
  for (const name of ["Range", "Theme with labels"]) {
    const group = page.getByRole("group", { name, exact: true });
    const widths = await group.evaluate((element) => {
      const items = [...element.children].filter((child) => child.classList.contains("fui-toggle"));
      const last = items.at(-1)!.getBoundingClientRect();
      return { group: element.getBoundingClientRect().right, last: last.right, parent: element.parentElement!.getBoundingClientRect().right };
    });
    expect(widths.group - widths.last).toBeLessThan(8);
    expect(widths.group).toBeLessThan(widths.parent - 40);
  }
  const edges = await page.locator(".fui-card-footer", { hasText: "Save routing" }).evaluate((footer) => ({
    footer: footer.getBoundingClientRect().bottom,
    card: footer.closest(".fui-card")!.getBoundingClientRect().bottom,
    background: getComputedStyle(footer).backgroundColor,
  }));
  expect(Math.abs(edges.card - edges.footer)).toBeLessThan(2);
  expect(edges.background).toBe("rgba(0, 0, 0, 0)");
});
