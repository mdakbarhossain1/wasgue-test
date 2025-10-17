<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Controllers\Site;

use stdClass;
use WC_Emails;
use Wlr\App\Helpers\Base;
use Wlr\App\Helpers\Settings;
use Wlr\App\Helpers\Woocommerce;
use Wlr\App\Models\EarnCampaign;
use Wlr\App\Models\Levels;
use Wlr\App\Models\PointsLedger;
use Wlr\App\Models\Rewards;
use Wlr\App\Models\UserRewards;
use Wlr\App\Models\Users;

defined( 'ABSPATH' ) or die;

class Schedules {
	/**
	 * Initializes the schedule for various tasks.
	 *
	 * @return void
	 */
	public static function init() {
		//every 1 hour
		Woocommerce::addSchedule( 'wlr_expire_email' );
		Woocommerce::addSchedule( 'wlr_change_expire_status' );
		$is_point_transfer_complete = get_option( 'wlr_point_ledger_complete', 0 );
		if ( ! $is_point_transfer_complete ) {
			$user_model = new Users();
			$user_list  = $user_model->getWhere( 'id > 0 LIMIT 5 OFFSET 0', '*', false );
			if ( ! empty( $user_list ) ) {
				Woocommerce::addSchedule( 'wlr_update_ledger_point' );
			} else {
				update_option( 'wlr_point_ledger_complete', 1 );
			}
		}
		//notification reminds me later schedule
		if ( Settings::getSettings( 'wlr_new_rewards_section_enabled', '' ) != 'yes' ) {
			Woocommerce::addSchedule( 'wlr_notification_remind_me', '+10 days', 'daily' );
		}
		do_action( 'wlr_schedule_event_register' );
	}

	/**
	 * Removes all schedule actions.
	 *
	 * @return void
	 */
	public static function remove() {
		Woocommerce::removeSchedule( 'wlr_birth_day_points' );
		Woocommerce::removeSchedule( 'wlr_expire_email' );
		Woocommerce::removeSchedule( 'wlr_change_expire_status' );
		Woocommerce::removeSchedule( 'wlr_update_ledger_point' );
		Woocommerce::removeSchedule( 'wlr_point_expire_email' );
		Woocommerce::removeSchedule( 'wlr_change_point_expire_status' );
		Woocommerce::removeSchedule( 'wlr_notification_remind_me' );
	}

	/**
	 * Sends the expiry email to users with expiring rewards.
	 *
	 * @return void
	 */
	public static function sendExpireEmail() {
		$user_reward      = new UserRewards();
		$user_reward_data = $user_reward->getExpireEmailList();
		WC_Emails::instance();
		foreach ( $user_reward_data as $single_user_reward ) {
			do_action( 'wlr_notify_send_expire_email', $single_user_reward );
		}
	}

	/**
	 * Changes the expiry status of user rewards.
	 *
	 * @return void
	 */
	public static function changeExpireStatus() {
		$user_reward      = new UserRewards();
		$user_reward_data = $user_reward->getExpireStatusNeedToChangeList();
		$updateData       = [ 'status' => 'expired' ];
		foreach ( $user_reward_data as $single_user_reward ) {
			$where = [ 'id' => $single_user_reward->id ];
			$user_reward->updateRow( $updateData, $where );
		}
	}

	/**
	 * Updates the point ledger from the user.
	 *
	 * @return void
	 */
	public static function updatePointLedgerFromUser() {
		$off_set = get_option( 'wlr_update_ledger_offset', 0 );
		global $wpdb;
		$user_model         = new Users();
		$point_ledger_model = new PointsLedger();
		$where              = $wpdb->prepare( 'id > 0 ORDER BY id ASC LIMIT 100 OFFSET %d', [ $off_set ] );
		$user_list          = $user_model->getWhere( $where, '*', false );

		if ( empty( $user_list ) ) {
			update_option( 'wlr_point_ledger_complete', 1 );
		} else {
			update_option( 'wlr_update_ledger_offset', (int) ( $off_set + 100 ) );
		}

		if ( ! empty( $user_list ) ) {
			foreach ( $user_list as $user ) {
				$ledger_where = $wpdb->prepare( 'user_email = %s', [ $user->user_email ] );
				$ledger       = $point_ledger_model->getWhere( $ledger_where );
				if ( empty( $ledger ) ) {
					$base_helper = new Base();
					$data        = [
						'user_email'  => $user->user_email,
						'points'      => $user->points,
						'action_type' => 'starting_point',
						'note'        => __( 'Starting point of customer', 'wp-loyalty-rules' ),
						'created_at'  => strtotime( gmdate( "Y-m-d H:i:s" ) )
					];
					$base_helper->updatePointLedger( $data, 'credit', false );
				}
			}
		}
	}

	/**
	 * Enables the notification section.
	 *
	 * @return void
	 */
	public static function enableNotificationSection() {
		$setting = Settings::getSettings( 'wlr_new_rewards_section_enabled', '' );
		if ( ! empty( $setting ) || $setting == 'no' ) {
			Settings::updateSettings( 'wlr_new_rewards_section_enabled', '' );
		}
	}


	/**
	 * Updates the dynamic strings in the given array.
	 *
	 * @param array $new_strings The array containing the dynamic strings.
	 * @param string $domain_text The text domain to check against.
	 *
	 * @return array The updated array with dynamic strings.
	 */
	public static function dynamicStrings( $new_strings, $domain_text ) {
		if ( ! is_array( $new_strings ) || ! is_string( $domain_text ) || $domain_text != 'wp-loyalty-rules' ) {
			return $new_strings;
		}
		self::getCampaignDynamicStrings( $new_strings );
		self::getRewardDynamicStrings( $new_strings );
		self::getLevelDynamicStrings( $new_strings );
		self::getSettingsDynamicStrings( $new_strings );

		return $new_strings;
	}

	/**
	 * Retrieves the dynamic strings for each campaign.
	 *
	 * @param array $new_strings The array to store the new dynamic strings.
	 *
	 * @return void
	 */
	public static function getCampaignDynamicStrings( &$new_strings ) {
		$common_strings     = [ 'name', 'description' ];
		$campaign_model     = new EarnCampaign();
		$campaign_list      = $campaign_model->getAll();
		$woocommerce_helper = Woocommerce::getInstance();
		if ( empty( $campaign_list ) ) {
			return;
		}

		foreach ( $campaign_list as $campaign ) {
			foreach ( $common_strings as $key ) {
				if ( ! empty( $campaign->$key ) ) {
					$new_strings[] = $campaign->$key;
				}
			}
			if ( isset( $campaign->action_type ) && in_array( $campaign->action_type, [
					'point_for_purchase',
					'product_review',
					'signup',
					'facebook_share',
					'twitter_share',
					'whatsapp_share',
					'email_share'
				] ) ) {
				$point_rule = new stdClass();
				if ( ! empty( $campaign->point_rule ) && $woocommerce_helper->isJson( $campaign->point_rule ) ) {
					$point_rule = json_decode( $campaign->point_rule );
				}
				self::getDynamicActionString( $new_strings, $point_rule, $campaign->action_type );
			}
		}
	}

	/**
	 * Generates dynamic action strings based on the specified action type and point rule.
	 *
	 * @param array &$new_strings An array to store the generated action strings.
	 * @param mixed $point_rule The point rule object.
	 * @param string $action_type The type of action.
	 *
	 * @return void
	 */
	public static function getDynamicActionString( &$new_strings, $point_rule, $action_type ) {
		if ( empty( $action_type ) || ! is_string( $action_type ) || ! is_array( $new_strings ) || ! is_object( $point_rule ) ) {
			return;
		}
		$action_strings = [
			'point_for_purchase' => [ 'variable_product_message', 'single_product_message' ],
			'product_review'     => [ 'review_message' ],
			'signup'             => [ 'signup_message' ],
			'facebook_share'     => [ 'share_message' ],
			'twitter_share'      => [ 'share_message' ],
			'whatsapp_share'     => [ 'share_message' ],
			'email_share'        => [ 'share_body', 'share_subject' ]
		];
		if ( ! empty( $action_strings[ $action_type ] ) ) {
			foreach ( $action_strings[ $action_type ] as $key ) {
				if ( ! empty( $point_rule->$key ) ) {
					$new_strings[] = $point_rule->$key;
				}
			}
		}
	}

	/**
	 * Retrieves dynamic reward strings and adds them to an array.
	 *
	 * @param array $new_strings A reference to the array where the new strings will be added.
	 *
	 * @return void
	 */
	public static function getRewardDynamicStrings( &$new_strings ) {
		$common_strings = [ 'name', 'description', 'display_name' ];
		$reward_model   = new Rewards();
		$reward_list    = $reward_model->getAll();
		if ( ! empty( $reward_list ) ) {
			foreach ( $reward_list as $reward ) {
				foreach ( $common_strings as $key ) {
					if ( ! empty( $reward->$key ) ) {
						$new_strings[] = $reward->$key;
					}
				}
			}
		}
	}

	/**
	 * Retrieves the dynamic strings for levels and adds them to the specified array.
	 *
	 * @param array $new_strings The array to which the dynamic strings will be added.
	 *
	 * @return void
	 */
	public static function getLevelDynamicStrings( &$new_strings ) {
		$common_strings = [ 'name', 'description' ];
		$level_model    = new Levels();
		$level_list     = $level_model->getAll();
		if ( ! empty( $level_list ) ) {
			foreach ( $level_list as $level ) {
				foreach ( $common_strings as $key ) {
					if ( ! empty( $level->$key ) ) {
						$new_strings[] = $level->$key;
					}
				}
			}
		}
	}

	/**
	 * Retrieves dynamic strings from the settings and adds them to the given array.
	 *
	 * @param array $new_strings The array to which dynamic strings are added.
	 *
	 * @return void
	 */
	public static function getSettingsDynamicStrings( &$new_strings ) {
		$common_strings = [
			'wlr_point_label',
			'wlr_point_singular_label',
			'reward_plural_label',
			'reward_singular_label',
			'wlr_cart_earn_points_message',
			'wlr_cart_redeem_points_message',
			'wlr_checkout_earn_points_message',
			'wlr_checkout_redeem_points_message',
			'wlr_thank_you_message',
			'redeem_button_text',
			'apply_coupon_button_text'
		];
		$options        = Settings::getSettings();
		if ( isset( $options ) && is_array( $options ) ) {
			foreach ( $common_strings as $key ) {
				if ( ! empty( $options[ $key ] ) ) {
					$new_strings[] = $options[ $key ];
				}
			}
		}
	}

	/**
	 * Adds a dynamic domain to the list of domains.
	 *
	 * @param array $domains The list of domains.
	 *
	 * @return array The updated list of domains.
	 */
	public static function dynamicDomain( $domains ) {
		if ( ! in_array( 'wp-loyalty-rules', $domains ) ) {
			$domains[] = 'wp-loyalty-rules';
		}

		return $domains;
	}
}