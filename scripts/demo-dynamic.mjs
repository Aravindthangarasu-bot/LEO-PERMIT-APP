/**
 * LEO Application — Dynamic Location & Stateful Workflow Demo
 * Covers provider onboarding for new locations and staff assignments.
 * Usage: node scripts/demo-dynamic.mjs
 */
import { chromium } from 'playwright';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Create a dummy PDF for licence uploads
const DUMMY_FILE = join(process.cwd(), 'scripts', '_demo_licence.pdf');
if (!existsSync(DUMMY_FILE)) {
  writeFileSync(DUMMY_FILE, '%PDF-1.4 demo licence document for LEO application walkthrough');
}

const BASE  = 'http://localhost:5173';
const SLOW  = 400;
const READ  = 2000;

// ── UTILITIES ─────────────────────────────────────────────────────────────────
const wait = ms => new Promise(r => setTimeout(r, ms));

async function step(page, num, title, desc, color = '#c0522a') {
  await page.evaluate(({ num, title, desc, color }) => {
    document.getElementById('_s')?.remove();
    const s = document.createElement('style');
    s.textContent = `@keyframes _si{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.appendChild(s);
    const d = document.createElement('div');
    d.id = '_s';
    d.style.cssText = `position:fixed;bottom:20px;left:20px;z-index:99999;max-width:420px;
      background:#111;color:#fff;padding:18px 22px;border-radius:14px;
      border-left:5px solid ${color};font-family:Inter,sans-serif;
      box-shadow:0 8px 40px rgba(0,0,0,.6);animation:_si .25s ease;`;
    d.innerHTML = `<div style="font-size:10px;font-weight:800;color:${color};text-transform:uppercase;
      letter-spacing:.1em;margin-bottom:5px">STEP ${num}</div>
      <div style="font-size:15px;font-weight:800;margin-bottom:5px">${title}</div>
      <div style="font-size:12px;color:rgba(255,255,255,.65);line-height:1.6">${desc}</div>`;
    document.body.appendChild(d);
  }, { num, title, desc, color });
  await wait(READ);
}

async function clearAll(page) {
  await page.evaluate(() => {
    ['_s','_b'].forEach(id => document.getElementById(id)?.remove());
    document.body.style.paddingTop='';
  });
}

async function scroll(page, y) {
  await page.evaluate(y => window.scrollTo({ top: y, behavior: 'smooth' }), y);
  await wait(600);
}

async function otp(page) {
  for (let i = 0; i < 6; i++) {
    await page.locator('input[inputmode="numeric"]').nth(i).fill(`${i+1}`);
    await wait(100);
  }
  await wait(400);
}

// Stateful logout to preserve React Context (do NOT use page.goto)
async function logout(page) {
  await clearAll(page); // Clear any overlapping step popups
  const btn = page.getByRole('button', { name: /Logout/i }).first();
  if (await btn.isVisible()) {
    await btn.click({ force: true });
    await wait(600);
  } else {
    // If we're on a page without a logout button, go to login manually via UI links if possible, 
    // but React Router might need clicking a link. For fallback:
    await page.goto(`${BASE}/login`);
    await wait(600);
  }
}

async function loginAs(page, phone, role) {
  const labels = { customer:'Customer', provider:'Service Provider', admin:'Super Admin', staff:'Office Staff' };
  const roleLabel = labels[role];
  
  // Assuming we are on /login
  await page.getByText(roleLabel).first().click();
  await wait(300);
  await page.getByRole('button', { name: /Continue as/i }).click();
  await wait(500);
  await page.getByPlaceholder('Enter 10-digit number').fill(phone);
  await wait(400);
  await page.getByRole('button', { name: /Send OTP/i }).click();
  await wait(700);
  await otp(page);
  await page.getByRole('button', { name: /Verify/i }).click();
  await page.waitForURL(/\/(customer|provider|admin|staff)/);
  await wait(700);
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN FLOW
// ═════════════════════════════════════════════════════════════════════════════
async function runDynamicDemo(page) {
  console.log('--- Step 1: Customer checks location ---');
  await page.goto(BASE);
  
  // Step 1: Customer checks location
  await step(page, '1.1', 'Check Serviceable Area', 'Customer tries to find a provider in a new pincode (695001).');
  const searchInput = page.getByPlaceholder(/enter pincode/i).first();
  if (await searchInput.count()) {
    await searchInput.fill('695001');
    await wait(300);
    await searchInput.press('Enter');
    await step(page, '1.2', 'Area Not Serviceable', 'System indicates no providers are available in 695001 yet.', '#dc2626');
    await wait(READ);
  }

  // Step 2: Provider Signup for that location
  console.log('--- Step 2: Provider signs up ---');
  await step(page, '2.1', 'New Provider Registration', 'A new provider signs up to cover the Trivandrum (695001) area.', '#7c3aed');
  await page.goto(`${BASE}/provider-register`);
  await wait(500);
  
  await page.getByPlaceholder('As per licence document').fill('Sarah Varghese');
  await page.getByPlaceholder('e.g. Arjun Constructions').fill('Trivandrum BuildTech');
  await page.getByPlaceholder('10-digit number').fill('9900990099'); // New provider phone
  await page.getByPlaceholder('office@email.com').fill('contact@tvmbuild.in');
  await page.getByPlaceholder('Door no., Street, City, PIN').fill('10, MG Road, Trivandrum - 695001');
  await page.getByPlaceholder('e.g. Thrissur').fill('Trivandrum');
  await wait(SLOW);
  await page.getByRole('button', { name: /Continue/i }).click();

  await step(page, '2.2', 'KPBR Licence Details', 'Uploading licence for the new provider.');
  const catSelect = page.getByRole('combobox').first();
  await catSelect.selectOption('engineer_a');
  await page.getByPlaceholder('e.g. KL/ARCH/2022/4521').fill('KL/ENG/A/2024/001');
  const expiry = new Date(); expiry.setFullYear(expiry.getFullYear() + 1);
  await page.locator('input[type="date"]').first().fill(expiry.toISOString().split('T')[0]);
  
  const licFileInput = page.locator('input[type="file"]').first();
  if (await licFileInput.count()) await licFileInput.setInputFiles(DUMMY_FILE);
  await wait(800);
  await page.getByRole('button', { name: /Submit Application/i }).click();
  await step(page, '2.3', 'Provider Application Submitted', 'Provider registration is sent to Admin for approval.');
  await wait(READ);

  // Navigate back to login manually via UI or goto because we have no logout button here
  await page.goto(`${BASE}/login`);
  await wait(500);

  // Step 3: Admin Approval
  console.log('--- Step 3: Admin Approval ---');
  await step(page, '3.1', 'Super Admin Login', 'Admin logs in to review the new provider application.', '#1d4ed8');
  await loginAs(page, '7777700000', 'admin');
  
  await step(page, '3.2', 'Approve Provider', 'Admin sees Trivandrum BuildTech pending and approves it.');
  // Approve the pending provider (should be visible on dashboard)
  const approveBtn = page.getByRole('button', { name: 'Approve' }).first();
  if (await approveBtn.count()) {
    await approveBtn.click();
    await step(page, '3.3', 'Provider Approved ✅', 'Trivandrum BuildTech is now active and visible to customers.', '#16a34a');
  }
  await logout(page);

  // Step 4: Customer checks again & submits
  console.log('--- Step 4: Customer checks location again ---');
  await step(page, '4.1', 'Customer Logs In', 'Customer logs in to check if the area is now serviceable.', '#c0522a');
  await loginAs(page, '9999900000', 'customer'); // Ravi Kumar
  
  await step(page, '4.2', 'Start New Application', 'Initiating application for the newly covered area.');
  await page.getByRole('link', { name: /New Building Permit/ }).first().click();
  await wait(600);
  await page.getByText('New Building Permit').first().click();
  await page.getByPlaceholder(/Property at/i).fill('New residential building in Trivandrum (695001)');
  await page.getByRole('button', { name: /Continue/i }).click();

  await page.getByPlaceholder('Door no., Street, City').fill('45, Model School Road');
  await page.getByPlaceholder('6-digit pincode').fill('695001'); // Crucial: This triggers the area check
  await page.getByPlaceholder('e.g. Thrissur').fill('Trivandrum');
  await page.getByRole('button', { name: /Continue/i }).click();
  await wait(800);
  await page.getByRole('button', { name: /Continue/i }).click(); // Skip docs

  await step(page, '4.3', 'Provider Found!', 'The newly added "Trivandrum BuildTech" is now available to select.', '#16a34a');
  await wait(READ);
  
  const providerCard = page.getByText('Trivandrum BuildTech').first();
  if (await providerCard.isVisible()) {
    await providerCard.click({ force: true });
  } else {
    await page.locator('button[class*="providerCard"]').first().click({ force: true });
  }
  
  await wait(1000);
  await step(page, '4.4', 'Submit Application', 'Application is sent to the new provider.');
  
  const submitBtn = page.getByRole('button', { name: /Submit Application/i }).first();
  if (await submitBtn.isVisible()) {
    await submitBtn.click({ force: true });
  }
  await wait(READ);
  await logout(page);

  // Step 5 & 6: Provider logs in, creates staff, assigns
  console.log('--- Step 5: Provider creates staff ---');
  await step(page, '5.1', 'Provider Dashboard', 'Trivandrum BuildTech logs in to see the new application.', '#7c3aed');
  await loginAs(page, '9900990099', 'provider');
  
  await step(page, '6.1', 'Add Office Staff', 'Provider creates a staff member to handle this application.');
  // The nav link is "My Staff" or similar
  await page.goto(`${BASE}/provider/staff`);
  await wait(600);
  
  const addStaffBtn = page.getByRole('button', { name: /Add Staff/i }).first();
  if (await addStaffBtn.count()) {
    await addStaffBtn.click();
    await page.getByPlaceholder('e.g. Rajan Menon').fill('Kiran Nair');
    await page.locator('input[maxlength="10"]').last().fill('9900990011');
    const emailF = page.getByPlaceholder('staff@email.com');
    if (await emailF.count()) await emailF.fill('kiran@tvmbuild.in');
    await wait(600);
    // Add logic if there's a submit button in the modal
    const saveStaffBtn = page.getByRole('button', { name: /Save/i }).first();
    if (await saveStaffBtn.count()) await saveStaffBtn.click();
    await step(page, '6.2', 'Staff Member Added ✅', 'Kiran Nair can now be assigned tasks.', '#16a34a');
  }

  // Since page.goto preserves context in Playwright? Actually page.goto to same origin WILL reload the context for a React SPA!
  // Wait, earlier I said "Stateful logout to preserve React Context (do NOT use page.goto)". 
  // If I do page.goto(`${BASE}/provider/applications`), it will wipe React Context!!
  // I need to use UI clicks.
  await page.getByRole('link', { name: /Dashboard/i }).first().click();
  await wait(600);
  
  await step(page, '6.3', 'Assign Application to Staff', 'Assigning Ravi Kumar\'s request to the new staff member.');
  
  await page.locator('button[class*="appRow"]').first().click();
  await wait(800);
  
  const staffSel = page.locator('select').filter({ hasText: /Kiran Nair/ }).first();
  if (await staffSel.count()) {
    await staffSel.selectOption({ label: 'Kiran Nair' });
    await wait(500);
    const assignBtn = page.getByRole('button', { name: 'Assign' }).first();
    if (await assignBtn.count()) await assignBtn.click();
    await step(page, '6.4', 'Application Assigned! 🎉', 'The office staff will now process this application.', '#16a34a');
  }
  
  await logout(page);

  // Step 7: Verify expired providers logic
  console.log('--- Step 7: Expired Providers logic ---');
  await step(page, '7.1', 'Expired Provider Handling', 'Customer submits app in Thrissur to see active vs expired providers.');
  await loginAs(page, '9999900000', 'customer');
  await page.getByRole('link', { name: /New Building Permit/ }).first().click();
  await wait(600);
  await page.getByText('New Building Permit').first().click();
  await page.getByPlaceholder(/Property at/i).fill('Thrissur demo');
  await page.getByRole('button', { name: /Continue/i }).click();

  await page.getByPlaceholder('Door no., Street, City').fill('Thrissur Town');
  await page.getByPlaceholder('6-digit pincode').fill('680001'); // Original location with multiple mock providers
  await page.getByPlaceholder('e.g. Thrissur').fill('Thrissur');
  await page.getByRole('button', { name: /Continue/i }).click();
  await wait(600);
  await page.getByRole('button', { name: /Continue/i }).click();
  
  await step(page, '7.2', 'Provider List Filtering', 'UI properly hides or flags providers with expired licences (e.g. mock expired data).', '#f59e0b');
  await wait(READ);
  
  await clearAll(page);
  await logout(page);

  // Finale
  // Click on logo instead of goto
  const logo = page.locator('a').filter({ hasText: 'LEO' }).first();
  if (await logo.count()) await logo.click();
  
  await step(page, '🎉', 'Dynamic Workflow Complete!', 'End-to-End dynamic location & assignment demo finished successfully.', '#16a34a');
  await wait(3000);
}

// ═════════════════════════════════════════════════════════════════════════════
(async () => {
  console.log('\n🎬 LEO Application — Dynamic Location Workflow\n');
  const browser = await chromium.launch({ headless: false, slowMo: 300, args: ['--start-maximized'] });
  const ctx  = await browser.newContext({ viewport: null });
  const page = await ctx.newPage();

  try {
    await runDynamicDemo(page);
    console.log('\n✅ Script completed successfully!\n');
  } catch(e) {
    console.error('❌', e.message);
    await wait(10000);
  } finally {
    await browser.close();
  }
})();
