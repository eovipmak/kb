import { test, expect } from '@playwright/test';

test('about page loads', async ({ page }) => {
	await page.goto('/about');
	// Adjust expectation based on likely content, usually an H1
	await expect(page.getByRole('heading')).toBeVisible();
});
