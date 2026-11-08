// Progress in a real browser: the light moves only without reduced motion and runs the other way in right to left, segments ink
// in order, a large ring keeps its value at its centre, the label wraps before the value moves, and a bar takes no focus.
// Assertions read state and geometry, never pixels.
import { expect, test, type Page } from "@playwright/test";

const open = async (page: Page, id = "tests-feedback--progress-bars") => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=theme:light`);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
};

const computed = (page: Page, name: string, part: string, properties: string[]) =>
  page
    .getByRole("progressbar", { name, exact: true })
    .locator(part)
    .first()
    .evaluate((node, props) => {
      const style = getComputedStyle(node);
      return props.map((property) => style.getPropertyValue(property));
    }, properties);

test("work of unknown length: a still dashed line under reduced motion, a sweep of light without it, the other way in right to left", async ({ page }) => {
  await open(page);
  const [animation, position, image] = await computed(page, "Counting messages", ".fui-progress-indicator", ["animation-name", "position", "background-image"]);
  expect([animation, position]).toEqual(["none", "static"]);
  expect(image).toMatch(/^repeating-linear-gradient/);
  expect(await computed(page, "Ring, unknown", ".fui-progress-ring-light", ["display"])).toEqual(["none"]);

  await page.emulateMedia({ reducedMotion: "no-preference" });
  expect(await computed(page, "Counting messages", ".fui-progress-indicator", ["animation-name", "position"])).toEqual(["fui-progress-sweep", "absolute"]);
  expect(await computed(page, "عدّ الرسائل", ".fui-progress-indicator", ["animation-name"])).toEqual(["fui-progress-sweep-rtl"]);
  expect(await computed(page, "Ring, unknown", ".fui-progress-ring-light", ["display", "animation-name"])).toEqual(["block", "fui-progress-turn"]);
  // A tone that says an outcome paints the band in its own colour.
  const [retrying] = await computed(page, "Retrying", ".fui-progress-indicator", ["background-image"]);
  const [counting] = await computed(page, "Counting messages", ".fui-progress-indicator", ["background-image"]);
  expect(retrying).not.toBe(counting);
});

test("segments ink in order and a value between two steps fills part of one", async ({ page }) => {
  await open(page);
  const segments = page.getByRole("progressbar", { name: "Half a step", exact: true }).locator(".fui-progress-segment");
  await expect(segments).toHaveCount(5);
  const widths = await segments.evaluateAll((nodes) =>
    nodes.map((node) => Math.round((parseFloat(getComputedStyle(node, "::before").width) / node.getBoundingClientRect().width) * 100)),
  );
  expect(widths).toEqual([100, 100, 50, 0, 0]);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const delays = await segments.evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node, "::before").transitionDelay));
  expect(delays).toEqual(["0s", "0.04s", "0.08s", "0.12s", "0.16s"]);
});

test("a step forward inks the next segment, from the keyboard", async ({ page }) => {
  await open(page, "components-progress--overview");
  const wizard = page.getByRole("progressbar", { name: "Step 2 of 4" });
  await expect(wizard).toHaveAttribute("aria-valuenow", "2");
  await page.getByRole("button", { name: "Next" }).focus();
  await page.keyboard.press("Enter");
  const next = page.getByRole("progressbar", { name: "Step 3 of 4" });
  await expect(next).toHaveAttribute("aria-valuenow", "3");
  await expect(next.locator('.fui-progress-segment[data-filled="true"]')).toHaveCount(3);
  await expect(next).toHaveAccessibleDescription("Billing");
});

test("a large ring keeps its value at its centre, and the words beside a ring clear it", async ({ page }) => {
  await open(page);
  const ring = page.getByRole("progressbar", { name: "Large ring", exact: true });
  const circle = (await ring.locator(".fui-progress-ring").boundingBox())!;
  const value = (await ring.locator(".fui-progress-value").boundingBox())!;
  expect(Math.abs(value.x + value.width / 2 - (circle.x + circle.width / 2))).toBeLessThan(1);
  expect(Math.abs(value.y + value.height / 2 - (circle.y + circle.height / 2))).toBeLessThan(1.5);
  expect(circle.width).toBe(48);
  const profile = page.getByRole("progressbar", { name: "Profile", exact: true });
  const disc = (await profile.locator(".fui-progress-ring").boundingBox())!;
  for (const part of [".fui-progress-label", ".fui-progress-hint"]) {
    const box = (await profile.locator(part).boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(disc.x + disc.width);
  }
});

test("in a phone pane the label wraps before the value leaves its row", async ({ page }) => {
  await open(page);
  const bar = page.getByRole("progressbar", { name: /^A label long enough/ });
  const label = (await bar.locator(".fui-progress-label").boundingBox())!;
  const value = (await bar.locator(".fui-progress-value").boundingBox())!;
  expect(label.height).toBeGreaterThan(value.height * 1.5);
  expect(Math.abs(label.y - value.y)).toBeLessThan(2);
  expect(value.x).toBeGreaterThan(label.x + label.width - 1);
});

test("a bar takes no focus: Tab passes over every progressbar", async ({ page }) => {
  await open(page);
  const bars = await page.getByRole("progressbar").count();
  expect(bars).toBeGreaterThan(20);
  for (let step = 0; step < 12; step += 1) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.getAttribute("role"))).not.toBe("progressbar");
  }
  expect(await page.getByRole("progressbar").evaluateAll((nodes) => nodes.filter((node) => node.matches(":focus-visible, [tabindex]")).length)).toBe(0);
});
