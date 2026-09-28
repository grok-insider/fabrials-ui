import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { componentSlugs, openPreview, setLoading, toggle } from "./support";

/*
 * (d) Accessibility and (e) reduced motion, for every slug in every engine at
 * 1440 px, light theme (the project default: reducedMotion "reduce").
 *
 * While loading: axe finds no violations in the preview, Tab from the switch
 * never lands inside the inert content, the status region says what is
 * loading, aria-busy is set, and no Loading pulse runs. After: the status is
 * empty again and aria-busy is gone.
 */
async function audit(page: import("@playwright/test").Page) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await new AxeBuilder({ page }).include(".docs-preview").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    } catch (error) {
      if (!String(error).includes("Axe is already running") || attempt === 3) throw error;
      await page.waitForTimeout(200);
    }
  }
}

for (const slug of componentSlugs())
  test(`skeleton accessibility ${slug}`, async ({ page }) => {
    await openPreview(page, slug);
    const root = page.locator(".docs-preview-stage .fui-loading");
    const status = root.locator(':scope > [role="status"]');
    await expect(status).toHaveText("");

    await setLoading(page, true);
    await expect(status).toHaveText("Loading the example");
    await expect(root).toHaveAttribute("aria-busy", "true");
    await expect(root.locator(":scope > .fui-loading-content")).toHaveAttribute("inert", "");

    const result = await audit(page);
    expect.soft(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);

    await toggle(page).focus();
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press("Tab");
      const focus = await page.evaluate(() => {
        const active = document.activeElement;
        const content = document.querySelector(".docs-preview-stage .fui-loading-content");
        return { inside: !!active && !!content?.contains(active), name: active ? `${active.tagName.toLowerCase()} ${active.textContent?.trim().slice(0, 30) ?? ""}` : "none" };
      });
      expect.soft(focus.inside, `Tab ${i + 1} from the switch focused ${focus.name} inside the loading content`).toBe(false);
    }

    expect.soft(await page.evaluate(() => window.__lqa.pulses()), "Loading pulses under reduced motion").toEqual({ running: 0, total: 0 });

    await setLoading(page, false);
    await expect(status).toHaveText("");
    await expect(root).not.toHaveAttribute("aria-busy");
    await expect(root.locator(":scope > .fui-loading-content")).not.toHaveAttribute("inert");
    // Transitions stay off for a frame after the skeleton ends, then come back.
    await expect(root).not.toHaveAttribute("data-fui-loading-settle");
  });
