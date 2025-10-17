import { NextRequest, NextResponse } from 'next/server';

// WooCommerce credentials - configure these in your .env.local file
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent');

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment Intent ID is required' },
        { status: 400 }
      );
    }

    // DEBUG: 🔍 Searching for orders with payment intent:', paymentIntentId);

    // Search for orders with the payment intent ID in meta data
    const response = await fetch(
      `${WC_API_URL}/orders?meta_key=_stripe_payment_intent_id&meta_value=${paymentIntentId}&per_page=10`,
      {
        method: 'GET',
        headers: wcHeaders(),
      }
    );

    if (!response.ok) {
      console.error('WooCommerce search failed:', response.status, await response.text());
      return NextResponse.json(
        { error: 'Failed to search orders' },
        { status: 500 }
      );
    }

    const orders = await response.json();
    // DEBUG: 📋 Found ${orders.length} orders for payment intent ${paymentIntentId}`);

    return NextResponse.json(orders);

  } catch (error) {
    console.error('Error searching orders:', error);
    return NextResponse.json(
      { error: 'Error searching orders' },
      { status: 500 }
    );
  }
}

