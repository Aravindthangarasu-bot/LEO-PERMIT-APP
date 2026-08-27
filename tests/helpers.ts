import { Page } from '@playwright/test';

/** Shared OTP login helper used by all agents */
export async function loginAs(page: Page, phone: string, role: 'customer' | 'provider' | 'admin') {
  await page.goto('/login');

  const roleMap = { customer: 'Customer', provider: 'Service Provider', admin: 'Super Admin' };
  
  // 1. Select role card
  await page.getByText(roleMap[role]).first().click();
  await page.getByRole('button', { name: /Continue as/i }).click();

  // 2. Enter phone
  await page.getByPlaceholder('Enter 10-digit number').fill(phone);
  await page.getByRole('button', { name: /Send OTP/i }).click();

  // 3. Enter OTP
  const otpBoxes = page.locator('input[inputmode="numeric"]');
  for (let i = 0; i < 6; i++) {
    await otpBoxes.nth(i).fill((i + 1).toString());
  }

  // 4. Verify & Login
  await page.getByRole('button', { name: /Verify/i }).click();
  await page.waitForURL(/\/(customer|provider|admin)/);
}
