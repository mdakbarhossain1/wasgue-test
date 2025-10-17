/**
 * Test script for WooCommerce Order Creation
 * 
 * This script tests the /api/woocommerce/orders/create endpoint
 * to ensure it properly creates orders in WooCommerce
 * 
 * Usage: node test-order-creation.mjs
 */

const API_BASE = 'http://localhost:3000';

// Test data matching Stripe payment structure
const testOrderData = {
  lineItems: [
    { id: '1893', quantity: 2 },
    { id: '335060', quantity: 1 }
  ],
  customer: {
    firstName: 'Jack',
    lastName: 'Wullems',
    email: 'jack.test@example.com',
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
  },
  totals: {
    subtotal: 25.95,
    discountAmount: 5.00,
    volumeDiscount: 0,
    shippingCost: 4.95,
    finalTotal: 25.90
  },
  paymentIntentId: 'pi_test_1234567890_test_payment_intent'
};

async function testOrderCreation() {
  console.log('🧪 Testing WooCommerce Order Creation...\n');
  
  try {
    console.log('📤 Sending request to /api/woocommerce/orders/create');
    console.log('📋 Test data:', JSON.stringify(testOrderData, null, 2));
    
    const response = await fetch(`${API_BASE}/api/woocommerce/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testOrderData),
    });
    
    console.log(`\n📊 Response status: ${response.status}`);
    
    const result = await response.json();
    console.log('📋 Response data:', JSON.stringify(result, null, 2));
    
    if (!response.ok) {
      console.error('❌ API Error:', result);
      return false;
    }
    
    // Validate response structure
    const requiredFields = ['success', 'orderId', 'paymentIntentId', 'message'];
    const missingFields = requiredFields.filter(field => !(field in result));
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      return false;
    }
    
    console.log('\n✅ WooCommerce order created successfully!');
    console.log(`🆔 Order ID: ${result.orderId}`);
    console.log(`📋 Order Number: ${result.orderNumber || 'N/A'}`);
    console.log(`💳 Payment Intent: ${result.paymentIntentId}`);
    console.log(`📝 Message: ${result.message}`);
    
    if (result.order) {
      console.log('\n📊 Order Details:');
      console.log(`   Status: ${result.order.status}`);
      console.log(`   Total: €${result.order.total}`);
      console.log(`   Created: ${result.order.date_created}`);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

async function testInvalidData() {
  console.log('\n🧪 Testing invalid data handling...\n');
  
  try {
    // Test empty line items
    const response1 = await fetch(`${API_BASE}/api/woocommerce/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...testOrderData,
        lineItems: []
      }),
    });
    
    console.log(`📊 Empty cart response status: ${response1.status}`);
    const error1 = await response1.json();
    console.log('📋 Empty cart error:', error1.error);
    
    // Test missing payment intent
    const response2 = await fetch(`${API_BASE}/api/woocommerce/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...testOrderData,
        paymentIntentId: ''
      }),
    });
    
    console.log(`📊 Missing payment intent response status: ${response2.status}`);
    const error2 = await response2.json();
    console.log('📋 Missing payment intent error:', error2.error);
    
    console.log('✅ Invalid data handling tests completed');
    return true;
    
  } catch (error) {
    console.error('❌ Invalid data test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting WooCommerce Order Creation Tests\n');
  console.log('=' .repeat(50));
  
  const test1 = await testOrderCreation();
  const test2 = await testInvalidData();
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Results:');
  console.log(`✅ Order Creation: ${test1 ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Invalid Data Handling: ${test2 ? 'PASSED' : 'FAILED'}`);
  
  if (test1 && test2) {
    console.log('\n🎉 All tests passed! Order creation is working correctly.');
    console.log('\n📝 Next steps:');
    console.log('1. Test the complete checkout flow in the browser');
    console.log('2. Verify orders appear in WooCommerce admin');
    console.log('3. Check order email notifications');
  } else {
    console.log('\n❌ Some tests failed. Please check the errors above.');
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check WooCommerce API credentials');
    console.log('2. Verify WooCommerce REST API is enabled');
    console.log('3. Check product IDs exist in WooCommerce');
  }
}

// Run tests
runTests().catch(console.error);

