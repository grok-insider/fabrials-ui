import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// The chat pieces in a right-to-left page. The clock is fixed so nothing counts while a picture is taken.
const STORY = "/iframe.html?id=tests-ai-rtl--pieces&viewMode=story";
const NOW = new Date("2026-11-10T10:00:00Z");

// Storybook's own accessibility panel may be running axe in the same frame: wait for it rather than fail.
async function audit(page: Page) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    } catch (error) {
      if (!String(error).includes("Axe is already running") || attempt === 3) throw error;
      await page.waitForTimeout(200);
    }
  }
}

async function open(page: Page, theme = "light", story = STORY) {
  await page.clock.setFixedTime(NOW);
  await page.goto(`${story}&globals=theme:${theme}`);
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

/** What a system colour is in this palette, asked of a probe that is not itself forced. */
async function palette(page: Page) {
  return page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.forcedColorAdjust = "none";
    document.body.append(probe);
    const out: Record<string, string> = {};
    for (const name of ["Canvas", "CanvasText", "Highlight", "LinkText", "GrayText", "ButtonText"]) {
      probe.style.backgroundColor = name;
      out[name] = getComputedStyle(probe).backgroundColor;
    }
    probe.remove();
    return out;
  });
}

/** Computed styles of the first match of `selector` (or of its pseudo-element), by property name in camelCase. */
function style(page: Page, selector: string, properties: string[], pseudo?: string): Promise<Record<string, string>> {
  return page.evaluate(
    ([sel, props, pseudoElement]) => {
      const element = document.querySelector(sel as string);
      if (!element) throw new Error(`no ${sel}`);
      const computed = getComputedStyle(element, (pseudoElement as string | undefined) || null) as unknown as Record<string, string>;
      return Object.fromEntries((props as string[]).map((name) => [name, computed[name]!]));
    },
    [selector, properties, pseudo] as const,
  );
}

for (const theme of ["light", "dark"]) {
  for (const width of [390, 768, 1440]) {
    test(`ai rtl ${theme} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 960 });
      await open(page, theme);
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark).*$/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const result = await audit(page);
      expect(result.violations).toEqual([]);
      await expect(page).toHaveScreenshot(`ai-rtl-${theme}-${width}.png`, { fullPage: true });
    });
  }
}

test("markdown turns: markers and the quote's bar on the right, the table's heads read from the right, code still left to right", async ({ page }) => {
  await open(page);
  const answer = page.locator('.fui-chat-message[data-role="assistant"] > .fui-chat-message-body > .fui-markdown').first();
  const layout = await answer.evaluate((node) => {
    const box = (element: Element) => element.getBoundingClientRect();
    const textBox = (element: Element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return range.getBoundingClientRect();
    };
    const list = node.querySelector("ol")!;
    const item = list.querySelector("li")!;
    const quote = node.querySelector("blockquote")!;
    const head = node.querySelector("th")!;
    const code = node.querySelector(".fui-code-block")!;
    const body = code.querySelector(".fui-code-block-body")!;
    const line = body.querySelector(".fui-code-line")!;
    const listStyle = getComputedStyle(list);
    const quoteStyle = getComputedStyle(quote);
    return {
      listPadding: [listStyle.paddingLeft, listStyle.paddingRight],
      itemInset: box(list).right - textBox(item).right,
      itemPadding: [getComputedStyle(item).paddingLeft, getComputedStyle(item).paddingRight],
      quoteBorder: [quoteStyle.borderLeftWidth, quoteStyle.borderRightWidth],
      quotePadding: [quoteStyle.paddingLeft, quoteStyle.paddingRight],
      headAlign: getComputedStyle(head).textAlign,
      headInset: [textBox(head).left - box(head).left, box(head).right - textBox(head).right],
      codeDirection: getComputedStyle(body).direction,
      codeTextLeft: textBox(line).left - box(body).left,
      // The header follows the page: the file's name starts at the right, the copy key sits at the left.
      headerDirection: getComputedStyle(code.querySelector(".fui-code-block-header")!).direction,
      copyLeft: box(code.querySelector(".fui-code-block-actions")!).left - box(code).left,
      nameRight: box(code).right - box(code.querySelector(".fui-code-block-filename")!).right,
      inlineCode: getComputedStyle(node.querySelector("p > code")!).direction,
    };
  });
  expect(layout.listPadding).toEqual(["0px", "22px"]);
  expect(layout.itemPadding).toEqual(["0px", "4px"]);
  expect(layout.itemInset).toBeGreaterThanOrEqual(26);
  expect(layout.itemInset).toBeLessThan(30);
  expect(layout.quoteBorder).toEqual(["0px", "2px"]);
  expect(layout.quotePadding).toEqual(["0px", "16px"]);
  expect(layout.headAlign).toBe("start");
  expect(layout.headInset[1]).toBeLessThan(14);
  expect(layout.headInset[0]).toBeGreaterThan(layout.headInset[1]!);
  expect(layout.codeDirection).toBe("ltr");
  expect(layout.codeTextLeft).toBeLessThan(80);
  expect(layout.headerDirection).toBe("rtl");
  expect(layout.copyLeft).toBeLessThan(8);
  expect(layout.nameRight).toBeLessThan(48);
});

test("a message turns: the question sits at the left, the answer's actions start at its right edge", async ({ page }) => {
  await open(page);
  const layout = await page.evaluate(() => {
    const box = (element: Element) => element.getBoundingClientRect();
    const user = document.querySelector('.fui-chat-message[data-role="user"]')!;
    const assistant = document.querySelector('.fui-chat-message[data-role="assistant"]')!;
    const actions = assistant.querySelector(":scope > .fui-message-actions")!;
    const userActions = user.querySelector(":scope > .fui-message-actions")!;
    return {
      bubbleLeft: box(user.querySelector(".fui-chat-message-body")!).left - box(user).left,
      bubbleRight: box(user).right - box(user.querySelector(".fui-chat-message-body")!).right,
      // The first action (copy) is the rightmost one, its hit area hanging 8 px past the text's edge.
      copyRight: box(actions.querySelector("button")!).right - box(assistant).right,
      actionsMargin: [getComputedStyle(actions).marginLeft, getComputedStyle(actions).marginRight],
      timeLeftOfCopy: box(actions.querySelector("time")!).right < box(actions.querySelector("button")!).left,
      // Under the question the row runs the other way: the copy key is at the bubble's side, the left.
      userCopyLeft: box(userActions.querySelector("button")!).left - box(user).left,
    };
  });
  expect(layout.bubbleLeft).toBe(0);
  expect(layout.bubbleRight).toBeGreaterThan(40);
  expect(layout.copyRight).toBe(8);
  expect(layout.actionsMargin).toEqual(["0px", "-8px"]);
  expect(layout.timeLeftOfCopy).toBe(true);
  expect(layout.userCopyLeft).toBe(0);
});

test("activity turns: the trigger hangs at the right, the body's rule and a search's rail are on the right, the chevron keeps its size", async ({ page }) => {
  await open(page);
  const layout = await page.evaluate(() => {
    const box = (element: Element) => element.getBoundingClientRect();
    const reasoning = document.querySelector(".fui-reasoning")!;
    const trigger = reasoning.querySelector(".fui-activity-trigger")!;
    const body = reasoning.querySelector(".fui-activity-body")!;
    const bodyStyle = getComputedStyle(body);
    const step = document.querySelector(".fui-search-step")!;
    const chevron = trigger.querySelector(".fui-activity-chevron")!;
    const sources = document.querySelector(".fui-sources-trigger")!;
    const previews = [...sources.querySelectorAll(".fui-sources-preview-item")].map((item) => box(item).left);
    const page = [...document.querySelectorAll(".fui-search-step")].find((item) => item.querySelector(".fui-search-step-open"))!;
    return {
      triggerRight: box(trigger).right - box(reasoning).right,
      triggerAlign: getComputedStyle(trigger).textAlign,
      iconRightOfLabel: box(trigger.querySelector(".fui-activity-icon")!).left > box(trigger.querySelector(".fui-activity-label")!).right,
      chevronLeftOfLabel: box(chevron).right < box(trigger.querySelector(".fui-activity-label")!).left,
      chevron: [box(chevron).width, box(chevron).height, getComputedStyle(chevron).opacity],
      bodyBorder: [bodyStyle.borderLeftWidth, bodyStyle.borderRightWidth],
      bodyPadding: [bodyStyle.paddingLeft, bodyStyle.paddingRight],
      bodyMargin: [bodyStyle.marginLeft, bodyStyle.marginRight],
      railRightOfText: box(step.querySelector(".fui-search-step-rail")!).left > box(step.querySelector(".fui-search-step-text")!).right,
      countLeftOfText: box(step.querySelector(".fui-search-step-sources, .fui-search-step-count")!).right < box(step.querySelector(".fui-search-step-query")!).right,
      // The stacked marks of a sources trigger overlap towards the reading direction: each next one further left.
      previewsRunLeft: previews.every((left, index) => index === 0 || left < previews[index - 1]!),
      sourcesChevronLeft: box(sources.querySelector(".fui-activity-chevron")!).left - box(sources).left,
      // The arrow of a link that leaves the page points up and to the left.
      openArrow: getComputedStyle(page.querySelector(".fui-search-step-open svg")!).scale,
      // A path keeps its slash in front: the address reads left to right, ending beside the title.
      meta: [...document.querySelectorAll(".fui-source-card .fui-source-meta")].map((meta) => {
        const range = document.createRange();
        range.selectNodeContents(meta);
        return { direction: getComputedStyle(meta).direction, gap: box(meta.previousElementSibling!).left - range.getBoundingClientRect().right };
      }),
    };
  });
  for (const meta of layout.meta) {
    expect(meta.direction).toBe("ltr");
    expect(meta.gap).toBe(8);
  }
  expect(layout.triggerRight).toBe(8);
  expect(layout.triggerAlign).toBe("start");
  expect(layout.iconRightOfLabel).toBe(true);
  expect(layout.chevronLeftOfLabel).toBe(true);
  expect(layout.chevron).toEqual([14, 14, "0.6"]);
  expect(layout.bodyBorder).toEqual(["0px", "1px"]);
  expect(layout.bodyPadding).toEqual(["0px", "16px"]);
  expect(layout.bodyMargin).toEqual(["0px", "8px"]);
  expect(layout.railRightOfText).toBe(true);
  expect(layout.countLeftOfText).toBe(true);
  expect(layout.previewsRunLeft).toBe(true);
  expect(layout.sourcesChevronLeft).toBeLessThan(12);
  expect(layout.openArrow).toBe("-1 1");
});

test("the results of a search keep each address in order: its mark at the right, then the host before the path", async ({ page }) => {
  await open(page);
  const head = page.locator("button.fui-search-step-head").first();
  await head.click();
  await expect(head).toHaveAttribute("aria-expanded", "true");
  const result = page.locator(".fui-search-result").first();
  await expect(result).toBeVisible();
  const layout = await result.evaluate((node) => {
    const box = (element: Element) => element.getBoundingClientRect();
    const host = box(node.querySelector(".fui-search-result-host")!);
    const path = box(node.querySelector(".fui-search-result-path")!);
    const mark = box(node.querySelector(".fui-source-favicon")!);
    return { hostBeforePath: host.right <= path.left, markAfterPath: path.right <= mark.left, markRight: box(node).right - mark.right, path: node.querySelector(".fui-search-result-path")!.textContent };
  });
  expect(layout.path).toBe("/docs/css/cascade-layers");
  expect(layout.hostBeforePath).toBe(true);
  expect(layout.markAfterPath).toBe(true);
  expect(layout.markRight).toBe(12);
});

test("attachments turn: the remove key is at the left of a tile and of a chip, the percentage at the left too", async ({ page }) => {
  await open(page);
  const layout = await page.evaluate(() => {
    const box = (element: Element) => element.getBoundingClientRect();
    const tile = document.querySelector('.fui-attachments:not([data-size]) .fui-attachment[data-variant="grid"][data-status="uploading"]')!;
    const small = document.querySelector('.fui-attachments[data-size="sm"] .fui-attachment[data-variant="grid"]')!;
    const chip = document.querySelector('.fui-attachment[data-variant="inline"]')!;
    const chipStyle = getComputedStyle(chip);
    return {
      tileKey: [box(tile.querySelector(".fui-attachment-remove")!).left - box(tile).left, box(tile).right - box(tile.querySelector(".fui-attachment-remove")!).right],
      smallKey: [box(small.querySelector(".fui-attachment-remove")!).left - box(small).left, box(small).right - box(small.querySelector(".fui-attachment-remove")!).right],
      percentLeft: box(tile.querySelector(".fui-attachment-percent")!).left - box(tile).left,
      chipKeyLeft: box(chip.querySelector(".fui-attachment-remove")!).left - box(chip).left,
      chipPadding: [chipStyle.paddingLeft, chipStyle.paddingRight],
      chipPreviewRight: box(chip).right - box(chip.querySelector(".fui-attachment-preview")!).right,
    };
  });
  // 6 px from the tile's inline end (its border is 1 px), which is the left.
  expect(layout.tileKey[0]).toBe(7);
  expect(layout.tileKey[1]).toBeGreaterThan(60);
  expect(layout.smallKey[0]).toBe(5);
  expect(layout.smallKey[1]).toBeGreaterThan(25);
  expect(layout.percentLeft).toBe(5);
  expect(layout.chipKeyLeft).toBe(5);
  expect(layout.chipPadding).toEqual(["4px", "6px"]);
  expect(layout.chipPreviewRight).toBe(7);
});

test("the composer turns: tools at the right, send at the left, the recording dot on the mic's left", async ({ page }) => {
  await open(page);
  const layout = await page.evaluate(() => {
    const box = (element: Element) => element.getBoundingClientRect();
    const composer = document.querySelector(".fui-composer")!;
    const voice = composer.querySelector('.fui-voice-button[data-status="recording"]')!;
    const dot = voice.querySelector(".fui-voice-dot")!;
    const icon = voice.querySelector(".fui-voice-icon")!;
    return {
      toolsRight: box(composer).right - box(composer.querySelector(".fui-composer-tools")!).right,
      sendLeft: box(composer.querySelector(".fui-composer-send")!).left - box(composer).left,
      inputDirection: getComputedStyle(composer.querySelector("textarea")!).direction,
      // The dot scales with the level, so compare centres: 4 px past the icon's left edge, less half its own 6 px.
      dotCentre: box(dot).left + box(dot).width / 2 - box(icon).left,
      timerLeftOfIcon: box(voice.querySelector(".fui-voice-timer")!).right < box(icon).left,
    };
  });
  expect(layout.toolsRight).toBeLessThan(12);
  expect(layout.sendLeft).toBeLessThan(12);
  expect(layout.inputDirection).toBe("rtl");
  expect(layout.dotCentre).toBe(-1);
  expect(layout.timerLeftOfIcon).toBe(true);
});

test("marks that draw a direction are mirrored; a tick, a wave and the page's own marks are not", async ({ page }) => {
  await open(page);
  const scale = (selector: string) => page.locator(selector).first().evaluate((node) => getComputedStyle(node).scale);
  for (const variant of ["scan", "lines", "type"]) expect(await scale(`svg.fui-agent-mark[data-variant="${variant}"]`)).toBe("-1 1");
  expect(await scale(".fui-task-mark-icon")).toBe("none");
  // A page is written from the right: its rows start at the right edge and their cells are drawn from there.
  const row = await page.locator(".fui-generation-page > span").first().evaluate((node) => {
    const frame = node.parentElement!.getBoundingClientRect();
    const box = node.getBoundingClientRect();
    return { right: frame.right - box.right, left: box.left - frame.left, image: getComputedStyle(node).backgroundImage };
  });
  expect(row.right).toBe(0);
  expect(row.left).toBeGreaterThan(10);
  expect(row.image).toContain("270deg");
  // The same marks in a left-to-right page are as they were.
  await open(page, "light", "/iframe.html?id=tests-agents--pieces&viewMode=story");
  for (const variant of ["scan", "lines", "type"]) expect(await scale(`svg.fui-agent-mark[data-variant="${variant}"]`)).toBe("none");
  expect(await page.locator(".fui-generation-page > span").first().evaluate((node) => getComputedStyle(node).backgroundImage)).toContain("90deg");
});

test("an answer arriving ends in a caret at the left of its last letter", async ({ page }) => {
  await open(page);
  const answer = page.locator(".fui-chat-message[data-streaming]");
  await expect(answer.locator(".fui-stream-caret")).toHaveAttribute("aria-hidden", "true");
  await expect
    .poll(() =>
      answer.evaluate((node) => {
        const text = node.querySelector(".fui-markdown p")!.firstChild as Text;
        const range = document.createRange();
        range.setStart(text, text.length - 1);
        range.setEnd(text, text.length);
        const letter = range.getBoundingClientRect();
        const mark = node.querySelector(".fui-stream-caret")!.getBoundingClientRect();
        const gap = letter.left - mark.right;
        return gap >= 0 && gap < 6 && Math.abs(mark.top + mark.height / 2 - (letter.top + letter.height / 2)) < 4;
      }),
    )
    .toBe(true);
});

test("forced colors: a chip and the question have an edge, pressed and recording a Highlight bar, a failure a dashed edge", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await open(page);
  const system = await palette(page);
  expect(new Set(Object.values(system)).size).toBeGreaterThan(3);

  // A citation chip was a fill: now an edge in the link's ink; while its source is pointed at, a Highlight bar under it.
  expect(await style(page, ".fui-citation-chip", ["outlineStyle", "outlineWidth", "outlineColor"])).toEqual({ outlineStyle: "solid", outlineWidth: "1px", outlineColor: system.LinkText });
  expect((await style(page, ".fui-citation-chip", ["content"], "::after")).content).toBe("none");
  await page.locator(".fui-citation-chip").first().hover();
  await expect(page.locator(".fui-citation-chip").first()).toHaveAttribute("data-active", "true");
  expect(await style(page, ".fui-citation-chip[data-active]", ["backgroundColor", "height", "position"], "::after")).toEqual({ backgroundColor: system.Highlight, height: "2px", position: "absolute" });
  // The card of the same source, in the list below, carries a bar at its start.
  expect(await style(page, ".fui-source-card[data-active]", ["backgroundColor", "width"], "::before")).toEqual({ backgroundColor: system.Highlight, width: "3px" });
  expect(await style(page, ".fui-source-number", ["outlineStyle", "outlineColor"])).toEqual({ outlineStyle: "solid", outlineColor: system.LinkText });
  await page.mouse.move(0, 0);

  // The question's bubble.
  expect(await style(page, '.fui-chat-message[data-role="user"] > .fui-chat-message-body', ["outlineStyle", "outlineWidth", "outlineColor"])).toEqual({
    outlineStyle: "solid",
    outlineWidth: "1px",
    outlineColor: system.CanvasText,
  });

  // A pressed toggle: a Highlight edge and a bar under its label, on a pseudo-element. An unpressed one has neither.
  const pressed = '.fui-composer-pill[data-state="on"]';
  expect(await style(page, pressed, ["borderTopColor", "borderTopWidth", "borderTopStyle"])).toEqual({ borderTopColor: system.Highlight, borderTopWidth: "1px", borderTopStyle: "solid" });
  expect(await style(page, pressed, ["backgroundColor", "height", "position", "bottom"], "::after")).toEqual({ backgroundColor: system.Highlight, height: "3px", position: "absolute", bottom: "2px" });
  const off = '.fui-composer-pill[data-state="off"]';
  expect((await style(page, off, ["content"], "::after")).content).toBe("none");
  expect((await style(page, off, ["borderTopColor"])).borderTopColor).not.toBe(system.Highlight);
  // The bar is inside the pill and under its label.
  const bar = await page.locator(pressed).evaluate((node) => {
    const pill = node.getBoundingClientRect();
    const label = node.querySelector("span")!.getBoundingClientRect();
    const after = getComputedStyle(node, "::after");
    return { width: Number.parseFloat(after.width), pill: pill.width, underLabel: pill.bottom - 2 - 3 >= label.bottom - 6 };
  });
  expect(bar.width).toBeGreaterThan(bar.pill - 12);
  expect(bar.underLabel).toBe(true);

  // Recording: the same bar, and the level dot in Highlight.
  const recording = '.fui-voice-button[data-status="recording"]';
  expect(await style(page, recording, ["backgroundColor", "height"], "::after")).toEqual({ backgroundColor: system.Highlight, height: "3px" });
  expect((await style(page, recording, ["borderTopColor"])).borderTopColor).toBe(system.Highlight);
  expect(await style(page, `${recording} .fui-voice-dot`, ["backgroundColor", "display"])).toEqual({ backgroundColor: system.Highlight, display: "block" });
  // What failed has a dashed edge.
  expect((await style(page, '.fui-voice-button[data-status="error"]', ["borderTopStyle", "borderTopWidth"]))).toEqual({ borderTopStyle: "dashed", borderTopWidth: "1px" });
  expect((await style(page, '.fui-attachment[data-variant="grid"][data-status="error"]', ["borderTopStyle"])).borderTopStyle).toBe("dashed");
  expect((await style(page, '.fui-attachment[data-variant="grid"][data-status="ready"]', ["borderTopStyle"])).borderTopStyle).toBe("solid");
  // A tile's remove key is a disc over the picture: it gets an edge, and the focus ring when it has focus.
  const remove = '.fui-attachment[data-variant="grid"] .fui-attachment-remove';
  expect(await style(page, remove, ["outlineStyle", "outlineWidth", "outlineColor"])).toEqual({ outlineStyle: "solid", outlineWidth: "1px", outlineColor: system.ButtonText });
  await page.locator(remove).first().focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(page.locator(remove).first()).toBeFocused();
  expect((await style(page, remove, ["outlineWidth"])).outlineWidth).not.toBe("1px");

  // A search at work: the step it is on has a Highlight badge, the rail between steps is drawn, the live dot is Highlight.
  expect(await style(page, ".fui-search-step[data-live] .fui-search-step-badge", ["borderTopColor", "outlineColor", "outlineStyle"])).toEqual({
    borderTopColor: system.Highlight,
    outlineColor: system.Highlight,
    outlineStyle: "solid",
  });
  expect((await style(page, ".fui-search-step:not([data-live]) .fui-search-step-badge", ["outlineStyle"])).outlineStyle).toBe("none");
  expect((await style(page, ".fui-search-step-rail", ["backgroundColor"], "::before")).backgroundColor).toBe(system.GrayText);
  expect((await style(page, ".fui-activity-icon[data-live] .fui-activity-dot", ["backgroundColor"])).backgroundColor).toBe(system.Highlight);

  // The composer's focus was a border colour and a shadow: now a ring.
  await page.locator(".fui-composer-input").focus();
  await page.keyboard.press("End");
  expect(await style(page, ".fui-composer", ["outlineStyle", "outlineWidth", "outlineColor"])).toEqual({ outlineStyle: "solid", outlineWidth: "2px", outlineColor: system.Highlight });
});

test("on paper: no actions, no bubble, a message keeps to its page and code wraps", async ({ page }) => {
  await open(page);
  expect((await style(page, ".fui-message-actions", ["display"])).display).toBe("flex");
  await page.emulateMedia({ media: "print" });
  expect((await style(page, ".fui-message-actions", ["display"])).display).toBe("none");
  expect((await style(page, ".fui-chat-message", ["breakInside"])).breakInside).toBe("avoid");
  expect(await style(page, '.fui-chat-message[data-role="user"] > .fui-chat-message-body', ["backgroundColor", "paddingLeft", "borderTopLeftRadius"])).toEqual({
    backgroundColor: "rgba(0, 0, 0, 0)",
    paddingLeft: "0px",
    borderTopLeftRadius: "0px",
  });
  expect((await style(page, ".fui-code-block .fui-code-line", ["whiteSpace"])).whiteSpace).toBe("pre-wrap");
  expect((await style(page, ".fui-code-block-body", ["overflowX"])).overflowX).toBe("visible");
  expect((await style(page, ".fui-code-block-actions", ["display"])).display).toBe("none");
  // A long line folds instead of running off the sheet.
  await page.goto("/iframe.html?id=tests-ai-chat--markdown-and-code&viewMode=story&globals=theme:light");
  await expect(page.locator(".fui-code-block").first()).toBeVisible();
  const widest = await page.evaluate(() => Math.max(...[...document.querySelectorAll(".fui-code-block-body, .fui-markdown > pre")].map((node) => node.scrollWidth - node.clientWidth)));
  expect(widest).toBeLessThanOrEqual(1);
});

test("the chevron of @fabrials/ui's Disclosure keeps its own size beside the chat styles", async ({ page }) => {
  await open(page, "light", "/iframe.html?id=tests-controls--disclosures&viewMode=story");
  // Both sheets are on the page: the chat one used to shrink this chevron to 14 px and fade it.
  const sheets = await page.evaluate(() => {
    const text = [...document.styleSheets].flatMap((sheet) => [...sheet.cssRules]).map((rule) => rule.cssText).join("\n");
    return { ui: text.includes(".fui-disclosure-summary"), ai: text.includes(".fui-activity-chevron") };
  });
  expect(sheets).toEqual({ ui: true, ai: true });
  const chevrons = await page.locator(".fui-disclosure .fui-disclosure-chevron").evaluateAll((nodes) =>
    nodes.map((node) => [node.getBoundingClientRect().width, node.getBoundingClientRect().height, getComputedStyle(node).opacity].join(" ")),
  );
  expect(chevrons.length).toBeGreaterThan(4);
  expect([...new Set(chevrons)]).toEqual(["16 16 1"]);
});

test("the pieces keep their keys in a right-to-left page", async ({ page }) => {
  await open(page);
  // A sources trigger closes and opens from the keyboard, and its chevron turns with it.
  const sources = page.locator(".fui-sources-trigger");
  await sources.focus();
  await expect(sources).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Enter");
  await expect(sources).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(".fui-sources-grid")).toHaveCount(0);
  expect(await sources.locator(".fui-activity-chevron").evaluate((node) => getComputedStyle(node).transform)).toBe("none");
  await page.keyboard.press("Space");
  await expect(sources).toHaveAttribute("aria-expanded", "true");
  expect(await sources.locator(".fui-activity-chevron").evaluate((node) => getComputedStyle(node).transform)).not.toBe("none");
  // The toggle says it is pressed; Tab from the attach key reaches it next, to its left.
  const attach = page.getByRole("button", { name: "إرفاق ملفات" });
  const search = page.getByRole("button", { name: "البحث في الويب" });
  await expect(search).toHaveAttribute("aria-pressed", "true");
  await attach.focus();
  await page.keyboard.press("Tab");
  await expect(search).toBeFocused();
  expect((await search.boundingBox())!.x).toBeLessThan((await attach.boundingBox())!.x);
});
