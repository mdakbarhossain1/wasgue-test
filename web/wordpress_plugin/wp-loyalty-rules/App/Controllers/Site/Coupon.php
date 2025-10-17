<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Controllers\Site;

use WC_Coupon;
use WC_Discounts;
use Wlr\App\Helpers\Base;
use Wlr\App\Helpers\EarnCampaign;
use Wlr\App\Helpers\FreeProduct;
use Wlr\App\Helpers\Rewards;
use Wlr\App\Helpers\Woocommerce;
use Wlr\App\Models\UserRewards;

defined( 'ABSPATH' ) or die;

class Coupon {
	static $user_reward_cart_coupon_label = [];

	/**
	 * Apply a coupon to the cart if it meets certain conditions.
	 *
	 * @return void
	 * @throws \Exception
	 */
	public static function applyCartCoupon() {
		$woocommerce = Woocommerce::getInstance();

		if ( $woocommerce->isBannedUser() || is_admin() || ( function_exists( 'WC' ) && WC()->is_rest_api_request() ) ) {
			return;
		}

		$discount_code = $woocommerce->getSession( 'wlr_discount_code', '' );
		$cart          = $woocommerce->getCart();

		if ( ! empty( $discount_code ) && $woocommerce->isValidCoupon( $discount_code )
		     && ! empty( $cart ) && $cart->get_cart() && ! $woocommerce->hasDiscount( $discount_code ) ) {
			$woocommerce->setSession( 'wlr_discount_code', '' );
			$cart->apply_coupon( $discount_code );
			Rewards::setCouponRemainingAmount( $discount_code, 0 );
		} elseif ( ! empty( $discount_code ) && ! empty( $cart ) && $cart->get_cart() ) {

			$message = '';
			if ( class_exists( 'WC_Coupon' ) ) {
				$coupon    = new WC_Coupon( $discount_code );
				$discounts = new WC_Discounts( $cart );
				$valid     = $discounts->is_coupon_valid( $coupon );
				if ( is_wp_error( $valid ) ) {
					$message = $coupon->get_error_message();
					if ( empty( $message ) && $woocommerce->isMethodExists( $valid, 'get_error_message' ) ) {
						$message = $valid->get_error_message();
					}
				}
			}
			if ( ! empty( $message ) && apply_filters( 'wlr_show_auto_apply_coupon_error_message', true, $discount_code ) ) {
				$woocommerce->setSession( 'wlr_discount_code', '' );
				wc_add_notice( $message, 'error' );
			}
		}
		do_action( 'wlr_after_apply_cart_coupon', $discount_code );
	}

	/**
	 * Validate a reward coupon.
	 *
	 * @param bool $is_valid The current validity status of the coupon.
	 * @param WC_Coupon $coupon The coupon object being validated.
	 * @param WC_Discounts $discount The discount object associated with the coupon.
	 *
	 * @return bool  The updated validity status of the coupon.
	 */
	public static function validateRewardCoupon( $is_valid, $coupon, $discount ) {
		$woocommerce = Woocommerce::getInstance();
		if ( ! $is_valid || empty( $coupon ) || ! is_object( $coupon ) || ! $woocommerce->isMethodExists( $coupon, 'get_code' ) ) {
			return $is_valid;
		}

		$code          = $coupon->get_code();
		$reward_helper = Rewards::getInstance();
		// 1. validate is WPLoyalty reward
		if ( ! $reward_helper->is_loyalty_coupon( $coupon ) ) {
			return $is_valid;
		}

		// 2. validate user
		$billing_email = isset( $_POST['billing_email'] ) ? sanitize_email( wp_unslash( $_POST['billing_email'] ) ) : '';//phpcs:ignore WordPress.Security.NonceVerification.Missing

		$user_email = $woocommerce->get_login_user_email();
		if ( ! empty( $billing_email ) && ! empty( $user_email ) && strtolower( $billing_email ) != strtolower( $user_email ) ) {
			// $this->removeFreeProduct($code);
			return false;
		}

		$user_email = sanitize_email( $user_email );
		$user_email = apply_filters( 'wlr_validate_reward_coupon_user_email', $user_email, $coupon, $discount );

		if ( empty( $user_email ) || $woocommerce->isBannedUser( $user_email ) ) {
			//$this->removeFreeProduct($code);
			return false;
		}

		// 3. validate coupon have User Reward record
		$user_reward = $reward_helper->getUserRewardByCoupon( $code );
		if ( empty( $user_reward ) || ! isset( $user_reward->email ) || ( $user_reward->email != $user_email )
		     || ( isset( $user_reward->status ) && in_array( $user_reward->status, [ 'used', 'expired' ] ) ) ) {
			// $this->removeFreeProduct($code);
			return false;
		}

		// 4. validate WPLoyalty coupon conditions
		$extra = apply_filters( 'wlr_validate_reward_coupon_extra_data', [
			'user_email'         => $user_email,
			'cart'               => $woocommerce->getCart(),
			'is_calculate_based' => 'cart'
		], $coupon, $discount );

		if ( ! $reward_helper->processRewardConditions( $user_reward, $extra ) ) {
			//$this->removeFreeProduct($code);
			return false;
		}
		// 4. extra validation filter
		if ( ! apply_filters( 'wlr_reward_coupon_is_valid', $is_valid, $coupon, $user_reward ) ) {
			// $this->removeFreeProduct($code);
			return false;
		}

		// 5. validate cart have valid product
		if ( apply_filters( 'wlr_check_normal_product_available', true, $is_valid, $coupon, $discount, $user_reward ) ) {
			if ( ! self::getNormalProductCount() ) {
				//$this->removeFreeProduct($code);
				return false;
			}
		}

		$free_product_helper = FreeProduct::getInstance();
		$free_product_list   = $free_product_helper->getFreeProductList( $code );

		if ( empty( $free_product_list ) ) {
			return $is_valid;
		}

		foreach ( $free_product_list as $product_id => $free_product ) {
			$product = $woocommerce->getProduct( $product_id );
			if ( $woocommerce->isMethodExists( $product, 'is_in_stock' ) && ! $product->is_in_stock() ) {
				//$this->removeFreeProduct($code);
				return false;
			}
		}

		return $is_valid;
	}

	/**
	 * Validates the error message for a reward coupon.
	 *
	 * @param string $message The error message to be validated.
	 * @param int $err_code The error code associated with the coupon.
	 * @param object $coupon The coupon object.
	 *
	 * @return string Returns the validated error message.
	 */
	public static function validateRewardCouponErrorMessage( $message, $err_code, $coupon ) {
		$woocommerce = Woocommerce::getInstance();
		if ( empty( $coupon ) || ! $woocommerce->isMethodExists( $coupon, 'get_code' ) ) {
			return $message;
		}

		$code          = $coupon->get_code();
		$reward_helper = Rewards::getInstance();
		if ( ! $reward_helper->is_loyalty_coupon( $code ) ) {
			return $message;
		}

		if ( apply_filters( 'wlr_is_validate_reward_coupon_error_message', false, $err_code, $coupon ) ) {
			return $message;
		}

		$user_email = $woocommerce->get_login_user_email();
		$user_email = sanitize_email( $user_email );
		if ( empty( $user_email ) ) {
			return __( 'Please login before applying the coupon', 'wp-loyalty-rules' );
		}

		$user_reward = $reward_helper->getUserRewardByCoupon( $code );
		if ( empty( $user_reward ) || ! isset( $user_reward->email ) || ( $user_reward->email != $user_email )
		     || ( isset( $user_reward->status ) && in_array( $user_reward->status, [ 'used', 'expired' ] ) )
		     || $woocommerce->isBannedUser() ) {
			return __( 'This coupon is not applicable for the current user', 'wp-loyalty-rules' );
		}

		$extra  = [
			'user_email'         => $user_email,
			'cart'               => WC()->cart,
			'is_calculate_based' => 'cart'
		];
		$status = $reward_helper->processRewardConditions( $user_reward, $extra );
		if ( ! $status ) {
			return __( 'This coupon cannot be used for the current cart', 'wp-loyalty-rules' );
		}

		return $message;
	}

	/**
	 * Removes applied loyalty coupons for banned user from the cart.
	 *
	 * @param object $cart The cart object.
	 *
	 * @return void
	 */
	public static function removeAppliedCouponForBannedUser( $cart ) {
		$woocommerce = Woocommerce::getInstance();
		if ( ! empty( $cart ) && $woocommerce->isBannedUser() ) {
			$reward_helper   = Rewards::getInstance();
			$applied_coupons = $cart->get_applied_coupons();
			if ( ! empty( $applied_coupons ) ) {
				foreach ( $applied_coupons as $coupon ) {
					if ( ! empty( $coupon ) && $reward_helper->is_loyalty_coupon( $coupon ) ) {
						$cart->remove_coupon( $coupon );
						wc_clear_notices();
					}
				}
			}
		}
	}

	/**
	 * Changes the label for a coupon.
	 *
	 * @param string $label The current label for the coupon.
	 * @param object $coupon The coupon object.
	 *
	 * @return string The new label for the coupon.
	 */
	public static function changeCouponLabel( $label, $coupon ) {
		$woocommerce   = Woocommerce::getInstance();
		$reward_helper = new \Wlr\App\Helpers\Rewards();
		if ( $woocommerce->isMethodExists( $coupon, 'get_code' ) && ! $woocommerce->isBannedUser() ) {
			$code = $coupon->get_code();
			if ( isset( self::$user_reward_cart_coupon_label[ $code ] ) && ! empty( self::$user_reward_cart_coupon_label[ $code ] ) ) {
				return self::$user_reward_cart_coupon_label[ $code ];
			}

			$reward = $reward_helper->getUserRewardByCoupon( $code );
			if ( ! empty( $reward ) ) {
				//phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText
				$label                                        = __( $reward->display_name, 'wp-loyalty-rules' ) . '(' . strtoupper( $code ) . ')';
				self::$user_reward_cart_coupon_label[ $code ] = $label;
			}
		}

		return $label;
	}

	/**
	 * Retrieves the count of normal products in the cart.
	 *
	 * @return int Returns the count of normal products in the cart.
	 */
	public static function getNormalProductCount() {
		$count = 0;
		if ( function_exists( 'WC' ) && isset( WC()->cart ) ) {
			foreach ( WC()->cart->cart_contents as $item ) {
				if ( ! isset( $item['loyalty_free_product'] ) || $item['loyalty_free_product'] != 'yes' ) {
					$count += 1;
				}
			}
		}

		return $count;
	}

	/**
	 * Expire a coupon when it is deleted.
	 *
	 * @param int $post_id The ID of the post being deleted.
	 *
	 * @return void
	 */
	public static function expireCouponOnDelete( $post_id ) {
		if ( ! function_exists( 'get_post_type' ) || ! function_exists( 'get_the_title' ) ) {
			return;
		}
		if ( get_post_type( $post_id ) !== 'shop_coupon' ) {
			return;
		}
		$coupon_code = get_the_title( $post_id );
		$base        = new Base();
		if ( ! $base->is_loyalty_coupon( $coupon_code ) ) {
			return;
		}
		global $wpdb;
		$where       = $wpdb->prepare( 'discount_code = %s AND status = %s', [ $coupon_code, 'active' ] );
		$user_reward = new UserRewards();
		$coupon      = $user_reward->getWhere( $where );

		if ( empty( $coupon ) || ! is_object( $coupon ) ) {
			return;
		}

		$woocommerce = Woocommerce::getInstance();
		$update_data = [ 'status' => 'expired', 'end_at' => strtotime( gmdate( "Y-m-d 00:00:00" ) ) ];
		$where       = [ 'discount_code' => $coupon_code ];

		if ( ! $user_reward->updateRow( $update_data, $where ) ) {
			return;
		}
		// Update log data
		/* translators: %s is the coupon code */
		$note     = sprintf( __( 'Coupon %s deleted by admin.', 'wp-loyalty-rules' ), $coupon_code );
		$log_data = [
			'user_email'          => $woocommerce->get_login_user_email(),
			'action_type'         => 'admin_change',
			'reward_id'           => $coupon->reward_id,
			'user_reward_id'      => $coupon->id,
			'campaign_id'         => $coupon->campaign_id,
			'note'                => $note,
			'customer_note'       => $note,
			'created_at'          => strtotime( gmdate( "Y-m-d H:i:s" ) ),
			'modified_at'         => 0,
			'discount_code'       => $coupon_code,
			'action_process_type' => 'coupon_deleted',
			'reward_display_name' => $coupon->display_name,
		];
		$base->add_note( $log_data );

		$earn_campaign_helper = new EarnCampaign();
		if ( ! empty( $coupon->reward_type ) || $coupon->reward_type == 'redeem_point' ) {
			// revert point if a coupon is redeemed using points
			$user        = $earn_campaign_helper->getPointUserByEmail( $coupon->email );
			$action_data = [
				'user_email'          => $coupon->email,
				'points'              => (int) $coupon->require_point,
				'action_type'         => 'admin_change',
				'action_process_type' => 'coupon_deleted',
				// translators: 1: point, 2: point label, 3: coupon code
				'customer_note'       => sprintf( __( '%1$d %2$s added because coupon %3$s deleted by admin', 'wp-loyalty-rules' ), (int) $coupon->require_point, $earn_campaign_helper->getPointLabel( $coupon->require_point ), $coupon_code ),
				// translators: 1: email, 2: point label, 3: old points, 4: new points, 5: coupon code
				'note'                => sprintf( __( '%1$s customer %2$s changed from %3$d to %4$d because coupon  %5$s deleted by admin', 'wp-loyalty-rules' ), $user->user_email, $earn_campaign_helper->getPointLabel( 0 ), $user->points, ( $user->points + $coupon->require_point ), $coupon_code ),
				'user_reward_id'      => $coupon->id,
				'reward_id'           => $coupon->reward_id,
				'reward_display_name' => $coupon->display_name,
			];
			$earn_campaign_helper->addExtraPointAction( 'admin_change', $coupon->require_point, $action_data, 'credit', true, false, false );
		}
	}
}