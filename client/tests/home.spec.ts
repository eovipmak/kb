import { test, expect } from '@playwright/test';

test('has main heading', async ({ page }) => {
	await page.goto('/');

	// Expect the page to have a heading with the name of "Knowledge Base Client".
	await expect(page.getByRole('heading', { name: 'Knowledge Base Client' })).toBeVisible();
});

test('shows welcome message', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('Welcome to the Knowledge Base.')).toBeVisible();
});
