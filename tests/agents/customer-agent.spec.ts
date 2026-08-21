/**
 * AGENT 1 — Customer Agent
 * Tests: Signup validation, login, dashboard tiles, new application (4-step),
 *        application appears in My Applications, application detail view.
 */
import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers';

const BASE = 'http://localhost:5177';

// ── SIGNUP VALIDATION ────────────────────────────────────────────────────────
test.describe('Signup Form Validation', () => {
  test('blocks submit when all fields empty', async ({ page }) => {
    await page.goto(`${BASE}/signup`);
    await page.getByRole('button', { name: /Send OTP/i }).click();
    await expect(page.getByText('Full name is required.')).toBeVisible();
    await expect(page.getByText('Mobile number is required.')).toBeVisible();
    await expect(page.getByText('Email address is required.')).toBeVisible();
    await expect(page.getByText('Pincode is required.')).toBeVisible();
    await expect(page.getByText('Address is required.')).toBeVisible();
  });

  test('shows error for invalid mobile number', async ({ page }) => {
    await page.goto(`${BASE}/signup`);
    await page.getByPlaceholder('As per Aadhaar card').fill('Ravi Kumar');
    await page.getByPlaceholder('10-digit number').fill('1234567890');
    await page.getByPlaceholder('10-digit number').blur();
    await expect(page.getByText(/valid 10-digit Indian mobile/i)).toBeVisible();
  });

  test('shows error for invalid email', async ({ page }) => {
    await page.goto(`${BASE}/signup`);
    await page.getByPlaceholder('your@email.com').fill('notanemail');
    await page.getByPlaceholder('your@email.com').blur();
    await expect(page.getByText(/valid email address/i)).toBeVisible();
  });

  test('shows error for short pincode', async ({ page }) => {
    await page.goto(`${BASE}/signup`);
    await page.getByPlaceholder('6-digit pincode').fill('123');
    await page.getByPlaceholder('6-digit pincode').blur();
    await expect(page.getByText(/6-digit pincode/i)).toBeVisible();
  });

  test('shows error for short address', async ({ page }) => {
    await page.goto(`${BASE}/signup`);
    await page.getByPlaceholder('Door no., Street, City').fill('short');
    await page.getByPlaceholder('Door no., Street, City').blur();
    await expect(page.getByText(/min 10 characters/i)).toBeVisible();
  });

  test('proceeds to OTP step with valid data', async ({ page }) => {
    await page.goto(`${BASE}/signup`);
    await page.getByPlaceholder('As per Aadhaar card').fill('Ravi Kumar');
    await page.getByPlaceholder('10-digit number').fill('9876543210');
    await page.getByPlaceholder('your@email.com').fill('ravi@test.com');
    await page.getByPlaceholder('6-digit pincode').fill('680001');
    await page.getByPlaceholder('Door no., Street, City').fill('45 MG Road, Thrissur, Kerala');
    await page.getByRole('button', { name: /Send OTP/i }).click();
    await expect(page.getByText(/Verify OTP/i)).toBeVisible();
    await expect(page.getByText(/9876543210/)).toBeVisible();
  });
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
test.describe('Customer Login', () => {
  test('logs in as customer and reaches dashboard', async ({ page }) => {
    await loginAs(page, '9999900000', 'customer');
    await expect(page).toHaveURL(/\/customer/);
    await expect(page.getByText(/Welcome/i)).toBeVisible();
  });

  test('dashboard shows 13 service tiles', async ({ page }) => {
    await loginAs(page, '9999900000', 'customer');
    await expect(page.getByText('Our Services')).toBeVisible();
    await expect(page.getByText('New Building Permit')).toBeVisible();
    await expect(page.getByText('Completion Certificate')).toBeVisible();
    await expect(page.getByText('Bank Loan Estimate')).toBeVisible();
    await expect(page.getByText('Electrical Drawing')).toBeVisible();
  });

  test('dashboard shows application stats', async ({ page }) => {
    await loginAs(page, '9999900000', 'customer');
    await expect(page.getByText('Total Applications')).toBeVisible();
    await expect(page.getByText('In Progress')).toBeVisible();
    await expect(page.getByText('Approved')).toBeVisible();
  });
});

// ── NEW APPLICATION FLOW ──────────────────────────────────────────────────────
test.describe('Customer New Application', () => {
  test('blocks step 1 advance without service selection', async ({ page }) => {
    await loginAs(page, '9999900000', 'customer');
    await page.goto(`${BASE}/customer/new`);
    await page.getByRole('button', { name: /Continue/i }).click();
    await expect(page.getByText(/Please select a service/i)).toBeVisible();
  });

  test('selects service tile and advances', async ({ page }) => {
    await loginAs(page, '9999900000', 'customer');
    await page.goto(`${BASE}/customer/new`);
    await page.getByText('New Building Permit').click();
    const descBox = page.getByPlaceholder(/Property at/i);
    await descBox.fill('New house at 12 Main Street, Thrissur — 5 cents plot near station');
    await page.getByRole('button', { name: /Continue/i }).click();
    await expect(page.getByText('Step 2: Property Details')).toBeVisible();
  });

  test('blocks step 2 advance without landmark', async ({ page }) => {
    await loginAs(page, '9999900000', 'customer');
    await page.goto(`${BASE}/customer/new`);
    await page.getByText('Renovation Permit').click();
    await page.getByPlaceholder(/Property at/i).fill('Renovation of kitchen at 10 Rose Garden, Thrissur');
    await page.getByRole('button', { name: /Continue/i }).click();
    await page.getByPlaceholder('Door no., Street, City').fill('');
    await page.getByRole('button', { name: /Continue/i }).click();
    await expect(page.getByText(/Address is required|Please enter property/i)).toBeVisible();
  });

  test('completes all 4 steps and submits application', async ({ page }) => {
    await loginAs(page, '9999900000', 'customer');
    await page.goto(`${BASE}/customer/new`);

    // Step 1
    await page.getByText('New Building Permit').click();
    await page.getByPlaceholder(/Property at/i).fill('New 2-storey house at 45 MG Road, Thrissur, near railway station');
    await page.getByRole('button', { name: /Continue/i }).click();

    // Step 2
    await page.getByPlaceholder('Door no., Street, City').fill('45 MG Road, Thrissur');
    await page.getByPlaceholder('6-digit pincode').fill('680001');
    await page.getByPlaceholder('e.g. Thrissur').fill('Thrissur');
    await page.getByPlaceholder(/Near Thrissur Railway/i).fill('Near Thrissur Railway Station');
    await page.getByRole('button', { name: /Continue/i }).click();

    // Step 3 - Documents (skip upload, just continue)
    await page.getByRole('button', { name: /Continue/i }).click();

    // Step 4 - Select provider
    await expect(page.getByText('Arjun Constructions')).toBeVisible();
    await page.getByText('Arjun Constructions').click();
    await page.getByRole('button', { name: /Submit Application/i }).click();

    // Success screen
    await expect(page.getByText('Application Submitted!')).toBeVisible();
    await expect(page.getByText(/APP-/)).toBeVisible();
  });

  test('submitted application appears in My Applications', async ({ page }) => {
    await loginAs(page, '9999900000', 'customer');
    await page.goto(`${BASE}/customer/new`);

    await page.getByText('Renovation Permit').click();
    await page.getByPlaceholder(/Property at/i).fill('Kitchen renovation at MG Road near Vadakkumnathan Temple');
    await page.getByRole('button', { name: /Continue/i }).click();
    await page.getByPlaceholder('Door no., Street, City').fill('45 MG Road, Thrissur, Kerala');
    await page.getByPlaceholder('6-digit pincode').fill('680001');
    await page.getByPlaceholder('e.g. Thrissur').fill('Thrissur');
    await page.getByPlaceholder(/Near Thrissur Railway/i).fill('Near Vadakkumnathan Temple');
    await page.getByRole('button', { name: /Continue/i }).click();
    await page.getByRole('button', { name: /Continue/i }).click();
    await page.getByText('Arjun Constructions').click();
    await page.getByRole('button', { name: /Submit Application/i }).click();

    await page.getByRole('button', { name: /View My Applications/i }).click();
    await expect(page).toHaveURL(/\/customer\/applications/);
    await expect(page.getByText('Renovation Permit').first()).toBeVisible();
  });
});

// ── APPLICATION DETAIL ────────────────────────────────────────────────────────
test.describe('Application Detail Page', () => {
  test('opens application detail from My Applications', async ({ page }) => {
    await loginAs(page, '9999900000', 'customer');
    await page.goto(`${BASE}/customer/applications`);
    await page.locator('a[href*="/customer/application/"]').first().click();
    await expect(page.getByText('Application Progress')).toBeVisible();
    await expect(page.getByText('Application Details')).toBeVisible();
  });

  test('shows timeline for approved application', async ({ page }) => {
    await loginAs(page, '9999900000', 'customer');
    await page.goto(`${BASE}/customer/application/APP-2024-001`);
    await expect(page.getByText('Panchayat Approved')).toBeVisible();
    await expect(page.getByText('PERM-KL-2024-1234')).toBeVisible();
  });

  test('shows review panel for client_review application', async ({ page }) => {
    await loginAs(page, '9999900000', 'customer');
    await page.goto(`${BASE}/customer/application/APP-2024-002`);
    await expect(page.getByText('Review Plan')).toBeVisible();
    await expect(page.getByText('Approve Plan')).toBeVisible();
    await expect(page.getByText('Request Revision')).toBeVisible();
  });

  test('customer can approve plan', async ({ page }) => {
    await loginAs(page, '9999900000', 'customer');
    await page.goto(`${BASE}/customer/application/APP-2024-002`);
    await page.getByRole('button', { name: /Approve Plan/i }).click();
    await expect(page.getByText(/Plan approved/i)).toBeVisible();
  });
});
