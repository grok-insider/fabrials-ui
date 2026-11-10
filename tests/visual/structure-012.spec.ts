// 0.12, one way to copy: every key that copies keeps the state, the words, the timing and the name it had — a copy key
// renames itself to "Copied" as it always has, and a message's key does not (it is announced in a live region instead, so a
// screen reader hears it). Assertions read state and text, never pixels; the references belong to the pieces' own specs.
import { expect, test, type Page } from "@playwright/test";

const story = (id: string, theme = "light") => `/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`;

async function open(page: Page, id: string) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(story(id));
  await page.waitForFunction(() => (document.querySelector("#storybook-root")?.children.length ?? 0) > 0);
  await page.evaluate(() => document.fonts.ready);
}

test.describe("copying", () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  });

  test("a snippet puts the command on the clipboard, names the key as before and announces it", async ({ page }) => {
    await open(page, "tests-surfaces--pieces");
    const snippet = page.locator(".fui-snippet").first();
    const key = snippet.locator(".fui-copy-button");
    await expect(key).toHaveAccessibleName("Copy command");
    // The key's own words: a plain live region inside the button, never a second named region in the page.
    const region = snippet.locator("[aria-live]");
    await expect(region).toHaveText("");
    await key.click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("bun add @fabrials/ui");
    await expect(key).toHaveAttribute("data-copied", "true");
    await expect(key).toHaveAccessibleName("Copied");
    await expect(region).toHaveText("Copied");
    // And it goes quiet again on its own 1600 ms later.
    await expect(key).not.toHaveAttribute("data-copied", "true", { timeout: 4000 });
    await expect(region).toHaveText("");
  });

  test("a code panel says how the copy went, in its own words, and goes quiet again", async ({ page }) => {
    await open(page, "tests-surfaces--pieces");
    const panel = page.locator(".fui-code-panel").first();
    // One named region for the panel; the key inside it carries a plain live region only.
    const status = panel.locator(":scope > [role='status']");
    await expect(status).toHaveText("");
    const key = panel.locator(".fui-copy-button");
    await expect(key).toHaveAccessibleName("Copy code");
    await key.click();
    await expect(status).toHaveText("Copied to clipboard");
    await expect(status).toHaveAttribute("data-state", "copied");
    await expect(status).toHaveClass(/fui-sr-only/);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("const total = 3;");
    await expect(status).toHaveText("", { timeout: 4000 });
  });

  test("a code block copies its code and marks the key for its own 2000 ms", async ({ page }) => {
    await open(page, "tests-surfaces--pieces");
    const block = page.locator(".fui-code-block").first();
    const key = block.locator(".fui-code-block-action").first();
    await expect(key).toHaveAccessibleName("Copy code");
    await key.click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("const total = 3;");
    await expect(key).toHaveAttribute("data-copied", "true");
    await expect(key).toHaveAccessibleName("Copied");
    // Its neighbours are untouched: a copy is that key's news only.
    await expect(page.locator(".fui-code-panel").first().locator(":scope > [role='status']")).toHaveText("");
    await expect(key).not.toHaveAttribute("data-copied", "true", { timeout: 4500 });
  });

  test("a message's copy key keeps its name, and the region beside it holds the words", async ({ page }) => {
    await open(page, "tests-ai-chat--messages");
    const actions = page.locator(".fui-message-actions").first();
    const copy = actions.locator("button").first();
    const region = actions.locator('[role="status"]');
    await expect(region).toHaveText("");
    await copy.click();
    await expect(region).toHaveText("Copied");
    // The key still answers to its own name while the icon shows the copy: this is the one that used to rename itself.
    await expect(copy).toHaveAccessibleName("Copy");
    await expect(copy).toHaveAttribute("data-copied", "true");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("How should hosts import the shared styles?");
    await expect(region).toHaveText("", { timeout: 4000 });
  });
});
