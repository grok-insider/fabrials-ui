import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/visual",
  timeout: 30_000,
  expect: { timeout: 8_000, toHaveScreenshot: { animations: "disabled", maxDiffPixelRatio: 0.002 } },
  fullyParallel: false,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://127.0.0.1:6041", browserName: "chromium", trace: "retain-on-failure", contextOptions: { reducedMotion: "reduce" } },
  webServer: { command: "bun run storybook --ci", url: "http://127.0.0.1:6041", reuseExistingServer: !process.env.CI, timeout: 60_000 },
});
