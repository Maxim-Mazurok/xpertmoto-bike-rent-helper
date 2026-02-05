import { test, expect } from '@playwright/test';

test.describe('Xpert Moto Fleet Availability Dashboard', () => {

    test('should load the dashboard with correct title', async ({ page }) => {
        await page.goto('/');

        // Check that the page loads with correct title
        await expect(page).toHaveTitle('Xpert Moto - Bike Availability Dashboard');
    });

    test('should load the page successfully', async ({ page }) => {
        const response = await page.goto('/');

        // Check that page loads with 200 status
        expect(response.status()).toBe(200);
    });

    test('should have main container', async ({ page }) => {
        await page.goto('/');

        // Verify the main container exists
        const mainDiv = page.locator('div.min-h-screen').first();
        await expect(mainDiv).toBeVisible({ timeout: 10000 });
    });

    test('should fetch example.json successfully', async ({ page }) => {
        // Monitor network requests
        const exampleJsonPromise = page.waitForResponse(
            response => response.url().includes('example.json') && response.status() === 200,
            { timeout: 10000 }
        );

        await page.goto('/');

        // Verify example.json loads
        const response = await exampleJsonPromise;
        expect(response.status()).toBe(200);
    });

    test('should start data fetching process', async ({ page }) => {
        // Listen for console logs
        const consoleLogs = [];
        page.on('console', msg => {
            if (msg.type() === 'log') {
                consoleLogs.push(msg.text());
            }
        });

        await page.goto('/');

        // Wait a bit for data fetching to start
        await page.waitForTimeout(5000);

        // Check that data fetching started
        const hasFetchLogs = consoleLogs.some(log =>
            log.includes('[Fetch]') || log.includes('Starting data aggregation')
        );

        expect(hasFetchLogs).toBe(true);
    });
});
