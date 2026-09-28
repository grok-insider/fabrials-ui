import { chromium, type FullConfig } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { SLUGS_FILE } from "./slugs";

/**
 * Collects every docs slug listed on /components, so a component added to the
 * site is covered without touching the suite. Runs after the web server is up
 * and before the test files are loaded, which read the list synchronously.
 */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]!.use.baseURL!;
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${baseURL}/components`, { waitUntil: "domcontentloaded" });
    // The index entries, not the header's guide links.
    const hrefs = await page.$$eval('.docs-main .docs-index-grid a[href^="/docs/"]', (links) =>
      links.map((link) => link.getAttribute("href")!.slice("/docs/".length).split(/[?#]/)[0]!),
    );
    const slugs = [...new Set(hrefs)].sort();
    if (slugs.length === 0) throw new Error(`No component links on ${baseURL}/components`);
    mkdirSync(dirname(SLUGS_FILE), { recursive: true });
    writeFileSync(SLUGS_FILE, JSON.stringify(slugs, null, 2));
  } finally {
    await browser.close();
  }
}
