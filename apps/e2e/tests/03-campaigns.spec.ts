import { expect, test } from '@playwright/test';

test('authenticated user can create a campaign from the campaigns page', async ({ page }) => {
  const campaignName = `E2E Launch Sprint ${Date.now()}`;
  await page.goto('/dashboard/campaigns');

  await page.getByRole('button', { name: /Create Campaign/i }).click();
  const modal = page.getByRole('dialog');

  await modal.getByPlaceholder('Campaign name').fill(campaignName);
  await modal.getByPlaceholder('Campaign description (optional)').fill('A smoke-test campaign for the Playwright suite.');
  await modal.getByRole('button', { name: /^Create Campaign$/ }).click();

  await expect(page.getByText('Campaign created successfully')).toBeVisible();
});
