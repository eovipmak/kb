import { test, expect } from '@playwright/test';

test('troubleshoot page loads', async ({ page }) => {
	await page.goto('/troubleshoot');
	// Expect main container or heading
	await expect(page.getByRole('heading')).toBeVisible();
});
