import { test, expect } from '@playwright/test';

test('sverdle page loads', async ({ page }) => {
	await page.goto('/sverdle');
	// Check for "How to play" link which is always visible
	await expect(page.getByRole('link', { name: 'How to play' })).toBeVisible();
});
