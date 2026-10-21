import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

// Playwright's own process doesn't read .env.local the way `next build` /
// `next start` do — load it explicitly so E2E_TEST_EMAIL/PASSWORD (if set)
// reach e2e/login.ts locally. CI sets real environment variables instead.
if (existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
}

// Optional: point at an already-installed Chromium instead of the one
// `playwright install` downloads (e.g. a sandbox with browsers preinstalled
// for a different Playwright version).
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;

// Smoke tests only (see e2e/smoke.spec.ts). Runs against a production build
// via `next start` — never the dev server.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(chromiumExecutable
          ? { launchOptions: { executablePath: chromiumExecutable } }
          : {}),
      },
    },
  ],
  // Only start a local server when testing against localhost; setting
  // E2E_BASE_URL to a deployment skips this. In CI the workflow runs
  // `npm run build` as its own step, so only `npm run start` here.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: process.env.CI
          ? 'npm run start'
          : 'npm run build && npm run start',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
      },
});
