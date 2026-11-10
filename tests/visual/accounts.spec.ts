import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { es, esProvider, esReset, esStatus } from "../../stories/accounts-es";
import {
  apiKeyFieldsLabels,
  apiKeyFormLabels,
  balanceCardLabels,
  consumptionViewLabels,
  linkedAccountUsageLabels,
  migrationReviewLabels,
  observationStatusLabels,
  privateHistoryLabels,
  providerCardLabels,
  resetInventoryLabels,
  routingExplanationLabels,
  routingPolicyFormLabels,
  synchronizedAccountsLabels,
} from "../../packages/ai-ui/src/accounts-labels";

// The accounts and usage family in fixed states. The clock is fixed so every "Updated 09:58" and every reset credit reads the
// same on every run, and the proposals that come from a promise are awaited before the picture is taken.
const STORY = "/iframe.html?id=tests-accounts-and-usage--pieces&viewMode=story";
const NOW = new Date("2026-03-12T09:00:00Z");

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
  await page.clock.setFixedTime(NOW);
  await page.goto(`${STORY}&globals=theme:${theme}`);
  await expect(page.locator("#storybook-root h1").first()).toBeVisible();
  await settle(page);
}

/** Everything a promise brings: the consumption, the three history states and the migration's sessions. */
async function settle(page: Page) {
  await expect(page.getByText("Loading consumption…")).toHaveCount(0);
  await expect(page.getByText("No synchronized observations yet")).toBeVisible();
  await expect(page.getByText("The relay did not answer. Try again in a minute.")).toBeVisible();
  await expect(page.locator(".fb-log-button")).toHaveCount(2);
  await page.evaluate(() => document.fonts.ready);
}

const block = (page: Page, name: string) =>
  page.locator("section").filter({ has: page.getByRole("heading", { name, exact: true }) }).last();

for (const theme of ["light", "dark"]) {
  for (const width of [390, 768, 1440]) {
    test(`accounts ${theme} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, theme);
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark).*$/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const result = await audit(page);
      expect(result.violations).toEqual([]);
      await expect(page).toHaveScreenshot(`accounts-${theme}-${width}.png`, { fullPage: true });
    });
  }
}

test("the key form is a keyboard form: three fields in order, Enter saves, the key is a password and is emptied", async ({ page }) => {
  await open(page);
  const form = block(page, "An API key").locator("form").first();
  const provider = form.getByLabel("Provider");
  const alias = form.getByLabel("Account name");
  const key = form.getByLabel("API key");
  await expect(key).toHaveAttribute("type", "password");
  await provider.focus();
  await page.keyboard.press("Tab");
  await expect(alias).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(key).toBeFocused();
  await page.keyboard.type("sk-ada-0000-1111");
  // Never in the page's own words, and never as a text field.
  await expect(page.getByText("sk-ada-0000-1111")).toHaveCount(0);
  await alias.fill("ada-work");
  await key.fill("sk-ada-0000-1111");
  await key.press("Enter");
  await expect(form.getByRole("status")).toHaveText("Saved openai/ada-work. The key has not been verified with the provider.");
  await expect(key).toHaveValue("");
});

test("a save that fails is announced in an alert, keeps the key in its field, and leaves the person where they were", async ({ page }) => {
  await open(page);
  const form = block(page, "An API key").locator("form").last();
  await form.getByLabel("Account name").fill("ada-work");
  const key = form.getByLabel("API key");
  await key.fill("sk-ada-0000-1111");
  const submit = form.getByRole("button", { name: "Save API key" });
  await submit.click();
  await expect(form.getByRole("alert")).toHaveText("The provider refused the key. Check it and try again.");
  await expect(form.getByRole("status")).toHaveCount(0);
  // Nothing was thrown away: the key is still there, still a password, and the button is the thing under the focus.
  await expect(key).toHaveAttribute("type", "password");
  await expect(key).toHaveValue("sk-ada-0000-1111");
  await expect(submit).toBeFocused();
});

test("routing is a checkbox, a number and a button that waits for a change", async ({ page }) => {
  await open(page);
  const routing = block(page, "Routing").locator("form").first();
  const check = routing.getByRole("checkbox");
  const save = routing.getByRole("button", { name: "Save routing preferences" });
  await expect(check).not.toBeChecked();
  await expect(routing.getByText("Unpinned requests use the active account.")).toBeVisible();
  await check.focus();
  await page.keyboard.press("Space");
  await expect(check).toBeChecked();
  await expect(routing.getByText("The highest-ranked eligible account receives the next unpinned request.")).toBeVisible();
  await expect(save).toBeEnabled();
  const limit = routing.getByRole("spinbutton");
  await limit.fill("0");
  await expect(save).toBeDisabled();
  await limit.fill("75");
  await expect(save).toBeEnabled();
  // A pending form says so and takes nothing.
  const pending = block(page, "Routing").locator("form").nth(2);
  await expect(pending.getByRole("button", { name: "Saving…" })).toBeDisabled();
  await expect(pending.getByRole("checkbox")).toBeDisabled();
});

test("a migration invites, copies, and only approves a review the person has read", async ({ page }) => {
  await open(page);
  const migration = block(page, "A migration");
  const create = migration.getByRole("button", { name: "Create invitation" });
  await create.click();
  const secret = migration.getByLabel("Invitation secret");
  await expect(secret).toHaveAttribute("type", "password");
  await expect(secret).toHaveValue("secret-ada-0000-1111");
  await expect(migration.getByRole("button", { name: "Copy invitation secret" })).toBeVisible();
  await expect(migration.getByLabel("Session ID")).toHaveValue("invitation-ada-01");
  // Hide it again: the secret is gone from the page.
  await migration.getByRole("button", { name: "Hide invitation" }).click();
  await expect(migration.getByLabel("Invitation secret")).toHaveCount(0);
  // A session in review: the check comes first, then the key.
  await migration.locator(".fb-log-button").first().click();
  const approve = migration.getByRole("button", { name: "Approve review" });
  await expect(approve).toBeDisabled();
  const confirm = migration.getByRole("checkbox");
  await confirm.focus();
  await page.keyboard.press("Space");
  await expect(approve).toBeEnabled();
});

test("a disclosure opens from the keyboard and the table under it is reachable", async ({ page }) => {
  await open(page);
  const provider = block(page, "A provider");
  const expiry = provider.locator("summary", { hasText: "View expiry dates" }).first();
  await expiry.focus();
  await page.keyboard.press("Enter");
  await expect(expiry.locator("xpath=..")).toHaveAttribute("open", "");
  await expect(provider.getByText("Reset 1").first()).toBeVisible();

  const consumption = block(page, "Consumption");
  const status = consumption.locator("summary", { hasText: "Source status" }).first();
  await status.focus();
  await page.keyboard.press("Enter");
  await expect(consumption.getByText("One day could not be read.").first()).toBeVisible();

  // A table that fits is not a tab stop; one in a pane too narrow for it is, and the keyboard can reach it.
  const narrow = page.locator('[data-testid="narrow-table"] .fui-table-scroll');
  await expect(narrow).toHaveAttribute("role", "region");
  await expect(narrow).toHaveAttribute("aria-label", "Scrollable table");
  expect(await narrow.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
  await expect(narrow).toHaveAttribute("tabindex", "0");
  await narrow.focus();
  await expect(narrow).toBeFocused();
  const fits = consumption.getByRole("region", { name: "Scrollable table" }).first();
  expect(await fits.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(false);
  await expect(fits).not.toHaveAttribute("tabindex", "0");
});

test("the Spanish frame says nothing in the defaults' English", async ({ page }) => {
  await open(page);
  const frame = block(page, "En español");
  const spoken = [
    (await frame.innerText()).replace(/\s+/g, " "),
    (await frame.evaluate((node) =>
      [...node.querySelectorAll("[aria-label], [title], [placeholder]")]
        .map((element) => ["aria-label", "title", "placeholder"].map((name) => element.getAttribute(name)).filter(Boolean).join(" "))
        .join(" "),
    )).replace(/\s+/g, " "),
  ].join(" ");
  const pairs = [
    [routingExplanationLabels, es.routingExplanation],
    [routingPolicyFormLabels, es.routingPolicyForm],
    [resetInventoryLabels, esReset],
    [observationStatusLabels, esStatus],
    [balanceCardLabels, es.balance],
    [providerCardLabels, esProvider],
    [linkedAccountUsageLabels, es.sources],
    [consumptionViewLabels, es.consumption],
    [apiKeyFormLabels, es.apiKeyForm],
    [apiKeyFieldsLabels, es.apiKeyFields],
    [migrationReviewLabels, es.review],
    [synchronizedAccountsLabels, es.accounts],
    [privateHistoryLabels, es.history],
  ] as const;
  const left: string[] = [];
  for (const [english, spanish] of pairs) {
    const translated = new Set(words(spanish));
    for (const word of words(english)) {
      // "Tokens" is the same word in both languages: only a word that the Spanish keeps in English is a leak.
      if (word.length > 3 && !translated.has(word) && whole(spoken, word)) left.push(word);
    }
  }
  expect([...new Set(left)]).toEqual([]);
  // And the numbers follow the language too: a Spanish total writes its thousands with a dot.
  await expect(frame.getByText("322.560")).toBeVisible();
  await expect(frame.getByText("12,34 US$")).toBeVisible();
});

test("the right-to-left frame mirrors the rows and the labels", async ({ page }) => {
  await open(page);
  const frame = page.locator('[dir="rtl"]').last();
  const row = frame.locator(".fb-row").first();
  const boxes = await row.evaluate((node) => {
    const [first, second] = [...node.children].map((child) => child.getBoundingClientRect());
    return { first: first!.left, second: second!.left, direction: getComputedStyle(node).direction };
  });
  expect(boxes.direction).toBe("rtl");
  // In a mirrored row the first thing said sits on the right.
  expect(boxes.first).toBeGreaterThan(boxes.second);
  // The reset credit's bar is drawn from the right edge.
  const warning = frame.locator(".fb-reset-warning").first();
  expect(await warning.evaluate((node) => getComputedStyle(node).borderInlineStartWidth)).toBe("3px");
  // A credit's name and its date swap sides, and the date is written left to right inside a mirrored row.
  const credit = await frame
    .locator(".fb-reset-details li")
    .first()
    .evaluate((node) => {
      const [name, when] = [...node.children].map((child) => child.getBoundingClientRect());
      return { name: name!.left, when: when!.left };
    });
  expect(credit.name).toBeGreaterThan(credit.when);
});

test("forced colors: a row that is a button draws an edge, and the warning keeps its bar", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await open(page);
  const row = page.locator(".fb-log-button").first();
  await row.hover();
  const edge = await row.evaluate((node) => {
    const style = getComputedStyle(node);
    return { width: style.outlineWidth, style: style.outlineStyle, offset: style.outlineOffset };
  });
  expect(edge).toEqual({ width: "2px", style: "solid", offset: "-2px" });
  const warning = await page.locator(".fb-reset-warning").first().evaluate((node) => getComputedStyle(node).borderInlineStartWidth);
  expect(warning).toBe("3px");
});

/** The word on its own, never the front of a longer one: "Client" is not inside "Cliente". */
function whole(text: string, word: string) {
  return new RegExp(`(^|[^\\p{L}\\p{N}])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}\\p{N}]|$)`, "u").test(text);
}

/** Every default string inside a labels object, so a whole frame can be checked against all of them at once. */
function words(value: unknown, found: string[] = []): string[] {
  if (typeof value === "string") found.push(value);
  else if (typeof value === "function") {
    try {
      const text = (value as (...args: string[]) => unknown)("1", "2");
      if (typeof text === "string") found.push(text);
    } catch {
      // A label that needs a number says nothing with two words.
    }
  } else if (value !== null && typeof value === "object") for (const child of Object.values(value)) words(child, found);
  return found;
}
