<?php
/**
 * Plugin Name: Customer Address Manager
 * Description: Manages multiple delivery addresses for customers
 * Version: 1.0.0
 * Author: Wasgeurtje
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Hook into the wp-loyalty-rules REST API
add_action('rest_api_init', function() {
    // Delete address endpoint
    register_rest_route('wp-loyalty-rules/v1', '/customer/address/delete', array(
        'methods' => 'POST',
        'callback' => 'handle_delete_customer_address',
        'permission_callback' => '__return_true',
        'args' => array(
            'email' => array(
                'required' => true,
                'type' => 'string',
                'sanitize_callback' => 'sanitize_email',
            ),
            'addressId' => array(
                'required' => true,
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ),
        ),
    ));
    
    // Get customer addresses endpoint
    register_rest_route('wp-loyalty-rules/v1', '/customer/addresses', array(
        'methods' => 'GET',
        'callback' => 'get_customer_addresses',
        'permission_callback' => '__return_true',
        'args' => array(
            'email' => array(
                'required' => true,
                'type' => 'string',
                'sanitize_callback' => 'sanitize_email',
            ),
        ),
    ));
});

/**
 * Handle address deletion
 */
function handle_delete_customer_address($request) {
    $email = $request->get_param('email');
    $address_id = $request->get_param('addressId');
    
    // Log the request for debugging
    error_log('🗑️ DELETE ADDRESS REQUEST - Email: ' . $email . ', Address ID: ' . $address_id);
    
    // Get user by email
    $user = get_user_by('email', $email);
    if (!$user) {
        error_log('❌ User not found for email: ' . $email);
        return new WP_Error('user_not_found', 'User not found', array('status' => 404));
    }
    
    error_log('✅ User found - ID: ' . $user->ID);
    
    // Get saved addresses from user meta
    $saved_addresses = get_user_meta($user->ID, 'saved_delivery_addresses', true);
    if (!is_array($saved_addresses)) {
        $saved_addresses = array();
    }
    
    error_log('📍 Found ' . count($saved_addresses) . ' saved addresses');
    foreach ($saved_addresses as $addr) {
        error_log('  - ID: ' . $addr['id'] . ' | Street: ' . $addr['street'] . ' | PostCode: ' . $addr['postalCode']);
    }
    
    // Filter out the address to delete
    // Try multiple matching strategies for ID compatibility
    $updated_addresses = array_filter($saved_addresses, function($address) use ($address_id) {
        // Check exact ID match first
        if ($address['id'] === $address_id) {
            return false;
        }
        
        // Also check if the address_id could be an alternative ID for the same address
        $street = $address['street'] ?? '';
        $postcode = $address['postalCode'] ?? '';
        
        // Generate different possible IDs for this address
        $possible_ids = [
            md5($street . $postcode),
            'order-' . $address_id,
            'current-address',
            // Simple hash like frontend might generate
            dechex(abs(crc32($street . $postcode)))
        ];
        
        return !in_array($address_id, $possible_ids);
    });
    
    // Update user meta
    update_user_meta($user->ID, 'saved_delivery_addresses', array_values($updated_addresses));
    
    $deleted_count = count($saved_addresses) - count($updated_addresses);
    error_log('🗑️ Delete operation completed - Deleted ' . $deleted_count . ' addresses');
    error_log('📍 Remaining addresses: ' . count($updated_addresses));
    
    return array(
        'success' => true,
        'message' => 'Address deleted successfully',
        'addresses' => array_values($updated_addresses),
        'deleted_count' => $deleted_count,
        'original_count' => count($saved_addresses)
    );
}

/**
 * Get all saved addresses for a customer
 */
function get_customer_addresses($request) {
    $email = $request->get_param('email');
    
    // Get user by email
    $user = get_user_by('email', $email);
    if (!$user) {
        return new WP_Error('user_not_found', 'User not found', array('status' => 404));
    }
    
    // Get saved addresses from user meta
    $saved_addresses = get_user_meta($user->ID, 'saved_delivery_addresses', true);
    if (!is_array($saved_addresses)) {
        $saved_addresses = array();
    }
    
    // Also get addresses from recent orders
    $orders = wc_get_orders(array(
        'customer' => $user->ID,
        'limit' => 20,
        'orderby' => 'date',
        'order' => 'DESC',
        'status' => array('wc-completed', 'wc-processing', 'wc-on-hold')
    ));
    
    $order_addresses = array();
    foreach ($orders as $order) {
        $shipping = $order->get_address('shipping');
        if (!empty($shipping['address_1'])) {
            $address_key = md5($shipping['address_1'] . $shipping['postcode']);
            
            // Check if this address already exists
            $exists = false;
            foreach ($saved_addresses as $saved_addr) {
                if ($saved_addr['id'] === $address_key) {
                    $exists = true;
                    break;
                }
            }
            
            if (!$exists) {
                $order_addresses[] = array(
                    'id' => $address_key,
                    'name' => 'Adres van bestelling #' . $order->get_order_number(),
                    'fullName' => $shipping['first_name'] . ' ' . $shipping['last_name'],
                    'street' => $shipping['address_1'] . ($shipping['address_2'] ? ' ' . $shipping['address_2'] : ''),
                    'city' => $shipping['city'],
                    'postalCode' => $shipping['postcode'],
                    'country' => $shipping['country'],
                    'from_order' => true
                );
            }
        }
    }
    
    // Merge saved addresses with order addresses
    $all_addresses = array_merge($saved_addresses, $order_addresses);
    
    return array(
        'success' => true,
        'addresses' => $all_addresses
    );
}

/**
 * Save address when order is placed
 */
add_action('woocommerce_checkout_order_processed', 'save_delivery_address_on_order', 10, 3);
function save_delivery_address_on_order($order_id, $posted_data, $order) {
    $user_id = $order->get_user_id();
    if (!$user_id) {
        return;
    }
    
    $shipping = $order->get_address('shipping');
    if (empty($shipping['address_1'])) {
        return;
    }
    
    // Get existing addresses
    $saved_addresses = get_user_meta($user_id, 'saved_delivery_addresses', true);
    if (!is_array($saved_addresses)) {
        $saved_addresses = array();
    }
    
    // Create unique ID for this address
    $address_id = md5($shipping['address_1'] . $shipping['postcode']);
    
    // Check if address already exists
    $exists = false;
    foreach ($saved_addresses as $addr) {
        if ($addr['id'] === $address_id) {
            $exists = true;
            break;
        }
    }
    
    // Add new address if it doesn't exist
    if (!$exists) {
        $new_address = array(
            'id' => $address_id,
            'name' => 'Adres van ' . $shipping['first_name'] . ' ' . $shipping['last_name'],
            'fullName' => $shipping['first_name'] . ' ' . $shipping['last_name'],
            'street' => $shipping['address_1'] . ($shipping['address_2'] ? ' ' . $shipping['address_2'] : ''),
            'city' => $shipping['city'],
            'postalCode' => $shipping['postcode'],
            'country' => $shipping['country'],
            'saved_date' => current_time('mysql')
        );
        
        $saved_addresses[] = $new_address;
        
        // Keep only last 10 addresses
        if (count($saved_addresses) > 10) {
            $saved_addresses = array_slice($saved_addresses, -10);
        }
        
        update_user_meta($user_id, 'saved_delivery_addresses', $saved_addresses);
    }
}


