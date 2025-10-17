<?php
/**
 * Alternative Customer Address Manager
 * Use this if the REST API approach doesn't work
 * Add to Code Snippets plugin and set to "Run everywhere"
 */

// Alternative approach: Add custom AJAX handlers
add_action('wp_ajax_delete_customer_address', 'ajax_delete_customer_address');
add_action('wp_ajax_nopriv_delete_customer_address', 'ajax_delete_customer_address');

function ajax_delete_customer_address() {
    // Check nonce for security (optional for now)
    $email = sanitize_email($_POST['email'] ?? '');
    $address_id = sanitize_text_field($_POST['addressId'] ?? '');
    
    if (!$email || !$address_id) {
        wp_send_json_error('Missing required parameters');
    }
    
    // Get user by email
    $user = get_user_by('email', $email);
    if (!$user) {
        wp_send_json_error('User not found');
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
    
    wp_send_json_success(array(
        'message' => 'Address deleted successfully',
        'addresses' => array_values($updated_addresses)
    ));
}

// Also try registering REST route with different namespace
add_action('rest_api_init', function() {
    register_rest_route('custom/v1', '/delete-address', array(
        'methods' => 'POST',
        'callback' => function($request) {
            $email = $request->get_param('email');
            $address_id = $request->get_param('addressId');
            
            if (!$email || !$address_id) {
                return new WP_Error('missing_params', 'Missing required parameters', array('status' => 400));
            }
            
            $user = get_user_by('email', $email);
            if (!$user) {
                return new WP_Error('user_not_found', 'User not found', array('status' => 404));
            }
            
            $saved_addresses = get_user_meta($user->ID, 'saved_delivery_addresses', true) ?: array();
            $updated_addresses = array_filter($saved_addresses, function($address) use ($address_id) {
                return isset($address['id']) && $address['id'] !== $address_id;
            });
            
            update_user_meta($user->ID, 'saved_delivery_addresses', array_values($updated_addresses));
            
            return array(
                'success' => true,
                'message' => 'Address deleted successfully'
            );
        },
        'permission_callback' => '__return_true'
    ));
});


