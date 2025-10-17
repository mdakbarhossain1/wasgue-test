<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Conditions;
defined( 'ABSPATH' ) or die();

use Wlr\App\Conditions\Base;

class PurchasePreviousOrdersForSpecificProduct extends Base {
	protected static $cache_order_count = array();

	public function __construct() {
		parent::__construct();
		$this->name  = 'purchase_previous_orders_for_specific_product';
		$this->label = __( 'Number of orders made with following products', 'wp-loyalty-rules' );
		$this->group = __( 'Purchase History', 'wp-loyalty-rules' );
	}

	public function isProductValid( $options, $data ) {
		return $this->check( $options, $data );
	}

	function check( $options, $data ) {
		if ( isset( $options->operator ) && isset( $options->time ) && isset( $options->value ) && $options->value >= 0 && isset( $options->products ) && is_array( $options->products ) && ! empty( $options->products ) ) {
			$billing_email = isset( $data['user_email'] ) && ! empty( $data['user_email'] ) ? $data['user_email'] : '';
			if ( ! empty( $billing_email ) ) {
				$is_calculate_base = isset( $data['is_calculate_based'] ) && ! empty( $data['is_calculate_based'] ) ? $data['is_calculate_based'] : '';
				$products          = $this->getProductFromSettings( $options->products );
				$products          = $this->getProductValues( $products );
				$cache_key         = $this->generateBase64Encode( $options );
				$order_count       = 0;
				if ( isset( self::$cache_order_count[ $cache_key ] ) ) {
					$order_count = self::$cache_order_count[ $cache_key ];
				} else if ( ! empty( $is_calculate_base ) && isset( $data[ $is_calculate_base ] ) ) {
					if ( self::$woocommerce_helper->isHPOSEnabled() ) {
						$args = array(
							'billing_email' => $billing_email,
						);
						if ( isset( $options->status ) && is_array( $options->status ) && ! empty( $options->status ) ) {
							$args['status'] = self::$woocommerce_helper->changeToQueryStatus( $options->status );
						}
						if ( $options->time != "all_time" ) {
							$args['date_query'] = array( 'after' => $this->getDateByString( $options->time, 'Y-m-d' ) . ' 00:00:00' );
						}
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
						$orders = self::$woocommerce_helper->getOrdersThroughWCOrderQuery( $args );
						if ( ! empty( $orders ) ) {
							foreach ( $orders as $order ) {
								if ( ! empty( $order ) && is_object( $order ) && self::$woocommerce_helper->isMethodExists( $order, 'get_id' ) ) {
									$order_obj = self::$woocommerce_helper->getOrder( $order->get_id() );
									$keys      = self::$woocommerce_helper->getOrderItemsId( $order_obj );
									if ( $count = count( array_intersect( $products, $keys ) ) ) {
										$order_count += $count;
									}
								}
							}
						}
					} else {
						$args = [
							'meta_query' => [//phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
								[ 'key' => '_billing_email', 'value' => $billing_email, 'compare' => '=' ]
							]
						];
						if ( isset( $options->status ) && is_array( $options->status ) && ! empty( $options->status ) ) {
							$args['post_status'] = self::$woocommerce_helper->changeToQueryStatus( $options->status );
						}
						if ( $options->time != "all_time" ) {
							$args['date_query'] = array( 'after' => $this->getDateByString( $options->time, 'Y-m-d' ) . ' 00:00:00' );
						}
						if ( $is_calculate_base === 'order' && ! empty( $data[ $is_calculate_base ] ) ) {
							$current_order = self::$woocommerce_helper->getOrder( $data[ $is_calculate_base ] );
							//phpcs:ignore WordPressVIPMinimum.Performance.WPQueryParams.PostNotIn_post__not_in
							$args['post__not_in'] = array( self::$woocommerce_helper->getOrderId( $current_order ) );
						}
						$orders = self::$woocommerce_helper->getOrdersThroughWPQuery( $args );
						if ( ! empty( $orders ) ) {

							foreach ( $orders as $order ) {
								if ( ! empty( $order ) && isset( $order->ID ) ) {
									$order_obj = self::$woocommerce_helper->getOrder( $order->ID );
									$keys      = self::$woocommerce_helper->getOrderItemsId( $order_obj );
									if ( $count = count( array_intersect( $products, $keys ) ) ) {
										$order_count += $count;
									}
								}
							}
						}
					}
					self::$cache_order_count[ $cache_key ] = $order_count;
				}

				return $this->doComparisionOperation( $options->operator, $order_count, $options->value );
			}
		}

		return false;
	}
}