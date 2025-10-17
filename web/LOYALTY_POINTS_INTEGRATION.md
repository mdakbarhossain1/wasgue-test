# Loyalty Points Integration

## Overview
The loyalty points system has been updated to use the new endpoint `https://wasgeurtje.nl/wp-json/my/v1/loyalty/points?email=` for fetching user loyalty data.

## Endpoint Details

### URL
```
https://wasgeurtje.nl/wp-json/my/v1/loyalty/points?email={email}
```

### Method
`GET`

### Parameters
- `email` (required): The user's email address

### Response Structure
```json
{
  "email": "user@example.com",
  "points": 172,
  "used": 0,
  "earned": 188
}
```

## Implementation Changes

### 1. New Function: `fetchLoyaltyPointsByEmail`
Located in `web/src/utils/auth-api.ts`

This function directly fetches loyalty points using a user's email address:
- Makes HTTP GET request to the loyalty endpoint
- Transforms response to match our `LoyaltyData` interface
- Calculates `rewardsAvailable` as `Math.floor(points / 100)`
- Handles errors gracefully by returning default values

### 2. Updated AuthContext
Located in `web/src/context/AuthContext.tsx`

#### Changes:
- Added `fetchLoyaltyPointsByUserEmail` function to context interface
- Updated `fetchLoyaltyPointsForUser` to prefer email-based endpoint when user email is available
- Modified login flow to immediately fetch loyalty points using email during authentication
- Added `role` property to User interface

#### New Methods:
- `fetchLoyaltyPointsByUserEmail(email?: string)`: Directly fetches loyalty points by email

### 3. Fallback System
The implementation includes a robust fallback system:

1. **Primary**: Use email-based endpoint when user email is available
2. **Secondary**: Fallback to customer ID-based fetch from WooCommerce
3. **Tertiary**: Use hardcoded mapping from `wp-loyalty-api.ts`

### 4. Admin User Handling
All users including admin now use real endpoint data:
- Removed hardcoded loyalty data for admin account
- Admin user `jackwullems18@gmail.com` now shows real-time data from endpoint
- Maintains referral codes through fallback mapping system

## Data Mapping

### Endpoint Response → LoyaltyData Interface

```typescript
{
  points: data.points || 0,              // Current available points
  total_earned: data.earned || 0,        // Total earned points
  rewards_available: Math.floor((data.points || 0) / 100), // Calculated rewards
  refer_code: data.refer_code || '',     // Not provided by endpoint
  level_id: data.level_id || '0'         // Not provided by endpoint
}
```

## Testing

### Test Commands
```bash
# Test with known email addresses
curl "https://wasgeurtje.nl/wp-json/my/v1/loyalty/points?email=info@wasgeurtje.nl"
curl "https://wasgeurtje.nl/wp-json/my/v1/loyalty/points?email=snoopysaskia@hotmail.com"
curl "https://wasgeurtje.nl/wp-json/my/v1/loyalty/points?email=jessapon71@gmail.com"
```

### Expected Results
All endpoints should return status 200 with JSON response containing:
- `email`: The queried email address
- `points`: Current available points
- `used`: Points used 
- `earned`: Total points earned

#### Example Response for Admin User:
```json
{
  "email": "jackwullems18@gmail.com",
  "points": 8142,
  "used": 960,
  "earned": 9162
}
```

This shows the admin user now gets real-time data: **8142 points** instead of the previous hardcoded 7480.

## Benefits

1. **Real-time Data**: Direct API calls ensure fresh loyalty data
2. **Simplified Architecture**: Email-based lookup is more straightforward
3. **Improved Performance**: Direct endpoint calls reduce data processing overhead
4. **Better Error Handling**: Graceful fallbacks ensure system reliability
5. **Scalability**: Endpoint can handle any user email without pre-configuration

## Future Enhancements

1. **Caching**: Implement client-side caching for loyalty data
2. **Real-time Updates**: Add WebSocket support for live loyalty point updates
3. **Refer Code Integration**: Enhance endpoint to return refer codes
4. **Level System**: Integrate user level data from the loyalty system
