/**
 * Test script for Stripe Refund API
 * 
 * This script tests the /api/stripe/refund endpoint
 * to ensure refunds work correctly
 * 
 * Usage: node test-refund-api.mjs <payment_intent_id>
 */

const API_BASE = 'http://localhost:3000';

// Get payment intent ID from command line arguments
const paymentIntentId = process.argv[2];

if (!paymentIntentId) {
  console.log('❌ Usage: node test-refund-api.mjs <payment_intent_id>');
  console.log('💡 Tip: Get payment_intent_id from a test payment in your browser');
  process.exit(1);
}

async function testGetRefunds() {
  console.log('🔍 Testing GET refunds endpoint...\n');
  
  try {
    const response = await fetch(`${API_BASE}/api/stripe/refund?payment_intent_id=${paymentIntentId}`);
    const result = await response.json();
    
    console.log(`📊 Response status: ${response.status}`);
    console.log('📋 Refunds data:', JSON.stringify(result, null, 2));
    
    return response.ok;
  } catch (error) {
    console.error('❌ GET refunds test failed:', error.message);
    return false;
  }
}

async function testCreateRefund(isPartial = false) {
  console.log(`🧪 Testing ${isPartial ? 'partial' : 'full'} refund...\n`);
  
  try {
    const refundData = {
      paymentIntentId,
      reason: 'requested_by_customer',
    };

    if (isPartial) {
      refundData.amount = 500; // €5.00 partial refund
    }

    console.log('📤 Sending refund request:', JSON.stringify(refundData, null, 2));
    
    const response = await fetch(`${API_BASE}/api/stripe/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(refundData),
    });
    
    const result = await response.json();
    
    console.log(`📊 Response status: ${response.status}`);
    console.log('📋 Refund result:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Refund created successfully!');
      console.log(`💰 Amount: €${(result.amount / 100).toFixed(2)}`);
      console.log(`🆔 Refund ID: ${result.refundId}`);
      console.log(`📝 Status: ${result.status}`);
    } else {
      console.log('\n❌ Refund failed:', result.error);
    }
    
    return response.ok;
  } catch (error) {
    console.error('❌ Refund test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Stripe Refund API Tests\n');
  console.log('=' .repeat(50));
  console.log(`💳 Payment Intent: ${paymentIntentId}\n`);
  
  // Test 1: Get existing refunds
  const test1 = await testGetRefunds();
  console.log('\n' + '-'.repeat(50) + '\n');
  
  // Test 2: Create partial refund
  const test2 = await testCreateRefund(true);
  console.log('\n' + '-'.repeat(50) + '\n');
  
  // Test 3: Check refunds again
  const test3 = await testGetRefunds();
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Results:');
  console.log(`✅ Get Refunds (before): ${test1 ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Create Partial Refund: ${test2 ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Get Refunds (after): ${test3 ? 'PASSED' : 'FAILED'}`);
  
  if (test1 && test2 && test3) {
    console.log('\n🎉 All refund tests passed!');
    console.log('\n📝 Next steps:');
    console.log('1. Test the order management UI in browser');
    console.log('2. Verify refunds appear in Stripe Dashboard');
    console.log('3. Check WooCommerce order status updates');
  } else {
    console.log('\n❌ Some tests failed. Please check the errors above.');
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure payment intent exists and has been paid');
    console.log('2. Check Stripe API keys are configured');
    console.log('3. Verify payment intent is in succeeded status');
  }
  
  console.log('\n💡 To test full refund manually:');
  console.log(`   Visit: http://localhost:3000/checkout/success?payment_intent=${paymentIntentId}`);
}

// Run tests
runTests().catch(console.error);

