#!/usr/bin/env node

/**
 * Test the create-intent API directly with the exact data from checkout
 */

async function testCreateIntentDirect() {
  console.log('🧪 === TESTING CREATE-INTENT API DIRECTLY ===\n');

  // This is the exact data that would be sent from checkout
  const orderData = {
    lineItems: [
      { id: "blossom-drip", quantity: 2 },  // This should map to 1410
      { id: "full-moon", quantity: 3 },      // This should map to 1425
      { id: "trial-pack", quantity: 1 }      // This should map to 1893
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
  console.log('Line Items:', orderData.lineItems);
  console.log('Applied Discount:', orderData.appliedDiscount);

  try {
    const response = await fetch('http://localhost:3000/api/stripe/create-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    console.log('\\n📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const result = await response.json();
      console.log('✅ SUCCESS:', result);
    } else {
      const errorText = await response.text();
      console.log('❌ ERROR Response Body:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('❌ ERROR JSON:', errorJson);
      } catch (parseError) {
        console.log('❌ Could not parse error as JSON');
      }
    }

  } catch (error) {
    console.error('💥 Fetch Error:', error);
  }
}

testCreateIntentDirect().catch(console.error);

