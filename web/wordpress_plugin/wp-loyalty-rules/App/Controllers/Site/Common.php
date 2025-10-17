<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Controllers\Site;

use Wlr\App\Helpers\Base;
use Wlr\App\Helpers\EarnCampaign;
use Wlr\App\Helpers\Settings;
use Wlr\App\Helpers\Woocommerce;

defined( 'ABSPATH' ) or die;

class Common {
	/**
	 * Add front-end scripts and styles for the loyalty plugin.
	 *
	 * @return void
	 */
	public static function addFrontEndScripts() {
		$woocommerce = Woocommerce::getInstance();

		if ( $woocommerce->isBannedUser() ) {
			return;
		}

		if ( ! apply_filters( 'wlr_before_loyalty_assets', true ) ) {
			return;
		}

		$suffix = '.min';
		if ( defined( 'SCRIPT_DEBUG' ) ) {
			$suffix = SCRIPT_DEBUG ? '' : '.min';
		}

		$cache_fix = apply_filters( 'wlr_load_asset_with_time', true );

		$add_cache_fix = ( $cache_fix ) ? '&t=' . time() : '';
		wp_register_style( WLR_PLUGIN_SLUG . '-alertify-front', WLR_PLUGIN_URL . 'Assets/Admin/Css/alertify' . $suffix . '.css', [], WLR_PLUGIN_VERSION );
		wp_register_style( WLR_PLUGIN_SLUG . '-main-front', WLR_PLUGIN_URL . 'Assets/Site/Css/wlr-main' . $suffix . '.css', [], WLR_PLUGIN_VERSION );
		wp_register_style( WLR_PLUGIN_SLUG . '-wlr-font', WLR_PLUGIN_URL . 'Assets/Site/Css/wlr-fonts' . $suffix . '.css', [], WLR_PLUGIN_VERSION );

		$css_handlers = apply_filters( 'wlr_front_css_handler', [
			WLR_PLUGIN_SLUG . '-alertify-front',
			WLR_PLUGIN_SLUG . '-main-front',
			WLR_PLUGIN_SLUG . '-wlr-font'
		] );

		foreach ( $css_handlers as $css_handler ) {
			wp_enqueue_style( $css_handler );
		}

		$main_js = [ 'jquery', ];
		if ( is_checkout() ) {
			$main_js[] = 'wc-checkout';
		}
		
		$main_js = apply_filters( 'wlr_load_site_main_js_depends', $main_js );

		wp_register_script( WLR_PLUGIN_SLUG . '-main', WLR_PLUGIN_URL . 'Assets/Site/Js/wlr-main' . $suffix . '.js', $main_js, WLR_PLUGIN_VERSION . $add_cache_fix, false );
		wp_register_script( WLR_PLUGIN_SLUG . '-alertify-front', WLR_PLUGIN_URL . 'Assets/Admin/Js/alertify' . $suffix . '.js', [], WLR_PLUGIN_VERSION, true );
		$js_handlers = apply_filters( 'wlr_front_js_handler', [
			'wc-cart-fragments',
			WLR_PLUGIN_SLUG . '-main',
			WLR_PLUGIN_SLUG . '-alertify-front'
		] );
		foreach ( $js_handlers as $js_handler ) {
			wp_enqueue_script( $js_handler );
		}

		$base_helper          = new Base();
		$earn_campaign_helper = EarnCampaign::getInstance();
		$localize             = apply_filters( 'wlr_before_load_localize', [
			/* translators: %s: point label */
			'point_popup_message'        => sprintf( __( 'How much %s you would like to use', 'wp-loyalty-rules' ), $base_helper->getPointLabel( 3 ) ),
			'popup_ok'                   => __( 'Ok', 'wp-loyalty-rules' ),
			'popup_cancel'               => __( 'Cancel', 'wp-loyalty-rules' ),
			/* translators: %s: reward label */
			'revoke_coupon_message'      => sprintf( __( 'Are you sure you want to return the %s ?', 'wp-loyalty-rules' ), $earn_campaign_helper->getRewardLabel() ),
			'wlr_redeem_nonce'           => wp_create_nonce( 'wlr_redeem_nonce' ),
			'wlr_reward_nonce'           => wp_create_nonce( 'wlr_reward_nonce' ),
			'apply_share_nonce'          => wp_create_nonce( 'wlr_social_share_nonce' ),
			'revoke_coupon_nonce'        => wp_create_nonce( 'wlr_revoke_coupon_nonce' ),
			'pagination_nonce'           => wp_create_nonce( 'wlr_pagination_nonce' ),
			'enable_sent_email_nonce'    => wp_create_nonce( 'wlr_enable_sent_email_nonce' ),
			'home_url'                   => get_home_url(),
			'ajax_url'                   => admin_url( 'admin-ajax.php' ),
			'admin_url'                  => admin_url(),
			'is_cart'                    => is_cart(),
			'is_checkout'                => is_checkout(),
			'plugin_url'                 => WLR_PLUGIN_URL,
			'is_pro'                     => apply_filters( 'wlr_is_pro', false ),
			'is_allow_update_referral'   => true,
			'theme_color'                => Settings::get( 'theme_color', '#4F47EB' ),
			'followup_share_window_open' => apply_filters( 'wlr_before_followup_share_window_open', true ),
			'social_share_window_open'   => apply_filters( 'wlr_before_social_share_window_open', true ),
			'is_checkout_block'          => is_checkout() && Woocommerce::isCheckoutBlock(),
		] );
		wp_localize_script( WLR_PLUGIN_SLUG . '-main', 'wlr_localize_data', $localize );
	}


	/**
	 * Refreshes the fragment script.
	 *
	 * @return void
	 */
	public static function refreshFragmentScript() {
		?>
        <script>
            function fireWhenFragmentReady() {
                jQuery(document.body).trigger('wc_fragment_refresh');
            }

            jQuery(document).ready(fireWhenFragmentReady);
        </script>
		<?php
	}

	/**
	 * Handles the 'my_point' shortcode.
	 *
	 * Retrieves the user's point and returns it as a string. If the user's email is banned,
	 * an empty string is returned.
	 *
	 * @return string The user's point as a string or an empty string if the user is banned.
	 */
	public static function handleMyPointShortcode() {
		$woocommerce = Woocommerce::getInstance();
		$user_email  = $woocommerce->get_login_user_email();
		if ( $woocommerce->isBannedUser( $user_email ) ) {
			return '';
		}
		$earn_campaign_helper = EarnCampaign::getInstance();

		return $earn_campaign_helper->getUserPoint( $user_email );
	}

	/**
	 * Update loyalty metadata for an order.
	 *
	 * @param int $order_id The ID of the order.
	 *
	 * @return void
	 */
	public static function updateLoyaltyMetaData( $order_id ) {
		if ( $order_id <= 0 ) {
			return;
		}
		$woocommerce = Woocommerce::getInstance();
		$meta        = [
			'_wlr_order_language' => apply_filters( 'wlr_order_site_language', $woocommerce->getPluginBasedOrderLanguage( $order_id ) ),
		];
		foreach ( $meta as $key => $value ) {
			$woocommerce->updateOrderMetaData( $order_id, $key, $value );
		}
	}
}