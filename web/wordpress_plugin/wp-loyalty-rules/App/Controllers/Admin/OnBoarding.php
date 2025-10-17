<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Controllers\Admin;

use Automattic\WooCommerce\Admin\PluginsHelper;
use Wlr\App\Helpers\Input;
use Wlr\App\Helpers\Util;
use Wlr\App\Models\EarnCampaign;
use Wlr\App\Models\Rewards;

defined( 'ABSPATH' ) or die;

class OnBoarding {
	/**
	 * Saves the onboarding data.
	 *
	 * @return void
	 */
	public static function saveOnBoarding() {
		if ( ! Util::isBasicSecurityValid( 'wlr_common_user_nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$input                  = new Input();
		$post_data              = $input->post();
		$post_data['campaigns'] = ! empty( $post_data['campaigns'] ) ? json_decode( stripslashes( $post_data['campaigns'] ), true ) : [];
		$post_data['rewards']   = ! empty( $post_data['rewards'] ) ? json_decode( stripslashes( $post_data['rewards'] ), true ) : [];
		$post_data['referrals'] = ! empty( $post_data['referrals'] ) ? json_decode( stripslashes( $post_data['referrals'] ), true ) : [];
		$post_data              = apply_filters( 'wlr_on_boarding_before_save', $post_data );
		if ( is_array( $post_data['campaigns'] ) && ! empty( $post_data['campaigns'] ) ) {
			$earn_campaign_model = new EarnCampaign();
			foreach ( $post_data['campaigns'] as $action_type => $campaign ) {
				$campaign_data = [
					'levels'                 => '',
					'active'                 => 1,
					'ordering'               => 0,
					'is_show_way_to_earn'    => 1,
					'start_at'               => 0,
					'end_at'                 => 0,
					'icon'                   => '',
					'campaign_type'          => 'point',
					'point_rule'             => '',
					'usage_limits'           => 0,
					'condition_relationship' => 'and',
					'conditions'             => '',
					'priority'               => 0
				];
				if ( $action_type == 'point_for_purchase' ) {
					$point_rule                   = [
						'wlr_point_earn_price'         => ! empty( $campaign['wlr_point_earn_price'] ) && $campaign['wlr_point_earn_price'] > 0 ? $campaign['wlr_point_earn_price'] : 0,
						'earn_point'                   => ! empty( $campaign['earn_point'] ) && $campaign['earn_point'] > 0 ? $campaign['earn_point'] : 0,
						'earn_reward'                  => '',
						'minimum_point'                => 0,
						'maximum_point'                => 0,
						'variable_product_message'     => 'Earn up to {wlr_product_points} {wlr_points_label}.',
						'single_product_message'       => 'Purchase & earn {wlr_product_points} {wlr_points_label}!',
						'is_rounded_edge'              => 'yes',
						'display_product_message_page' => 'all',
						'product_message_background'   => '',
						'product_message_text_color'   => '',
						'product_message_border_color' => ''
					];
					$campaign_data['name']        = 'Point For Purchase';
					$campaign_data['description'] = sprintf( '%s points for %s spend', $point_rule['earn_point'], $point_rule['wlr_point_earn_price'] );
					$campaign_data['action_type'] = $action_type;
					$campaign_data['point_rule']  = $point_rule;
					$earn_campaign_model->save( $campaign_data );

				} else if ( $action_type == 'purchase_histories' ) {
					$point_rule                   = [
						'no_of_purchase'         => 0,
						'minimum_spend_on_order' => 0,
						'earn_point'             => ! empty( $campaign['earn_point'] ) && $campaign['earn_point'] > 0 ? $campaign['earn_point'] : 0,
						'earn_reward'            => '',
					];
					$campaign_data['name']        = 'Order Goals';
					$campaign_data['description'] = sprintf( 'Earn %s Points', $point_rule['earn_point'] );
					$campaign_data['action_type'] = $action_type;
					$campaign_data['point_rule']  = $point_rule;
					$earn_campaign_model->save( $campaign_data );
				} else if ( $action_type == 'signup' ) {
					$point_rule                   = [
						'earn_point'     => ! empty( $campaign['earn_point'] ) && $campaign['earn_point'] > 0 ? $campaign['earn_point'] : 0,
						'earn_reward'    => '',
						'signup_message' => 'Signup and earn {wlr_points} {wlr_points_label}!',
					];
					$campaign_data['name']        = 'Sign up';
					$campaign_data['description'] = sprintf( 'Earn %s Points', $point_rule['earn_point'] );
					$campaign_data['action_type'] = $action_type;
					$campaign_data['point_rule']  = $point_rule;
					$earn_campaign_model->save( $campaign_data );
				}
			}
		}
		if ( is_array( $post_data['rewards'] ) && ! empty( $post_data['rewards'] ) ) {
			$reward_model = new Rewards();
			foreach ( $post_data['rewards'] as $discount_type => $reward ) {
				if ( ! in_array( $discount_type, [ 'points_conversion', 'fixed_cart', 'percent' ] ) ) {
					continue;
				}
				$reward_data = [
					'reward_type'            => 'redeem_point',
					'active'                 => 1,
					'ordering'               => 0,
					'is_show_reward'         => 1,
					'icon'                   => '',
					'free_product'           => [],
					'display_name'           => 'Reward',
					'expire_after'           => 0,
					'expire_period'          => 'day',
					'enable_expiry_email'    => 0,
					'expire_email'           => 0,
					'expire_email_period'    => 'day',
					'usage_limits'           => 0,
					'condition_relationship' => 'and',
					'conditions'             => '',
					'minimum_point'          => 0,
					'maximum_point'          => 0,
					'discount_type'          => $discount_type,
					'discount_value'         => ! empty( $reward['discount_value'] ) && $reward['discount_value'] > 0 ? $reward['discount_value'] : 0,
					'require_point'          => ! empty( $reward['require_point'] ) && $reward['require_point'] > 0 ? $reward['require_point'] : 0
				];
				if ( $discount_type == 'points_conversion' ) {
					$reward_data['name']        = 'Point Conversion';
					$reward_data['description'] = sprintf( '$%s discount for %s points', $reward_data['discount_value'], $reward_data['require_point'] );
				} elseif ( $discount_type == 'fixed_cart' ) {
					$reward_data['name']        = 'Fixed Discount';
					$reward_data['description'] = sprintf( '$%s discount', $reward_data['discount_value'] );
				} elseif ( $discount_type == 'percent' ) {
					$reward_data['name']        = 'Percentage Discount';
					$reward_data['description'] = sprintf( '%s discount', $reward_data['discount_value'] . '%' );
				}

				$reward_model->save( $reward_data );
			}
		}
		if ( is_array( $post_data['referrals'] ) && ! empty( $post_data['referrals'] ) ) {
			$campaign_data       = [
				'levels'                 => '',
				'active'                 => 1,
				'ordering'               => 0,
				'is_show_way_to_earn'    => 1,
				'start_at'               => 0,
				'end_at'                 => 0,
				'icon'                   => '',
				'campaign_type'          => 'point',
				'point_rule'             => '',
				'usage_limits'           => 0,
				'condition_relationship' => 'and',
				'conditions'             => '',
				'priority'               => 0
			];
			$friend_earn_point   = isset( $post_data['referrals']['friend']['earn_point'] ) && $post_data['referrals']['friend']['earn_point'] > 0 ? $post_data['referrals']['friend']['earn_point'] : 0;
			$advocate_earn_point = isset( $post_data['referrals']['advocate']['earn_point'] ) && $post_data['referrals']['advocate']['earn_point'] > 0 ? $post_data['referrals']['advocate']['earn_point'] : 0;
			if ( $advocate_earn_point > 0 && $friend_earn_point > 0 ) {
				$point_rule                   = [
					'advocate' => [
						'campaign_type' => 'point',
						'earn_type'     => 'fixed_point',
						'earn_point'    => $advocate_earn_point,
						'earn_reward'   => ''
					],
					'friend'   => [
						'campaign_type' => 'point',
						'earn_type'     => 'fixed_point',
						'earn_point'    => $friend_earn_point,
						'earn_reward'   => '',
					]
				];
				$campaign_data['name']        = 'Referral';
				$campaign_data['description'] = sprintf( 'You earn %s points, your friend earn %s points', $advocate_earn_point, $friend_earn_point );
				$campaign_data['action_type'] = 'referral';
				$campaign_data['point_rule']  = $point_rule;
				$earn_campaign_model          = new EarnCampaign();
				$earn_campaign_model->save( $campaign_data );
			}
		}
		if ( ! empty( $post_data['theme_color'] ) ) {
			$setting_options = \Wlr\App\Helpers\Settings::getSettings();
			if ( ! is_array( $setting_options ) ) {
				$setting_options = [];
			}
			//theme_color
			$setting_options['theme_color'] = $post_data['theme_color'];
			update_option( 'wlr_settings', $setting_options, true );
		}

		if ( ! empty( $post_data['need_to_install_launcher'] ) && $post_data['need_to_install_launcher'] === 'true' ) {
			try {
				require_once ABSPATH . 'wp-admin/includes/plugin.php';
				include_once ABSPATH . '/wp-admin/includes/admin.php';
				include_once ABSPATH . '/wp-admin/includes/plugin-install.php';
				include_once ABSPATH . '/wp-admin/includes/plugin.php';
				include_once ABSPATH . '/wp-admin/includes/class-wp-upgrader.php';
				include_once ABSPATH . '/wp-admin/includes/class-plugin-upgrader.php';
				$upgrader = new \Plugin_Upgrader( new \Automatic_Upgrader_Skin() );
				$status   = $upgrader->install( 'https://github.com/wployalty/wll-loyalty-launcher/releases/download/stable/wll-loyalty-launcher.zip' );
				if ( ! is_wp_error( $status ) ) {
					PluginsHelper::activate_plugins( [ 'wll-loyalty-launcher' ] );
				}
			} catch ( \Exception $e ) {

			}
		}
		update_option( 'wlr_is_on_boarding_completed', true, true );
		wp_send_json_success( [ 'message' => __( 'Basic setup finished', 'wp-loyalty-rules' ) ] );
	}

	/**
	 * Skips the onboarding process and marks it as completed.
	 *
	 * @return void
	 */
	public static function skipOnBoarding() {
		if ( ! Util::isBasicSecurityValid( 'wlr_common_user_nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		update_option( 'wlr_is_on_boarding_completed', true, true );
		wp_send_json_success();
	}
}