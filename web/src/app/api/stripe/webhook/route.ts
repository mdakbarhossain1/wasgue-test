import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe
function initializeStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not configured');
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-08-27.basil',
  });
}

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
  country: string;
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

async function createWooCommerceOrder(
  paymentIntentId: string,
  lineItems: LineItem[],
  customer: Customer,
  appliedDiscount?: AppliedDiscount,
  totals?: {
    subtotal: number;
    discountAmount: number;
    volumeDiscount: number;
    shippingCost: number;
    finalTotal: number;
  }
) {
  try {
    // Prepare line items for WooCommerce
    const wcLineItems = lineItems.map(item => ({
      product_id: parseInt(item.id),
      quantity: item.quantity,
    }));

    // Prepare billing address
    const billingAddress = {
      first_name: customer.firstName,
      last_name: customer.lastName,
      company: customer.companyName || '',
      address_1: `${(customer.address || '').trim()} ${(`${customer.houseNumber || ''}${customer.houseAddition || ''}`).trim()}`.trim(),
      address_2: '',
      city: customer.city,
      state: '',
      postcode: customer.postcode,
      country: customer.country,
      email: customer.email,
      phone: customer.phone,
    };

    // Prepare shipping address (use billing if not different)
    const shippingAddress = customer.useShippingAddress ? {
      first_name: customer.firstName,
      last_name: customer.lastName,
      company: customer.companyName || '',
      address_1: `${(customer.shippingAddress || '').trim()} ${(`${customer.shippingHouseNumber || ''}${customer.shippingHouseAddition || ''}`).trim()}`.trim(),
      address_2: '',
      city: customer.shippingCity,
      state: '',
      postcode: customer.shippingPostcode,
      country: customer.country,
    } : billingAddress;

    // Prepare coupon lines if discount applied
    const couponLines = [];
    
    // Prepare fee lines for other discounts
    const feeLines = [];
    
    if (appliedDiscount) {
      // Add all coupons (including loyalty) as regular coupon lines
      couponLines.push({
        code: appliedDiscount.coupon_code,
      });
    }

    // Add volume discount if applicable
    if (totals && totals.volumeDiscount > 0) {
      feeLines.push({
        name: 'Volume korting (10%)',
        total: (-totals.volumeDiscount).toString(),
      });
    }

    // Prepare shipping lines
    const shippingLines = [];
    if (totals && totals.shippingCost > 0) {
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
      payment_method_title: 'Stripe',
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
      ],
    };


    const response = await fetch(`${WC_API_URL}/orders`, {
      method: 'POST',
      headers: {
        ...wcHeaders(),
        'Idempotency-Key': `woo-${paymentIntentId}`, // Prevent duplicate orders
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WooCommerce order creation failed:', response.status, errorText);
      throw new Error(`WooCommerce API error: ${response.status} - ${errorText}`);
    }

    const order = await response.json();

    return order;

  } catch (error) {
    console.error('Error creating WooCommerce order:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    const stripe = initializeStripe();
    
    // Get the raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }


    // Handle payment_intent.succeeded event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;


      try {
        // Extract metadata
        const metadata = paymentIntent.metadata;
        
        if (!metadata.cart || !metadata.customer_data) {
          console.error('Missing required metadata in PaymentIntent');
          return NextResponse.json(
            { error: 'Missing order data' },
            { status: 400 }
          );
        }

        const lineItems: LineItem[] = JSON.parse(metadata.cart);
        const customer: Customer = JSON.parse(metadata.customer_data);
        const appliedDiscount: AppliedDiscount | undefined = metadata.applied_discount 
          ? JSON.parse(metadata.applied_discount) 
          : undefined;


        // Parse totals from metadata
        const totals = {
          subtotal: parseFloat(metadata.subtotal || '0'),
          discountAmount: parseFloat(metadata.discount_amount || '0'),
          volumeDiscount: parseFloat(metadata.volume_discount || '0'),
          shippingCost: parseFloat(metadata.shipping_cost || '0'),
          finalTotal: parseFloat(metadata.final_total || '0'),
        };

        // Create WooCommerce order
        const order = await createWooCommerceOrder(
          paymentIntent.id,
          lineItems,
          customer,
          appliedDiscount,
          totals
        );

        // Order processing completed successfully - paymentIntentId, wooCommerceOrderId

        return NextResponse.json({
          success: true,
          orderId: order.id,
          paymentIntentId: paymentIntent.id,
        });

      } catch (error) {
        console.error('Error processing payment webhook:', error);
        
        // Return 200 to acknowledge webhook receipt even if order creation fails
        // This prevents Stripe from retrying the webhook
        return NextResponse.json({
          success: false,
          error: 'Order creation failed',
          paymentIntentId: paymentIntent.id,
        });
      }
    }

    // Handle other event types if needed
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
