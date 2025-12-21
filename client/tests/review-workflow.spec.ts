import { test, expect } from '@playwright/test';

test.describe('Review Queue & Approval Workflow', () => {
	test('complete review workflow: writer submits, admin reviews and approves', async ({ page }) => {
		// Debug logging
		page.on('console', (msg) => console.log(`[Browser Console] ${msg.text()}`));
		page.on('pageerror', (err) => console.log(`[Browser Error] ${err.message}`));

		// Track article ID for later use
		let articleId = 'test-article-' + Date.now();

		// Mock API calls for Writer
		await page.route('**/api/auth/login', async (route) => {
			const request = route.request();
			const postData = request.postDataJSON();
			
			// Determine role based on email
			const isAdmin = postData.email === 'admin@example.com';
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ 
					token: isAdmin ? 'fake-admin-token' : 'fake-writer-token',
					user: {
						id: isAdmin ? 'admin-1' : 'writer-1',
						email: postData.email,
						role: isAdmin ? 'ADMIN' : 'WRITER'
					}
				})
			});
		});

		await page.route('**/api/auth/me', async (route) => {
			const authHeader = route.request().headers()['authorization'];
			const isAdmin = authHeader?.includes('admin-token');
			
			await route.fulfill({
				json: {
					id: isAdmin ? 'admin-1' : 'writer-1',
					email: isAdmin ? 'admin@example.com' : 'writer@example.com',
					role: isAdmin ? 'ADMIN' : 'WRITER'
				}
			});
		});

		await page.route('**/api/categories', async (route) => {
			await route.fulfill({
				json: [{ id: 'cat1', name: 'General', slug: 'general' }]
			});
		});

		await page.route('**/api/analytics/stats', async (route) => {
			await route.fulfill({
				json: { articles: 5, users: 3, views: 150 }
			});
		});

		// Mock article creation and updates
		let articleStatus = 'DRAFT';
		await page.route('**/api/qa', async (route) => {
			const method = route.request().method();
			
			if (method === 'POST') {
				const postData = route.request().postDataJSON();
				articleStatus = postData.status || 'DRAFT';
				await route.fulfill({
					json: {
						id: articleId,
						title: postData.title,
						contentHtml: postData.contentHtml,
						status: articleStatus,
						type: postData.type || 'FAQ',
						categoryId: postData.categoryId,
						tags: [],
						author: { id: 'writer-1', email: 'writer@example.com' },
						category: { id: 'cat1', name: 'General' },
						slug: 'test-review',
						createdAt: new Date().toISOString()
					}
				});
			} else if (method === 'GET') {
				const url = route.request().url();
				const params = new URL(url).searchParams;
				const status = params.get('status');
				
				// Return articles based on status filter
				if (status === 'REVIEW') {
					await route.fulfill({
						json: articleStatus === 'REVIEW' ? [{
							id: articleId,
							title: 'Test Review Article',
							contentHtml: '<p>This is a test article for review.</p>',
							status: 'REVIEW',
							type: 'FAQ',
							categoryId: 'cat1',
							category: { id: 'cat1', name: 'General' },
							tags: [],
							author: { id: 'writer-1', email: 'writer@example.com' },
							slug: 'test-review',
							createdAt: new Date().toISOString()
						}] : []
					});
				} else {
					await route.fulfill({ json: [] });
				}
			}
		});

		// Mock individual article fetch
		await page.route(`**/api/qa/${articleId}`, async (route) => {
			await route.fulfill({
				json: {
					id: articleId,
					title: 'Test Review Article',
					contentHtml: '<p>This is a test article for review.</p>',
					contentText: 'This is a test article for review.',
					status: articleStatus,
					type: 'FAQ',
					categoryId: 'cat1',
					category: { id: 'cat1', name: 'General' },
					tags: [],
					author: { id: 'writer-1', email: 'writer@example.com' },
					slug: 'test-review',
					createdAt: new Date().toISOString()
				}
			});
		});

		// Mock article update
		await page.route(`**/api/qa/${articleId}`, async (route) => {
			const method = route.request().method();
			if (method === 'PUT') {
				const postData = route.request().postDataJSON();
				articleStatus = postData.status || articleStatus;
				await route.fulfill({
					json: {
						id: articleId,
						title: postData.title,
						contentHtml: postData.contentHtml,
						status: articleStatus,
						type: postData.type || 'FAQ',
						categoryId: postData.categoryId,
						tags: [],
						author: { id: 'writer-1', email: 'writer@example.com' },
						category: { id: 'cat1', name: 'General' },
						slug: 'test-review',
						createdAt: new Date().toISOString()
					}
				});
			}
		});

		// Mock publish and reject endpoints
		await page.route(`**/api/qa/${articleId}/publish`, async (route) => {
			articleStatus = 'PUBLISHED';
			await route.fulfill({
				json: {
					id: articleId,
					title: 'Test Review Article',
					status: 'PUBLISHED',
					type: 'FAQ',
					categoryId: 'cat1',
					category: { id: 'cat1', name: 'General' },
					tags: [],
					author: { id: 'writer-1', email: 'writer@example.com' },
					slug: 'test-review'
				}
			});
		});

		await page.route(`**/api/qa/${articleId}/reject`, async (route) => {
			articleStatus = 'DRAFT';
			await route.fulfill({
				json: {
					id: articleId,
					title: 'Test Review Article',
					status: 'DRAFT',
					type: 'FAQ',
					categoryId: 'cat1',
					category: { id: 'cat1', name: 'General' },
					tags: [],
					author: { id: 'writer-1', email: 'writer@example.com' },
					slug: 'test-review'
				}
			});
		});

		// ========== STEP 1: Writer Login and Create Article ==========
		await page.goto('/login');
		await page.waitForLoadState('networkidle');

		await page.getByLabel('Email address').fill('writer@example.com');
		await page.getByLabel('Password').fill('writer123');
		await page.getByRole('button', { name: 'Sign in' }).click();

		await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });

		// Navigate to editor
		await page.goto('/admin/editor');
		await page.waitForSelector('.ProseMirror', { timeout: 10000 });

		// Fill in article details
		await page.fill('input[placeholder="Article Title"]', 'Test Review Article');
		
		const editor = page.locator('.ProseMirror');
		await editor.click();
		await editor.fill('This is a test article for review.');

		// Submit for Review
		page.once('dialog', async (dialog) => {
			await dialog.accept();
		});
		await page.click('button:has-text("Submit for Review")');
		await expect(page).toHaveURL(/\/admin/);

		// ========== STEP 2: Logout ==========
		await page.goto('/login');
		await page.evaluate(() => localStorage.clear());

		// ========== STEP 3: Admin Login ==========
		await page.goto('/login');
		await page.waitForLoadState('networkidle');

		await page.getByLabel('Email address').fill('admin@example.com');
		await page.getByLabel('Password').fill('admin123');
		await page.getByRole('button', { name: 'Sign in' }).click();

		await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });

		// ========== STEP 4: Check Review Tab ==========
		// Click on "Needs Review" tab
		await page.click('button:has-text("Needs Review")');
		
		// Wait for the review list to update
		await page.waitForTimeout(500);

		// Verify article appears in review queue
		await expect(page.locator('text=Test Review Article')).toBeVisible();
		await expect(page.locator('text=REVIEW')).toBeVisible();

		// ========== STEP 5: Screenshot ==========
		await page.screenshot({
			path: 'test-result/admin-review-queue.png',
			fullPage: true
		});

		// ========== STEP 6: Admin Opens Article and Approves ==========
		// Click the "Review" link for the article
		await page.click('a:has-text("Review")');
		
		// Wait for editor to load
		await page.waitForSelector('.ProseMirror', { timeout: 10000 });

		// Verify admin sees the review banner and approve button
		await expect(page.locator('text=Article Pending Review')).toBeVisible();
		await expect(page.locator('button:has-text("Approve & Publish")')).toBeVisible();

		// Handle confirmation dialog for approve
		page.once('dialog', async (dialog) => {
			await dialog.accept();
		});

		// Click approve
		await page.click('button:has-text("Approve & Publish")');

		// Handle success alert
		page.once('dialog', async (dialog) => {
			expect(dialog.message()).toContain('approved');
			await dialog.accept();
		});

		await expect(page).toHaveURL(/\/admin/);

		// ========== STEP 7: Verify Status is PUBLISHED ==========
		// The article should now have status PUBLISHED
		// In a real test with backend, we would verify this
		console.log('Review workflow test completed successfully!');
	});
});
