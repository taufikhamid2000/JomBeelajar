import type { Page } from '@playwright/test';

// Credentials for a dedicated test account, deliberately not committed —
// set E2E_TEST_EMAIL/E2E_TEST_PASSWORD in .env.local for local runs and as
// GitHub Actions secrets for CI. Authenticated tests skip themselves (rather
// than failing) when these aren't set, so the suite still runs cleanly
// before a test account exists.
export function hasTestCredentials(): boolean {
  return Boolean(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);
}

export async function login(page: Page) {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  if (!email || !password) {
    throw new Error('E2E_TEST_EMAIL / E2E_TEST_PASSWORD are not set.');
  }

  await page.goto('/auth');
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Password', { exact: true }).fill(password);
  await page.locator('form button[type="submit"]').click();
  // Successful sign-in hard-navigates to the dashboard.
  await page.waitForURL('**/dashboard');
}
