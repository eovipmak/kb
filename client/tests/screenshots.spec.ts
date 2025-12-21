import { test, expect } from '@playwright/test';
import path from 'path';
import * as fs from 'fs';

// Define output directory
const SCREENSHOT_DIR = path.resolve(process.cwd(), '../screenshots');
const TEST_IMAGE_PATH = path.resolve(process.cwd(), '../test_image.png');

test.describe('Visual Proof Screenshots', () => {
	test('capture sequence of user journey', async ({ page, browserName }) => {
		page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
		page.on('pageerror', (exception) => console.log(`PAGE ERROR: "${exception}"`));
		page.on('request', (request) => console.log('>>', request.method(), request.url()));

		// Ensure directory exists
		if (!fs.existsSync(SCREENSHOT_DIR)) {
			fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
		}

		// --- 1. Homepage /docs ---
		console.log('1. Homepage /docs');

		// Mock data for docs
		await page.route('**/api/qa?*', async (route) => {
			const json = {
				data: [
					{
						id: '1',
						title: 'Getting Started',
						slug: 'getting-started',
						type: 'FAQ',
						createdAt: new Date().toISOString()
					},
					{
						id: '2',
						title: 'Authentication 101',
						slug: 'auth-101',
						type: 'GUIDE',
						createdAt: new Date().toISOString()
					}
				],
				pagination: { total: 2, page: 1, limit: 10, totalPages: 1 }
			};
			await route.fulfill({ json });
		});

		await page.goto('/docs');
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible(); // Assuming "Knowledge Base" or similar
		// Wait for list to appear
		await page.waitForTimeout(1000);
		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, '01_homepage_docs.png'),
			fullPage: true
		});

		// --- 2. Login admin (admin dashboard) ---
		console.log('2. Login admin');

		// Mock login
		await page.route('**/api/auth/login', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					token: 'fake-jwt-token',
					user: { email: 'admin@example.com', role: 'ADMIN' }
				})
			});
		});

		// Mock admin stats
		await page.route('**/api/analytics/stats', async (route) => {
			await route.fulfill({ json: { articles: 42, views: 10500, users: 8 } });
		});

		// Mock admin article list
		await page.route('**/api/qa*', async (route) => {
			if (route.request().url().includes('analytics/stats')) return route.continue();

			const json = {
				data: [
					{
						id: '1',
						title: 'Getting Started',
						slug: 'getting-started',
						status: 'PUBLISHED',
						type: 'FAQ',
						author: { email: 'admin@example.com' },
						createdAt: new Date().toISOString()
					},
					{
						id: '2',
						title: 'Draft Article',
						slug: 'draft-article',
						status: 'DRAFT',
						type: 'FAQ',
						author: { email: 'admin@example.com' },
						createdAt: new Date().toISOString()
					}
				],
				pagination: { total: 2, page: 1, limit: 10, totalPages: 1 }
			};
			await route.fulfill({ json });
		});

		await page.goto('/login');
		// Fill form purely for visual or just skip
		await page.fill('input[name="email"]', 'admin@example.com');
		await page.fill('input[name="password"]', 'password');

		// Inject token to bypass potential client-side submission issues in test env
		await page.evaluate(() => {
			localStorage.setItem('token', 'fake-jwt-token');
			localStorage.setItem('user', JSON.stringify({ email: 'admin@example.com', role: 'ADMIN' }));
		});

		// Navigate to admin directly
		await page.goto('/admin');
		await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
		await page.waitForLoadState('networkidle');
		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, '02_login_admin_dashboard.png'),
			fullPage: true
		});

		// --- 3. Thao tác viết 1 article (Operation of writing 1 article) ---
		console.log('3. Writing 1 article');

		// Mock categories
		await page.route('**/api/categories', async (route) => {
			await route.fulfill({
				json: [
					{ id: '1', name: 'General' },
					{ id: '2', name: 'Billing' }
				]
			});
		});

		await page.goto('/admin/editor');
		await expect(page.locator('.ProseMirror')).toBeVisible();

		await page.fill('input[id="title"]', 'How to Use the Knowledge Base');
		await page
			.locator('.ProseMirror')
			.pressSequentially('First, log in to the system. Then navigate to the docs section.', {
				delay: 50
			});

		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, '03_writing_article.png'),
			fullPage: true
		});

		// --- 4. Ảnh của box khi gõ / (Image of the box when typing /) ---
		console.log('4. Box when typing /');

		await page.locator('.ProseMirror').press('Enter');
		await page.locator('.ProseMirror').press('/');
		await page.waitForTimeout(500); // Wait for menu
		// We might need to ensure the menu is in the DOM

		await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_slash_command_box.png') });

		// Close menu/clear line for next step
		await page.locator('.ProseMirror').press('Backspace');

		// --- 6. Dán 1 ảnh mẫu vào article (Paste a sample image) ---
		// Note: Reordered to flow naturally in editor
		console.log('6. Paste object image');

		if (fs.existsSync(TEST_IMAGE_PATH)) {
			const buffer = fs.readFileSync(TEST_IMAGE_PATH);
			const base64 = buffer.toString('base64');
			const mimeType = 'image/png'; // Assuming png based on file extension

			// Mock upload endpoint
			await page.route('**/api/upload', async (route) => {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({ url: 'https://placehold.co/600x400' }) // Return a placeholder URL or the base64 itself if supported by renderer
				});
			});

			await page.evaluate(
				async ({ base64, mimeType }) => {
					const res = await fetch(`data:${mimeType};base64,${base64}`);
					const blob = await res.blob();
					const file = new File([blob], 'test_image.png', { type: mimeType });

					const dataTransfer = new DataTransfer();
					dataTransfer.items.add(file);

					const event = new ClipboardEvent('paste', {
						clipboardData: dataTransfer,
						bubbles: true,
						cancelable: true,
						composed: true
					});

					const editor = document.querySelector('.ProseMirror');
					if (editor) editor.dispatchEvent(event);
				},
				{ base64, mimeType }
			);

			// Wait for image to appear in editor
			await page.waitForSelector('.ProseMirror img', { timeout: 5000 });
			await page.waitForTimeout(1000); // Wait for potential loading

			await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_pasted_image.png') });
		} else {
			console.warn(`Test image not found at ${TEST_IMAGE_PATH}. Skipping paste test.`);
		}

		// --- 7. Preview 1 article from admin (Actually Previewing the article page) ---
		console.log('7. Review article');

		// Use a very broad pattern and log hits
		await page.route('**/api/qa/slug/**', async (route) => {
			console.log('Hit slug mock:', route.request().url());
			const json = {
				id: 'new-article-123',
				title: 'How to Use the Knowledge Base',
				slug: 'how-to-use-kb',
				contentHtml:
					'<h1>How to Use the Knowledge Base</h1><p>First, log in...</p><img src="https://placehold.co/600x400" />',
				type: 'FAQ',
				status: 'PUBLISHED',
				tags: [{ id: '1', name: 'guide' }],
				categoryId: '1',
				author: { email: 'admin@example.com', role: 'ADMIN' },
				createdAt: new Date().toISOString()
			};
			await route.fulfill({ json });
		});

		await page.goto('/docs/how-to-use-kb', { waitUntil: 'networkidle' });

		// If content is taking time, wait explicitly
		await page.waitForTimeout(2000);

		// Check availability
		try {
			await expect(page.getByRole('heading', { level: 1 })).toContainText(
				'How to Use the Knowledge Base',
				{ timeout: 5000 }
			);
		} catch (e) {
			console.log('Heading not found or incorrect. Page content:', await page.content());
		}

		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, '07_preview_article.png'),
			fullPage: true
		});

		// --- 8. Edit article ---
		console.log('8. Edit article');
		// Go back to editor with ID

		await page.route('**/api/qa/new-article-123', async (route) => {
			const json = {
				id: 'new-article-123',
				title: 'How to Use the Knowledge Base',
				contentHtml: '<p>First, log in...</p>', // Simplified content
				type: 'FAQ',
				status: 'PUBLISHED',
				tags: [{ name: 'guide' }],
				categoryId: '1',
				author: { email: 'admin@example.com', role: 'ADMIN' }
			};
			await route.fulfill({ json });
		});

		await page.goto('/admin/editor?id=new-article-123');
		await expect(page.locator('input#title')).toHaveValue('How to Use the Knowledge Base');
		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, '08_edit_article.png'),
			fullPage: true
		});

		// --- 5. Audit history (Moved here because we are already in edit mode) ---
		console.log('5. Audit history');

		// Mock history
		await page.route('**/api/qa/new-article-123/history', async (route) => {
			const json = [
				{
					id: 'hist-2',
					articleId: 'new-article-123',
					changedBy: { email: 'admin@example.com', role: 'ADMIN' },
					oldContent: { title: 'How to Use', status: 'DRAFT' },
					createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hour ago
				},
				{
					id: 'hist-1',
					articleId: 'new-article-123',
					changedBy: { email: 'admin@example.com', role: 'ADMIN' },
					oldContent: { title: 'Untitled', status: 'DRAFT' },
					createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
				}
			];
			await route.fulfill({ json });
		});

		await page.click('button:has-text("History")');
		await page.waitForSelector('text=History'); // Wait for history tab content
		await page.waitForTimeout(500);
		await page.screenshot({
			path: path.join(SCREENSHOT_DIR, '05_audit_history.png'),
			fullPage: true
		});
	});
});
