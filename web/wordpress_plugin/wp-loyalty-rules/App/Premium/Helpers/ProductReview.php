<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Helpers;
defined( 'ABSPATH' ) or die();

use Wlr\App\Helpers\Base;
use Wlr\App\Helpers\EarnCampaign;
use Wlr\App\Helpers\Woocommerce;

class ProductReview extends Base {
	public static $instance = null;
	public static $number_order_made_with_product_ids = array();

	public function __construct( $config = array() ) {
		parent::__construct( $config );
	}

	function getTotalEarnPoint( $point, $rule, $data ) {
		if ( isset( $rule->earn_campaign->point_rule ) && ! empty( $rule->earn_campaign->point_rule ) ) {
			$point_rule = $rule->earn_campaign->point_rule;
			if ( self::$woocommerce_helper->isJson( $rule->earn_campaign->point_rule ) ) {
				$point_rule = json_decode( $rule->earn_campaign->point_rule );
			}
			if ( isset( $rule->earn_campaign->id ) && ! empty( $rule->earn_campaign->id ) ) {
				$data['campaign_id'] = $rule->earn_campaign->id;
			}
			$data['earn_type'] = 'point';
			$status            = $this->checkProductReview( $data );
			if ( $status && isset( $point_rule->earn_point ) ) {
				$point = (int) $point_rule->earn_point;
				$point = apply_filters( 'wlr_review_total_earn_point', $point, $rule, $data );
			}
		}

		return $point;
	}

	function checkProductReview( $data ) {
		if ( ! is_array( $data ) || ! isset( $data['user_email'] ) || ! isset( $data['product_id'] ) || ! isset( $data['action_type'] ) || ! isset( $data['campaign_id'] )
		     || empty( $data['user_email'] ) || $data['product_id'] <= 0 || $data['campaign_id'] <= 0 ) {
			return false;
		}
		$userEmail = sanitize_email( $data['user_email'] );
		$order_ids = $this->get_orders_ids_by_product_id( $data['product_id'], $userEmail );

		if ( empty( $order_ids ) && apply_filters( 'wlr_check_product_review_order_is_placed', true, $userEmail, $order_ids ) ) {
			return false;
		}
		if ( ! apply_filters( 'wlr_check_product_review_earn_transactions', true, $userEmail, $data ) ) {
			return true;
		}
		$status           = false;
		$query_data       = array(
			'user_email'  => array( 'operator' => '=', 'value' => $userEmail ),
			'action_type' => array( 'operator' => '=', 'value' => $data['action_type'] ),
			'product_id'  => array( 'operator' => '=', 'value' => (int) $data['product_id'] ),
			'campaign_id' => array( 'operator' => '=', 'value' => (int) $data['campaign_id'] )
		);
		$transaction_data = self::$earn_campaign_transaction_model->getQueryData( $query_data, '*', array(), false, true );
		if ( empty( $transaction_data ) ) {
			$status = true;
		}

		return apply_filters( 'wlr_check_product_review_is_eligible', $status, $data );
	}

	function get_orders_ids_by_product_id( $product_id, $email, $limit = 1 ) {
		if ( $product_id <= 0 || empty( $email ) ) {
			return array();
		}
		if ( isset( self::$number_order_made_with_product_ids ) && isset( self::$number_order_made_with_product_ids[ $email ] ) && isset( self::$number_order_made_with_product_ids[ $email ][ $product_id ] ) ) {
			return self::$number_order_made_with_product_ids[ $email ][ $product_id ];
		}
		if ( ! isset( self::$number_order_made_with_product_ids[ $email ] ) ) {
			self::$number_order_made_with_product_ids[ $email ] = array();
		}
		global $wpdb;
		$options        = get_option( 'wlr_settings', '' );
		$earning_status = ( isset( $options['wlr_earning_status'] ) && ! empty( $options['wlr_earning_status'] ) ? $options['wlr_earning_status'] : array(
			'processing',
			'completed'
		) );
		if ( is_string( $earning_status ) ) {
			$earning_status = explode( ',', $earning_status );
		}
		$earning_status = self::$woocommerce_helper->changeToQueryStatus( $earning_status );
		$earning_status = "'" . implode( "', '", $earning_status ) . "'";
		$query          = "SELECT * FROM {$wpdb->prefix}woocommerce_order_items as woi LEFT JOIN {$wpdb->prefix}woocommerce_order_itemmeta as woim ON woi.order_item_id = woim.order_item_id";
		if ( self::$woocommerce_helper->isHPOSEnabled() ) {
			$query .= $wpdb->prepare( " LEFT JOIN {$wpdb->prefix}wc_orders AS p ON woi.order_id = p.id 
            WHERE p.billing_email = %s AND p.status IN ( {$earning_status} ) AND woim.meta_key IN ( %s, %s ) AND woim.meta_value = %s LIMIT %d ", [//phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				$email,
				'_product_id',
				'_variation_id',
				$product_id,
				$limit
			] );
		} else {
			$query .= $wpdb->prepare( " LEFT JOIN {$wpdb->posts} AS p ON woi.order_id = p.ID 
            WHERE p.id IN(SELECT pm.post_id FROM {$wpdb->postmeta} as pm 
            WHERE pm.meta_key=%s AND pm.meta_value = %s) AND p.post_status IN ( $earning_status ) AND woim.meta_key IN ( %s, %s ) AND woim.meta_value = %s LIMIT %d", [//phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				'_billing_email',
				$email,
				'_variation_id',
				'_product_id',
				$product_id,
				$limit
			] );
		}

		return self::$number_order_made_with_product_ids[ $email ] = $wpdb->get_col( $query );//phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.NotPrepared
	}

	function getTotalEarnReward( $reward, $rule, $data ) {
		if ( isset( $rule->earn_campaign->point_rule ) && ! empty( $rule->earn_campaign->point_rule ) ) {
			$point_rule = $rule->earn_campaign->point_rule;
			if ( self::$woocommerce_helper->isJson( $rule->earn_campaign->point_rule ) ) {
				$point_rule = json_decode( $rule->earn_campaign->point_rule );
			}
			if ( isset( $rule->earn_campaign->id ) && ! empty( $rule->earn_campaign->id ) ) {
				$data['campaign_id'] = $rule->earn_campaign->id;
			}
			$data['earn_type'] = 'coupon';
			$status            = $this->checkProductReview( $data );
			if ( $status && isset( $point_rule->earn_reward ) ) {
				$action_reward = $this->getRewardById( $point_rule->earn_reward );
				$reward        = ! empty( $action_reward ) ? $action_reward : $reward;
			}
		}

		return $reward;
	}

	function applyEarnProductReview( $action_data ) {
		if ( ! is_array( $action_data ) || empty( $action_data['user_email'] ) ) {
			return false;
		}
		if ( empty( $action_data['product_id'] ) ) {
			return false;
		}
		$status           = false;
		$earn_campaign    = EarnCampaign::getInstance();
		$cart_action_list = array( 'product_review' );
		foreach ( $cart_action_list as $action_type ) {
			$variant_reward = $this->getTotalEarning( $action_type, array(), $action_data );
			foreach ( $variant_reward as $campaign_id => $v_reward ) {
				if ( isset( $v_reward['point'] ) && ! empty( $v_reward['point'] ) && $v_reward['point'] > 0 ) {
					$status = $earn_campaign->addEarnCampaignPoint( $action_type, $v_reward['point'], $campaign_id, $action_data );
				}
				if ( isset( $v_reward['rewards'] ) && $v_reward['rewards'] ) {
					foreach ( $v_reward['rewards'] as $single_reward ) {
						$status = $earn_campaign->addEarnCampaignReward( $action_type, $single_reward, $campaign_id, $action_data );
					}
				}
			}
		}

		return $status;
	}

	public static function getInstance( array $config = array() ) {
		if ( ! self::$instance ) {
			self::$instance = new self( $config );
		}

		return self::$instance;
	}

	function processMessage( $point_rule, $earning ) {
		$point             = isset( $earning['point'] ) && ! empty( $earning['point'] ) ? (int) $earning['point'] : 0;
		$rewards           = isset( $earning['rewards'] ) && ! empty( $earning['rewards'] ) ? (array) $earning['rewards'] : array();
		$available_rewards = '';
		foreach ( $rewards as $single_reward ) {
			if ( is_object( $single_reward ) && isset( $single_reward->display_name ) ) {
				$available_rewards .= __( $single_reward->display_name, 'wp-loyalty-rules' ) . ',';//phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText
			}
		}
		$available_rewards = trim( $available_rewards, ',' );
		$reward_count      = 0;
		if ( ! empty( $available_rewards ) ) {
			$reward_count = count( explode( ',', $available_rewards ) );
		}
		$display_message = '';
		if ( ( $point > 0 || ! empty( $available_rewards ) ) ) {
			$message        = '';
			$review_message = isset( $point_rule->review_message ) && ! empty( $point_rule->review_message ) ? __( $point_rule->review_message, 'wp-loyalty-rules' ) : '';//phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText
			if ( ! empty( $review_message ) ) {
				$message = '<span class="wlr-product-review-message">' . Woocommerce::getCleanHtml( $review_message ) . '</span>';
			}
			$point           = $this->roundPoints( $point );
			$short_code_list = array(
				'{wlr_points}'       => $point > 0 ? self::$woocommerce_helper->numberFormatI18n( $point ) : '',
				'{wlr_points_label}' => $this->getPointLabel( $point ),
				'{wlr_reward_label}' => $this->getRewardLabel( $reward_count ),
				'{wlr_rewards}'      => $available_rewards
			);
			$display_message = $this->processShortCodes( $short_code_list, $message );
		}

		return $display_message;
	}

}