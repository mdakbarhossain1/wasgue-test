import { NextRequest, NextResponse } from 'next/server';

// WooCommerce API credentials from environment variables
const WOOCOMMERCE_CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY!;
const WOOCOMMERCE_CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET!;

// Create WooCommerce authentication header
const getWooCommerceAuthHeader = () => {
  const authHeader = 'Basic ' + Buffer.from(`${WOOCOMMERCE_CONSUMER_KEY}:${WOOCOMMERCE_CONSUMER_SECRET}`).toString('base64');
  return authHeader;
};

interface CouponData {
  id: number;
  code: string;
  amount: string;
  discount_type: string;
  usage_count: number;
  usage_limit: number;
  date_expires: string | null;
  date_created: string;
  description: string;
  meta_data: Array<{
    key: string;
    value: string;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email parameter is required'
      }, { status: 400 });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format'
      }, { status: 400 });
    }
    
    // DEBUG: Fetching loyalty coupons for: ${email}`);
    
    // Fetch all coupons from WooCommerce
    const response = await fetch('https://wasgeurtje.nl/wp-json/wc/v3/coupons?per_page=100&orderby=date&order=desc', {
      headers: {
        'Authorization': getWooCommerceAuthHeader(),
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`DEBUG: WooCommerce API error: ${response.status} ${response.statusText}`);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch coupons from WooCommerce'
      }, { status: 500 });
    }
    
    const allCoupons: CouponData[] = await response.json();
    // DEBUG: Fetched ${allCoupons.length} total coupons`);
    
    // Filter loyalty coupons for this customer that are unused
    const customerLoyaltyCoupons = allCoupons.filter((coupon) => {
      // Check if it's a loyalty redemption coupon
      const isLoyaltyCoupon = coupon.meta_data?.some(meta => 
        meta.key === 'loyalty_redemption' && meta.value === 'true'
      );
      
      if (!isLoyaltyCoupon) return false;
      
      // Check if it belongs to this customer
      const isCustomerCoupon = coupon.meta_data?.some(meta => 
        meta.key === 'redeemed_by_email' && meta.value === email
      );
      
      if (!isCustomerCoupon) return false;
      
      // Check if it's unused (usage_count < usage_limit)
      const isUnused = coupon.usage_count < coupon.usage_limit;
      
      // Check if it's not expired
      const isNotExpired = !coupon.date_expires || new Date(coupon.date_expires) > new Date();
      
      return isUnused && isNotExpired;
    });
    
    // DEBUG: Found ${customerLoyaltyCoupons.length} unused loyalty coupons for ${email}`);
    
    // Transform coupons to our response format
    const transformedCoupons = customerLoyaltyCoupons.map(coupon => {
      const redemptionDate = coupon.meta_data?.find(meta => meta.key === 'redemption_date')?.value;
      
      return {
        id: coupon.id,
        code: coupon.code,
        discount_amount: parseFloat(coupon.amount),
        discount_type: coupon.discount_type,
        usage_count: coupon.usage_count,
        usage_limit: coupon.usage_limit,
        date_expires: coupon.date_expires,
        date_created: coupon.date_created,
        redemption_date: redemptionDate || coupon.date_created,
        description: coupon.description,
        is_used: coupon.usage_count >= coupon.usage_limit,
        is_expired: coupon.date_expires ? new Date(coupon.date_expires) <= new Date() : false,
        days_until_expiry: coupon.date_expires ? 
          Math.ceil((new Date(coupon.date_expires).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
          null
      };
    });
    
    // Sort by creation date (newest first)
    transformedCoupons.sort((a, b) => new Date(b.redemption_date).getTime() - new Date(a.redemption_date).getTime());
    
    return NextResponse.json({
      success: true,
      coupons: transformedCoupons,
      total_unused: transformedCoupons.length,
      total_discount_value: transformedCoupons.reduce((sum, coupon) => sum + coupon.discount_amount, 0)
    });
    
  } catch (error) {
    console.error('DEBUG: Error fetching customer coupons:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error while fetching coupons'
    }, { status: 500 });
  }
}

// DELETE method to remove/invalidate a coupon
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const couponId = searchParams.get('couponId');
    const email = searchParams.get('email');
    
    if (!couponId || !email) {
      return NextResponse.json({
        success: false,
        error: 'Coupon ID and email parameters are required'
      }, { status: 400 });
    }
    
    // DEBUG: Invalidating coupon ${couponId} for ${email}`);
    
    // Set usage limit to 0 to effectively disable the coupon
    const response = await fetch(`https://wasgeurtje.nl/wp-json/wc/v3/coupons/${couponId}`, {
      method: 'PUT',
      headers: {
        'Authorization': getWooCommerceAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        usage_limit: 0,
        description: 'Coupon invalidated by customer'
      })
    });
    
    if (!response.ok) {
      console.error(`DEBUG: Failed to invalidate coupon: ${response.status} ${response.statusText}`);
      return NextResponse.json({
        success: false,
        error: 'Failed to invalidate coupon'
      }, { status: 500 });
    }
    
    // DEBUG: Successfully invalidated coupon ${couponId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Coupon successfully invalidated'
    });
    
  } catch (error) {
    console.error('DEBUG: Error invalidating coupon:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error while invalidating coupon'
    }, { status: 500 });
  }
}
