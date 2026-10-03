import { expect, test } from '@playwright/test';

test('authenticated user can view an existing campaign board', async ({ page }) => {
  await page.goto('/dashboard/campaigns');

  await page.locator('input[placeholder="Search campaigns..."]').last().fill('Summer Product Launch');
  const campaignRow = page.getByRole('row').filter({ hasText: 'Summer Product Launch' });
  await expect(campaignRow).toBeVisible();
  await campaignRow.click();

  await expect(page).toHaveURL(/\/dashboard\/campaigns\/[a-zA-Z0-9-]+\/board$/);
  await expect(page.getByRole('heading', { name: 'Summer Product Launch' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add post', exact: true }).first()).toBeVisible();
});
