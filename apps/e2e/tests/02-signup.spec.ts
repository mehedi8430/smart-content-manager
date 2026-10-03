import { expect, test } from '@playwright/test';

test('guest user can create a new account', async ({ page }) => {
  await page.goto('/signup');

  const email = `e2e-${Date.now()}@example.com`;
  const password = 'Password123!';

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: /^Create Account$/ }).click();

  await expect(page).toHaveURL(/\/login$/);
});
