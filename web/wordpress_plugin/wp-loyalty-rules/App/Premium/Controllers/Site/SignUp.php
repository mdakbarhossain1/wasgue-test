<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Controllers\Site;

use Automattic\WooCommerce\StoreApi\Schemas\V1\CheckoutSchema;
use Wlr\App\Controllers\Base;
use Wlr\App\Helpers\EarnCampaign;
use Wlr\App\Premium\Helpers\Referral;

defined( 'ABSPATH' ) or die;

class SignUp extends Base {
	function wooSignUpMessage( $checkout ) {
		$this->registerForm();
	}

	function registerForm() {
		if ( ! apply_filters( 'wlr_show_signup_message_for_guest_user', true ) ) {
			return;
		}
		$earn_campaign    = EarnCampaign::getInstance();
		$cart_action_list = array(
			'signup'
		);
		$extra            = array( 'user_email' => self::$woocommerce->get_login_user_email(), 'is_message' => true );
		$reward_list      = $earn_campaign->getActionEarning( $cart_action_list, $extra );
		$message          = '';
		foreach ( $reward_list as $rewards ) {
			foreach ( $rewards as $reward ) {
				if ( isset( $reward['messages'] ) && ! empty( $reward['messages'] ) ) {
					$message .= $reward['messages'] . "<br/>";
				}
			}
		}
		echo wp_kses_post( $message );
	}

	/**
	 * Get block signup message.
	 *
	 * @param string $message Message.
	 *
	 * @return string
	 */
	function getBlockSignupMessage( $message ) {
		$earn_campaign    = EarnCampaign::getInstance();
		$cart_action_list = array(
			'signup'
		);
		$extra            = array( 'user_email' => self::$woocommerce->get_login_user_email(), 'is_message' => true );
		$reward_list      = $earn_campaign->getActionEarning( $cart_action_list, $extra );
		$message          = '';
		foreach ( $reward_list as $rewards ) {
			foreach ( $rewards as $reward ) {
				if ( isset( $reward['messages'] ) && ! empty( $reward['messages'] ) ) {
					$message .= $reward['messages'] . "<br/>";
				}
			}
		}

		return $message;
	}

	/**
	 * Add signup endpoint data.
	 *
	 * @param object $extend Extend object.
	 *
	 * @return void
	 */
	function addCheckoutBlockSignupMessage( $extend ) {
		if ( ! is_object( $extend ) ) {
			return;
		}
		$extend->register_endpoint_data(
			[
				'endpoint'        => CheckoutSchema::IDENTIFIER,
				'namespace'       => 'wlr_checkout_signup_block',
				'schema_callback' => [ $this, 'getSignUpSchema' ],//wlr_checkout_signup_block
				'schema_type'     => ARRAY_A,
			]
		);
	}

	/**
	 * Get signup schema.
	 *
	 * @return array[]
	 */
	function getSignUpSchema() {
		return [
			'sign_up_message' => [
				'description' => __( 'Checkout signup message', 'wp-loyalty-rules' ),
				'type'        => array( 'string', 'null' ),
				'context'     => array(),
			]
		];
	}

	public function createAccountAction( $user_id ) {
		if ( empty( $user_id ) ) {
			return;
		}
		$user      = get_user_by( 'id', $user_id );
		$userEmail = '';
		if ( ! empty( $user ) ) {
			$userEmail = $user->user_email;
		}
		$status = apply_filters( 'wlr_user_role_status', true, $user );
		if ( ! $status
		     || ! apply_filters( 'wlr_before_add_to_loyalty_customer', true,
				$user_id, $userEmail )
		) {
			return;
		}
		if ( ! empty( $userEmail ) && ! self::$woocommerce->isBannedUser( $userEmail ) ) {
			$sign_up_helper = \Wlr\App\Premium\Helpers\SignUp::getInstance();
			$action_data    = array(
				'user_email' => $userEmail
			);
			$sign_up_helper->applyEarnSignUp( $action_data );
			$referral_helper = new Referral();
			$referral_helper->doReferralCheck( $action_data );
		}
	}

	function getPointSignUp( $point, $rule, $data ) {
		$point_for_purchase = \Wlr\App\Premium\Helpers\SignUp::getInstance();

		return $point_for_purchase->getTotalEarnPoint( $point, $rule, $data );
	}

	function getCouponSignUp( $point, $rule, $data ) {
		$point_for_purchase = \Wlr\App\Premium\Helpers\SignUp::getInstance();

		return $point_for_purchase->getTotalEarnReward( $point, $rule, $data );
	}

}