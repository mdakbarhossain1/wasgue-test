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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Fetch customer by email
    const customerResponse = await fetch(
      `${WOOCOMMERCE_API_URL}/customers?email=${encodeURIComponent(email)}`,
      {
        headers: {
          'Authorization': getWooCommerceAuthHeader(),
          'Content-Type': 'application/json'
        }
      }
    );

    if (!customerResponse.ok) {
      console.error('WooCommerce API error:', customerResponse.status, customerResponse.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch customer data' },
        { status: customerResponse.status }
      );
    }

    const customers = await customerResponse.json();

    if (!customers || customers.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customer = customers[0];

    return NextResponse.json({
      id: customer.id,
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      username: customer.username,
      billing: customer.billing,
      shipping: customer.shipping
    });
  } catch (error) {
    console.error('Customer fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
