import { test } from '@playwright/test';

test.describe('Editor Review UI Screenshots', () => {
	test('show editor with admin review buttons', async ({ page }) => {
		// Mock API calls for Admin
		await page.route('**/api/auth/me', async (route) => {
			await route.fulfill({
				json: {
					id: 'admin-1',
					email: 'admin@example.com',
					role: 'ADMIN'
				}
			});
		});

		await page.route('**/api/categories', async (route) => {
			await route.fulfill({
				json: [{ id: 'cat1', name: 'General', slug: 'general' }]
			});
		});

		await page.route('**/api/qa/test-123', async (route) => {
			await route.fulfill({
				json: {
					id: 'test-123',
					title: 'Article Pending Review',
					contentHtml: '<p>This article is waiting for admin approval.</p>',
					contentText: 'This article is waiting for admin approval.',
					status: 'REVIEW',
					type: 'FAQ',
					categoryId: 'cat1',
					category: { id: 'cat1', name: 'General' },
					tags: [{ id: 't1', name: 'test' }],
					author: { id: 'writer-1', email: 'writer@example.com' },
					slug: 'article-pending-review',
					createdAt: new Date().toISOString()
				}
			});
		});

		// Set token in localStorage and navigate
		await page.goto('/admin/editor?id=test-123');
		await page.evaluate(() => {
			localStorage.setItem('token', 'fake-admin-token');
		});
		await page.reload();

		// Wait for editor to load
		await page.waitForSelector('.ProseMirror', { timeout: 10000 });
		await page.waitForTimeout(1000);

		// Take screenshot showing the admin review buttons
		await page.screenshot({
			path: 'test-result/editor-admin-review-buttons.png',
			fullPage: true
		});

		console.log('Screenshot saved: editor-admin-review-buttons.png');
	});
});
