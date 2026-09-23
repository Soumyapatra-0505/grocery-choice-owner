// Exhaustive Order Management Test Suite
const BACKEND_URL = 'http://localhost:8080/api';

async function runExhaustiveTestSuite() {
  console.log('===========================================================');
  console.log('GROCERY CHOICE ORDER MANAGEMENT - EXHAUSTIVE TEST SUITE');
  console.log('===========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // 1. Check health
    const healthRes = await fetch(`${BACKEND_URL}/health`);
    const health = await healthRes.json();
    assert(health.status === 'UP', '1. Backend Health Check', JSON.stringify(health));

    // 2. Fetch Product 4 (Shimla Apple) to observe stock
    const p4BeforeRes = await fetch(`${BACKEND_URL}/products/4`);
    const p4Before = await p4BeforeRes.json();
    const stockBefore = p4Before.stockQuantity;
    const applePrice = p4Before.sellingPrice;
    console.log(`Initial Apple stock: ${stockBefore}, sellingPrice: ₹${applePrice}`);

    // 3. Create Order 1 (< ₹500, deliveryCharge should be ₹40)
    const createRes1 = await fetch(`${BACKEND_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: 1,
        addressId: 1,
        deliveryAddressText: 'Flat 402, Green Glen Apartments, Sector 14 Hub, Gurugram',
        items: [{ productId: 4, quantity: 2 }],
        paymentMethod: 'UPI',
        deliverySlot: 'Express Delivery (Within 25 mins)'
      })
    });
    const order1 = await createRes1.json();
    assert(createRes1.status === 201, '2. Create order successfully (201 Created)', JSON.stringify(order1));
    assert(order1.orderNumber && order1.orderNumber.startsWith('GC-'), '3. Unique Order Number format GC-YYYYMMDD-XXXXXX', order1.orderNumber);
    assert(order1.status === 'PLACED', '4. Initial Order Status is PLACED', order1.status);
    assert(order1.paymentStatus === 'PENDING', '5. Initial Payment Status is PENDING', order1.paymentStatus);

    // 4. Verify Order saved in MySQL with OrderItems
    const getOrder1Res = await fetch(`${BACKEND_URL}/orders/${order1.id}`);
    const getOrder1 = await getOrder1Res.json();
    assert(getOrder1.id === order1.id, '6. Verify Order retrieved from MySQL', JSON.stringify(getOrder1.id));
    assert(Array.isArray(getOrder1.items) && getOrder1.items.length === 1, '7. Verify OrderItems saved in MySQL');
    const item1 = getOrder1.items[0];
    assert(item1.productName === p4Before.name && item1.unit === p4Before.unit, '8. OrderItem product name & unit snapshot preserved');
    assert(Number(item1.price) === Number(applePrice), '9. OrderItem price snapshot matches DB selling price');
    assert(Number(item1.subtotal) === Number(applePrice) * 2, '10. OrderItem subtotal calculated accurately');

    // 5. Verify Subtotal, Delivery Charge & Grand Total
    const expectedSubtotal1 = Number(applePrice) * 2;
    const expectedDeliveryCharge1 = expectedSubtotal1 >= 500 ? 0 : 40;
    const expectedTotal1 = expectedSubtotal1 + expectedDeliveryCharge1;
    assert(Number(getOrder1.subtotal) === expectedSubtotal1, '11. Subtotal calculation verified', `Expected ${expectedSubtotal1}, got ${getOrder1.subtotal}`);
    assert(Number(getOrder1.deliveryCharge) === 40, '12. Delivery charge ₹40 for order < ₹500 verified', `Got ${getOrder1.deliveryCharge}`);
    assert(Number(getOrder1.totalAmount) === expectedTotal1, '13. Final Total amount verified', `Expected ${expectedTotal1}, got ${getOrder1.totalAmount}`);

    // 6. Verify Stock reduced in MySQL
    const p4AfterRes = await fetch(`${BACKEND_URL}/products/4`);
    const p4After = await p4AfterRes.json();
    assert(p4After.stockQuantity === stockBefore - 2, '14. Product stock reduced transactionally by 2', `Before: ${stockBefore}, After: ${p4After.stockQuantity}`);

    // 7. Create Order 2 (>= ₹500, deliveryCharge should be ₹0)
    // Find a product or order quantity to exceed 500
    const createRes2 = await fetch(`${BACKEND_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: 1,
        addressId: 1,
        items: [{ productId: 4, quantity: 3 }], // 3 * 175 = 525 >= 500
        paymentMethod: 'Cash on Delivery'
      })
    });
    const order2 = await createRes2.json();
    assert(createRes2.status === 201, '15. Create order >= ₹500 successfully', JSON.stringify(order2));
    assert(Number(order2.subtotal) === Number(applePrice) * 3, '16. Subtotal >= 500 verified');
    assert(Number(order2.deliveryCharge) === 0, '17. Free delivery (₹0) for order >= ₹500 rule verified', `Delivery charge: ${order2.deliveryCharge}`);
    assert(Number(order2.totalAmount) === Number(order2.subtotal), '18. Total equals subtotal with free delivery');

    // 8. Test Insufficient Stock
    const currentStock = (await (await fetch(`${BACKEND_URL}/products/4`)).json()).stockQuantity;
    const overOrderRes = await fetch(`${BACKEND_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: 1,
        addressId: 1,
        items: [{ productId: 4, quantity: currentStock + 999 }]
      })
    });
    const overOrder = await overOrderRes.json();
    assert(overOrderRes.status === 400, '19. Insufficient stock returns 400 Bad Request', `Status: ${overOrderRes.status}`);
    assert(overOrder.message && overOrder.message.includes('Insufficient stock'), '20. Descriptive error message for insufficient stock', overOrder.message);

    // 9. Verify failed order did not reduce stock
    const stockAfterFailed = (await (await fetch(`${BACKEND_URL}/products/4`)).json()).stockQuantity;
    assert(stockAfterFailed === currentStock, '21. Failed order does NOT reduce stock (Atomic Transaction)', `Stock: ${stockAfterFailed}`);

    // 10. Test Customer Order History
    const historyRes = await fetch(`${BACKEND_URL}/orders/customer/1`);
    const history = await historyRes.json();
    assert(Array.isArray(history) && history.length >= 2, '22. Customer order history retrieved successfully', `Count: ${history.length}`);
    const foundOrder1 = history.find(o => o.id === order1.id);
    assert(foundOrder1 !== undefined, '23. Order 1 present in customer order history');

    // 11. Test Order by Number
    const byNumRes = await fetch(`${BACKEND_URL}/orders/number/${order1.orderNumber}`);
    const byNum = await byNumRes.json();
    assert(byNum.id === order1.id, '24. Retrieve order by unique order number', byNum.orderNumber);

    // 12. Test Customer Order Cancellation
    const cancelRes = await fetch(`${BACKEND_URL}/orders/${order1.id}/cancel`, {
      method: 'POST'
    });
    const cancelledOrder = await cancelRes.json();
    assert(cancelRes.status === 200, '25. Cancel PLACED order successfully', `Status: ${cancelRes.status}`);
    assert(cancelledOrder.status === 'CANCELLED', '26. Order status updated to CANCELLED', cancelledOrder.status);

    // 13. Verify Stock restored in MySQL after cancellation
    const stockAfterCancel = (await (await fetch(`${BACKEND_URL}/products/4`)).json()).stockQuantity;
    assert(stockAfterCancel === stockAfterFailed + 2, '27. Stock restored in MySQL on cancellation', `Restored from ${stockAfterFailed} to ${stockAfterCancel}`);

    // 14. Test Double Cancellation Prevention
    const doubleCancelRes = await fetch(`${BACKEND_URL}/orders/${order1.id}/cancel`, {
      method: 'POST'
    });
    assert(doubleCancelRes.status === 400, '28. Prevent double cancellation of CANCELLED order (400 Bad Request)');

    // 15. Test Owner Order List
    const allOrdersRes = await fetch(`${BACKEND_URL}/orders`);
    const allOrders = await allOrdersRes.json();
    assert(Array.isArray(allOrders) && allOrders.length >= 2, '29. Owner retrieves all orders from MySQL', `Total orders: ${allOrders.length}`);

    // 16. Test Owner Filter by Status
    const placedOrdersRes = await fetch(`${BACKEND_URL}/orders/status/PLACED`);
    const placedOrders = await placedOrdersRes.json();
    assert(Array.isArray(placedOrders), '30. Owner filter by status returns list');
    const allArePlaced = placedOrders.every(o => o.status === 'PLACED');
    assert(allArePlaced, '31. Filter by status PLACED contains only PLACED orders');

    // 17. Test Owner Status Transition (order2: PLACED -> CONFIRMED -> PROCESSING -> OUT_FOR_DELIVERY -> DELIVERED)
    const s1Res = await fetch(`${BACKEND_URL}/orders/${order2.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CONFIRMED' })
    });
    const s1 = await s1Res.json();
    assert(s1.status === 'CONFIRMED', '32. Owner transitions status PLACED -> CONFIRMED');

    const s2Res = await fetch(`${BACKEND_URL}/orders/${order2.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PROCESSING' })
    });
    const s2 = await s2Res.json();
    assert(s2.status === 'PROCESSING', '33. Owner transitions status CONFIRMED -> PROCESSING');

    const s3Res = await fetch(`${BACKEND_URL}/orders/${order2.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'OUT_FOR_DELIVERY' })
    });
    const s3 = await s3Res.json();
    assert(s3.status === 'OUT_FOR_DELIVERY', '34. Owner transitions status PROCESSING -> OUT_FOR_DELIVERY');

    const s4Res = await fetch(`${BACKEND_URL}/orders/${order2.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DELIVERED' })
    });
    const s4 = await s4Res.json();
    assert(s4.status === 'DELIVERED', '35. Owner transitions status OUT_FOR_DELIVERY -> DELIVERED');

    // 18. Test Invalid Status Transition on DELIVERED order
    const invalidRes = await fetch(`${BACKEND_URL}/orders/${order2.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PLACED' })
    });
    assert(invalidRes.status === 400, '36. Prevent invalid status transition from DELIVERED to PLACED (400 Bad Request)');

    // 19. Test Customer cannot cancel DELIVERED order
    const cancelDeliveredRes = await fetch(`${BACKEND_URL}/orders/${order2.id}/cancel`, {
      method: 'POST'
    });
    assert(cancelDeliveredRes.status === 400, '37. Prevent customer cancellation of DELIVERED order (400 Bad Request)');

    console.log(`\n===========================================================`);
    console.log(`EXHAUSTIVE TEST SUITE RESULT: ${passed} PASSED, ${failed} FAILED`);
    console.log(`===========================================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Error running test suite:', err);
    process.exit(1);
  }
}

runExhaustiveTestSuite();
