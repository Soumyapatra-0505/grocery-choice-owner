import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CUSTOMER_URL = 'http://127.0.0.1:5173';
const OWNER_URL = 'http://127.0.0.1:5174';
const BACKEND_URL = 'http://localhost:8080/api';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runBrowserOrderQA() {
  console.log('====================================================');
  console.log('STARTING REAL BROWSER QA TEST FOR ORDER MANAGEMENT');
  console.log('====================================================\n');

  const customerConsoleErrors = [];
  const ownerConsoleErrors = [];

  let passes = 0;
  let fails = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passes++;
    } else {
      console.error(`[FAIL] ${message}`);
      fails++;
    }
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // ----------------------------------------------------
    // PART 1: CUSTOMER BROWSER TESTS
    // ----------------------------------------------------
    console.log('\n--- PART 1: Customer Browser Tests ---');
    const customerPage = await browser.newPage();
    customerPage.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('Failed to load resource') && !text.includes('favicon')) {
          customerConsoleErrors.push(text);
        }
      }
    });

    customerPage.on('pageerror', (err) => {
      console.log('CUSTOMER PAGE UNCAUGHT ERROR:', err.message);
      customerConsoleErrors.push(err.message);
    });

    await customerPage.setViewport({ width: 1280, height: 800 });

    // Step 1: Open Customer Home & clear cart
    await customerPage.goto(`${CUSTOMER_URL}/products`, { waitUntil: 'networkidle2' });
    await customerPage.evaluate(() => localStorage.removeItem('grocery_choice_cart'));
    await customerPage.reload({ waitUntil: 'networkidle2' });
    await customerPage.waitForSelector('.product-card', { timeout: 10000 }).catch(() => {});
    await delay(1500);

    const productCards = await customerPage.$$('.product-card');
    assert(productCards.length > 0, `Products page loaded successfully with ${productCards.length} product cards visible`);

    // Step 2: Get initial stock of Apple (product 4)
    const p4Res = await fetch(`${BACKEND_URL}/products/4`);
    const p4Data = await p4Res.json();
    const stockBeforeOrder = p4Data.stockQuantity;
    console.log(`Apple stock before order: ${stockBeforeOrder}`);

    // Step 3: Click real ADD button on the Apple product card
    const appleBtn = await customerPage.$('button[aria-label*="Apple"], button[aria-label*="Shimla"]');
    let added = false;
    if (appleBtn) {
      await appleBtn.click();
      added = true;
      console.log('Clicked ADD button on Apple card in browser');
    } else {
      const addButtons = await customerPage.$$('.product-card button');
      for (const btn of addButtons) {
        const btnText = await customerPage.evaluate(el => el.innerText, btn);
        if (btnText.includes('ADD')) {
          await btn.click();
          added = true;
          console.log('Clicked ADD button on product card in browser');
          break;
        }
      }
    }
    assert(added, 'Added product to cart via real browser button click');
    await delay(1500);

    // Step 4: Navigate to Checkout page
    await customerPage.goto(`${CUSTOMER_URL}/checkout`, { waitUntil: 'networkidle2' });
    await customerPage.waitForSelector('#main-content *', { timeout: 10000 }).catch(() => {});
    await delay(2500);

    // Verify checkout page elements
    const bodyHtml = await customerPage.evaluate(() => document.body.innerHTML);
    const pageText = await customerPage.evaluate(() => document.body.innerText);
    console.log('PAGE TEXT ON CHECKOUT (length: ' + pageText.length + '):', pageText.slice(0, 300));
    assert(pageText.includes('Checkout') || pageText.includes('Delivery Address'), 'Checkout page loaded with delivery address section');
    assert(pageText.includes('Subtotal'), 'Order summary displays Subtotal');
    assert(pageText.includes('Delivery'), 'Order summary displays Delivery Fee rule');
    assert(pageText.includes('Total') || pageText.includes('Pay'), 'Order summary displays Total');

    // Step 6: Submit Order via Place Order button
    const submitBtn = await customerPage.$('button[type="submit"]');
    assert(submitBtn !== null, 'Found Place Order / Submit button on Checkout page');
    await submitBtn.click();
    await delay(2500);

    // Step 7: Verify Order Confirmation is displayed with order number and total amount
    const confirmationText = await customerPage.evaluate(() => document.body.innerText);
    assert(
      confirmationText.includes('Order Placed Successfully') || confirmationText.includes('GC-'),
      'Order confirmation displayed with unique order number format'
    );
    assert(confirmationText.includes('Pending'), 'Payment status is clearly shown as Pending');
    assert(confirmationText.includes('215'), 'Total amount ₹215 confirmed');

    // Verify cart is cleared
    const cartAfterOrder = await customerPage.evaluate(() => localStorage.getItem('grocery_choice_cart'));
    assert(!cartAfterOrder || JSON.parse(cartAfterOrder).length === 0, 'Cart is cleared after successful order');

    // Step 8: Verify stock in MySQL reduced by 1
    const p4AfterRes = await fetch(`${BACKEND_URL}/products/4`);
    const p4AfterData = await p4AfterRes.json();
    assert(p4AfterData.stockQuantity === stockBeforeOrder - 1, `Stock in MySQL reduced by 1: ${stockBeforeOrder} -> ${p4AfterData.stockQuantity}`);

    // Step 9: Navigate to My Orders page
    await customerPage.goto(`${CUSTOMER_URL}/orders`, { waitUntil: 'networkidle2' });
    await delay(1500);

    const ordersPageText = await customerPage.evaluate(() => document.body.innerText);
    assert(ordersPageText.includes('My Grocery Orders'), 'My Orders page loaded');
    assert(ordersPageText.includes('GC-'), 'New order appears in customer orders history');
    assert(ordersPageText.includes('215'), 'Order total displayed in history');

    // Step 10: Test Customer Order Cancellation in browser UI
    // Find Cancel Order button on the top order card
    const cancelButtons = await customerPage.$$('button');
    let cancelBtn = null;
    for (const b of cancelButtons) {
      const text = await customerPage.evaluate(el => el.innerText, b);
      if (text && text.includes('Cancel Order')) {
        cancelBtn = b;
        break;
      }
    }

    if (cancelBtn) {
      // Auto accept confirm dialog
      customerPage.on('dialog', async (dialog) => {
        await dialog.accept();
      });
      await cancelBtn.click();
      await delay(2000);

      const afterCancelText = await customerPage.evaluate(() => document.body.innerText);
      assert(afterCancelText.includes('Cancelled') || afterCancelText.includes('cancelled'), 'Order status updated to Cancelled in UI');

      // Verify stock restored in MySQL
      const p4RestoredRes = await fetch(`${BACKEND_URL}/products/4`);
      const p4RestoredData = await p4RestoredRes.json();
      assert(p4RestoredData.stockQuantity === stockBeforeOrder, `Stock restored in MySQL after cancellation: ${p4RestoredData.stockQuantity}`);
    } else {
      console.log('No cancel button found on page');
    }

    // Step 11: Place another order to test Owner Portal workflows
    console.log('\nPlacing second order for Owner Portal verification...');
    const order2Res = await fetch(`${BACKEND_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: 1,
        addressId: 1,
        items: [{ productId: 4, quantity: 1 }],
        paymentMethod: 'Cash on Delivery',
        deliverySlot: 'Standard Delivery'
      })
    });
    const order2 = await order2Res.json();
    assert(order2Res.status === 201, `Second order placed for Owner portal test: ${order2.orderNumber}`);

    // ----------------------------------------------------
    // PART 2: OWNER BROWSER TESTS
    // ----------------------------------------------------
    console.log('\n--- PART 2: Owner Browser Tests ---');
    const ownerPage = await browser.newPage();
    ownerPage.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('Failed to load resource') && !text.includes('favicon')) {
          ownerConsoleErrors.push(text);
        }
      }
    });

    await ownerPage.setViewport({ width: 1280, height: 800 });

    // Step 0: Ensure Owner Authentication
    await ownerPage.goto(`${OWNER_URL}/login`, { waitUntil: 'networkidle2' });
    await ownerPage.evaluate(() => {
      localStorage.setItem(
        'grocery_choice_owner_auth',
        JSON.stringify({
          name: 'Suresh Verma',
          email: 'owner@grocerychoice.com',
          phone: '+91 98765 43210',
          role: 'Store General Manager',
          storeName: 'Grocery Choice - Flagship Hub',
          authMethod: 'password',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'
        })
      );
    });

    // Step 1: Open Owner Portal Orders page
    await ownerPage.goto(`${OWNER_URL}/orders`, { waitUntil: 'networkidle2' });
    await delay(2000);

    const ownerText = await ownerPage.evaluate(() => document.body.innerText);
    assert(ownerText.includes('Customer Orders'), 'Owner Orders page loaded');
    assert(ownerText.includes(order2.orderNumber), `Newly created order ${order2.orderNumber} appears in owner table`);

    // Step 2: Test Filters (Placed, Delivered, All)
    const filterButtons = await ownerPage.$$('button');
    let placedFilterBtn = null;
    for (const btn of filterButtons) {
      const btnText = await ownerPage.evaluate(el => el.innerText, btn);
      if (btnText.includes('Placed')) {
        placedFilterBtn = btn;
        break;
      }
    }

    if (placedFilterBtn) {
      await placedFilterBtn.click();
      await delay(1000);
      const placedFilterText = await ownerPage.evaluate(() => document.body.innerText);
      assert(placedFilterText.includes(order2.orderNumber), 'Placed filter correctly displays the placed order');
    }

    // Step 3: Test Order Details Breakdown Modal
    // Click order row to open modal
    const orderRow = await ownerPage.$('tbody tr:first-child');
    if (orderRow) {
      await orderRow.click();
      await delay(1000);

      const modalText = await ownerPage.evaluate(() => document.body.innerText);
      assert(modalText.includes('Order Details') || modalText.includes(order2.orderNumber), 'Order details breakdown modal opened');
      assert(modalText.includes('Delivery Address') || modalText.includes('Gurugram'), 'Delivery address displayed in modal');
      assert(modalText.includes('Ordered Products') || modalText.includes('Subtotal'), 'Ordered products and financial summary displayed');

      // Close modal
      const closeButtons = await ownerPage.$$('button');
      for (const cb of closeButtons) {
        const isClose = await ownerPage.evaluate(el => el.innerHTML.includes('svg') && !el.innerText, cb);
        if (isClose) {
          await cb.click();
          break;
        }
      }
      await delay(500);
    }

    // Step 4: Test Owner Status Update in Table (Change from PLACED -> CONFIRMED)
    console.log('Testing owner status update in table...');
    const statusSelect = await ownerPage.$('tbody tr:first-child select');
    if (statusSelect) {
      await statusSelect.select('CONFIRMED');
      await delay(2000);

      const updatedText = await ownerPage.evaluate(() => document.body.innerText);
      assert(
        updatedText.includes('status updated') || updatedText.includes('Confirmed') || updatedText.includes('CONFIRMED'),
        'Owner status update feedback shown and status transitioned to Confirmed'
      );

      // Verify in backend MySQL
      const verifyBackendRes = await fetch(`${BACKEND_URL}/orders/${order2.id}`);
      const verifyBackend = await verifyBackendRes.json();
      assert(verifyBackend.status === 'CONFIRMED', `Backend MySQL confirms order status is CONFIRMED`);
    }

    // Step 5: Test Page Refresh
    await ownerPage.reload({ waitUntil: 'networkidle2' });
    await delay(1500);
    const reloadText = await ownerPage.evaluate(() => document.body.innerText);
    assert(reloadText.includes(order2.orderNumber), 'Data persists across page refresh from MySQL');

    // ----------------------------------------------------
    // CONSOLE ERROR SUMMARY
    // ----------------------------------------------------
    console.log('\n--- Console Error Audit ---');
    console.log(`Customer console errors: ${customerConsoleErrors.length}`);
    if (customerConsoleErrors.length > 0) {
      console.log('Customer errors:', customerConsoleErrors);
    }
    console.log(`Owner console errors: ${ownerConsoleErrors.length}`);
    if (ownerConsoleErrors.length > 0) {
      console.log('Owner errors:', ownerConsoleErrors);
    }

    assert(customerConsoleErrors.length === 0, 'No uncaught JavaScript errors on Customer application');
    assert(ownerConsoleErrors.length === 0, 'No uncaught JavaScript errors on Owner application');

    console.log(`\n====================================================`);
    console.log(`QA TEST RESULTS: ${passes} PASSED, ${fails} FAILED`);
    console.log(`====================================================\n`);

    if (fails > 0) process.exit(1);
  } catch (err) {
    console.error('QA Test execution error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runBrowserOrderQA();
