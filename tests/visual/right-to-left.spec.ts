// The pieces whose CSS was physical before 0.12, in a right-to-left page: each story is opened as it is and its root is
// turned (dir="rtl" on <html>), then geometry and computed styles are read. No references: the stories' own specs keep those.
import { expect, test, type Page } from "@playwright/test";

async function open(page: Page, id: string, dir: "ltr" | "rtl") {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=theme:light`);
  await expect(page.locator("#storybook-root > *").first()).toBeVisible();
  await page.evaluate((direction) => {
    document.documentElement.dir = direction;
  }, dir);
  await page.evaluate(() => document.fonts.ready);
}

const rect = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((node) => {
    const box = node.getBoundingClientRect();
    return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width };
  });

test("a switch's thumb rests at the inline start and travels to the inline end", async ({ page }) => {
  for (const dir of ["ltr", "rtl"] as const) {
    await open(page, "components-switch--playground", dir);
    const toggle = page.getByRole("switch");
    await expect(toggle).toBeChecked();
    const gaps = async () => {
      // The thumb springs across: read it once it has stopped.
      await expect.poll(() => page.locator(".fui-switch-thumb").evaluate((node) => node.getAnimations().length)).toBe(0);
      const track = await rect(page, ".fui-switch");
      const thumb = await rect(page, ".fui-switch-thumb");
      return { left: Math.round(thumb.left - track.left), right: Math.round(track.right - thumb.right) };
    };
    // 2 px is the track's border and padding; 18 px the rest of the track beside a 16 px thumb.
    expect(await gaps(), `${dir} on`).toEqual(dir === "ltr" ? { left: 18, right: 2 } : { left: 2, right: 18 });
    await toggle.click();
    await expect(toggle).not.toBeChecked();
    expect(await gaps(), `${dir} off`).toEqual(dir === "ltr" ? { left: 2, right: 18 } : { left: 18, right: 2 });
  }
});

test("the timeline's rail runs under its markers on the inline start", async ({ page }) => {
  for (const dir of ["ltr", "rtl"] as const) {
    await open(page, "tests-monitoring--gallery", dir);
    const item = page.locator(".fui-timeline-item").first();
    const rail = await item.evaluate((node) => {
      const style = getComputedStyle(node, "::before");
      return { left: style.left, right: style.right, width: style.width };
    });
    const box = await rect(page, ".fui-timeline-item");
    const marker = await rect(page, ".fui-timeline-item .fui-timeline-marker");
    const middle = (marker.left + marker.right) / 2;
    const offset = parseFloat(dir === "ltr" ? rail.left : rail.right);
    expect(rail.width).toBe("1px");
    expect(offset).toBeCloseTo(21.5, 1);
    // The 1 px rail is centred on the marker.
    const railMiddle = dir === "ltr" ? box.left + offset + 0.5 : box.right - offset - 0.5;
    expect(Math.abs(railMiddle - middle), dir).toBeLessThanOrEqual(0.5);
  }
});

test("a file tree reads from the inline start: indent, chevron and note follow the direction", async ({ page }) => {
  for (const dir of ["ltr", "rtl"] as const) {
    await open(page, "tests-docs-pieces--gallery", dir);
    const tree = page.locator(".fui-files").first();
    const closed = tree.locator('.fui-files-row[aria-expanded="false"]').first();
    const opened = tree.locator('.fui-files-row[aria-expanded="true"]').first();
    await expect(closed).toBeVisible();
    expect(await closed.evaluate((node) => getComputedStyle(node).textAlign)).toBe("start");
    expect(await closed.locator(".fui-files-chevron").evaluate((node) => getComputedStyle(node).transform)).toBe(dir === "ltr" ? "none" : "matrix(-1, 0, 0, 1, 0, 0)");
    // Open, the chevron points down in both.
    expect(await opened.locator(".fui-files-chevron").evaluate((node) => getComputedStyle(node).transform)).toBe("matrix(0, 1, -1, 0, 0, 0)");
    // The nested row is indented from the inline start, and a file's note sits at the inline end of its row.
    const padding = await closed.evaluate((node) => [parseFloat(getComputedStyle(node).paddingLeft), parseFloat(getComputedStyle(node).paddingRight)]);
    if (dir === "ltr") expect(padding[0]).toBeGreaterThan(padding[1]!);
    else expect(padding[1]).toBeGreaterThan(padding[0]!);
    const row = tree.locator(".fui-files-row").filter({ has: page.locator(".fui-files-note") }).first();
    const [rowBox, name, note] = await row.evaluate((node) => {
      const of = (element: Element) => {
        const box = element.getBoundingClientRect();
        return { left: box.left, right: box.right };
      };
      return [of(node), of(node.querySelector(".fui-files-name")!), of(node.querySelector(".fui-files-note")!)];
    });
    if (dir === "ltr") {
      expect(note!.left).toBeGreaterThan(name!.right);
      expect(rowBox!.right - note!.right).toBeLessThanOrEqual(8.5);
    } else {
      expect(note!.right).toBeLessThan(name!.left);
      expect(note!.left - rowBox!.left).toBeLessThanOrEqual(8.5);
    }
  }
});

test("pagination chevrons turn, a command still reads left to right with its copy key at the right", async ({ page }) => {
  for (const dir of ["ltr", "rtl"] as const) {
    await open(page, "tests-components-gallery--gallery", dir);
    const steps = page.locator(".fui-pagination-step svg");
    await expect(steps.first()).toBeVisible();
    for (const transform of await steps.evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).transform))) {
      expect(transform, dir).toBe(dir === "ltr" ? "none" : "matrix(-1, 0, 0, 1, 0, 0)");
    }
    const snippet = page.locator(".fui-snippet").first();
    expect(await snippet.locator(".fui-snippet-code").evaluate((node) => getComputedStyle(node).direction)).toBe("ltr");
    const [box, line, copy] = await snippet.evaluate((node) => {
      const of = (element: Element) => {
        const rectangle = element.getBoundingClientRect();
        return { left: rectangle.left, right: rectangle.right };
      };
      const range = document.createRange();
      range.selectNodeContents(node.querySelector(".fui-snippet-line")!);
      return [of(node), of(range as unknown as Element), of(node.querySelector(".fui-snippet-copy")!)];
    });
    // The text starts at the left and the key is at the right, clear of it.
    expect(line!.left - box!.left, dir).toBeLessThan(40);
    expect(box!.right - copy!.right, dir).toBeLessThan(12);
    expect(copy!.left, dir).toBeGreaterThan(line!.left + 40);
  }
});

test("a suggestion card's text, the skip link and the selection bar start at the inline start", async ({ page }) => {
  for (const dir of ["ltr", "rtl"] as const) {
    await open(page, "patterns-generic--suggestion-cards", dir);
    expect(await page.locator(".fui-suggestion-card").first().evaluate((node) => getComputedStyle(node).textAlign)).toBe("start");
    const card = await rect(page, ".fui-suggestion-card");
    const title = await rect(page, ".fui-suggestion-card-title");
    if (dir === "ltr") expect(title.left - card.left).toBeLessThan(card.right - title.right + 60);
    else expect(card.right - title.right).toBeLessThan(title.left - card.left + 60);

    await open(page, "tests-foundation--accounts", dir);
    const skip = await page.locator(".fui-skip-link").evaluate((node) => {
      const style = getComputedStyle(node);
      return [style.left, style.right];
    });
    if (dir === "ltr") expect(skip[0]).toBe("8px");
    else expect(skip[1]).toBe("8px");
    expect(skip[dir === "ltr" ? 1 : 0]).not.toBe("8px");

    await open(page, "tests-commands--bulk", dir);
    const bar = page.locator(".fui-bulk-actions:not([data-empty])").first();
    await expect(bar).toBeVisible();
    const padding = await bar.evaluate((node) => [getComputedStyle(node).paddingLeft, getComputedStyle(node).paddingRight]);
    expect(padding, dir).toEqual(dir === "ltr" ? ["16px", "8px"] : ["8px", "16px"]);
  }
});
