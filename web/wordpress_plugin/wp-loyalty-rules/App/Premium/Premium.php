<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium;

use Wlr\App\Premium\Controllers\Admin\Blocks;
use Wlr\App\Premium\Controllers\Admin\Customers;
use Wlr\App\Premium\Controllers\Admin\License;
use \Wlr\App\Premium\Helpers\License as LicenseHelper;
use Wlr\App\Premium\Controllers\Admin\UserLevels;
use Wlr\App\Premium\Controllers\Site\Achievement;
use Wlr\App\Premium\Controllers\Site\Birthday;
use Wlr\App\Premium\Controllers\Site\ProductReview;
use Wlr\App\Premium\Controllers\Site\Referral;
use Wlr\App\Premium\Controllers\Site\SignUp;
use Wlr\App\Premium\Controllers\Site\SocialShare;

defined( 'ABSPATH' ) or die;

class Premium {
	private static $pro_admin, $pro_customers, $pro_levels, $pro_achievement;
	private static $pro_site, $pro_signup, $pro_social_share, $pro_product_review, $pro_birthday, $pro_referral;

	function init() {
		self::$pro_site   = empty( self::$pro_site ) ? new \Wlr\App\Premium\Controllers\Site\Main() : self::$pro_site;
		self::$pro_signup = empty( self::$pro_signup ) ? new SignUp() : self::$pro_signup;
		self::$pro_levels = empty( self::$pro_levels ) ? new UserLevels() : self::$pro_levels;
		add_filter( 'wlr_is_pro', array( self::$pro_site, 'isPro' ) );
		if ( is_admin() ) {
			self::$pro_admin     = empty( self::$pro_admin ) ? new \Wlr\App\Premium\Controllers\Admin\Main() : self::$pro_admin;
			self::$pro_customers = empty( self::$pro_customers ) ? new Customers() : self::$pro_customers;
			add_filter( 'wlr_pro_local_data', array( self::$pro_admin, 'proLocalData' ) );
			/*New License*/
			LicenseHelper::init();
			add_action( 'wp_ajax_wlr_activate_license', [ License::class, 'activate' ] );
			add_action( 'wp_ajax_wlr_deactivate_license', [ License::class, 'deActivate' ] );
			add_action( 'wp_ajax_wlr_check_license_status', [ License::class, 'checkStatus' ] );
			add_filter( 'wlr_get_setting_data', [ License::class, 'getLicenseStatus' ] );
			add_filter( 'wlr_before_save_settings', [ License::class, 'getLicenseCheckStatus' ] );
			add_action( 'in_admin_header', [ License::class, 'showHeaderNotice' ] );
			/* Customer premium action*/
			add_action( 'wp_ajax_wlr_import_preview', array( self::$pro_customers, 'importPreview' ) );
			add_action( 'wp_ajax_wlr_handle_import', array( self::$pro_customers, 'processImport' ) );
			add_action( 'wp_ajax_wlr_export_preview', array( self::$pro_customers, 'exportPreview' ) );
			add_action( 'wp_ajax_wlr_handle_export', array( self::$pro_customers, 'exportProcess' ) );
			add_action( 'wp_ajax_wlr_add_new_customer', array( self::$pro_customers, 'addNewCustomer' ) );

			/*End Customer premium action*/
			/*App Control*/
			add_action( 'wp_ajax_wlr_app_page', array( self::$pro_admin, 'getAppView' ) );
			/* levels */
			add_action( 'wp_ajax_wlr_get_levels', array( self::$pro_levels, 'getLevels' ) );
			add_action( 'wp_ajax_wlr_edit_level_popup', array( self::$pro_levels, 'getLevelPopup' ) );
			add_action( 'wp_ajax_wlr_save_level', array( self::$pro_levels, 'saveLevel' ) );
			add_action( 'wp_ajax_wlr_delete_level', array( self::$pro_levels, 'deleteLevel' ) );
			add_action( 'wp_ajax_wlr_update_level_preview', array( self::$pro_levels, 'updateLevelPreview' ) );
			add_action( 'wp_ajax_wlr_update_level_change', array( self::$pro_levels, 'updateLevelProcess' ) );
			add_action( 'wp_ajax_wlr_bulk_action_levels', array( self::$pro_levels, 'bulkAction' ) );
			add_action( 'wp_ajax_wlr_toggle_active_level', array( self::$pro_levels, 'toggleActiveLevel' ) );
		} else {
			/* Sign Up */
			add_action( 'woocommerce_register_form', array( self::$pro_signup, 'registerForm' ) );
			add_action( 'register_form', array( self::$pro_signup, 'registerForm' ) );
			add_action( 'woocommerce_before_checkout_registration_form', array(
				self::$pro_signup,
				'wooSignUpMessage'
			) );
			add_action( 'wlr_register_endpoint_data', [ self::$pro_signup, 'addCheckoutBlockSignupMessage' ] );
			add_filter( 'wlr_checkout_block_signup_message', [ self::$pro_signup, 'getBlockSignupMessage' ] );
		}
		add_action( 'user_register', array( self::$pro_signup, 'createAccountAction' ) );
		add_filter( 'wlr_earn_point_signup', array( self::$pro_signup, 'getPointSignUp' ), 10, 3 );
		add_filter( 'wlr_earn_coupon_signup', array( self::$pro_signup, 'getCouponSignUp' ), 10, 3 );

		/*Social share*/
		self::$pro_social_share = empty( self::$pro_social_share ) ? new SocialShare() : self::$pro_social_share;
		add_action( 'wp_ajax_wlr_social_twitter_share', array( self::$pro_social_share, 'updateTwitterReward' ) );
		add_action( 'wp_ajax_wlr_social_facebook_share', array( self::$pro_social_share, 'updateFacebookReward' ) );
		add_action( 'wp_ajax_wlr_social_email_share', array( self::$pro_social_share, 'updateEmailReward' ) );
		add_action( 'wp_ajax_wlr_social_whatsapp_share', array( self::$pro_social_share, 'updateWhatsAppReward' ) );
		//add_action('wp_ajax_wlr_social_followup_share', array(self::$pro_social_share, 'updateFollowUpReward'));
		add_action( 'wp_ajax_wlr_follow_followup_share', array( self::$pro_social_share, 'updateFollowUpReward' ) );

		add_filter( 'wlr_earn_point_facebook_share', array( self::$pro_social_share, 'getPointFacebookShare' ), 10, 3 );
		add_filter( 'wlr_earn_coupon_facebook_share', array(
			self::$pro_social_share,
			'getCouponFacebookShare'
		), 10, 3 );
		add_filter( 'wlr_earn_point_twitter_share', array( self::$pro_social_share, 'getPointTwitterShare' ), 10, 3 );
		add_filter( 'wlr_earn_coupon_twitter_share', array( self::$pro_social_share, 'getCouponTwitterShare' ), 10, 3 );
		add_filter( 'wlr_earn_point_whatsapp_share', array( self::$pro_social_share, 'getPointWhatsAppShare' ), 10, 3 );
		add_filter( 'wlr_earn_coupon_whatsapp_share', array(
			self::$pro_social_share,
			'getCouponWhatsAppShare'
		), 10, 3 );
		add_filter( 'wlr_earn_point_email_share', array( self::$pro_social_share, 'getPointEmailShare' ), 10, 3 );
		add_filter( 'wlr_earn_coupon_email_share', array( self::$pro_social_share, 'getCouponEmailShare' ), 10, 3 );
		add_filter( 'wlr_earn_point_followup_share', array( self::$pro_social_share, 'getPointFollowUpShare' ), 10, 3 );
		add_filter( 'wlr_earn_coupon_followup_share', array(
			self::$pro_social_share,
			'getCouponFollowUpShare'
		), 10, 3 );

		/* Product Review */
		self::$pro_product_review = empty( self::$pro_product_review ) ? new ProductReview() : self::$pro_product_review;
		add_filter( 'woocommerce_product_review_comment_form_args', array(
			self::$pro_product_review,
			'displayProductReviewMessage'
		) );
		add_action( 'comment_unapproved_to_approved', array(
			self::$pro_product_review,
			'productReviewApproveAction'
		) );
		add_action( 'comment_post', array( self::$pro_product_review, 'productReviewAction' ), 10, 2 );
		add_filter( 'wlr_earn_point_product_review', array(
			self::$pro_product_review,
			'getPointProductReview'
		), 10, 3 );
		add_filter( 'wlr_earn_coupon_product_review', array(
			self::$pro_product_review,
			'getCouponProductReview'
		), 10, 3 );
		/* Birthday schedule*/
		self::$pro_birthday = empty( self::$pro_birthday ) ? new Birthday() : self::$pro_birthday;
		add_action( 'wlr_schedule_event_register', array( self::$pro_birthday, 'initProSchedule' ), 10 );
		add_action( 'wp_ajax_wlr_update_birthday', array( self::$pro_birthday, 'onUpdateBirthDay' ) );
		add_action( 'wlr_birth_day_points', array( self::$pro_birthday, 'onBirthDayPoints' ) );
		add_filter( 'wlr_earn_point_birthday', array( self::$pro_birthday, 'getPointBirthday' ), 10, 3 );
		add_filter( 'wlr_earn_coupon_birthday', array( self::$pro_birthday, 'getCouponBirthday' ), 10, 3 );
		/* Birthday edit custom input field */
		add_action( 'init', array( self::$pro_birthday, 'addCustomBirthdayField' ) );
		add_filter( 'wlr_block_checkout_script_data', [ self::$pro_site, 'addScriptData' ] );
		add_filter( 'wlr_checkout_block_user_birth_date', array( self::$pro_birthday, 'addCustomerBirthday' ) );
		add_action( 'wlr_register_endpoint_data', array( self::$pro_birthday, 'addBirthdayEndPointData' ) );
		add_action( 'woocommerce_store_api_checkout_update_customer_from_request', array(
			self::$pro_birthday,
			'saveBirthdayDate'
		), 10, 2 );

		/* Campaign view */
		add_filter( 'wlr_action_types', array( self::$pro_site, 'proActionTypes' ) );
		add_filter( 'wlr_action_conditions', array( self::$pro_site, 'addProActionAcceptConditions' ) );
		add_filter( 'wlr_available_conditions', array( self::$pro_site, 'addProConditions' ) );
		/*Cart Action*/
		add_filter( 'wlr_cart_action_list', array( self::$pro_site, 'addProCartActionList' ) );
		add_filter( 'wlr_earn_point_subtotal', array( self::$pro_site, 'getPointSubtotal' ), 10, 3 );
		add_filter( 'wlr_earn_coupon_subtotal', array( self::$pro_site, 'getCouponSubtotal' ), 10, 3 );
		add_filter( 'wlr_earn_point_purchase_histories', array( self::$pro_site, 'getPointPurchaseHistories' ), 10, 3 );
		add_filter( 'wlr_earn_coupon_purchase_histories', array(
			self::$pro_site,
			'getCouponPurchaseHistories'
		), 10, 3 );

		/*Referral*/
		self::$pro_referral = empty( self::$pro_referral ) ? new Referral() : self::$pro_referral;
		add_action( 'wp_head', array( self::$pro_referral, 'checkAndUpdateLocalStorage' ), 10 );
		add_action( 'wp_ajax_wlr_update_referral_code', array( self::$pro_referral, 'updateReferralCodeToSession' ) );
		add_action( 'wp_ajax_nopriv_wlr_update_referral_code', array(
			self::$pro_referral,
			'updateReferralCodeToSession'
		) );
		add_action( 'woocommerce_new_order', array( self::$pro_referral, 'createReferral' ), 10 );
		add_action( 'woocommerce_order_status_changed', array( self::$pro_referral, 'updateProPoints' ), 1, 4 );
		add_action( 'woocommerce_init', array( self::$pro_referral, 'setReferCouponToSession' ) );
		add_filter( 'wlr_earn_point_advocate_referral', array(
			self::$pro_referral,
			'getPointAdvocateReferral'
		), 10, 3 );
		add_filter( 'wlr_earn_coupon_advocate_referral', array(
			self::$pro_referral,
			'getCouponAdvocateReferral'
		), 10, 3 );
		add_filter( 'wlr_earn_point_friend_referral', array( self::$pro_referral, 'getPointFriendReferral' ), 10, 3 );
		add_filter( 'wlr_earn_coupon_friend_referral', array( self::$pro_referral, 'getCouponFriendReferral' ), 10, 3 );

		/* level */
		add_filter( 'wlr_pro_conditions', array( self::$pro_levels, 'addLevelCondition' ) );
		self::$pro_achievement = empty( self::$pro_achievement ) ? new Achievement() : self::$pro_achievement;
		add_action( 'wlr_after_user_level_changed', array( self::$pro_achievement, 'handleAchievementLevel' ), 10, 2 );
		add_filter( 'wlr_earn_point_achievement', array( self::$pro_achievement, 'getPointAchievement' ), 10, 3 );
		add_filter( 'wlr_earn_coupon_achievement', array( self::$pro_achievement, 'getCouponAchievement' ), 10, 3 );

		add_action( 'wp_login', array( self::$pro_achievement, 'handleAchievementDailyLogin' ), 10, 2 );
		/*Rest API*/
		add_filter( 'woocommerce_rest_api_get_rest_namespaces', function ( $controller ) {
			if ( isset( $controller['wc/v3'] ) && ! empty( $controller['wc/v3'] ) ) {
				$controller['wc/v3']['wployalty'] = '\\Wlr\\App\\Premium\\Api\\WPLoyaltyApi';
			}

			return $controller;
		} );
		/*Blocks*/
		add_action( 'wlr_block_init', [ Blocks::class, 'init' ] );
		/*Schedule*/
		self::initProSchedules();
	}

	/**
	 * Initializes the schedules for the premium loyalty features.
	 *
	 * @return void
	 */
	public static function initProSchedules() {
		add_filter( 'wlr_scheduled_earn_whatsapp_share', [ SocialShare::class, 'handleSocialShareEarning' ] );
		add_filter( 'wlr_scheduled_earn_twitter_share', [ SocialShare::class, 'handleSocialShareEarning' ] );
		add_filter( 'wlr_scheduled_earn_facebook_share', [ SocialShare::class, 'handleSocialShareEarning' ] );
		add_filter( 'wlr_scheduled_earn_email_share', [ SocialShare::class, 'handleSocialShareEarning' ] );
	}
}
