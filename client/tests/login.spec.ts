import { test, expect } from '@playwright/test';

test('login page loads and form exists', async ({ page }) => {
	await page.goto('/login');
	await expect(page.locator('input[name="email"]')).toBeVisible();
	await expect(page.locator('input[name="password"]')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
});
