/**
 * AGENT 3 — Super Admin Agent
 * Tests: Login, dashboard overview, all applications management,
 *        provider assignment, provider onboarding (add + activate),
 *        provider suspension.
 */
import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers';

const BASE = 'http://localhost:5177';

// ── ADMIN LOGIN ───────────────────────────────────────────────────────────────
test.describe('Admin Login', () => {
  test('logs in as super admin and reaches dashboard', async ({ page }) => {
    await loginAs(page, '7777700000', 'admin');
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByText('Admin Dashboard')).toBeVisible();
  });
});

// ── ADMIN DASHBOARD ───────────────────────────────────────────────────────────
test.describe('Admin Dashboard Overview', () => {
  test('shows all stat cards', async ({ page }) => {
    await loginAs(page, '7777700000', 'admin');
    await expect(page.getByText('Total Applications')).toBeVisible();
    await expect(page.getByText('Pending Review')).toBeVisible();
    await expect(page.getByText('Approved')).toBeVisible();
    await expect(page.getByText('Total Providers')).toBeVisible();
    await expect(page.getByText('Active Providers')).toBeVisible();
    await expect(page.getByText('Pending Approval')).toBeVisible();
  });

  test('shows recent applications table', async ({ page }) => {
    await loginAs(page, '7777700000', 'admin');
    await expect(page.getByText('Recent Applications')).toBeVisible();
    await expect(page.getByText('APP-2024-001')).toBeVisible();
    await expect(page.getByText('Arjun Constructions')).toBeVisible();
  });

  test('shows providers awaiting approval', async ({ page }) => {
    await loginAs(page, '7777700000', 'admin');
    await expect(page.getByText('Providers Awaiting Approval')).toBeVisible();
    await expect(page.getByText('QuickApprove Solutions')).toBeVisible();
  });

  test('view all applications link navigates correctly', async ({ page }) => {
    await loginAs(page, '7777700000', 'admin');
    await page.getByRole('link', { name: /View all/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/applications/);
  });
});

// ── ALL APPLICATIONS ──────────────────────────────────────────────────────────
test.describe('Admin — All Applications', () => {
  test('shows all applications in table', async ({ page }) => {
    await loginAs(page, '7777700000', 'admin');
    await page.goto(`${BASE}/admin/applications`);
    await expect(page.getByText('APP-2024-001')).toBeVisible();
    await expect(page.getByText('APP-2024-002')).toBeVisible();
    await expect(page.getByText('APP-2024-003')).toBeVisible();
    await expect(page.getByText('APP-2024-004')).toBeVisible();
  });

  test('can filter by status', async ({ page }) => {
    await loginAs(page, '7777700000', 'admin');
    await page.goto(`${BASE}/admin/applications`);
    await page.getByRole('button', { name: 'Pending' }).first().click();
    await expect(page.getByText('APP-2024-001')).not.toBeVisible();
  });

  test('can search by customer name', async ({ page }) => {
    await loginAs(page, '7777700000', 'admin');
    await page.goto(`${BASE}/admin/applications`);
    await page.getByPlaceholder(/Search by ID/i).fill('Priya');
    await expect(page.getByText('APP-2024-003')).toBeVisible();
    await expect(page.getByText('APP-2024-001')).not.toBeVisible();
  });

  test('can assign provider to unassigned application', async ({ page }) => {
    await loginAs(page, '7777700000', 'admin');
    await page.goto(`${BASE}/admin/applications`);
    // Find row with Unassigned and assign a provider
    const assignSelect = page.locator('select').first();
    await assignSelect.selectOption({ index: 1 }); // pick first active provider
    await page.getByRole('button', { name: 'Assign' }).first().click();
    await expect(page.getByText('Under Review').first()).toBeVisible();
  });

  test('shows Unassigned badge for applications without provider', async ({ page }) => {
    await loginAs(page, '7777700000', 'admin');
    await page.goto(`${BASE}/admin/applications`);
    // APP-2024-003 has no assigned provider initially
    await expect(page.getByText('Unassigned').first()).toBeVisible();
  });
});

// ── SERVICE PROVIDERS MANAGEMENT ─────────────────────────────────────────────
test.describe('Admin — Manage Providers', () => {
  test('shows all providers list', async ({ page }) => {
    await loginAs(page, '7777700000', 'admin');
    await page.goto(`${BASE}/admin/providers`);
    await expect(page.getByText('Arjun Constructions')).toBeVisible();
    await expect(page.getByText('BuildRight Engineers')).toBeVisible();
    await expect(page.getByText('QuickApprove Solutions')).toBeVisible();
    await expect(page.getByText('Kerala Plan Experts')).toBeVisible();
  });

  test('can filter providers by status', async ({ page }) => {
    await loginAs(page, '7777700000', 'admin');
    await page.goto(`${BASE}/admin/providers`);
    await page.getByRole('button', { name: 'Pending' }).click();
    await expect(page.getByText('QuickApprove Solutions')).toBeVisible();
    await expect(page.getByText('Arjun Constructions')).not.toBeVisible();
  });

  test('clicking provider shows detail panel', async ({ page }) => {
    await loginAs(page, '7777700000', 'admin');
    await page.goto(`${BASE}/admin/providers`);
    await page.getByText('Arjun Constructions').first().click();
    await expect(page.getByText('LIC-KL-2022-4521')).toBeVisible();
    await expect(page.getByText('Thrissur')).toBeVisible();
    await expect(page.getByText('New Building Permit')).toBeVisible();
  });

  test('can activate a pending provider', async ({ page }) => {
    await loginAs(page, '7777700000', 'admin');
    await page.goto(`${BASE}/admin/providers`);
    await page.getByText('QuickApprove Solutions').first().click();
    await page.getByRole('button', { name: /Activate Provider/i }).click();
    await expect(page.getByText(/activated successfully/i)).toBeVisible();
  });

  test('can suspend an active provider', async ({ page }) => {
    await loginAs(page, '7777700000', 'admin');
    await page.goto(`${BASE}/admin/providers`);
    await page.getByText('BuildRight Engineers').first().click();
    await page.getByRole('button', { name: /Suspend Provider/i }).click();
    await expect(page.getByText(/suspended/i)).toBeVisible();
  });

  test('shows verified document list for active provider', async ({ page }) => {
    await loginAs(page, '7777700000', 'admin');
    await page.goto(`${BASE}/admin/providers`);
    await page.getByText('Arjun Constructions').first().click();
    await expect(page.getByText('Business License.pdf')).toBeVisible();
    await expect(page.getByText('GST Certificate.pdf')).toBeVisible();
  });
});

// ── ADD PROVIDER FLOW ─────────────────────────────────────────────────────────
test.describe('Admin — Add New Provider', () => {
  test('navigates to add provider page', async ({ page }) => {
    await loginAs(page, '7777700000', 'admin');
    await page.goto(`${BASE}/admin/add-provider`);
    await expect(page.getByText('Add Service Provider')).toBeVisible();
    await expect(page.getByText('Step 1: Provider Details')).toBeVisible();
  });

  test('blocks step 1 with empty fields', async ({ page }) => {
    await loginAs(page, '7777700000', 'admin');
    await page.goto(`${BASE}/admin/add-provider`);
    await page.getByRole('button', { name: /Continue/i }).click();
    await expect(page.getByText('Required').first()).toBeVisible();
  });

  test('blocks step 1 with invalid phone', async ({ page }) => {
    await loginAs(page, '7777700000', 'admin');
    await page.goto(`${BASE}/admin/add-provider`);
    await page.getByPlaceholder('e.g. Arjun Constructions').fill('Test Provider');
    await page.getByPlaceholder('10-digit number').fill('12345');
    await page.getByPlaceholder('provider@email.com').fill('test@test.com');
    await page.getByPlaceholder('e.g. Coimbatore').fill('Kochi');
    await page.getByRole('button', { name: /Continue/i }).click();
    await expect(page.getByText(/valid 10-digit/i)).toBeVisible();
  });

  test('completes all 3 steps and submits new provider', async ({ page }) => {
    await loginAs(page, '7777700000', 'admin');
    await page.goto(`${BASE}/admin/add-provider`);

    // Step 1
    await page.getByPlaceholder('e.g. Arjun Constructions').fill('Kochi Build Experts');
    await page.getByPlaceholder('10-digit number').fill('9988776655');
    await page.getByPlaceholder('provider@email.com').fill('kochi@buildexperts.in');
    await page.getByPlaceholder('e.g. Coimbatore').fill('Ernakulam');
    await page.getByRole('button', { name: /Continue/i }).click();

    // Step 2
    await page.getByPlaceholder(/LIC-TN/i).fill('LIC-KL-2025-9999');
    await page.getByPlaceholder('').first().fill('2028-12-31');
    // Select at least one specialization
    await page.getByText('New Building Permit').first().click();
    await page.getByRole('button', { name: /Continue/i }).click();

    // Step 3 - Documents (skip upload)
    await page.getByRole('button', { name: /Add Provider/i }).click();

    await expect(page.getByText('Provider Added!')).toBeVisible();
  });
});

// ── ADMIN NAVIGATION ──────────────────────────────────────────────────────────
test.describe('Admin Portal Navigation', () => {
  test('all sidebar links are present', async ({ page }) => {
    await loginAs(page, '7777700000', 'admin');
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Service Providers')).toBeVisible();
    await expect(page.getByText('Add Provider')).toBeVisible();
    await expect(page.getByText('All Applications')).toBeVisible();
    await expect(page.getByText('Reports')).toBeVisible();
    await expect(page.getByText('Settings')).toBeVisible();
  });

  test('logout redirects to landing page', async ({ page }) => {
    await loginAs(page, '7777700000', 'admin');
    await page.getByRole('button', { name: /Logout/i }).click();
    await expect(page).toHaveURL('/');
  });
});
