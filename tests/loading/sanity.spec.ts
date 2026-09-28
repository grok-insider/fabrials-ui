import { expect, test, type Page } from "@playwright/test";
import { openPreview, paintProblems, paintReport, shiftOnToggle } from "./support";

/*
 * The checks bite. Each test brings back a defect this suite was written
 * against, on one preview, and expects the matching check to report it, so
 * a check that silently stops measuring fails here. Chromium only; the
 * defects are injected with inline !important styles (element-attached
 * declarations beat the components layer) or, for a rule that must only
 * apply while loading, an unlayered rule on a property Loading leaves alone.
 */
test.skip(({ browserName }) => browserName !== "chromium", "One engine is enough to prove the checks");

const inline = (page: Page, selector: string, css: Record<string, string>) =>
  page.evaluate(
    ([selector, css]) => {
      for (const el of document.querySelectorAll<HTMLElement>(`.docs-preview-stage .fui-loading-content ${selector}`))
        for (const [property, value] of Object.entries(css)) el.style.setProperty(property, value, "important");
    },
    [selector, css] as const,
  );

test("zero shift catches a filter on the content (it re-anchors fixed and absolute descendants)", async ({ page }) => {
  await openPreview(page, "card", { clock: true });
  await page.addStyleTag({ content: "[data-fui-loading] > .fui-loading-content > * { filter: grayscale(1); }" });
  await page.evaluate(() => window.__lqa.positioned(true));
  const result = await shiftOnToggle(page, 1);
  expect(result.on.join("\n")).toContain("Fixed");
});

test("bars catch a thin line", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1600 });
  await openPreview(page, "card", { clock: true });
  await inline(page, "*", { "text-decoration-thickness": "1px" });
  expect(paintProblems(await paintReport(page)).bars.length).toBeGreaterThan(0);
});

test("filled shapes catch a switch thumb left white", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1600 });
  await openPreview(page, "switch", { clock: true });
  await inline(page, ".fui-switch-thumb", { "background-color": "#fff" });
  expect(paintProblems(await paintReport(page)).shapes.join("\n")).toContain("fui-switch");
});

test("the colour check catches colour that is not blended away", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1600 });
  await openPreview(page, "progress", { clock: true });
  await inline(page, ".fui-preview", { "mix-blend-mode": "normal" });
  expect(paintProblems(await paintReport(page)).colour.length).toBe(1);
});

test("the ink check catches text that keeps its colour", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1600 });
  await openPreview(page, "card", { clock: true });
  await inline(page, ":is(p, div, span)", { color: "rgb(200, 0, 0)", "-webkit-text-fill-color": "rgb(200, 0, 0)" });
  expect(paintProblems(await paintReport(page)).ink.length).toBeGreaterThan(0);
});
