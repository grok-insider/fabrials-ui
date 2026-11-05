// The players in a real browser: the keys people know, one video at a time, failures said, animations that hold still.
import { expect, test, type Locator, type Page } from "@playwright/test";

const open = async (page: Page, id: string) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=theme:light`);
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
};
const media = (player: Locator) => player.locator("video, audio").first();
const prop = (player: Locator, name: "paused" | "currentTime" | "muted" | "playbackRate" | "duration") =>
  media(player).evaluate((element, key) => (element as unknown as Record<string, number | boolean>)[key]!, name);

test("video: K plays and pauses, the arrows seek, M mutes, C shows captions, the speed menu sets the rate", async ({ page }) => {
  await open(page, "fabrials-players--video");
  const player = page.getByRole("group", { name: "The harbour at dusk" });
  await expect.poll(() => prop(player, "duration")).toBeGreaterThan(5);
  await player.focus();
  await page.keyboard.press("k");
  await expect(player).toHaveAttribute("data-playing", "");
  await page.keyboard.press("k");
  await expect(player).not.toHaveAttribute("data-playing", "");
  const before = (await prop(player, "currentTime")) as number;
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => prop(player, "currentTime")).toBeGreaterThan(before + 4);
  await page.keyboard.press("m");
  expect(await prop(player, "muted")).toBe(true);
  await expect(player.getByRole("button", { name: "Unmute" })).toBeVisible();
  await page.keyboard.press("c");
  await expect(player.getByRole("button", { name: "Captions" })).toHaveAttribute("aria-pressed", "true");
  await player.getByRole("button", { name: /^Speed/ }).click();
  await page.getByRole("menuitemradio", { name: "1.5×" }).click();
  expect(await prop(player, "playbackRate")).toBe(1.5);
  await expect(player.getByRole("button", { name: "Speed: 1.5×" })).toBeVisible();
  await expect(player.getByRole("slider", { name: "Seek" })).toHaveAttribute("aria-valuetext", /seconds? \/ 6 seconds/);
});

test("one video plays at a time; a file that fails says why", async ({ page }) => {
  await open(page, "fabrials-players--video");
  const first = page.getByRole("group", { name: "The harbour at dusk" });
  const second = page.getByRole("group", { name: "The harbour, small" });
  await first.getByRole("button", { name: "Play" }).first().click();
  await expect(first).toHaveAttribute("data-playing", "");
  await second.getByRole("button", { name: "Play" }).first().click();
  await expect(second).toHaveAttribute("data-playing", "");
  await expect(first).not.toHaveAttribute("data-playing", "");
  const broken = page.getByRole("group", { name: "A missing video" });
  await expect(broken.getByRole("alert")).toContainText("cannot be played");
  await expect(broken.getByRole("link", { name: "Open the file" })).toBeVisible();
});

test("a video in the viewer takes the keys while it has focus; Escape still closes the viewer", async ({ page }) => {
  await open(page, "fabrials-players--video");
  await page.getByRole("button", { name: /Footage of the harbour at dusk/ }).click();
  const viewer = page.getByRole("dialog", { name: "Harbour, 2 of 3" });
  await expect(viewer).toBeVisible();
  const player = viewer.locator('[aria-roledescription="video player"]');
  await expect(player).toBeFocused();
  await expect.poll(() => prop(player, "duration")).toBeGreaterThan(5);
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("dialog", { name: "Harbour, 2 of 3" })).toBeVisible();
  await expect.poll(() => prop(player, "currentTime")).toBeGreaterThan(4);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("audio: Space plays from the frame, the seek bar speaks the time", async ({ page }) => {
  await open(page, "fabrials-players--sound-and-animation");
  const player = page.getByRole("group", { name: "Three-note chime" });
  await expect.poll(() => prop(player, "duration")).toBeGreaterThan(4);
  await player.focus();
  await page.keyboard.press(" ");
  await expect(player).toHaveAttribute("data-playing", "");
  await page.keyboard.press(" ");
  await expect(player).not.toHaveAttribute("data-playing", "");
  await expect(player.getByRole("slider", { name: "Seek" })).toHaveAttribute("aria-valuetext", /\/ 5 seconds/);
  await expect(page.getByRole("group", { name: "A missing recording" }).getByRole("alert")).toContainText("recording");
});

test("animations hold still under reduced motion, and play when asked", async ({ page }) => {
  await open(page, "fabrials-players--sound-and-animation");
  const loop = page.locator(".fui-animated-image").first();
  await expect(loop.getByRole("button", { name: "Play animation" })).toBeVisible();
  expect(await loop.locator("video").evaluate((element) => (element as HTMLVideoElement).paused)).toBe(true);
  await loop.getByRole("button", { name: "Play animation" }).click();
  await expect(loop.getByRole("button", { name: "Pause animation" })).toBeVisible();
  await expect.poll(() => loop.locator("video").evaluate((element) => (element as HTMLVideoElement).paused)).toBe(false);
  const gif = page.locator(".fui-animated-image").nth(1);
  await expect(gif.getByRole("img", { name: "Green copper light rippling" })).toBeVisible();
  await expect(gif.locator("canvas")).not.toHaveAttribute("data-hidden", "");
  await expect(gif.locator("img.fui-animated-image-media")).toHaveAttribute("data-hidden", "");
  await gif.getByRole("button", { name: "Play animation" }).click();
  await expect(gif.locator("img.fui-animated-image-media")).not.toHaveAttribute("data-hidden", "");
  await expect(gif.getByRole("img", { name: "Green copper light rippling" })).toBeVisible();
});
