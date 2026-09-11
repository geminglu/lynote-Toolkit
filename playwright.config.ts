import { defineConfig, devices } from "@playwright/test";

const port = 4173;
const basePath = process.env.TEST_SITE_BASE_PATH || "/lynote-Toolkit";
const browserChannel = process.env.PLAYWRIGHT_USE_SYSTEM_CHROME
  ? "chrome"
  : undefined;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${port}${basePath}/`,
    channel: browserChannel,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node tests/e2e/static-server.mjs",
    env: {
      TEST_SITE_BASE_PATH: basePath,
      TEST_SITE_PORT: String(port),
    },
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    url: `http://127.0.0.1:${port}${basePath}/`,
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
