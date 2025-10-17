<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-3.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Helpers;
defined( 'ABSPATH' ) or die();

use Wlr\App\Helpers\Base;
use Wlr\App\Helpers\EarnCampaign;
use stdClass;

class Achievement extends Base {
	public static $instance = null;

	public function __construct( $config = array() ) {
		parent::__construct( $config );
	}

	function getTotalEarnPoint( $point, $rule, $data ) {
		if ( isset( $rule->earn_campaign->point_rule ) && ! empty( $rule->earn_campaign->point_rule ) ) {
			$point_rule = $this->getAchievementPointRule( $rule->earn_campaign );
			if ( isset( $rule->earn_campaign->id ) && ! empty( $rule->earn_campaign->id ) ) {
				$data['campaign_id'] = $rule->earn_campaign->id;
			}
			$status = $this->checkAchievement( $data, $point_rule );
			if ( $status && isset( $point_rule->earn_point ) ) {
				$point = (int) $point_rule->earn_point;
			}
		}

		return $point;
	}

	protected function getAchievementPointRule( $campaign ) {
		$point_rule = new stdClass();
		if ( ! is_object( $campaign ) || ! isset( $campaign->point_rule ) ) {
			return $point_rule;
		}
		if ( self::$woocommerce_helper->isJson( $campaign->point_rule ) ) {
			$point_rule = json_decode( $campaign->point_rule );
		}

		return $point_rule;
	}

	protected function checkAchievement( $data, $point_rule ) {
		if ( empty( $data['user_email'] ) || empty( $data['achievement_type'] ) || empty( $data['campaign_id'] ) || $data['campaign_id'] <= 0 ) {
			return false;
		}
		$user_email   = sanitize_email( $data['user_email'] );
		$loyalty_user = self::$user_model->getQueryData( array(
			'user_email' => array(
				'operator' => '=',
				'value'    => $user_email
			)
		), '*', array(), false );
		if ( ! empty( $loyalty_user ) && is_object( $loyalty_user ) && isset( $loyalty_user->is_banned_user ) && $loyalty_user->is_banned_user ) {
			return false;
		}
		if ( $data['achievement_type'] == 'level_update' ) {
			$old_level = (int) isset( $data['old_level'] ) ? $data['old_level'] : 0;
			if ( empty( $loyalty_user ) || ! is_object( $loyalty_user ) || ! isset( $loyalty_user->level_id ) ||
			     ( $loyalty_user->level_id == $old_level ) || ! is_object( $point_rule ) || ! isset( $point_rule->level_ids ) ||
			     ( ! in_array( $loyalty_user->level_id, (array) $point_rule->level_ids ) ) ) {
				return false;
			}
			if ( apply_filters( 'wlr_achievement_level_check', true, $data, $point_rule ) ) {
				$level_earn_campaign_where = array(
					'user_email'       => array( 'operator' => '=', 'value' => $user_email ),
					'action_type'      => array( 'operator' => '=', 'value' => $data['action_type'] ),
					'transaction_type' => array( 'operator' => '=', 'value' => 'credit' ),
					'campaign_id'      => array( 'operator' => '=', 'value' => $data['campaign_id'] ),
					'action_sub_type'  => array( 'operator' => '=', 'value' => 'level_update' ),
					'action_sub_value' => array( 'operator' => '=', 'value' => $loyalty_user->level_id ),
				);
				$level_transaction_data    = self::$earn_campaign_transaction_model->getQueryData( $level_earn_campaign_where, '*', array(), false );
				if ( ! empty( $level_transaction_data ) ) {
					return false;
				}
			}
		}
		if ( $data['achievement_type'] == 'daily_login' ) {
			//case 1: Earn 1 campaign 10, then earn other new ach campaign 3, total 13
			//case 2: Earn 1 campaign 10, last date remove,then change to reward, Need to earn
			//case 3: Earn dail login 10, change to level_update, then need to earn point
			$wp_user = get_user_by( 'email', $user_email );
			if ( empty( $wp_user ) || ! is_object( $wp_user ) ) {
				return false;
			}
			$last_login_date = is_object( $loyalty_user ) && isset( $loyalty_user->last_login ) ? $loyalty_user->last_login : 0;
			if ( empty( $last_login_date ) ) {
				$last_login_date = strtotime( "-1 day" );
			}
			if ( $last_login_date > strtotime( gmdate( 'Y-m-d', strtotime( 'now' ) ) ) ) {
				return false;
			}
			$earn_campaign_where = array(
				'user_email'       => array( 'operator' => '=', 'value' => $user_email ),
				'action_type'      => array( 'operator' => '=', 'value' => $data['action_type'] ),
				'transaction_type' => array( 'operator' => '=', 'value' => 'credit' ),
				'campaign_id'      => array( 'operator' => '=', 'value' => $data['campaign_id'] ),
				'action_sub_type'  => array( 'operator' => '=', 'value' => 'daily_login' ),
				'created_at'       => array(
					'operator' => '>',
					'value'    => strtotime( gmdate( 'Y-m-d', strtotime( 'now' ) ) )
				),
			);
			$transaction_data    = self::$earn_campaign_transaction_model->getQueryData( $earn_campaign_where, '*', array(), false );
			if ( ! empty( $transaction_data ) ) {
				return false;
			}
		}
		if ( ! in_array( $data['achievement_type'], array( 'level_update', 'daily_login' ) ) &&
		     ! apply_filters( 'wlr_achievement_check_status', false, $data ) ) {
			return false;
		}

		return true;
	}

	function getTotalEarnReward( $reward, $rule, $data ) {
		if ( isset( $rule->earn_campaign->point_rule ) && ! empty( $rule->earn_campaign->point_rule ) ) {
			$point_rule = $this->getAchievementPointRule( $rule->earn_campaign );
			if ( isset( $rule->earn_campaign->id ) && ! empty( $rule->earn_campaign->id ) ) {
				$data['campaign_id'] = $rule->earn_campaign->id;
			}
			$status = $this->checkAchievement( $data, $point_rule );
			if ( $status && isset( $point_rule->earn_reward ) ) {
				$action_reward = $this->getRewardById( $point_rule->earn_reward );
				$reward        = ! empty( $action_reward ) ? $action_reward : $reward;
			}
		}

		return $reward;
	}

	function applyEarnLevel( $action_data, $ignore_conditions = array() ) {
		if ( ! is_array( $action_data ) || empty( $action_data['user_email'] ) || ! isset( $action_data['old_level'] ) ) {
			return false;
		}

		return $this->processAchievementAction( $action_data, $ignore_conditions );
	}

	/**
	 * @param $ignore_conditions
	 * @param array $action_data
	 *
	 * @return array
	 */
	public function processAchievementAction( $action_data, $ignore_conditions = array() ) {
		$earn_campaign   = EarnCampaign::getInstance();
		$action_type     = 'achievement';
		$variant_reward  = $this->getTotalEarning( $action_type, $ignore_conditions, $action_data );
		$all_status_list = array();
		foreach ( $variant_reward as $campaign_id => $v_reward ) {
			if ( isset( $v_reward['point'] ) && ! empty( $v_reward['point'] ) && $v_reward['point'] > 0 ) {
				$all_status_list[] = $earn_campaign->addEarnCampaignPoint( $action_type, $v_reward['point'], $campaign_id, $action_data );
			}
			if ( isset( $v_reward['rewards'] ) && $v_reward['rewards'] ) {
				foreach ( $v_reward['rewards'] as $single_reward ) {
					$all_status_list[] = $earn_campaign->addEarnCampaignReward( $action_type, $single_reward, $campaign_id, $action_data );
				}
			}
		}

		return $all_status_list;
	}

	public static function getInstance( array $config = array() ) {
		if ( ! self::$instance ) {
			self::$instance = new self( $config );
		}

		return self::$instance;
	}

	function getTotalEarning( $action_type = '', $ignore_condition = array(), $extra = array(), $is_product_level = false ) {
		$earning          = array();
		$achievement_type = isset( $extra['achievement_type'] ) && ! empty( $extra['achievement_type'] ) ? $extra['achievement_type'] : '';
		if ( ! $this->is_valid_action( $action_type ) || ! $this->isEligibleForEarn( $action_type, $extra ) || empty( $achievement_type ) ) {
			return $earning;
		}
		$campaign_helper     = EarnCampaign::getInstance();
		$earn_campaign_table = new \Wlr\App\Models\EarnCampaign();
		//$campaign_list = $earn_campaign_table->getCampaignByAction($action_type);
		$current_date = gmdate( 'Y-m-d H:i:s' );
		global $wpdb;
		$campaign_where = $wpdb->prepare( '(start_at <= %s OR start_at=0) AND  (end_at >= %s OR end_at=0) AND action_type = %s AND achievement_type = %s AND active = %d ORDER BY %s', array(
			strtotime( $current_date ),
			strtotime( $current_date ),
			$action_type,
			$achievement_type,
			1,
			'priority,id'
		) );
		$campaign_list  = $earn_campaign_table->getWhere( $campaign_where, '*', false );
		if ( ! empty( $campaign_list ) ) {
			$action_data = array(
				'action_type'      => $action_type,
				'ignore_condition' => $ignore_condition,
				'is_product_level' => $is_product_level
			);
			if ( ! empty( $extra ) && is_array( $extra ) ) {
				foreach ( $extra as $key => $value ) {
					$action_data[ $key ] = $value;
				}
			}
			$action_data = apply_filters( 'wlr_before_rule_data_process', $action_data, $campaign_list );
			$order_id    = isset( $action_data['order'] ) && ! empty( $action_data['order'] ) ? $action_data['order']->get_id() : 0;
			self::$woocommerce_helper->_log( 'getTotalEarning Action data:' . json_encode( $action_data ) );
			$social_share = $this->getSocialActionList();
			foreach ( $campaign_list as $campaign ) {
				$processing_campaign = $campaign_helper->getCampaign( $campaign );
				$campaign_id         = isset( $processing_campaign->earn_campaign->id ) && $processing_campaign->earn_campaign->id > 0 ? $processing_campaign->earn_campaign->id : 0;
				if ( $campaign_id && $order_id ) {
					self::$woocommerce_helper->_log( 'getTotalEarning Action:' . $action_type . ',Campaign id:' . $campaign_id . ', Before check user already earned' );
					if ( $this->checkUserEarnedInCampaignFromOrder( $order_id, $campaign_id ) ) {
						continue;
					}
				}
				$action_data['campaign_id'] = $campaign_id;
				$campaign_earning           = array();
				if ( isset( $processing_campaign->earn_campaign->campaign_type ) && $processing_campaign->earn_campaign->campaign_type === 'point' ) {
					//campaign_id and order_id
					self::$woocommerce_helper->_log( 'getTotalEarning Action:' . $action_type . ',Campaign id:' . $campaign_id . ', Before earn point:' . json_encode( $action_data ) );
					$earning[ $campaign->id ]['point'] = $campaign_earning['point'] = $processing_campaign->getCampaignPoint( $action_data );
				} elseif ( isset( $processing_campaign->earn_campaign->campaign_type ) && $processing_campaign->earn_campaign->campaign_type === 'coupon' ) {
					self::$woocommerce_helper->_log( 'getTotalEarning Action:' . $action_type . ',Campaign id:' . $campaign_id . ', Before earn coupon:' . json_encode( $action_data ) );
					$earning[ $campaign->id ]['rewards'][] = $campaign_earning['rewards'][] = $processing_campaign->getCampaignReward( $action_data );
				}
				$earning[ $campaign->id ]['messages'] = $this->processCampaignMessage( $action_type, $processing_campaign, $campaign_earning );
				if ( in_array( $action_type, $social_share ) ) {
					$earning[ $campaign->id ]['icon'] = isset( $processing_campaign->earn_campaign->icon ) && ! empty( $processing_campaign->earn_campaign->icon ) ? $processing_campaign->earn_campaign->icon : "";
				}
			}
			self::$woocommerce_helper->_log( 'getTotalEarning Action:' . $action_type . ', Total earning:' . json_encode( $earning ) );
		}

		return $earning;
	}

	function applyEarnDailyLogin( $action_data, $ignore_conditions = array() ) {
		if ( ! is_array( $action_data ) || empty( $action_data['user_email'] ) ) {
			return false;
		}
		$wp_user = get_user_by( 'email', $action_data['user_email'] );
		if ( empty( $wp_user ) || ! is_object( $wp_user ) ) {
			return false;
		}
		$all_status = $this->processAchievementAction( $action_data, $ignore_conditions );
		if ( in_array( true, $all_status ) ) {
			self::$user_model->updateRow( array( 'last_login' => time() ), array( 'user_email' => $action_data['user_email'] ) );
		}

		return $all_status;
	}

	function applyEarnCustomAction( $action_data, $ignore_conditions = array() ) {
		if ( ! is_array( $action_data ) || empty( $action_data['user_email'] ) || empty( $action_data['achievement_type'] ) ) {
			return false;
		}

		return $this->processAchievementAction( $action_data, $ignore_conditions );
	}
}