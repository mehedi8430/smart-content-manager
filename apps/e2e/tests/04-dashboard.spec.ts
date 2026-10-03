import { expect, test } from '@playwright/test';

test('authenticated dashboard shows campaign metrics', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByText('Active Campaigns')).toBeVisible();
  await expect(page.getByText('Content Pieces')).toBeVisible();
  await expect(page.getByText('AI Outputs')).toBeVisible();
  await expect(page.getByText('Recent Activity')).toBeVisible();
});
