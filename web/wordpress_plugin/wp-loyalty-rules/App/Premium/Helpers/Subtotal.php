<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Helpers;

use Wlr\App\Helpers\Order;

defined( 'ABSPATH' ) or die();

class Subtotal extends Order {
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
			// check minimum and maximum point of user
			$subtotal          = 0;
			$is_calculate_base = isset( $data['is_calculate_based'] ) && ! empty( $data['is_calculate_based'] ) ? $data['is_calculate_based'] : '';
			if ( $is_calculate_base === 'cart' && isset( $data[ $is_calculate_base ] ) && ! empty( $data[ $is_calculate_base ] ) ) {
				$subtotal = self::$woocommerce_helper->getCartSubtotal( $data[ $is_calculate_base ] );
			} elseif ( $is_calculate_base === 'order' && isset( $data[ $is_calculate_base ] ) && ! empty( $data[ $is_calculate_base ] ) ) {
				$subtotal = self::$woocommerce_helper->getOrderSubtotal( $data[ $is_calculate_base ] );
			}
			$status       = false;
			$min_subtotal = isset( $point_rule->min_subtotal ) && $point_rule->min_subtotal > 0 ? $point_rule->min_subtotal : 0;
			$max_subtotal = isset( $point_rule->max_subtotal ) && $point_rule->max_subtotal > 0 ? $point_rule->max_subtotal : 0;
			if ( ( $min_subtotal <= $subtotal || $min_subtotal == 0 ) && ( $max_subtotal >= $subtotal || $max_subtotal == 0 ) ) {
				$status = true;
			}
			if ( $status && isset( $point_rule->earn_point ) ) {
				$point = (int) $point_rule->earn_point;
			}
		}

		return $point;
	}

	function getTotalEarnReward( $reward, $rule, $data ) {
		if ( isset( $rule->earn_campaign->point_rule ) && ! empty( $rule->earn_campaign->point_rule ) && ( ( isset( $data['user_email'] ) && ! empty( $data['user_email'] ) ) || ( isset( $data['is_cart_message'] ) && $data['is_cart_message'] ) ) ) {
			$point_rule = $rule->earn_campaign->point_rule;
			if ( self::$woocommerce_helper->isJson( $rule->earn_campaign->point_rule ) ) {
				$point_rule = json_decode( $rule->earn_campaign->point_rule );
			}
			// check minimum and maximum point of user
			$subtotal          = 0;
			$is_calculate_base = isset( $data['is_calculate_based'] ) && ! empty( $data['is_calculate_based'] ) ? $data['is_calculate_based'] : '';
			if ( $is_calculate_base === 'cart' && isset( $data[ $is_calculate_base ] ) && ! empty( $data[ $is_calculate_base ] ) ) {
				$subtotal = self::$woocommerce_helper->getCartSubtotal( $data[ $is_calculate_base ] );
			} elseif ( $is_calculate_base === 'order' && isset( $data[ $is_calculate_base ] ) && ! empty( $data[ $is_calculate_base ] ) ) {
				$subtotal = self::$woocommerce_helper->getOrderSubtotal( $data[ $is_calculate_base ] );
			}
			$status       = false;
			$min_subtotal = isset( $point_rule->min_subtotal ) && $point_rule->min_subtotal > 0 ? $point_rule->min_subtotal : 0;
			$max_subtotal = isset( $point_rule->max_subtotal ) && $point_rule->max_subtotal > 0 ? $point_rule->max_subtotal : 0;
			if ( ( $min_subtotal <= $subtotal || $min_subtotal == 0 ) && ( $max_subtotal >= $subtotal || $max_subtotal == 0 ) ) {
				$status = true;
			}

			if ( $status && isset( $point_rule->earn_reward ) ) {
				$action_reward = $this->getRewardById( $point_rule->earn_reward );
				$reward        = ! empty( $action_reward ) ? $action_reward : $reward;
			}
		}

		return $reward;
	}
}