#!/usr/bin/env node

/**
 * Test the create-intent API with debug logging to see where the 500 error comes from
 */

async function testDebugCreateIntent() {
  console.log('🧪 === TESTING CREATE-INTENT API WITH DEBUG ===\n');

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

  try {
    console.log('📤 Sending request to /api/stripe/create-intent...');
    console.log('📊 Order data:', JSON.stringify(orderData, null, 2));

    const response = await fetch('http://localhost:3000/api/stripe/create-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });

    console.log('📡 Response status:', response.status, response.statusText);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response body:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('❌ Parsed error:', errorJson);
      } catch (e) {
        console.log('❌ Could not parse error as JSON');
      }
      
      return;
    }

    const result = await response.json();
    console.log('✅ Success response:', result);

  } catch (error) {
    console.error('❌ Request failed:', error.message);
    console.error('❌ Full error:', error);
  }
}

testDebugCreateIntent();

