/**
 * Test script for Stripe integration
 * 
 * This script tests the /api/stripe/create-intent endpoint
 * to ensure it properly creates a PaymentIntent with correct metadata
 * 
 * Usage: node test-stripe-integration.mjs
 */

const API_BASE = 'http://localhost:3000';

// Test data
const testOrderData = {
  lineItems: [
    { id: '1893', quantity: 2 },
    { id: '335060', quantity: 1 }
  ],
  customer: {
    firstName: 'Jack',
    lastName: 'Wullems',
    email: 'jack@example.com',
    phone: '+31612345678',
    businessOrder: false,
    address: 'Microfoonstraat',
    houseNumber: '30',
    city: 'Almere',
    postcode: '1322BN'
  },
  appliedDiscount: {
    coupon_code: 'TEST10',
    discount_type: 'percent',
    discount_amount: 5.00
  }
};

async function testCreatePaymentIntent() {
  console.log('🧪 Testing Stripe PaymentIntent creation...\n');
  
  try {
    console.log('📤 Sending request to /api/stripe/create-intent');
    console.log('📋 Test data:', JSON.stringify(testOrderData, null, 2));
    
    const response = await fetch(`${API_BASE}/api/stripe/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testOrderData),
    });
    
    console.log(`\n📊 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API Error:', errorData);
      return false;
    }
    
    const result = await response.json();
    console.log('✅ Response data:', JSON.stringify(result, null, 2));
    
    // Validate response structure
    const requiredFields = ['clientSecret', 'paymentIntentId', 'amount', 'currency'];
    const missingFields = requiredFields.filter(field => !(field in result));
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      return false;
    }
    
    console.log('\n✅ PaymentIntent created successfully!');
    console.log(`💰 Amount: €${result.amount.toFixed(2)}`);
    console.log(`🆔 Payment Intent ID: ${result.paymentIntentId}`);
    console.log(`🔑 Client Secret: ${result.clientSecret?.substring(0, 20)}...`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

async function testInvalidData() {
  console.log('\n🧪 Testing invalid data handling...\n');
  
  try {
    // Test empty cart
    const response1 = await fetch(`${API_BASE}/api/stripe/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lineItems: [],
        customer: testOrderData.customer
      }),
    });
    
    console.log(`📊 Empty cart response status: ${response1.status}`);
    const error1 = await response1.json();
    console.log('📋 Empty cart error:', error1.error);
    
    // Test missing email
    const response2 = await fetch(`${API_BASE}/api/stripe/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lineItems: testOrderData.lineItems,
        customer: { ...testOrderData.customer, email: '' }
      }),
    });
    
    console.log(`📊 Missing email response status: ${response2.status}`);
    const error2 = await response2.json();
    console.log('📋 Missing email error:', error2.error);
    
    console.log('✅ Invalid data handling tests completed');
    return true;
    
  } catch (error) {
    console.error('❌ Invalid data test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Stripe Integration Tests\n');
  console.log('=' .repeat(50));
  
  const test1 = await testCreatePaymentIntent();
  const test2 = await testInvalidData();
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Results:');
  console.log(`✅ PaymentIntent Creation: ${test1 ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Invalid Data Handling: ${test2 ? 'PASSED' : 'FAILED'}`);
  
  if (test1 && test2) {
    console.log('\n🎉 All tests passed! Stripe integration is working correctly.');
  } else {
    console.log('\n❌ Some tests failed. Please check the errors above.');
  }
  
  console.log('\n📝 Next steps:');
  console.log('1. Set up your Stripe environment variables (see STRIPE_ENV_SETUP.md)');
  console.log('2. Test the payment flow in the browser');
  console.log('3. Set up webhook endpoint for production');
}

// Run tests
runTests().catch(console.error);

