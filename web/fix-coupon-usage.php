<?php
/**
 * Plugin Name: Fix Coupon Usage Count
 * Description: Ensures coupon usage counts are properly updated when orders are paid, including for Smart Coupons
 * Version: 1.0.1
 * Author: WooCommerce Fix
 * 
 * Installation: Place this file in wp-content/mu-plugins/fix-coupon-usage.php
 * 
 * This plugin ensures that coupon usage counts are properly synchronized
 * when orders change status, with idempotency protection against webhooks
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Check if the order status represents a paid state
 * 
 * @param string $status Order status (without 'wc-' prefix)
 * @return bool
 */
function fcu_is_paid_status($status) {
    $paid_statuses = array('processing', 'completed', 'on-hold');
    return in_array($status, $paid_statuses, true);
}

/**
 * Check if the order status represents a cancelled/refunded state
 * 
 * @param string $status Order status (without 'wc-' prefix)
 * @return bool
 */
function fcu_is_cancelled_status($status) {
    $cancelled_statuses = array('cancelled', 'refunded', 'failed');
    return in_array($status, $cancelled_statuses, true);
}

/**
 * Generate a unique sync key for idempotency
 * 
 * @param WC_Order $order
 * @param string $action 'increase' or 'decrease'
 * @return string
 */
function fcu_get_sync_key($order, $action) {
    $coupon_codes = $order->get_coupon_codes();
    sort($coupon_codes);
    return md5($order->get_id() . ':' . implode(',', $coupon_codes) . ':' . $action . ':' . $order->get_status());
}

/**
 * Check if this sync operation has already been performed
 * 
 * @param WC_Order $order
 * @param string $key
 * @return bool
 */
function fcu_already_synced($order, $key) {
    $synced_keys = $order->get_meta('_coupon_usage_synced', true);
    if (!is_array($synced_keys)) {
        $synced_keys = array();
    }
    return in_array($key, $synced_keys, true);
}

/**
 * Mark this sync operation as completed
 * 
 * @param WC_Order $order
 * @param string $key
 */
function fcu_mark_synced($order, $key) {
    $synced_keys = $order->get_meta('_coupon_usage_synced', true);
    if (!is_array($synced_keys)) {
        $synced_keys = array();
    }
    if (!in_array($key, $synced_keys, true)) {
        $synced_keys[] = $key;
        $order->update_meta_data('_coupon_usage_synced', $synced_keys);
        $order->save();
    }
}

/**
 * Ensure coupon usage tracking works for all coupon types
 * Adds purchase history support for coupons
 * 
 * @param WC_Order $order
 * @param string $action 'increase' or 'decrease'
 */
function fcu_ensure_coupon_tracking($order, $action = 'increase') {
    $coupon_codes = $order->get_coupon_codes();
    
    foreach ($coupon_codes as $coupon_code) {
        $coupon = new WC_Coupon($coupon_code);
        
        if ($coupon->get_id()) {
            // Ensure the used_by list is updated for purchase history
            $used_by = $coupon->get_used_by();
            $customer_email = $order->get_billing_email();
            
            if ($action === 'increase' && $customer_email && !in_array($customer_email, $used_by)) {
                $used_by[] = $customer_email;
                update_post_meta($coupon->get_id(), '_used_by', $used_by);
                
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    error_log('[fix-coupon-usage] Updated used_by list for coupon: ' . $coupon_code);
                }
            } elseif ($action === 'decrease' && $customer_email) {
                $key = array_search($customer_email, $used_by);
                if ($key !== false) {
                    unset($used_by[$key]);
                    update_post_meta($coupon->get_id(), '_used_by', array_values($used_by));
                }
            }
        }
    }
}

/**
 * Main function to sync coupon usage on status change
 * 
 * @param int $order_id
 * @param string $old_status
 * @param string $new_status
 * @param WC_Order $order
 */
function fcu_sync_coupon_usage_on_status_change($order_id, $old_status, $new_status, $order) {
    // Skip if not a shop order
    if ($order->get_type() !== 'shop_order') {
        return;
    }
    
    // Skip if this is a refund order
    if ($order->get_parent_id() > 0) {
        return;
    }
    
    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log('[fix-coupon-usage] Status change for order ' . $order_id . ': ' . $old_status . ' -> ' . $new_status);
    }
    
    // Handle transition to paid status
    if (!fcu_is_paid_status($old_status) && fcu_is_paid_status($new_status)) {
        $sync_key = fcu_get_sync_key($order, 'increase');
        
        if (!fcu_already_synced($order, $sync_key)) {
            // Let WooCommerce handle the usage counts
            wc_update_coupon_usage_counts($order_id);
            
            // Ensure purchase history tracking
            fcu_ensure_coupon_tracking($order, 'increase');
            
            // Mark as synced
            fcu_mark_synced($order, $sync_key);
            
            if (defined('WP_DEBUG') && WP_DEBUG) {
                $coupons = $order->get_coupon_codes();
                error_log('[fix-coupon-usage] Increased usage counts for order ' . $order_id . '. Coupons: ' . implode(', ', $coupons));
            }
        }
    }
    
    // Handle transition to cancelled/refunded status
    if (fcu_is_paid_status($old_status) && fcu_is_cancelled_status($new_status)) {
        $sync_key = fcu_get_sync_key($order, 'decrease');
        
        if (!fcu_already_synced($order, $sync_key)) {
            // Let WooCommerce handle the usage counts
            wc_decrease_coupon_usage_counts($order_id);
            
            // Ensure purchase history tracking
            fcu_ensure_coupon_tracking($order, 'decrease');
            
            // Mark as synced
            fcu_mark_synced($order, $sync_key);
            
            if (defined('WP_DEBUG') && WP_DEBUG) {
                $coupons = $order->get_coupon_codes();
                error_log('[fix-coupon-usage] Decreased usage counts for order ' . $order_id . '. Coupons: ' . implode(', ', $coupons));
            }
        }
    }
}

// Hook into WooCommerce order status changes
add_action('woocommerce_order_status_changed', 'fcu_sync_coupon_usage_on_status_change', 10, 4);

// Additional hooks for specific status transitions
add_action('woocommerce_order_status_pending_to_processing', function($order_id) {
    $order = wc_get_order($order_id);
    if ($order) {
        fcu_sync_coupon_usage_on_status_change($order_id, 'pending', 'processing', $order);
    }
});

add_action('woocommerce_order_status_pending_to_completed', function($order_id) {
    $order = wc_get_order($order_id);
    if ($order) {
        fcu_sync_coupon_usage_on_status_change($order_id, 'pending', 'completed', $order);
    }
});