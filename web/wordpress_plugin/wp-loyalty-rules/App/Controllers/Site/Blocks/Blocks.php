<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Controllers\Site\Blocks;

use Automattic\WooCommerce\StoreApi\Exceptions\RouteException;
use Automattic\WooCommerce\StoreApi\Schemas\V1\CartSchema;
use Wlr\App\Controllers\Site\Blocks\Integration\Message;
use Wlr\App\Controllers\Site\Main;
use Wlr\App\Helpers\Rewards;
use Wlr\App\Helpers\Woocommerce;


defined( 'ABSPATH' ) or die;

class Blocks {

	/**
	 * Initializes the blocks for WooCommerce.
	 *
	 * This method checks if the necessary functions and classes for block registration exist,
	 * and initializes the blocks if they are enabled and the user is not banned.
	 *
	 * @return void
	 * @throws RouteException
	 */
	public static function init() {
		if ( ! ( function_exists( 'woocommerce_store_api_register_endpoint_data' ) && class_exists( '\Automattic\WooCommerce\StoreApi\Schemas\V1\CartSchema' ) ) ) {
			return;
		}
		$woocommerce = Woocommerce::getInstance();
		if ( ! Woocommerce::isBlockEnabled() || $woocommerce->isBannedUser() ) {
			return;
		}
		$message = new Message();
		if ( Woocommerce::isCartBlock() ) {
			if ( function_exists( 'WC' ) && WC()->is_rest_api_request() ) {
				woocommerce_store_api_register_endpoint_data(
					[
						'endpoint'        => CartSchema::IDENTIFIER,
						'namespace'       => str_replace( '-', '_', WLR_TEXT_DOMAIN . '-message' ),
						'data_callback'   => [ $message, 'extendData' ],
						'schema_callback' => [ $message, 'extendDataSchema' ],
						'schema_type'     => ARRAY_A,
					]
				);
			}
			add_action(
				'woocommerce_blocks_cart_block_registration',
				function ( $integration_registry ) {
					$integration_registry->register( new Message() );
				}
			);
		}
		if ( Woocommerce::isCheckoutBlock() ) {
			if ( function_exists( 'WC' ) && WC()->is_rest_api_request() ) {
				woocommerce_store_api_register_endpoint_data(
					[
						'endpoint'        => CartSchema::IDENTIFIER,
						'namespace'       => str_replace( '-', '_', WLR_TEXT_DOMAIN . '-message' ),
						'data_callback'   => [ $message, 'extendData' ],
						'schema_callback' => [ $message, 'extendDataSchema' ],
						'schema_type'     => ARRAY_A,
					]
				);

			}
			add_action(
				'woocommerce_blocks_checkout_block_registration',
				function ( $integration_registry ) {
					$integration_registry->register( new Message() );
				}
			);
		}

		add_action( 'woocommerce_store_api_checkout_update_order_from_request', function ( $order, $request ) {
			$woocommerce = Woocommerce::getInstance();
			$coupons     = $woocommerce->isMethodExists( $order, 'get_items' ) ? $order->get_items( 'coupon' ) : [];
			if ( empty( $coupons ) ) {
				return;
			}
			$reward_helper  = Rewards::getInstance();
			$payment_method = $woocommerce->isMethodExists( $order, 'get_payment_method' ) ? $order->get_payment_method() : '';
			if ( empty( $payment_method ) ) {
				return;
			}
			$user = $woocommerce->isMethodExists( $order, 'get_user' ) ? $order->get_user() : '';
			foreach ( $coupons as $coupon_item ) {
				$coupon_code = $woocommerce->isMethodExists( $coupon_item, 'get_code' ) ? $coupon_item->get_code() : '';
				if ( ! empty( $coupon_code ) && $reward_helper->is_loyalty_coupon( $coupon_code ) ) {
					$user_reward = $reward_helper->getUserRewardByCoupon( $coupon_code );
					// 4. validate WPLoyalty coupon conditions
					$extra = [
						'user_email'         => $user->user_email,
						'order'              => $order,
						'is_calculate_based' => 'order',
						'allowed_condition'  => [ 'payment_method' ]
					];
					if ( ! $reward_helper->processRewardConditions( $user_reward, $extra ) ) {
						throw new RouteException(
							'woocommerce_rest_cart_coupon_errors',
							/* translators: 1: coupon code, 2: payment method */
							sprintf( esc_html__( 'Sorry.. %1$s coupon code invalid for %2$s payment.', 'wp-loyalty-rules' ), esc_html( $coupon_code ), esc_html( $payment_method ) ),
							409
						);
					}
				}
			}
		}, 10, 2 );
		do_action( 'wlr_block_init' );
	}

	/**
	 * Updates the cart with a free product if WooCommerce block is enabled.
	 *
	 * @return void
	 */
	public static function updateCartFreeProduct() {
		if ( ! Woocommerce::isBlockEnabled() ) {
			return;
		}
		$main_controller = new Main();
		$main_controller->updateFreeProduct();
	}
}