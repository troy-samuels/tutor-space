import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";
const baseURLPort = new URL(baseURL).port || "3000";
const runFullMatrix =
  process.env.CI === "true" || process.env.PLAYWRIGHT_FULL_MATRIX === "true";
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEB_SERVER === "true";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/fixtures/global-setup.ts",
  globalTeardown: "./e2e/fixtures/global-teardown.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
    video: "on-first-retry", // Capture video for animation debugging
  },
  projects: [
    // Desktop browsers
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    ...(runFullMatrix
      ? [
          { name: "firefox", use: { ...devices["Desktop Firefox"] } },
          { name: "webkit", use: { ...devices["Desktop Safari"] } },
          // Mobile browsers
          { name: "mobile-chrome", use: { ...devices["Pixel 5"] } },
          { name: "mobile-safari", use: { ...devices["iPhone 13"] } },
        ]
      : []),
    // Feature-specific test suites
    {
      name: "studio",
      testDir: "./e2e/studio",
      use: {
        ...devices["Desktop Chrome"],
        video: "on",
        trace: "retain-on-failure",
      },
    },
    {
      name: "homework",
      testDir: "./e2e/homework",
      use: {
        ...devices["Desktop Chrome"],
        trace: "retain-on-failure",
      },
    },
    {
      name: "practice",
      testDir: "./e2e/practice",
      use: {
        ...devices["Desktop Chrome"],
        actionTimeout: 60000, // AI responses may take longer
        trace: "retain-on-failure",
      },
    },
  ],
  webServer: skipWebServer
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: true, // Always reuse existing server
        timeout: 120000,
        env: {
          PORT: baseURLPort,
          E2E_TEST_MODE: "true", // Enable test mode for classroom/LiveKit
        },
      },
});
