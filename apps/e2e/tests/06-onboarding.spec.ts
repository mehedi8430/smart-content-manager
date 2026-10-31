import { expect, test } from '@playwright/test';

test('onboarding shows one hint at a time and persists completion', async ({ page }) => {
  await page.goto('/dashboard/campaigns');

  await page.locator('input[placeholder="Search campaigns..."]').last().fill('Summer Product Launch');
  const campaignRow = page.getByRole('row').filter({ hasText: 'Summer Product Launch' });
  await expect(campaignRow).toBeVisible();
  await campaignRow.click();

  await expect(page).toHaveURL(/\/dashboard\/campaigns\/[a-zA-Z0-9-]+\/board$/);

  const hint = page.getByRole('dialog', { name: 'Onboarding tip' });

  await expect(hint).toBeVisible();
  await expect(hint).toContainText('Use the board to add tasks');
  await expect(hint).toContainText('4 tips left');

  await hint.getByRole('button', { name: 'Next' }).click();
  await expect(hint).toContainText('Generate a draft with AI');
  await expect(hint).toContainText('3 tips left');

  await hint.getByRole('button', { name: 'Next' }).click();
  await expect(hint).toContainText('Ask the copilot for ideas');
  await expect(hint).toContainText('2 tips left');

  await hint.getByRole('button', { name: 'Next' }).click();
  await expect(hint).toContainText('Open the AI assistant anytime');
  await expect(hint).toContainText('Last tip');
  await hint.getByRole('button', { name: 'Done' }).click();

  await expect(hint).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Summer Product Launch' })).toBeVisible();
  await page.waitForTimeout(300);
  await expect(hint).toHaveCount(0);
});
