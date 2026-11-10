// The six references of every story that had none: the chat benches the audit found unphotographed, the nine generic
// patterns, the effects gallery, the toast notices, the motion vocabulary, and the new Tests/Parts bench.
// Light and dark at 390, 768 and 1440 px, with axe and the no-sideways-scroll check. The clock is fixed so a time
// printed beside a label reads the same on every run; the suite runs with reduced motion, so nothing is mid-animation.
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const NOW = new Date("2026-11-07T10:00:00Z");

type Story = { id: string; slug: string; ready?: string; axeDebt?: { reason: string; widths?: number[] } };

const stories: Story[] = [
  { id: "tests-ai-chat--streamdown-output", slug: "ai-chat-streamdown-output", ready: ".fui-markdown" },
  { id: "tests-ai-chat--activity", slug: "ai-chat-activity", ready: ".fui-activity" },
  { id: "tests-ai-chat--attachment-states", slug: "ai-chat-attachment-states", ready: ".fui-attachments" },
  { id: "tests-ai-chat--voice-input", slug: "ai-chat-voice-input", ready: ".fui-voice-button" },
  { id: "tests-ai-chat--messages", slug: "ai-chat-messages", ready: ".fui-message-actions" },
  { id: "tests-ai-chat--composer", slug: "ai-chat-composer", ready: ".fui-composer" },
  { id: "patterns-generic--confirm-dialogs", slug: "patterns-confirm-dialogs" },
  { id: "patterns-generic--truncated-rows", slug: "patterns-truncated-rows" },
  { id: "patterns-generic--settings-sections", slug: "patterns-settings-sections" },
  { id: "patterns-generic--filter-chips", slug: "patterns-filter-chips" },
  {
    id: "patterns-generic--suggestion-cards",
    slug: "patterns-suggestion-cards",
    axeDebt: { reason: "scrollable-region-focusable: the row scrolls sideways below 768 px and is not a tab stop", widths: [390] },
  },
  { id: "patterns-generic--shimmer", slug: "patterns-shimmer" },
  { id: "patterns-generic--recency-groups", slug: "patterns-recency-groups" },
  { id: "patterns-generic--recency-groups-empty", slug: "patterns-recency-groups-empty" },
  { id: "patterns-generic--file-thumbnails", slug: "patterns-file-thumbnails" },
  { id: "foundations-effects--gallery", slug: "effects-gallery" },
  { id: "tests-toast--notices", slug: "toast-notices", ready: "[data-sonner-toast]" },
  { id: "foundations-motion--vocabulary", slug: "motion-vocabulary" },
  { id: "tests-parts--display", slug: "parts-display" },
  { id: "tests-parts--table-and-item", slug: "parts-table-and-item" },
  {
    id: "tests-parts--commands",
    slug: "parts-commands",
    axeDebt: { reason: "aria-required-children: the separator and the group headings sit inside cmdk's listbox" },
  },
  { id: "tests-parts--select-parts", slug: "parts-select", ready: "[role=listbox]" },
  { id: "tests-parts--sidebar-parts", slug: "parts-sidebar" },
  { id: "tests-parts--avatar-and-calendar", slug: "parts-avatar-and-calendar" },
  { id: "tests-parts--popover-and-card", slug: "parts-popover-and-card", ready: "[data-slot=popover-content]" },
  { id: "tests-parts--navigation-parts", slug: "parts-breadcrumb-ellipsis" },
  { id: "tests-parts--source-parts", slug: "parts-sources" },
  { id: "tests-parts--search-parts", slug: "parts-search-steps" },
];

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

async function open(page: Page, story: Story, theme: string, width: number) {
  await page.setViewportSize({ width, height: 960 });
  await page.clock.setFixedTime(NOW);
  await page.goto(`/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme}`);
  await expect(page.locator("#storybook-root > *").first()).toBeVisible();
  if (story.ready) await expect(page.locator(story.ready).first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

for (const theme of ["light", "dark"]) {
  for (const width of [390, 768, 1440]) {
    for (const story of stories) {
      test(`${story.slug} ${theme} ${width}`, async ({ page }) => {
        await open(page, story, theme, width);
        await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark).*$/);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const debtApplies = Boolean(story.axeDebt && (!story.axeDebt.widths || story.axeDebt.widths.includes(width)));
        if (!debtApplies) {
          const result = await audit(page);
          expect(result.violations).toEqual([]);
        }
        await expect(page).toHaveScreenshot(`${story.slug}-${theme}-${width}.png`, { fullPage: true });
      });
    }
  }
}

// Two stories have a rule they cannot pass today. They keep their six pictures (the parts exist and are looked at) and
// the rule is written down here rather than switched off, so the debt is in the suite and in the report:
//  - the command list puts a separator and group headings inside cmdk's listbox, which axe reads as a listbox whose
//    children are neither options nor groups;
//  - the suggestion row scrolls sideways below 768 px without being a tab stop, so a keyboard user cannot scroll it.
for (const story of stories.filter((entry) => entry.axeDebt)) {
  for (const theme of ["light", "dark"]) {
    for (const width of story.axeDebt!.widths ?? [390, 768, 1440]) {
      test.fixme(`${story.slug} ${theme} ${width} passes axe: ${story.axeDebt!.reason}`, async ({ page }) => {
        await open(page, story, theme, width);
        const result = await audit(page);
        expect(result.violations).toEqual([]);
      });
    }
  }
}
