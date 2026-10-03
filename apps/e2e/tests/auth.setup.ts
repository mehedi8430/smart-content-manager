import { expect, test as setup } from '@playwright/test';

const authFile = 'tests/.auth/user.json';

setup('authenticate as demo user', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill('demo@smartcontent.test');
  await page.getByLabel('Password', { exact: true }).fill('Password123!');
  await page.getByRole('button', { name: /^Login$/ }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  await page.context().storageState({ path: authFile });
});
