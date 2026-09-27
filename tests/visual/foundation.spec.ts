import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function audit(page: Page) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
    } catch (error) {
      if (!String(error).includes("Axe is already running") || attempt === 3)
        throw error;
      await page.waitForTimeout(200);
    }
  }
  throw new Error("Accessibility audit did not finish");
}

const stories: Record<string, string> = {
  controls: "fabrials-foundation--controls",
  accounts: "fabrials-foundation--accounts",
  states: "fabrials-foundation--states",
  enterprise: "fabrials-enterprise--preferences",
  catalogue: "fabrials-catalogue--gallery",
  "brand-tokens": "fabrials-brand--tokens",
  "brand-lockups": "fabrials-brand--lockups",
  components: "fabrials-components--gallery",
  console: "fabrials-patterns--console",
  "public-site": "fabrials-patterns--public-site",
  "sign-in": "fabrials-patterns--sign-in",
  settings: "fabrials-patterns--settings-page",
  monitoring: "fabrials-monitoring--gallery",
};

for (const theme of ["light", "dark"]) {
  for (const width of [390, 768, 1440]) {
    for (const story of Object.keys(stories)) {
      test(`${story} ${theme} ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 960 });
        const id = stories[story];
        await page.goto(
          `/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`,
        );
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator("html")).toHaveClass(
          theme === "dark" ? /dark/ : /^(?!.*dark).*$/,
        );
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        const result = await audit(page);
        expect(result.violations).toEqual([]);
        await expect(page).toHaveScreenshot(`${story}-${theme}-${width}.png`, {
          fullPage: true,
        });
      });
    }
  }
}

test("native preference controls retain form submission semantics", async ({ page }) => {
  await page.goto("/iframe.html?id=fabrials-enterprise--preferences&viewMode=story");
  await page.getByLabel("Density").selectOption("compact");
  await page.getByLabel("Notifications", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByRole("status")).toContainText("compact · notifications disabled");
});

test("dialog traps focus, validates and restores the trigger", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=fabrials-foundation--overlays&viewMode=story",
  );
  const trigger = page.getByRole("button", {
    name: "Add account",
    exact: true,
  });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Add account" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Account alias").fill("Engineering");
  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press("Tab");
    await expect
      .poll(() =>
        dialog.evaluate((element) => element.contains(document.activeElement)),
      )
      .toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.press("Enter");
  await dialog.getByLabel("Account alias").fill("Engineering");
  await dialog.getByRole("button", { name: "Save account" }).click();
  await expect(dialog).not.toBeVisible();
});

test("confirmation, menu and sheet retain their keyboard semantics", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=fabrials-foundation--overlays&viewMode=story",
  );
  await page
    .getByRole("button", { name: "Remove account", exact: true })
    .click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: "Keep account" }).click();
  await page.getByRole("button", { name: "More actions" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "More actions" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Open filters" }).click();
  await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
  const audit = await new AxeBuilder({ page }).analyze();
  expect(audit.violations).toEqual([]);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Open filters" }),
  ).toBeFocused();
});

test("selection is contextual and search can recover from no results", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=fabrials-foundation--accounts&viewMode=story",
  );
  await expect(
    page.getByRole("group", { name: "Selection actions" }),
  ).toHaveCount(0);
  await page
    .getByRole("checkbox", { name: "Select Engineering", exact: true })
    .check();
  await expect(page.getByText("1 selected", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Clear selection" }).click();
  await expect(
    page.getByRole("group", { name: "Selection actions" }),
  ).toHaveCount(0);
  await page.getByRole("searchbox").fill("does-not-exist");
  await expect(
    page.getByRole("heading", { name: "No matching accounts" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(page.getByRole("table")).toBeVisible();
});

test("select, tabs and reduced motion work without a host framework", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=fabrials-foundation--controls&viewMode=story",
  );
  await page.getByRole("combobox", { name: "Provider" }).click();
  await page.getByRole("option", { name: "Grok", exact: true }).click();
  await expect(page.getByRole("combobox")).toHaveText(/Grok/);
  await page.getByRole("tab", { name: "Overview" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Activity" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByText("No recent activity.")).toBeVisible();
  expect(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--fui-duration")
        .trim(),
    ),
  ).toBe("0ms");
});

test("200 percent text size does not cause page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 960 });
  await page.goto(
    "/iframe.html?id=fabrials-foundation--accounts&viewMode=story",
  );
  await expect(
    page.getByRole("heading", { name: "Accounts", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "Add account", exact: true }),
  ).toBeVisible();
});
