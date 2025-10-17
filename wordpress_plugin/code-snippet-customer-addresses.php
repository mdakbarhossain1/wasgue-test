<?php
/**
 * Customer Address Manager - Code Snippet Version
 * Add this to Code Snippets plugin
 */

// Hook into REST API init with higher priority
add_action('rest_api_init', function() {
    // Delete address endpoint
    register_rest_route('wp-loyalty-rules/v1', '/customer/address/delete', array(
        'methods' => WP_REST_Server::CREATABLE,
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
}, 99); // Higher priority to ensure it runs

/**
 * Handle address deletion
 */
function handle_delete_customer_address($request) {
    $email = $request->get_param('email');
    $address_id = $request->get_param('addressId');
    
    // Get user by email
    $user = get_user_by('email', $email);
    if (!$user) {
        return new WP_REST_Response(array(
            'success' => false,
            'message' => 'User not found'
        ), 404);
    }
    
    // Get saved addresses from user meta
    $saved_addresses = get_user_meta($user->ID, 'saved_delivery_addresses', true);
    if (!is_array($saved_addresses)) {
        $saved_addresses = array();
    }
    
    // Filter out the address to delete
    $updated_addresses = array_filter($saved_addresses, function($address) use ($address_id) {
        return isset($address['id']) && $address['id'] !== $address_id;
    });
    
    // Update user meta
    update_user_meta($user->ID, 'saved_delivery_addresses', array_values($updated_addresses));
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Address deleted successfully',
        'addresses' => array_values($updated_addresses)
    ), 200);
}

// Test endpoint to check if API is working
add_action('rest_api_init', function() {
    register_rest_route('wp-loyalty-rules/v1', '/test', array(
        'methods' => 'GET',
        'callback' => function() {
            return new WP_REST_Response(array(
                'success' => true,
                'message' => 'API is working'
            ), 200);
        },
        'permission_callback' => '__return_true'
    ));
}, 99);


