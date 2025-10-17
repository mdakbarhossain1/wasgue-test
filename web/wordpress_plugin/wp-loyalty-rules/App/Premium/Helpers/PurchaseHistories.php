<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Helpers;

use Wlr\App\Helpers\Order;

defined( 'ABSPATH' ) or die();

class PurchaseHistories extends Order {
	public static $instance = null;

	public function __construct( $config = array() ) {
		parent::__construct( $config );
	}

	public static function getInstance( array $config = array() ) {
		if ( ! self::$instance ) {
			self::$instance = new self( $config );
		}

		return self::$instance;
	}

	function getTotalEarnPoint( $point, $rule, $data ) {
		if ( isset( $rule->earn_campaign->point_rule ) && ! empty( $rule->earn_campaign->point_rule ) && ( ( isset( $data['user_email'] ) && ! empty( $data['user_email'] ) ) || ( isset( $data['is_cart_message'] ) && $data['is_cart_message'] ) ) ) {
			$point_rule = $rule->earn_campaign->point_rule;
			if ( self::$woocommerce_helper->isJson( $rule->earn_campaign->point_rule ) ) {
				$point_rule = json_decode( $rule->earn_campaign->point_rule );
			}
			$status = $this->checkPurchaseCondition( $point_rule, $data );
			if ( $status && isset( $point_rule->earn_point ) ) {
				$point = (int) $point_rule->earn_point;
			}
		}

		return $point;
	}

	protected function checkPurchaseCondition( $point_rule, $data ) {
		$status                 = false;
		$minimum_spend_on_order = ( isset( $point_rule->minimum_spend_on_order ) && $point_rule->minimum_spend_on_order > 0 ) ? $point_rule->minimum_spend_on_order : 0;
		$number_of_purchase     = $this->getPurchaseCount( $minimum_spend_on_order, $data );

		if ( $number_of_purchase >= 0 && isset( $data['is_cart_message'] ) && $data['is_cart_message'] ) {
			// Need 5th order, earn point.. so if enter 5, then old order count 4 so +1 from number of order
			if ( isset( $point_rule->no_of_purchase ) && $point_rule->no_of_purchase == 1 && $number_of_purchase == 0 ) {
				$subtotal = self::$woocommerce_helper->getCartSubtotal( $data['cart'] );
				if ( $minimum_spend_on_order <= $subtotal ) {
					$number_of_purchase += 1;
				}
			} else {
				$number_of_purchase += 1;
			}

		}
		if ( isset( $point_rule->no_of_purchase ) && ( $point_rule->no_of_purchase <= $number_of_purchase ) ) {
			$status = true;
		}

		return $status;
	}

	protected function getPurchaseCount( $minimum_spend_on_order, $data ) {
		$count = 0;
		if ( isset( $data['user_email'] ) && empty( $data['user_email'] ) ) {
			return $count;
		}
		global $wpdb;
		if ( self::$woocommerce_helper->isHPOSEnabled() ) {
			$args  = array(
				'limit'         => - 1,
				'billing_email' => sanitize_email( $data['user_email'] ),
				'type'          => 'shop_order',
				'field_query'   => array(
					array(
						'field'   => 'total',
						'value'   => (int) $minimum_spend_on_order,
						'compare' => '>=',
					)
				)
			);
			$count = count( wc_get_orders( $args ) );
			//  $query = $wpdb->prepare("SELECT COUNT(DISTINCT order_table.id) as total_count FROM {$wpdb->prefix}wc_orders as order_table WHERE order_table.type = %s AND order_table.total_amount >= %d AND order_table.billing_email = %s", array('shop_order', (int)$minimum_spend_on_order, sanitize_email($data['user_email'])));
		} else {
			$query = "SELECT COUNT(DISTINCT order_table.ID) as total_count FROM {$wpdb->posts} as order_table 
        INNER JOIN {$wpdb->postmeta} as order_meta ON order_table.ID = order_meta.post_id 
        INNER JOIN {$wpdb->postmeta} as order_email ON order_table.ID = order_email.post_id";
			$where = $wpdb->prepare( "order_table.post_type = %s AND order_meta.meta_key = %s AND order_meta.meta_value >= %d", array(
				'shop_order',
				'_order_total',
				(int) $minimum_spend_on_order
			) );
			$where .= $wpdb->prepare( ' AND order_email.meta_key = %s AND order_email.meta_value = %s', array(
				'_billing_email',
				sanitize_email( $data['user_email'] )
			) );
			$query .= ' WHERE ' . $where;
			$query = apply_filters( 'wlr_order_goal_purchase_count', $query );
			//phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.NotPrepared
			$list = $wpdb->get_row( $query, OBJECT );
			if ( isset( $list->total_count ) && $list->total_count > 0 ) {
				$count = $list->total_count;
			}
		}

		return $count;
	}

	function getTotalEarnReward( $reward, $rule, $data ) {
		if ( isset( $rule->earn_campaign->point_rule ) && ! empty( $rule->earn_campaign->point_rule ) && ( ( isset( $data['user_email'] ) && ! empty( $data['user_email'] ) ) || ( isset( $data['is_cart_message'] ) && $data['is_cart_message'] ) ) ) {
			$point_rule = $rule->earn_campaign->point_rule;
			if ( self::$woocommerce_helper->isJson( $rule->earn_campaign->point_rule ) ) {
				$point_rule = json_decode( $rule->earn_campaign->point_rule );
			}
			$status = $this->checkPurchaseCondition( $point_rule, $data );
			if ( $status && isset( $point_rule->earn_reward ) ) {
				$action_reward = $this->getRewardById( $point_rule->earn_reward );
				$reward        = ! empty( $action_reward ) ? $action_reward : $reward;
			}
		}

		return $reward;
	}
}