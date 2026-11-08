// @ts-check
const { defineConfig, devices } = require("@playwright/test");

/**
 * The site itself has no build step. These tests only exist to check the
 * validation and submission flows in a real browser.
 *
 * They run on your installed Google Chrome so Playwright does not need to
 * download its own browser. If you prefer Playwright's bundled Chromium,
 * run `npx playwright install chromium` and remove the `channel` option.
 */
module.exports = defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 5"],
        channel: "chrome",
      },
    },
  ],
  webServer: {
    command: "node tests/server.js",
    url: "http://127.0.0.1:4173/",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
