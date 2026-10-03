import { expect, test, type Page } from "@playwright/test";

const story = "/iframe.html?id=fabrials-catalogue--charts&viewMode=story";

const plots = [
  { kind: "bars", name: "Synthetic requests and errors over two weeks" },
  { kind: "lines", name: "Synthetic requests and errors per day" },
];

// Real Tab presses, not focus(): the point is that the plot is a tab stop, and that the ring shows for the keyboard.
async function tabTo(page: Page, index: number) {
  for (let press = 0; press < 40; press += 1) {
    await page.keyboard.press("Tab");
    const onPlot = await page.evaluate(
      (wanted) => document.activeElement === document.querySelectorAll("svg.recharts-surface")[wanted],
      index,
    );
    if (onPlot) return;
  }
  throw new Error(`Tab never reached plot ${index}`);
}

for (const [index, plot] of plots.entries()) {
  test(`${plot.kind}: the plot is named, shows a 2 px inset Stormlight ring on keyboard focus and an arrow opens its tooltip`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.setViewportSize({ width: 1000, height: 900 });
    await page.goto(story);
    await expect(page.getByRole("heading", { level: 1, name: "Charts" })).toBeVisible();
    await expect(page.locator("svg.recharts-surface")).toHaveCount(2);
    // The accessible name Chromium computes, not just the attribute.
    await expect(page.getByRole("application", { name: plot.name })).toBeVisible();
    await tabTo(page, index);
    const ring = await page.evaluate((wanted) => {
      const surface = document.querySelectorAll("svg.recharts-surface")[wanted];
      const style = getComputedStyle(surface);
      const probe = document.createElement("div");
      probe.style.outlineColor = "var(--fui-focus)";
      document.body.append(probe);
      const expected = getComputedStyle(probe).outlineColor;
      probe.remove();
      return {
        focusVisible: surface.matches(":focus-visible"),
        style: style.outlineStyle,
        width: style.outlineWidth,
        offset: style.outlineOffset,
        colour: style.outlineColor,
        expected,
      };
    }, index);
    expect(ring).toEqual({
      focusVisible: true,
      style: "solid",
      width: "2px",
      offset: "-2px",
      colour: ring.expected,
      expected: ring.expected,
    });
    await page.keyboard.press("ArrowRight");
    const tip = page.locator(".fui-chart-tip");
    await expect(tip).toHaveCount(1);
    await expect(tip).toBeVisible();
    // titleKey wins over the repeated axis label.
    await expect(tip.locator(".fui-chart-tip-title")).toHaveText(/\w{3} \d+ Jun/);
    // Two rows share the axis label "Mon": a React duplicate-key warning would land here.
    expect(errors.filter((text) => /same key|unique "key"/i.test(text))).toEqual([]);
  });
}
