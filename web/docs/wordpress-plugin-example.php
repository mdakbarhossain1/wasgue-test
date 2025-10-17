<?php
/**
 * Plugin Name: Wasgeurtje Headless Integration
 * Description: Integrates WordPress with Next.js frontend
 * Version: 1.0.0
 * Author: Wasgeurtje Team
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Configuration
define('NEXTJS_REVALIDATE_URL', 'https://your-nextjs-site.com/api/wordpress/revalidate');
define('NEXTJS_REVALIDATE_SECRET', 'your-secret-token-here');
define('NEXTJS_PREVIEW_URL', 'https://your-nextjs-site.com/api/preview');
define('NEXTJS_PREVIEW_SECRET', 'your-preview-secret-here');

/**
 * Send revalidation request to Next.js when content is updated
 */
function wasgeurtje_notify_nextjs_on_update($post_id, $post, $update) {
    // Skip autosaves and revisions
    if (wp_is_post_autosave($post_id) || wp_is_post_revision($post_id)) {
        return;
    }
    
    // Only for published content
    if ($post->post_status !== 'publish') {
        return;
    }
    
    // Determine content type
    $type = 'page';
    if ($post->post_type === 'post') {
        $type = 'post';
    } elseif ($post->post_type === 'product') {
        $type = 'product';
    }
    
    // Prepare webhook payload
    $body = [
        'secret' => NEXTJS_REVALIDATE_SECRET,
        'type' => $type,
        'id' => $post_id,
        'slug' => $post->post_name,
        'path' => get_permalink($post_id)
    ];
    
    // Send webhook
    $response = wp_remote_post(NEXTJS_REVALIDATE_URL, [
        'body' => json_encode($body),
        'headers' => [
            'Content-Type' => 'application/json'
        ],
        'timeout' => 5
    ]);
    
    // Log result (optional)
    if (is_wp_error($response)) {
        error_log('Wasgeurtje: Failed to notify Next.js - ' . $response->get_error_message());
    } else {
        error_log('Wasgeurtje: Successfully notified Next.js for ' . $post->post_name);
    }
}
add_action('save_post', 'wasgeurtje_notify_nextjs_on_update', 10, 3);

/**
 * Modify preview links to use Next.js preview mode
 */
function wasgeurtje_custom_preview_link($preview_link, $post) {
    // Build preview URL
    $preview_url = NEXTJS_PREVIEW_URL;
    $preview_url .= '?secret=' . NEXTJS_PREVIEW_SECRET;
    $preview_url .= '&slug=' . $post->post_name;
    $preview_url .= '&id=' . $post->ID;
    $preview_url .= '&type=' . $post->post_type;
    
    return $preview_url;
}
add_filter('preview_post_link', 'wasgeurtje_custom_preview_link', 10, 2);
add_filter('preview_page_link', 'wasgeurtje_custom_preview_link', 10, 2);

/**
 * Add ACF fields to REST API
 */
function wasgeurtje_add_acf_to_rest() {
    // Add ACF fields to pages
    register_rest_field('page', 'acf_fields', [
        'get_callback' => function($post) {
            return get_fields($post['id']);
        },
        'schema' => null
    ]);
    
    // Add ACF fields to posts
    register_rest_field('post', 'acf_fields', [
        'get_callback' => function($post) {
            return get_fields($post['id']);
        },
        'schema' => null
    ]);
    
    // Add ACF fields to products
    register_rest_field('product', 'acf_fields', [
        'get_callback' => function($post) {
            return get_fields($post['id']);
        },
        'schema' => null
    ]);
}
add_action('rest_api_init', 'wasgeurtje_add_acf_to_rest');

/**
 * Add CORS headers for Next.js development
 */
function wasgeurtje_add_cors_headers() {
    // Only in development - remove or modify for production
    if (defined('WP_DEBUG') && WP_DEBUG) {
        header("Access-Control-Allow-Origin: http://localhost:3000");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization");
    }
}
add_action('init', 'wasgeurtje_add_cors_headers');

/**
 * Register custom REST API endpoint for global options
 */
function wasgeurtje_register_options_endpoint() {
    register_rest_route('wasgeurtje/v1', '/options', [
        'methods' => 'GET',
        'callback' => 'wasgeurtje_get_global_options',
        'permission_callback' => '__return_true'
    ]);
}
add_action('rest_api_init', 'wasgeurtje_register_options_endpoint');

function wasgeurtje_get_global_options() {
    // Get ACF options
    $options = [];
    
    if (function_exists('get_field')) {
        $options['header'] = get_field('header_settings', 'option');
        $options['footer'] = get_field('footer_settings', 'option');
        $options['social'] = get_field('social_media', 'option');
        $options['contact'] = get_field('contact_info', 'option');
    }
    
    return new WP_REST_Response($options, 200);
}

/**
 * Add admin menu for settings
 */
function wasgeurtje_add_admin_menu() {
    add_menu_page(
        'Headless Settings',
        'Headless',
        'manage_options',
        'wasgeurtje-headless',
        'wasgeurtje_settings_page',
        'dashicons-rest-api',
        30
    );
}
add_action('admin_menu', 'wasgeurtje_add_admin_menu');

function wasgeurtje_settings_page() {
    ?>
    <div class="wrap">
        <h1>Headless WordPress Settings</h1>
        <div class="card">
            <h2>Next.js Integration Status</h2>
            <p><strong>Revalidation URL:</strong> <?php echo NEXTJS_REVALIDATE_URL; ?></p>
            <p><strong>Preview URL:</strong> <?php echo NEXTJS_PREVIEW_URL; ?></p>
            <p><strong>Last Sync:</strong> <?php echo get_option('wasgeurtje_last_sync', 'Never'); ?></p>
        </div>
        
        <div class="card">
            <h2>Test Revalidation</h2>
            <p>Click the button below to test the revalidation webhook:</p>
            <button class="button button-primary" onclick="testRevalidation()">Test Webhook</button>
            <div id="test-result"></div>
        </div>
        
        <script>
        function testRevalidation() {
            fetch('<?php echo admin_url('admin-ajax.php'); ?>', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'action=test_revalidation'
            })
            .then(response => response.json())
            .then(data => {
                document.getElementById('test-result').innerHTML = 
                    '<p style="color: ' + (data.success ? 'green' : 'red') + ';">' + 
                    data.message + '</p>';
            });
        }
        </script>
    </div>
    <?php
}

/**
 * AJAX handler for testing revalidation
 */
function wasgeurtje_test_revalidation() {
    $response = wp_remote_post(NEXTJS_REVALIDATE_URL, [
        'body' => json_encode([
            'secret' => NEXTJS_REVALIDATE_SECRET,
            'type' => 'all',
            'test' => true
        ]),
        'headers' => [
            'Content-Type' => 'application/json'
        ],
        'timeout' => 10
    ]);
    
    if (is_wp_error($response)) {
        wp_send_json_error([
            'message' => 'Failed: ' . $response->get_error_message()
        ]);
    } else {
        update_option('wasgeurtje_last_sync', current_time('mysql'));
        wp_send_json_success([
            'message' => 'Success! Response: ' . wp_remote_retrieve_response_code($response)
        ]);
    }
}
add_action('wp_ajax_test_revalidation', 'wasgeurtje_test_revalidation');


