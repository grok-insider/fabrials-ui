import { expect, test } from "@playwright/test";
import { componentSlugs, openPreview, paintProblems, paintReport, setTheme, summarise, type Theme } from "./support";

/*
 * (b) Every line of text is a bar and (c) nothing keeps ink or colour.
 *
 * Lines are found with loading off (Range.getClientRects per text node, kept
 * only when fully visible and not covered), then loading turns on and a
 * screenshot is sampled at the centre of each line. The pixel must match the
 * bone colour (--fui-skeleton) within BAR_TOLERANCE (OKLab ΔE; thresholds and
 * the measurement itself are in support.ts) and the bar must run at least
 * BAR_MIN_THICKNESS em tall through that point: a thin line, a missing bar or
 * a faded one fails.
 *
 * Every filled control (button, badge, switch, checkbox…) must be one solid
 * surface: a grid of pixels over its middle all match --fui-skeleton-surface,
 * so a thumb, an icon or a dot left inside it fails.
 *
 * With loading on, no element with visible text (or generated text, or a list
 * marker) may keep a non-transparent colour, and no pixel of the stage may be
 * more colourful than CHROMA_MAX (OKLCH chroma).
 *
 * Every slug, light and dark, 1440 px, in all three engines.
 */
for (const slug of componentSlugs())
  test(`skeleton paint ${slug}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1600 });
    await openPreview(page, slug, { clock: true });
    for (const theme of ["light", "dark"] as Theme[]) {
      await setTheme(page, theme);
      const report = await paintReport(page);
      const problems = paintProblems(report);
      expect.soft(summarise(problems.bars), `${slug} ${theme}: lines without a full bar (page bone rgb(${report.expected.join(",")}))`).toEqual([]);
      expect.soft(summarise(problems.shapes), `${slug} ${theme}: filled shapes that are not one solid colour`).toEqual([]);
      expect.soft(summarise(problems.ink), `${slug} ${theme}: ink while loading`).toEqual([]);
      expect.soft(problems.colour, `${slug} ${theme}: colour while loading`).toEqual([]);
      if (report.moved)
        test.info().annotations.push({ type: "moving lines", description: `${theme}: ${report.moved} lines moved on their own and were not sampled` });
      if (process.env.LOADING_DEBUG)
        console.log(
          slug,
          theme,
          test.info().project.name,
          `${report.samples.length}/${report.lines.length} lines`,
          `${report.filled.length} shapes, ΔE max ${Math.max(0, ...report.filled.map((s) => s.deltaE)).toFixed(3)}`,
          `bar/em max ${Math.max(0, ...report.samples.map((s) => s.run / s.font)).toFixed(2)}`,
          `ΔE max ${Math.max(0, ...report.samples.map((s) => s.deltaE)).toFixed(3)}`,
          `chroma ${report.chroma.max.toFixed(3)}`,
        );
    }
  });
