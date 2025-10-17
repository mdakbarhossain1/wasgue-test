#!/usr/bin/env node

/**
 * Test if environment variables fix the 500 error
 */

async function testEnvFix() {
  console.log('🔧 === TESTING ENVIRONMENT VARIABLES FIX ===\n');

  // Test the exact scenario that should trigger the 500 error
  const orderData = {
    lineItems: [{ id: "335060", quantity: 1 }],
    customer: {
      firstName: "Test", lastName: "User", email: "test@example.com",
      phone: "+31612345678", businessOrder: false,
      address: "Test", houseNumber: "1", city: "Amsterdam", postcode: "1000AA"
    },
    appliedDiscount: {
      coupon_code: "loyalty-amfja3-co8",
      discount_type: "fixed_cart", 
      discount_amount: 13
    }
  };

  console.log('💳 Testing Stripe create-intent with environment check...');

  try {
    const response = await fetch('http://localhost:3000/api/stripe/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    console.log(`   Status: ${response.status}`);

    if (response.status === 500) {
      const errorData = await response.json();
      console.log('❌ 500 ERROR CONFIRMED!');
      console.log('   Error:', errorData.error);
      console.log('   Setup Required:', errorData.setup_required);
      
      if (errorData.setup_required) {
        console.log('\n🎯 SOLUTION:');
        console.log('   1. Create web/.env.local file');
        console.log('   2. Add STRIPE_SECRET_KEY=sk_test_...');
        console.log('   3. Add STRIPE_PUBLISHABLE_KEY=pk_test_...');
        console.log('   4. Restart npm run dev');
      }
    } else if (response.ok) {
      console.log('✅ SUCCESS! Environment variables are working');
      const result = await response.json();
      console.log(`   Payment Intent created: ${result.paymentIntentId}`);
    } else {
      console.log(`❌ Different error: ${response.status}`);
      const error = await response.text();
      console.log('   Error:', error);
    }

  } catch (error) {
    console.log('💥 Network error:', error.message);
  }

  console.log('\n🏁 === TEST COMPLETE ===');
}

testEnvFix().catch(console.error);

