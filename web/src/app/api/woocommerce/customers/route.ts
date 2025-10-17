import { NextRequest, NextResponse } from 'next/server';

const WOOCOMMERCE_API_URL = 'https://wasgeurtje.nl/wp-json/wc/v3';
const WOOCOMMERCE_CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY!;
const WOOCOMMERCE_CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET!;

// Create WooCommerce authentication header
const getWooCommerceAuthHeader = () => {
  if (!WOOCOMMERCE_CONSUMER_KEY || !WOOCOMMERCE_CONSUMER_SECRET) {
    throw new Error('WooCommerce API credentials are not configured');
  }
  
  const authHeader = 'Basic ' + Buffer.from(`${WOOCOMMERCE_CONSUMER_KEY}:${WOOCOMMERCE_CONSUMER_SECRET}`).toString('base64');
  return authHeader;
};

// Create a new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Create customer via WooCommerce API
    const response = await fetch(`${WOOCOMMERCE_API_URL}/customers`, {
      method: 'POST',
      headers: {
        'Authorization': getWooCommerceAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WooCommerce API error:', response.status, errorText);
      
      // Parse error message
      try {
        const error = JSON.parse(errorText);
        return NextResponse.json(
          { error: error.message || 'Failed to create customer' },
          { status: response.status }
        );
      } catch {
        return NextResponse.json(
          { error: 'Failed to create customer' },
          { status: response.status }
        );
      }
    }

    const customer = await response.json();
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Create customer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

