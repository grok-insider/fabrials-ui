import { expect, test, type Page } from "@playwright/test";
import { installProbe, type Box } from "./probe";
import { readSlugs } from "./slugs";

export const slugs = readSlugs();

export type Theme = "light" | "dark";

/*
 * Paint thresholds. Measured bars sit within 0.005 (OKLab ΔE) of the bone
 * colour in all three engines, 0.02 inside a .dark island of a light page
 * (the luminosity blend takes the hue of the light surface behind it); the
 * closest surface a missing bar would reveal is 0.039 away. A bar must run
 * 0.6 em through the sampled point (it is 0.8 em; edges antialias). Chroma
 * above 0.03 is colour: the slate neutrals stay at or under 0.021 (the dark
 * page), Stormlight is about 0.15.
 */
export const BAR_TOLERANCE = 0.03;
export const BAR_MIN_THICKNESS = 0.6;
export const CHROMA_MAX = 0.03;

/** The docs slugs to cover; when global-setup could not collect them, a failing test says so. */
export function componentSlugs(): string[] {
  if (slugs.length === 0)
    test("component list", () => {
      throw new Error("No slugs: global-setup did not collect /components (run the suite, not --list)");
    });
  return slugs;
}

export async function setTheme(page: Page, theme: Theme) {
  await page.emulateMedia({ colorScheme: theme });
  await expect(page.locator("html")).toHaveClass(theme === "dark" ? /(^|\s)dark(\s|$)/ : /^(?!.*(^|\s)dark(\s|$))/);
}

/**
 * Opens /docs/<slug> with the probe installed and the preview settled. With
 * `clock`, the page's timers and animation frames are fake, so `freeze` can
 * stop a demo's own motion (a live list, a typing terminal) while measuring.
 */
export async function openPreview(page: Page, slug: string, { theme = "light" as Theme, clock = false } = {}) {
  await page.addInitScript(installProbe);
  if (clock) await page.clock.install();
  await page.emulateMedia({ colorScheme: theme });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`/docs/${slug}`, { waitUntil: "load" });
  // A page that documents a server piece has no preview by design.
  test.skip((await page.locator("#preview").count()) === 0, "This page has no preview");
  await setTheme(page, theme);
  await expect(page.locator(".docs-preview-stage .fui-loading")).toHaveCount(1);
  await expect(toggle(page)).toBeVisible();
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await toggle(page).scrollIntoViewIfNeeded();
  await settle(page);
  return errors;
}

export const toggle = (page: Page) => page.getByRole("switch", { name: "Loading state" });

export async function setLoading(page: Page, on: boolean) {
  const control = toggle(page);
  if ((await control.getAttribute("aria-checked")) !== String(on)) await control.click();
  await expect(control).toHaveAttribute("aria-checked", String(on));
  const root = page.locator(".docs-preview-stage .fui-loading");
  if (on) await expect(root).toHaveAttribute("data-fui-loading", "");
  else await expect(root).not.toHaveAttribute("data-fui-loading");
  // Real frames (not requestAnimationFrame, which a frozen clock holds back):
  // resize observers and the effects they trigger run before anything is measured.
  await page.waitForTimeout(120);
  // Host transitions (colour, background) belong to the toggle's end state.
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) if (animation instanceof CSSTransition) animation.finish();
  });
}

/** Waits (up to three seconds) for the preview to stop moving, pausing CSS and WAAPI animations. */
export async function settle(page: Page) {
  await page.evaluate(() => window.__lqa.pause());
  let last = await boxes(page);
  let still = 0;
  for (let i = 0; i < 20 && still < 2; i += 1) {
    await page.waitForTimeout(150);
    await page.evaluate(() => window.__lqa.pause());
    const next = await boxes(page);
    still = moved(last, next).length === 0 ? still + 1 : 0;
    last = next;
  }
}

/** Stops the page's timers and animation frames (needs `clock` in openPreview). */
export async function freeze(page: Page) {
  // Fake time keeps flowing until paused, so aim a little ahead of "now".
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(now + 250);
}

export const thaw = (page: Page) => page.clock.resume();

export const boxes = (page: Page) => page.evaluate(() => window.__lqa.boxes());

/** Boxes that differ by half a pixel or more, as readable lines. */
export function moved(before: Box[], after: Box[], skip = new Set<number>()): string[] {
  if (before.length !== after.length) return [`element count changed from ${before.length} to ${after.length}`];
  const out: string[] = [];
  for (let i = 0; i < before.length; i += 1) {
    if (skip.has(i)) continue;
    const a = before[i]!;
    const b = after[i]!;
    const deltas = (["x", "y", "w", "h"] as const)
      .map((k) => [k, b[k] - a[k]] as const)
      .filter(([, delta]) => Math.abs(delta) >= 0.5);
    if (deltas.length) out.push(`${a.d}: ${deltas.map(([k, delta]) => `${k} ${delta > 0 ? "+" : ""}${delta.toFixed(2)}`).join(", ")}`);
  }
  return out;
}

/**
 * Toggles loading on and off and returns every box that moved. Time is frozen
 * while measuring; elements that still move on their own with loading off are
 * measured first and left out (how many is part of the result). A demo that
 * animates by itself can still land a frame between two snapshots, so a
 * measurement that finds movement is repeated: a real shift moves every time.
 */
export async function shiftOnToggle(page: Page, attempts = 3) {
  let result = await measureToggle(page);
  for (let i = 1; i < attempts && (result.on.length || result.off.length); i += 1) result = await measureToggle(page);
  return result;
}

async function measureToggle(page: Page) {
  // Keep the pointer off the preview: hover (a chart tooltip) ends when the content turns inert.
  await page.mouse.move(0, 0);
  await settle(page);
  await freeze(page);
  await page.evaluate(() => window.__lqa.pause());
  const before = await boxes(page);
  await page.waitForTimeout(150);
  const again = await boxes(page);
  const skip = new Set<number>();
  if (before.length === again.length)
    before.forEach((box, i) => {
      const b = again[i]!;
      if (Math.abs(box.x - b.x) >= 0.5 || Math.abs(box.y - b.y) >= 0.5 || Math.abs(box.w - b.w) >= 0.5 || Math.abs(box.h - b.h) >= 0.5) skip.add(i);
    });
  await setLoading(page, true);
  const on = moved(before, await boxes(page), skip);
  await setLoading(page, false);
  const off = moved(before, await boxes(page), skip);
  await thaw(page);
  return { on, off, unstable: skip.size, elements: before.length };
}

export function summarise(list: string[], limit = 12) {
  return list.length > limit ? [...list.slice(0, limit), `… and ${list.length - limit} more`] : list;
}

/**
 * With loading off, finds the lines and filled shapes to judge; with it on,
 * collects ink leaks and samples one screenshot. Time is frozen in between,
 * so a live demo cannot move; lines that moved anyway are left out.
 */
export async function paintReport(page: Page) {
  await setLoading(page, false);
  await thaw(page);
  await settle(page);
  await page.evaluate(() => {
    const stage = document.querySelector(".docs-preview-stage")!;
    // Below the floating site header, with the preview bar and its switch in
    // view: clicking the switch never scrolls, so line rects stay valid.
    window.scrollTo({ top: scrollY + stage.getBoundingClientRect().top - 160, behavior: "instant" });
  });
  await settle(page);
  // A live demo (a list that grows, a typing terminal) must not move between the lines and the screenshot.
  await freeze(page);
  await page.evaluate(() => window.__lqa.pause());
  const lines = await page.evaluate(() => window.__lqa.lines());
  const shapes = await page.evaluate(() => window.__lqa.shapes());
  const scrolled = await page.evaluate(() => scrollY);
  await setLoading(page, true);
  expect(await page.evaluate(() => scrollY), "the page scrolled while turning loading on").toBe(scrolled);
  const ink = await page.evaluate(() => window.__lqa.ink());
  const region = await page.evaluate(() => window.__lqa.stageRect());
  // Pause (not "disabled", which rewinds infinite animations and moves a marquee off its lines).
  await page.evaluate(() => window.__lqa.pause());
  const png = (await page.screenshot({ caret: "hide" })).toString("base64");
  const expected = await page.evaluate(() => window.__lqa.skeleton());
  const { samples, shapes: filled, chroma } = await page.evaluate(
    ([png, lines, shapes, region, tolerance]) => window.__lqa.analyse(png, lines, shapes, region, tolerance),
    [png, lines, shapes, region, BAR_TOLERANCE] as const,
  );
  const where = chroma.max > CHROMA_MAX ? await page.evaluate(([x, y]) => window.__lqa.whoAt(x, y), chroma.at) : "";
  // A line that moved by itself since it was measured (a marquee) cannot be judged from this screenshot.
  const unmoved = await page.evaluate(() => window.__lqa.unmoved());
  await setLoading(page, false);
  await thaw(page);
  return { lines, samples: samples.filter((_, i) => unmoved[i]), moved: unmoved.filter((still) => !still).length, filled, chroma, where, ink, expected };
}

export type PaintReport = Awaited<ReturnType<typeof paintReport>>;

/** What a paint report shows wrong, as readable lines per check. */
export function paintProblems(report: PaintReport) {
  const { chroma } = report;
  return {
    bars: report.samples
      .filter((s) => s.deltaE > BAR_TOLERANCE || s.run < BAR_MIN_THICKNESS * s.font)
      .map(
        (s) =>
          `${s.d} "${s.text}" at ${Math.round(s.x + s.w / 2)},${Math.round(s.y + s.h / 2)}: rgb(${s.centre.join(",")}) vs bone rgb(${s.bone.join(",")}) ΔE ${s.deltaE.toFixed(3)}, bar ${s.run}px for ${s.font}px text`,
      ),
    shapes: report.filled
      .filter((s) => s.deltaE > BAR_TOLERANCE)
      .map((s) => `${s.d}: rgb(${s.worst.join(",")}) vs surface rgb(${s.surface.join(",")}) ΔE ${s.deltaE.toFixed(3)}`),
    ink: report.ink.map((leak) => `${leak.d}: ${leak.what} ${leak.color}`),
    colour:
      chroma.max > CHROMA_MAX
        ? [
            `chroma ${chroma.max.toFixed(3)} rgb(${chroma.rgb.join(",")}) at ${chroma.at.join(",")} in ${report.where}; ${chroma.count} pixels above ${CHROMA_MAX}`,
          ]
        : [],
  };
}
