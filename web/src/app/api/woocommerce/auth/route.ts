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

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // First, fetch customer by email
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
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    const customers = await customerResponse.json();

    if (!customers || customers.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const customer = customers[0];

    // Note: WooCommerce doesn't provide a way to verify passwords via API
    // In a real implementation, you would need to:
    // 1. Use WordPress JWT authentication
    // 2. Or implement a custom WordPress plugin
    // 3. Or use WooCommerce's built-in authentication endpoints
    
    // For now, we'll return the customer data if the email exists
    // This is NOT secure for production!
    
    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        username: customer.username,
        billing: customer.billing,
        shipping: customer.shipping
      },
      // You should generate a proper JWT token here
      token: 'temporary-token-' + customer.id
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

