<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Conditions;

use Wlr\App\Conditions\Base;

defined( 'ABSPATH' ) or die();

class LifeTimeSaleValue extends Base {
	protected static $cache_purchase_order_value = array();

	function __construct() {
		parent::__construct();
		$this->name  = 'life_time_sale_value';
		$this->label = __( 'Life Time Sale value', 'wp-loyalty-rules' );
		$this->group = __( 'Cart', 'wp-loyalty-rules' );
	}

	public function isProductValid( $options, $data ) {
		return $this->check( $options, $data );
	}
	
	public function check( $options, $data ) {
		$billing_email = isset( $data['user_email'] ) && ! empty( $data['user_email'] ) ? $data['user_email'] : '';
		$status        = false;
		if ( ! empty( $billing_email ) ) {
			$operator          = sanitize_text_field( $options->operator );
			$value             = $options->value;
			$is_calculate_base = isset( $data['is_calculate_based'] ) && ! empty( $data['is_calculate_based'] ) ? $data['is_calculate_based'] : '';
			$cache_key         = $this->generateBase64Encode( $options );
			$order_amount      = 0;
			if ( isset( self::$cache_purchase_order_value[ $cache_key ] ) ) {
				$order_amount = self::$cache_purchase_order_value[ $cache_key ];
			} else if ( ! empty( $is_calculate_base ) && isset( $data[ $is_calculate_base ] ) ) {
				if ( self::$woocommerce_helper->isHPOSEnabled() ) {
					$args = array(
						'limit'         => - 1,
						'billing_email' => $billing_email
					);
					if ( $is_calculate_base === 'order' && ! empty( $data[ $is_calculate_base ] ) ) {
						$current_order       = self::$woocommerce_helper->getOrder( $data[ $is_calculate_base ] );
						$args['field_query'] = array(
							array(
								'field'   => 'id',
								'value'   => array( self::$woocommerce_helper->getOrderId( $current_order ) ),
								'compare' => 'NOT IN'
							)
						);
					}
					if ( isset( $options->order_status ) && is_array( $options->order_status ) && ! empty( $options->order_status ) ) {
						$args['status'] = self::$woocommerce_helper->changeToQueryStatus( $options->order_status );
					}
					$orders = self::$cache_purchase_order_value[ $cache_key ] = self::$woocommerce_helper->getOrdersThroughWCOrderQuery( $args );
					if ( ! empty( $orders ) ) {
						foreach ( $orders as $order ) {
							if ( ! empty( $order ) && is_object( $order ) && self::$woocommerce_helper->isMethodExists( $order, 'get_id' ) ) {
								$order_obj    = self::$woocommerce_helper->getOrder( $order->get_id() );
								$order_amount += self::$woocommerce_helper->getOrderTotal( $order_obj );
							}
						}
					}

				} else {
					$args = [
						'posts_per_page' => - 1,
						//phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
						'meta_query'     => [
							[ 'key' => '_billing_email', 'value' => $billing_email, 'compare' => '=' ]
						]
					];
					if ( $is_calculate_base === 'order' && ! empty( $data[ $is_calculate_base ] ) ) {
						$current_order = self::$woocommerce_helper->getOrder( $data[ $is_calculate_base ] );
						//phpcs:ignore WordPressVIPMinimum.Performance.WPQueryParams.PostNotIn_post__not_in
						$args['post__not_in'] = array( self::$woocommerce_helper->getOrderId( $current_order ) );
					}
					if ( isset( $options->order_status ) && is_array( $options->order_status ) && ! empty( $options->order_status ) ) {
						$args['post_status'] = self::$woocommerce_helper->changeToQueryStatus( $options->order_status );
					}
					$orders = self::$cache_purchase_order_value[ $cache_key ] = self::$woocommerce_helper->getOrdersThroughWPQuery( $args );
					if ( ! empty( $orders ) ) {
						foreach ( $orders as $order ) {
							if ( ! empty( $order ) && isset( $order->ID ) ) {
								$order_obj    = self::$woocommerce_helper->getOrder( $order->ID );
								$order_amount += self::$woocommerce_helper->getOrderTotal( $order_obj );
							}
						}
					}
				}
				self::$cache_purchase_order_value[ $cache_key ] = $order_amount;
			}
			$status = $this->doComparisionOperation( $operator, $order_amount, $value );
		}

		return $status;
	}

	protected function getLifeTimeSaleValue( $email, $order_status ) {
		$total = 0;
		if ( empty( $email ) || empty( $order_status ) ) {
			return $total;
		}
		$orders = wc_get_orders( array( 'billing_email' => $email, 'status' => $order_status, 'limit' => - 1 ) );
		foreach ( $orders as $order ) {
			$total += apply_filters( 'wlr_life_time_sale_value_order_total', self::$woocommerce_helper->getOrderTotal( $order ), $order );
		}

		return $total;
	}

}