import { test, expect } from '@playwright/test';

test('search page loads', async ({ page }) => {
	await page.goto('/search');
	// Expect search input
	await expect(page.getByRole('textbox')).toBeVisible();
});

test('search tag filters have aria-pressed', async ({ page }) => {
	await page.goto('/search');

	// Wait for potential hydration
	await page.waitForTimeout(1000);

	const tagButton = page.getByRole('button', { name: 'nginx' });
	await expect(tagButton).toBeVisible();

	// Initially not pressed
	await expect(tagButton).toHaveAttribute('aria-pressed', 'false');

	// Click to select
	await tagButton.click();
	await expect(page).toHaveURL(/tags=nginx/);
	await expect(tagButton).toHaveAttribute('aria-pressed', 'true');

	// Click to deselect
	await tagButton.click();
	await expect(page).not.toHaveURL(/tags=nginx/);
	await expect(tagButton).toHaveAttribute('aria-pressed', 'false');
});
