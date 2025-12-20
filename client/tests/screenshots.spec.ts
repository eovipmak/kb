import { test, expect } from '@playwright/test';
import path from 'path';
import * as fs from 'fs';

// Define output directory: /root/kb/screenshots
const SCREENSHOT_DIR = path.resolve(process.cwd(), '../screenshots');

test.describe('Visual Proof Screenshots', () => {

    test('capture screenshots of main pages', async ({ page }) => {
        // Ensure directory exists - node fs is available in tests
        if (!fs.existsSync(SCREENSHOT_DIR)) {
            fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
        }

        // 1. Homepage
        console.log('Navigating to Homepage...');
        await page.goto('/');
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_homepage.png'), fullPage: true });

        // 2. Docs Page (with mocks)
        console.log('Navigating to Docs...');
        await page.route('**/api/qa*', async (route) => {
            const json = [
                { id: 1, title: 'Getting Started with KB', slug: 'getting-started', type: 'FAQ', createdAt: new Date().toISOString() },
                { id: 2, title: 'Advanced Configuration', slug: 'advanced-config', type: 'GUIDE', createdAt: new Date().toISOString() }
            ];
            await route.fulfill({ json });
        });
        await page.goto('/docs');
        await expect(page.getByText('Getting Started with KB')).toBeVisible();
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_docs_page.png'), fullPage: true });

        // 3. Login Page
        console.log('Navigating to Login...');
        await page.goto('/login');
        await expect(page.getByLabel('Email address')).toBeVisible();
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_login_page.png') });

        // 4. Admin Dashboard (Perform Login)
        console.log('Logging in to Admin...');
        await page.route('**/api/auth/login', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ token: 'fake-jwt-token', user: { email: 'admin@example.com', role: 'ADMIN' } })
            });
        });

        // Mock admin data to ensure dashboard loads something
        await page.route('**/api/admin/stats', async (route) => {
            await route.fulfill({ json: { totalArticles: 15, totalViews: 1250, totalUsers: 5 } });
        });

        await page.fill('input[name="email"]', 'admin@example.com');
        await page.fill('input[name="password"]', 'password');
        await page.click('button:has-text("Sign in")');

        await expect(page).toHaveURL(/\/admin/);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_admin_dashboard.png'), fullPage: true });

        // 5. Admin Editor
        console.log('Navigating to Editor...');
        // Mock categories for the editor
        await page.route('**/api/categories', async (route) => {
            await route.fulfill({ json: [{ id: '1', name: 'General' }, { id: '2', name: 'Tech' }] });
        });
        await page.goto('/admin/editor');
        // Check for an element specific to the editor, e.g., title input or tiptap editor
        await expect(page.locator('.ProseMirror')).toBeVisible();
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_admin_editor.png'), fullPage: true });
    });
});
