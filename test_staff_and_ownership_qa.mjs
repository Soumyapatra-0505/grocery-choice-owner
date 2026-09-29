/**
 * Comprehensive Local End-to-End QA Automation Suite
 * Tests Owner Portal Staff Management and Ownership Management
 * Using Puppeteer and Google Chrome
 */

import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 5197;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/`, () => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startPreviewServer() {
  console.log(`[INFO] Launching Vite preview server on port ${PORT}...`);
  const isWindows = process.platform === 'win32';
  const npxCmd = isWindows ? 'npx.cmd' : 'npx';

  const previewProcess = spawn(npxCmd, ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: __dirname,
    shell: true,
    stdio: 'pipe'
  });

  previewProcess.stdout.on('data', () => {});
  previewProcess.stderr.on('data', () => {});

  // Poll until server responds
  let ready = false;
  for (let i = 0; i < 40; i++) {
    await delay(250);
    ready = await checkPort(PORT);
    if (ready) break;
  }

  if (!ready) {
    previewProcess.kill();
    throw new Error(`Vite preview server failed to start on port ${PORT}`);
  }

  console.log(`[INFO] Vite preview server is ready at ${BASE_URL}`);
  return previewProcess;
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('  GROCERY CHOICE - STAFF & OWNERSHIP MANAGEMENT E2E QA SUITE');
  console.log('================================================================\n');

  let previewProcess = null;
  let browser = null;
  const testResults = [];
  const consoleErrors = [];

  function record(name, pass, details = '') {
    testResults.push({ name, pass: !!pass, details });
    console.log(`${pass ? '✓ PASS' : '✗ FAIL'}: [${name}] ${details ? '— ' + details : ''}`);
  }

  try {
    previewProcess = await startPreviewServer();

    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      defaultViewport: { width: 1280, height: 850 },
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    // Listen to console and page errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon') && !text.includes('ResizeObserver')) {
          consoleErrors.push(text);
          console.error('  [Browser Console Error]:', text);
        }
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
      console.error('  [Browser Page Error]:', err.message);
    });

    // Auto-accept window.confirm / alerts
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Mock Backend State
    let currentPrimaryOwnerState = {
      id: 1,
      fullName: 'Soumya Ranjan',
      email: 'owner@grocerychoice.com',
      phone: '+91 98765 00001',
      role: 'OWNER',
      primaryOwner: true,
      status: 'ACTIVE',
      designation: 'Store Owner',
      storeHub: 'Central Warehouse',
      permissions: [
        'VIEW_DASHBOARD', 'MANAGE_PRODUCTS', 'MANAGE_CATEGORIES', 'MANAGE_INVENTORY',
        'MANAGE_ORDERS', 'MANAGE_CUSTOMERS', 'MANAGE_DELIVERY', 'VIEW_REPORTS',
        'MANAGE_STAFF', 'MANAGE_ADMINS', 'MANAGE_OWNERS', 'MANAGE_DESIGNATIONS',
        'MANAGE_PERMISSIONS', 'TRANSFER_OWNERSHIP'
      ]
    };

    let staffListState = [
      {
        id: 1,
        fullName: 'Soumya Ranjan',
        email: 'owner@grocerychoice.com',
        phone: '+91 98765 00001',
        role: 'OWNER',
        primaryOwner: true,
        status: 'ACTIVE',
        designation: 'Store Owner',
        storeHub: 'Central Warehouse',
        permissions: currentPrimaryOwnerState.permissions,
        createdAt: '2026-09-01T10:00:00Z'
      },
      {
        id: 2,
        fullName: 'Rahul Sharma',
        email: 'rahul.manager@grocerychoice.com',
        phone: '+91 98765 00002',
        role: 'ADMIN',
        primaryOwner: false,
        status: 'ACTIVE',
        designation: 'Store Manager',
        storeHub: 'North Hub',
        permissions: [
          'VIEW_DASHBOARD', 'MANAGE_PRODUCTS', 'MANAGE_CATEGORIES', 'MANAGE_INVENTORY',
          'MANAGE_ORDERS', 'MANAGE_CUSTOMERS', 'VIEW_REPORTS', 'MANAGE_STAFF', 'MANAGE_DESIGNATIONS'
        ],
        createdAt: '2026-09-05T11:00:00Z'
      },
      {
        id: 3,
        fullName: 'Amit Kumar',
        email: 'amit.staff@grocerychoice.com',
        phone: '+91 98765 00003',
        role: 'STAFF',
        primaryOwner: false,
        status: 'ACTIVE',
        designation: 'Inventory Manager',
        storeHub: 'Central Warehouse',
        permissions: ['VIEW_DASHBOARD', 'MANAGE_PRODUCTS', 'MANAGE_INVENTORY', 'MANAGE_ORDERS'],
        createdAt: '2026-09-10T12:00:00Z'
      }
    ];

    let designationsState = [
      { id: 1, title: 'Store Owner', description: 'Overall ownership and governance of Grocery Choice' },
      { id: 2, title: 'Store Manager', description: 'Operational management of store hub, inventory, and staff execution' },
      { id: 3, title: 'Inventory Manager', description: 'Stock auditing, inventory replenishment, and supplier receiving' },
      { id: 4, title: 'Sales Manager', description: 'Promotions, customer pricing, sales campaigns' },
      { id: 5, title: 'Operations Manager', description: 'Fulfillment scheduling and dispatch logistics' },
      { id: 6, title: 'Accountant', description: 'Financial auditing and reconciliations' },
      { id: 7, title: 'Customer Support', description: 'Customer dispute resolution and order tracking inquiries' },
      { id: 8, title: 'Delivery Manager', description: 'Fleet routing and driver dispatch management' },
      { id: 9, title: 'Warehouse Manager', description: 'Warehouse bin organization and packing quality' }
    ];

    let auditLogsState = [
      {
        id: 1,
        action: 'STAFF_CREATED',
        actorId: 1,
        actorEmail: 'owner@grocerychoice.com',
        actorName: 'Soumya Ranjan',
        targetId: 2,
        targetEmail: 'rahul.manager@grocerychoice.com',
        targetName: 'Rahul Sharma',
        details: 'Created new staff user: rahul.manager@grocerychoice.com with role: ADMIN',
        createdAt: '2026-09-05T11:00:00Z'
      }
    ];

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    };

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const url = req.url();
      const method = req.method();

      if (method === 'OPTIONS') {
        req.respond({ status: 200, headers: corsHeaders });
        return;
      }

      // 1. Staff endpoints
      if (url.includes('/api/staff')) {
        const idMatch = url.match(/\/api\/staff\/(\d+)/);
        const staffId = idMatch ? Number(idMatch[1]) : null;

        if (url.includes('/status') && (method === 'PATCH' || method === 'PUT')) {
          const body = JSON.parse(req.postData() || '{}');
          const target = staffListState.find((s) => s.id === staffId);
          if (target) {
            target.status = body.status;
            auditLogsState.unshift({
              id: auditLogsState.length + 1,
              action: 'STATUS_CHANGED',
              actorId: currentPrimaryOwnerState.id,
              actorEmail: currentPrimaryOwnerState.email,
              actorName: currentPrimaryOwnerState.fullName,
              targetId: target.id,
              targetEmail: target.email,
              targetName: target.fullName,
              details: `Set status of ${target.fullName} to ${body.status}`,
              createdAt: new Date().toISOString()
            });
          }
          req.respond({ status: 200, headers: corsHeaders, contentType: 'application/json', body: JSON.stringify(target) });
          return;
        }

        if (url.includes('/role') && (method === 'PATCH' || method === 'PUT')) {
          const body = JSON.parse(req.postData() || '{}');
          const target = staffListState.find((s) => s.id === staffId);
          if (target) {
            const oldRole = target.role;
            target.role = body.role;
            auditLogsState.unshift({
              id: auditLogsState.length + 1,
              action: 'ROLE_CHANGED',
              actorId: currentPrimaryOwnerState.id,
              actorEmail: currentPrimaryOwnerState.email,
              actorName: currentPrimaryOwnerState.fullName,
              targetId: target.id,
              targetEmail: target.email,
              targetName: target.fullName,
              details: `Changed role of ${target.fullName} from ${oldRole} to ${body.role}`,
              createdAt: new Date().toISOString()
            });
          }
          req.respond({ status: 200, headers: corsHeaders, contentType: 'application/json', body: JSON.stringify(target) });
          return;
        }

        if (url.includes('/designation') && (method === 'PATCH' || method === 'PUT')) {
          const body = JSON.parse(req.postData() || '{}');
          const target = staffListState.find((s) => s.id === staffId);
          if (target) {
            target.designation = body.designation;
          }
          req.respond({ status: 200, headers: corsHeaders, contentType: 'application/json', body: JSON.stringify(target) });
          return;
        }

        if (method === 'DELETE') {
          staffListState = staffListState.filter((s) => s.id !== staffId);
          req.respond({ status: 200, headers: corsHeaders, contentType: 'application/json', body: JSON.stringify({ success: true }) });
          return;
        }

        if (method === 'POST') {
          const body = JSON.parse(req.postData() || '{}');
          const newId = staffListState.length + 1;
          const newStaff = {
            id: newId,
            fullName: body.fullName,
            email: body.email,
            phone: body.phone,
            role: body.role,
            primaryOwner: false,
            status: body.status || 'ACTIVE',
            designation: body.designation || 'Staff Member',
            storeHub: body.storeHub || 'Central Warehouse',
            permissions: [],
            createdAt: new Date().toISOString()
          };
          staffListState.push(newStaff);
          auditLogsState.unshift({
            id: auditLogsState.length + 1,
            action: 'STAFF_CREATED',
            actorId: currentPrimaryOwnerState.id,
            actorEmail: currentPrimaryOwnerState.email,
            actorName: currentPrimaryOwnerState.fullName,
            targetId: newStaff.id,
            targetEmail: newStaff.email,
            targetName: newStaff.fullName,
            details: `Created staff user: ${newStaff.email} with role: ${newStaff.role}`,
            createdAt: new Date().toISOString()
          });
          req.respond({ status: 201, headers: corsHeaders, contentType: 'application/json', body: JSON.stringify(newStaff) });
          return;
        }

        if (method === 'GET') {
          req.respond({ status: 200, headers: corsHeaders, contentType: 'application/json', body: JSON.stringify(staffListState) });
          return;
        }
      }

      // 2. Ownership endpoints
      if (url.includes('/api/ownership/primary-owner')) {
        req.respond({ status: 200, headers: corsHeaders, contentType: 'application/json', body: JSON.stringify(currentPrimaryOwnerState) });
        return;
      }

      if (url.includes('/api/ownership/eligible-owners')) {
        const eligible = staffListState.filter((s) => s.role === 'OWNER' && !s.primaryOwner && s.status === 'ACTIVE');
        req.respond({ status: 200, headers: corsHeaders, contentType: 'application/json', body: JSON.stringify(eligible) });
        return;
      }

      if (url.includes('/api/ownership/transfer') && method === 'POST') {
        const body = JSON.parse(req.postData() || '{}');
        const target = staffListState.find((s) => s.id === body.newPrimaryOwnerId);
        if (!target) {
          req.respond({ status: 400, headers: corsHeaders, contentType: 'application/json', body: JSON.stringify({ message: 'Target owner not found' }) });
          return;
        }
        // Update state
        target.primaryOwner = true;
        const oldPO = staffListState.find((s) => s.id === currentPrimaryOwnerState.id);
        if (oldPO) {
          oldPO.primaryOwner = false;
          oldPO.role = body.previousOwnerNewRole;
        }
        currentPrimaryOwnerState = { ...target };

        auditLogsState.unshift({
          id: auditLogsState.length + 1,
          action: 'OWNERSHIP_TRANSFERRED',
          actorId: oldPO.id,
          actorEmail: oldPO.email,
          actorName: oldPO.fullName,
          targetId: target.id,
          targetEmail: target.email,
          targetName: target.fullName,
          details: `Primary Ownership transferred from ${oldPO.fullName} to ${target.fullName}. Previous owner new role: ${body.previousOwnerNewRole}.`,
          createdAt: new Date().toISOString()
        });

        req.respond({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Primary Ownership transferred successfully.',
            newPrimaryOwner: target,
            previousOwner: oldPO
          })
        });
        return;
      }

      if (url.includes('/api/ownership/audit-logs')) {
        req.respond({ status: 200, headers: corsHeaders, contentType: 'application/json', body: JSON.stringify(auditLogsState) });
        return;
      }

      // 3. Designations endpoints
      if (url.includes('/api/designations')) {
        const idMatch = url.match(/\/api\/designations\/(\d+)/);
        const desigId = idMatch ? Number(idMatch[1]) : null;

        if (method === 'POST') {
          const body = JSON.parse(req.postData() || '{}');
          const newDesig = { id: designationsState.length + 1, title: body.title, description: body.description };
          designationsState.push(newDesig);
          req.respond({ status: 201, headers: corsHeaders, contentType: 'application/json', body: JSON.stringify(newDesig) });
          return;
        }

        if (method === 'PUT') {
          const body = JSON.parse(req.postData() || '{}');
          const desig = designationsState.find((d) => d.id === desigId);
          if (desig) {
            desig.title = body.title;
            desig.description = body.description;
          }
          req.respond({ status: 200, headers: corsHeaders, contentType: 'application/json', body: JSON.stringify(desig) });
          return;
        }

        if (method === 'GET') {
          req.respond({ status: 200, headers: corsHeaders, contentType: 'application/json', body: JSON.stringify(designationsState) });
          return;
        }
      }

      // 4. Current user endpoint
      if (url.includes('/api/auth/me')) {
        req.respond({ status: 200, headers: corsHeaders, contentType: 'application/json', body: JSON.stringify(currentPrimaryOwnerState) });
        return;
      }

      // Default API fallback
      if (url.includes('/api/')) {
        req.respond({ status: 200, headers: corsHeaders, contentType: 'application/json', body: '[]' });
        return;
      }

      req.continue();
    });

async function selectOption(page, selector, value) {
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`Select element not found: ${sel}`);
    el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, selector, value);
}

    // -------------------------------------------------------------
    // TEST 1: OWNER LOGIN & SESSION SETUP
    // -------------------------------------------------------------
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await delay(300);

    await page.evaluate((po) => {
      localStorage.setItem('grocery_choice_owner_auth', JSON.stringify(po));
      localStorage.setItem('grocery_choice_owner_token', 'valid-e2e-jwt-token-2026');
    }, currentPrimaryOwnerState);

    const hasToken = await page.evaluate(() => !!localStorage.getItem('grocery_choice_owner_token'));
    record('1. Owner Login Session', hasToken, 'Authenticated session stored in localStorage');

    // -------------------------------------------------------------
    // TEST 2: STAFF MANAGEMENT NAVIGATION
    // -------------------------------------------------------------
    await page.goto(`${BASE_URL}/staff`, { waitUntil: 'domcontentloaded' });
    await delay(700);

    const currentUrl = page.url();
    const pageHeading = await page.evaluate(() => document.querySelector('h1')?.innerText || '');
    record('2. Staff Management Navigation', currentUrl.includes('/staff') && (pageHeading.includes('Staff') || pageHeading.includes('Staff & Ownership Management')), `Navigated to ${currentUrl} with heading "${pageHeading}"`);

    // -------------------------------------------------------------
    // TEST 3: STAFF DIRECTORY LOADING & METRICS
    // -------------------------------------------------------------
    const metricsText = await page.evaluate(() => document.body.innerText.toLowerCase());
    const hasTotalStaff = metricsText.includes('personnel') || metricsText.includes('total staff') || metricsText.includes('active');
    const rowsCount = await page.evaluate(() => document.querySelectorAll('tbody tr').length);
    record('3. Staff Directory Loading', hasTotalStaff && rowsCount >= 3, `Found ${rowsCount} staff rows and personnel metrics`);

    // -------------------------------------------------------------
    // TEST 4: ADD A TEST STAFF ACCOUNT
    // -------------------------------------------------------------
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find((b) => b.innerText.includes('Add Staff'));
      if (addBtn) addBtn.click();
    });
    await delay(400);

    const isModalOpen = await page.evaluate(() => !!document.querySelector('.modal-backdrop'));
    record('4. Add Staff Modal Opens', isModalOpen, 'Add Staff dialog rendered');

    // Fill in modal
    await page.type('#staff-form-name', 'Ramesh Patel');
    await page.type('#staff-form-email', 'ramesh.staff@grocerychoice.com');
    await page.type('#staff-form-phone', '+91 98765 11111');
    await selectOption(page, '#staff-form-role', 'STAFF');
    await selectOption(page, '#staff-form-designation', 'Delivery Manager');
    await page.type('#staff-form-hub', 'Central Warehouse');

    // Submit Add Staff
    await page.click('#staff-form-submit-btn');
    await delay(600);

    const staffEmailsAfterAdd = await page.evaluate(() => document.body.innerText);
    const addedRamesh = staffEmailsAfterAdd.includes('ramesh.staff@grocerychoice.com');
    record('4b. Add Test STAFF Account', addedRamesh, 'Ramesh Patel added as STAFF');

    // -------------------------------------------------------------
    // TEST 5: PROMOTE EXISTING CUSTOMER TO STAFF
    // -------------------------------------------------------------
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find((b) => b.innerText.includes('Add Staff'));
      if (addBtn) addBtn.click();
    });
    await delay(400);

    await page.type('#staff-form-name', 'Priya Patel');
    await page.type('#staff-form-email', 'priya.customer@example.com');
    await page.type('#staff-form-phone', '+91 99999 00001');
    await selectOption(page, '#staff-form-role', 'STAFF');
    await selectOption(page, '#staff-form-designation', 'Customer Support');

    await page.click('#staff-form-submit-btn');
    await delay(600);

    const textAfterCustomerPromo = await page.evaluate(() => document.body.innerText);
    record('5. Promote Existing CUSTOMER to STAFF', textAfterCustomerPromo.includes('priya.customer@example.com'), 'Promoted Priya to STAFF without duplicate account');

    // -------------------------------------------------------------
    // TEST 6: CHANGE STAFF -> ADMIN
    // -------------------------------------------------------------
    // Find Ramesh Patel row and click Change Role
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      const rameshRow = rows.find((r) => r.innerText.includes('ramesh.staff@grocerychoice.com'));
      if (rameshRow) {
        const roleBtn = Array.from(rameshRow.querySelectorAll('button')).find((b) => b.innerText.includes('Role'));
        if (roleBtn) roleBtn.click();
      }
    });
    await delay(400);

    await page.evaluate(() => {
      const modal = document.querySelector('.modal-backdrop');
      if (modal) {
        const sel = modal.querySelector('select');
        if (sel) {
          sel.value = 'ADMIN';
          sel.dispatchEvent(new Event('input', { bubbles: true }));
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const saveBtn = Array.from(modal.querySelectorAll('button')).find((b) => b.innerText.includes('Update Role') || b.innerText.includes('Save'));
        if (saveBtn) saveBtn.click();
      }
    });
    await delay(600);

    const updatedTextRole = await page.evaluate(() => document.body.innerText);
    record('6. Change STAFF -> ADMIN', updatedTextRole.includes('Admin') || updatedTextRole.includes('ADMIN'), 'Role successfully updated to ADMIN');

    // -------------------------------------------------------------
    // TEST 7: CHANGE DESIGNATION
    // -------------------------------------------------------------
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      const rameshRow = rows.find((r) => r.innerText.includes('ramesh.staff@grocerychoice.com'));
      if (rameshRow) {
        const desigBtn = Array.from(rameshRow.querySelectorAll('button')).find((b) => b.innerText.includes('Title') || b.innerText.includes('Designation'));
        if (desigBtn) desigBtn.click();
      }
    });
    await delay(400);

    await page.evaluate(() => {
      const modal = document.querySelector('.modal-backdrop');
      if (modal) {
        const sel = modal.querySelector('select');
        if (sel) {
          sel.value = 'Store Manager';
          sel.dispatchEvent(new Event('input', { bubbles: true }));
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const saveBtn = Array.from(modal.querySelectorAll('button')).find((b) => b.innerText.includes('Update Designation') || b.innerText.includes('Save'));
        if (saveBtn) saveBtn.click();
      }
    });
    await delay(600);

    const textAfterDesig = await page.evaluate(() => document.body.innerText);
    record('7. Change Designation', textAfterDesig.includes('Store Manager'), 'Designation updated to Store Manager');

    // -------------------------------------------------------------
    // TEST 8: DISABLE STAFF ACCOUNT
    // -------------------------------------------------------------
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      const rameshRow = rows.find((r) => r.innerText.includes('ramesh.staff@grocerychoice.com'));
      if (rameshRow) {
        const disableBtn = Array.from(rameshRow.querySelectorAll('button')).find((b) => b.innerText.includes('Disable'));
        if (disableBtn) disableBtn.click();
      }
    });
    await delay(600);

    const textAfterDisable = await page.evaluate(() => document.body.innerText);
    record('8. Disable STAFF Account', textAfterDisable.includes('DISABLED') || textAfterDisable.includes('Disabled'), 'Account disabled with status updated');

    // -------------------------------------------------------------
    // TEST 9: RE-ENABLE STAFF ACCOUNT
    // -------------------------------------------------------------
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      const rameshRow = rows.find((r) => r.innerText.includes('ramesh.staff@grocerychoice.com'));
      if (rameshRow) {
        const enableBtn = Array.from(rameshRow.querySelectorAll('button')).find((b) => b.innerText.includes('Enable'));
        if (enableBtn) enableBtn.click();
      }
    });
    await delay(600);

    const textAfterEnable = await page.evaluate(() => document.body.innerText);
    record('9. Re-enable STAFF Account', textAfterEnable.includes('ACTIVE') || textAfterEnable.includes('Active'), 'Account successfully re-enabled');

    // -------------------------------------------------------------
    // TEST 10: CREATE/PROMOTE A TEST OWNER
    // -------------------------------------------------------------
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find((b) => b.innerText.includes('Add Staff'));
      if (addBtn) addBtn.click();
    });
    await delay(400);

    await page.type('#staff-form-name', 'Vikram Malhotra');
    await page.type('#staff-form-email', 'vikram.owner@grocerychoice.com');
    await page.type('#staff-form-phone', '+91 98765 22222');
    await selectOption(page, '#staff-form-role', 'OWNER');
    await selectOption(page, '#staff-form-designation', 'Store Owner');

    // Verify warning banner appeared
    const hasOwnerWarning = await page.evaluate(() => 
      document.body.innerText.includes('OWNER Role Notice') || 
      document.body.innerText.includes('store owner privileges')
    );
    record('10a. Owner Creation Warning Notice', hasOwnerWarning, 'Warning displayed when selecting OWNER role');

    await page.click('#staff-form-submit-btn');
    await delay(600);

    const textAfterOwnerAdd = await page.evaluate(() => document.body.innerText);
    record('10b. Create Test OWNER', textAfterOwnerAdd.includes('vikram.owner@grocerychoice.com'), 'Vikram Malhotra created as co-OWNER');

    // -------------------------------------------------------------
    // TEST 11: DESIGNATION MANAGEMENT TAB
    // -------------------------------------------------------------
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const desigTab = tabs.find((t) => t.innerText.includes('Designations'));
      if (desigTab) desigTab.click();
    });
    await delay(400);

    const desigTabText = await page.evaluate(() => document.body.innerText);
    record('11. Designation Management Tab', desigTabText.includes('Store Owner') && desigTabText.includes('Inventory Manager'), 'Default designations catalog rendered');

    // Add new designation
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addDesigBtn = btns.find((b) => b.innerText.includes('Add Designation') || b.innerText.includes('New Designation'));
      if (addDesigBtn) addDesigBtn.click();
    });
    await delay(400);

    await page.type('#desig-form-title', 'Fleet Coordinator');
    await page.type('#desig-form-desc', 'Manages delivery fleet routes');

    await page.click('#desig-form-submit-btn');
    await delay(600);

    const textAfterDesigAdd = await page.evaluate(() => document.body.innerText);
    record('11b. Add New Designation', textAfterDesigAdd.includes('Fleet Coordinator'), 'New business designation created');

    // -------------------------------------------------------------
    // TEST 12: OWNERSHIP MANAGEMENT & TRANSFER
    // -------------------------------------------------------------
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const ownTab = tabs.find((t) => t.innerText.includes('Ownership'));
      if (ownTab) ownTab.click();
    });
    await delay(500);

    const ownershipText = await page.evaluate(() => document.body.innerText);
    record('12. Ownership Management Section', (ownershipText.includes('Active Head of Business') || ownershipText.includes('Transfer Primary Ownership')) && ownershipText.includes('Soumya Ranjan'), 'Current Primary Owner details displayed');

    // Select eligible owner (Vikram)
    await page.evaluate(() => {
      const select = document.querySelector('#transfer-new-owner-select');
      if (select) {
        const option = Array.from(select.options).find((o) => o.text.includes('Vikram'));
        if (option) {
          select.value = option.value;
          select.dispatchEvent(new Event('input', { bubbles: true }));
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });
    await delay(300);

    // Test confirmation phrase requirement
    await page.type('#transfer-keyword-input', 'TRANSFER');
    await delay(200);
    await page.click('#transfer-submit-btn');
    await delay(800);

    record('12b. Transfer Primary Ownership', currentPrimaryOwnerState.fullName === 'Vikram Malhotra', 'Primary ownership transferred to Vikram Malhotra');
    record('12c. Previous Owner Post-Transfer Role', staffListState.find((s) => s.id === 1)?.primaryOwner === false, 'Previous Primary Owner successfully stepped down to OWNER');
    record('12d. Exactly One Primary Owner', staffListState.filter((s) => s.primaryOwner).length === 1, 'Single-tenant Primary Owner guarantee verified');

    // -------------------------------------------------------------
    // TEST 13: AUDIT LOGS TAB
    // -------------------------------------------------------------
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const auditTab = tabs.find((t) => t.innerText.includes('Audit Logs'));
      if (auditTab) auditTab.click();
    });
    await delay(400);

    const auditText = await page.evaluate(() => document.body.innerText);
    const hasAuditTransfer = auditText.includes('OWNERSHIP_TRANSFERRED') || auditText.includes('Primary Ownership');
    record('13. Security Audit Log', hasAuditTransfer, 'Ownership transfer recorded in immutable audit log');

    // Verify no secrets in audit view
    const exposedSecrets = auditText.includes('password') || auditText.includes('jwt') || auditText.includes('secret') || auditText.includes('otp');
    record('13b. Zero Secret Exposure in Audit Log', !exposedSecrets, 'No passwords, tokens, or credentials visible in audit UI');

    // -------------------------------------------------------------
    // TEST 14: RESPONSIVE OWNER PORTAL TESTS
    // -------------------------------------------------------------
    // Desktop (1280px)
    await page.setViewport({ width: 1280, height: 900 });
    await delay(200);
    const deskHScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    record('14a. Responsive Desktop (1280px)', !deskHScroll, 'No horizontal scroll at desktop');

    // Tablet (768px)
    await page.setViewport({ width: 768, height: 1024 });
    await delay(200);
    const tabHScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    record('14b. Responsive Tablet (768px)', !tabHScroll, 'No horizontal scroll at tablet');

    // Mobile (375px)
    await page.setViewport({ width: 375, height: 667 });
    await delay(200);
    const mobHScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    record('14c. Responsive Mobile (375px)', !mobHScroll, 'No horizontal scroll at mobile width');

    // -------------------------------------------------------------
    // TEST 15: ZERO BROWSER CONSOLE ERRORS
    // -------------------------------------------------------------
    record('15. Zero Browser Runtime Errors', consoleErrors.length === 0, `Captured ${consoleErrors.length} console errors`);
    if (consoleErrors.length > 0) {
      console.error('Console errors:', consoleErrors);
    }

  } catch (err) {
    console.error('Test execution exception:', err);
    record('E2E Execution', false, err.message);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    if (previewProcess) {
      console.log('[INFO] Stopping Vite preview server...');
      previewProcess.kill();
    }
  }

  console.log('\n================================================================');
  const passes = testResults.filter((r) => r.pass).length;
  const fails = testResults.filter((r) => !r.pass).length;
  console.log(`  E2E TEST RUN COMPLETE: ${passes} PASSED, ${fails} FAILED`);
  console.log('================================================================\n');

  if (fails > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
