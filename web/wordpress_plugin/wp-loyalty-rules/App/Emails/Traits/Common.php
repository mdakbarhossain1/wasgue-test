<?php

namespace Wlr\App\Emails\Traits;

use Wlr\App\Helpers\Woocommerce;
use Wlr\App\Models\EarnCampaign;
use Wlr\App\Models\Users;

trait Common {
	function setLocale( $lang ) {
		global $wp_locale_switcher;

		if ( function_exists( 'switch_to_locale' ) && isset( $wp_locale_switcher ) ) {
			switch_to_locale( $lang );

			// Filter on plugin_locale so load_plugin_textdomain loads the correct locale.
			add_filter( 'plugin_locale', 'get_locale' );

			// Init WC locale.
			WC()->load_plugin_textdomain();
		}
	}

	function isEligibleForSentEmail( $action_type, $data ) {
		if ( $action_type != 'birthday' ) {
			return true;
		}
		if ( isset( $data['campaign_id'] ) && $data['campaign_id'] > 0 ) {
			$campaign_model = new EarnCampaign();
			$campaign       = $campaign_model->getByKey( $data['campaign_id'] );
			if ( empty( $campaign ) || $campaign->id <= 0 ) {
				return true;
			}
			$woocommerce_helper = Woocommerce::getInstance();
			$point_rule         = isset( $campaign->point_rule ) && $woocommerce_helper->isJson( $campaign->point_rule ) ? json_decode( $campaign->point_rule ) : '';
			if ( empty( $point_rule ) ) {
				return true;
			}
			if ( isset( $point_rule->birthday_earn_type ) && $point_rule->birthday_earn_type == 'on_their_birthday' ) {
				return false;
			}
		}

		return true;
	}

	function getLoyaltyUser( $email ) {
		if ( empty( $email ) ) {
			return false;
		}
		$user_model = new Users();

		return $user_model->getQueryData( [
			'user_email' => [
				'operator' => '=',
				'value'    => $email
			]
		], '*', [], false, true );
	}

	function getWPUser( $email ) {
		if ( empty( $email ) || ! is_string( $email ) ) {
			return false;
		}

		return get_user_by( 'email', $email );
	}

	function getUserDisplayName( $email ) {
		if ( empty( $email ) || ! is_string( $email ) ) {
			return '';
		}
		$wp_user      = $this->getWPUser( $email );
		$display_name = '';
		if ( is_object( $wp_user ) && method_exists( $wp_user, 'get' ) ) {
			$display_name = $wp_user->get( 'display_name' );
		}

		return $display_name;
	}
}