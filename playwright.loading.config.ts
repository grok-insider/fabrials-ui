import { defineConfig, devices } from "@playwright/test";

/*
 * The skeleton suite: every docs preview of ui.fabrials.com, toggled into its
 * Loading state, in Chromium, Firefox and WebKit. It runs against a production
 * build of this checkout's site. `bun run test:loading:container` builds and
 * serves it on the host and runs the browsers in the pinned Playwright image;
 * run directly (`playwright test -c playwright.loading.config.ts`) it builds
 * and serves the site itself unless LOADING_EXTERNAL is set.
 */
const port = process.env.LOADING_PORT ?? "3211";
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/loading",
  outputDir: "./test-results/loading",
  globalSetup: "./tests/loading/global-setup.ts",
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: Number(process.env.LOADING_WORKERS ?? 6),
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report/loading" }]],
  use: {
    baseURL,
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    trace: "retain-on-failure",
    contextOptions: { reducedMotion: "reduce" },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 } },
    { name: "firefox", use: { ...devices["Desktop Firefox"], viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 } },
    { name: "webkit", use: { ...devices["Desktop Safari"], viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 } },
  ],
  webServer: process.env.LOADING_EXTERNAL
    ? undefined
    : {
        command: `bun run build && bun run --cwd apps/site build && bun run --cwd apps/site next start -p ${port}`,
        url: `${baseURL}/components`,
        reuseExistingServer: !process.env.CI,
        timeout: 600_000,
      },
});
