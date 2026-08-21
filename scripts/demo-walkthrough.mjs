/**
 * LEO Application — Full Workflow Demo Walkthrough
 * Runs all 4 flows visually with on-screen step banners.
 * Usage: node scripts/demo-walkthrough.mjs
 */
import { chromium } from 'playwright';

const BASE   = 'http://localhost:5176';
const SLOW   = 700;   // ms between actions
const PAUSE  = 1800;  // ms to pause on each step

// ── HELPERS ───────────────────────────────────────────────────────────────────

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function showStep(page, num, title, desc, color = '#c0522a') {
  await page.evaluate(({ num, title, desc, color }) => {
    const old = document.getElementById('_demo_overlay');
    if (old) old.remove();
    const d = document.createElement('div');
    d.id = '_demo_overlay';
    d.style.cssText = `
      position:fixed;bottom:24px;left:24px;z-index:99999;max-width:400px;
      background:#0f0f0f;color:#fff;padding:18px 22px;border-radius:14px;
      border-left:5px solid ${color};font-family:Inter,sans-serif;
      box-shadow:0 8px 40px rgba(0,0,0,.55);animation:_fadein .25s ease;
    `;
    const style = document.createElement('style');
    style.textContent = `@keyframes _fadein{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.appendChild(style);
    d.innerHTML = `
      <div style="font-size:10px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">
        Step ${num}
      </div>
      <div style="font-size:15px;font-weight:800;margin-bottom:5px">${title}</div>
      <div style="font-size:12px;color:rgba(255,255,255,.65);line-height:1.6">${desc}</div>
    `;
    document.body.appendChild(d);
  }, { num, title, desc, color });
  await wait(PAUSE);
}

async function removeOverlay(page) {
  await page.evaluate(() => { document.getElementById('_demo_overlay')?.remove(); });
}

async function fillOtp(page) {
  const boxes = page.locator('input[inputmode="numeric"]');
  for (let i = 0; i < 6; i++) await boxes.nth(i).fill((i + 1).toString());
  await wait(400);
}

async function loginAs(page, phone, role, roleName) {
  await page.goto(`${BASE}/login`);
  await wait(600);
  // Click role card
  const cardText = role === 'admin' ? 'Super Admin' : role === 'staff' ? 'Office Staff' : roleName;
  await page.getByText(cardText).first().click();
  await wait(400);
  await page.getByRole('button', { name: /Continue as/i }).click();
  await wait(600);
  await page.getByPlaceholder('Enter 10-digit number').fill(phone);
  await wait(400);
  await page.getByRole('button', { name: /Send OTP/i }).click();
  await wait(800);
  await fillOtp(page);
  await page.getByRole('button', { name: /Verify/i }).click();
  await page.waitForURL(/\/(customer|provider|admin|staff)/);
  await wait(800);
}

async function logout(page) {
  await page.getByRole('button', { name: /Logout/i }).click();
  await wait(800);
}

// ── SECTION BANNER ────────────────────────────────────────────────────────────
async function sectionBanner(page, title, subtitle, color) {
  await page.evaluate(({ title, subtitle, color }) => {
    const old = document.getElementById('_section_banner');
    if (old) old.remove();
    const d = document.createElement('div');
    d.id = '_section_banner';
    d.style.cssText = `
      position:fixed;top:0;left:0;right:0;z-index:999999;
      background:${color};color:#fff;padding:14px 28px;
      font-family:Inter,sans-serif;display:flex;align-items:center;gap:16px;
      box-shadow:0 2px 16px rgba(0,0,0,.3);
    `;
    d.innerHTML = `
      <div style="font-size:18px;font-weight:900">${title}</div>
      <div style="font-size:13px;opacity:.8">${subtitle}</div>
    `;
    document.body.appendChild(d);
    document.body.style.paddingTop = '52px';
  }, { title, subtitle, color });
  await wait(PAUSE);
}

async function removeBanner(page) {
  await page.evaluate(() => {
    document.getElementById('_section_banner')?.remove();
    document.body.style.paddingTop = '';
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FLOW 1 — NEW CUSTOMER SIGNUP & FIRST APPLICATION
// ═══════════════════════════════════════════════════════════════════════════════
async function flow1NewCustomer(page) {
  await sectionBanner(page, '🏠 Flow 1: New Customer', 'Sign up → Submit first permit application', '#c0522a');

  await page.goto(BASE);
  await showStep(page, '1.1', 'Landing Page', 'Customer discovers LEO and clicks Get Started.');
  await wait(500);

  await page.getByRole('link', { name: 'Get Started' }).first().click();
  await page.waitForURL(/\/get-started/);
  await showStep(page, '1.2', 'Choose Account Type', 'Customer selects "I\'m a Customer" to create a new account.');

  await page.getByRole('link', { name: /Sign up as Customer/i }).click();
  await page.waitForURL(/\/signup/);
  await showStep(page, '1.3', 'Customer Signup Form', 'Filling in Name, Mobile, Email, Pincode and Address.');

  await page.getByPlaceholder('As per Aadhaar card').fill('Anita Krishnan');
  await wait(SLOW);
  await page.getByPlaceholder('10-digit number').fill('9988776655');
  await wait(SLOW);
  await page.getByPlaceholder('your@email.com').fill('anita@example.com');
  await wait(SLOW);
  await page.getByPlaceholder('6-digit pincode').fill('680001');
  await wait(SLOW);
  await page.getByPlaceholder('Door no., Street, City').fill('24, Nehru Street, Thrissur, Kerala');
  await wait(SLOW);

  await showStep(page, '1.4', 'OTP Verification', 'Customer receives OTP and verifies their mobile number.');
  await page.getByRole('button', { name: /Send OTP/i }).click();
  await wait(800);
  await fillOtp(page);
  await page.getByRole('button', { name: /Verify/i }).click();
  await page.waitForURL(/\/customer/);
  await showStep(page, '1.5', 'Customer Dashboard', 'Welcome! 13 service tiles are shown. Clicking "New Building Permit".');

  await wait(800);
  await page.getByRole('link', { name: 'New Building Permit' }).first().click();
  await wait(600);

  // Step 1 — Select service
  await showStep(page, '1.6', 'New Application — Step 1', 'Selecting service type and describing the project.');
  await page.getByText('New Building Permit').first().click();
  await wait(SLOW);
  await page.getByPlaceholder(/Property at/i).fill('G+2 residential house at 24 Nehru Street near Thrissur Railway Station — 8 cents plot');
  await wait(SLOW);
  await page.getByRole('button', { name: /Continue/i }).click();

  // Step 2 — Property details
  await showStep(page, '1.7', 'New Application — Step 2', 'Entering property address, landmark & building specifications.');
  await page.getByPlaceholder('Door no., Street, City').fill('24, Nehru Street, Thrissur');
  await wait(SLOW);
  await page.getByPlaceholder('6-digit pincode').fill('680001');
  await wait(SLOW);
  await page.getByPlaceholder('e.g. Thrissur').fill('Thrissur');
  await wait(SLOW);
  await page.getByPlaceholder(/Near Thrissur Railway/i).fill('Near Thrissur Railway Station');
  await wait(SLOW);
  // Building specs
  const areaInput = page.getByPlaceholder('e.g. 250');
  if (await areaInput.count()) { await areaInput.fill('450'); await wait(SLOW); }
  const floorInput = page.getByPlaceholder('e.g. 2', { exact: true });
  if (await floorInput.count()) { await floorInput.fill('2'); await wait(SLOW); }
  const heightInput = page.getByPlaceholder('e.g. 7.5');
  if (await heightInput.count()) { await heightInput.fill('8'); await wait(SLOW); }
  await page.getByRole('button', { name: /Continue/i }).click();

  // Step 3 — Documents
  await showStep(page, '1.8', 'New Application — Step 3', 'Documents required are listed. Customer will upload these.');
  await wait(PAUSE);
  await page.getByRole('button', { name: /Continue/i }).click();

  // Step 4 — Choose provider
  await showStep(page, '1.9', 'New Application — Step 4', 'Smart provider matching based on landmark & licence limits. Selecting Arjun Constructions.');
  await wait(800);
  await page.getByText('Arjun Constructions').first().click();
  await wait(SLOW);
  await page.getByRole('button', { name: /Submit Application/i }).click();

  await showStep(page, '1.10', 'Application Submitted! ✅', 'Application sent to provider. Customer receives a reference ID.', '#16a34a');
  await wait(PAUSE);

  await page.getByRole('button', { name: /View My Applications/i }).click();
  await wait(800);
  await showStep(page, '1.11', 'My Applications', 'New application is immediately visible with "Pending" status.', '#6366f1');
  await wait(PAUSE);

  await removeBanner(page);
  await removeOverlay(page);
  await logout(page);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FLOW 2 — EXISTING CUSTOMER (Historical Applications + Plan Review)
// ═══════════════════════════════════════════════════════════════════════════════
async function flow2ExistingCustomer(page) {
  await sectionBanner(page, '📋 Flow 2: Existing Customer', 'View historical applications → Review & approve plan', '#3b82f6');

  await loginAs(page, '9999900000', 'customer', 'Customer');
  await showStep(page, '2.1', 'Existing Customer Dashboard', 'Ravi Kumar logs in. Dashboard shows existing application stats.', '#3b82f6');
  await wait(500);

  await page.goto(`${BASE}/customer/applications`);
  await showStep(page, '2.2', 'My Applications', 'Historical applications: APP-2024-001 (Approved), APP-2024-002 (Awaiting Review).', '#3b82f6');
  await wait(PAUSE);

  // View approved application
  await page.getByRole('link', { name: /APP-2024-001/ }).first().click();
  await showStep(page, '2.3', 'Approved Application — APP-2024-001', 'Full timeline shown. Panchayat approved. Approval number PERM-KL-2024-1234 displayed.', '#16a34a');
  await wait(PAUSE);

  // Go to plan review application
  await page.goto(`${BASE}/customer/application/APP-2024-002`);
  await showStep(page, '2.4', 'Application Awaiting Plan Review — APP-2024-002', 'Provider has uploaded a plan. Customer reviews it here.', '#f59e0b');
  await wait(PAUSE);

  // Approve the plan
  await page.getByRole('button', { name: /Approve Plan/i }).first().click();
  await showStep(page, '2.5', 'Plan Approved ✅', 'Customer approved the plan. Application moves to "Authority Review".', '#16a34a');
  await wait(PAUSE);

  // View notifications
  await page.goto(`${BASE}/customer/notifications`);
  await showStep(page, '2.6', 'Notifications', 'Customer sees all status update notifications with provider contact details.', '#3b82f6');
  await wait(PAUSE);

  await removeBanner(page);
  await removeOverlay(page);
  await logout(page);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FLOW 3 — SERVICE PROVIDER (Acknowledge + Assign to Staff)
// ═══════════════════════════════════════════════════════════════════════════════
async function flow3Provider(page) {
  await sectionBanner(page, '🏗️ Flow 3: Service Provider', 'Acknowledge requests → Assign to staff → Upload plan', '#15803d');

  await loginAs(page, '8888800000', 'provider', 'Service Provider');
  await showStep(page, '3.1', 'Provider Dashboard — Arjun Constructions', 'Provider sees assigned applications, licence profile and expiry status.', '#15803d');
  await wait(PAUSE);

  await page.goto(`${BASE}/provider/applications`);
  await showStep(page, '3.2', 'Assigned Applications', 'All applications assigned to this provider are listed here.', '#15803d');
  await wait(500);

  await page.getByText('APP-2024-002').click();
  await showStep(page, '3.3', 'Application Detail — APP-2024-002', 'Provider selects the application to see customer details and take action.', '#15803d');
  await wait(PAUSE);

  // Acknowledge
  const ackBtn = page.getByRole('button', { name: /Acknowledge/i }).first();
  if (await ackBtn.count()) {
    await showStep(page, '3.4', 'Acknowledging Request', 'Provider acknowledges the request. Customer receives a notification with provider\'s mobile number.', '#15803d');
    await ackBtn.click();
    await wait(PAUSE);
  }

  // Assign to staff
  const staffSelect = page.locator('select').filter({ hasText: /Select staff member/ }).first();
  if (await staffSelect.count()) {
    await showStep(page, '3.5', 'Assigning to Staff', 'Provider assigns the request to Rajan Menon. Customer is notified with staff contact.', '#15803d');
    await staffSelect.selectOption({ index: 1 });
    await wait(SLOW);
    await page.getByRole('button', { name: 'Assign' }).first().click();
    await wait(PAUSE);
  }

  // My Staff
  await page.goto(`${BASE}/provider/staff`);
  await showStep(page, '3.6', 'My Staff Management', 'Provider manages office staff — add, assign work, activate/deactivate.', '#15803d');
  await wait(PAUSE);

  await removeBanner(page);
  await removeOverlay(page);
  await logout(page);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FLOW 4 — OFFICE STAFF (View Assigned Work + Update Status)
// ═══════════════════════════════════════════════════════════════════════════════
async function flow4Staff(page) {
  await sectionBanner(page, '👨‍💼 Flow 4: Office Staff', 'Login → View assigned work → Update application status', '#7c3aed');

  await loginAs(page, '8777700001', 'staff', 'Office Staff');
  await showStep(page, '4.1', 'Staff Portal — Rajan Menon', 'Staff sees only applications assigned to them by their provider. Complete data isolation.', '#7c3aed');
  await wait(PAUSE);

  await page.goto(`${BASE}/staff/applications`);
  await showStep(page, '4.2', 'My Assignments', 'Only work assigned to this staff member is visible. Other provider\'s data is inaccessible.', '#7c3aed');
  await wait(PAUSE);

  const firstApp = page.locator('button[class*="appRow"]').first();
  if (await firstApp.count()) {
    await firstApp.click();
    await showStep(page, '4.3', 'Application Detail', 'Staff reviews customer details, documents and updates the status.', '#7c3aed');
    await wait(PAUSE);

    const reviewBtn = page.getByRole('button', { name: /Under Review/i }).first();
    if (await reviewBtn.count()) {
      await showStep(page, '4.4', 'Updating Status', 'Staff marks the application as "Under Review". Customer is notified automatically.', '#7c3aed');
      await reviewBtn.click();
      await wait(PAUSE);
    }
  }

  await removeBanner(page);
  await removeOverlay(page);
  await logout(page);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FLOW 5 — SUPER ADMIN (Approve Provider + Manage All Applications)
// ═══════════════════════════════════════════════════════════════════════════════
async function flow5Admin(page) {
  await sectionBanner(page, '🔐 Flow 5: Super Admin', 'Approve new provider → Manage all applications → View providers', '#1d4ed8');

  await loginAs(page, '7777700000', 'admin', 'Super Admin');
  await showStep(page, '5.1', 'Admin Dashboard', 'System overview: pending provider approvals, expired licences, all applications.', '#1d4ed8');
  await wait(PAUSE);

  // Approve pending provider from dashboard
  const approveBtn = page.getByRole('button', { name: 'Approve' }).first();
  if (await approveBtn.count()) {
    await showStep(page, '5.2', 'Pending Provider Request', 'QuickApprove Solutions has self-registered. Admin approves it directly from dashboard.', '#1d4ed8');
    await approveBtn.click();
    await wait(PAUSE);
    await showStep(page, '5.3', 'Provider Activated ✅', 'Provider is now active and visible to customers when selecting for applications.', '#16a34a');
    await wait(PAUSE);
  }

  // All applications
  await page.goto(`${BASE}/admin/applications`);
  await showStep(page, '5.4', 'All Applications', 'Admin sees every application in the system. Can filter, search and assign providers.', '#1d4ed8');
  await wait(500);

  // Assign provider to unassigned
  const selectEl = page.locator('select').first();
  if (await selectEl.count()) {
    await showStep(page, '5.5', 'Assigning Provider to Application', 'Admin selects an active provider for an unassigned application.', '#1d4ed8');
    await selectEl.selectOption({ index: 1 });
    await wait(SLOW);
    const assignBtn = page.getByRole('button', { name: 'Assign' }).first();
    if (await assignBtn.count()) { await assignBtn.click(); await wait(SLOW); }
    await wait(PAUSE);
  }

  // Manage providers
  await page.goto(`${BASE}/admin/providers`);
  await showStep(page, '5.6', 'Service Providers', 'All providers listed. Licence expiry warnings shown. Can filter by Active / Pending / Expired.', '#1d4ed8');
  await wait(PAUSE);

  // Click a provider
  await page.locator('button[class*="providerRow"]').first().click();
  await showStep(page, '5.7', 'Provider Detail', 'Full KPBR licence info, ML verification status, building limits, documents.', '#1d4ed8');
  await wait(PAUSE);

  // Add provider form
  await page.goto(`${BASE}/admin/add-provider`);
  await showStep(page, '5.8', 'Add Provider (4-Step Form)', 'Admin can onboard a new provider manually: business details → licence → optional info → review.', '#1d4ed8');
  await wait(PAUSE);

  await removeBanner(page);
  await removeOverlay(page);

  // Final screen
  await page.goto(BASE);
  await page.evaluate(() => {
    const d = document.createElement('div');
    d.style.cssText = `
      position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.85);
      display:flex;align-items:center;justify-content:center;font-family:Inter,sans-serif;
    `;
    d.innerHTML = `
      <div style="text-align:center;color:#fff;max-width:480px;padding:48px">
        <div style="font-size:56px;margin-bottom:20px">✅</div>
        <div style="font-size:28px;font-weight:900;margin-bottom:12px">Demo Complete!</div>
        <div style="font-size:16px;color:rgba(255,255,255,.7);line-height:1.8">
          All 5 flows demonstrated:<br>
          🏠 New Customer  ·  📋 Existing Customer<br>
          🏗️ Service Provider  ·  👨‍💼 Office Staff  ·  🔐 Super Admin
        </div>
      </div>
    `;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 5000);
  });
  await wait(5000);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════════════
(async () => {
  console.log('\n🎬 LEO Application — Full Workflow Demo\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: SLOW,
    args: ['--start-maximized'],
  });

  const context = await browser.newContext({
    viewport: null, // use full window
  });
  const page = await context.newPage();

  try {
    await flow1NewCustomer(page);
    console.log('✅ Flow 1 complete — New Customer');

    await flow2ExistingCustomer(page);
    console.log('✅ Flow 2 complete — Existing Customer');

    await flow3Provider(page);
    console.log('✅ Flow 3 complete — Service Provider');

    await flow4Staff(page);
    console.log('✅ Flow 4 complete — Office Staff');

    await flow5Admin(page);
    console.log('✅ Flow 5 complete — Super Admin');

    console.log('\n🎉 All flows completed successfully!\n');
  } catch (err) {
    console.error('❌ Demo error:', err.message);
    // Keep browser open for debugging
    await wait(10000);
  } finally {
    await browser.close();
  }
})();
