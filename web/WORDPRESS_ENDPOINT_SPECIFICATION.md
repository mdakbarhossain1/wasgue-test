# WordPress Endpoint Specification

## Required WordPress REST Endpoint Implementation

### Endpoint: `/wp-json/my/v1/loyalty/redeem`

This endpoint needs to be implemented in WordPress to handle the server-side loyalty points redemption with atomic transactions.

## PHP Implementation Required

### File Location
`/wp-content/themes/your-theme/functions.php` or a custom plugin

### Complete Implementation

```php
<?php
/**
 * Loyalty Points Redemption Endpoint
 * Handles atomic point deduction and coupon creation
 */

// Register the REST endpoint
add_action('rest_api_init', function () {
    register_rest_route('my/v1', '/loyalty/redeem', array(
        'methods' => 'POST',
        'callback' => 'handle_loyalty_redemption',
        'permission_callback' => '__return_true', // Add proper authentication as needed
    ));
});

/**
 * Handle loyalty points redemption
 */
function handle_loyalty_redemption($request) {
    global $wpdb;
    
    // Get request parameters
    $email = sanitize_email($request->get_param('email'));
    $points_to_redeem = intval($request->get_param('points_to_redeem'));
    $discount_amount = floatval($request->get_param('discount_amount'));
    
    // Validation
    if (empty($email) || !is_email($email)) {
        return new WP_Error('invalid_email', 'Valid email address required', array('status' => 400));
    }
    
    if ($points_to_redeem < 60) {
        return new WP_Error('insufficient_points_request', 'Minimum 60 points required', array('status' => 400));
    }
    
    if ($discount_amount <= 0) {
        return new WP_Error('invalid_discount', 'Valid discount amount required', array('status' => 400));
    }
    
    // Start transaction (for InnoDB tables)
    $wpdb->query('START TRANSACTION');
    
    try {
        // Atomic points deduction
        $table_name = $wpdb->prefix . 'wlr_users';
        
        // Check if table exists
        if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") !== $table_name) {
            throw new Exception('Loyalty points table not found');
        }
        
        // Atomic UPDATE - only deduct if user has enough points
        $result = $wpdb->query($wpdb->prepare(
            "UPDATE $table_name 
             SET points = points - %d 
             WHERE email = %s AND points >= %d",
            $points_to_redeem,
            $email,
            $points_to_redeem
        ));
        
        // Check if any rows were affected (i.e., user had enough points)
        if ($wpdb->rows_affected === 0) {
            throw new Exception('Insufficient points or user not found');
        }
        
        // Get remaining points
        $remaining_points = $wpdb->get_var($wpdb->prepare(
            "SELECT points FROM $table_name WHERE email = %s",
            $email
        ));
        
        if ($remaining_points === null) {
            throw new Exception('User not found after point deduction');
        }
        
        // Create WooCommerce coupon
        $coupon_result = create_loyalty_coupon($email, $discount_amount);
        
        if (!$coupon_result['success']) {
            throw new Exception($coupon_result['error'] ?? 'Failed to create coupon');
        }
        
        // Commit transaction
        $wpdb->query('COMMIT');
        
        // Log successful redemption
        error_log("Loyalty redemption successful: $email redeemed $points_to_redeem points for coupon " . $coupon_result['coupon_code']);
        
        // Return success response
        return rest_ensure_response(array(
            'success' => true,
            'message' => 'Points successfully redeemed',
            'coupon_code' => $coupon_result['coupon_code'],
            'discount_amount' => $discount_amount,
            'remaining_points' => intval($remaining_points),
            'redeemed_points' => $points_to_redeem
        ));
        
    } catch (Exception $e) {
        // Rollback transaction on any error
        $wpdb->query('ROLLBACK');
        
        error_log("Loyalty redemption failed: " . $e->getMessage());
        
        return new WP_Error(
            'redemption_failed', 
            $e->getMessage(), 
            array('status' => 400)
        );
    }
}

/**
 * Create WooCommerce loyalty coupon
 */
function create_loyalty_coupon($customer_email, $discount_amount) {
    try {
        // Generate unique coupon code
        $timestamp = time();
        $email_hash = strtoupper(substr(base64_encode($customer_email), 0, 6));
        $random_suffix = strtoupper(substr(str_shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 0, 3));
        $coupon_code = "LOYALTY-{$email_hash}-{$random_suffix}";
        
        // Calculate expiry date (30 days from now)
        $expiry_date = date('Y-m-d', strtotime('+30 days'));
        
        // Create coupon post
        $coupon_post = array(
            'post_title' => $coupon_code,
            'post_content' => '',
            'post_status' => 'publish',
            'post_author' => 1,
            'post_type' => 'shop_coupon',
            'post_excerpt' => "Loyalty points redemption coupon for {$customer_email}"
        );
        
        $coupon_id = wp_insert_post($coupon_post);
        
        if (is_wp_error($coupon_id) || !$coupon_id) {
            throw new Exception('Failed to create coupon post');
        }
        
        // Set coupon meta data
        $coupon_meta = array(
            'discount_type' => 'fixed_cart',
            'coupon_amount' => $discount_amount,
            'individual_use' => 'yes',
            'product_ids' => '',
            'exclude_product_ids' => '',
            'usage_limit' => '1',
            'usage_limit_per_user' => '1',
            'limit_usage_to_x_items' => '',
            'free_shipping' => 'no',
            'product_categories' => array(),
            'excluded_product_categories' => array(),
            'exclude_sale_items' => 'no',
            'minimum_amount' => '',
            'maximum_amount' => '',
            'customer_email' => array($customer_email),
            'expiry_date' => $expiry_date,
            'usage_count' => '0',
            
            // Custom meta for tracking
            '_loyalty_redemption' => 'true',
            '_redeemed_by_email' => $customer_email,
            '_redemption_date' => current_time('mysql'),
            '_redemption_timestamp' => time()
        );
        
        // Update all meta fields
        foreach ($coupon_meta as $key => $value) {
            update_post_meta($coupon_id, $key, $value);
        }
        
        // Log coupon creation
        error_log("Loyalty coupon created: {$coupon_code} for {$customer_email} (€{$discount_amount})");
        
        return array(
            'success' => true,
            'coupon_code' => $coupon_code,
            'coupon_id' => $coupon_id
        );
        
    } catch (Exception $e) {
        error_log("Coupon creation failed: " . $e->getMessage());
        
        return array(
            'success' => false,
            'error' => $e->getMessage()
        );
    }
}

/**
 * Validate loyalty redemption request (optional helper)
 */
function validate_loyalty_redemption($email, $points_to_redeem) {
    global $wpdb;
    
    // Check current points
    $table_name = $wpdb->prefix . 'wlr_users';
    $current_points = $wpdb->get_var($wpdb->prepare(
        "SELECT points FROM $table_name WHERE email = %s",
        $email
    ));
    
    if ($current_points === null) {
        return array(
            'valid' => false,
            'error' => 'User not found'
        );
    }
    
    if ($current_points < $points_to_redeem) {
        return array(
            'valid' => false,
            'error' => 'Insufficient points',
            'current_points' => intval($current_points),
            'required_points' => $points_to_redeem
        );
    }
    
    return array(
        'valid' => true,
        'current_points' => intval($current_points)
    );
}

/**
 * Additional endpoint for checking redemption status (optional)
 */
add_action('rest_api_init', function () {
    register_rest_route('my/v1', '/loyalty/redeem/validate', array(
        'methods' => 'GET',
        'callback' => 'validate_loyalty_redemption_endpoint',
        'permission_callback' => '__return_true',
    ));
});

function validate_loyalty_redemption_endpoint($request) {
    $email = sanitize_email($request->get_param('email'));
    $points_to_redeem = intval($request->get_param('points')) ?: 60;
    
    if (empty($email) || !is_email($email)) {
        return new WP_Error('invalid_email', 'Valid email address required', array('status' => 400));
    }
    
    $validation = validate_loyalty_redemption($email, $points_to_redeem);
    
    return rest_ensure_response($validation);
}
?>
```

## Database Table Structure

The endpoint expects the `wp_wlr_users` table to exist with the following structure:

```sql
CREATE TABLE `wp_wlr_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `points` int(11) NOT NULL DEFAULT 0,
  `earned` int(11) NOT NULL DEFAULT 0,
  `used` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  INDEX `points_idx` (`points`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## Testing the Endpoint

### Test with cURL:

```bash
# Test redemption
curl -X POST "https://wasgeurtje.nl/wp-json/my/v1/loyalty/redeem" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "points_to_redeem": 60,
    "discount_amount": 13
  }'

# Test validation
curl "https://wasgeurtje.nl/wp-json/my/v1/loyalty/redeem/validate?email=test@example.com&points=60"
```

### Expected Success Response:

```json
{
  "success": true,
  "message": "Points successfully redeemed",
  "coupon_code": "LOYALTY-ABC123-XYZ",
  "discount_amount": 13,
  "remaining_points": 42,
  "redeemed_points": 60
}
```

### Expected Error Responses:

```json
{
  "code": "insufficient_points",
  "message": "Insufficient points or user not found",
  "data": {
    "status": 400
  }
}
```

## Security Considerations

1. **Add proper authentication** to the endpoint
2. **Rate limiting** to prevent abuse
3. **Input sanitization** (already included)
4. **Database transaction safety** (implemented)
5. **Error logging** for debugging
6. **Audit trail** in coupon metadata

## Installation Instructions

1. Add the PHP code to your theme's `functions.php` file or create a custom plugin
2. Ensure the `wp_wlr_users` table exists and has the correct structure
3. Test the endpoint with sample data
4. Configure proper authentication if needed
5. Set up monitoring and logging

## Dependencies

- WordPress REST API
- WooCommerce (for coupon creation)
- MySQL with InnoDB engine (for transactions)
- PHP 7.4+ (for error handling features)

This endpoint provides the server-side foundation for the complete loyalty redemption system.
