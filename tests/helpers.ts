import { Page } from '@playwright/test';

/** Shared OTP login helper used by all agents */
export async function loginAs(page: Page, phone: string, role: 'customer' | 'provider' | 'admin') {
  await page.goto('/login');

  // Select role card
  const roleMap = { customer: 'Customer', provider: 'Service Provider', admin: 'Super Admin' };
  await page.getByText(roleMap[role]).first().click();
  await page.getByRole('button', { name: /Continue as/i }).click();

  // Enter phone
  await page.getByPlaceholder('Enter 10-digit number').fill(phone);
  await page.getByRole('button', { name: /Send OTP/i }).click();

  // Enter OTP (any 6 digits)
  const otpBoxes = page.locator('input[inputmode="numeric"]');
  for (let i = 0; i < 6; i++) await otpBoxes.nth(i).fill((i + 1).toString());

  await page.getByRole('button', { name: /Verify/i }).click();
  await page.waitForURL(/\/(customer|provider|admin)/);
}
