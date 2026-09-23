import { defineConfig } from "@playwright/test";

const storybookPort = process.env.STORYBOOK_PORT ?? "6041";
const storybookUrl = `http://127.0.0.1:${storybookPort}`;

export default defineConfig({
  testDir: "./tests/visual",
  timeout: 30_000,
  expect: { timeout: 8_000, toHaveScreenshot: { animations: "disabled", maxDiffPixelRatio: 0.002 } },
  fullyParallel: false,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: storybookUrl, browserName: "chromium", trace: "retain-on-failure", contextOptions: { reducedMotion: "reduce" } },
  webServer: process.env.STORYBOOK_EXTERNAL
    ? undefined
    : { command: "bun run storybook --ci", url: storybookUrl, reuseExistingServer: !process.env.CI, timeout: 60_000 },
});
