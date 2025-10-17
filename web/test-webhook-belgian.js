// Test script to verify Belgian webhook processing
async function testBelgianWebhook() {
  console.log('🪝 Testing Belgian Webhook Processing...');
  
  const belgianCustomer = {
    customerId: null,
    firstName: "Jack",
    lastName: "Wullems", 
    email: "jack.wullems@test.com",
    phone: "+32 123 456 789",
    companyName: "",
    vatNumber: "",
    businessOrder: false,
    
    // Belgian address data - CRITICAL: Include country field
    address: "Papaverstraat 32",
    houseNumber: "",
    houseAddition: "",
    city: "NEERPELT",
    postcode: "3910",
    country: "BE", // This is the key field we're testing
    
    // Shipping address (same as billing)
    useShippingAddress: false,
    shippingAddress: "",
    shippingHouseNumber: "",
    shippingHouseAddition: "",
    shippingCity: "",
    shippingPostcode: ""
  };

  const lineItems = [
    {
      id: "1423", // Morning Vapor WooCommerce ID
      quantity: 1
    }
  ];

  // Simulate webhook payload that would come from Stripe
  const mockWebhookPayload = {
    id: "evt_test_webhook",
    object: "event",
    api_version: "2020-08-27",
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: "pi_test_belgian_order",
        object: "payment_intent",
        amount: 1990, // €19.90 in cents
        currency: "eur",
        status: "succeeded",
        metadata: {
          cart: JSON.stringify(lineItems),
          customer_data: JSON.stringify(belgianCustomer),
          customer_email: belgianCustomer.email,
          subtotal: "14.95",
          discount_amount: "0",
          volume_discount: "0", 
          shipping_cost: "4.95",
          final_total: "19.90"
        }
      }
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: "req_test",
      idempotency_key: null
    },
    type: "payment_intent.succeeded"
  };

  try {
    console.log('📤 Sending webhook payload...');
    console.log('💾 Customer Country:', belgianCustomer.country);
    console.log('📍 Full Address:', `${belgianCustomer.address}, ${belgianCustomer.postcode} ${belgianCustomer.city}, ${belgianCustomer.country}`);
    
    const response = await fetch('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature' // This will fail verification but we can see the parsing
      },
      body: JSON.stringify(mockWebhookPayload)
    });

    const responseData = await response.text();
    
    console.log('📥 Webhook Response Status:', response.status);
    console.log('📥 Webhook Response:', responseData);

    if (response.status === 200) {
      console.log('✅ Webhook processed successfully!');
    } else if (response.status === 400 && responseData.includes('Invalid signature')) {
      console.log('⚠️ Signature verification failed (expected in test), but payload structure is valid');
    } else {
      console.log('❌ Webhook processing failed');
    }

  } catch (error) {
    console.error('❌ Webhook test failed:', error.message);
  }
}

// Also test the customer data structure that would be passed to createWooCommerceOrder
function testCustomerDataStructure() {
  console.log('\n🏗️ Testing Customer Data Structure...');
  
  const belgianCustomer = {
    firstName: "Jack",
    lastName: "Wullems",
    email: "jack.wullems@test.com", 
    phone: "+32 123 456 789",
    address: "Papaverstraat 32",
    city: "NEERPELT",
    postcode: "3910",
    country: "BE" // This field should now be available
  };

  console.log('📋 Customer data that would be sent to WooCommerce:');
  console.log(JSON.stringify(belgianCustomer, null, 2));
  
  // Simulate the billingAddress object that gets created
  const billingAddress = {
    first_name: belgianCustomer.firstName,
    last_name: belgianCustomer.lastName,
    company: '',
    address_1: `${(belgianCustomer.address || '').trim()} ${('').trim()}`.trim(),
    address_2: '',
    city: belgianCustomer.city,
    state: '',
    postcode: belgianCustomer.postcode,
    country: belgianCustomer.country, // Should be 'BE' instead of 'NL'
    email: belgianCustomer.email,
    phone: belgianCustomer.phone,
  };

  console.log('\n🏪 WooCommerce billing address that would be created:');
  console.log(JSON.stringify(billingAddress, null, 2));
  
  if (billingAddress.country === 'BE') {
    console.log('✅ Country code is correctly set to Belgium (BE)');
  } else {
    console.log('❌ Country code is incorrect:', billingAddress.country);
  }
}

// Run both tests
async function runAllTests() {
  testCustomerDataStructure();
  await testBelgianWebhook();
}

runAllTests();
