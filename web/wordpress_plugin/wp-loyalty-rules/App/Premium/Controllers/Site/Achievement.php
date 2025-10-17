<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-3.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Controllers\Site;

use Wlr\App\Controllers\Base;

defined( 'ABSPATH' ) or die;

class Achievement extends Base {
	function getPointAchievement( $point, $rule, $data ) {
		if ( self::$woocommerce->isBannedUser( $data['user_email'] ) ) {
			return 0;
		}
		$achievement_helper = \Wlr\App\Premium\Helpers\Achievement::getInstance();

		return $achievement_helper->getTotalEarnPoint( $point, $rule, $data );
	}

	function getCouponAchievement( $reward, $rule, $data ) {
		if ( self::$woocommerce->isBannedUser( $data['user_email'] ) ) {
			return $reward;
		}
		$achievement_helper = \Wlr\App\Premium\Helpers\Achievement::getInstance();

		return $achievement_helper->getTotalEarnReward( $reward, $rule, $data );
	}

	function handleAchievementLevel( $old_level_id, $user_details ) {
		if ( ! is_array( $user_details ) || ! isset( $user_details['user_email'] ) || empty( $user_details['user_email'] )
		     || ! isset( $user_details['level_id'] ) || self::$woocommerce->isBannedUser( $user_details['user_email'] ) ) {
			return;
		}
		if ( $old_level_id != $user_details['level_id'] ) {
			$action_data        = array(
				'user_email'       => $user_details['user_email'],
				'old_level'        => $old_level_id,
				'achievement_type' => 'level_update',
				'action_sub_type'  => 'level_update',
				'action_sub_value' => $user_details['level_id']
			);
			$achievement_helper = \Wlr\App\Premium\Helpers\Achievement::getInstance();
			$achievement_helper->applyEarnLevel( $action_data );
		}
	}

	function handleAchievementDailyLogin( $user_name, $user ) {
		$user_email = isset( $user->user_email ) && ! empty( $user->user_email ) ? $user->user_email : '';
		if ( ! empty( $user_email ) && ! self::$woocommerce->isBannedUser( $user_email ) ) {
			$action_data = array(
				'user_email'       => $user_email,
				'achievement_type' => 'daily_login',
				'action_sub_type'  => 'daily_login',
				'action_sub_value' => 0
			);

			$achievement_helper = \Wlr\App\Premium\Helpers\Achievement::getInstance();
			$achievement_helper->applyEarnDailyLogin( $action_data );
		}
	}
}