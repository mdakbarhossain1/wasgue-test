<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App;
defined( 'ABSPATH' ) or die;

use Wlr\App\Controllers\Admin\AddOn;
use Wlr\App\Controllers\Admin\CampaignPage;
use Wlr\App\Controllers\Admin\Common;
use Wlr\App\Controllers\Admin\Customers;
use Wlr\App\Controllers\Admin\Dashboard;
use Wlr\App\Controllers\Admin\Labels;
use Wlr\App\Controllers\Admin\OnBoarding;
use Wlr\App\Controllers\Admin\RewardPage;
use Wlr\App\Controllers\Admin\Settings;
use Wlr\App\Controllers\Site\Common as SiteCommon;
use Wlr\App\Controllers\Site\Blocks\Blocks;
use Wlr\App\Controllers\Site\Campaign;
use Wlr\App\Controllers\Site\Coupon;
use Wlr\App\Controllers\Site\CustomerPage;
use Wlr\App\Controllers\Site\DisplayMessage;
use Wlr\App\Controllers\Site\LoyaltyMail;
use Wlr\App\Controllers\Site\MyAccount;
use Wlr\App\Controllers\Site\Schedules;


class Router {
	private static $site, $display_message, $my_account, $coupon;

	function init() {
		do_action( 'wlr_before_init' );
		self::$site       = empty( self::$site ) ? new \Wlr\App\Controllers\Site\Main() : self::$site;
		self::$my_account = empty( self::$my_account ) ? new MyAccount() : self::$my_account;
		add_filter( 'safe_style_css', function ( $styles ) {
			$styles[] = 'display';

			return $styles;
		} );
		add_filter( 'wp_kses_allowed_html', function ( $tags, $context ) {
			if ( 'post' === $context ) {
				$tags['style'] = [];
			}

			return $tags;
		}, 10, 2 );
		if ( is_admin() ) {
			self::initCommon();
			self::initLabels();
			self::initOnBoarding();
			self::initDashboard();
			self::initAddOns();
			self::initSettings();
			self::initCampaignPage();
			self::initRewardPage();
		} else {
			/*My Account*/
			add_action( 'plugins_loaded', array( self::$my_account, 'includes' ) );
			add_action( 'woocommerce_init', array( self::$my_account, 'addEndPoints' ) );
		}
		self::initCustomerPage();
		self::initSchedules();
		self::initDisplayMessage();
		self::initSiteCommon();
		self::initFreeProduct();
		self::initLoyaltyPage();
		self::initCouponAction();
		self::initCampaignAction();
		self::initBlocks();
		add_action( 'woocommerce_loaded', [ LoyaltyMail::class, 'initNotification' ] );
		do_action( 'wlr_after_init' );
		if ( class_exists( 'Wlr\App\Integrations\MultiCurrency\MultiCurrency' ) ) {
			$multi = new \Wlr\App\Integrations\MultiCurrency\MultiCurrency();
			if ( method_exists( $multi, 'init' ) ) {
				$multi->init();
			}
		}
	}

	/**
	 * Initialize common functionality.
	 *
	 * This method adds various hooks and filters to enable common functionality used throughout the plugin.
	 *
	 * @return void
	 */
	public static function initCommon() {
		add_action( 'admin_menu', [ Common::class, 'addMenu' ] );
		add_action( 'network_admin_menu', [ Common::class, 'addMenu' ] );
		add_filter( 'plugin_action_links_' . plugin_basename( WLR_PLUGIN_FILE ), [
			Common::class,
			'pluginActionLinks'
		] );
		add_action( 'admin_enqueue_scripts', [ Common::class, 'adminScripts' ], 100 );
		add_filter( 'script_loader_tag', [ Common::class, 'scriptLoaderTag' ], 10, 2 );
		add_action( 'admin_footer', [ Common::class, 'hideMenu' ] );
		/*Ajax*/
		if ( wp_doing_ajax() ) {
			add_action( 'wp_ajax_wlr_condition_data', [ Common::class, 'getConditionData' ] );
			add_action( 'wp_ajax_wlr_recommendation_list', [ Common::class, 'getRecommendationList' ] );
		}
	}

	/**
	 * Initialize labels functionality.
	 *
	 * This method adds hooks to enable labels functionality used in the plugin.
	 *
	 * @return void
	 */
	public static function initLabels() {
		if ( ! wp_doing_ajax() ) {
			return;
		}
		add_action( 'wp_ajax_wlr_local_data', [ Labels::class, 'localData' ] );
		add_action( 'wp_ajax_wlr_get_labels', [ Labels::class, 'getPluginLabels' ] );
	}

	/**
	 * Initializes the onboarding process.
	 *
	 * @return void
	 */
	public static function initOnBoarding() {
		if ( ! wp_doing_ajax() ) {
			return;
		}
		add_action( 'wp_ajax_wlr_save_onboarding', [ OnBoarding::class, 'saveOnBoarding' ] );
		add_action( 'wp_ajax_wlr_skip_onboarding', [ OnBoarding::class, 'skipOnBoarding' ] );
	}

	/**
	 * Initializes the dashboard.
	 *
	 * @return void
	 */
	public static function initDashboard() {
		if ( ! wp_doing_ajax() ) {
			return;
		}
		add_filter( 'wp_ajax_wlr_get_notification', [ Dashboard::class, 'getNotification' ] );
		add_filter( 'wp_ajax_wlr_enable_new_my_rewards_section', [ Dashboard::class, 'enableMyRewardSection' ] );
		add_action( 'wp_ajax_wlr_chart_data', [ Dashboard::class, 'getChartsData' ] );
		add_action( 'wp_ajax_wlr_dashboard_analytic_data', [ Dashboard::class, 'getDashboardAnalyticData' ] );
		add_action( 'wp_ajax_wlr_all_customer_activities', [ Dashboard::class, 'getCustomerRecentActivityLists' ] );
	}

	/**
	 * Initializes the add-ons for the plugin.
	 *
	 * @return void
	 */
	public static function initAddOns() {
		if ( ! wp_doing_ajax() ) {
			return;
		}
		//new
		add_action( 'wp_ajax_wlr_active_add_ons', [ AddOn::class, 'getActiveAddOns' ] );
		add_action( 'wp_ajax_wlr_available_add_ons', [ AddOn::class, 'getAvailableAddOns' ] );
		add_action( 'wp_ajax_wlr_perform_addon_action', [ AddOn::class, 'activateAddonToggle' ] );
	}

	/**
	 * Initializes the settings process.
	 *
	 * @return void
	 */
	public static function initSettings() {
		if ( ! wp_doing_ajax() ) {
			return;
		}
		add_action( 'wp_ajax_wlr_get_settings', [ Settings::class, 'gets' ] );
		add_action( 'wp_ajax_wlr_save_settings', [ Settings::class, 'save' ] );
		add_action( 'wp_ajax_wlr_create_block_page', [ Settings::class, 'createBlockPage' ] );
		add_action( 'wp_ajax_wlr_save_email_template', [ Settings::class, 'updateEmailTemplate' ] );
		add_action( 'wp_ajax_wlr_reset_email_template', [ Settings::class, 'resetEmailTemplate' ] );
		add_action( 'wp_ajax_wlr_is_any_notifications', [ Settings::class, 'isAnyNotifications' ] );
	}

	public static function initCampaignPage() {
		if ( ! wp_doing_ajax() ) {
			return;
		}
		/*Campaign List*/
		add_action( 'wp_ajax_wlr_get_campaigns', [ CampaignPage::class, 'gets' ] );
		add_action( 'wp_ajax_wlr_delete_campaign', [ CampaignPage::class, 'delete' ] );
		add_action( 'wp_ajax_wlr_toggle_campaign_active', [ CampaignPage::class, 'toggleActive' ] );
		add_action( 'wp_ajax_wlr_bulk_action_campaigns', [ CampaignPage::class, 'handleBulkAction' ] );
		add_action( 'wp_ajax_wlr_duplicate_campaign', [ CampaignPage::class, 'duplicate' ] );
		/*Campaign Edit*/
		add_action( 'wp_ajax_wlr_get_campaign', [ CampaignPage::class, 'get' ] );
		add_action( 'wp_ajax_wlr_save_campaign', [ CampaignPage::class, 'save' ] );
	}

	/**
	 * Initializes the Reward Page.
	 *
	 * @return void
	 */
	public static function initRewardPage() {
		if ( ! wp_doing_ajax() ) {
			return;
		}
		/*Reward List*/
		add_action( 'wp_ajax_wlr_get_rewards', [ RewardPage::class, 'gets' ] );
		add_action( 'wp_ajax_wlr_delete_reward', [ RewardPage::class, 'delete' ] );
		add_action( 'wp_ajax_wlr_bulk_action_rewards', [ RewardPage::class, 'bulkAction' ] );
		add_action( 'wp_ajax_wlr_toggle_reward_active', [ RewardPage::class, 'toggleActive' ] );
		add_action( 'wp_ajax_wlr_duplicate_reward', [ RewardPage::class, 'duplicate' ] );
		add_action( 'wp_ajax_wlr_get_reward_campaigns', [ RewardPage::class, 'getRewardCampaigns' ] );
		/*Reward Edit*/
		add_action( 'wp_ajax_wlr_free_product_options', [ RewardPage::class, 'freeProductOptions' ] );
		add_action( 'wp_ajax_wlr_get_reward', [ RewardPage::class, 'get' ] );
		add_action( 'wp_ajax_wlr_save_reward', [ RewardPage::class, 'save' ] );
	}

	/**
	 * Initializes the customer page.
	 *
	 * @return void
	 */
	public static function initCustomerPage() {
		self::$site = empty( self::$site ) ? new \Wlr\App\Controllers\Site\Main() : self::$site;
		if ( wp_doing_ajax() ) {
			/*Customer List*/
			add_action( 'wp_ajax_wlr_get_customer_list', [ Customers::class, 'gets' ] );
			add_action( 'wp_ajax_wlr_bulk_delete_users', [ Customers::class, 'handleBulkDelete' ] );
			add_action( 'wp_ajax_wlr_delete_customer', [ Customers::class, 'delete' ] );
			add_action( 'wp_ajax_wlr_get_customer_activity', [ Customers::class, 'getActivityLog' ] );
			/*Customer details*/
			add_action( 'wp_ajax_wlr_get_customer', [ Customers::class, 'get' ] );
			add_action( 'wp_ajax_wlr_update_customer_point', [ Customers::class, 'updatePointWithCommand' ] );
			add_action( 'wp_ajax_wlr_update_customer_birth_date', [ Customers::class, 'updateBirthday' ] );
			add_action( 'wp_ajax_wlr_get_customer_transaction', [ Customers::class, 'getTransaction' ] );
			add_action( 'wp_ajax_wlr_get_customer_rewards', [ Customers::class, 'getRewards' ] );
			add_action( 'wp_ajax_wlr_update_reward_expiry', [ Customers::class, 'updateExpiryDates' ] );
			add_action( 'wp_ajax_wlr_admin_toggle_banned_user', [ Customers::class, 'toggleIsBannedUser' ] );
			add_action( 'wp_ajax_wlr_admin_enable_email_sent', [ Customers::class, 'toggleEMailSend' ] );
			/*Toggle opt-in*/
			add_action( 'wp_ajax_wlr_enable_email_sent', [ CustomerPage::class, 'enableEmailSend' ] );
		}

		add_filter( 'wlr_user_level_id', [ CustomerPage::class, 'changeLevelId' ], 10, 3 );
		/* change email, point also transfer to that email*/
		add_filter( 'send_email_change_email', [ self::$site, 'emailUpdatePointTransfer' ], 10, 3 );
	}

	/**
	 * Initializes the schedules for the loyalty program.
	 *
	 * @return void
	 */
	public static function initSchedules() {
		/* Schedule action */
		add_action( 'woocommerce_init', [ Schedules::class, 'init' ] );
		register_deactivation_hook( WLR_PLUGIN_FILE, [ Schedules::class, 'remove' ] );
		add_action( 'wlr_expire_email', [ Schedules::class, 'sendExpireEmail' ] );
		add_action( 'wlr_change_expire_status', [ Schedules::class, 'changeExpireStatus' ] );
		add_action( 'wlr_update_ledger_point', [ Schedules::class, 'updatePointLedgerFromUser' ] );
		add_action( 'wlr_notification_remind_me', [ Schedules::class, 'enableNotificationSection' ] );
		add_filter( 'wlt_dynamic_string_list', [ Schedules::class, 'dynamicStrings' ], 10, 2 );
		add_filter( 'wlt_loyalty_domain_list', [ Schedules::class, 'dynamicDomain' ] );
	}

	/**
	 * Initializes the display message feature.
	 *
	 * @return void
	 */
	public static function initDisplayMessage() {
		if ( ! wp_doing_ajax() && is_admin() ) {
			return;
		}
		self::$display_message = empty( self::$display_message ) ? new DisplayMessage() : self::$display_message;
		/* Product earn point message */
		add_action( 'init', [ self::$display_message, 'init' ] );
		add_shortcode( 'wlr_thank_you_message', [ self::$display_message, 'shortCodeForThankYouPageMessage' ] );
	}

	/**
	 * Initializes the common site action and filter.
	 *
	 * @return void
	 */
	public static function initSiteCommon() {
		if ( ! is_admin() ) {
			add_action( 'wp_enqueue_scripts', [ SiteCommon::class, 'addFrontEndScripts' ] );
		}
		add_action( 'woocommerce_checkout_update_order_meta', [ SiteCommon::class, 'updateLoyaltyMetaData' ] );
		add_shortcode( 'wlr_my_point_balance', [ SiteCommon::class, 'handleMyPointShortcode' ] );
		add_action( 'wp_footer', [ SiteCommon::class, 'refreshFragmentScript' ], PHP_INT_MAX );
	}

	/**
	 * Initializes the free product feature.
	 *
	 * @return void
	 */
	public static function initFreeProduct() {
		self::$site = empty( self::$site ) ? new \Wlr\App\Controllers\Site\Main() : self::$site;
		add_action( 'woocommerce_before_cart', [ self::$site, 'updateFreeProduct' ] );
		add_action( 'woocommerce_before_checkout_form', [ self::$site, 'updateFreeProduct' ] );
		add_action( 'woocommerce_removed_coupon', [ self::$site, 'removeFreeProduct' ] );

		add_filter( 'woocommerce_checkout_create_order_line_item_object', [
			self::$site,
			'addItemMetaForFreeProduct'
		], 10, 4 );

		add_action( 'woocommerce_order_item_display_meta_key', [
			self::$site,
			'displayFreeProductTextInOrder'
		], 100, 3 );

		add_action( 'woocommerce_cart_item_quantity', [ self::$site, 'disableQuantityFieldForFreeProduct' ], 100, 3 );
		add_action( 'woocommerce_cart_item_remove_link', [ self::$site, 'disableCloseIconForFreeProduct' ], 100, 2 );
		add_action( 'woocommerce_get_item_data', [ self::$site, 'displayFreeProductTextInCart' ], 100, 2 );

		add_action( 'woocommerce_after_cart_item_name', [
			self::$site,
			'loadCustomizableProductsAfterCartItemName'
		], 10, 2 );

		add_action( 'woocommerce_before_cart', [ self::$site, 'removeFreeProductCouponCode' ] );
		add_action( 'woocommerce_before_calculate_totals', [ self::$site, 'changeFreeProductPrice' ], 1000 );
		add_action( 'woocommerce_after_cart_item_name', [ self::$site, 'loadLoyaltyLabel' ], 11, 2 );
		add_action( 'woocommerce_before_order_itemmeta', [ self::$site, 'loadLoyaltyLabelMeta' ], 11, 3 );
		add_action( 'wp_ajax_wlr_change_reward_product_in_cart', [ self::$site, 'customerChangeProductOptions' ] );
	}

	/**
	 * Initializes the loyalty page.
	 *
	 * @return void
	 */
	public static function initLoyaltyPage() {
		self::$site = empty( self::$site ) ? new \Wlr\App\Controllers\Site\Main() : self::$site;
		if ( wp_doing_ajax() ) {
			add_action( 'wp_ajax_wlr_apply_reward', [ self::$site, 'applyReward' ] );
			add_action( 'wp_ajax_wlr_revoke_coupon', [ self::$site, 'revokeCoupon' ] );
			add_action( 'wp_ajax_wlr_my_rewards_pagination', [ self::$site, 'myRewardsPagination' ] );
		}
		self::$my_account = empty( self::$my_account ) ? new MyAccount() : self::$my_account;
		/*My-account*/
		//Reward link in message
		add_action( 'wp_ajax_wlr_show_loyalty_rewards', [ self::$my_account, 'showRewardList' ] );
		add_shortcode( 'wlr_page_content', [ self::$my_account, 'processShortCode' ] );
		//New Design pagination
		add_action( 'wp_ajax_wlr_my_reward_section_pagination', [
			self::$my_account,
			'myRewardSectionPagination'
		] );
	}

	/**
	 * Initializes the coupon action.
	 *
	 * @return void
	 */
	public static function initCouponAction() {
		self::$site   = empty( self::$site ) ? new \Wlr\App\Controllers\Site\Main() : self::$site;
		self::$coupon = empty( self::$coupon ) ? new Coupon() : self::$coupon;
		add_filter( 'woocommerce_coupon_get_discount_amount', [
			self::$site,
			'getPointConversionDiscountAmount'
		], 10, 5 );

		add_action( 'wp_loaded', [ Coupon::class, 'applyCartCoupon' ] );
		add_action( 'woocommerce_coupon_is_valid', [ Coupon::class, 'validateRewardCoupon' ], 10, 3 );
		add_action( 'woocommerce_coupon_error', [ Coupon::class, 'validateRewardCouponErrorMessage' ], 10, 3 );
		add_action( 'woocommerce_init', [ Coupon::class, 'removeAppliedCouponForBannedUser' ], 999, 1 );
		add_filter( 'woocommerce_cart_totals_coupon_label', [ Coupon::class, 'changeCouponLabel' ], 10, 2 );
		add_action( 'woocommerce_new_order', [ self::$site, 'canChangeCouponStatus' ] );
		add_action( 'woocommerce_update_order', [ self::$site, 'canChangeCouponStatus' ] );
		add_action( 'woocommerce_order_status_changed', [ self::$site, 'updateCouponStatus' ], 1000, 4 );
		add_action( 'before_delete_post', [ self::$coupon, 'expireCouponOnDelete' ], 10, 1 );
		add_action( 'wp_trash_post', [ self::$coupon, 'expireCouponOnDelete' ], 10, 1 );
	}

	/**
	 * Initializes the campaign actions.
	 *
	 * This method sets up various actions and filters related to campaign functionality.
	 *
	 * @return void
	 */
	public static function initCampaignAction() {
		self::$site = empty( self::$site ) ? new \Wlr\App\Controllers\Site\Main() : self::$site;
		/* Order Earn */
		add_action( 'woocommerce_order_status_changed', [ self::$site, 'updatePoints' ], 1000, 4 );
		/*Actions*/
		add_filter( 'wlr_earn_point_point_for_purchase', [ self::$site, 'getPointPointForPurchase' ], 10, 3 );
		add_filter( 'wlr_earn_coupon_point_for_purchase', [ self::$site, 'getCouponPointForPurchase' ], 10, 3 );

		/*Common*/
		add_action( 'user_register', [ Campaign::class, 'addLoyaltyUserFromWPRegister' ] );
		add_action( 'wp_login', [ Campaign::class, 'addLoyaltyUserFromWPLogin' ], 10, 2 );
	}

	/**
	 * Initializes the block functionality.
	 *
	 * @return void
	 */
	public static function initBlocks() {
		add_action( 'plugins_loaded', [ Blocks::class, 'init' ] );
		add_action( 'woocommerce_check_cart_items', [ Blocks::class, 'updateCartFreeProduct' ] );
	}
}