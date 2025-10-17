import { NextRequest, NextResponse } from 'next/server';

const WC_API_URL = process.env.WOOCOMMERCE_API_URL || 'https://wasgeurtje.nl/wp-json/wc/v3';
const CK = process.env.WOOCOMMERCE_CONSUMER_KEY!;
const CS = process.env.WOOCOMMERCE_CONSUMER_SECRET!;

function wcHeaders() {
  // Basic auth header for WooCommerce REST API
  const token = Buffer.from(`${CK}:${CS}`).toString('base64');
  return {
    Authorization: `Basic ${token}`,
    'Content-Type': 'application/json',
  } as Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    const { coupon_code, subtotal } = await request.json();

    if (!coupon_code) {
      return NextResponse.json(
        { message: 'Coupon code is required' },
        { status: 400 }
      );
    }

    // Fetch coupon from WooCommerce
    const response = await fetch(
      `${WC_API_URL}/coupons?code=${encodeURIComponent(coupon_code)}`,
      {
        method: 'GET',
        headers: wcHeaders(),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { message: 'Failed to validate coupon' },
        { status: response.status }
      );
    }

    const coupons = await response.json();

    if (!coupons || coupons.length === 0) {
      return NextResponse.json(
        { message: 'Ongeldige kortingscode' },
        { status: 400 }
      );
    }

    const coupon = coupons[0];
    
    // Log coupon data for debugging
    console.log('Coupon data:', {
      code: coupon.code,
      amount: coupon.amount,
      discount_type: coupon.discount_type,
      minimum_amount: coupon.minimum_amount,
      maximum_amount: coupon.maximum_amount,
      status: coupon.status,
      usage_limit: coupon.usage_limit,
      usage_count: coupon.usage_count
    });

    // Check if coupon is valid
    if (coupon.status !== 'publish') {
      return NextResponse.json(
        { message: 'Deze kortingscode is niet actief' },
        { status: 400 }
      );
    }

    // Check expiry date
    if (coupon.date_expires && new Date(coupon.date_expires) < new Date()) {
      return NextResponse.json(
        { message: 'Deze kortingscode is verlopen' },
        { status: 400 }
      );
    }

    // Check minimum amount (only if minimum_amount is set and greater than 0)
    if (coupon.minimum_amount && parseFloat(coupon.minimum_amount) > 0 && subtotal < parseFloat(coupon.minimum_amount)) {
      return NextResponse.json(
        { message: `Minimum bestelbedrag voor deze kortingscode is €${coupon.minimum_amount}` },
        { status: 400 }
      );
    }

    // Check maximum amount (only if maximum_amount is set and greater than 0)
    if (coupon.maximum_amount && parseFloat(coupon.maximum_amount) > 0 && subtotal > parseFloat(coupon.maximum_amount)) {
      return NextResponse.json(
        { message: `Maximum bestelbedrag voor deze kortingscode is €${coupon.maximum_amount}` },
        { status: 400 }
      );
    }

    // Check usage limits
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return NextResponse.json(
        { message: 'Deze kortingscode is niet meer geldig' },
        { status: 400 }
      );
    }

    // Calculate discount amount
    let discount_amount = 0;
    
    if (coupon.discount_type === 'percent') {
      discount_amount = parseFloat(coupon.amount);
    } else if (coupon.discount_type === 'fixed_cart') {
      discount_amount = parseFloat(coupon.amount);
    } else if (coupon.discount_type === 'fixed_product') {
      // For fixed product discount, we'll treat it as a fixed cart discount for simplicity
      discount_amount = parseFloat(coupon.amount);
    }

    return NextResponse.json({
      success: true,
      coupon_code: coupon.code,
      discount_type: coupon.discount_type,
      discount_amount: discount_amount,
      description: coupon.description || `Kortingscode ${coupon.code} toegepast`
    });

  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json(
      { message: 'Er ging iets mis bij het valideren van de kortingscode' },
      { status: 500 }
    );
  }
}
