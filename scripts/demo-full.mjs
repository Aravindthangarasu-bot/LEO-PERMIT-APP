/**
 * LEO Application — COMPLETE Detailed Workflow Demo
 * Covers every screen, every action, every status change — pin to pin.
 * Usage: node scripts/demo-full.mjs
 */
import { chromium } from 'playwright';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Create a tiny dummy PDF for licence upload demos
const DUMMY_FILE = join(process.cwd(), 'scripts', '_demo_licence.pdf');
if (!existsSync(DUMMY_FILE)) {
  writeFileSync(DUMMY_FILE, '%PDF-1.4 demo licence document for LEO application walkthrough');
}

const BASE  = 'http://localhost:5173';
const SLOW  = 600;   // ms between typed characters (via fill, not type)
const READ  = 2200;  // pause to read a step
const QUICK = 900;   // quick pause after click

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

async function banner(page, icon, title, sub, color) {
  await page.evaluate(({ icon, title, sub, color }) => {
    document.getElementById('_b')?.remove();
    const d = document.createElement('div');
    d.id = '_b';
    d.style.cssText = `position:fixed;top:0;left:0;right:0;z-index:999999;
      background:${color};color:#fff;padding:12px 24px;display:flex;
      align-items:center;gap:14px;font-family:Inter,sans-serif;
      box-shadow:0 2px 20px rgba(0,0,0,.3);`;
    d.innerHTML = `<div style="font-size:20px">${icon}</div>
      <div><div style="font-size:15px;font-weight:900">${title}</div>
      <div style="font-size:11px;opacity:.8">${sub}</div></div>`;
    document.body.appendChild(d);
    document.body.style.paddingTop='48px';
  }, { icon, title, sub, color });
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
    await wait(120);
  }
  await wait(400);
}

async function loginAs(page, phone, role) {
  await page.goto(`${BASE}/login`);
  await wait(500);
  const labels = { customer:'Customer', provider:'Service Provider', admin:'Super Admin', staff:'Office Staff' };
  await page.getByText(labels[role]).first().click();
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

async function logout(page) {
  const btn = page.getByRole('button', { name: /Logout/i }).first();
  if (await btn.isVisible()) await btn.click();
  await wait(600);
}

// ═════════════════════════════════════════════════════════════════════════════
// FLOW 1A — NEW CUSTOMER: Landing → Signup → New Application (complete)
// ═════════════════════════════════════════════════════════════════════════════
async function flow1a_newCustomer(page) {
  await banner(page,'🏠','Flow 1A — New Customer','Landing page → Signup → Full permit application','#c0522a');

  // Landing page tour
  await page.goto(BASE);
  await step(page,'1A.1','LEO Landing Page','Hero tagline, service cards, How It Works, and CTA sections visible.');
  await scroll(page, 400);
  await wait(700);
  await scroll(page, 800);
  await wait(700);
  await scroll(page, 1200);
  await wait(700);
  await scroll(page, 0);

  // Get Started
  await step(page,'1A.2','Click "Get Started"','Customer clicks the Get Started button on the navbar.');
  await page.getByRole('link', { name: 'Get Started' }).first().click();
  await page.waitForURL(/\/get-started/);
  await step(page,'1A.3','Choose Account Type','Two options: Customer or Service Provider. Customer selects their type.');
  await wait(READ);

  // Signup
  await page.getByRole('link', { name: /Sign up as Customer/i }).click();
  await page.waitForURL(/\/signup/);
  await step(page,'1A.4','Customer Signup Form','5 mandatory fields: Name, Mobile, Email, Pincode, Address.');

  // Show validation — click Send OTP with empty form
  await page.getByRole('button', { name: /Send OTP/i }).click();
  await step(page,'1A.5','Validation in Action','All required fields show error messages when form is submitted empty.', '#ef4444');
  await wait(READ);

  // Fill correctly
  await page.getByPlaceholder('As per Aadhaar card').fill('Anita Krishnan');
  await wait(SLOW);
  await page.getByPlaceholder('10-digit number').fill('9988776655');
  await wait(SLOW);
  await page.getByPlaceholder('your@email.com').fill('anita.krishnan@gmail.com');
  await wait(SLOW);
  await page.getByPlaceholder('6-digit pincode').fill('680001');
  await wait(SLOW);
  await page.getByPlaceholder('Door no., Street, City').fill('24, Nehru Street, Thrissur, Kerala');
  await wait(SLOW);
  await step(page,'1A.6','Form Filled — Valid ✅','All fields are valid. Green tick shown on each. Sending OTP now.');
  await page.getByRole('button', { name: /Send OTP/i }).click();
  await wait(800);

  // OTP
  await step(page,'1A.7','OTP Verification','6-digit OTP sent to +91 9988776655. Customer enters it to verify.');
  await otp(page);
  await page.getByRole('button', { name: /Verify.*Account/i }).click();
  await page.waitForURL(/\/customer/);

  // Dashboard
  await step(page,'1A.8','Customer Dashboard Loaded 🎉','Welcome Anita! 13 service tiles visible. Stats show 0 applications.');
  await scroll(page, 200);
  await wait(700);
  await scroll(page, 0);

  // New Application — Step 1
  await page.getByRole('link', { name: /New Building Permit/ }).first().click();
  await wait(600);
  await step(page,'1A.9','Step 1: Select Service','Click the service type tile. Description box appears for project summary.');
  await page.getByText('New Building Permit').first().click();
  await wait(SLOW);
  await step(page,'1A.10','Required Documents Preview','System shows the 4 common documents required for this service type.');
  await wait(READ);
  await page.getByPlaceholder(/Property at/i).fill('New G+2 residential building at 24 Nehru Street near Thrissur Railway Station — 450 sq.ft plot, 2 floors, 8m height');
  await wait(SLOW);
  await page.getByRole('button', { name: /Continue/i }).click();

  // Step 2
  await step(page,'1A.11','Step 2: Property Details + Building Specs','Address, landmark and building dimensions for smart provider matching.');
  await page.getByPlaceholder('Door no., Street, City').fill('24, Nehru Street, Thrissur');
  await wait(SLOW);
  await page.getByPlaceholder('6-digit pincode').fill('680001');
  await wait(SLOW);
  await page.getByPlaceholder('e.g. Thrissur').fill('Thrissur');
  await wait(SLOW);
  await page.getByPlaceholder(/Near Thrissur Railway/i).fill('Near Thrissur Railway Station');
  await wait(SLOW);
  const area = page.getByPlaceholder('e.g. 250');
  if (await area.count()) { await area.fill('450'); await wait(400); }
  const floors = page.getByPlaceholder('e.g. 2', { exact: true });
  if (await floors.count()) { await floors.fill('2'); await wait(400); }
  const height = page.getByPlaceholder('e.g. 7.5');
  if (await height.count()) { await height.fill('8'); await wait(400); }
  await step(page,'1A.12','Building Specs Set','450 m² / 2 floors / 8m. Providers with Supervisor-B (≤300 m²) will be excluded.','#3b82f6');
  await page.getByRole('button', { name: /Continue/i }).click();

  // Step 3
  await step(page,'1A.13','Step 3: Upload Documents','5 required documents listed: Land Deed, Land Tax Receipt, Possession Certificate, Aadhaar, Site Landmark Photo.');
  await wait(READ);
  await page.getByRole('button', { name: /Continue/i }).click();

  // Step 4
  await step(page,'1A.14','Step 4: Choose Provider (KPBR-filtered)','Only providers whose licence can handle 450 m² / 2 floors shown. Supervisor-B hidden.');
  await wait(READ);
  await page.getByText('Arjun Constructions').first().click();
  await wait(SLOW);
  await step(page,'1A.15','Provider Selected — Arjun Constructions','Engineer-A licence (unlimited). Highest rated. Located near Thrissur Railway Station.');
  await page.getByRole('button', { name: /Submit Application/i }).click();

  await step(page,'1A.16','Application Submitted! 🎉','Reference ID generated. Provider notified. Application status: Pending.','#16a34a');
  await wait(READ);

  // View in My Applications
  await page.getByRole('button', { name: /View My Applications/i }).click();
  await step(page,'1A.17','My Applications — New Entry','Application immediately visible with "Pending" status. Click to view detail.');
  const newApp = page.locator('a[href*="/customer/application/"]').first();
  if (await newApp.count()) {
    await newApp.click();
    await step(page,'1A.18','Application Detail & Timeline','7-stage lifecycle timeline. Current stage highlighted. Site visit dates section visible.');
    await wait(READ);
    // Propose site visit dates
    const dateInputs = page.locator('input[type="date"]');
    if (await dateInputs.count() >= 1) {
      await step(page,'1A.19','Proposing 3 Site Visit Dates','Customer suggests 3 available dates for the provider to confirm a visit.');
      const today = new Date();
      const d1 = new Date(today); d1.setDate(d1.getDate() + 5);
      const d2 = new Date(today); d2.setDate(d2.getDate() + 7);
      const d3 = new Date(today); d3.setDate(d3.getDate() + 10);
      const fmt = d => d.toISOString().split('T')[0];
      await dateInputs.nth(0).fill(fmt(d1)); await wait(300);
      if (await dateInputs.count() > 1) { await dateInputs.nth(1).fill(fmt(d2)); await wait(300); }
      if (await dateInputs.count() > 2) { await dateInputs.nth(2).fill(fmt(d3)); await wait(300); }
      const submitDates = page.getByRole('button', { name: /Submit Dates/i });
      if (await submitDates.count()) { await submitDates.click(); await step(page,'1A.20','Dates Submitted ✅','Provider will receive the 3 proposed dates and confirm one.','#16a34a'); }
    }
  }

  await clearAll(page);
  await logout(page);
}

// ═════════════════════════════════════════════════════════════════════════════
// FLOW 1B — EXISTING CUSTOMER: Historical apps, plan review, notifications
// ═════════════════════════════════════════════════════════════════════════════
async function flow1b_existingCustomer(page) {
  await banner(page,'📋','Flow 1B — Existing Customer','Historical applications → Plan review → Notifications','#3b82f6');
  await loginAs(page, '9999900000', 'customer');

  // Dashboard
  await step(page,'1B.1','Ravi Kumar — Existing Customer Dashboard','Stats show 2 assigned applications. Recent apps listed with status badges.');
  await scroll(page, 300); await wait(500); await scroll(page, 0);

  // My Applications list
  await page.goto(`${BASE}/customer/applications`);
  await step(page,'1B.2','My Applications — All History','Filter by: All / Under Review / Client Review / Approved. Search by ID or address.');
  await wait(READ);

  // Filter demo — use visible text safely
  const authorityBtn = page.getByRole('button', { name: 'Authority Approved' }).first();
  if (await authorityBtn.isVisible()) {
    await authorityBtn.click();
    await wait(800);
    await step(page,'1B.3','Filter: Authority Approved','Only APP-2024-001 visible. All others filtered out.', '#16a34a');
    await page.getByRole('button', { name: /^All$/ }).first().click();
    await wait(600);
  }

  // Approved app detail
  await page.goto(`${BASE}/customer/application/APP-2024-001`);
  await step(page,'1B.4','APP-2024-001 — Fully Approved ✅','Complete lifecycle timeline: all stages done. Approval number PERM-KL-2024-1234 shown.');
  await wait(READ);
  await scroll(page, 300);
  await step(page,'1B.5','Download Approval Letter','Download button visible for approved applications. Provider name and contact recorded.','#16a34a');
  await wait(READ);
  await scroll(page, 0);

  // Plan review app
  await page.goto(`${BASE}/customer/application/APP-2024-002`);
  await step(page,'1B.6','APP-2024-002 — Awaiting Your Review','Provider has uploaded a plan. Customer must either approve or request changes.');
  await wait(READ);

  // Request revision first
  const commentBox = page.getByPlaceholder(/Describe any changes/i);
  if (await commentBox.count()) {
    await commentBox.fill('Please widen the kitchen area by 2 feet and add a separate utility room as discussed.');
    await wait(SLOW);
    await step(page,'1B.7','Requesting Revision','Customer types specific revision request. Provider will revise the plan.','#f59e0b');
    const revBtn = page.getByRole('button', { name: /Request Revision/i });
    if (await revBtn.count()) {
      await revBtn.click();
      await step(page,'1B.8','Revision Requested ✅','Plan revision sent to provider. Status: "Revision Requested". Provider notified.','#f59e0b');
    }
  }

  // Now approve (go back, reload, approve)
  await page.goto(`${BASE}/customer/application/APP-2024-002`);
  await wait(800);
  const approveBtn = page.getByRole('button', { name: /Approve Plan/i });
  if (await approveBtn.count()) {
    await step(page,'1B.9','Approving the Plan','After reviewing, customer approves the plan. Sent to Authority for final approval.');
    await approveBtn.click();
    await step(page,'1B.10','Plan Approved 🎉 → Authority Review','Application moves to "Authority Review" stage. Provider submits to local authority.','#16a34a');
  }

  // Notifications
  await page.goto(`${BASE}/customer/notifications`);
  await step(page,'1B.11','Notifications — Complete History','Every status change, staff assignment and provider acknowledgement shown with contact details.');
  await wait(READ);
  await scroll(page, 300); await wait(700); await scroll(page, 0);

  await clearAll(page);
  await logout(page);
}

// ═════════════════════════════════════════════════════════════════════════════
// FLOW 2A — NEW SERVICE PROVIDER: Self-registration flow
// ═════════════════════════════════════════════════════════════════════════════
async function flow2a_newProvider(page) {
  await banner(page,'📝','Flow 2A — New Service Provider','Self-registration → Licence details → ML verification → Pending admin review','#7c3aed');

  await page.goto(`${BASE}/get-started`);
  await step(page,'2A.1','Get Started — Provider Path','Provider clicks "I\'m a Service Provider" to begin registration.');
  await page.getByRole('link', { name: /Apply as Provider/i }).click();
  await page.waitForURL(/\/provider-register/);
  await step(page,'2A.2','Provider Registration Form — Step 1: Business Details','Owner name, office name, mobile, email, address, service area — all mandatory.');

  // Fill step 1 — use correct placeholders from ProviderRegisterPage
  await page.getByPlaceholder('As per licence document').fill('Sunil Mathew');
  await wait(SLOW);
  await page.getByPlaceholder('e.g. Arjun Constructions').fill('Sunil Civil Works');
  await wait(SLOW);
  await page.getByPlaceholder('10-digit number').fill('9876501234');
  await wait(SLOW);
  await page.getByPlaceholder('office@email.com').fill('sunil@sunilcivilworks.in');
  await wait(SLOW);
  await page.getByPlaceholder('Door no., Street, City, PIN').fill('8, Civil Court Road, Ernakulam, Kerala - 682001');
  await wait(SLOW);
  await page.getByPlaceholder('e.g. Thrissur').fill('Ernakulam');
  await wait(SLOW);
  await step(page,'2A.3','Step 1 Complete ✅','All business details filled. Mobile number will be the login ID.','#15803d');
  await page.getByRole('button', { name: /Continue/i }).click();

  // Step 2 — Licence
  await step(page,'2A.4','Step 2: Licence Details','Select KPBR 2019 licence category. System shows building limits automatically.');
  const catSelect = page.getByRole('combobox').first();
  await catSelect.selectOption('engineer_b');
  await wait(SLOW);
  await step(page,'2A.5','Licence Category: Engineer-B','Max 1,000 m² · 4 floors · 14.5 m height. Shown as blue info card.','#3b82f6');
  await page.getByPlaceholder('e.g. KL/ARCH/2022/4521').fill('KL/ENG/B/2023/7751');
  await wait(SLOW);

  // Set expiry 45 days from now (triggers warning)
  const expiry = new Date(); expiry.setDate(expiry.getDate() + 45);
  const dateField = page.locator('input[type="date"]').first();
  await dateField.fill(expiry.toISOString().split('T')[0]);
  await wait(SLOW);
  await step(page,'2A.6','Expiry Warning Triggered ⚠️','Licence expires in 45 days → Yellow warning shown. Reminders will be sent at 90/60/30/10 days.','#f59e0b');

  // Upload licence (simulate)
  await step(page,'2A.7','Upload Licence Document','Provider uploads a clear photo/PDF of their physical KPBR licence.');
  const licFileInput2a = page.locator('input[type="file"]').first();
  if (await licFileInput2a.count()) {
    await licFileInput2a.setInputFiles(DUMMY_FILE);
    await wait(600);
  }
  await step(page,'2A.8','ML Licence Verification Panel','OCR + ML verifies licence number format, cross-references KPBR database, checks expiry.','#1d4ed8');
  await step(page,'2A.9','Automatic Expiry Reminders','System will auto-send reminders at 90 days, 60 days, 30 days, and daily for final 10 days.','#92400e');

  // ProviderRegisterPage step 2 → Submit Application (no further "Continue" button)
  await page.getByRole('button', { name: /Submit Application/i }).click();

  await step(page,'2A.10','Registration Submitted 🎉','Application pending admin review. SMS sent on activation. Reference ID generated.','#16a34a');
  await wait(READ);

  await clearAll(page);
}

// ═════════════════════════════════════════════════════════════════════════════
// FLOW 2B — EXISTING PROVIDER: Full application workflow
// ═════════════════════════════════════════════════════════════════════════════
async function flow2b_existingProvider(page) {
  await banner(page,'🏗️','Flow 2B — Existing Provider','Login → Acknowledge → Verify docs → Schedule visit → Upload plan → Authority','#15803d');
  await loginAs(page, '8888800000', 'provider');

  // Dashboard
  await step(page,'2B.1','Provider Dashboard — Arjun Constructions','Stats: assigned apps, pending review, approved. Rating: 4.8. Licence profile shown.');
  await scroll(page, 300); await wait(600); await scroll(page, 0);

  // Assigned Applications
  await page.goto(`${BASE}/provider/applications`);
  await step(page,'2B.2','Assigned Applications List','All applications for this provider. Search, filter by status, click to review detail.');

  // Filter demo
  await page.getByRole('button', { name: 'Awaiting Your Review' }).first().click();
  await wait(700);
  await page.getByRole('button', { name: /^All$/ }).first().click();
  await wait(500);

  // Select first pending app
  const firstRow = page.locator('button[class*="appRow"]').first();
  await firstRow.click();
  await step(page,'2B.3','Application Detail Panel','Customer info, landmark, description, all uploaded documents with verification status.');
  await wait(READ);

  // Acknowledge
  const ackBtn = page.getByRole('button', { name: /Acknowledge.*Notify/i }).first();
  if (await ackBtn.count()) {
    await step(page,'2B.4','Acknowledging the Request','Provider clicks Acknowledge → customer receives SMS/notification with provider mobile number.','#15803d');
    await ackBtn.click();
    await step(page,'2B.5','Customer Notified ✅','Notification sent: "Application acknowledged by Arjun Constructions. Contact: +91 8888800000"','#16a34a');
  }

  // Verify documents
  await page.locator('button[class*="appRow"]').first().click();
  await wait(500);
  const notesBox = page.getByPlaceholder(/Describe document issue/i).first();
  if (await notesBox.count()) {
    await step(page,'2B.6','Document Verification','Provider reviews each uploaded document. Can mark OK or report an issue with notes.');
    const docsOkBtn = page.getByRole('button', { name: /Documents OK/i }).first();
    if (await docsOkBtn.count()) {
      await docsOkBtn.click();
      await step(page,'2B.7','Documents Verified ✅ — Customer Notified','Verification complete. Customer receives notification with provider contact to propose site visit dates.','#16a34a');
    }
  }

  // Site visit date selection
  await page.locator('button[class*="appRow"]').nth(1).click();
  await wait(600);
  const dateOption = page.locator('label[class*="dateOption"]').first();
  if (await dateOption.count()) {
    await step(page,'2B.8','Select Site Visit Date','Customer proposed 3 dates. Provider selects one to confirm the site visit.');
    await dateOption.click();
    await wait(SLOW);
    const confirmBtn = page.getByRole('button', { name: /Confirm Date/i }).first();
    if (await confirmBtn.count()) {
      await confirmBtn.click();
      await step(page,'2B.9','Site Visit Confirmed ✅','Date confirmed. Both provider and customer see the confirmed date.','#16a34a');
    }
  }

  // Mark site visit done
  const siteBtn = page.getByRole('button', { name: /Mark Site Visit Complete/i }).first();
  if (await siteBtn.count()) {
    await step(page,'2B.10','Mark Site Visit Complete','Provider physically visits the site, takes measurements. Marked as done in app.');
    await siteBtn.click();
    await step(page,'2B.11','Site Visit Done → Plan Preparation','Status moves to Plan Preparation. Provider now prepares the building plan.','#15803d');
  }

  // Upload Plan
  const planUpload = page.getByRole('button', { name: /Submit Plan to Client/i }).first();
  if (await planUpload.count()) {
    await step(page,'2B.12','Upload Plan for Client Review','Provider uploads the prepared building plan PDF for customer approval.');
    await planUpload.click();
    await step(page,'2B.13','Plan Uploaded → Client Review','Customer receives notification: "Your plan is ready for review." Customer must approve or request changes.','#16a34a');
  }

  // Assign to staff
  const staffSel = page.locator('select').filter({ hasText: /Select staff member/ }).first();
  if (await staffSel.count()) {
    await step(page,'2B.14','Assign Application to Office Staff','Provider delegates work to a specific staff member. Customer notified with staff contact.');
    await staffSel.selectOption({ index: 1 });
    await wait(SLOW);
    const assignBtn = page.getByRole('button', { name: 'Assign' }).first();
    if (await assignBtn.count()) {
      await assignBtn.click();
      await step(page,'2B.15','Assigned to Rajan Menon ✅','Customer receives: "Your request is handled by Rajan Menon (+91 8777700001)"','#16a34a');
    }
  }

  // Authority submission
  const authorityBtn = page.getByRole('button', { name: /Authority Approved/i }).first();
  if (await authorityBtn.count()) {
    await step(page,'2B.16','Submit to Authority & Mark Approved','After plan is approved by customer, provider submits to local authority. Approval number generated.','#3b82f6');
    await authorityBtn.click();
    await step(page,'2B.17','Authority Approved! 🎉 Permit Issued','Approval number auto-generated. Provider uploads signed authority documents.','#16a34a');
  }

  // My Staff
  await page.goto(`${BASE}/provider/staff`);
  await step(page,'2B.18','My Staff Page','List of all office staff, their roles, active job count, login IDs and status.');
  await wait(READ);
  await scroll(page, 300); await wait(600); await scroll(page, 0);

  // Add staff member
  const addStaffBtn = page.getByRole('button', { name: /Add Staff/i }).first();
  if (await addStaffBtn.count()) {
    await addStaffBtn.click();
    await wait(600);
    await step(page,'2B.19','Adding New Staff Member','Provider adds a 5th associate. Mobile number becomes their login ID for the Staff Portal.');
    const nameF = page.getByPlaceholder('e.g. Rajan Menon');
    if (await nameF.count()) {
      await nameF.fill('Priya Jose');
      await wait(SLOW);
      const phoneF = page.locator('input[maxlength="10"]').last();
      await phoneF.fill('8777700099');
      await wait(SLOW);
      const emailF = page.getByPlaceholder('staff@email.com');
      if (await emailF.count()) { await emailF.fill('priya@arjun.in'); await wait(SLOW); }
    }
    await step(page,'2B.20','Staff Login Instructions','New staff logs in via "Office Staff" option. Only sees their assigned applications.','#15803d');
  }

  await clearAll(page);
  await logout(page);
}

// ═════════════════════════════════════════════════════════════════════════════
// FLOW 3 — OFFICE STAFF: Full workflow with security isolation
// ═════════════════════════════════════════════════════════════════════════════
async function flow3_staff(page) {
  await banner(page,'👨‍💼','Flow 3 — Office Staff','Login → View only assigned work → Update statuses → Security isolation demo','#7c3aed');
  await loginAs(page, '8777700001', 'staff');

  // Staff dashboard
  await step(page,'3.1','Staff Portal — Rajan Menon','Dashboard shows only applications assigned to THIS staff member. Other data is completely hidden.');
  await wait(READ);

  // My Assignments
  await page.goto(`${BASE}/staff/applications`);
  await step(page,'3.2','My Assignments (Isolated View)','Rajan only sees apps where assignedStaffId = s1 AND assignedProviderId = p1 (Arjun). Zero data leakage.');
  await wait(READ);

  // Click an app if available
  const appRow = page.locator('button[class*="appRow"]').first();
  if (await appRow.isVisible()) {
    await appRow.click();
    await step(page,'3.3','Application Detail — Staff View','Customer name, phone, address, landmark, description and documents visible to assigned staff.');
    await wait(READ);

    const notesArea = page.getByPlaceholder(/Add notes for the customer/i).first();
    if (await notesArea.count()) {
      await notesArea.fill('Documents reviewed. All 4 required documents verified. Scheduling site inspection.');
      await wait(SLOW);
    }

    const underReview = page.getByRole('button', { name: /Under Review/i }).first();
    if (await underReview.count()) {
      await step(page,'3.4','Updating Status → Under Review','Staff marks application as Under Review. Customer automatically notified with Rajan\'s contact.','#7c3aed');
      await underReview.click();
      await step(page,'3.5','Customer Notified ✅','SMS sent: "Status updated to Under Review. Handled by: Rajan Menon (+91 8777700001)"','#16a34a');
    }

    const docsBtn = page.getByRole('button', { name: /Request Docs/i }).first();
    if (await docsBtn.count()) {
      await step(page,'3.6','Request Additional Documents','If docs are incomplete, staff can request more. Customer sees Docs Required status.','#f59e0b');
      await wait(READ);
    }
  }

  // Security demo — show inactive staff blocked
  await clearAll(page);
  await logout(page);

  // Show inactive staff (Divya Thomas - 8777700004) cannot access portal
  await page.goto(`${BASE}/login`);
  await wait(500);
  await page.getByText('Office Staff').first().click();
  await wait(300);
  await page.getByRole('button', { name: /Continue as/i }).click();
  await wait(500);
  await page.getByPlaceholder('Enter 10-digit number').fill('8777700004');
  await wait(400);
  await page.getByRole('button', { name: /Send OTP/i }).click();
  await wait(700);
  await otp(page);
  await page.getByRole('button', { name: /Verify/i }).click();
  await page.waitForURL(/\/(customer|provider|admin|staff)/);
  await wait(800);
  await step(page,'3.7','Security: Inactive Staff Blocked 🔒','Divya Thomas is deactivated. Even after OTP, she sees "Account Inactive" screen. Cannot access any data.','#dc2626');
  await wait(READ);

  await clearAll(page);
  await logout(page);
}

// ═════════════════════════════════════════════════════════════════════════════
// FLOW 4 — SUPER ADMIN: Complete system management
// ═════════════════════════════════════════════════════════════════════════════
async function flow4_admin(page) {
  await banner(page,'🔐','Flow 4 — Super Admin','Full system oversight: providers, applications, licences, assignments','#1d4ed8');
  await loginAs(page, '7777700000', 'admin');

  // Dashboard
  await step(page,'4.1','Admin Dashboard — System Overview','Stats: total applications, pending, approved, total providers, active, pending approval, expired licences.');
  await scroll(page, 200); await wait(600); await scroll(page, 0);

  // Pending provider alert
  const pendingAlert = page.locator('[class*="pendingAlert"]').first();
  if (await pendingAlert.isVisible()) {
    await step(page,'4.2','Pending Provider Request Alert ⚠️','New provider registrations await admin approval. Clicking "Review Now" goes to provider list.','#92400e');
  }

  // Approve directly from dashboard
  const approveBtn = page.getByRole('button', { name: 'Approve' }).first();
  if (await approveBtn.count()) {
    await step(page,'4.3','One-Click Approval','Admin approves the pending provider directly from dashboard. Provider becomes visible to customers.','#1d4ed8');
    await approveBtn.click();
    await step(page,'4.4','Provider Activated ✅','QuickApprove Solutions is now active. Immediately visible in customer provider selection.','#16a34a');
  }

  // All Applications
  await page.goto(`${BASE}/admin/applications`);
  await step(page,'4.5','All Applications — Complete System View','Every application across all customers and providers. Filter, search, assign.','#1d4ed8');
  await wait(READ);
  await scroll(page, 200); await wait(700); await scroll(page, 0);

  // Search demo
  const searchBox = page.getByPlaceholder(/Search by ID/i).first();
  if (await searchBox.count()) {
    await searchBox.fill('Priya');
    await wait(700);
    await step(page,'4.6','Search by Customer Name','Filtered to show only Priya Sharma\'s applications (APP-2024-003, APP-2024-004).','#1d4ed8');
    await searchBox.fill('');
    await wait(500);
  }

  // Assign provider
  const assignSelect = page.locator('select').first();
  if (await assignSelect.count()) {
    await step(page,'4.7','Assign Provider to Unassigned Application','Admin assigns an active, licence-valid provider to an unassigned application.','#1d4ed8');
    await assignSelect.selectOption({ index: 1 });
    await wait(SLOW);
    const assignBtn = page.getByRole('button', { name: 'Assign' }).first();
    if (await assignBtn.count()) { await assignBtn.click(); await step(page,'4.8','Provider Assigned ✅ — Application moves to Under Review','Admin dispatched. Application status auto-changes.','#16a34a'); }
  }

  // Manage Providers
  await page.goto(`${BASE}/admin/providers`);
  await step(page,'4.9','Service Providers — Full Registry','All providers with status, licence category, rating, approval count. Filter: All/Active/Pending/Expired.','#1d4ed8');
  await wait(READ);

  // Filter expired
  await page.getByRole('button', { name: 'Expired' }).click();
  await wait(700);
  await step(page,'4.10','Filter: Expired Licence ⛔','Providers with expired licences shown. Hidden from customers. Cannot be activated until renewed.','#dc2626');
  await page.getByRole('button', { name: /^All$/ }).first().click();
  await wait(500);

  // Provider detail
  await page.locator('button[class*="providerRow"]').first().click();
  await step(page,'4.11','Provider Detail — Full KPBR Licence Info','Category, Licence No., Expiry, Max Area/Floors/Height, ML Verification status, All documents.','#1d4ed8');
  await wait(READ);
  await scroll(page, 300); await wait(600); await scroll(page, 0);

  // Suspend provider demo
  const suspendBtn = page.getByRole('button', { name: /Suspend Provider/i }).first();
  if (await suspendBtn.count()) {
    await step(page,'4.12','Suspend/Activate Providers','Admin can suspend active providers and reactivate. Suspended providers hidden from customers.','#dc2626');
    await suspendBtn.click();
    await wait(600);
    await step(page,'4.13','Suspended ✅ — Immediately Hidden from Customers','Provider no longer appears in customer application provider selection.','#dc2626');
  }

  // Add Provider (full 4-step walkthrough)
  await page.goto(`${BASE}/admin/add-provider`);
  await step(page,'4.14','Manually Onboard New Provider — Step 1: Business Details','Admin can also add providers directly without them self-registering.','#1d4ed8');
  await page.getByPlaceholder('e.g. Arjun Nair').fill('Dr. Vishnu Prasad');
  await wait(SLOW);
  await page.getByPlaceholder('e.g. Arjun Constructions').fill('VP Architecture Studio');
  await wait(SLOW);
  await page.getByPlaceholder('10-digit number').fill('9900112233');
  await wait(SLOW);
  await page.getByPlaceholder('office@email.com').fill('vp@vparchitecture.in');
  await wait(SLOW);
  await page.getByPlaceholder('Door no., Street, City, District, PIN').fill('15, Marine Drive, Kochi, Ernakulam - 682001');
  await wait(SLOW);
  await page.getByPlaceholder('e.g. Thrissur').fill('Ernakulam');
  await wait(SLOW);
  await page.getByRole('button', { name: /Continue/i }).click();

  await step(page,'4.15','Step 2: KPBR Licence — Selecting Architect (Unlimited)','Architect category: unlimited building area, floors, height. All permits permitted.','#1d4ed8');
  const licSelect = page.getByRole('combobox').first();
  await licSelect.selectOption('architect');
  await wait(SLOW);
  await page.getByPlaceholder('e.g. KL/ARCH/2022/4521').fill('KL/ARCH/2021/0099');
  await wait(SLOW);
  const expiry2 = new Date(); expiry2.setFullYear(expiry2.getFullYear() + 2);
  const dateFields = page.locator('input[type="date"]');
  if (await dateFields.count()) { await dateFields.first().fill(expiry2.toISOString().split('T')[0]); await wait(SLOW); }
  await step(page,'4.16','Upload Licence + Expiry Reminder ℹ️','Uploading licence document for ML verification. Reminders set for 90/60/30/10 days.','#92400e');
  const licFileInput4 = page.locator('input[type="file"]').first();
  if (await licFileInput4.count()) {
    await licFileInput4.setInputFiles(DUMMY_FILE);
    await wait(600);
  }

  await page.getByRole('button', { name: /Continue/i }).click();

  await step(page,'4.17','Step 3: Optional Info (About Us, Projects)','Professional bio and project history visible to customers on the provider selection screen.');
  await page.getByPlaceholder(/Brief description/i).fill('Licensed Architect with 18 years experience. Specialist in residential and institutional buildings.');
  await wait(SLOW);
  await page.getByPlaceholder(/e.g. 127 residential/i).fill('195 approved permits — residential, commercial, institutional.');
  await wait(SLOW);
  await page.getByRole('button', { name: /Continue/i }).click();

  await step(page,'4.18','Step 4: Review — All Details Confirmed','Complete summary before submission. Building limits: Unlimited. ML verification: Pending.','#1d4ed8');
  await wait(READ);
  await page.getByRole('button', { name: /Add Provider/i }).click();
  await step(page,'4.19','Provider Added! 🎉','VP Architecture Studio registered as pending. Activate after document verification.','#16a34a');
  await wait(READ);

  await clearAll(page);
  await logout(page);
}

// ═════════════════════════════════════════════════════════════════════════════
// FINALE
// ═════════════════════════════════════════════════════════════════════════════
async function finale(page) {
  await page.goto(BASE);
  await page.evaluate(() => {
    const d = document.createElement('div');
    d.style.cssText = `position:fixed;inset:0;z-index:999999;background:rgba(10,10,10,.9);
      display:flex;align-items:center;justify-content:center;font-family:Inter,sans-serif;`;
    d.innerHTML = `<div style="text-align:center;color:#fff;max-width:600px;padding:48px">
      <div style="font-size:64px;margin-bottom:24px">🎉</div>
      <div style="font-size:32px;font-weight:900;margin-bottom:16px;color:#f5d5b8">Complete Demo Done!</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;text-align:left;margin-top:24px">
        <div style="background:rgba(255,255,255,.08);padding:16px;border-radius:12px;border-left:4px solid #c0522a">
          <div style="font-weight:700;margin-bottom:6px">🏠 New Customer</div>
          <div style="font-size:12px;color:rgba(255,255,255,.6)">Signup · Application · Site dates · Status tracking</div>
        </div>
        <div style="background:rgba(255,255,255,.08);padding:16px;border-radius:12px;border-left:4px solid #3b82f6">
          <div style="font-weight:700;margin-bottom:6px">📋 Existing Customer</div>
          <div style="font-size:12px;color:rgba(255,255,255,.6)">History · Plan review · Notifications</div>
        </div>
        <div style="background:rgba(255,255,255,.08);padding:16px;border-radius:12px;border-left:4px solid #7c3aed">
          <div style="font-weight:700;margin-bottom:6px">📝 New Provider</div>
          <div style="font-size:12px;color:rgba(255,255,255,.6)">Self-register · KPBR licence · ML verify</div>
        </div>
        <div style="background:rgba(255,255,255,.08);padding:16px;border-radius:12px;border-left:4px solid #15803d">
          <div style="font-weight:700;margin-bottom:6px">🏗️ Existing Provider</div>
          <div style="font-size:12px;color:rgba(255,255,255,.6)">Acknowledge · Docs · Visit · Plan · Authority</div>
        </div>
        <div style="background:rgba(255,255,255,.08);padding:16px;border-radius:12px;border-left:4px solid #7c3aed">
          <div style="font-weight:700;margin-bottom:6px">👨‍💼 Office Staff</div>
          <div style="font-size:12px;color:rgba(255,255,255,.6)">Isolated view · Status updates · Security demo</div>
        </div>
        <div style="background:rgba(255,255,255,.08);padding:16px;border-radius:12px;border-left:4px solid #1d4ed8">
          <div style="font-weight:700;margin-bottom:6px">🔐 Super Admin</div>
          <div style="font-size:12px;color:rgba(255,255,255,.6)">Approve · Assign · Manage licences · Add provider</div>
        </div>
      </div>
    </div>`;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 8000);
  });
  await wait(8000);
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════════════════
(async () => {
  console.log('\n🎬 LEO Application — Complete Pin-to-Pin Workflow Demo\n');
  const browser = await chromium.launch({ headless: false, slowMo: 400, args: ['--start-maximized'] });
  const ctx  = await browser.newContext({ viewport: null });
  const page = await ctx.newPage();

  try {
    await flow1a_newCustomer(page);     console.log('✅ 1A — New Customer');
    await flow1b_existingCustomer(page);console.log('✅ 1B — Existing Customer');
    await flow2a_newProvider(page);     console.log('✅ 2A — New Provider (Registration)');
    await flow2b_existingProvider(page);console.log('✅ 2B — Existing Provider (Full Workflow)');
    await flow3_staff(page);            console.log('✅ 3  — Office Staff');
    await flow4_admin(page);            console.log('✅ 4  — Super Admin');
    await finale(page);
    console.log('\n🎉 Complete pin-to-pin demo finished!\n');
  } catch(e) {
    console.error('❌', e.message);
    await wait(12000);
  } finally {
    await browser.close();
  }
})();
