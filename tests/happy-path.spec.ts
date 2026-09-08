import { test, expect } from '@playwright/test';

test('happy path: login, verification, transaction', async ({ page }) => {
  // 1. Go to Login Page
  await page.goto('/admin/login');
  
  // 2. Perform Login (Assuming selectors based on typical structure)
  await page.fill('input[type="email"]', 'admin@smartlink.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Verify dashboard navigation
  await expect(page).toHaveURL(/.*\/admin\/dashboard/);

  // 3. Go to Verification
  await page.click('text=Verification');
  
  // 4. Perform NIN Verification
  await page.click('text=NIN Verification');
  await page.fill('input[name="nin"]', '12345678901');
  await page.click('button:has-text("Verify")');
  
  // Check for success message or result
  await expect(page.locator('.success-message')).toBeVisible();

  // 5. Go to Wallet/Payments
  await page.click('text=Wallet');
  await page.fill('input[name="amount"]', '1000');
  await page.click('button:has-text("Fund Wallet")');

  // Assert transaction success
  await expect(page.locator('.transaction-status')).toContainText('Successful');
});
