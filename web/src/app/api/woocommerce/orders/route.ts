import { NextRequest, NextResponse } from 'next/server';

const WOOCOMMERCE_API_URL = process.env.WOOCOMMERCE_API_URL || 'https://wasgeurtje.nl/wp-json/wc/v3';
const WOOCOMMERCE_CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY!;
const WOOCOMMERCE_CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();

    // Create Basic Auth header (Node-safe)
    const authHeader = 'Basic ' + Buffer.from(`${WOOCOMMERCE_CONSUMER_KEY}:${WOOCOMMERCE_CONSUMER_SECRET}`).toString('base64');

    // Create order in WooCommerce
    const response = await fetch(`${WOOCOMMERCE_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(orderData)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('WooCommerce order creation failed:', responseData);
      return NextResponse.json(
        { error: responseData.message || 'Failed to create order' },
        { status: response.status }
      );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
