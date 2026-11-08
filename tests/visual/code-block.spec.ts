import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Code and markdown in an answer: the bench of rendered markdown with code blocks of every kind.
const STORY = "/iframe.html?id=tests-ai-chat--markdown-and-code&viewMode=story";

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

async function open(page: Page, theme = "light") {
  await page.goto(`${STORY}&globals=theme:${theme}`);
  await expect(page.locator(".fui-markdown h2").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

const block = (page: Page, name: string) => page.locator(".fui-code-block").filter({ has: page.getByRole("region", { name, exact: true }) });

for (const theme of ["light", "dark"]) {
  for (const width of [390, 768, 1440]) {
    test(`code and markdown ${theme} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 960 });
      await open(page, theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const result = await audit(page);
      expect(result.violations).toEqual([]);
      await expect(page).toHaveScreenshot(`code-markdown-${theme}-${width}.png`, { fullPage: true });
    });
  }
}

test("a code block paints in CodePanel's inks: a keyword is the keyword token", async ({ page }) => {
  await open(page);
  const inks = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.color = "var(--fui-syntax-keyword)";
    document.body.append(probe);
    const token = getComputedStyle(probe).color;
    probe.remove();
    const keyword = document.querySelector(".fui-code-block .fui-code-line .fui-token-keyword")!;
    return { token, keyword: getComputedStyle(keyword).color };
  });
  expect(inks.keyword).toBe(inks.token);
});

test("copy and download take the code as it ends up: without its removed lines, under the file's name", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await open(page);
  const sync = block(page, "sync.ts code");
  await expect(sync.locator("del.fui-code-line")).toHaveCount(1);
  await expect(sync.locator("ins.fui-code-line")).toHaveCount(1);
  await sync.getByRole("button", { name: "Copy code" }).click();
  await expect(sync.getByRole("button", { name: "Copied" })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).not.toContain("await fetch(url);");
  expect(copied).toContain("await withRetry(() => fetch(url), { attempts: 5 });");
  expect(copied.split("\n")).toHaveLength(5);
  const [download] = await Promise.all([page.waitForEvent("download"), sync.getByRole("button", { name: "Download file" }).click()]);
  expect(download.suggestedFilename()).toBe("sync.ts");
  const stream = await download.createReadStream();
  let text = "";
  for await (const chunk of stream) text += chunk;
  expect(text).toBe(copied);
});

test("a long line scrolls from the keyboard; wrapped, it folds under its own start, past the number", async ({ page }) => {
  await open(page);
  const regions = page.getByRole("region", { name: "js code", exact: true });
  const scrolling = regions.first();
  await scrolling.focus();
  await expect(scrolling).toBeFocused();
  expect(await scrolling.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => scrolling.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
  const wrapped = regions.nth(1);
  const fold = await wrapped.evaluate((node) => {
    const line = node.querySelector(".fui-code-line")!;
    const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
    const starts: number[] = [];
    let lastTop = -Infinity;
    for (let text = walker.nextNode() as Text | null; text; text = walker.nextNode() as Text | null) {
      for (let index = 0; index < text.length; index += 1) {
        if (!text.data[index]!.trim()) continue;
        const range = document.createRange();
        range.setStart(text, index);
        range.setEnd(text, index + 1);
        const box = range.getBoundingClientRect();
        if (box.top > lastTop + 2) {
          starts.push(Math.round(box.left));
          lastTop = box.top;
        }
      }
    }
    return { overflow: node.scrollWidth > node.clientWidth, starts };
  });
  expect(fold.overflow).toBe(false);
  // At least one fold, and every continuation starts where the line's text starts.
  expect(fold.starts.length).toBeGreaterThan(1);
  for (const start of fold.starts.slice(1)) expect(Math.abs(start - fold.starts[0]!)).toBeLessThanOrEqual(1);
});

test("a host's own lines keep the body's inset and are numbered too", async ({ page }) => {
  await open(page);
  const host = block(page, "ts code");
  const lines = host.locator("code > span");
  await expect(lines.first()).toContainText("type Theme");
  const inset = await host.evaluate((node) => {
    const body = node.querySelector(".fui-code-block-body")!;
    const line = body.querySelector("code > span")!;
    return {
      padding: getComputedStyle(body).paddingInlineStart,
      number: getComputedStyle(line, "::before").content,
    };
  });
  expect(inset.padding).toBe("16px");
  expect(inset.number).toContain("counter(fui-code-line)");
  const own = await block(page, "sync.ts code").evaluate((node) => getComputedStyle(node.querySelector(".fui-code-block-body")!).paddingInlineStart);
  expect(own).toBe("0px");
});

test("in a right-to-left page code still reads left to right, its numbers on the left", async ({ page }) => {
  await open(page);
  await page.evaluate(() => document.querySelector(".fui-markdown")!.setAttribute("dir", "rtl"));
  const layout = await block(page, "sync.ts code").evaluate((node) => {
    const body = node.querySelector(".fui-code-block-body")!;
    const line = body.querySelector(".fui-code-line")!;
    const text = line.querySelector(".fui-token-keyword")!.getBoundingClientRect();
    const number = getComputedStyle(line, "::before");
    return { direction: getComputedStyle(body).direction, header: getComputedStyle(node).direction, textLeft: text.left - body.getBoundingClientRect().left, numberWidth: number.width };
  });
  expect(layout.header).toBe("rtl");
  expect(layout.direction).toBe("ltr");
  // The first token starts just past the number column on the left, not at the right edge.
  expect(layout.textLeft).toBeLessThan(120);
  const inline = await page.locator(".fui-markdown :not(pre) > code").first().evaluate((node) => getComputedStyle(node).direction);
  expect(inline).toBe("ltr");
});

test("a language's logo keeps its colour; a black one takes the text's ink in the dark theme and every one the system's in forced colours", async ({ page }) => {
  const gallery = (theme: string) => page.goto(`/iframe.html?id=tests-docs-pieces--gallery&viewMode=story&globals=theme:${theme}`);
  const ink = (language: string) =>
    page.locator(`#storybook-root li .fui-language-icon[data-language="${language}"]`).first().evaluate((node) => ({
      icon: getComputedStyle(node).color,
      text: getComputedStyle(node.parentElement!).color,
    }));
  await gallery("light");
  await expect(page.locator("#docs-marks")).toBeVisible();
  expect((await ink("python")).icon).toBe("rgb(55, 118, 171)");
  expect((await ink("rust")).icon).toBe("rgb(0, 0, 0)");
  await gallery("dark");
  await expect(page.locator("#docs-marks")).toBeVisible();
  expect((await ink("python")).icon).toBe("rgb(55, 118, 171)");
  const rust = await ink("rust");
  expect(rust.icon).toBe(rust.text);
  await page.emulateMedia({ forcedColors: "active" });
  const forced = await ink("python");
  expect(forced.icon).toBe(forced.text);
});

test("code tabs show each sample's logo on its tab and copy the open one without its removed lines", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/iframe.html?id=tests-docs-pieces--gallery&viewMode=story&globals=theme:light");
  const tabs = page.locator(".fui-code-tabs").filter({ has: page.getByRole("tablist", { name: "One sample in three languages" }) });
  await expect(tabs.getByRole("tab")).toHaveCount(3);
  const logos = await tabs.getByRole("tab").evaluateAll((nodes) => nodes.map((node) => node.querySelector(".fui-language-icon")?.getAttribute("data-language")));
  expect(logos).toEqual(["python", "rust", "go"]);
  await tabs.getByRole("tab", { name: "Rust" }).click();
  await tabs.getByRole("button", { name: "Copy code" }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("let headers = fetch_headers(&mailbox_id)?;");
});

test("a task list has no bullets and named, read-only boxes", async ({ page }) => {
  await open(page);
  const boxes = page.locator(".fui-markdown li input[type=checkbox]");
  await expect(boxes).toHaveCount(2);
  await expect(page.getByRole("checkbox", { name: "Retry on 429 and 503" })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Log the attempt count" })).toBeDisabled();
  expect(await boxes.first().evaluate((node) => getComputedStyle(node.closest("li")!).listStyleType)).toBe("none");
});
