import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DIST_DIR = path.resolve(__dirname, 'dist');
const PORT = 5197;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

const server = http.createServer((req, res) => {
  const parsed = new URL(req.url, BASE_URL);
  const filePath = path.join(DIST_DIR, parsed.pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
    return;
  }
  const fallback = path.join(DIST_DIR, 'index.html');
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(fallback).pipe(res);
});

server.listen(PORT, '127.0.0.1', async () => {
  let passed = 0;
  let failed = 0;

  function assert(desc, condition, details = '') {
    if (condition) {
      console.log(`✓ PASS: ${desc} ${details ? '(' + details + ')' : ''}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${desc} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  try {
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    await page.setRequestInterception(true);
    page.on('request', req => {
      const url = req.url();
      const headers = { 'Access-Control-Allow-Origin': '*' };
      if (req.method() === 'OPTIONS') { req.respond({ status: 200, headers }); return; }
      if (url.includes('/api/')) {
        req.respond({
          status: 200,
          contentType: 'application/json',
          headers,
          body: JSON.stringify([])
        });
        return;
      }
      req.continue();
    });

    await page.goto(`${BASE_URL}/login`);
    await page.evaluate(() => {
      localStorage.setItem('grocery_choice_owner_token', 'mock_valid_owner_token_999');
      localStorage.setItem('grocery_choice_owner_auth', JSON.stringify({
        id: 1,
        fullName: 'Suresh Verma',
        name: 'Suresh Verma',
        email: 'owner@grocerychoice.com',
        phone: '9876543210',
        role: 'OWNER'
      }));
    });

    const getDesktopActiveItems = () => page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('.owner-sidebar nav a'));
      return links
        .filter(a => a.className.includes('active') || a.style.backgroundColor === 'rgb(6, 95, 70)')
        .map(a => ({
          href: a.getAttribute('href'),
          text: a.querySelector('.sidebar-text-hide')?.innerText.trim() || a.innerText.trim(),
          ariaCurrent: a.getAttribute('aria-current'),
          classes: a.className,
          bgColor: a.style.backgroundColor
        }));
    });

    // -------------------------------------------------------------
    // TEST 1: Navigation to /products -> Highlight Products ONLY
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: /products (Highlight Products only) ---');
    await page.goto(`${BASE_URL}/products`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.owner-sidebar nav a');
    let activeItems = await getDesktopActiveItems();
    assert('Exactly 1 item highlighted on /products', activeItems.length === 1, `count: ${activeItems.length}`);
    assert('Products is the highlighted item on /products', activeItems[0]?.href === '/products', activeItems[0]?.text);
    assert('Add Product is NOT highlighted on /products', !activeItems.some(i => i.href === '/products/add'));

    // -------------------------------------------------------------
    // TEST 2: Navigation to /products/add -> Highlight Add Product ONLY
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: /products/add (Highlight Add Product only, Products NOT highlighted) ---');
    await page.goto(`${BASE_URL}/products/add`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.owner-sidebar nav a');
    activeItems = await getDesktopActiveItems();
    assert('Exactly 1 item highlighted on /products/add', activeItems.length === 1, `count: ${activeItems.length}`);
    assert('Add Product is the highlighted item on /products/add', activeItems[0]?.href === '/products/add', activeItems[0]?.text);
    assert('Products parent is NOT highlighted on /products/add', !activeItems.some(i => i.href === '/products'));

    // -------------------------------------------------------------
    // TEST 3: Navigation to /products/edit/:id -> Highlight Products ONLY
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: /products/edit/:id (Highlight Products only) ---');
    await page.goto(`${BASE_URL}/products/edit/42`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.owner-sidebar nav a');
    activeItems = await getDesktopActiveItems();
    assert('Exactly 1 item highlighted on /products/edit/42', activeItems.length === 1, `count: ${activeItems.length}`);
    assert('Products is the highlighted item on /products/edit/42', activeItems[0]?.href === '/products', activeItems[0]?.text);
    assert('Add Product is NOT highlighted on /products/edit/42', !activeItems.some(i => i.href === '/products/add'));

    // -------------------------------------------------------------
    // TEST 4: Client-side Navigation between Products and Add Product
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Client-side Navigation Transitions ---');
    await page.goto(`${BASE_URL}/products`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.owner-sidebar nav a');

    // Click Add Product
    await page.click('.owner-sidebar nav a[href="/products/add"]');
    await new Promise(r => setTimeout(r, 200));
    activeItems = await getDesktopActiveItems();
    assert('After client-side click to /products/add: exactly 1 item highlighted', activeItems.length === 1, `count: ${activeItems.length}`);
    assert('After click: Add Product highlighted', activeItems[0]?.href === '/products/add');
    assert('After click: Products NOT highlighted', !activeItems.some(i => i.href === '/products'));

    // Click Products back
    await page.click('.owner-sidebar nav a[href="/products"]');
    await new Promise(r => setTimeout(r, 200));
    activeItems = await getDesktopActiveItems();
    assert('After client-side click to /products: exactly 1 item highlighted', activeItems.length === 1, `count: ${activeItems.length}`);
    assert('After click: Products highlighted', activeItems[0]?.href === '/products');
    assert('After click: Add Product NOT highlighted', !activeItems.some(i => i.href === '/products/add'));

    // -------------------------------------------------------------
    // TEST 5: All Other Sidebar Routes (Each must highlight exactly 1 item)
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Other Sidebar Routes Highlight Exactly One Item ---');
    const standardRoutes = [
      { path: '/', expectedHref: '/', label: 'Dashboard' },
      { path: '/categories', expectedHref: '/categories', label: 'Categories' },
      { path: '/inventory', expectedHref: '/inventory', label: 'Inventory' },
      { path: '/orders', expectedHref: '/orders', label: 'Orders' },
      { path: '/customers', expectedHref: '/customers', label: 'Customers' },
      { path: '/reports', expectedHref: '/reports', label: 'Reports' },
      { path: '/staff', expectedHref: '/staff', label: 'Staff Management' },
      { path: '/profile', expectedHref: '/profile', label: 'Profile' }
    ];

    for (const r of standardRoutes) {
      await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.owner-sidebar nav a');
      activeItems = await getDesktopActiveItems();
      assert(
        `Route ${r.path} highlights exactly 1 item (${r.label})`,
        activeItems.length === 1 && activeItems[0]?.href === r.expectedHref,
        `active: ${activeItems.map(i => i.href).join(', ')}`
      );
      assert(`Route ${r.path} does not highlight Products or Add Product`, !activeItems.some(i => i.href === '/products' || i.href === '/products/add'));
    }

    // -------------------------------------------------------------
    // TEST 6: Mobile Drawer (< 1024px)
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Mobile Drawer Navigation (< 1024px) ---');
    await page.setViewport({ width: 375, height: 667 });

    const getMobileActiveItems = () => page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('.mobile-drawer-nav a.mobile-drawer-nav-item'));
      return links
        .filter(a => a.className.includes('active'))
        .map(a => ({
          href: a.getAttribute('href'),
          text: a.innerText.trim(),
          classes: a.className
        }));
    });

    // 6a. Mobile /products
    await page.goto(`${BASE_URL}/products`, { waitUntil: 'domcontentloaded' });
    await page.click('.mobile-hamburger-btn');
    await page.waitForSelector('.mobile-drawer-nav', { timeout: 3000 });
    let mobileActive = await getMobileActiveItems();
    assert('Mobile /products: exactly 1 item highlighted', mobileActive.length === 1, `count: ${mobileActive.length}`);
    assert('Mobile /products: Products highlighted', mobileActive[0]?.href === '/products');
    assert('Mobile /products: Add Product NOT highlighted', !mobileActive.some(i => i.href === '/products/add'));

    // 6b. Mobile /products/add
    await page.goto(`${BASE_URL}/products/add`, { waitUntil: 'domcontentloaded' });
    await page.click('.mobile-hamburger-btn');
    await page.waitForSelector('.mobile-drawer-nav', { timeout: 3000 });
    mobileActive = await getMobileActiveItems();
    assert('Mobile /products/add: exactly 1 item highlighted', mobileActive.length === 1, `count: ${mobileActive.length}`);
    assert('Mobile /products/add: Add Product highlighted', mobileActive[0]?.href === '/products/add');
    assert('Mobile /products/add: Products NOT highlighted', !mobileActive.some(i => i.href === '/products'));

    // 6c. Mobile /products/edit/789
    await page.goto(`${BASE_URL}/products/edit/789`, { waitUntil: 'domcontentloaded' });
    await page.click('.mobile-hamburger-btn');
    await page.waitForSelector('.mobile-drawer-nav', { timeout: 3000 });
    mobileActive = await getMobileActiveItems();
    assert('Mobile /products/edit/789: exactly 1 item highlighted', mobileActive.length === 1, `count: ${mobileActive.length}`);
    assert('Mobile /products/edit/789: Products highlighted', mobileActive[0]?.href === '/products');
    assert('Mobile /products/edit/789: Add Product NOT highlighted', !mobileActive.some(i => i.href === '/products/add'));

    await browser.close();

    console.log('\n============================================================');
    console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
    console.log('============================================================');
    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Error during test:', err);
    process.exit(1);
  } finally {
    server.close();
  }
});

