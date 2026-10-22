import { test, expect, type Page } from '@playwright/test';
import { login, hasTestCredentials } from './login';

// Smoke coverage only: every page loads (HTTP < 400) without an uncaught
// page error or one of the app's error boundaries rendering. It exists to
// catch a page crashing at render time — something `next build`'s type
// check can't see — not to verify feature behaviour.

// Text rendered by src/app/(app)/error.tsx, src/app/(app)/dashboard/error.tsx
// and src/components/ErrorBoundary.tsx.
const ERROR_BOUNDARY_TEXT = /something went wrong/i;

const PUBLIC_PAGES = [
  '/',
  '/about',
  '/auth',
  '/privacy',
  '/terms',
  '/api-docs',
  '/leaderboard',
  '/leaderboard/schools',
  '/career-guidance',
  '/education-pathway',
];

const AUTHENTICATED_PAGES = ['/dashboard', '/profile'];

function trackPageErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

async function expectPageLoads(page: Page, path: string) {
  const errors = trackPageErrors(page);
  const response = await page.goto(path);
  expect(response, `no response for ${path}`).not.toBeNull();
  expect(response!.status(), `HTTP status for ${path}`).toBeLessThan(400);
  // Give client components a moment to hydrate and run their mount effects
  // (bounded: some pages keep polling, so the network may never go idle).
  await page
    .waitForLoadState('networkidle', { timeout: 10_000 })
    .catch(() => {});
  await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
  expect(errors, `uncaught page errors on ${path}`).toEqual([]);
}

for (const path of PUBLIC_PAGES) {
  test(`${path} loads without an error`, async ({ page }) => {
    await expectPageLoads(page, path);
  });
}

test.describe('authenticated pages', () => {
  test.skip(
    !hasTestCredentials(),
    'E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set'
  );

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  for (const path of AUTHENTICATED_PAGES) {
    test(`${path} loads without an error`, async ({ page }) => {
      await expectPageLoads(page, path);
    });
  }
});
