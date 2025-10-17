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
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID parameter is required' },
        { status: 400 }
      );
    }

    // Fetch orders for customer
    const ordersUrl = `${WOOCOMMERCE_API_URL}/orders?customer=${customerId}&per_page=50&orderby=date&order=desc`;
    
    const ordersResponse = await fetch(ordersUrl, {
      headers: {
        'Authorization': getWooCommerceAuthHeader(),
        'Content-Type': 'application/json'
      }
    });

    if (!ordersResponse.ok) {
      console.error('WooCommerce API error:', ordersResponse.status, ordersResponse.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: ordersResponse.status }
      );
    }

    const orders = await ordersResponse.json();

    // Process orders to ensure all required fields are present
    const processedOrders = orders.map((order: any) => {
      // Ensure shipping data exists
      if (!order.shipping) order.shipping = {};
      const shippingDefaults = {
        first_name: '',
        last_name: '',
        address_1: '',
        address_2: '',
        city: '',
        postcode: '',
        country: 'NL'
      };
      order.shipping = { ...shippingDefaults, ...order.shipping };

      // Process line items to ensure images are available
      if (order.line_items) {
        order.line_items = order.line_items.map((item: any) => {
          if (item.image && typeof item.image === 'string') {
            item.image = { src: item.image };
          }
          return item;
        });
      }

      return order;
    });

    return NextResponse.json(processedOrders);
  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

