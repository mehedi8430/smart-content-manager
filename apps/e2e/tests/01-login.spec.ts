import { expect, test } from '@playwright/test';

test('guest user can log in with demo account', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill('demo@smartcontent.test');
  await page.getByLabel('Password', { exact: true }).fill('Password123!');
  await page.getByRole('button', { name: /^Login$/ }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
