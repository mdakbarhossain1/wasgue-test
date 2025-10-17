<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Controllers\Admin;

use Automattic\WooCommerce\StoreApi\Schemas\V1\CheckoutSchema;
use Wlr\App\Controllers\Base;
use Wlr\App\Helpers\Woocommerce;
use Wlr\App\Premium\Controllers\Site\Birthday;

defined( 'ABSPATH' ) or die;

class Blocks extends Base {
	public static function init() {
		if ( ! ( function_exists( 'woocommerce_store_api_register_endpoint_data' ) && class_exists( '\Automattic\WooCommerce\StoreApi\Schemas\V1\CartSchema' ) ) ) {
			return;
		}

		$woocommerce = Woocommerce::getInstance();
		if ( ! Woocommerce::isBlockEnabled() || $woocommerce->isBannedUser() ) {
			return;
		}

		if ( Woocommerce::isCartBlock() ) {
			if ( function_exists( 'WC' ) && WC()->is_rest_api_request() ) {

				$birthday = new Birthday();
				woocommerce_store_api_register_endpoint_data(
					[
						'endpoint'        => CheckoutSchema::IDENTIFIER,
						'namespace'       => 'wlr_checkout_block',
						'schema_callback' => [ $birthday, 'getBirthdayDateSchema' ],
						'schema_type'     => ARRAY_A,
					]
				);
			}
		}

		if ( Woocommerce::isCheckoutBlock() ) {
			if ( function_exists( 'WC' ) && WC()->is_rest_api_request() ) {
				$birthday = new Birthday();
				woocommerce_store_api_register_endpoint_data(
					[
						'endpoint'        => CheckoutSchema::IDENTIFIER,
						'namespace'       => 'wlr_checkout_block',
						'schema_callback' => [ $birthday, 'getBirthdayDateSchema' ],
						'schema_type'     => ARRAY_A,
					]
				);
			}
		}
	}
}
