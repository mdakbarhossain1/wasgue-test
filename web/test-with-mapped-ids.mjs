#!/usr/bin/env node

/**
 * Test the create-intent API with the exact mapped IDs from the browser
 */

async function testWithMappedIds() {
  console.log('🧪 === TESTING CREATE-INTENT API WITH MAPPED IDs ===\n');

  // This is the exact data that is now being sent from the browser (with mapped IDs)
  const orderData = {
    lineItems: [
      { id: "1410", quantity: 2 },    // blossom-drip → 1410
      { id: "1425", quantity: 3 },    // full-moon → 1425  
      { id: "1893", quantity: 1 }     // trial-pack → 1893
    ],
    customer: {
      customerId: "1",
      firstName: "Jack",
      lastName: "Wullems", 
      email: "jackwullems18@gmail.com",
      phone: "+31612345678",
      businessOrder: false,
      address: "Teststraat",
      houseNumber: "123",
      city: "Amsterdam",
      postcode: "1000AA"
    },
    appliedDiscount: {
      coupon_code: "loyalty-amfja3-oy2",
      discount_type: "fixed_cart",
      discount_amount: 13
    }
  };

  console.log('📤 Sending request to create-intent...');
  console.log('Line Items:', JSON.stringify(orderData.lineItems, null, 2));
  console.log('Applied Discount:', JSON.stringify(orderData.appliedDiscount, null, 2));

  try {
    const response = await fetch('http://localhost:3000/api/stripe/create-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });

    console.log(`\n📥 Response status: ${response.status}`);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    const result = await response.json();

    if (response.ok) {
      console.log('✅ SUCCESS:', result);
    } else {
      console.log('❌ ERROR:', result);
    }
  } catch (error) {
    console.error('💥 Network error:', error.message);
  }
}

testWithMappedIds();

