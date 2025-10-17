// WooCommerce Coupon API utilities

const WOOCOMMERCE_API_URL = process.env.WOOCOMMERCE_API_URL || 'https://wasgeurtje.nl/wp-json/wc/v3';
const WOOCOMMERCE_CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY!;
const WOOCOMMERCE_CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET!;

// Create WooCommerce authentication header
const getWooCommerceAuthHeader = () => {
  const authHeader = 'Basic ' + btoa(`${WOOCOMMERCE_CONSUMER_KEY}:${WOOCOMMERCE_CONSUMER_SECRET}`);
  return authHeader;
};

export interface CouponData {
  code: string;
  discount_type: 'fixed_cart' | 'percent' | 'fixed_product' | 'percent_product';
  amount: string;
  individual_use: boolean;
  product_ids: number[];
  excluded_product_ids: number[];
  usage_limit: number;
  usage_limit_per_user: number;
  limit_usage_to_x_items: number | null;
  free_shipping: boolean;
  product_categories: number[];
  excluded_product_categories: number[];
  exclude_sale_items: boolean;
  minimum_amount: string;
  maximum_amount: string;
  email_restrictions: string[];
  used_by: string[];
  description: string;
  date_expires: string | null;
  usage_count: number;
  meta_data: Array<{
    key: string;
    value: string;
  }>;
}

/**
 * Generate a unique coupon code
 */
export const generateCouponCode = (email: string): string => {
  const timestamp = Date.now().toString();
  const emailHash = btoa(email).substring(0, 6).toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  
  return `LOYALTY-${emailHash}-${randomSuffix}`;
};

/**
 * Create a new WooCommerce coupon for loyalty point redemption
 */
export const createLoyaltyCoupon = async (
  customerEmail: string, 
  discountAmount: number
): Promise<{success: boolean; coupon_code?: string; error?: string}> => {
  try {
    console.log('===== CREATING LOYALTY COUPON =====');
    // DEBUG: Creating coupon for ${customerEmail}, amount: €${discountAmount}`);
    
    const couponCode = generateCouponCode(customerEmail);
    
    // Calculate expiry date (30 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    const expiryISO = expiryDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const couponData: Partial<CouponData> = {
      code: couponCode,
      discount_type: 'fixed_cart',
      amount: discountAmount.toString(),
      individual_use: true,
      usage_limit: 1,
      usage_limit_per_user: 1,
      free_shipping: false,
      exclude_sale_items: false,
      minimum_amount: '0',
      maximum_amount: '',
      email_restrictions: [customerEmail],
      description: `Loyalty points redemption coupon for ${customerEmail}`,
      date_expires: expiryISO,
      meta_data: [
        {
          key: 'loyalty_redemption',
          value: 'true'
        },
        {
          key: 'redeemed_by_email',
          value: customerEmail
        },
        {
          key: 'redemption_date',
          value: new Date().toISOString()
        }
      ]
    };
    
    // DEBUG: Coupon data:`, JSON.stringify(couponData, null, 2));
    
    const response = await fetch(`${WOOCOMMERCE_API_URL}/coupons`, {
      method: 'POST',
      headers: {
        'Authorization': getWooCommerceAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(couponData)
    });
    
    // DEBUG: WooCommerce coupon creation response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('DEBUG: Coupon creation error:', errorData);
      
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}: ${response.statusText}`
      };
    }
    
    const createdCoupon = await response.json();
    // DEBUG: Coupon created successfully:', createdCoupon);
    
    return {
      success: true,
      coupon_code: createdCoupon.code
    };
    
  } catch (error) {
    console.error('DEBUG: Error creating loyalty coupon:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Validate if a coupon exists and is valid
 */
export const validateCoupon = async (couponCode: string): Promise<{valid: boolean; coupon?: any; error?: string}> => {
  try {
    // DEBUG: Validating coupon: ${couponCode}`);
    
    const response = await fetch(`${WOOCOMMERCE_API_URL}/coupons?code=${encodeURIComponent(couponCode)}`, {
      headers: {
        'Authorization': getWooCommerceAuthHeader(),
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return {
        valid: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
    
    const coupons = await response.json();
    
    if (!coupons || coupons.length === 0) {
      return {
        valid: false,
        error: 'Coupon not found'
      };
    }
    
    const coupon = coupons[0];
    
    // Check if coupon is still valid
    const now = new Date();
    const expiryDate = coupon.date_expires ? new Date(coupon.date_expires) : null;
    
    if (expiryDate && now > expiryDate) {
      return {
        valid: false,
        error: 'Coupon has expired'
      };
    }
    
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return {
        valid: false,
        error: 'Coupon usage limit reached'
      };
    }
    
    return {
      valid: true,
      coupon: coupon
    };
    
  } catch (error) {
    console.error('DEBUG: Error validating coupon:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Get all loyalty coupons for a specific customer
 */
export const getCustomerLoyaltyCoupons = async (customerEmail: string): Promise<{success: boolean; coupons?: any[]; error?: string}> => {
  try {
    // DEBUG: Fetching loyalty coupons for: ${customerEmail}`);
    
    const response = await fetch(`${WOOCOMMERCE_API_URL}/coupons?email=${encodeURIComponent(customerEmail)}&per_page=50`, {
      headers: {
        'Authorization': getWooCommerceAuthHeader(),
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
    
    const allCoupons = await response.json();
    
    // Filter only loyalty redemption coupons
    const loyaltyCoupons = allCoupons.filter((coupon: any) => {
      return coupon.meta_data?.some((meta: any) => 
        meta.key === 'loyalty_redemption' && meta.value === 'true'
      );
    });
    
    return {
      success: true,
      coupons: loyaltyCoupons
    };
    
  } catch (error) {
    console.error('DEBUG: Error fetching customer loyalty coupons:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

