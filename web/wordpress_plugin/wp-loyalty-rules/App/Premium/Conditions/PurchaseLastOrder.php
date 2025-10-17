<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Conditions;
defined( 'ABSPATH' ) or die();

use Wlr\App\Conditions\Base;

class PurchaseLastOrder extends Base {
	protected static $cache_order_count = array();

	public function __construct() {
		parent::__construct();
		$this->name  = 'purchase_last_order';
		$this->label = __( 'Last order', 'wp-loyalty-rules' );
		$this->group = __( 'Purchase History', 'wp-loyalty-rules' );
	}

	public function isProductValid( $options, $data ) {
		return $this->check( $options, $data );
	}

	function check( $options, $data ) {
		$billing_email = isset( $data['user_email'] ) && ! empty( $data['user_email'] ) ? $data['user_email'] : '';
		if ( ! empty( $billing_email ) ) {

			$is_calculate_base = isset( $data['is_calculate_based'] ) && ! empty( $data['is_calculate_based'] ) ? $data['is_calculate_based'] : '';
			$cache_key         = $this->generateBase64Encode( $options );
			if ( isset( self::$cache_order_count[ $cache_key ] ) ) {
				$orders = self::$cache_order_count[ $cache_key ];
			} else if ( ! empty( $is_calculate_base ) && isset( $data[ $is_calculate_base ] ) ) {
				if ( self::$woocommerce_helper->isHPOSEnabled() ) {
					$args = array(
						'limit'         => 1,
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
					if ( isset( $options->status ) && is_array( $options->status ) && ! empty( $options->status ) ) {
						$args['status'] = self::$woocommerce_helper->changeToQueryStatus( $options->status );
					}
					if ( $options->value != "all_time" ) {
						$date = $this->getDateByString( $options->value, 'Y-m-d' ) . ' 00:00:00';
						switch ( $options->operator ) {
							case 'earlier':
								$args['date_query'] = array( 'before' => $date );
								break;
							default:
								$args['date_query'] = array( 'after' => $date );
								break;
						}
					}
					$orders = self::$cache_order_count[ $cache_key ] = self::$woocommerce_helper->getOrdersThroughWCOrderQuery( $args );
				} else {
					$args = [
						'posts_per_page' => 1,
						//phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
						'meta_query'     => [
							[ 'key' => '_billing_email', 'value' => $billing_email, 'compare' => '=' ]
						],
					];
					if ( $is_calculate_base === 'order' && ! empty( $data[ $is_calculate_base ] ) ) {
						$current_order = self::$woocommerce_helper->getOrder( $data[ $is_calculate_base ] );
						//phpcs:ignore WordPressVIPMinimum.Performance.WPQueryParams.PostNotIn_post__not_in
						$args['post__not_in'] = array( self::$woocommerce_helper->getOrderId( $current_order ) );
					}

					if ( isset( $options->status ) && is_array( $options->status ) && ! empty( $options->status ) ) {
						$args['post_status'] = self::$woocommerce_helper->changeToQueryStatus( $options->status );
					}
					if ( $options->value != "all_time" ) {
						$date = $this->getDateByString( $options->value, 'Y-m-d' ) . ' 00:00:00';
						switch ( $options->operator ) {
							case 'earlier':
								$args['date_query'] = array( 'before' => $date );
								break;
							default:
								$args['date_query'] = array( 'after' => $date );
								break;
						}
					}
					$orders = self::$cache_order_count[ $cache_key ] = self::$woocommerce_helper->getOrdersThroughWPQuery( $args );
				}
			}

			return ! empty( $orders );
		}

		return false;
	}
}