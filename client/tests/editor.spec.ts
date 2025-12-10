import { test, expect } from '@playwright/test';

test.describe('Enhanced Editor', () => {
	test('editor page shows enhanced toolbar and features', async ({ page }) => {
		// Debug
		page.on('console', (msg) => console.log(`[Browser Console] ${msg.text()}`));
		page.on('pageerror', (err) => console.log(`[Browser Error] ${err.message}`));

		// Mock API calls
		await page.route('**/api/auth/login', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ token: 'fake-jwt-token' })
			});
		});

		await page.route('**/api/categories', async (route) => {
			await route.fulfill({
				json: [{ id: 'cat1', name: 'General' }]
			});
		});

		// Navigate directly to editor with fake token
		await page.goto('/admin/editor');
		await page.evaluate(() => {
			localStorage.setItem('token', 'fake-jwt-token');
		});
		await page.goto('/admin/editor');

		// Wait for editor to load
		await page.waitForSelector('.ProseMirror', { timeout: 10000 });

		// Take screenshot of the full page showing the toolbar
		await page.screenshot({
			path: 'test-result/editor-enhanced-toolbar.png',
			fullPage: true
		});

		// Test some of the new toolbar buttons exist
		await expect(page.getByTitle('Bold')).toBeVisible();
		await expect(page.getByTitle('Underline')).toBeVisible();
		await expect(page.getByTitle('Strikethrough')).toBeVisible();
		await expect(page.getByTitle('Heading 3')).toBeVisible();
		await expect(page.getByTitle('Ordered List')).toBeVisible();
		await expect(page.getByTitle('Task List')).toBeVisible();
		await expect(page.getByTitle('Blockquote')).toBeVisible();
		await expect(page.getByTitle('Horizontal Rule')).toBeVisible();
		await expect(page.getByTitle('Align Left')).toBeVisible();
		await expect(page.getByTitle('Text Color')).toBeVisible();
		await expect(page.getByTitle('Highlight')).toBeVisible();
		await expect(page.getByTitle('Table')).toBeVisible();

		// Click in the editor
		const editor = page.locator('.ProseMirror');
		await editor.click();

		// Type some content to demonstrate features
		await editor.fill('Enhanced Tiptap Editor with Notion/Docmost Features');

		// Make it H1
		await page.getByTitle('Heading 1').click();

		// Add some more content
		await editor.press('End');
		await editor.press('Enter');
		await editor.type('This editor now includes:');

		// Create a bullet list
		await page.getByTitle('Bullet List').click();
		await editor.type('Bold, Italic, Underline, Strikethrough');
		await editor.press('Enter');
		await editor.type('Multiple heading levels (H1-H6)');
		await editor.press('Enter');
		await editor.type('Task lists with checkboxes');
		await editor.press('Enter');
		await editor.type('Text colors and highlights');
		await editor.press('Enter');
		await editor.type('Text alignment options');
		await editor.press('Enter');
		await editor.type('Tables, blockquotes, and more');

		// Exit bullet list
		await editor.press('Enter');
		await editor.press('Enter');

		// Add a task list
		await page.getByTitle('Task List').click();
		await editor.type('Implement text formatting');
		await editor.press('Enter');
		await editor.type('Add color support');
		await editor.press('Enter');
		await editor.type('Add table support');

		// Take final screenshot showing the content
		await page.screenshot({
			path: 'test-result/editor-with-content.png',
			fullPage: true
		});

		// Scroll to toolbar and take a close-up screenshot
		await page.evaluate(() => window.scrollTo(0, 0));
		await page.screenshot({
			path: 'test-result/editor-toolbar-closeup.png',
			clip: { x: 0, y: 0, width: 1280, height: 400 }
		});
	});
});
