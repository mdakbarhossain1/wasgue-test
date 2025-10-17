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

class Birthday extends Base {
	public static $instance = null;

	public function __construct( $config = array() ) {
		parent::__construct( $config );
	}

	function getTotalEarnPoint( $point, $rule, $data ) {
		if ( isset( $rule->earn_campaign->point_rule ) && ! empty( $rule->earn_campaign->point_rule ) ) {
			$point_rule = $rule->earn_campaign->point_rule;
			if ( self::$woocommerce_helper->isJson( $rule->earn_campaign->point_rule ) ) {
				$point_rule = json_decode( $rule->earn_campaign->point_rule );
			}
			$status = false;
			if ( isset( $point_rule->birthday_earn_type ) && in_array( $point_rule->birthday_earn_type, array(
					'on_their_birthday',
					'update_birth_date'
				) ) && $point_rule->birthday_earn_type == $data['birthday_earn_type'] ) {
				$status = true;
			}
			if ( isset( $rule->earn_campaign->id ) && ! empty( $rule->earn_campaign->id ) ) {
				$data['campaign_id'] = $rule->earn_campaign->id;
			}
			if ( $status ) {
				$data['earn_type'] = 'point';
				$status            = $this->checkBirthdayData( $data );
			}
			if ( $status && isset( $point_rule->earn_point ) ) {
				$point = (int) $point_rule->earn_point;
			}
		}

		return $point;
	}

	protected function checkBirthdayData( $data ) {
		$status = false;
		if ( isset( $data['user_email'] ) && empty( $data['user_email'] ) ) {
			if ( isset( $data['is_message'] ) && $data['is_message'] ) {
				return true;
			}

			return $status;
		}
		if ( isset( $data['birthday_earn_type'] ) && ! empty( $data['birthday_earn_type'] ) && isset( $data['campaign_id'] ) && ! empty( $data['campaign_id'] ) ) {
			global $wpdb;
			$userEmail = sanitize_email( $data['user_email'] );
			if ( isset( $data['earn_type'] ) && in_array( $data['earn_type'], array( 'point', 'coupon' ) ) ) {
				$query_data = array(
					'user_email'  => array( 'operator' => '=', 'value' => $userEmail ),
					'action_type' => array( 'operator' => '=', 'value' => 'birthday' ),
					'campaign_id' => array( 'operator' => '=', 'value' => $data['campaign_id'] ),
					//'campaign_type' => array('operator' => '=','value' => $data['earn_type']),
				);
				if ( $data['birthday_earn_type'] == 'on_their_birthday' ) {
					$start                    = gmdate( 'Y-01-01' );
					$query_data['created_at'] = array( 'operator' => '>=', 'value' => strtotime( $start ) );
					$earn_campaign            = self::$earn_campaign_transaction_model->getQueryData( $query_data, '*', array(), false, true );
					if ( empty( $earn_campaign ) ) {
						$status = true;
					}
				} elseif ( $data['birthday_earn_type'] == 'update_birth_date' ) {
					$earn_campaign = self::$earn_campaign_transaction_model->getQueryData( $query_data, '*', array(), false, true );
					if ( empty( $earn_campaign ) ) {
						$status = true;
					}
				}
			}
		}

		return $status;
	}

	function getTotalEarnReward( $reward, $rule, $data ) {
		if ( isset( $rule->earn_campaign->point_rule ) && ! empty( $rule->earn_campaign->point_rule ) ) {
			$point_rule = $rule->earn_campaign->point_rule;
			if ( self::$woocommerce_helper->isJson( $rule->earn_campaign->point_rule ) ) {
				$point_rule = json_decode( $rule->earn_campaign->point_rule );
			}
			$status = false;
			if ( isset( $point_rule->birthday_earn_type ) && in_array( $point_rule->birthday_earn_type, array(
					'on_their_birthday',
					'update_birth_date'
				) ) && $point_rule->birthday_earn_type == $data['birthday_earn_type'] ) {
				$status = true;
			}
			if ( isset( $rule->earn_campaign->id ) && ! empty( $rule->earn_campaign->id ) ) {
				$data['campaign_id'] = $rule->earn_campaign->id;
			}
			if ( $status ) {
				$data['earn_type'] = 'coupon';
				$status            = $this->checkBirthdayData( $data );
			}
			if ( $status && isset( $point_rule->earn_reward ) ) {
				$action_reward = $this->getRewardById( $point_rule->earn_reward );
				$reward        = ! empty( $action_reward ) ? $action_reward : $reward;
			}
		}

		return $reward;
	}

	function applyEarnBirthday( $action_data ) {
		$status = false;
		if ( ! isset( $action_data['user_email'] ) || empty( $action_data['user_email'] ) ) {
			return $status;
		}
		$earn_campaign    = EarnCampaign::getInstance();
		$cart_action_list = array( 'birthday' );
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
		$message = '';
		if ( isset( $point_rule->birthday_message ) && ! empty( $point_rule->birthday_message ) ) {
			$message = '<span class="wlr-birthday-message">' . Woocommerce::getCleanHtml( $point_rule->birthday_message ) . '</span>';
		}
		$point             = isset( $earning['point'] ) && ! empty( $earning['point'] ) ? (int) $earning['point'] : 0;
		$rewards           = isset( $earning['rewards'] ) && ! empty( $earning['rewards'] ) ? (array) $earning['rewards'] : array();
		$available_rewards = '';
		foreach ( $rewards as $single_reward ) {
			if ( is_object( $single_reward ) && isset( $single_reward->display_name ) ) {
				$available_rewards .= $single_reward->display_name . ',';
			}
		}
		$available_rewards = trim( $available_rewards, ',' );
		$reward_count      = 0;
		if ( ! empty( $available_rewards ) ) {
			$reward_count = count( explode( ',', $available_rewards ) );
		}
		$display_message = '';
		if ( ( $point > 0 || ! empty( $available_rewards ) ) && ! empty( $message ) ) {
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