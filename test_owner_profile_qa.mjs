import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 5191;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('====================================================');
  console.log('OWNER PROFILE SECTION - COMPREHENSIVE QA E2E TESTS');
  console.log('====================================================\n');

  let passes = 0;
  let fails = 0;
  const consoleErrors = [];

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passes++;
    } else {
      console.error(`[FAIL] ${message}`);
      fails++;
    }
  }

  // 1. Create temporary test files for image uploads
  const tempDir = path.join(__dirname, 'test_temp_assets');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Valid small PNG (1x1 pixel PNG)
  const validPngPath = path.join(tempDir, 'valid_avatar.png');
  const validPngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  fs.writeFileSync(validPngPath, validPngBuffer);

  // Invalid file type (.txt)
  const invalidTxtPath = path.join(tempDir, 'invalid_file.txt');
  fs.writeFileSync(invalidTxtPath, 'This is a text file, not an image.');

  // Oversized file (>2MB)
  const oversizedPath = path.join(tempDir, 'oversized_image.png');
  const oversizedBuffer = Buffer.alloc(2.5 * 1024 * 1024, 0); // 2.5 MB
  fs.writeFileSync(oversizedPath, oversizedBuffer);

  // 2. Connect to running preview server
  console.log(`[INFO] Connecting to Vite preview server at ${BASE_URL}...`);

  // 3. Launch Puppeteer browser
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    let ownerProfileState = {
      id: 1,
      name: 'Suresh Verma',
      fullName: 'Suresh Verma',
      email: 'owner@grocerychoice.com',
      phone: '+91 98765 43210',
      role: 'OWNER',
      gender: 'Male',
      dateOfBirth: '1985-08-15'
    };

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    };

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const url = req.url();
      const method = req.method();

      if (method === 'OPTIONS') {
        req.respond({
          status: 200,
          headers: corsHeaders
        });
        return;
      }

      if (url.includes('/api/auth/me')) {
        if (method === 'PUT') {
          try {
            const body = JSON.parse(req.postData() || '{}');
            ownerProfileState = { ...ownerProfileState, ...body };
          } catch {
            // ignore
          }
          req.respond({
            status: 200,
            headers: corsHeaders,
            contentType: 'application/json',
            body: JSON.stringify(ownerProfileState)
          });
        } else {
          req.respond({
            status: 200,
            headers: corsHeaders,
            contentType: 'application/json',
            body: JSON.stringify(ownerProfileState)
          });
        }
      } else if (url.includes('/api/')) {
        req.respond({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: '[]'
        });
      } else {
        req.continue();
      }
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('Failed to load resource') && !text.includes('favicon')) {
          consoleErrors.push(text);
          console.error('[BROWSER ERROR]', text);
        }
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
      console.error('[PAGE ERROR]', err.message);
    });

    // Handle window.confirm automatically (e.g. for remove picture and logout)
    page.on('dialog', async (dialog) => {
      // console.log(`[DIALOG] ${dialog.type()}: ${dialog.message()}`);
      await dialog.accept();
    });

    await page.setViewport({ width: 1280, height: 900 });

    // Step 1: Initialize localStorage with an authenticated Owner session
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const mockOwner = {
        id: 1,
        name: 'Suresh Verma',
        fullName: 'Suresh Verma',
        email: 'owner@grocerychoice.com',
        phone: '+91 98765 43210',
        role: 'OWNER',
        gender: 'Male',
        dateOfBirth: '1985-08-15',
        storeName: 'Grocery Choice - Flagship Hub',
        profilePicture: null
      };
      localStorage.setItem('grocery_choice_owner_auth', JSON.stringify(mockOwner));
      localStorage.setItem('grocery_choice_owner_token', 'mock-owner-jwt-test-token');
    });

    // Step 2: Navigate to /profile directly
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded' });
    await delay(700);

    const currentUrl = page.url();
    assert(currentUrl.includes('/profile'), `Profile route loaded correctly: ${currentUrl}`);

    // Step 3: Verify Owner personal information loads
    const pageText = await page.evaluate(() => document.body.innerText);
    assert(pageText.includes('Suresh Verma'), 'Owner full name "Suresh Verma" is displayed');
    assert(pageText.includes('owner@grocerychoice.com'), 'Owner email address is displayed');
    assert(pageText.includes('+91 98765 43210'), 'Owner mobile number is displayed');
    assert(pageText.includes('Male'), 'Owner gender "Male" is displayed');
    assert(pageText.includes('15 Aug 1985'), 'Owner DOB formatted as "15 Aug 1985" is displayed');
    assert(pageText.includes('OWNER'), 'Owner account role is displayed');

    // Step 4: Verify default avatar initial in header, sidebar, and profile card
    const headerInitial = await page.evaluate(() => {
      const el = document.querySelector('.owner-header-avatar');
      return el ? el.innerText.trim() : null;
    });
    assert(headerInitial === 'S', `Header avatar displays correct initial "S": got "${headerInitial}"`);

    // Step 5: Test Edit Profile Button
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Edit Profile'));
      if (btn) btn.click();
    });
    await delay(500);

    // Verify edit form inputs rendered
    const fullNameInput = await page.$('input#owner-fullName');
    const emailInput = await page.$('input#owner-email');
    const phoneInput = await page.$('input#owner-phone');
    const genderSelect = await page.$('select#owner-gender');
    const dobInput = await page.$('input#owner-dateOfBirth');

    assert(fullNameInput !== null, 'Full Name input is rendered');
    assert(emailInput !== null, 'Email input is rendered');
    assert(phoneInput !== null, 'Phone input is rendered');
    assert(genderSelect !== null, 'Gender select is rendered');
    assert(dobInput !== null, 'Date of Birth input is rendered');

    // Step 6: Test Gender Options
    const genderOptions = await page.evaluate(() => {
      const select = document.querySelector('select#owner-gender');
      return Array.from(select.options).map((o) => o.value);
    });
    assert(
      genderOptions.includes('Male') &&
      genderOptions.includes('Female') &&
      genderOptions.includes('Other') &&
      genderOptions.includes('Prefer not to say'),
      `Gender options include all required values: ${genderOptions.join(', ')}`
    );

    // Step 7: Test DOB validation (max date is today or earlier)
    const dobMax = await page.evaluate(() => {
      const input = document.querySelector('input#owner-dateOfBirth');
      return input.getAttribute('max');
    });
    const todayStr = new Date().toISOString().split('T')[0];
    assert(dobMax === todayStr, `Date of Birth max attribute blocks future dates (max="${dobMax}", today="${todayStr}")`);

    // Step 8: Test Cancel Edit
    const cancelEditBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.innerText.includes('Cancel') && b.closest('.profile-edit-form'));
    });
    assert(cancelEditBtn !== null, 'Cancel edit button exists');
    await cancelEditBtn.click();
    await delay(300);

    const isEditFormStillVisible = await page.$('form.profile-edit-form');
    assert(isEditFormStillVisible === null, 'Clicking Cancel restores read-only profile view');

    // Step 9: Edit and Save Profile
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Edit Profile'));
      if (btn) btn.click();
    });
    await page.waitForSelector('input#owner-fullName', { timeout: 3000 });
    await delay(300);

    // Change Name and Gender
    await page.evaluate(() => {
      const nameInp = document.querySelector('input#owner-fullName');
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(nameInp, 'Suresh K. Verma');
      nameInp.dispatchEvent(new Event('input', { bubbles: true }));
      nameInp.dispatchEvent(new Event('change', { bubbles: true }));

      const gSel = document.querySelector('select#owner-gender');
      gSel.value = 'Prefer not to say';
      gSel.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Click Save Changes
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Save Changes'));
      if (btn) btn.click();
    });
    await delay(600);

    const updatedText = await page.evaluate(() => document.body.innerText);
    assert(updatedText.includes('Suresh K. Verma'), 'Saved Full Name "Suresh K. Verma" displayed in profile view');
    assert(updatedText.includes('Prefer not to say'), 'Saved Gender "Prefer not to say" displayed in profile view');
    assert(updatedText.includes('updated successfully'), 'Success banner displayed after saving profile');

    // Step 10: Test Profile Picture - Invalid File Type Rejection
    const fileInput = await page.$('input[type="file"]');
    assert(fileInput !== null, 'Profile picture file input element exists');

    await fileInput.uploadFile(invalidTxtPath);
    await delay(400);

    const errorText1 = await page.evaluate(() => document.body.innerText);
    assert(
      errorText1.includes('Invalid file type') || errorText1.includes('JPEG, PNG, or WebP'),
      'Invalid file type (.txt) properly rejected with clear warning'
    );

    // Step 11: Test Profile Picture - File > 2MB Rejection
    await fileInput.uploadFile(oversizedPath);
    await delay(400);

    const errorText2 = await page.evaluate(() => document.body.innerText);
    assert(
      errorText2.includes('2MB') || errorText2.includes('exceeds the 2MB limit'),
      'Oversized file (>2MB) properly rejected with clear size limit message'
    );

    // Step 12: Test Profile Picture - Valid Upload & Preview
    await fileInput.uploadFile(validPngPath);
    await delay(500);

    const previewBadge = await page.evaluate(() => {
      const badges = Array.from(document.querySelectorAll('span'));
      return badges.some((b) => b.innerText.trim() === 'Preview');
    });
    assert(previewBadge, 'Immediate client-side preview badge shown before saving');

    const hasSavePicBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some((b) => b.innerText.includes('Save Picture'));
    });
    assert(hasSavePicBtn, 'Save Picture button appears during preview');

    // Step 13: Save Profile Picture & Verify Avatar Persistence
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find((b) => b.innerText.includes('Save Picture'));
      if (btn) btn.click();
    });
    await delay(1000);

    const successPicText = await page.evaluate(() => document.body.innerText);
    assert(successPicText.includes('Profile picture updated successfully'), 'Profile picture save confirmation displayed');

    const storedAvatar = await page.evaluate(() => {
      return localStorage.getItem('grocery_choice_owner_avatar_default') ||
             localStorage.getItem('grocery_choice_owner_avatar_+91 98765 43210') ||
             localStorage.getItem('grocery_choice_owner_avatar_1');
    });
    assert(!!storedAvatar && storedAvatar.startsWith('data:image/jpeg'), 'Avatar persisted in localStorage as compressed JPEG data URL');

    // Step 14: Header and Sidebar Avatar Synchronization
    const headerHasImg = await page.evaluate(() => {
      const img = document.querySelector('.owner-header-avatar img');
      return !!img && !!img.src;
    });
    assert(headerHasImg, 'Owner header avatar displays the saved profile picture');

    const sidebarHasImg = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('.owner-sidebar img'));
      return imgs.length > 0;
    });
    assert(sidebarHasImg, 'Owner sidebar user card displays the saved profile picture');

    // Step 15: Remove Profile Picture
    const hasRemovePicBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some((b) => b.innerText.includes('Remove Picture'));
    });
    assert(hasRemovePicBtn, 'Remove Picture button is available after picture is saved');

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find((b) => b.innerText.includes('Remove Picture'));
      if (btn) btn.click();
    });
    await delay(800);

    const removeText = await page.evaluate(() => document.body.innerText);
    assert(removeText.includes('Default avatar restored') || removeText.includes('removed'), 'Remove picture restores default avatar');

    // Step 16: Test Responsive Layouts across 6 breakpoints
    const breakpoints = [1024, 768, 430, 414, 390, 375];
    console.log('\n--- Testing Responsive Layouts ---');
    for (const width of breakpoints) {
      await page.setViewport({ width, height: 800 });
      await delay(300);

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      assert(!hasHorizontalScroll, `Responsive at ${width}px: no horizontal scrollbar (scrollWidth <= clientWidth)`);
    }

    // Step 17: Account & Security Tab
    await page.setViewport({ width: 1280, height: 900 });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.profile-nav-item'));
      const btn = btns.find((b) => b.innerText.includes('Account & Security'));
      if (btn) btn.click();
    });
    await delay(400);

    const secText = await page.evaluate(() => document.body.innerText);
    assert(secText.includes('Store Owner Access & Privileges'), 'Account & Security privileges section loads');
    assert(secText.includes('Assigned Store Hub'), 'Assigned Store Hub section loads');
    assert(secText.includes('Session Management'), 'Session Management section loads');

    // Step 18: Logout from Profile Page
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find((b) => b.innerText.includes('Sign Out of Owner Portal'));
      if (btn) btn.click();
    });
    await delay(800);

    const finalUrl = page.url();
    assert(finalUrl.includes('/login'), `Sign Out redirects to /login: got ${finalUrl}`);

    const isTokenCleared = await page.evaluate(() => {
      return !localStorage.getItem('grocery_choice_owner_token') && !localStorage.getItem('grocery_choice_owner_auth');
    });
    assert(isTokenCleared, 'Owner token and auth data cleared from localStorage on logout');

    // Step 19: Check console errors
    assert(consoleErrors.length === 0, `Zero runtime console errors (encountered: ${consoleErrors.length})`);
    if (consoleErrors.length > 0) {
      console.error('Console errors:', consoleErrors);
    }

  } finally {
    await browser.close();

    // Clean up temporary assets
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passes} PASSED, ${fails} FAILED`);
  console.log('====================================================');

  if (fails > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
