import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

// E2E tests write real rows, so they run against TEST_DATABASE_URL (a separate Neon branch).
// Falling back to the production DATABASE_URL requires an explicit per-run opt-in.
function resolveDatabaseUrl(): string {
  const test = process.env.TEST_DATABASE_URL;
  const production = process.env.DATABASE_URL;
  const allowProduction = process.env.E2E_ALLOW_PRODUCTION_DB === "1";

  if (test && (test !== production || allowProduction)) return test;
  if (!test && production && allowProduction) return production;

  throw new Error(
    test
      ? "TEST_DATABASE_URL is the same as DATABASE_URL. Point it at a separate Neon branch, or set E2E_ALLOW_PRODUCTION_DB=1 for this run."
      : "TEST_DATABASE_URL is not set. Add it to .env.local, or set E2E_ALLOW_PRODUCTION_DB=1 to run against DATABASE_URL for this run.",
  );
}

const PORT = 3123;

export default defineConfig({
  testDir: "e2e",
  // Tests share one database; run them one at a time so they never see each other's writes mid-flight.
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: "chrome",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run db:setup && npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 180_000,
    reuseExistingServer: false,
    env: { DATABASE_URL: resolveDatabaseUrl() },
  },
});
