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

// The WCAG tags above do not include landmark structure (those rules are best practices). A sign-in page is a whole page: it must
// have exactly one main, nothing outside a landmark, and its aside at the top level.
async function auditLandmarks(page: Page) {
  return new AxeBuilder({ page })
    .withRules([
      "landmark-one-main",
      "region",
      "landmark-main-is-top-level",
      "landmark-no-duplicate-main",
      "landmark-complementary-is-top-level",
      "landmark-unique",
    ])
    .analyze();
}

const stories: Record<string, string> = {
  controls: "tests-foundation--controls",
  accounts: "tests-foundation--accounts",
  states: "tests-foundation--states",
  enterprise: "tests-enterprise--preferences",
  catalogue: "tests-catalogue--gallery",
  "brand-tokens": "foundations-brand--tokens",
  "brand-lockups": "foundations-brand--lockups",
  components: "tests-components-gallery--gallery",
  console: "patterns-product-pages--console",
  "public-site": "patterns-product-pages--public-site",
  "sign-in": "patterns-product-pages--sign-in",
  settings: "patterns-product-pages--settings-page",
  monitoring: "tests-monitoring--gallery",
  highstorm: "patterns-highstorm--landing",
  "highstorm-sign-in": "patterns-highstorm--sign-in",
  instrument: "patterns-instrument--landing-page",
  "instrument-workspace": "patterns-instrument--workspace-page",
  "instrument-pieces": "patterns-instrument--pieces-page",
  "shadcn-parts": "tests-shadcn-parts--gallery",
  "docs-pieces": "tests-docs-pieces--gallery",
  loading: "tests-loading--gallery",
  "controls-icon-buttons": "tests-controls--icon-buttons",
  "controls-toolbars": "tests-controls--toolbars",
  "controls-file-inputs": "tests-controls--file-inputs",
  "controls-disclosures": "tests-controls--disclosures",
  "controls-field-sets": "tests-controls--field-sets",
  "controls-toggles": "tests-controls--toggles",
  "controls-filters": "tests-controls--filters",
  "inputs-text-fields": "tests-inputs--text-fields",
  "inputs-numbers": "tests-inputs--numbers",
  "inputs-codes": "tests-inputs--codes",
  "dates-calendars": "tests-dates--calendars",
  "dates-pickers": "tests-dates--pickers",
  "collections-lists": "tests-collections--lists",
  "collections-panels": "tests-collections--panels",
  "media-people": "tests-media--people",
  "media-images": "tests-media--images",
  "media-viewer": "tests-media--viewer",
  "players-video": "tests-players--video",
  "players-sound": "tests-players--sound-and-animation",
  "documents-sheets": "tests-documents--sheets",
  "feedback-state-panels": "tests-feedback--state-panels",
  "feedback-confirmations": "tests-feedback--confirmations",
  "feedback-times": "tests-feedback--times",
  "feedback-keys": "tests-feedback--keys",
  "feedback-notices": "tests-feedback--notices",
  "feedback-tags": "tests-feedback--tags",
  "feedback-text": "tests-feedback--text",
  "structure-items": "tests-structure--items",
  "structure-header": "tests-structure--application-header",
  "structure-header-full": "tests-structure--full-width-header",
  "structure-navigation": "tests-structure--navigation",
  "structure-switcher-open": "tests-structure--switcher-open",
  "structure-sections": "tests-structure--sections",
  "structure-section-aside": "tests-structure--section-aside",
  "overlays-dialog-fixed": "tests-overlays--fixed-dialog",
  "overlays-dialog-long-title": "tests-overlays--long-title",
  "overlays-dialog-settings": "tests-overlays--settings-dialog",
  "overlays-sheet-non-modal": "tests-overlays--non-modal-sheet",
  "overlays-sheet-modal": "tests-overlays--modal-sheet",
  "overlays-keep-mounted": "tests-overlays--keep-mounted",
  "overlays-status-popovers": "tests-overlays--status-popovers",
  "commands-launcher": "tests-commands--launcher",
  "commands-launcher-outline": "tests-commands--launcher-outline",
  "commands-site-header": "tests-commands--in-the-site-header",
  "commands-options": "tests-commands--options",
  "commands-palette": "tests-commands--palette-dialog",
  "commands-tools": "tests-commands--tools",
  "commands-bulk": "tests-commands--bulk",
  "commands-bulk-parts": "tests-commands--bulk-parts",
  "auth-aside": "patterns-sign-in--aside-auto",
  "auth-aside-centred": "patterns-sign-in--aside-centred",
  "auth-centred": "patterns-sign-in--centred",
  "auth-start": "patterns-sign-in--start",
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
        // By selector, not by role: behind an open modal dialog the page is inert and out of the accessibility tree.
        await expect(page.locator("#storybook-root h1").first()).toBeVisible();
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
        if (story.startsWith("auth-")) expect((await auditLandmarks(page)).violations).toEqual([]);
        await expect(page).toHaveScreenshot(`${story}-${theme}-${width}.png`, {
          fullPage: true,
        });
      });
    }
  }
}

test("native preference controls retain form submission semantics", async ({ page }) => {
  await page.goto("/iframe.html?id=tests-enterprise--preferences&viewMode=story");
  await page.getByLabel("Density").selectOption("compact");
  await page.getByLabel("Notifications", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByRole("status")).toContainText("compact · notifications disabled");
});

test("dialog traps focus, validates and restores the trigger", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=tests-foundation--overlays&viewMode=story",
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
    "/iframe.html?id=tests-foundation--overlays&viewMode=story",
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
    "/iframe.html?id=tests-foundation--accounts&viewMode=story",
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
    "/iframe.html?id=tests-foundation--controls&viewMode=story",
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
    "/iframe.html?id=tests-foundation--accounts&viewMode=story",
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
