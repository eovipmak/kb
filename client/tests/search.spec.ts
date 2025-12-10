import { test, expect } from '@playwright/test';

test('search page loads', async ({ page }) => {
	await page.goto('/search');
	// Expect search input
	await expect(page.getByRole('textbox')).toBeVisible();
});
