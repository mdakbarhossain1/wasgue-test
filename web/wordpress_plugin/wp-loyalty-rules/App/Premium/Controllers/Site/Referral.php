<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-3.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Controllers\Site;

use Wlr\App\Controllers\Base;
use Wlr\App\Helpers\Woocommerce;

defined( 'ABSPATH' ) or die;

class Referral extends Base {
	/*Referral*/
	function checkAndUpdateLocalStorage() {
		$wlr_ref = (string) self::$input->post_get( 'wlr_ref', '' );
		if ( ! empty( $wlr_ref ) ) {
			//phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo "<script>let is_local_storage = ( 'localStorage' in window && window.localStorage !== null );
		if(is_local_storage){
		    window.localStorage.setItem('wployalty_referral_code','$wlr_ref');
		}
		</script>";
		}
	}

	function updateReferralCodeToSession() {
		$wlr_nonce = (string) self::$input->post_get( 'wlr_nonce', '' );
		if ( ! Woocommerce::verify_nonce( $wlr_nonce, 'wlr_reward_nonce' ) ) {
			$message = __( 'Invalid nonce', 'wp-loyalty-rules' );
			$json    = array(
				'success' => false,
				'message' => $message
			);
			wc_add_notice( $message, 'error' );
			wp_send_json_error( $json );
		}
		$wlr_ref  = (string) self::$input->post_get( 'referral_code', '' );
		$ref_code = self::$woocommerce->get_referral_code();
		if ( ! empty( $wlr_ref ) && empty( $ref_code ) ) {
			$referral_code = sanitize_text_field( $wlr_ref );
			self::$woocommerce->initWoocommerceSession();
			self::$woocommerce->set_referral_code( $referral_code );
		}
		$json = array(
			'success' => true,
		);
		wp_send_json_success( $json );
	}

	function setReferCouponToSession() {
		$wlr_ref = (string) self::$input->post_get( 'wlr_ref', '' );
		$wlr_ref = apply_filters( 'wlr_before_set_referral_code', $wlr_ref );
		if ( ! empty( $wlr_ref ) ) {
			$referral_code = sanitize_text_field( $wlr_ref );
			self::$woocommerce->initWoocommerceSession();
			self::$woocommerce->set_referral_code( $referral_code );
		}
	}

	function createReferral( $order_id ) {
		if ( empty( $order_id ) ) {
			return;
		}
		$order_obj = self::$woocommerce->getOrder( $order_id );
		if ( is_object( $order_obj ) ) {
			$user_email = self::$woocommerce->getOrderEmail( $order_obj );
			if ( ! empty( $user_email ) && self::$woocommerce->isBannedUser( $user_email ) ) {
				return;
			}
			$this->updateReferralData( $order_obj, $order_id );
		}
	}

	/**
	 * @param $order_obj
	 * @param $order_id
	 *
	 * @return void
	 */
	public function updateReferralData( $order_obj, $order_id ) {
		if ( ! is_object( $order_obj ) || $order_id <= 0 ) {
			return;
		}
		/*//$order_obj = wc_get_order($order_id);
		if(self::$woocommerce->isMethodExists($order_obj,'get_meta')){
			$referral_code = self::$woocommerce->get_referral_code();
			if(empty($referral_code)) $referral_code = $order_obj->get_meta('wlr_referral_code');
		}*/
		$earn_campaign  = \Wlr\App\Premium\Helpers\Referral::getInstance();
		$userEmail      = $earn_campaign->getCustomerEmail( '', $order_obj );
		$advocate_email = $earn_campaign->getAdvocateEmail( $userEmail );
		if ( ! empty( $userEmail ) && ! empty( $advocate_email ) ) {
			$data = array(
				'user_email'         => $userEmail,
				'advocate_email'     => $advocate_email,
				'order'              => $order_obj,
				'order_id'           => $order_id,
				'is_calculate_based' => 'order'
			);
			$earn_campaign->checkReferralTable( $data, 1 );
		}
	}

	function updateProPoints( $order_id, $from_status, $to_status, $order_obj ) {
		if ( is_object( $order_obj ) ) {
			$user_email = self::$woocommerce->getOrderEmail( $order_obj );
			if ( self::$woocommerce->isBannedUser( $user_email ) ) {
				return;
			}
		}
		if ( ! empty( $order_id ) ) {
			$earn_campaign = \Wlr\App\Premium\Helpers\Referral::getInstance();
			//$order = self::$woocommerce->getOrder($order_id);
			$options        = get_option( 'wlr_settings', '' );
			$earning_status = ( isset( $options['wlr_earning_status'] ) && ! empty( $options['wlr_earning_status'] ) ? $options['wlr_earning_status'] : array(
				'processing',
				'completed'
			) );
			if ( is_string( $earning_status ) ) {
				$earning_status = explode( ',', $earning_status );
			}
			$this->updateReferralData( $order_obj, $order_id );
			if ( is_array( $earning_status ) && in_array( $order_obj->get_status(), $earning_status ) ) {
				$earn_campaign->processReferralEarnPoint( $order_id );
			}
		}
	}

	function getPointAdvocateReferral( $point, $rule, $data ) {
        if ( self::$woocommerce->isBannedUser( $data['user_email'] ) ) {
            return 0;
        }
		$referral_helper = \Wlr\App\Premium\Helpers\Referral::getInstance();

		return $referral_helper->getTotalReferralEarn( $point, $rule, $data, 'advocate', 'point' );
	}

	function getCouponAdvocateReferral( $reward, $rule, $data ) {
        if ( self::$woocommerce->isBannedUser( $data['user_email'] ) ) {
            return $reward;
        }
		$referral_helper = \Wlr\App\Premium\Helpers\Referral::getInstance();

		return $referral_helper->getTotalReferralEarn( $reward, $rule, $data, 'advocate', 'coupon' );
	}

	function getPointFriendReferral( $point, $rule, $data ) {
        if ( self::$woocommerce->isBannedUser( $data['user_email'] ) ) {
            return 0;
        }
		$referral_helper = \Wlr\App\Premium\Helpers\Referral::getInstance();

		return $referral_helper->getTotalReferralEarn( $point, $rule, $data, 'friend', 'point' );
	}

	function getCouponFriendReferral( $reward, $rule, $data ) {
        if ( self::$woocommerce->isBannedUser( $data['user_email'] ) ) {
            return $reward;
        }
		$referral_helper = \Wlr\App\Premium\Helpers\Referral::getInstance();

		return $referral_helper->getTotalReferralEarn( $reward, $rule, $data, 'friend', 'coupon' );
	}
}