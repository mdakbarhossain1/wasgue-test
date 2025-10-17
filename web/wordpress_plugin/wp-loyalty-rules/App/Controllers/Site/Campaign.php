<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Controllers\Site;

use Wlr\App\Helpers\Base;
use Wlr\App\Helpers\Woocommerce;
use WP_User;

defined( 'ABSPATH' ) or die;

class Campaign {

	/**
	 * Adds a loyalty user from WP login.
	 *
	 * @param string $user_name The username of the user.
	 * @param WP_User $user The WP_User object containing user details.
	 *
	 * @return void
	 */
	public static function addLoyaltyUserFromWPLogin( $user_name, $user ) {
		$user_email = ! empty( $user->user_email ) ? $user->user_email : '';
		if ( ! empty( $user_email ) ) {
			$woocommerce_helper = Woocommerce::getInstance();
			if($woocommerce_helper->isBannedUser( $user_email )){
				return;
			}
			$base_helper = new Base();
			$base_helper->addCustomerToLoyalty( $user_email );
		}
	}

	/**
	 * Adds a loyalty user from WP register.
	 *
	 * @param int $user_id The ID of the user.
	 *
	 * @return void
	 */
	public static function addLoyaltyUserFromWPRegister( $user_id ) {
		if ( empty( $user_id ) || $user_id <= 0 ) {
			return;
		}
		$user       = get_user_by( 'id', $user_id );
		$user_email = ! empty( $user->user_email ) ? $user->user_email : '';
		$status     = apply_filters( 'wlr_user_role_status', true, $user );

		if ( ! $status || ! apply_filters( 'wlr_before_add_to_loyalty_customer', true, $user_id, $user_email ) ) {
			return;
		}

		if ( ! empty( $user_email ) ) {
			$base_helper = new Base();
			$base_helper->addCustomerToLoyalty( $user_email, 'signup' );
		}
	}
}