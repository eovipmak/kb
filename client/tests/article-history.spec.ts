import { test, expect } from '@playwright/test';

test.describe('Article History & Restore', () => {
	test('should track history and restore previous versions', async ({ page }) => {
		// Debug
		page.on('console', (msg) => console.log(`[Browser Console] ${msg.text()}`));
		page.on('pageerror', (err) => console.log(`[Browser Error] ${err.message}`));

		let createdArticleId = '';

		// Mock API calls for login
		await page.route('**/api/auth/login', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ token: 'fake-jwt-token' })
			});
		});

		// Mock API call for current user
		await page.route('**/api/auth/me', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					id: 'user1',
					email: 'admin@test.com',
					role: 'ADMIN'
				})
			});
		});

		// Mock categories
		await page.route('**/api/categories', async (route) => {
			await route.fulfill({
				json: [
					{ id: 'cat1', name: 'General' },
					{ id: 'cat2', name: 'Technical' }
				]
			});
		});

		// Mock article creation
		await page.route('**/api/qa', async (route) => {
			if (route.request().method() === 'POST') {
				const postData = route.request().postDataJSON();
				createdArticleId = 'article-test-' + Date.now();
				await route.fulfill({
					status: 201,
					json: {
						id: createdArticleId,
						title: postData.title,
						contentHtml: postData.contentHtml,
						contentText: postData.title,
						slug: postData.title.toLowerCase().replace(/\s/g, '-'),
						type: postData.type || 'FAQ',
						status: postData.status || 'DRAFT',
						categoryId: postData.categoryId,
						tags: (postData.tags || []).map((name: string) => ({ id: 'tag-' + name, name })),
						authorId: 'user1',
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
						viewCount: 0,
						category: { id: postData.categoryId, name: 'General' },
						author: { id: 'user1', email: 'admin@test.com', role: 'ADMIN' }
					}
				});
			}
		});

		// Track article updates and history
		const articleHistory: any[] = [];
		let currentArticle: any = null;

		await page.route('**/api/qa/*', async (route) => {
			const url = route.request().url();
			const method = route.request().method();

			// Handle GET article by ID
			if (method === 'GET' && !url.includes('/history') && !url.includes('/restore')) {
				if (currentArticle) {
					await route.fulfill({ json: currentArticle });
				} else {
					await route.fulfill({ status: 404, json: { message: 'Not found' } });
				}
			}
			// Handle PUT (update)
			else if (method === 'PUT') {
				const putData = route.request().postDataJSON();
				// Save current state to history before updating
				if (currentArticle) {
					articleHistory.push({
						id: 'history-' + articleHistory.length,
						articleId: currentArticle.id,
						changedBy: { id: 'user1', email: 'admin@test.com', role: 'ADMIN' },
						oldContent: {
							title: currentArticle.title,
							contentHtml: currentArticle.contentHtml,
							contentText: currentArticle.contentText,
							status: currentArticle.status,
							type: currentArticle.type,
							categoryId: currentArticle.categoryId,
							tags: currentArticle.tags
						},
						createdAt: new Date().toISOString()
					});
				}

				// Update current article
				currentArticle = {
					...currentArticle,
					...putData,
					tags: (putData.tags || []).map((name: string) => ({ id: 'tag-' + name, name })),
					updatedAt: new Date().toISOString()
				};

				await route.fulfill({ json: currentArticle });
			}
			// Handle GET history
			else if (method === 'GET' && url.includes('/history')) {
				await route.fulfill({ json: articleHistory });
			}
			// Handle POST restore
			else if (method === 'POST' && url.includes('/restore')) {
				const restoreData = route.request().postDataJSON();
				const historyRecord = articleHistory.find((h) => h.id === restoreData.historyId);

				if (historyRecord) {
					// Save current state to history
					articleHistory.push({
						id: 'history-' + articleHistory.length,
						articleId: currentArticle.id,
						changedBy: { id: 'user1', email: 'admin@test.com', role: 'ADMIN' },
						oldContent: {
							title: currentArticle.title,
							contentHtml: currentArticle.contentHtml,
							contentText: currentArticle.contentText,
							status: currentArticle.status,
							type: currentArticle.type,
							categoryId: currentArticle.categoryId,
							tags: currentArticle.tags
						},
						createdAt: new Date().toISOString()
					});

					// Restore from history
					currentArticle = {
						...currentArticle,
						title: historyRecord.oldContent.title,
						contentHtml: historyRecord.oldContent.contentHtml,
						contentText: historyRecord.oldContent.contentText,
						tags: historyRecord.oldContent.tags,
						updatedAt: new Date().toISOString()
					};

					await route.fulfill({ json: currentArticle });
				} else {
					await route.fulfill({ status: 404, json: { message: 'History record not found' } });
				}
			} else {
				await route.continue();
			}
		});

		// Navigate to editor and set token
		await page.goto('/admin/editor');
		await page.evaluate(() => {
			localStorage.setItem('token', 'fake-jwt-token');
		});
		await page.goto('/admin/editor');

		// Wait for editor to load
		await page.waitForSelector('.ProseMirror', { timeout: 10000 });

		// Create an initial article "Version 1"
		await page.fill('#title', 'Version 1');
		const editor = page.locator('.ProseMirror');
		await editor.click();
		await editor.fill('This is the first version of the article.');

		// Save as draft
		await page.click('button:has-text("Save Draft")');
		await page.waitForTimeout(500); // Wait for save

		// Store the created article
		currentArticle = {
			id: createdArticleId,
			title: 'Version 1',
			contentHtml: '<p>This is the first version of the article.</p>',
			contentText: 'This is the first version of the article.',
			slug: 'version-1',
			type: 'FAQ',
			status: 'DRAFT',
			categoryId: 'cat1',
			tags: [],
			authorId: 'user1',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			viewCount: 0,
			category: { id: 'cat1', name: 'General' },
			author: { id: 'user1', email: 'admin@test.com', role: 'ADMIN' }
		};

		// Dismiss alert and navigate back to editor with article ID
		page.once('dialog', (dialog) => dialog.accept());
		await page.waitForTimeout(200);

		// Navigate to editor with the article ID
		await page.goto(`/admin/editor?id=${createdArticleId}`);
		await page.waitForSelector('.ProseMirror', { timeout: 10000 });

		// Change title to "Version 2" and update content
		await page.fill('#title', 'Version 2');
		await editor.click();
		await editor.fill('This is the second version of the article.');

		// Save
		await page.click('button:has-text("Save Draft")');
		page.once('dialog', (dialog) => dialog.accept());
		await page.waitForTimeout(500);

		// Reload the editor
		await page.goto(`/admin/editor?id=${createdArticleId}`);
		await page.waitForSelector('.ProseMirror', { timeout: 10000 });

		// Change title to "Version 3" and update content
		await page.fill('#title', 'Version 3');
		await editor.click();
		await editor.fill('This is the third version of the article.');

		// Save
		await page.click('button:has-text("Save Draft")');
		page.once('dialog', (dialog) => dialog.accept());
		await page.waitForTimeout(500);

		// Reload and navigate to History tab
		await page.goto(`/admin/editor?id=${createdArticleId}`);
		await page.waitForSelector('.ProseMirror', { timeout: 10000 });

		// Click on History tab
		await page.click('button:has-text("History")');
		await page.waitForTimeout(500);

		// Wait for history to load
		await page.waitForSelector('.history-container', { timeout: 5000 });

		// Screenshot: Capture history tab list
		await page.screenshot({
			path: 'test-result/history-tab-list.png',
			fullPage: true
		});

		// Verify that history records are shown
		const historyRecords = page.locator('.history-container > div > div');
		await expect(historyRecords).toHaveCount(2); // Should have 2 history records (Version 1 and Version 2)

		// Verify the first history record shows "Version 2"
		const firstRecord = historyRecords.first();
		await expect(firstRecord.locator('text=Version 2')).toBeVisible();

		// Click Preview button on the first record (Version 2)
		await firstRecord.locator('button:has-text("Preview")').click();
		await page.waitForTimeout(300);

		// Verify preview modal is shown
		await expect(page.locator('role=dialog')).toBeVisible();
		await expect(page.locator('role=dialog >> text=Version 2')).toBeVisible();

		// Close preview
		await page.locator('role=dialog >> button:has-text("Close")').click();
		await page.waitForTimeout(200);

		// Click Restore on the first record (Version 2)
		await firstRecord.locator('button:has-text("Restore")').click();

		// Accept the confirmation dialog
		page.once('dialog', (dialog) => {
			expect(dialog.message()).toContain('restore');
			dialog.accept();
		});
		await page.waitForTimeout(300);

		// Accept the success alert
		page.once('dialog', (dialog) => dialog.accept());
		await page.waitForTimeout(500);

		// Verify the editor now shows "Version 2"
		await expect(page.locator('#title')).toHaveValue('Version 2');

		// Verify editor content
		await expect(editor).toContainText('This is the second version of the article.');

		console.log('✅ Article History & Restore test passed!');
	});
});
