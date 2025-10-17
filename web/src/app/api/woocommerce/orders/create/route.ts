import { NextRequest, NextResponse } from 'next/server';

// WooCommerce credentials
const WC_API_URL = process.env.WOOCOMMERCE_API_URL || 'https://wasgeurtje.nl/wp-json/wc/v3';
const CK = process.env.WOOCOMMERCE_CONSUMER_KEY!;
const CS = process.env.WOOCOMMERCE_CONSUMER_SECRET!;

function wcHeaders() {
  const token = Buffer.from(`${CK}:${CS}`).toString('base64');
  return {
    Authorization: `Basic ${token}`,
    'Content-Type': 'application/json',
  } as Record<string, string>;
}

interface LineItem {
  id: string;
  quantity: number;
}

interface Customer {
  customerId?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName?: string;
  vatNumber?: string;
  businessOrder: boolean;
  address: string;
  houseNumber: string;
  houseAddition?: string;
  city: string;
  postcode: string;
  useShippingAddress?: boolean;
  shippingAddress?: string;
  shippingHouseNumber?: string;
  shippingHouseAddition?: string;
  shippingCity?: string;
  shippingPostcode?: string;
}

interface AppliedDiscount {
  coupon_code: string;
  discount_type: string;
  discount_amount: number;
}

interface OrderTotals {
  subtotal: number;
  discountAmount: number;
  volumeDiscount: number;
  shippingCost: number;
  finalTotal: number;
}

export async function POST(request: NextRequest) {
  // DEBUG: 🔍 === WooCommerce Order Creation API START ===');
  // DEBUG: 🔍 Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    let requestBody;
    try {
      requestBody = await request.json();
      console.log('📥 RAW REQUEST BODY:', JSON.stringify(requestBody, null, 2));
    } catch (jsonError) {
      console.error('❌ Failed to parse request JSON:', jsonError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { 
      lineItems, 
      customer, 
      appliedDiscount, 
      totals,
      paymentIntentId 
    } = requestBody as {
      lineItems: LineItem[];
      customer: Customer;
      appliedDiscount?: AppliedDiscount;
      totals: OrderTotals;
      paymentIntentId: string;
    };

    // DEBUG: 📋 PARSED FIELDS:');
    console.log('  - lineItems:', lineItems);
    console.log('  - customer:', customer);
    console.log('  - appliedDiscount:', appliedDiscount);
    console.log('  - totals:', totals);
    console.log('  - paymentIntentId:', paymentIntentId);

    if (!lineItems || lineItems.length === 0) {
      console.error('❌ Validation failed: No line items');
      return NextResponse.json(
        { error: 'Geen producten in winkelwagen' },
        { status: 400 }
      );
    }

    if (!customer || !customer.email) {
      console.error('❌ Validation failed: No customer email', customer);
      return NextResponse.json(
        { error: 'E-mailadres is verplicht' },
        { status: 400 }
      );
    }

     if (!paymentIntentId) {
       console.error('❌ Validation failed: No payment intent ID');
       return NextResponse.json(
         { error: 'Payment Intent ID is verplicht' },
         { status: 400 }
       );
     }

     // Check if order already exists to prevent duplicates
     // DEBUG: 🔍 Checking for existing order with payment intent:', paymentIntentId);
     try {
       const existingResponse = await fetch(
         `${WC_API_URL}/orders?meta_key=_stripe_payment_intent_id&meta_value=${paymentIntentId}&per_page=1`,
         {
           method: 'GET',
           headers: wcHeaders(),
         }
       );
       
       if (existingResponse.ok) {
         const existingOrders = await existingResponse.json();
         if (existingOrders && existingOrders.length > 0) {
           const existingOrder = existingOrders[0];
           // DEBUG: ✅ Found existing order, returning it instead of creating duplicate:', existingOrder.id);
           
           return NextResponse.json({
             success: true,
             orderId: existingOrder.id,
             orderNumber: existingOrder.number,
             paymentIntentId: paymentIntentId,
             message: 'Existing order found (duplicate prevention)',
             order: {
               id: existingOrder.id,
               number: existingOrder.number,
               status: existingOrder.status,
               total: existingOrder.total,
               date_created: existingOrder.date_created,
             }
           });
         }
       }
     } catch (checkError) {
       console.log('⚠️ Could not check for existing orders, proceeding with creation:', checkError);
     }

    // Prepare line items for WooCommerce
    const wcLineItems = lineItems.map(item => ({
      product_id: parseInt(item.id),
      quantity: item.quantity,
    }));

    // Prepare billing address with safety checks
    const billingAddress = {
      first_name: customer.firstName || '',
      last_name: customer.lastName || '',
      company: customer.companyName || '',
      // Compose address consistently: street + house number + optional addition
      address_1: `${(customer.address || '').trim()} ${(`${customer.houseNumber || ''}${customer.houseAddition || ''}`).trim()}`.trim(),
      address_2: '',
      city: customer.city || '',
      state: '',
      postcode: customer.postcode || '',
      country: 'NL',
      email: customer.email || '',
      phone: customer.phone || '',
    };

    // Prepare shipping address (use billing if not different)
    const shippingAddress = customer.useShippingAddress ? {
      first_name: customer.firstName || '',
      last_name: customer.lastName || '',
      company: customer.companyName || '',
      address_1: `${(customer.shippingAddress || '').trim()} ${(`${customer.shippingHouseNumber || ''}${customer.shippingHouseAddition || ''}`).trim()}`.trim(),
      address_2: '',
      city: customer.shippingCity || '',
      state: '',
      postcode: customer.shippingPostcode || '',
      country: 'NL',
    } : billingAddress;

    // Prepare coupon lines if discount applied
    // Note: We'll handle coupon validation on the frontend, 
    // so we only add coupon lines if explicitly requested
    const couponLines = [];
    // Commented out for now to avoid invalid coupon errors
    // Will be handled by fee lines instead
    // if (appliedDiscount) {
    //   couponLines.push({
    //     code: appliedDiscount.coupon_code,
    //   });
    // }

    // Prepare fee lines for discounts
    const feeLines = [];
    
    // Add coupon discount as fee line
    if (appliedDiscount && totals.discountAmount > 0) {
      feeLines.push({
        name: `Kortingscode (${appliedDiscount.coupon_code})`,
        amount: (-totals.discountAmount).toString(),
      });
    }
    
    // Add volume discount
    if (totals.volumeDiscount > 0) {
      feeLines.push({
        name: 'Volume korting (10%)',
        amount: (-totals.volumeDiscount).toString(),
      });
    }

    // Prepare shipping lines
    const shippingLines = [];
    if (totals.shippingCost > 0) {
      shippingLines.push({
        method_id: 'flat_rate',
        method_title: 'Standaard verzending',
        total: totals.shippingCost.toString(),
      });
    } else {
      shippingLines.push({
        method_id: 'free_shipping',
        method_title: 'Gratis verzending',
        total: '0.00',
      });
    }

    // Create WooCommerce order
    const orderData = {
      payment_method: 'stripe',
      payment_method_title: 'Stripe (iDEAL/Card)',
      set_paid: true,
      transaction_id: paymentIntentId,
      billing: billingAddress,
      shipping: shippingAddress,
      line_items: wcLineItems,
      coupon_lines: couponLines,
      fee_lines: feeLines,
      shipping_lines: shippingLines,
      meta_data: [
        {
          key: '_stripe_payment_intent_id',
          value: paymentIntentId,
        },
        {
          key: '_business_order',
          value: customer.businessOrder ? 'yes' : 'no',
        },
        {
          key: '_vat_number',
          value: customer.vatNumber || '',
        },
        {
          key: '_order_created_via',
          value: 'stripe_direct_api',
        },
        {
          key: '_payment_completed_at',
          value: new Date().toISOString(),
        },
      ],
    };

    console.log('Creating WooCommerce order via direct API:', JSON.stringify(orderData, null, 2));

    const response = await fetch(`${WC_API_URL}/orders`, {
      method: 'POST',
      headers: {
        ...wcHeaders(),
        'Idempotency-Key': `direct-${paymentIntentId}`, // Prevent duplicate orders
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WooCommerce order creation failed:', response.status, errorText);
      
      return NextResponse.json(
        { 
          error: 'Fout bij het aanmaken van de bestelling',
          details: `WooCommerce API error: ${response.status}`,
          woocommerce_error: errorText 
        },
        { status: 500 }
      );
    }

    const order = await response.json();
    console.log('WooCommerce order created successfully:', order.id);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.number,
      paymentIntentId: paymentIntentId,
      message: 'Bestelling succesvol aangemaakt in WooCommerce',
      order: {
        id: order.id,
        number: order.number,
        status: order.status,
        total: order.total,
        date_created: order.date_created,
      }
    });

  } catch (error) {
    console.error('❌ CRITICAL ERROR in WooCommerce order creation:', error);
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error constructor:', error?.constructor?.name);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    // Ensure we always return a valid response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse = { 
      error: 'Er is een fout opgetreden bij het aanmaken van de bestelling',
      details: errorMessage,
      timestamp: new Date().toISOString()
    };
    
    console.log('❌ Sending error response:', errorResponse);
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
