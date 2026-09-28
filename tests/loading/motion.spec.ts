import { expect, test } from "@playwright/test";
import { openPreview, setLoading } from "./support";

/*
 * (e) Motion with no reduced-motion preference: the Loading pulse runs on the
 * content while loading and stops when it ends. (The reduced-motion case runs
 * for every slug in a11y.spec.ts.) The pulse lives on Loading's own content,
 * the same for every component, so a few previews represent it.
 */
test.use({ contextOptions: { reducedMotion: "no-preference" } });

for (const slug of ["button", "table", "card", "chat-message", "magicui-marquee"])
  test(`loading pulse without reduced motion ${slug}`, async ({ page }) => {
    await openPreview(page, slug);
    expect(await page.evaluate(() => window.__lqa.pulses())).toEqual({ running: 0, total: 0 });
    await setLoading(page, true);
    const pulses = await page.evaluate(() => window.__lqa.pulses());
    expect(pulses.total).toBeGreaterThan(0);
    expect(pulses.running).toBe(pulses.total);
    // It changes opacity only (paint), never a box.
    const properties = await page.evaluate(() =>
      document
        .getAnimations()
        .filter((a) => (a as CSSAnimation).animationName === "fui-loading-pulse")
        .flatMap((a) => (a.effect as KeyframeEffect).getKeyframes().flatMap((k) => Object.keys(k)))
        .filter((key) => !["offset", "computedOffset", "easing", "composite"].includes(key)),
    );
    expect([...new Set(properties)]).toEqual(["opacity"]);
    await setLoading(page, false);
    expect(await page.evaluate(() => window.__lqa.pulses())).toEqual({ running: 0, total: 0 });
  });
