<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Helpers;
defined( 'ABSPATH' ) or die();

use Automattic\WooCommerce\Blocks\Utils\CartCheckoutUtils;
use DateTime;
use DateTimeZone;
use Wlr\App\Models\Users;

class Woocommerce {
	public static $instance = null;
	static $reward_name = array();
	protected static $products = array();
	protected static $options = array();
	protected static $banned_user = array();

	public static function hasAdminPrivilege() {
		if ( current_user_can( 'manage_woocommerce' ) ) {
			return true;
		} else {
			return false;
		}
	}

	public static function create_nonce( $action = - 1 ) {
		return wp_create_nonce( $action );
	}

	public static function verify_nonce( $nonce, $action = - 1 ) {
		if ( wp_verify_nonce( $nonce, $action ) ) {
			return true;
		} else {
			return false;
		}
	}

	public static function getCleanHtml( $html ) {
		try {
			$html         = html_entity_decode( $html );
			$html         = preg_replace( '/(<(script|style|iframe)\b[^>]*>).*?(<\/\2>)/is', "$1$3", $html );
			$allowed_html = array(
				'br'     => array(),
				'strong' => array(),
				'span'   => array( 'class' => array() ),
				'div'    => array( 'class' => array() ),
				'p'      => array( 'class' => array() ),
				'b'      => array( 'class' => array() ),
				'i'      => array( 'class' => array() ),
			);

			return wp_kses( $html, $allowed_html );
		} catch ( \Exception $e ) {
			return '';
		}
	}

	/**
	 * Get the available date periods for loyalty rules.
	 *
	 * @return array The array of available date periods.
	 *
	 * @since 1.0.0
	 */
	public static function getDatePeriod() {
		return apply_filters( 'wlr_day_periods', [
			'day'   => esc_html__( 'Day(s)', 'wp-loyalty-rules' ),
			'week'  => esc_html__( 'Week(s)', 'wp-loyalty-rules' ),
			'month' => esc_html__( 'Month(s)', 'wp-loyalty-rules' ),
			'year'  => esc_html__( 'Year(s)', 'wp-loyalty-rules' ),
		] );
	}

	function isFullyDiscounted() {
		if ( WC()->cart->prices_include_tax && 0 >= ( WC()->cart->cart_contents_total + WC()->cart->tax_total ) ) {
			return true;
		}
		if ( ! WC()->cart->prices_include_tax && 0 >= WC()->cart->cart_contents_total ) {
			return true;
		}

		return false;
	}

	function get_login_user_email() {
		$user       = get_user_by( 'id', get_current_user_id() );
		$user_email = '';
		if ( ! empty( $user ) ) {
			$user_email = $user->user_email;
		}

		return $user_email;
	}

	function get_email_by_id( $id ) {
		$email = '';
		if ( empty( $id ) || $id <= 0 ) {
			return $email;
		}
		$user = get_user_by( 'id', $id );
		if ( ! empty( $user ) ) {
			$email = $user->user_email;
		}

		return $email;
	}

	function getRole( $user ) {
		if ( ! empty( $user ) && isset( $user->user_login ) ) {
			return $user->roles;
		}

		return array();
	}

	function beforeSaveDate( $date, $format = 'Y-m-d H:i:s' ) {
		if ( empty( $date ) || is_null( $date ) || $date == 'null' ) {
			return null;
		}
		$date = $this->convert_wp_time_to_utc( $date, $format );

		return strtotime( $date );
	}

	function convert_wp_time_to_utc( $datetime, $format = 'Y-m-d H:i:s', $modify = '' ) {
		if ( empty( $datetime ) ) {
			return null;
		}
		$wp_time_zone = new DateTimeZone( $this->get_wp_time_zone() );
		$current_time = new DateTime( $datetime, $wp_time_zone );
		if ( ! empty( $modify ) ) {
			$current_time->modify( $modify );
		}
		$timezone = new DateTimeZone( 'UTC' );
		$current_time->setTimezone( $timezone );

		return $current_time->format( $format );
	}

	function get_wp_time_zone() {
		if ( ! function_exists( 'wp_timezone_string' ) ) {
			$timezone_string = get_option( 'timezone_string' );
			if ( $timezone_string ) {
				return $timezone_string;
			}
			$offset    = (float) get_option( 'gmt_offset' );
			$hours     = (int) $offset;
			$minutes   = ( $offset - $hours );
			$sign      = ( $offset < 0 ) ? '-' : '+';
			$abs_hour  = abs( $hours );
			$abs_mins  = abs( $minutes * 60 );
			$tz_offset = sprintf( '%s%02d:%02d', $sign, $abs_hour, $abs_mins );

			return $tz_offset;
		}

		return wp_timezone_string();
	}

	function convertDateFormat( $date, $format = '' ) {
		if ( empty( $format ) ) {
			$format = get_option( 'date_format', 'Y-m-d H:i:s' );
		}
		if ( empty( $date ) ) {
			return null;
		}
		$date             = new DateTime( $date );
		$converted_format = $date->format( $format );
		if ( apply_filters( 'wlr_translate_display_date', false ) ) {
			$time             = strtotime( $converted_format );
			$converted_format = date_i18n( $format, $time );
		}

		return $converted_format;
	}

	function beforeDisplayDate( $date, $format = '' ) {
		if ( empty( $format ) ) {
			$format = get_option( 'date_format', 'Y-m-d H:i:s' );
		}
		if ( empty( $date ) ) {
			return null;
		}
		if ( (int) $date != $date ) {
			return $date;
		}

		$converted_time = $this->convert_utc_to_wp_time( gmdate( 'Y-m-d H:i:s', $date ), $format );
		if ( apply_filters( 'wlr_translate_display_date', true ) ) {
			$datetime = DateTime::createFromFormat( $format, $converted_time );
			if ( $datetime !== false ) {
				$time = $datetime->getTimestamp();
			} else {
				$time = strtotime( $converted_time );
			}
			$converted_time = date_i18n( $format, $time );
		}
		return $converted_time;
	}

	function convert_utc_to_wp_time( $datetime, $format = 'Y-m-d H:i:s', $modify = '' ) {
		try {
			$timezone     = new DateTimeZone( 'UTC' );
			$current_time = new DateTime( $datetime, $timezone );
			if ( ! empty( $modify ) ) {
				$current_time->modify( $modify );
			}
			$wp_time_zone = new DateTimeZone( $this->get_wp_time_zone() );
			$current_time->setTimezone( $wp_time_zone );
			$converted_time = $current_time->format( $format );
		} catch ( \Exception $e ) {
			$converted_time = $datetime;
		}

		return $converted_time;
	}

	function getActionTypes() {
		$earn_helper  = \Wlr\App\Helpers\EarnCampaign::getInstance();
		$action_types = array(
			'point_for_purchase' => is_admin() ? __( 'Points For Purchase', 'wp-loyalty-rules' ) : /* translators: %s: point label */
				sprintf( __( '%s For Purchase', 'wp-loyalty-rules' ), $earn_helper->getPointLabel( 3 ) ),
		);

		return apply_filters( 'wlr_action_types', $action_types );
	}

	public static function getInstance( array $config = array() ) {
		if ( ! self::$instance ) {
			self::$instance = new self( $config );
		}

		return self::$instance;
	}

	public static function getAllActionTypes() {
		return apply_filters( 'wlr_all_action_types', [
			'point_for_purchase' => is_admin() ? __( 'Points For Purchase', 'wp-loyalty-rules' ) : /* translators: %s: point label */ sprintf( __( '%s For Purchase', 'wp-loyalty-rules' ), Settings::getPointLabel( 3 ) ),
			'subtotal'           => __( 'Reward based on spending', 'wp-loyalty-rules' ),
			'purchase_histories' => __( 'Order Goals', 'wp-loyalty-rules' ),//TODO: remove this action
			'referral'           => __( 'Referral', 'wp-loyalty-rules' ),
			'signup'             => __( 'Sign Up', 'wp-loyalty-rules' ),
			'product_review'     => __( 'Write a review', 'wp-loyalty-rules' ),
			'birthday'           => __( 'Birthday', 'wp-loyalty-rules' ),
			'facebook_share'     => __( 'Facebook Share', 'wp-loyalty-rules' ),
			'twitter_share'      => __( 'Twitter Share', 'wp-loyalty-rules' ),
			'whatsapp_share'     => __( 'WhatsApp Share', 'wp-loyalty-rules' ),
			'email_share'        => __( 'Email Share', 'wp-loyalty-rules' ),
			'followup_share'     => __( 'Follow', 'wp-loyalty-rules' ),
			'achievement'        => __( 'Achievement', 'wp-loyalty-rules' )
		] );
	}

	/**
	 * Get reward discount types.
	 *
	 * @return array Returns an array of reward discount types.
	 */
	public static function getRewardDiscountTypes() {
		return apply_filters( 'wlr_reward_types', [
			'fixed_cart'        => __( 'Fixed discount', 'wp-loyalty-rules' ),
			'percent'           => __( 'Percentage discount', 'wp-loyalty-rules' ),
			'free_shipping'     => __( 'Free shipping', 'wp-loyalty-rules' ),
			'free_product'      => __( 'Free product', 'wp-loyalty-rules' ),
			'points_conversion' => is_admin() ? __( 'Points conversion', 'wp-loyalty-rules' ) : /* translators: %s: point label */ sprintf( __( '%s conversion', 'wp-loyalty-rules' ), Settings::getPointLabel( 3 ) ),
		] );
	}

	public static function getUserRoles() {
		global $wp_roles;
		$all_roles = ! empty( $wp_roles->roles ) ? $wp_roles->roles : [];
		$result    = array_map( function ( $id, $role ) {
			return [
				'value' => (string) $id,
				'label' => $role['name'],
			];
		}, array_keys( $all_roles ), $all_roles );
		$result[]  = [
			'value' => 'wlr_rules_guest',
			'label' => esc_html__( 'Guest', 'wp-loyalty-rules' ),
		];

		return array_values( $result );
	}

	public function getPaymentMethod() {
		$payment_gateways = $this->getPaymentMethodList();
		$result           = array();
		foreach ( $payment_gateways as $payment_gateway ) {
			$result[] = array(
				'id'   => $payment_gateway->id,
				'text' => $payment_gateway->title,
			);
		}

		return array_values( $result );
	}

	static function getPaymentMethodList() {
		if ( function_exists( 'WC' ) ) {
			if ( is_object( WC()->payment_gateways ) && method_exists( WC()->payment_gateways, 'payment_gateways' ) ) {
				return WC()->payment_gateways->payment_gateways();
			}
		}

		return [];
	}

	/**
	 * Get the list of reward conditions.
	 *
	 * @return array
	 */
	public static function getRewardAcceptConditions() {
		return apply_filters( 'wlr_reward_conditions', [
			'redeem_point'  => [
				'Common'  => [
					'label'   => __( 'Common', 'wp-loyalty-rules' ),
					'options' => [
						'language'   => __( 'language', 'wp-loyalty-rules' ),
						'currency'   => __( 'Currency', 'wp-loyalty-rules' ),
						'user_point' => __( 'Customer Points', 'wp-loyalty-rules' ),
					]
				],
				'Cart'    => [
					'label'   => __( 'Cart', 'wp-loyalty-rules' ),
					'options' => [
						'cart_subtotal' => __( 'Cart Subtotal', 'wp-loyalty-rules' ),
					]
				],
				'Product' => [
					'label'   => __( 'Product', 'wp-loyalty-rules' ),
					'options' => [
						'products'           => __( 'Products', 'wp-loyalty-rules' ),
						'product_attributes' => __( 'Product Attributes', 'wp-loyalty-rules' ),
						'product_category'   => __( 'Product Category', 'wp-loyalty-rules' ),
						'product_sku'        => __( 'Product SKU', 'wp-loyalty-rules' ),
						'product_tags'       => __( 'Tags', 'wp-loyalty-rules' ),
					]
				],
				'Order'   => [
					'label'   => __( 'Order', 'wp-loyalty-rules' ),
					'options' => [
						'payment_method' => __( 'Payment Method', 'wp-loyalty-rules' ),
					]
				]
			],
			'redeem_coupon' => [
				'Common'  => [
					'label'   => __( 'Common', 'wp-loyalty-rules' ),
					'options' => [
						'language'   => __( 'language', 'wp-loyalty-rules' ),
						'currency'   => __( 'Currency', 'wp-loyalty-rules' ),
						'user_point' => __( 'Customer Points', 'wp-loyalty-rules' ),
					]
				],
				'Cart'    => [
					'label'   => __( 'Cart', 'wp-loyalty-rules' ),
					'options' => [
						'cart_subtotal' => __( 'Cart Subtotal', 'wp-loyalty-rules' ),
					]
				],
				'Product' => [
					'label'   => __( 'Product', 'wp-loyalty-rules' ),
					'options' => [
						'products'           => __( 'Products', 'wp-loyalty-rules' ),
						'product_attributes' => __( 'Product Attributes', 'wp-loyalty-rules' ),
						'product_category'   => __( 'Product Category', 'wp-loyalty-rules' ),
						'product_sku'        => __( 'Product SKU', 'wp-loyalty-rules' ),
						'product_tags'       => __( 'Tags', 'wp-loyalty-rules' ),
					]
				],
				'Order'   => [
					'label'   => __( 'Order', 'wp-loyalty-rules' ),
					'options' => [
						'payment_method' => __( 'Payment Method', 'wp-loyalty-rules' ),
					]
				]
			]
		] );
	}

	/**
	 * Get the list of campaign conditions.
	 *
	 * @return array The list of campaign conditions.
	 */
	public static function getCampaignConditionList() {
		return apply_filters( 'wlr_all_campaign_condition_list', [
			'user_role'             => __( 'User Role', 'wp-loyalty-rules' ),
			'user_point'            => __( 'Customer Points', 'wp-loyalty-rules' ),
			'customer'              => __( 'Customer', 'wp-loyalty-rules' ),
			'language'              => __( 'language', 'wp-loyalty-rules' ),
			'currency'              => __( 'Currency', 'wp-loyalty-rules' ),
			'cart_subtotal'         => __( 'Cart Subtotal', 'wp-loyalty-rules' ),
			'cart_line_items_count' => __( 'Line Item Count', 'wp-loyalty-rules' ),
			'cart_weights'          => __( 'Cart Weight', 'wp-loyalty-rules' ),
			'products'              => __( 'Products', 'wp-loyalty-rules' ),
			'product_attributes'    => __( 'Product Attributes', 'wp-loyalty-rules' ),
			'product_category'      => __( 'Product Category', 'wp-loyalty-rules' ),
			'product_sku'           => __( 'Product SKU', 'wp-loyalty-rules' ),
			'product_onsale'        => __( 'On sale products', 'wp-loyalty-rules' ),
			'product_tags'          => __( 'Tags', 'wp-loyalty-rules' ),
			'payment_method'        => __( 'Payment Method', 'wp-loyalty-rules' ),
			'order_status'          => __( 'Order Status', 'wp-loyalty-rules' ),
			'purchase_history'      => __( 'Purchase History', 'wp-loyalty-rules' ),
			'purchase_history_qty'  => __( 'Purchase History Quantity', 'wp-loyalty-rules' ),
			'life_time_sale_value'  => __( 'Life Time Sale value', 'wp-loyalty-rules' ),
		] );
	}

	public static function getActionAcceptConditions() {
		return apply_filters( 'wlr_action_conditions', [
			'point_for_purchase' => [
				'Common'          => [
					'label'   => __( 'Common', 'wp-loyalty-rules' ),
					'options' => [
						'user_role'  => __( 'User Role', 'wp-loyalty-rules' ),
						'user_point' => __( 'Customer Points', 'wp-loyalty-rules' ),
						'customer'   => __( 'WPLoyalty Customer', 'wp-loyalty-rules' ),
						'language'   => __( 'language', 'wp-loyalty-rules' ),
						'currency'   => __( 'Currency', 'wp-loyalty-rules' ),
					]
				],
				'Cart'            => [
					'label'   => __( 'Cart', 'wp-loyalty-rules' ),
					'options' => [
						'cart_subtotal'         => __( 'Cart Subtotal', 'wp-loyalty-rules' ),
						'cart_line_items_count' => __( 'Line Item Count', 'wp-loyalty-rules' ),
						'cart_weights'          => __( 'Cart Weight', 'wp-loyalty-rules' ),
					]
				],
				'Product'         => [
					'label'   => __( 'Product', 'wp-loyalty-rules' ),
					'options' => [
						'products'           => __( 'Products', 'wp-loyalty-rules' ),
						'product_attributes' => __( 'Product Attributes', 'wp-loyalty-rules' ),
						'product_category'   => __( 'Product Category', 'wp-loyalty-rules' ),
						'product_sku'        => __( 'Product SKU', 'wp-loyalty-rules' ),
						'product_onsale'     => __( 'On sale products', 'wp-loyalty-rules' ),
						'product_tags'       => __( 'Tags', 'wp-loyalty-rules' ),
					]
				],
				'Order'           => [
					'label'   => __( 'Order', 'wp-loyalty-rules' ),
					'options' => [
						'payment_method' => __( 'Payment Method', 'wp-loyalty-rules' ),
						'order_status'   => __( 'Order Status', 'wp-loyalty-rules' ),
						/*'purchase_history' => __('Purchase History', 'wp-loyalty-rules'),
                        'life_time_sale_value' => __('Life Time Sale value', 'wp-loyalty-rules')*/
					]
				],
				'PurchaseHistory' => [
					'label'   => __( 'Purchase History', 'wp-loyalty-rules' ),
					'options' => [
						'purchase_first_order'                          => __( 'First Order', 'wp-loyalty-rules' ),
						'purchase_last_order'                           => __( 'Last Order', 'wp-loyalty-rules' ),
						'purchase_last_order_amount'                    => __( 'Last order amount', 'wp-loyalty-rules' ),
						'purchase_previous_orders'                      => __( 'Number of orders made', 'wp-loyalty-rules' ),
						'purchase_previous_orders_for_specific_product' => __( 'Number of orders made with following products', 'wp-loyalty-rules' ),
						'purchase_quantities_for_specific_product'      => __( 'Number of quantities made with following products', 'wp-loyalty-rules' ),
						'purchase_spent'                                => __( 'Total spent', 'wp-loyalty-rules' )
					]
				]
			],
		] );
	}

	function isCartEmpty( $cart = '' ) {
		if ( empty( $cart ) ) {
			$cart = $this->getCart();
		}

		return isset( $cart ) && is_object( $cart ) && $this->isMethodExists( $cart, 'is_empty' ) && $cart->is_empty();
	}

	function getCart( $cart = null ) {
		if ( isset( $cart ) && is_object( $cart ) ) {
			return $cart;
		}
		if ( function_exists( 'WC' ) ) {
			return WC()->cart;
		}

		return null;
	}

	function isMethodExists( $object, $method_name ) {
		if ( is_object( $object ) && method_exists( $object, $method_name ) ) {
			return true;
		}

		return false;
	}

	function getCartItems( $cart = '' ) {
		if ( isset( $cart ) && is_object( $cart ) && isset( $cart->cart ) ) {
			return $cart->cart->get_cart();
		}
		if ( function_exists( 'WC' ) && isset( WC()->cart ) ) {
			return WC()->cart->get_cart();
		}

		return array();
	}

	public function getCartItem( $key = '' ) {
		return ! empty( $key ) && function_exists( 'WC' ) && isset( WC()->cart ) && $this->isMethodExists( WC()->cart, 'get_cart_item' )
			? WC()->cart->get_cart_item( $key ) : false;
	}

	function setCartProductPrice( $cart_item_object, $price ) {
		if ( $this->isMethodExists( $cart_item_object, 'set_price' ) ) {
			return $cart_item_object->set_price( $price );
		}

		return false;
	}

	function arrayKeyLast( $array = array() ) {
		if ( ! is_array( $array ) || empty( $array ) ) {
			return 0;
		}
		if ( version_compare( PHP_VERSION, '7.3.0', '>=' ) ) {
			return array_key_last( $array );
		}

		return array_keys( $array )[ count( $array ) - 1 ];
	}

	function getCartSubtotal( $cart_data = null ) {
		$cart     = $this->getCart( $cart_data );
		$subtotal = 0;
		if ( ! empty( $cart ) && is_object( $cart ) ) {
			$base_helper = new Base();
			if ( $this->isMethodExists( $cart, 'get_subtotal' ) ) {
				$subtotal = $cart->get_subtotal();
				if ( $base_helper->isIncludingTax() && $this->isMethodExists( $cart, 'get_subtotal_tax' ) ) {
					$subtotal_tax = $cart->get_subtotal_tax();
					$subtotal     += $subtotal_tax;
				}
			} elseif ( isset( $cart->subtotal ) ) {
				$subtotal = $cart->subtotal;
				if ( $base_helper->isIncludingTax() && isset( $cart->subtotal_tax ) ) {
					$subtotal_tax = $cart->subtotal_tax;
					$subtotal     += $subtotal_tax;
				}
			}
		}

		return apply_filters( 'wlr_get_cart_subtotal', $subtotal, $cart_data );
	}

	public static function getOrderStatuses() {
		return self::format_order_statuses( wc_get_order_statuses() );
	}

	public static function format_order_statuses( $statuses ) {
		$formatted_statuses = array();
		foreach ( $statuses as $key => $value ) {
			$formatted_key                        = preg_replace( '/^wc-/', '', $key );
			$formatted_statuses[ $formatted_key ] = $value;
		}

		return $formatted_statuses;
	}

	function getOrderItemsQty( $order ) {
		$order_items = $this->getOrderItems( $order );
		if ( empty( $order_items ) ) {
			return array();
		}
		$productIds = array();
		foreach ( $order_items as $item ) {
			$product_id = $item->get_product_id();
			$variant_id = $item->get_variation_id();
			$quantity   = $item->get_quantity();
			if ( $variant_id ) {
				$productId = $variant_id;
			} else {
				$productId = $product_id;
			}
			if ( isset( $productIds[ $productId ] ) ) {
				$productIds[ $productId ] = $productIds[ $productId ] + $quantity;
			} else {
				$productIds[ $productId ] = $quantity;
			}
		}

		return $productIds;
	}

	function getOrderItems( $order = null ) {
		if ( isset( $order ) && is_object( $order ) ) {
			return $order->get_items( 'line_item' );
		}
		if ( isset( $order ) && is_integer( $order ) && function_exists( 'wc_get_order' ) ) {
			return wc_get_order( $order )->get_items( 'line_item' );
		}

		return array();
	}

	function getOrderSubtotal( $order_data = null ) {
		$order    = $this->getOrder( $order_data );
		$subtotal = 0;
		if ( ! empty( $order ) && is_object( $order ) ) {
			$subtotal_tax = 0;
			if ( $this->isMethodExists( $order, 'get_subtotal' ) ) {
				$subtotal    = $order->get_subtotal();
				$base_helper = new Base();
				if ( $base_helper->isIncludingTax() ) {
					$order_items = $this->getOrderItems( $order );
					foreach ( $order_items as $item ) {
						//$subtotal += $item->get_subtotal();
						$subtotal_tax += wc_round_tax_total( $item->get_subtotal_tax() );
					}
				}
			}
			$subtotal = $subtotal + $subtotal_tax;
		}

		return apply_filters( 'wlr_get_order_subtotal', $subtotal, $order_data );
	}

	function getOrder( $order = null ) {
		if ( isset( $order ) && is_object( $order ) ) {
			return $order;
		}
		if ( isset( $order ) && is_integer( $order ) && function_exists( 'wc_get_order' ) ) {
			return wc_get_order( $order );
		}

		return null;
	}

	function getOrderId( $order = null ) {
		$order_obj = $this->getOrder( $order );
		if ( ! is_object( $order ) ) {
			return 0;
		}
		if ( ! $this->isMethodExists( $order_obj, 'get_id' ) ) {
			return 0;
		}

		return $order_obj->get_id();
	}

	function getOrderTotal( $order ) {
		if ( $this->isMethodExists( $order, 'get_total' ) ) {
			return apply_filters( 'wlr_get_order_total', $order->get_total(), $order );
		}

		return 0;
	}

	function getOrderItemsId( $order ) {
		$order_items    = $this->getOrderItems( $order );
		$order_items_id = array();
		if ( ! empty( $order_items ) ) {
			foreach ( $order_items as $item ) {
				$order_items_id[] = $this->getItemId( $item );
			}
		}

		return array_filter( $order_items_id );
	}

	function getItemId( $item ) {
		if ( $this->isMethodExists( $item, 'get_product_id' ) && $this->isMethodExists( $item, 'get_variation_id' ) ) {
			if ( $product_id = $item->get_variation_id() ) {
				return $product_id;
			} else {
				return $item->get_product_id();
			}
		}

		return null;
	}

	function getOrderStatus( $order = null ) {
		$order        = $this->getOrder( $order );
		$order_status = '';
		if ( ! empty( $order ) ) {
			if ( $this->isMethodExists( $order, 'get_status' ) ) {
				$order_status = $order->get_status();
			}
		}

		return $order_status;
	}

	function getSession( $key, $default = null ) {
		if ( function_exists( 'WC' ) ) {
			if ( isset( WC()->session ) && is_object( WC()->session ) && $this->isMethodExists( WC()->session, 'get' ) ) {
				return WC()->session->get( $key );
			}
		}

		return $default;
	}

	function setSession( $key, $data ) {
		if ( function_exists( 'WC' ) ) {
			if ( isset( WC()->session ) && is_object( WC()->session ) && $this->isMethodExists( WC()->session, 'set' ) ) {
				WC()->session->set( $key, $data );
			}
		}
	}

	function getProductAttributes( $product ) {
		if ( is_object( $product ) && $this->isMethodExists( $product, 'get_attributes' ) ) {
			return $product->get_attributes();
		}

		return array();
	}

	function getProductId( $product ) {
		if ( is_object( $product ) && $this->isMethodExists( $product, 'get_id' ) ) {
			return $product->get_id();
		} elseif ( isset( $product->id ) ) {
			$product_id = $product->id;
			if ( isset( $product->variation_id ) ) {
				$product_id = $product->variation_id;
			}

			return $product_id;
		} else {
			return null;
		}
	}

	function getAttributeVariation( $attribute ) {
		if ( $this->isMethodExists( $attribute, 'get_variation' ) ) {
			return $attribute->get_variation();
		}

		return true;
	}

	function getAttributeOption( $attribute ) {
		if ( $this->isMethodExists( $attribute, 'get_options' ) ) {
			return $attribute->get_options();
		}

		return array();
	}

	function getAttributeName( $attribute ) {
		if ( $this->isMethodExists( $attribute, 'get_name' ) ) {
			return $attribute->get_name();
		}

		return null;
	}

	function getProductCategories( $product ) {
		$categories = array();
		if ( $this->isMethodExists( $product, 'get_category_ids' ) ) {
			if ( $this->productTypeIs( $product, 'variation' ) ) {
				$parent_id = $this->getProductParentId( $product );
				$product   = $this->getProduct( $parent_id );
			}
			$categories = $product->get_category_ids();
		}

		return apply_filters( 'wlr_get_product_categories', $categories, $product );
	}

	function productTypeIs( $product, $type ) {
		if ( $this->isMethodExists( $product, 'is_type' ) ) {
			return $product->is_type( $type );
		}

		return false;
	}

	function getProductParentId( $product ) {
		$parent_id = 0;
		if ( is_int( $product ) ) {
			$product = $this->getProduct( $product );
		}
		if ( $this->isMethodExists( $product, 'get_parent_id' ) ) {
			$parent_id = $product->get_parent_id();
		}

		return apply_filters( 'wlr_rules_get_product_parent_id', $parent_id, $product );
	}

	function getProduct( $product_id ) {
		if ( ! empty( $product_id ) && is_object( $product_id ) ) {
			return $product_id;
		}
		if ( isset( self::$products[ $product_id ] ) ) {
			return self::$products[ $product_id ];
		} else if ( function_exists( 'wc_get_product' ) ) {
			self::$products[ $product_id ] = apply_filters( 'wlr_rules_get_wc_product', wc_get_product( $product_id ), $product_id );

			return self::$products[ $product_id ];
		}

		return false;
	}

	function getProductSku( $product ) {
		if ( $this->isMethodExists( $product, 'get_sku' ) ) {
			return $product->get_sku();
		}

		return null;
	}

	function isProductInSale( $product ) {
		$status = false;
		if ( $this->isMethodExists( $product, 'is_on_sale' ) && $this->isMethodExists( $product, 'get_sale_price' ) && $product->is_on_sale( '' ) && $product->get_sale_price() > 0 ) {
			$status = true;
		}

		return apply_filters( 'wlr_is_on_sale', $status, $product );
	}

	function getParentProduct( $product ) {
		if ( $this->productTypeIs( $product, 'variation' ) ) {
			$parent_id = $this->getProductParentId( $product );
			$product   = $this->getProduct( $parent_id );
		}

		return $product;
	}

	function getProductTags( $product ) {
		if ( $this->isMethodExists( $product, 'get_tag_ids' ) ) {
			return $product->get_tag_ids();
		}

		return array();
	}


	function combineProductArrays( $products, $additional_products ) {
		$products = array_merge( $products, $additional_products );
		$products = array_unique( $products );

		return $products;
	}

	public function add_to_cart( $product_id = 0, $quantity = 1, $variation_id = 0, $variation = array(), $cart_item_data = array() ) {
		if ( function_exists( 'WC' ) ) {
			if ( isset( WC()->cart ) && WC()->cart != null ) {
				if ( $this->isMethodExists( WC()->cart, 'add_to_cart' ) ) {
					return WC()->cart->add_to_cart( $product_id, $quantity, $variation_id, $variation, $cart_item_data );
				}
			}
		}

		return false;
	}

	public function remove_cart_item( $_cart_item_key ) {
		if ( function_exists( 'WC' ) ) {
			if ( isset( WC()->cart ) && WC()->cart != null ) {
				if ( $this->isMethodExists( WC()->cart, 'remove_cart_item' ) ) {
					return WC()->cart->remove_cart_item( $_cart_item_key );
				}
			}
		}

		return false;
	}

	public function get_cart_item( $cart_item_key ) {
		if ( function_exists( 'WC' ) ) {
			if ( isset( WC()->cart ) && WC()->cart != null ) {
				if ( $this->isMethodExists( WC()->cart, 'get_cart_item' ) ) {
					return WC()->cart->get_cart_item( $cart_item_key );
				}
			}
		}

		return false;
	}

	public function get_variant_ids( $product_id ) {
		$ids     = array();
		$product = $this->getProduct( $product_id );
		if ( $this->isMethodExists( $product, 'get_available_variations' ) ) {
			$variations = $product->get_available_variations();
			if ( ! empty( $variations ) ) {
				foreach ( $variations as $variation ) {
					$ids[] = $variation['variation_id'];
				}
			}
		}

		return $ids;
	}

	function get_loyalty_rest_url( $action_name, $blog_id = null ) {
		$base_route = '/flycart-loyalty/v1/action/';
		$path       = '';
		if ( empty( $action_name ) ) {
			return $path;
		}
		$path = $base_route . $action_name;

		return get_rest_url( $blog_id, $path );
	}

	function get_referral_code() {
		$ref_code = '';
		if ( isset( WC()->session ) && WC()->session !== null ) {
			$ref_code = WC()->session->get( 'wlr_referral_code', '' );
		}

		return $ref_code;
	}

	function set_referral_code( $referral_code ) {
		if ( isset( WC()->session ) && WC()->session !== null ) {
			WC()->session->set( 'wlr_referral_code', $referral_code );
		}
	}

	function initWoocommerceSession() {
		if ( ! $this->hasSession() && ! defined( 'DOING_CRON' ) ) {
			$this->setSessionCookie( true );
		}
	}

	function hasSession() {
		if ( ! isset( \WC()->session ) && class_exists( 'WC_Session_Handler' ) ) {
			\WC()->session = new \WC_Session_Handler();
			\WC()->session->init();
		}
		if ( $this->isMethodExists( WC()->session, 'has_session' ) ) {
			return WC()->session->has_session();
		}

		return false;
	}

	function setSessionCookie( $value ) {
		if ( $this->isMethodExists( WC()->session, 'set_customer_session_cookie' ) ) {
			WC()->session->set_customer_session_cookie( $value );
		}

		return true;
	}

	function current_offset() {
		$timezone  = new DateTimeZone( $this->get_wp_time_zone() );
		$origin_dt = new DateTime( "now", $timezone );

		$init  = $origin_dt->getOffset();
		$hours = floor( $init / 3600 );
		$sign  = '';
		if ( $hours >= 0 ) {
			$sign = '+';
		}
		$minutes = floor( ( $init / 60 ) % 60 );
		$offset  = $sign . sprintf( "%02d", $hours ) . ':' . sprintf( "%02d", $minutes );

		return $offset;
	}

	function isJson( $string ) {
		json_decode( $string );

		return ( json_last_error() == JSON_ERROR_NONE );
	}

	function _log( $message ) {
		$options    = $this->getOptions( 'wlr_settings' );
		$debug_mode = is_array( $options ) && isset( $options['debug_mode'] ) && ! empty( $options['debug_mode'] ) ? $options['debug_mode'] : 'no';
		if ( $debug_mode == 'yes' && class_exists( 'WC_Logger' ) ) {
			$logger = new \WC_Logger();
			if ( $this->isMethodExists( $logger, 'add' ) ) {
				$logger->add( 'Loyalty', $message );
			}
		}
	}

	function getOptions( $key = '', $default = '' ) {
		if ( empty( $key ) ) {
			return array();
		}
		if ( ! isset( self::$options[ $key ] ) || empty( self::$options[ $key ] ) ) {
			self::$options[ $key ] = get_option( $key, $default );
		}

		return self::$options[ $key ];
	}

	function isValidCoupon( $coupon_code ) {
		if ( class_exists( 'WC_Coupon' ) ) {
			$coupon = new \WC_Coupon( $coupon_code );
			if ( $this->isMethodExists( $coupon, 'is_valid' ) ) {
				return $coupon->is_valid();
			}
		}

		return false;
	}

	function hasDiscount( $discount_code ) {
		$cart = $this->getCart();
		if ( empty( $discount_code ) || empty( $cart ) ) {
			return false;
		}
		if ( $this->isMethodExists( $cart, 'has_discount' ) ) {
			return $cart->has_discount( $discount_code );
		}

		return false;
	}

	/**
	 * Get cart applied coupons.
	 *
	 * @return array
	 */
	function getAppliedCoupons() {
		$cart = $this->getCart();
		if ( empty( $cart ) ) {
			return [];
		}
		if ( $this->isMethodExists( $cart, 'get_applied_coupons' ) ) {
			return $cart->get_applied_coupons();
		}

		return [];
	}

	function getProductPrice( $product, $item = null, $is_redeem = false, $orderCurrency = '' ) {
		$productPrice = 0;
		$base_helper  = new Base();
		if ( is_null( $item ) && is_object( $product ) ) {
			$productPrice = method_exists( $product, 'get_price' ) ? $product->get_price( 'edit' ) : 0;

			if ( wc_tax_enabled() && 'taxable' === $product->get_tax_status() ) {
				if ( ! $base_helper->isIncludingTax() ) {
					$productPrice = wc_get_price_excluding_tax( $product, array(
						'qty'   => 1,
						'price' => $productPrice
					) );
				} elseif ( $base_helper->isIncludingTax() ) {
					$productPrice = wc_get_price_including_tax( $product, array(
						'qty'   => 1,
						'price' => $productPrice
					) );
				}
			}
			$productPrice = apply_filters( 'wlr_default_product_price', $productPrice, $product, $item, $is_redeem, $orderCurrency );
		} elseif ( is_object( $item ) ) {
			$itemData = method_exists( $item, 'get_data' ) ? $item->get_data() : array();
			$quantity = method_exists( $item, 'get_quantity' ) ? $item->get_quantity() : 1;
			if ( ! $base_helper->isIncludingTax() && isset( $itemData['subtotal'] ) ) {
				$productPrice = ( $itemData['subtotal'] ) / $quantity;
			} else if ( isset( $itemData['subtotal'] ) && isset( $itemData['subtotal_tax'] ) ) {
				$productPrice = ( $itemData['subtotal'] + $itemData['subtotal_tax'] ) / $quantity;
			}
			$productPrice = apply_filters( 'wlr_product_price', $productPrice, $item, $is_redeem, $orderCurrency );
		}

		return $productPrice;
	}

	function getCurrentCurrency( $currency = '' ) {
		$currency = empty( $currency ) ? get_woocommerce_currency() : $currency;

		return apply_filters( 'wlr_current_currency', $currency );
	}

	function getCurrentLanguage( $lang = '' ) {
		if ( empty( $lang ) ) {
			$lang = get_locale();
		}
		$wpml_lang = apply_filters( 'wpml_current_language', null );
		if ( ! empty( $wpml_lang ) ) {
			$lang = $wpml_lang;
		}

		return apply_filters( 'wlr_current_language', $lang );
	}

	function getProductIdBasedOnCurrentLanguage( $prod_id, $lang ) {
		$current_lang = $this->getCurrentLanguage();
		if ( $current_lang != $lang ) {
			return $prod_id;
		}
		$wpml_prod_id = apply_filters( 'translate_object_id', $prod_id, 'product', false, $current_lang );
		if ( $prod_id != $wpml_prod_id ) {
			$prod_id = $wpml_prod_id;
		}

		return $prod_id;
	}

	function getOrderLanguage( $order_id ) {
		$order_language = "";
		if ( $order_id > 0 ) {
			$wlr_language = $this->getOrderMetaData( $order_id, '_wlr_order_language' );
			if ( ! empty( $wlr_language ) ) {
				$order_language = $wlr_language;
			}
		}
		if ( empty( $order_language ) ) {
			$order_language = $this->getPluginBasedOrderLanguage( $order_id );
		}

		return apply_filters( 'wlr_order_language', $order_language, $order_id );
	}

	function getOrderMetaData( $order_id, $meta_key, $default_value = '' ) {
		if ( $order_id <= 0 || empty( $meta_key ) ) {
			return $default_value;
		}
		if ( $this->isHPOSEnabled() ) {
			$order = wc_get_order( $order_id );

			return $order->get_meta( $meta_key );
		}

		return get_post_meta( $order_id, $meta_key, true );
	}

	function isHPOSEnabled() {
		if ( ! class_exists( '\Automattic\WooCommerce\Utilities\OrderUtil' ) ) {
			return false;
		}
		if ( \Automattic\WooCommerce\Utilities\OrderUtil::custom_orders_table_usage_is_enabled() ) {
			return true;
		}

		return false;
	}

	function isBannedUser( $user_email = "" ) {
		if ( empty( $user_email ) ) {
			$user_email = $this->get_login_user_email();
			if ( empty( $user_email ) ) {
				return false;
			}
		}
		$user    = get_user_by( 'email', $user_email );
		$user_id = isset( $user->ID ) && ! empty( $user->ID ) ? $user->ID : 0;
		if ( ! apply_filters( 'wlr_before_add_to_loyalty_customer', true,
			$user_id, $user_email ) ) {
			return true;
		}
		if ( isset( static::$banned_user[ $user_email ] ) ) {
			return static::$banned_user[ $user_email ];
		}
		$user_modal = new Users();
		global $wpdb;
		$where = $wpdb->prepare( "user_email = %s AND is_banned_user = %d ", array( $user_email, 1 ) );
		$user  = $user_modal->getWhere( $where, "*", true );

		return static::$banned_user[ $user_email ] = ( ! empty( $user ) && is_object( $user ) && isset( $user->is_banned_user ) );
	}

	function getPluginBasedOrderLanguage( $order_id ) {
		$order_language = "";
		if ( ! empty( $order_id ) && $order_id > 0 ) {
			// get language from WPML language
			$language = $this->getOrderMetaData( $order_id, 'wpml_language' );
			if ( $language !== false && $language != '' ) {
				if ( function_exists( 'icl_get_languages' ) ) {
					$languages = icl_get_languages();
					if ( isset( $languages[ $language ] ) ) {
						if ( isset( $languages[ $language ]['default_locale'] ) ) {
							$order_language = $languages[ $language ]['default_locale'];
						}
					}
				}
			}
			if ( empty( $language ) ) {
				$order_language = $this->getOrderMetaData( $order_id, 'trp_language' );
			}
		}
		if ( empty( $order_language ) ) {
			$order_language = get_locale();
		}

		return $order_language;
	}

	function getOrdersThroughWPQuery( $args = array() ) {
		if ( ! is_array( $args ) ) {
			$args = array();
		}
		$default_args = array(
			'posts_per_page' => - 1,
			'post_type'      => $this->getOrderPostType(),
			'post_status'    => array_keys( $this->getOrderStatusList() ),
			'orderby'        => 'ID',
			'order'          => 'DESC'
		);
		$args         = array_merge( $default_args, $args );
		$query        = new \WP_Query( $args );

		return apply_filters( 'wlr_orders_through_wp_query', $query->get_posts(), $query, $args );
	}

	function getOrderPostType( $key_only = false ) {
		if ( function_exists( 'wc_get_order_types' ) ) {
			if ( $key_only ) {
				return array_keys( wc_get_order_types() );
			}

			return wc_get_order_types();
		}

		return null;
	}

	function getOrderStatusList() {
		if ( function_exists( 'wc_get_order_statuses' ) ) {
			return wc_get_order_statuses();
		}

		return array();
	}

	function getOrdersThroughWCOrderQuery( $args ) {
		if ( ! is_array( $args ) ) {
			$args = array();
		}
		$default_args = array(
			'limit'   => - 1,
			'type'    => $this->getOrderPostType(),
			'status'  => array_keys( $this->getOrderStatusList() ),
			'orderby' => 'ID',
			'order'   => 'DESC'
		);
		$args         = array_merge( $default_args, $args );

		return apply_filters( 'wlr_orders_through_wc_order_query', wc_get_orders( $args ), $args );
	}

	function changeToQueryStatus( $status_list ) {
		if ( is_array( $status_list ) && ! empty( $status_list ) ) {
			foreach ( $status_list as &$status ) {
				if ( ! ( substr( $status, 0, 3 ) == 'wc-' ) ) {
					$status = 'wc-' . $status;
				}
			}
		}

		return $status_list;
	}

	function generateCustomPOTFile( $translate_strings = array(), $project_title = "WPLoyalty - Dynamic content", $file_name = "wployalty_custom.pot", $text_domain = "wp-loyalty-rules" ) {
		if ( empty( $translate_strings ) || ! is_array( $translate_strings ) ) {
			return false;
		}
		$file_path = WLR_PLUGIN_PATH . 'i18n/languages/' . $file_name;
		$text      = "#\n";
		$text      .= "msgid \"\"\n";
		$text      .= "msgstr \"\"\n";
		$text      .= $this->getPOTFirstString( $project_title, $text_domain );
		$text      .= "\n";
		foreach ( $translate_strings as $key => $value ) {
			$key   = addslashes( $key );
			$value = addslashes( $value );
			$text  .= "\n";
			$text  .= "msgid \"$key\"\n";
			$text  .= "msgstr \"$value\"\n";
		}
		file_put_contents( $file_path, $text );

		return true;
	}

	function getPOTFirstString( $project_title = "", $text_domain = 'wp-loyalty-rules' ) {
		if ( empty( $project_title ) ) {
			return "";
		}
		$version      = WLR_PLUGIN_VERSION;
		$timezone     = new DateTimeZone( 'UTC' );
		$current_time = new DateTime( 'now', $timezone );
		$current_date = $current_time->format( 'Y-m-d H:iO' );
		$first_string = array(
			"Project-Id-Version: {$project_title} {$version}\\n",
			"Report-Msgid-Bugs-To: \\n",
			"Last-Translator: WPLoyalty\\n",
			"Language-Team: WPLoyalty\\n",
			"MIME-Version: 1.0\\n",
			"Content-Type: text/plain; charset=UTF-8\\n",
			"Content-Transfer-Encoding: 8bit\\n",
			"POT-Creation-Date: {$current_date}\\n",
			"PO-Revision-Date: \\n",
			"X-Domain: {$text_domain}\\n",
			"X-Poedit-KeywordsList: __;_e;_n;_x;esc_attr__;esc_attr_e;esc_attr_x;esc_html__;esc_html_e;esc_html_x\\n",
			"X-Poedit-Basepath: ../..\\n",
		);

		return '"' . implode( "\"\n\"", $first_string ) . '"';
	}

	public static function getDirFileLists( $folder = '', $levels = 100, $exclusions = array() ) {
		if ( empty( $folder ) ) {
			return false;
		}

		$folder = trailingslashit( $folder );

		if ( ! $levels ) {
			return false;
		}

		$files = array();

		$dir = @opendir( $folder );

		if ( $dir ) {
			while ( ( $file = readdir( $dir ) ) !== false ) {
				// Skip current and parent folder links.
				if ( in_array( $file, array( '.', '..' ), true ) ) {
					continue;
				}

				// Skip hidden and excluded files.
				if ( '.' === $file[0] || in_array( $file, $exclusions, true ) ) {
					continue;
				}

				if ( is_dir( $folder . $file ) ) {
					$files2 = list_files( $folder . $file, $levels - 1 );
					if ( $files2 ) {
						$files = array_merge( $files, $files2 );
					} else {
						$files[] = $folder . $file . '/';
					}
				} else {
					$files[] = $folder . $file;
				}
			}

			closedir( $dir );
		}

		return $files;
	}

	function getVariantsOfProducts( $product_ids ) {
		$variants = array();
		if ( ! empty( $product_ids ) ) {
			foreach ( $product_ids as $product_id ) {
				$product = $this->getProduct( $product_id );
				if ( ! empty( $product ) && is_object( $product ) && method_exists( $product, 'is_type' ) ) {
					if ( $product->is_type( array( 'variable', 'variable-subscription' ) ) ) {
						$additional_variants = $this->getProductChildren( $product );
						if ( ! empty( $additional_variants ) && is_array( $additional_variants ) ) {
							$variants = array_merge( $variants, $additional_variants );
						}
					}
				}
			}
		}

		return $variants;
	}

	function getProductChildren( $product ) {
		if ( ! empty( $product ) ) {
			if ( is_object( $product ) && method_exists( $product, 'get_children' ) ) {
				return $product->get_children();
			}
		}

		return array();
	}

	function getCustomPrice( $amount, $with_symbol = true, $currency = '' ) {
		$currency        = $this->getDefaultWoocommerceCurrency( $currency );
		$original_amount = $amount;
		if ( $with_symbol ) {
			$currency_symbol = $this->getCurrencySymbols( $currency );
			$amount          = number_format( $amount, wc_get_price_decimals(), wc_get_price_decimal_separator(), wc_get_price_thousand_separator() );
			$price_format    = get_woocommerce_price_format();
			$formatted_price = sprintf( $price_format, '<span class="woocommerce-Price-currencySymbol">' . $currency_symbol . '</span>', $amount );
			$amount          = '<span class="woocommerce-Price-amount amount"><bdi>' . $formatted_price . '</bdi></span>';
		}

		return apply_filters( 'wlr_custom_price_convert', $amount, $original_amount, $with_symbol, $currency );
	}

	function convertPrice( $amount, $with_symbol = true, $currency = '' ) {
		$original_currency = $currency;
		$original_amount   = $amount;
		if ( $with_symbol ) {
			$currency_symbol = $this->getCurrencySymbols( $original_currency );
			$amount          = number_format( $amount, wc_get_price_decimals(), wc_get_price_decimal_separator(), wc_get_price_thousand_separator() );
			$price_format    = get_woocommerce_price_format();
			$formatted_price = sprintf( $price_format, '<span class="woocommerce-Price-currencySymbol">' . $currency_symbol . '</span>', $amount );
			$amount          = '<span class="woocommerce-Price-amount amount"><bdi>' . $formatted_price . '</bdi></span>';
		}

		return apply_filters( 'wlr_custom_price_convert', $amount, $original_amount, $with_symbol, $original_currency );
	}

	function getDefaultWoocommerceCurrency( $currency = '' ) {
		if ( empty( $currency ) ) {
			$currency = get_woocommerce_currency();
		}

		return apply_filters( 'wlr_custom_default_currency', $currency );
	}

	/* HPOS*/

	function getCurrencySymbols( $currency = '' ) {
		if ( empty( $currency ) ) {
			return $currency;
		}
		$symbols = get_woocommerce_currency_symbols();

		return isset( $symbols[ $currency ] ) ? $symbols[ $currency ] : '';
	}

	function getDisplayCurrency( $currency = '' ) {
		if ( empty( $currency ) ) {
			$currency = get_woocommerce_currency();
		}

		return apply_filters( 'wlr_custom_display_currency', $currency );
	}

	function updateOrderMetaData( $order_id, $meta_key, $value ) {
		if ( $order_id <= 0 || empty( $meta_key ) ) {
			return;
		}
		if ( $this->isHPOSEnabled() ) {
			$order = wc_get_order( $order_id );
			$order->update_meta_data( $meta_key, $value );
			$order->save();
		} else {
			update_post_meta( $order_id, $meta_key, $value );
		}
	}

	function getOrderLink( $order_id, $is_admin_side = true ) {
		if ( $order_id <= 0 ) {
			return '';
		}
		if ( $this->isHPOSEnabled() ) {
			$url = admin_url( 'admin.php?' . http_build_query( array(
					'page'   => 'wc-orders',
					'id'     => $order_id,
					'action' => 'edit'
				) ) );
		} else {
			$url = admin_url( 'post.php?' . http_build_query( array( 'post' => $order_id, 'action' => 'edit' ) ) );
		}

		return $url;
	}

	function getOrderEmail( $order ) {
		$user_email = '';
		if ( $this->isMethodExists( $order, 'get_billing_email' ) ) {
			$user_email = sanitize_email( $order->get_billing_email() );
		}

		return apply_filters( 'wlr_order_email', $user_email, $order );
	}

	function numberFormatI18n( $point ) {
		if ( $point <= 0 ) {
			return $point;
		}

		return apply_filters( 'wlr_handle_number_format_i18n', number_format_i18n( $point ), $point );
	}

	function canShowBirthdateField() {
		$setting_option             = $this->getOptions( 'wlr_settings' );
		$is_one_time_birthdate_edit = is_array( $setting_option ) && isset( $setting_option['is_one_time_birthdate_edit'] ) && in_array( $setting_option['is_one_time_birthdate_edit'], array(
			'no',
			'yes'
		) ) ? $setting_option['is_one_time_birthdate_edit'] : 'no';
		$show_birthdate             = true;
		if ( $is_one_time_birthdate_edit == 'no' ) {
			$user_email           = $this->get_login_user_email();
			$earn_campaign_helper = EarnCampaign::getInstance();
			$user                 = $earn_campaign_helper->getPointUserByEmail( $user_email );
			$birthday_date        = is_object( $user ) && isset( $user->birthday_date ) && ! empty( $user->birthday_date ) && $user->birthday_date != '0000-00-00' ? $user->birthday_date : ( is_object( $user ) && isset( $user->birth_date ) && ! empty( $user->birth_date ) ? $this->beforeDisplayDate( $user->birth_date, "Y-m-d" ) : '' );
			if ( ! empty( $birthday_date ) && $birthday_date != '0000-00-00' ) {
				$show_birthdate = false;
			}
		}

		return $show_birthdate;
	}

	function checkStatusNewRewardSection() {
		$setting      = $this->getOptions( 'wlr_new_rewards_section_enabled', '' );
		$template_dir = get_template_directory();
		$check        = ( file_exists( $template_dir . '/my_account_reward.php' ) || ( file_exists( $template_dir . '/cart_page_rewards.php' ) )
		                  || ( file_exists( $template_dir . '/customer_page.php' ) ) || ( file_exists( $template_dir . '/cart_page.php' ) ) );
		$status       = false;
		if ( empty( $setting ) && ! $check ) {
			$compare = version_compare( WLR_PLUGIN_VERSION, '1.2.4', '>=' );
			if ( $compare ) {
				update_option( 'wlr_new_rewards_section_enabled', 'yes' );
				$status = true;
			}
		}
		if ( empty( $setting ) && $check ) {
			$status = false;
		}
		if ( in_array( $setting, array( 'yes', 'no' ) ) ) {
			$status = true;
		}

		return $status;
	}

	function renameTemplateOverwritedFiles( $templates = array() ) {
		if ( empty( $templates ) || ! is_array( $templates ) ) {
			return array();
		}
		$renamed_files = $failed_rename = array();
		global $wp_filesystem;

		if ( ! function_exists( 'WP_Filesystem' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		WP_Filesystem(); // Initialize
		foreach ( $templates as $template ) {
			$overwritten_template_path = get_stylesheet_directory() . '/' . $template;
			if ( file_exists( $overwritten_template_path ) ) {
				$new_name = str_replace( '.php', '.old.php', basename( $overwritten_template_path ) );
				$new_path = dirname( $overwritten_template_path ) . '/' . $new_name;
				if ( $wp_filesystem->move( $overwritten_template_path, $new_path ) ) {
					$renamed_files[] = array(
						'file_name' => $template,
						'new_name'  => $new_name,
					);
				} else {
					$current_permissions = fileperms( $overwritten_template_path );
					if ( $wp_filesystem->chmod( $overwritten_template_path, 0777 ) ) {
						if ( $wp_filesystem->move( $overwritten_template_path, $new_path ) ) {
							$renamed_files[] = array(
								'file_name' => $template,
								'new_name'  => $new_name,
							);
						} else {
							$wp_filesystem->chmod( $overwritten_template_path, $current_permissions );
							$failed_rename[] = array(
								'file_name' => $template
							);
						}
					} else {
						// Failed to change permissions
						$failed_rename[] = array( 'file_name' => $template );
					}
				}
			}
		}

		return array( 'success_files' => $renamed_files, 'failed_files' => $failed_rename );
	}

	public static function isBlockEnabled() {
		$compat_check        = new CompatibleCheck();
		$woocommerce_version = $compat_check->woo_version();
		if ( ! version_compare( $woocommerce_version, '8.3.0', '>=' ) ) {
			return false;
		}

		return true;
	}

	public static function isCartBlock() {
		if ( ! self::isBlockEnabled() ) {
			return false;
		}
		$page_id = wc_get_page_id( 'cart' );

		return ( ! empty( $page_id ) && \WC_Blocks_Utils::has_block_in_page( $page_id, 'woocommerce/cart' ) ) || CartCheckoutUtils::is_cart_block_default();
	}

	public static function isCheckoutBlock() {
		if ( ! self::isBlockEnabled() ) {
			return false;
		}
		$page_id = wc_get_page_id( 'checkout' );

		return ( ! empty( $page_id ) && \WC_Blocks_Utils::has_block_in_page( $page_id, 'woocommerce/checkout' ) ) || CartCheckoutUtils::is_cart_block_default();
	}

	/**
	 * Add a schedule for a hook.
	 *
	 * @param string $hook The hook name to schedule.
	 * @param string $time Optional. The time to start the schedule. Default is '+1 hours'.
	 * @param string $recurrence Optional. The recurrence of the schedule. Default is 'hourly'.
	 *
	 * @return void
	 */
	public static function addSchedule( $hook, $time = '+1 hours', $recurrence = 'hourly' ) {
		if ( empty( $hook ) || ! is_string( $hook ) ) {
			return;
		}
		if ( false === wp_next_scheduled( $hook ) ) {
			$scheduled_time = strtotime( $time, current_time( 'timestamp' ) );
			wp_schedule_event( $scheduled_time, $recurrence, $hook );
		}
	}

	/**
	 * Adds a One-Time schedule for a hook.
	 *
	 * @param string $hook The hook name to schedule.
	 * @param array $args The arguments to be passed to the schedule.
	 * @param string $time Optional. The time ahead for the schedule. Default is 1 hour.
	 *
	 * @return void
	 */
	public static function addOneTimeSchedule( $hook, $args = [], $time = '+1 hours' ) {

		if ( empty( $hook ) || ! is_string( $hook ) ) {
			return;
		}
		if ( false === as_next_scheduled_action( $hook, $args ) ) {
			as_schedule_single_action( strtotime( $time ), $hook, $args );
		}
	}

	/**
	 * Removes a scheduled event.
	 *
	 * @param string $hook The unique identifier for the scheduled event.
	 *
	 * @return void
	 */
	public static function removeSchedule( $hook ) {
		if ( empty( $hook ) || ! is_string( $hook ) ) {
			return;
		}
		$next_scheduled = wp_next_scheduled( $hook );
		if ( $next_scheduled ) {
			wp_unschedule_event( $next_scheduled, $hook );
		}

	}
}