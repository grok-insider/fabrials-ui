import { expect, test, type Page } from "@playwright/test";
import { BAR_TOLERANCE, openPreview, setLoading, toggle } from "./support";

/*
 * (f) Switching the theme with the site's ThemeSwitcher while a preview is
 * loading repaints the bones in the new theme's colour at once: the skeleton
 * stays on, --fui-skeleton resolves to the new value, and a bar on screen
 * matches it.
 */
async function firstLine(page: Page) {
  const lines = await page.evaluate(() => window.__lqa.lines());
  return lines.slice(0, 1);
}

for (const slug of ["card", "table", "chat-message", "stat"])
  test(`theme switch while loading ${slug}`, async ({ page }) => {
    await openPreview(page, slug, { theme: "light" });
    const top = await page.evaluate(() => {
      const stage = document.querySelector(".docs-preview-stage")!;
      window.scrollTo({ top: scrollY + stage.getBoundingClientRect().top - 160, behavior: "instant" });
      return scrollY;
    });
    const line = await firstLine(page);
    expect(line.length, "the preview has text to turn into bars").toBe(1);
    await setLoading(page, true);
    const sample = async () => {
      // The theme switcher sits in the page header: clicking it scrolls up. Come back to the line.
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top);
      await page.evaluate(() => window.__lqa.pause());
      const png = (await page.screenshot()).toString("base64");
      const bone = await page.evaluate(() => window.__lqa.skeleton());
      const region = await page.evaluate(() => window.__lqa.stageRect());
      // The line was found in the light theme; judge it against the bone now in force.
      const now = line.map((l) => ({ ...l, bone }));
      const { samples } = await page.evaluate(
        ([png, lines, region, tolerance]) => window.__lqa.analyse(png, lines, [], region, tolerance),
        [png, now, region, BAR_TOLERANCE] as const,
      );
      return { bone, pixel: samples[0]! };
    };
    const light = await sample();
    expect(light.pixel.deltaE).toBeLessThanOrEqual(BAR_TOLERANCE);

    const themes = page.getByRole("group", { name: "Theme" });
    await themes.getByRole("button", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveClass(/(^|\s)dark(\s|$)/);
    await expect(toggle(page)).toHaveAttribute("aria-checked", "true");
    const dark = await sample();
    expect(dark.bone, "the bone colour follows the theme").not.toEqual(light.bone);
    expect(dark.pixel.deltaE, `bar rgb(${dark.pixel.centre.join(",")}) against bone rgb(${dark.bone.join(",")})`).toBeLessThanOrEqual(BAR_TOLERANCE);
    // Dark bones are darker than light ones.
    expect(dark.pixel.centre.reduce((a, b) => a + b)).toBeLessThan(light.pixel.centre.reduce((a, b) => a + b));

    await themes.getByRole("button", { name: "Light" }).click();
    await expect(page.locator("html")).not.toHaveClass(/(^|\s)dark(\s|$)/);
    const back = await sample();
    expect(back.bone).toEqual(light.bone);
    expect(back.pixel.deltaE).toBeLessThanOrEqual(BAR_TOLERANCE);
    await setLoading(page, false);
  });
