// Windows high contrast, as Chromium emulates it. Every assertion reads a computed style that the forced-colors block of styles.css
// is responsible for; none compares pixels, and no reference image is added.
// Chromium only: WebKit's emulation does not map system colors (it was already seen to paint everything Canvas on x-tracker), so a
// red result there would be a false one; Firefox is looked at by hand.
import { expect, test, type Page } from "@playwright/test";

test.skip(({ browserName }) => browserName !== "chromium", "forced-colors emulation maps system colors in Chromium only");

type Scheme = "light" | "dark";

async function open(page: Page, id: string, scheme: Scheme, theme: Scheme = scheme) {
  await page.emulateMedia({ forcedColors: "active", colorScheme: scheme });
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`);
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

/**
 * What a system color is in this palette. A probe that is itself forced would answer Canvas for everything, so it opts out
 * (the assertions would pass for the wrong reason otherwise).
 */
async function palette(page: Page) {
  return page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.forcedColorAdjust = "none";
    document.body.append(probe);
    const out: Record<string, string> = {};
    for (const name of ["Canvas", "CanvasText", "Highlight", "HighlightText", "GrayText"]) {
      probe.style.backgroundColor = name;
      out[name] = getComputedStyle(probe).backgroundColor;
    }
    probe.remove();
    return out;
  });
}

/**
 * The painted colour at a fraction of an element's width, from a screenshot of it. For what getComputedStyle cannot answer:
 * the filled part of a <progress> lives in a UA pseudo-element whose computed style is not the painted one.
 */
async function paintedAt(page: Page, selector: string, fractions: number[]): Promise<string[]> {
  const png = await page.locator(selector).first().screenshot();
  return page.evaluate(
    async ([base64, at]) => {
      const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${base64}`)).blob());
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = canvas.getContext("2d")!;
      context.drawImage(bitmap, 0, 0);
      return (at as number[]).map((fraction) => {
        const x = Math.min(bitmap.width - 1, Math.max(0, Math.round(bitmap.width * fraction)));
        return Array.from(context.getImageData(x, Math.floor(bitmap.height / 2), 1, 1).data).join(",");
      });
    },
    [png.toString("base64"), fractions] as const,
  );
}

type Computed = Partial<Record<string, string>>;
/** Computed styles of the first match of `selector` (or of its pseudo-element), by property name in camelCase. */
function style(page: Page, selector: string, properties: string[], pseudo?: string): Promise<Computed> {
  return page.evaluate(
    ([sel, props, pseudoElement]) => {
      const element = document.querySelector(sel as string);
      if (!element) throw new Error(`no ${sel}`);
      const computed = getComputedStyle(element, (pseudoElement as string | undefined) || null) as unknown as Record<string, string>;
      return Object.fromEntries((props as string[]).map((name) => [name, computed[name]]));
    },
    [selector, properties, pseudo] as const,
  );
}

for (const scheme of ["light", "dark"] as const) {
  test.describe(`forced colors, ${scheme} palette`, () => {
    test("components: meters, status dots, badges, radios, avatars, tabs and toggles", async ({ page }) => {
      await open(page, "fabrials-components--gallery", scheme);
      const system = await palette(page);

      // 2. A meter is an edged track with a Highlight fill, not two Canvas boxes.
      expect(await style(page, ".fui-meter-indicator", ["backgroundColor"])).toEqual({ backgroundColor: system.Highlight });
      expect(await style(page, ".fui-meter-track", ["borderTopStyle", "borderTopColor"])).toEqual({
        borderTopStyle: "solid",
        borderTopColor: system.CanvasText,
      });

      // 1. A status dot keeps its tone, with an edge, so two tones are still two colours and none is Canvas.
      const dots = await page.evaluate(() =>
        [...document.querySelectorAll(".fui-status-dot")].map((dot) => {
          const computed = getComputedStyle(dot);
          return { fca: computed.forcedColorAdjust, bg: computed.backgroundColor, edge: `${computed.outlineStyle} ${computed.outlineWidth} ${computed.outlineColor}` };
        }),
      );
      expect(dots.length).toBeGreaterThan(3);
      for (const dot of dots) {
        expect(dot.fca).toBe("none");
        expect(dot.edge).toBe(`solid 1px ${system.CanvasText}`);
        expect(dot.bg).not.toBe(system.Canvas);
      }
      expect(new Set(dots.map((dot) => dot.bg)).size).toBeGreaterThan(2);

      // 3. A badge's hairline was a box-shadow; it is an outline now. A badge's dot keeps its colour.
      expect(await style(page, ".fui-badge", ["outlineStyle", "outlineWidth", "outlineColor"])).toEqual({
        outlineStyle: "solid",
        outlineWidth: "1px",
        outlineColor: system.CanvasText,
      });
      expect(await style(page, ".fui-badge-dot", ["forcedColorAdjust"])).toEqual({ forcedColorAdjust: "none" });

      // 2. The dot of the checked radio, and its edge, are Highlight; the unchecked ones show no dot.
      expect(await style(page, ".fui-radio[data-checked] .fui-radio-indicator", ["backgroundColor"])).toEqual({ backgroundColor: system.Highlight });
      expect(await style(page, ".fui-radio[data-checked]", ["borderTopColor"])).toEqual({ borderTopColor: system.Highlight });

      // 3. An avatar's edge.
      expect(await style(page, ".fui-avatar", ["outlineStyle"])).toEqual({ outlineStyle: "solid" });

      // 3. The active segmented tab is a Highlight bar, like a pressed toggle.
      expect(await style(page, '.fui-tabs-list[data-variant="segmented"] .fui-tab[data-active]', ["content", "backgroundColor"], "::after")).toEqual({
        content: '""',
        backgroundColor: system.Highlight,
      });

      // 3. A pressed toggle is a Highlight bar under its label, and the label keeps CanvasText: a Highlight fill behind the label
      // would get Chromium's Canvas backplate and read HighlightText on white. The unpressed ones have no bar.
      const group = ".fui-toggle-group:has(.fui-toggle[data-pressed]) ";
      expect(await style(page, `${group}.fui-toggle[data-pressed]`, ["color", "backgroundColor"])).toEqual({
        color: system.CanvasText,
        backgroundColor: system.Canvas,
      });
      expect(await style(page, `${group}.fui-toggle[data-pressed]`, ["content", "position", "backgroundColor", "blockSize"], "::after")).toEqual({
        content: '""',
        position: "absolute",
        backgroundColor: system.Highlight,
        blockSize: "3px",
      });
      expect(await style(page, `${group}.fui-toggle:not([data-pressed])`, ["content"], "::after")).toEqual({ content: "none" });
      expect(await style(page, ".fui-toggle-group", ["outlineStyle"])).toEqual({ outlineStyle: "solid" });
    });

    test("a focused pressed toggle still shows the bar and the ring", async ({ page }) => {
      await open(page, "fabrials-components--gallery", scheme);
      const system = await palette(page);
      // The theme switcher's pressed segment is a tab stop (a toggle group is a roving one, and its pressed item is not the first).
      const pressed = page.locator(".fui-theme-switcher .fui-toggle[data-pressed]").first();
      for (let press = 0; press < 5; press += 1) {
        await page.keyboard.press("Tab");
        if (await pressed.evaluate((element) => element === document.activeElement)) break;
      }
      await expect(pressed).toBeFocused();
      const both = await pressed.evaluate((element) => {
        const ring = getComputedStyle(element);
        const bar = getComputedStyle(element, "::after");
        return { ring: `${ring.outlineStyle} ${ring.outlineWidth}`, bar: bar.backgroundColor, color: ring.color };
      });
      // The ring is the UA's focus ring and the pressed state is still told by the bar: they do not share an outline.
      expect(both).toEqual({ ring: "solid 2px", bar: system.Highlight, color: system.CanvasText });
    });

    test("a vertical tab list's bar is Highlight too (its own rule paints --brand-ink with three classes of specificity)", async ({ page }) => {
      await open(page, "fabrials-structure--sections", scheme);
      const system = await palette(page);
      expect(await style(page, '.fui-tabs-list[data-orientation="vertical"] .fui-tabs-indicator', ["backgroundColor"])).toEqual({ backgroundColor: system.Highlight });
    });

    test("controls: the switch, checked and mixed checkboxes, progress and the native select", async ({ page }) => {
      await open(page, "fabrials-foundation--controls", scheme);
      const system = await palette(page);

      // The switch is the plan's worst case: its thumb was Canvas on Canvas. On: Highlight track, HighlightText thumb. Off: CanvasText.
      expect(await style(page, ".fui-switch[data-checked]", ["backgroundColor"])).toEqual({ backgroundColor: system.Highlight });
      expect(await style(page, ".fui-switch[data-checked] .fui-switch-thumb", ["backgroundColor"])).toEqual({ backgroundColor: system.HighlightText });
      await page.locator(".fui-switch").click();
      await expect(page.locator(".fui-switch[data-checked]")).toHaveCount(0);
      expect(await style(page, ".fui-switch", ["backgroundColor"])).toEqual({ backgroundColor: system.Canvas });
      expect(await style(page, ".fui-switch .fui-switch-thumb", ["backgroundColor"])).toEqual({ backgroundColor: system.CanvasText });

      for (const selector of [".fui-checkbox[data-checked]", ".fui-checkbox[data-indeterminate]"]) {
        expect(await style(page, selector, ["backgroundColor", "color"])).toEqual({ backgroundColor: system.Highlight, color: system.HighlightText });
      }

      expect(await style(page, ".fui-progress", ["borderTopStyle", "borderTopColor"])).toEqual({ borderTopStyle: "solid", borderTopColor: system.CanvasText });
      // 42 %: the filled part is painted (Highlight over Canvas), the rest is Canvas.
      const [filled, empty] = await paintedAt(page, ".fui-progress", [0.2, 0.9]);
      expect(empty).toBe(`${system.Canvas.match(/\d+/g)!.slice(0, 3).join(",")},255`);
      expect(filled).not.toBe(empty);

      // 2. The underline tabs' indicator.
      expect(await style(page, ".fui-tabs-indicator", ["backgroundColor"])).toEqual({ backgroundColor: system.Highlight });
    });

    test("monitoring: activity cells step through Highlight, timeline markers have an edge and the dot keeps its tone", async ({ page }) => {
      await open(page, "fabrials-monitoring--gallery", scheme);
      const system = await palette(page);
      const cells = await page.evaluate(() => {
        const level = (n: string) => {
          const cell = document.querySelector(`.fui-activity-cell[data-level="${n}"]`)!;
          const computed = getComputedStyle(cell);
          return { bg: computed.backgroundColor, edge: computed.borderTopColor };
        };
        return { l0: level("0"), l1: level("1"), l2: level("2"), l3: level("3"), l4: level("4") };
      });
      expect(cells.l4.bg).toBe(system.Highlight);
      expect(cells.l0.bg).toBe(system.Canvas);
      expect(cells.l0.edge).toBe(system.GrayText);
      expect(cells.l4.edge).toBe(system.CanvasText);
      // three distinct steps between empty and full
      expect(new Set([cells.l0.bg, cells.l1.bg, cells.l2.bg, cells.l3.bg, cells.l4.bg]).size).toBe(5);

      // A tab list that is not Base UI's (the link tabs) has no indicator element: the current tab draws its own bar.
      expect(await style(page, ".fui-nav-tab[data-active]", ["content", "position", "backgroundColor", "blockSize"], "::after")).toEqual({
        content: '""',
        position: "absolute",
        backgroundColor: system.Highlight,
        blockSize: "2px",
      });
      expect(await style(page, ".fui-nav-tab:not([data-active])", ["content"], "::after")).toEqual({ content: "none" });

      expect(await style(page, ".fui-timeline-marker", ["outlineStyle", "outlineColor"])).toEqual({ outlineStyle: "solid", outlineColor: system.CanvasText });
      const dot = await style(page, ".fui-timeline-dot", ["forcedColorAdjust", "outlineColor", "backgroundColor"]);
      expect(dot.forcedColorAdjust).toBe("none");
      expect(dot.outlineColor).toBe(system.CanvasText);
      expect(dot.backgroundColor).not.toBe(system.Canvas);
    });

    test("tags: a hollow badge dot is an edge with no fill", async ({ page }) => {
      await open(page, "fabrials-feedback--tags", scheme);
      const system = await palette(page);
      const hollow = await style(page, ".fui-badge-dot[data-hollow]", ["forcedColorAdjust", "outlineColor", "backgroundColor"]);
      expect(hollow.forcedColorAdjust).toBe("none");
      expect(hollow.outlineColor).toBe(system.CanvasText);
      expect(hollow.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    });

    test("charts: the legend keys keep the series' colours (the plot's SVG already does) and the axis text is CanvasText", async ({ page }) => {
      await open(page, "fabrials-catalogue--charts", scheme);
      const system = await palette(page);
      const keys = await page.evaluate(() =>
        [...document.querySelectorAll(".fui-chart-legend .fui-chart-swatch")].map((swatch) => {
          const computed = getComputedStyle(swatch);
          return { fca: computed.forcedColorAdjust, bg: computed.backgroundColor, edge: `${computed.outlineStyle} ${computed.outlineWidth} ${computed.outlineColor}` };
        }),
      );
      expect(keys).toHaveLength(4);
      for (const key of keys) {
        expect(key.fca).toBe("none");
        expect(key.edge).toBe(`solid 1px ${system.CanvasText}`);
        expect(key.bg).not.toBe(system.Canvas);
      }
      expect(keys[0].bg).not.toBe(keys[1].bg);
      // The series themselves: SVG paint is not repainted, so two series stay two colours without any rule.
      const bars = await page.evaluate(() => [...document.querySelectorAll(".recharts-bar")].map((bar) => getComputedStyle(bar.querySelector("path")!).fill));
      const lines = await page.evaluate(() => [...document.querySelectorAll("path.recharts-line-curve")].map((line) => getComputedStyle(line).stroke));
      expect(bars).toHaveLength(2);
      expect(lines).toHaveLength(2);
      expect(new Set(bars).size).toBe(2);
      expect(new Set(lines).size).toBe(2);
      expect(await style(page, ".fui-chart-frame .recharts-surface text", ["fill"])).toEqual({ fill: system.CanvasText });
    });

    test("the axis text is readable when the page's theme is not the palette's", async ({ page }) => {
      // A light page under a dark high-contrast palette (or the reverse): the theme's muted ink would sit on the wrong Canvas.
      const other: Scheme = scheme === "light" ? "dark" : "light";
      await open(page, "fabrials-catalogue--charts", scheme, other);
      const system = await palette(page);
      expect(await style(page, ".fui-chart-frame .recharts-surface text", ["fill"])).toEqual({ fill: system.CanvasText });
    });

    test("focus that was only a box-shadow: an input group and the command input draw a Highlight ring", async ({ page }) => {
      await open(page, "fabrials-catalogue--gallery", scheme);
      const system = await palette(page);
      for (const [control, wrapper, offset] of [
        [".fui-input-group-control", ".fui-input-group", "2px"],
        [".fui-command-input", ".fui-command-input-wrapper", "-2px"],
      ]) {
        await page.locator(control).first().focus();
        await page.keyboard.press("Shift+Tab");
        await page.keyboard.press("Tab");
        await expect(page.locator(control).first()).toBeFocused();
        expect(await style(page, wrapper, ["outlineStyle", "outlineWidth", "outlineColor", "outlineOffset"])).toEqual({
          outlineStyle: "solid",
          outlineWidth: "2px",
          outlineColor: system.Highlight,
          outlineOffset: offset,
        });
      }
    });

    test("a native select gives way to the browser's own arrow", async ({ page }) => {
      await open(page, "fabrials-enterprise--preferences", scheme);
      expect(await style(page, "select.fui-native-select", ["appearance", "backgroundImage"])).toEqual({ appearance: "auto", backgroundImage: "none" });
    });
  });
}
