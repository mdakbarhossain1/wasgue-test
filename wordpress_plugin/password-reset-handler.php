<?php
/**
 * Plugin Name: Password Reset Handler
 * Description: Custom REST API for password reset (for Next.js frontend)
 * Version: 1.2.0
 * Author: Wasgeurtje
 */

if (!defined('ABSPATH')) exit;

/**
 * Allow CORS for Next.js frontend
 */
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: https://wasgeurtje.nl'); // ✅ CHANGE to your frontend domain if different
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Authorization, Content-Type');
        return $value;
    });
}, 15);

/**
 * Register REST routes for password reset
 */
add_action('rest_api_init', function() {

    // Send reset email
    register_rest_route('wasgeurtje/v1', '/resetpassword', [
        'methods' => 'POST',
        'callback' => 'handle_password_reset_request',
        'permission_callback' => '__return_true',
        'args' => [
            'email' => [
                'required' => true,
                'type' => 'string',
                'sanitize_callback' => 'sanitize_email',
            ],
        ],
    ]);

    // Confirm password reset
    register_rest_route('wasgeurtje/v1', '/resetpassword', [
        'methods' => 'POST',
        'callback' => 'handle_password_reset_confirm',
        'permission_callback' => '__return_true',
        'args' => [
            'token' => [
                'required' => true,
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'password' => [
                'required' => true,
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ],
        ],
    ]);

    // Validate token (optional)
    register_rest_route('wasgeurtje/v1', '/resetpassword', [
        'methods' => 'POST',
        'callback' => 'validate_reset_token',
        'permission_callback' => '__return_true',
        'args' => [
            'token' => [
                'required' => true,
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ],
        ],
    ]);
});

/**
 * Handle password reset email request
 */
function handle_password_reset_request($request) {
    $email = sanitize_email($request->get_param('email'));
    $user = get_user_by('email', $email);

    if (!$user) {
        return new WP_REST_Response([
            'success' => true,
            'message' => 'If an account exists with this email, a reset link has been sent.'
        ], 200);
    }

    $reset_key = get_password_reset_key($user);
    if (is_wp_error($reset_key)) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'Could not generate reset key.'
        ], 500);
    }

    // Save token and expiry
    update_user_meta($user->ID, 'password_reset_key', $reset_key);
    update_user_meta($user->ID, 'password_reset_expiry', date('Y-m-d H:i:s', strtotime('+24 hours')));

    // Link to your Next.js frontend page
    $reset_url = 'https://wasgeurtje.nl/auth/reset-password?token=' . urlencode($reset_key);

    // Build email
    $site_name = get_bloginfo('name');
    $subject = '[' . $site_name . '] Wachtwoord opnieuw instellen';
    $message = "Hallo {$user->display_name},\n\n";
    $message .= "Er is een aanvraag gedaan om je wachtwoord opnieuw in te stellen op {$site_name}.\n\n";
    $message .= "Klik op de volgende link om je wachtwoord opnieuw in te stellen:\n{$reset_url}\n\n";
    $message .= "Deze link is 24 uur geldig.\n\nMet vriendelijke groet,\nHet team van {$site_name}";

    $headers = ['Content-Type: text/plain; charset=UTF-8'];

    // Send email
    $sent = wp_mail($user->user_email, $subject, $message, $headers);

    if (!$sent) {
        error_log('❌ Password reset email failed for ' . $email);
        return new WP_REST_Response([
            'success' => false,
            'message' => 'Failed to send reset email. Please try again later.'
        ], 500);
    }

    return new WP_REST_Response([
        'success' => true,
        'message' => 'If an account exists with this email, a reset link has been sent.'
    ], 200);
}

/**
 * Validate password reset token
 */
function validate_reset_token($request) {
    $token = sanitize_text_field($request->get_param('token'));

    $users = get_users([
        'meta_key' => 'password_reset_key',
        'meta_value' => $token,
    ]);

    if (empty($users)) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'Invalid or expired reset token.'
        ], 400);
    }

    $user = $users[0];
    $expiry = get_user_meta($user->ID, 'password_reset_expiry', true);

    if (!$expiry || strtotime($expiry) < time()) {
        delete_user_meta($user->ID, 'password_reset_key');
        delete_user_meta($user->ID, 'password_reset_expiry');
        return new WP_REST_Response([
            'success' => false,
            'message' => 'Reset token expired.'
        ], 400);
    }

    return new WP_REST_Response([
        'success' => true,
        'message' => 'Valid reset token.'
    ], 200);
}

/**
 * Handle password reset confirmation
 */
function handle_password_reset_confirm($request) {
    $token = sanitize_text_field($request->get_param('token'));
    $password = sanitize_text_field($request->get_param('password'));

    $users = get_users([
        'meta_key' => 'password_reset_key',
        'meta_value' => $token,
    ]);

    if (empty($users)) {
        return new WP_REST_Response(['success' => false, 'message' => 'Invalid reset token.'], 400);
    }

    $user = $users[0];
    $expiry = get_user_meta($user->ID, 'password_reset_expiry', true);

    if (!$expiry || strtotime($expiry) < time()) {
        delete_user_meta($user->ID, 'password_reset_key');
        delete_user_meta($user->ID, 'password_reset_expiry');
        return new WP_REST_Response(['success' => false, 'message' => 'Reset token expired.'], 400);
    }

    if (strlen($password) < 8) {
        return new WP_REST_Response(['success' => false, 'message' => 'Password must be at least 8 characters long.'], 400);
    }

    wp_set_password($password, $user->ID);

    delete_user_meta($user->ID, 'password_reset_key');
    delete_user_meta($user->ID, 'password_reset_expiry');

    $sessions = WP_Session_Tokens::get_instance($user->ID);
    $sessions->destroy_all();

    return new WP_REST_Response([
        'success' => true,
        'message' => 'Password reset successful.'
    ], 200);
}
