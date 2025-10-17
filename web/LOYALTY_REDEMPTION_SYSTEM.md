# Loyalty Points Redemption System

## Overview
Complete implementation of a secure loyalty points redemption system with atomic transactions, coupon generation, and race condition protection.

## System Requirements
- **Minimum Points**: 60 points required for redemption
- **Discount Value**: €13 discount per 60 points redeemed
- **Exchange Rate**: 1 point = 1 euro spent
- **Coupon Validity**: 30 days from creation
- **Usage Limit**: One-time use per coupon

## Architecture

### Frontend Layer (Next.js)
```
User Interface → AuthContext → API Route → WordPress Endpoint
```

### API Flow
1. **Frontend**: User clicks "Wissel In" button
2. **Next.js API**: `/api/loyalty/redeem` validates and processes request
3. **WordPress**: `/wp-json/my/v1/loyalty/redeem` performs atomic transaction
4. **WooCommerce**: Creates secure coupon with restrictions
5. **Response**: Returns coupon code to user

## Security Features

### Atomic Transactions
```sql
UPDATE wp_wlr_users 
SET points = points - 60 
WHERE email = ? AND points >= 60
```
- Prevents double-spending
- Race condition protection
- Rollback on coupon creation failure

### Coupon Security
- **Email Restriction**: Coupon only usable by redemption email
- **Single Use**: `usage_limit: 1`
- **Time Limited**: 30-day expiration
- **Individual Use**: Cannot be combined with other coupons
- **Metadata Tracking**: Full audit trail

## Implementation Details

### 1. Next.js API Route (`/api/loyalty/redeem`)

**File**: `web/src/app/api/loyalty/redeem/route.ts`

#### POST Method - Point Redemption
```typescript
interface RedeemRequest {
  email: string;
  points: number;
}

interface RedeemResponse {
  success: boolean;
  message: string;
  coupon_code?: string;
  discount_amount?: number;
  remaining_points?: number;
  error?: string;
}
```

**Validation Steps**:
1. Email format validation
2. Minimum 60 points check
3. User authentication
4. Server-to-server call to WordPress

#### GET Method - Eligibility Check
Returns current redemption eligibility:
```typescript
{
  success: boolean;
  current_points: number;
  required_points: 60;
  discount_amount: 13;
  eligible: boolean;
  can_redeem_times: number;
}
```

### 2. AuthContext Integration

**File**: `web/src/context/AuthContext.tsx`

#### New Methods Added:
- `redeemPoints()`: Handles point redemption flow
- `checkRedeemEligibility()`: Validates redemption eligibility

#### Features:
- Real-time point updates after redemption
- Loading states and error handling
- Automatic eligibility refresh

### 3. React Component (`LoyaltyRedemption`)

**File**: `web/src/components/LoyaltyRedemption.tsx`

#### Features:
- Real-time eligibility checking
- Loading and error states
- Coupon code display
- Success/failure feedback
- Responsive design

#### Props:
```typescript
interface LoyaltyRedemptionProps {
  className?: string;
  onSuccess?: (couponCode: string, discountAmount: number) => void;
}
```

### 4. Coupon Management

**File**: `web/src/utils/coupon-api.ts`

#### Functions:
- `createLoyaltyCoupon()`: Creates WooCommerce coupon
- `validateCoupon()`: Validates coupon status
- `getCustomerLoyaltyCoupons()`: Retrieves customer's loyalty coupons
- `generateCouponCode()`: Creates unique coupon codes

#### Coupon Structure:
```typescript
{
  code: "LOYALTY-ABC123-XYZ",
  discount_type: "fixed_cart",
  amount: "13",
  individual_use: true,
  usage_limit: 1,
  email_restrictions: ["customer@email.com"],
  date_expires: "2024-01-31",
  meta_data: [
    { key: "loyalty_redemption", value: "true" },
    { key: "redeemed_by_email", value: "customer@email.com" },
    { key: "redemption_date", value: "2024-01-01T12:00:00Z" }
  ]
}
```

## WordPress Endpoint Requirements

### Endpoint: `/wp-json/my/v1/loyalty/redeem`

**Method**: POST

**Request Body**:
```json
{
  "email": "customer@example.com",
  "points_to_redeem": 60,
  "discount_amount": 13
}
```

**Required WordPress Implementation**:
```php
// Atomic points deduction
$wpdb->query($wpdb->prepare(
    "UPDATE wp_wlr_users 
     SET points = points - %d 
     WHERE email = %s AND points >= %d",
    $points_to_redeem,
    $email,
    $points_to_redeem
));

// Check if points were actually deducted
if ($wpdb->rows_affected === 0) {
    return new WP_Error('insufficient_points', 'Insufficient points or user not found');
}

// Create WooCommerce coupon
$coupon_code = create_loyalty_coupon($email, $discount_amount);

// Rollback on coupon failure
if (!$coupon_code) {
    $wpdb->query($wpdb->prepare(
        "UPDATE wp_wlr_users 
         SET points = points + %d 
         WHERE email = %s",
        $points_to_redeem,
        $email
    ));
    return new WP_Error('coupon_creation_failed', 'Failed to create coupon');
}
```

**Success Response**:
```json
{
  "success": true,
  "message": "Points successfully redeemed",
  "coupon_code": "LOYALTY-ABC123-XYZ",
  "discount_amount": 13,
  "remaining_points": 82
}
```

## Usage Examples

### Basic Implementation
```tsx
import LoyaltyRedemption from '@/components/LoyaltyRedemption';

export default function MyAccountPage() {
  const handleSuccess = (couponCode: string, amount: number) => {
    alert(`Coupon ${couponCode} created for €${amount} discount!`);
  };

  return (
    <div>
      <h1>My Account</h1>
      <LoyaltyRedemption 
        onSuccess={handleSuccess}
        className="max-w-md"
      />
    </div>
  );
}
```

### Manual Redemption
```tsx
import { useAuth } from '@/context/AuthContext';

export default function CustomRedemption() {
  const { redeemPoints, checkRedeemEligibility } = useAuth();

  const handleRedeem = async () => {
    const eligibility = await checkRedeemEligibility();
    
    if (!eligibility.eligible) {
      alert('Not enough points');
      return;
    }

    const result = await redeemPoints();
    
    if (result.success) {
      console.log('Coupon code:', result.coupon_code);
    } else {
      console.error('Error:', result.error);
    }
  };

  return (
    <button onClick={handleRedeem}>
      Redeem Points
    </button>
  );
}
```

## Error Handling

### Common Error Scenarios:
1. **Insufficient Points**: User has < 60 points
2. **Network Errors**: API unavailable
3. **Database Errors**: Points deduction fails
4. **Coupon Creation**: WooCommerce API fails
5. **Race Conditions**: Concurrent redemption attempts

### Error Responses:
```typescript
{
  success: false,
  error: "Minimum 60 points required for redemption"
}

{
  success: false,
  error: "Failed to create coupon - points have been restored"
}
```

## Testing

### Test Endpoints:
```bash
# Check eligibility
curl "http://localhost:3000/api/loyalty/redeem?email=test@example.com"

# Redeem points
curl -X POST "http://localhost:3000/api/loyalty/redeem" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","points":60}'
```

### Test Scenarios:
1. ✅ User with 60+ points can redeem
2. ✅ User with < 60 points cannot redeem
3. ✅ Concurrent redemption attempts handled safely
4. ✅ Coupon created with correct restrictions
5. ✅ Points properly deducted from account
6. ✅ Error rollback works correctly

## Security Considerations

1. **Server-Side Processing**: All critical operations on server
2. **Input Validation**: Email format and point validation
3. **Rate Limiting**: Prevent abuse (TODO: implement)
4. **Audit Trail**: Complete transaction logging
5. **Rollback Mechanisms**: Automatic point restoration on failures

## Future Enhancements

1. **Multiple Redemption Tiers**: Different point amounts for different discounts
2. **Product-Specific Coupons**: Redemption for specific product categories
3. **Bulk Redemption**: Allow multiple redemptions in one transaction
4. **Redemption History**: Track all user redemptions
5. **Email Notifications**: Send coupon via email
6. **Mobile App Integration**: API-first design for mobile apps

