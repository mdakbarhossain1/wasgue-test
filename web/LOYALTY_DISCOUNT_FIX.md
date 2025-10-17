# Loyalty Discount Order Creation Fix

## Problem
When applying a loyalty discount code (e.g., `loyalty-amfja3-oy2`) during checkout, the order creation failed with a 500 Internal Server Error. The issue occurred because:

1. **Data structure mismatch**: The checkout page sent discount data with fields `code`, `amount`, and `type`, but the API expected `coupon_code`, `discount_type`, and `discount_amount`.

2. **Loyalty coupon reuse**: The webhook handler tried to apply the loyalty coupon code again in WooCommerce, but these codes are single-use and were already marked as used, causing the order creation to fail.

## Solution

### 1. Fixed Data Structure in Checkout (checkout/page.tsx)
- Converted the `appliedDiscount` object to the correct API format before sending to create-intent
- Maps `code` → `coupon_code`, `type` → `discount_type`, and calculates the actual discount amount

### 2. Updated Webhook Handler (api/stripe/webhook/route.ts)
- Detects loyalty discounts by checking if the coupon code starts with "loyalty-"
- Instead of applying them as coupon codes (which would fail), adds them as negative fee lines
- This ensures the discount is applied to the order without trying to reuse an already-used coupon code

### 3. Benefits
- Loyalty discounts now work correctly during checkout
- Order totals are accurate and include the discount
- No more 500 errors when completing orders with loyalty discounts
- The discount is properly recorded in WooCommerce as a fee line

## Testing
Run the test script to validate the fix:
```bash
cd web
node test-loyalty-discount-order.mjs
```

## Code Changes

### checkout/page.tsx
```javascript
// Convert appliedDiscount to API format
const apiDiscount = appliedDiscount ? {
  coupon_code: appliedDiscount.code,
  discount_type: appliedDiscount.type === 'percentage' ? 'percent' : 'fixed_cart',
  discount_amount: calculateDiscount() // Use calculated discount amount
} : undefined;
```

### api/stripe/webhook/route.ts
```javascript
if (appliedDiscount) {
  // Check if this is a loyalty discount
  if (appliedDiscount.coupon_code.startsWith('loyalty-')) {
    // Add loyalty discount as a fee line (negative amount)
    feeLines.push({
      name: `Loyalty korting (${appliedDiscount.coupon_code})`,
      amount: (-appliedDiscount.discount_amount).toString(),
    });
  } else {
    // Regular coupon, add to coupon lines
    couponLines.push({
      code: appliedDiscount.coupon_code,
    });
  }
}
```

This fix ensures that loyalty discounts are properly handled throughout the entire checkout and order creation process.

