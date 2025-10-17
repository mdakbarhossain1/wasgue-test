#!/usr/bin/env node

/**
 * Simulate the EXACT checkout flow that user experiences
 */

async function debugRealCheckoutFlow() {
  console.log('🛒 === SIMULATING REAL CHECKOUT FLOW ===\n');

  // Step 1: Get loyalty coupons (as would happen when loading checkout)
  console.log('📋 Step 1: Loading loyalty coupons...');
  let availableCoupons = [];
  
  try {
    const response = await fetch('http://localhost:3000/api/loyalty/coupons?email=jackwullems18@gmail.com');
    
    if (response.ok) {
      const result = await response.json();
      availableCoupons = result.coupons || [];
      console.log(`✅ Found ${availableCoupons.length} loyalty coupons`);
      if (availableCoupons.length > 0) {
        console.log(`   First coupon: ${availableCoupons[0].code} (€${availableCoupons[0].discount_amount})`);
      }
    } else {
      console.log('❌ Failed to load coupons');
      return;
    }
  } catch (error) {
    console.log('💥 Error loading coupons:', error.message);
    return;
  }

  if (availableCoupons.length === 0) {
    console.log('⚠️ No coupons available, cannot test coupon flow');
    return;
  }

  const testCoupon = availableCoupons[0];

  console.log('\n---\n');

  // Step 2: Apply coupon (validate it)
  console.log(`🎫 Step 2: Applying coupon "${testCoupon.code}"...`);
  
  try {
    const response = await fetch('http://localhost:3000/api/woocommerce/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coupon_code: testCoupon.code,
        subtotal: 29.90
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Coupon validation successful');
      console.log(`   Discount: €${result.discount_amount}`);
    } else {
      console.log('❌ Coupon validation failed');
      const error = await response.text();
      console.log('   Error:', error);
      return;
    }
  } catch (error) {
    console.log('💥 Error validating coupon:', error.message);
    return;
  }

  console.log('\n---\n');

  // Step 3: Proceed to payment (create payment intent)
  console.log('💳 Step 3: Creating payment intent with applied coupon...');
  
  // Simulate cart with loyalty coupon applied
  const orderData = {
    lineItems: [
      { id: "335060", quantity: 1 },  // Wasstrips €14.95
      { id: "1893", quantity: 1 }     // Proefpakket €14.95
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
      coupon_code: testCoupon.code,
      discount_type: "fixed_cart",
      discount_amount: testCoupon.discount_amount
    },
    totals: {
      subtotal: 29.90,
      discountAmount: testCoupon.discount_amount,
      volumeDiscount: 0,
      shippingCost: 0,
      finalTotal: 29.90 - testCoupon.discount_amount
    }
  };

  console.log('📦 Order summary:');
  console.log(`   Subtotal: €29.90`);
  console.log(`   Discount: -€${testCoupon.discount_amount}`);
  console.log(`   Final Total: €${orderData.totals.finalTotal}`);

  try {
    console.log('📡 Making Stripe create-intent request...');
    
    const response = await fetch('http://localhost:3000/api/stripe/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    console.log(`   HTTP Status: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ SUCCESS! Payment intent created');
      console.log(`   Payment Intent ID: ${result.paymentIntentId}`);
      console.log(`   Amount: €${result.amount}`);
      console.log(`   Currency: ${result.currency}`);
      
      // Step 4: Simulate webhook
      console.log('\n🔗 Step 4: Testing webhook simulation...');
      
      const webhookResponse = await fetch('http://localhost:3000/api/stripe/simulate-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId: result.paymentIntentId })
      });

      console.log(`   Webhook Status: ${webhookResponse.status}`);
      
      if (webhookResponse.ok) {
        const webhookResult = await webhookResponse.json();
        console.log('✅ Webhook simulation successful');
        console.log(`   Order Created: ${webhookResult.success}`);
      }

    } else {
      console.log('❌ FAILED! This is likely the 500 error!');
      console.log(`   Response Status: ${response.status}`);
      console.log(`   Response Headers:`, Object.fromEntries(response.headers.entries()));
      
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.json();
          console.log('   JSON Error:', errorData);
        } catch (e) {
          console.log('   Failed to parse JSON error');
        }
      } else {
        const errorText = await response.text();
        console.log('   Raw Error (first 500 chars):', errorText.substring(0, 500));
      }
    }
  } catch (error) {
    console.log('💥 Network/fetch error:', error.message);
    console.log('   This could be a connection issue or server crash');
  }

  console.log('\n🏁 === CHECKOUT FLOW SIMULATION COMPLETE ===');
}

debugRealCheckoutFlow().catch(console.error);

