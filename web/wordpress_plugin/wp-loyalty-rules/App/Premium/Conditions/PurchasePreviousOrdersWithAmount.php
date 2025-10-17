<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Conditions;
defined( 'ABSPATH' ) or die();

use Automattic\WooCommerce\Utilities\OrderUtil;
use Wlr\App\Conditions\Base;

class PurchasePreviousOrdersWithAmount extends Base {
	protected static $cache_order_with_amount_count = array();

	public function __construct() {
		parent::__construct();
		$this->name  = 'purchase_previous_orders_with_amount';
		$this->label = __( 'Number of orders with order value or count', 'wp-loyalty-rules' );
		$this->group = __( 'Purchase History', 'wp-loyalty-rules' );
	}

	public function isProductValid( $options, $data ) {
		return $this->check( $options, $data );
	}

	function check( $options, $data ) {
		if ( isset( $options->operator ) && isset( $options->time ) && isset( $options->value ) && $options->value >= 0 ) {
			$billing_email = isset( $data['user_email'] ) && ! empty( $data['user_email'] ) ? $data['user_email'] : '';
			if ( ! empty( $billing_email ) ) {
				$is_calculate_base = isset( $data['is_calculate_based'] ) && ! empty( $data['is_calculate_based'] ) ? $data['is_calculate_based'] : '';
				$cache_key         = $this->generateBase64Encode( $options );
				$order_count       = 0;
				if ( isset( self::$cache_order_with_amount_count[ $cache_key ] ) ) {
					$order_count = self::$cache_order_with_amount_count[ $cache_key ];
				} else if ( ! empty( $is_calculate_base ) && isset( $data[ $is_calculate_base ] ) ) {
					if ( OrderUtil::custom_orders_table_usage_is_enabled() ) {
						$args        = array(
							'billing_email' => $billing_email,
						);
						$field_query = array();
						if ( isset( $options->min_amount ) && ! empty( $options->min_amount ) && $options->min_amount > 0 ) {
							$field_query[] = array(
								'field'   => 'total',
								'value'   => $options->min_amount,
								'compare' => ">=",
								'type'    => 'DECIMAL'
							);
						}
						if ( isset( $options->max_amount ) && ! empty( $options->max_amount ) && $options->max_amount > 0 ) {
							$field_query[] = array(
								'field'   => 'total',
								'value'   => $options->max_amount,
								'compare' => "<=",
								'type'    => 'DECIMAL'
							);
						}
						if ( $is_calculate_base === 'order' && ! empty( $data[ $is_calculate_base ] ) ) {
							$current_order = self::$woocommerce_helper->getOrder( $data[ $is_calculate_base ] );
							$field_query[] = array(
								array(
									'field'   => 'id',
									'value'   => array( self::$woocommerce_helper->getOrderId( $current_order ) ),
									'compare' => 'NOT IN'
								)
							);
						}
						if ( $field_query ) {
							$args['field_query'] = $field_query;
						}
						if ( isset( $options->status ) && is_array( $options->status ) && ! empty( $options->status ) ) {
							$args['status'] = self::$woocommerce_helper->changeToQueryStatus( $options->status );
						}
						if ( $options->time != "all_time" ) {
							$args['date_query'] = array( 'after' => $this->getDateByString( $options->time, 'Y-m-d' ) . ' 00:00:00' );
						}
						$orders = self::$woocommerce_helper->getOrdersThroughWCOrderQuery( $args );
					} else {
						$meta_keys = array(
							array( 'key' => '_billing_email', 'value' => $billing_email, 'compare' => '=' )
						);
						if ( isset( $options->min_amount ) && ! empty( $options->min_amount ) && $options->min_amount > 0 ) {
							$meta_keys[] = array(
								'key'     => '_order_total',
								'value'   => $options->min_amount,
								'compare' => '>=',
								'type'    => 'DECIMAL'
							);
						}
						if ( isset( $options->max_amount ) && ! empty( $options->max_amount ) && $options->max_amount > 0 ) {
							$meta_keys[] = array(
								'key'     => '_order_total',
								'value'   => $options->max_amount,
								'compare' => '<=',
								'type'    => 'DECIMAL'
							);
						}
						$args = array(
							//phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
							'meta_query' => $meta_keys
						);
						if ( $is_calculate_base === 'order' && ! empty( $data[ $is_calculate_base ] ) ) {
							$current_order = self::$woocommerce_helper->getOrder( $data[ $is_calculate_base ] );
							//phpcs:ignore WordPressVIPMinimum.Performance.WPQueryParams.PostNotIn_post__not_in
							$args['post__not_in'] = array( self::$woocommerce_helper->getOrderId( $current_order ) );
						}
						if ( isset( $options->status ) && is_array( $options->status ) && ! empty( $options->status ) ) {
							$args['post_status'] = self::$woocommerce_helper->changeToQueryStatus( $options->status );
						}
						if ( $options->time != "all_time" ) {
							$args['date_query'] = array( 'after' => $this->getDateByString( $options->time, 'Y-m-d' ) . ' 00:00:00' );
						}
						$orders = self::$woocommerce_helper->getOrdersThroughWPQuery( $args );
					}
					$order_count = self::$cache_order_with_amount_count[ $cache_key ] = count( $orders );
				}

				return $this->doComparisionOperation( $options->operator, $order_count, $options->value );
			}
		}

		return false;
	}
}