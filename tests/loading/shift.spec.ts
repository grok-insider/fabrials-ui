import { expect, test } from "@playwright/test";
import { componentSlugs, openPreview, setTheme, shiftOnToggle, summarise, type Theme } from "./support";

/*
 * (a) Zero shift. Toggling the Loading state switch may change paint only:
 * every element box inside the preview stage (getBoundingClientRect in page
 * coordinates) must stay within half a pixel, when loading turns on and again
 * when it turns off. Chromium runs every slug at four widths and both themes;
 * Firefox and WebKit run every slug at 1440 px in the light theme.
 */
const full = { widths: [390, 768, 1440, 2560], themes: ["light", "dark"] as Theme[] };
const representative = { widths: [1440], themes: ["light"] as Theme[] };

for (const slug of componentSlugs()) test(`zero shift ${slug}`, async ({ page }) => {
  const { widths, themes } = test.info().project.name === "chromium" ? full : representative;
  const errors = await openPreview(page, slug, { clock: true });
  let unstable = 0;
  for (const theme of themes) {
    await setTheme(page, theme);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 1000 });
      const result = await shiftOnToggle(page);
      unstable = Math.max(unstable, result.unstable);
      expect.soft(summarise(result.on), `${slug} ${theme} ${width}: boxes moved when loading turned on`).toEqual([]);
      expect.soft(summarise(result.off), `${slug} ${theme} ${width}: boxes moved when loading turned off`).toEqual([]);
    }
  }
  if (unstable) test.info().annotations.push({ type: "animated", description: `${unstable} elements move on their own and were not compared` });
  if (errors.length) test.info().annotations.push({ type: "page errors", description: errors.join(" | ") });
});
