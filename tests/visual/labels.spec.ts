import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { LABEL_DEFAULTS } from "../../stories/labels-bench.stories";

// The same pieces as they ship, in a product's Spanish and in Arabic right to left. Nothing counts or moves here, so the
// pictures are the same every run.
const STORY = "/iframe.html?id=tests-labels--pieces&viewMode=story";
const CALENDARS = "/iframe.html?id=tests-labels--calendars&viewMode=story";
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

/** Everything the frame says, to the eye and to a screen reader: each text node and each attribute that carries words. */
function spoken(page: Page, frame: string): Promise<string[]> {
  return page.locator(`[data-labels-frame="${frame}"]`).evaluate((root) => {
    const out: string[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.nodeValue?.trim();
      if (text) out.push(text);
    }
    for (const element of root.querySelectorAll("*")) {
      for (const name of ["aria-label", "aria-valuetext", "title", "alt", "placeholder"]) {
        const value = element.getAttribute(name)?.trim();
        if (value) out.push(value);
      }
    }
    return out;
  });
}

const ENGLISH = LABEL_DEFAULTS.filter((word) => word !== " of ");

for (const theme of ["light", "dark"]) {
  for (const width of [390, 768, 1440]) {
    test(`labels ${theme} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 960 });
      await open(page, theme);
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark).*$/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const result = await audit(page);
      expect(result.violations).toEqual([]);
      await expect(page).toHaveScreenshot(`labels-${theme}-${width}.png`, { fullPage: true });
    });
  }
}

test("with nothing given, every piece says its English words", async ({ page }) => {
  await open(page);
  const said = (await spoken(page, "english")).join("\n");
  for (const word of ENGLISH) expect(said, `default "${word}" missing`).toContain(word);
});

test("one provider turns every word of the pieces inside it, and leaves no English behind", async ({ page }) => {
  await open(page);
  const said = await spoken(page, "spanish");
  const joined = said.join("\n");
  for (const word of ["Etiqueta", "Solo", "Copiar el código", "Copiar el comando", "Quitar el filtro Estado", "Búsqueda en la web", "Adjuntos", "Ventana de contexto", "Creando la imagen"]) {
    expect(joined, `"${word}" missing`).toContain(word);
  }
  const leaks = said.filter((text) => ENGLISH.some((word) => text.includes(word)));
  expect(leaks).toEqual([]);
});

test("the Arabic frame is translated too, and reads right to left", async ({ page }) => {
  await open(page);
  const said = (await spoken(page, "arabic")).join("\n");
  for (const word of ["بحث في الويب", "قرأ الصفحة", "المرفقات", "نافذة السياق"]) expect(said).toContain(word);
  const leaks = said.split("\n").filter((text) => ENGLISH.some((word) => text.includes(word)));
  expect(leaks).toEqual([]);
});

test("the chart's source table is headed and named by the provider, and its values are the locale's", async ({ page }) => {
  await open(page);
  const spanish = page.locator('[data-labels-frame="spanish"] table.fui-sr-only').first();
  await expect(spanish.locator("th").first()).toHaveText("Etiqueta");
  await expect(spanish.locator("tbody tr").first().locator("td").first()).toHaveText("1200");
  await expect(page.locator('[data-labels-frame="spanish"] .fui-chart-legend-only').first()).toHaveAttribute("aria-label", "Mostrar solo Tokens de entrada");
  await expect(page.locator('[data-labels-frame="spanish"] .fui-chart-legend-only').first()).toHaveText("Solo");
  // A hidden series brings back "show all", which is also the provider's.
  await page.locator('[data-labels-frame="spanish"] .fui-chart-legend-toggle').first().click();
  await expect(page.locator('[data-labels-frame="spanish"] .fui-chart-legend-reset')).toHaveText("Mostrar todo");
  await expect(page.locator('[data-labels-frame="spanish"] .fui-chart-legend-toggle').first()).toHaveAttribute("aria-label", "Mostrar Tokens de entrada");
});

test("a code panel says how the copy went in the product's words; a refusal is a state, not a sentence", async ({ page }) => {
  await open(page);
  const panel = page.locator('[data-labels-frame="spanish"] .fui-code-panel').first();
  const status = panel.locator('[role="status"]');
  await expect(status).toHaveText("");

  await page.evaluate(() => {
    Object.defineProperty(navigator.clipboard, "writeText", { configurable: true, value: () => Promise.reject(new Error("denied")) });
  });
  await panel.getByRole("button", { name: "Copiar el código" }).first().click();
  await expect(status).toHaveText("No se pudo copiar. Selecciona el código y cópialo.");
  await expect(status).toHaveAttribute("data-state", "failed");
  // The refusal is drawn where a person reads it, not hidden: the styling follows the state.
  await expect(status).not.toHaveClass(/fui-sr-only/);
  await expect(status).toHaveClass(/fui-code-panel-status/);
  const colour = await status.evaluate((node) => getComputedStyle(node).color);
  const ink = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.color = "var(--fui-danger-ink)";
    document.body.append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  });
  expect(colour).toBe(ink);
  await expect(page.locator('[data-labels-frame="spanish"]')).not.toContainText("Couldn't copy");

  await page.evaluate(() => {
    Object.defineProperty(navigator.clipboard, "writeText", { configurable: true, value: () => Promise.resolve() });
  });
  await panel.getByRole("button", { name: "Copiar el código" }).first().click();
  await expect(status).toHaveText("Copiado al portapapeles");
  await expect(status).toHaveAttribute("data-state", "copied");
  await expect(status).toHaveClass(/fui-sr-only/);
});

test("the multi-select's summary and its clear key take the provider's words, without lowercasing a caller's label", async ({ page }) => {
  await open(page);
  const field = page.locator('[data-labels-frame="spanish"] .fui-multi-select').first();
  await expect(field.locator(".fui-multi-select-first")).toHaveText("Abierta");
  await expect(field.locator(".fui-multi-select-more")).toHaveText("+2");
  await expect(field.locator(".fui-multi-select-summary .fui-sr-only")).toHaveText(" y 2 más");
  await field.locator(".fui-multi-select-trigger").click();
  const clear = page.getByRole("button", { name: "Quitar el filtro Estado" });
  await expect(clear).toBeVisible();
  await expect(clear).toHaveText("Quitar el filtro Estado");
  await clear.click();
  await expect(field.locator(".fui-multi-select-first")).toHaveText("Cualquiera");
  await expect(page.locator('[data-labels-frame="spanish"]')).not.toContainText("Clear estado");
});

test("useLabels hands the same words back while its inputs stand still", async ({ page }) => {
  await page.clock.setFixedTime(NOW);
  await page.goto("/iframe.html?id=tests-labels--stability&viewMode=story");
  const probe = page.getByRole("button", { name: /^Re-render/ });
  await expect(probe).toHaveText("Re-render (0): first");
  await probe.click();
  await expect(probe).toHaveText("Re-render (1): same");
  await probe.click();
  await expect(probe).toHaveText("Re-render (2): same");
});

test.describe("a browser that asks for Japanese", () => {
  test.use({ locale: "ja-JP" });

  test("a calendar with no locale is English, and the provider's is Japanese, with no hydration warning", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") errors.push(message.text());
    });
    await open(page, "light", CALENDARS);
    const plain = page.locator('[data-calendar="plain"]');
    const japanese = page.locator('[data-calendar="japanese"]');
    await expect(plain).toContainText("November 2026");
    await expect(plain.getByRole("button", { name: "Previous month" })).toBeVisible();
    await expect(japanese).toContainText("2026年11月");
    await expect(japanese.getByRole("button", { name: "前の月" })).toBeVisible();
    await expect(plain).not.toContainText("2026年11月");
    expect(errors.filter((line) => /hydrat|did not match|server rendered/i.test(line))).toEqual([]);
  });
});
