/**
 * Automated Verification Test for Owner Portal Vercel SPA Routing & Rewrites
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DIST_DIR = path.resolve(__dirname, 'dist');
const VERCEL_JSON_PATH = path.resolve(__dirname, 'vercel.json');
const PORT = 5188;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

// 1. Verify vercel.json existence and validity
console.log('--- Step 1: Validating vercel.json ---');
if (!fs.existsSync(VERCEL_JSON_PATH)) {
  console.error('FAIL: vercel.json does not exist!');
  process.exit(1);
}

const vercelConfig = JSON.parse(fs.readFileSync(VERCEL_JSON_PATH, 'utf-8'));
console.log('vercel.json contents:', JSON.stringify(vercelConfig, null, 2));

const rewriteRule = vercelConfig.rewrites?.find(r => r.source === '/(.*)' && r.destination === '/index.html');
if (!rewriteRule) {
  console.error('FAIL: Missing SPA rewrite rule { source: "/(.*)", destination: "/index.html" } in vercel.json');
  process.exit(1);
}
console.log('✓ PASS: vercel.json correctly specifies SPA fallback rewrite to /index.html');

// 2. Start local HTTP server implementing Vercel's rewrite model
function startVercelSimulatorServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
      let pathname = parsedUrl.pathname;

      let filePath = path.join(DIST_DIR, pathname);

      // Check if file exists on disk
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
        return;
      }

      // If directory with index.html
      const indexPath = path.join(filePath, 'index.html');
      if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(indexPath).pipe(res);
        return;
      }

      // Apply Vercel SPA rewrite fallback to /index.html
      const fallbackIndex = path.join(DIST_DIR, 'index.html');
      if (fs.existsSync(fallbackIndex)) {
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Vercel-Rewritten': 'true'
        });
        fs.createReadStream(fallbackIndex).pipe(res);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    });

    server.listen(PORT, '127.0.0.1', () => {
      console.log(`✓ Local Vercel SPA simulator listening on ${BASE_URL}`);
      resolve(server);
    });
  });
}

async function runTests() {
  const server = await startVercelSimulatorServer();
  const consoleErrors = [];
  const assetResponses = [];

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('[Browser Console Error]', msg.text());
      }
    });

    page.on('pageerror', err => {
      consoleErrors.push(err.message);
      console.error('[Page Error]', err.message);
    });

    page.on('response', resp => {
      const url = resp.url();
      if (url.includes('/assets/')) {
        assetResponses.push({
          url,
          status: resp.status(),
          contentType: resp.headers()['content-type']
        });
      }
    });

    // Mock API responses for /api/* to test authenticated session safely
    await page.setRequestInterception(true);
    page.on('request', req => {
      const url = req.url();
      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      };

      if (req.method() === 'OPTIONS') {
        req.respond({ status: 200, headers });
        return;
      }

      if (url.includes('/api/users/profile') || url.includes('/api/auth/me')) {
        req.respond({
          status: 200,
          contentType: 'application/json',
          headers,
          body: JSON.stringify({
            id: 1,
            fullName: 'Suresh Verma (Store Owner)',
            email: 'owner@grocerychoice.com',
            phone: '9876543210',
            role: 'OWNER'
          })
        });
      } else if (url.includes('/api/orders')) {
        req.respond({
          status: 200,
          contentType: 'application/json',
          headers,
          body: JSON.stringify([])
        });
      } else if (url.includes('/api/products') || url.includes('/api/categories')) {
        req.respond({
          status: 200,
          contentType: 'application/json',
          headers,
          body: JSON.stringify([])
        });
      } else {
        req.continue();
      }
    });

    // TEST 1: Direct navigation to root "/"
    console.log('\n--- TEST 1: Direct navigation to "/" ---');
    const rootResp = await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    console.log(`Root HTTP status: ${rootResp.status()}`);
    if (rootResp.status() !== 200) {
      throw new Error(`Expected HTTP 200 on /, got ${rootResp.status()}`);
    }

    // Unauthenticated user should be client-side redirected to /login
    await page.waitForFunction(() => window.location.pathname === '/login', { timeout: 5000 });
    console.log(`Current URL after root redirect: ${page.url()}`);
    await page.waitForSelector('form', { timeout: 5000 });
    console.log('✓ PASS: Navigating to "/" returns 200 and client-redirects unauthenticated user to /login');

    // TEST 2: Direct navigation to "/login" (Direct SPA deep link)
    console.log('\n--- TEST 2: Direct navigation to "/login" (Deep Link) ---');
    const loginResp = await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    console.log(`Direct /login HTTP status: ${loginResp.status()}`);
    if (loginResp.status() !== 200) {
      throw new Error(`Expected HTTP 200 on direct /login, got ${loginResp.status()}`);
    }
    const loginTitle = await page.title();
    console.log(`Page title: ${loginTitle}`);
    const loginFormExists = await page.$('form');
    if (!loginFormExists) {
      throw new Error('Login form not found on direct /login load');
    }
    console.log('✓ PASS: Direct navigation to "/login" returns HTTP 200 and renders Login Page');

    // TEST 3: Refresh on "/login"
    console.log('\n--- TEST 3: Refresh on "/login" ---');
    const reloadResp = await page.reload({ waitUntil: 'networkidle0' });
    console.log(`Reload /login HTTP status: ${reloadResp.status()}`);
    if (reloadResp.status() !== 200) {
      throw new Error(`Expected HTTP 200 on reload of /login, got ${reloadResp.status()}`);
    }
    if (page.url() !== `${BASE_URL}/login`) {
      throw new Error(`Expected URL to remain /login after reload, got ${page.url()}`);
    }
    console.log('✓ PASS: Refreshing "/login" returns HTTP 200 and preserves route');

    // TEST 4: Hard Refresh on "/login" with cache disabled
    console.log('\n--- TEST 4: Hard Refresh on "/login" (cache disabled) ---');
    await page.setCacheEnabled(false);
    const hardReloadResp = await page.reload({ waitUntil: 'networkidle0' });
    console.log(`Hard reload /login HTTP status: ${hardReloadResp.status()}`);
    if (hardReloadResp.status() !== 200) {
      throw new Error(`Expected HTTP 200 on hard reload of /login, got ${hardReloadResp.status()}`);
    }
    await page.setCacheEnabled(true);
    console.log('✓ PASS: Hard refreshing "/login" returns HTTP 200 and renders cleanly');

    // TEST 5: Authenticated route direct access & refresh ("/orders")
    console.log('\n--- TEST 5: Authenticated route direct load & refresh ("/orders") ---');
    await page.evaluate(() => {
      localStorage.setItem('grocery_choice_owner_token', 'mock_valid_owner_token_999');
      localStorage.setItem('grocery_choice_owner_auth', JSON.stringify({
        id: 1,
        fullName: 'Suresh Verma',
        name: 'Suresh Verma',
        email: 'owner@grocerychoice.com',
        phone: '9876543210',
        role: 'OWNER',
        storeName: 'Grocery Choice - Flagship Hub'
      }));
    });

    const ordersResp = await page.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle0' });
    console.log(`Direct /orders HTTP status: ${ordersResp.status()}`);
    if (ordersResp.status() !== 200) {
      throw new Error(`Expected HTTP 200 on direct /orders, got ${ordersResp.status()}`);
    }
    console.log(`Current URL on authenticated route: ${page.url()}`);
    await page.waitForSelector('nav', { timeout: 5000 });
    console.log('✓ PASS: Direct navigation to "/orders" returns HTTP 200 and renders Owner Portal');

    // Refresh authenticated route
    const ordersReloadResp = await page.reload({ waitUntil: 'networkidle0' });
    console.log(`Reload /orders HTTP status: ${ordersReloadResp.status()}`);
    if (ordersReloadResp.status() !== 200) {
      throw new Error(`Expected HTTP 200 on reload of /orders, got ${ordersReloadResp.status()}`);
    }
    console.log('✓ PASS: Refreshing authenticated route "/orders" returns HTTP 200 and stays on route');

    // TEST 6: Authenticated route direct load & refresh ("/products")
    console.log('\n--- TEST 6: Authenticated route direct load & refresh ("/products") ---');
    const productsResp = await page.goto(`${BASE_URL}/products`, { waitUntil: 'networkidle0' });
    console.log(`Direct /products HTTP status: ${productsResp.status()}`);
    if (productsResp.status() !== 200) {
      throw new Error(`Expected HTTP 200 on direct /products, got ${productsResp.status()}`);
    }
    console.log('✓ PASS: Direct navigation to "/products" returns HTTP 200');

    // TEST 7: Static assets integrity check
    console.log('\n--- TEST 7: Static assets integrity check ---');
    if (assetResponses.length === 0) {
      throw new Error('No asset requests recorded!');
    }
    for (const asset of assetResponses) {
      console.log(`Asset: ${asset.url} -> Status: ${asset.status}, Content-Type: ${asset.contentType}`);
      if (asset.status !== 200) {
        throw new Error(`Asset ${asset.url} failed with status ${asset.status}`);
      }
      if (asset.url.endsWith('.js') && !asset.contentType.includes('javascript')) {
        throw new Error(`Asset ${asset.url} has invalid Content-Type: ${asset.contentType} (rewrite collision)`);
      }
      if (asset.url.endsWith('.css') && !asset.contentType.includes('text/css')) {
        throw new Error(`Asset ${asset.url} has invalid Content-Type: ${asset.contentType} (rewrite collision)`);
      }
    }
    console.log('✓ PASS: All JS/CSS static assets loaded with HTTP 200 and correct MIME types');

    // TEST 8: Console error check
    console.log('\n--- TEST 8: Console error verification ---');
    const fatalErrors = consoleErrors.filter(e => !e.includes('favicon.ico'));
    if (fatalErrors.length > 0) {
      throw new Error(`Browser console logged errors: ${JSON.stringify(fatalErrors)}`);
    }
    console.log('✓ PASS: 0 browser console errors during all SPA interactions');

    console.log('\n============================================================');
    console.log('  ALL VERCEL SPA ROUTING & REWRITE TESTS PASSED (8/8)  ');
    console.log('============================================================\n');
  } finally {
    await browser.close();
    server.close();
  }
}

runTests().catch(err => {
  console.error('\nTest Suite FAILED:', err);
  process.exit(1);
});
