import { test, expect } from '@playwright/test';

test('docs page loads', async ({ page }) => {
	// Mock the API call
	await page.route('**/api/qa?status=PUBLISHED', async (route) => {
		const json = [
			{
				id: 1,
				title: 'Test Article',
				slug: 'test-article',
				type: 'FAQ',
				createdAt: new Date().toISOString()
			}
		];
		await route.fulfill({ json });
	});

	await page.goto('/docs');
	// Expect the main heading explicitly
	await expect(page.getByRole('heading', { name: 'Knowledge Base' })).toBeVisible();
});
