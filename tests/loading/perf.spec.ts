import { expect, test } from "@playwright/test";
import { openPreview, toggle } from "./support";

/*
 * (g) Cost of toggling a large skeleton, in Chromium (CDP Performance metrics).
 *
 * The table preview is inflated to 1,000 rows (3,000 elements), then loading
 * is turned on and off three times. For each toggle the style recalculation
 * and layout time spent between the click and the following frames is
 * summed. It runs twice: without a motion preference, and with reduced
 * motion, where the site (like many apps) sets transition-duration on every
 * element, so any property that changes would start a transition.
 *
 * Budgets:
 * - style + layout per toggle under 100 ms, the time in which a response
 *   still feels immediate (RAIL): loading turns on or off in response to data
 *   arriving. Turning off includes the frame after, when Loading lets
 *   transitions back in (one more style pass). A skeleton this large is an
 *   extreme; measured here on a fast desktop: about 25 ms on, 35 to 65 ms
 *   off (it was about 300 ms each way under reduced motion before Loading
 *   turned transitions off);
 * - layout per toggle under a quarter of one full relayout of the same table
 *   (measured by changing its width): the skeleton only repaints, so layout
 *   work on toggle is limited to the switch and the status message, and must
 *   not grow with the content. This part holds on any machine.
 */
const ROWS = 1000;

for (const motion of ["no-preference", "reduce"] as const)
  test.describe(`motion preference ${motion}`, () => {
    test.use({ contextOptions: { reducedMotion: motion } });

    test("toggling a 1,000-row table stays within the style and layout budget", async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "CDP performance metrics are Chromium only");
      await openPreview(page, "table");
      const elements = await page.evaluate((count) => {
        const body = document.querySelector<HTMLTableSectionElement>(".docs-preview-stage tbody")!;
        const template = body.querySelector("tr")!;
        while (body.rows.length < count) body.append(template.cloneNode(true));
        return document.querySelectorAll(".docs-preview-stage *").length;
      }, ROWS);
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Performance.enable");
      const metrics = async () => {
        const { metrics } = await cdp.send("Performance.getMetrics");
        return Object.fromEntries(metrics.map((m) => [m.name, m.value])) as Record<string, number>;
      };
      const measure = async (action: () => Promise<void>) => {
        await page.waitForTimeout(200);
        const before = await metrics();
        await action();
        await page.waitForTimeout(300);
        const after = await metrics();
        return {
          style: (after.RecalcStyleDuration! - before.RecalcStyleDuration!) * 1000,
          layout: (after.LayoutDuration! - before.LayoutDuration!) * 1000,
        };
      };

      // One full relayout of the inflated table, for scale.
      const relayout = await measure(async () => {
        await page.evaluate(() => {
          const table = document.querySelector<HTMLElement>(".docs-preview-stage table")!;
          table.style.width = `${table.getBoundingClientRect().width - 1}px`;
          table.getBoundingClientRect();
        });
      });

      const root = page.locator(".docs-preview-stage > .fui-loading");
      const toggles: { style: number; layout: number }[] = [];
      for (let i = 0; i < 3; i += 1)
        for (const on of [true, false])
          toggles.push(
            await measure(async () => {
              await toggle(page).click();
              if (on) await expect(root).toHaveAttribute("aria-busy", "true");
              else await expect(root).not.toHaveAttribute("aria-busy");
            }),
          );

      const worst = toggles.reduce((a, b) => (a.style + a.layout >= b.style + b.layout ? a : b));
      const report = `${elements} elements, ${motion}; full relayout ${relayout.layout.toFixed(1)} ms; toggles (style/layout ms): ${toggles
        .map((t) => `${t.style.toFixed(1)}/${t.layout.toFixed(1)}`)
        .join(", ")}`;
      test.info().annotations.push({ type: "performance", description: report });
      console.log(report);
      expect(worst.style + worst.layout, report).toBeLessThan(100);
      for (const t of toggles) expect(t.layout, report).toBeLessThan(Math.max(2, relayout.layout / 4));
    });
  });
