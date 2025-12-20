import { test, expect } from '@playwright/test';

test.describe('User Management', () => {
	test('admin can manage users', async ({ page }) => {
		// Debug logs
		page.on('console', (msg) => console.log(`[Browser Console] ${msg.text()}`));
		page.on('pageerror', (err) => console.log(`[Browser Error] ${err.message}`));

		// Mock API calls for this test
		await page.route('**/api/auth/login', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					token: 'fake-admin-jwt-token',
					user: { id: 'admin-1', email: 'admin@example.com', role: 'ADMIN' }
				})
			});
		});

		// Mock initial empty user list
		await page.route('**/api/users', async (route) => {
			if (route.request().method() === 'GET') {
				// Return initial user list
				await route.fulfill({
					status: 200,
					json: [
						{
							id: 'admin-1',
							email: 'admin@example.com',
							role: 'ADMIN',
							createdAt: new Date().toISOString()
						}
					]
				});
			} else if (route.request().method() === 'POST') {
				// Handle user creation
				const postData = route.request().postDataJSON();
				await route.fulfill({
					status: 201,
					json: {
						id: 'user-' + Date.now(),
						email: postData.email,
						role: postData.role,
						createdAt: new Date().toISOString()
					}
				});
			}
		});

		// 1. Login as Admin
		await page.goto('/login');
		await page.waitForLoadState('networkidle');

		const emailInput = page.getByLabel('Email address');
		const passwordInput = page.getByLabel('Password');

		await emailInput.fill('admin@example.com');
		await passwordInput.fill('admin123');

		const signInButton = page.getByRole('button', { name: 'Sign in' });
		await signInButton.click();

		// Wait for navigation to admin dashboard
		await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });

		// 2. Navigate to /admin/users
		await page.goto('/admin/users');
		await page.waitForLoadState('networkidle');

		// Verify we're on the user management page
		await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();

		// Verify initial admin user appears in table
		await expect(page.getByText('admin@example.com')).toBeVisible();

		// 3. Click "Add User" button
		const addUserButton = page.getByRole('button', { name: 'Add User' });
		await addUserButton.click();

		// Wait for modal to appear
		await expect(page.getByRole('heading', { name: 'Create New User' })).toBeVisible();

		// 4. Fill in user details
		await page.fill('input#email', 'test_writer@example.com');
		await page.fill('input#password', 'writer123');
		await page.selectOption('select#role', 'WRITER');

		// 5. Submit form
		const createButton = page.getByRole('button', { name: 'Create User' });
		await createButton.click();

		// Wait for success message
		await expect(page.getByText('User created successfully!')).toBeVisible({ timeout: 5000 });

		// 6. Take screenshot showing the user list
		await page.screenshot({
			path: 'client/test-result/user-management-success.png',
			fullPage: true
		});

		// Verify the success message is visible in the screenshot
		await expect(page.getByText('User created successfully!')).toBeVisible();
	});

	test('non-admin user gets 403 forbidden', async ({ page }) => {
		// Mock login as a WRITER
		await page.route('**/api/auth/login', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					token: 'fake-writer-jwt-token',
					user: { id: 'writer-1', email: 'writer@example.com', role: 'WRITER' }
				})
			});
		});

		// Mock 403 response for user management API
		await page.route('**/api/users', async (route) => {
			if (route.request().method() === 'GET') {
				await route.fulfill({
					status: 403,
					json: { message: 'Forbidden: Insufficient permissions' }
				});
			}
		});

		// 1. Login as Writer
		await page.goto('/login');
		await page.waitForLoadState('networkidle');

		await page.getByLabel('Email address').fill('writer@example.com');
		await page.getByLabel('Password').fill('writer123');
		await page.getByRole('button', { name: 'Sign in' }).click();

		await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });

		// 2. Try to access /admin/users
		await page.goto('/admin/users');
		await page.waitForLoadState('networkidle');

		// 3. Verify access denied message appears
		await expect(
			page.getByText(/Access denied|Forbidden|Insufficient permissions/i)
		).toBeVisible({ timeout: 5000 });
	});
});
