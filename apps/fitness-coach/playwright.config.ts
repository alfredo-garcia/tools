import { defineConfig, devices } from "@playwright/test";

/**
 * E2E (tech_standards §14): main flows in a mobile viewport with `/api/**` mocked.
 * Runs against a production build, because the service worker (serwist) is only active there
 * and AC-2 needs it. The server gets dummy env vars: the API is always mocked by the tests.
 */
const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  // Each test drives a full production page; more workers than this makes them time out on load
  // (seen with 12–16 workers), not fail on behaviour.
  workers: 4,
  forbidOnly: true,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    serviceWorkers: "block",
    locale: "es-ES",
    timezoneId: "America/Bogota",
    trace: "retain-on-failure",
  },
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"] } }],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      APP_ACCESS_KEY: "e2e-unused",
      GOOGLE_SERVICE_ACCOUNT_JSON: '{"type":"e2e-unused"}',
      GOOGLE_DRIVE_FOLDER_ID: "e2e-unused",
    },
  },
});
