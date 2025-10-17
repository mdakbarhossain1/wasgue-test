<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Controllers\Site;

use Wlr\App\Controllers\Base;
use Wlr\App\Helpers\EarnCampaign;
use Wlr\App\Helpers\Input;
use Wlr\App\Helpers\Settings;
use Wlr\App\Helpers\Util;
use Wlr\App\Helpers\Woocommerce;
use Wlr\App\Models\Levels;
use Wlr\App\Models\Logs;
use Wlr\App\Models\Rewards;
use Wlr\App\Models\UserRewards;
use Wlr\App\Models\Users;

defined( 'ABSPATH' ) or die;

class CustomerPage extends Base {
	function getRewardPageData( $page_type = '' ) {
		if ( ! $this->canShowRewardPage( $page_type ) ) {
			return [];
		}
		$user_email           = self::$woocommerce->get_login_user_email();
		$earn_campaign_helper = EarnCampaign::getInstance();
		$page_params          = [];
		if ( $page_type != 'cart' ) {
			if ( Settings::get( 'is_campaign_display', 'yes' ) === 'yes' ) {
				$page_params['campaign_list'] = $this->getCampaignList();
			}

			if ( Settings::get( 'is_reward_display', 'no' ) === 'yes' ) {
				$page_params['reward_list'] = $this->getRewardList();
			}

			if ( ! empty( $user_email ) && Settings::get( 'is_transaction_display', 'yes' ) === 'yes' ) {
				$page_params['trans_details'] = $this->getTransactionSection( $user_email, [ 'page_type' => $page_type ] );
			}

			//TODO: Need to reduce campaign query
			$earn_campaign_model = new \Wlr\App\Models\EarnCampaign();
			$referral_campaigns  = $earn_campaign_model->getCampaignByAction( 'referral' );

			if ( $page_params['is_referral_action_available'] = ( ! empty( $user_email ) && ! empty( $referral_campaigns ) ) ) {
				$page_params['referral_url'] = $earn_campaign_helper->getReferralUrl();
				if ( ! empty( $page_params['referral_url'] ) ) {
					$page_params['social_share_list'] = $this->getSocialShareList( $user_email, $page_params['referral_url'] );
				}
			}
		}
		$page_params['branding']                   = $this->getBrandingData();
		$page_params['is_revert_enabled']          = Settings::get( 'is_revert_enabled', 'no' ) === 'yes';
		$page_params['is_one_time_birthdate_edit'] = Settings::get( 'is_one_time_birthdate_edit', 'no' );
		if ( ! empty( $user_email ) ) {
			$page_params['user']       = $this->getPageUserDetails( $user_email, $page_type );
			$current_currency          = self::$woocommerce->getCurrentCurrency();
			$user_transaction_price    = $earn_campaign_helper->getUserTotalTransactionAmount( $user_email );
			$user_used_currency_reward = $user_used_currency_reward_count = $currency_lists = [];
			if ( ! isset( $user_transaction_price[ $current_currency ] ) ) {
				$currency_lists[ $current_currency ] = $current_currency;
				/* translators: 1. reward label, 2. Value */
				$user_used_currency_reward[ $current_currency ]       = sprintf( __( '%1$s value: %2$s', 'wp-loyalty-rules' ), $earn_campaign_helper->getRewardLabel(), 0 );
				$user_used_currency_reward_count[ $current_currency ] = 0;
			}
			foreach ( $user_transaction_price as $currency => $currency_data ) {
				$currency_lists[ $currency ]                  = $currency;
				$user_used_currency_reward_count[ $currency ] = isset( $currency_data['reward_count'] ) && $currency_data['reward_count'] ? $currency_data['reward_count'] : 0;
				/* translators: 1. reward label, 2. Value */
				$user_used_currency_reward[ $currency ] = sprintf( __( '%1$s value: %2$s', "wp-loyalty-rules" ), $earn_campaign_helper->getRewardLabel(), ( isset( $currency_data['display_format'] ) && $currency_data['display_format'] ? $currency_data['display_format'] : '' ) );
			}

			$page_params['current_currency']                 = $current_currency;
			$page_params['used_reward_currency_values']      = $user_used_currency_reward;
			$page_params['used_reward_currency_value_count'] = $user_used_currency_reward_count;
			$page_params['current_currency_list']            = $currency_lists;
			$page_params['is_sent_email_display']            = Settings::get( 'is_sent_email_display', 'yes' );
			$page_params['page_type']                        = $page_type;
			$page_params['my_reward_section']                = $this->getMyRewardsSection( $page_params, $user_email );
			//$page_params['user_rewards']                     = $this->getPageUserRewards( $user_email, array( 'page_type' => $page_type ) );
		}

		return apply_filters( 'wlr_myaccount_page_data', $page_params );
	}

	public function getTransactionContent( $user_email, $args = [] ) {
		if ( empty( $user_email ) ) {
			return '';
		}
		$logs   = new Logs();
		$offset = (int) self::$input->post_get( 'page_number', 1 );
		$limit  = apply_filters( 'wlr_recent_activity_transaction_limit', 5 );
		$start  = ( $offset - 1 ) * $limit;
		$items  = $logs->getUserLogTransactions( $user_email, $limit, $start );
		if ( empty( $items ) ) {
			return '';
		}
		$recent_activity_params = [
			'items'         => $items,
			'offset'        => $offset,
			'total'         => (int) $logs->getUserLogTransactionsCount( $user_email ),
			'current_count' => (int) ( $offset * $limit ),
			'page_type'     => isset( $args['page_type'] ) ? $args['page_type'] : ''
		];
		$page_content           = wc_get_template_html(
			'recent_activity_content.php',
			$recent_activity_params, Util::getTemplatePath( 'recent_activity_content.php' ),
			WLR_PLUGIN_PATH . 'App/Views/Site/page-content/'
		);

		return apply_filters( 'wlr_recent_activity_content', $page_content, $recent_activity_params );
	}

	function getTransactionSection( $user_email, $args = [] ) {
		if ( empty( $user_email ) ) {
			return '';
		}
		$page_content = $this->getTransactionContent( $user_email, $args );
		if ( empty( $page_content ) ) {
			return '';
		}
		$transaction_params = [
			'recent_activity_content' => $page_content
		];
		$page_content       = wc_get_template_html(
			'recent_activity.php',
			$transaction_params, Util::getTemplatePath( 'recent_activity.php' ),
			WLR_PLUGIN_PATH . 'App/Views/Site/page-content/'
		);

		return apply_filters( 'wlr_page_transaction_details', $page_content, $transaction_params );
	}

	function getMyRewardsSection( $page_params, $user_email ) {
		if ( empty( $page_params ) || empty( $user_email ) ) {
			return '';
		}
		$reward_helper    = \Wlr\App\Helpers\Rewards::getInstance();
		$user             = $reward_helper->getPointUserByEmail( $user_email );
		$my_reward_params = [
			'rewards_content'   => $this->getRewardTabContent( $user_email, [
				'wp_user'   => $user,
				'page'      => $page_params['page_type'],
				'page_type' => ! ( ( isset( $page_params['page_type'] ) && $page_params['page_type'] == 'cart' ) )
			] ),
			'coupon_content'    => $this->getCouponsTabContent( $user_email, [
				'page'      => $page_params['page_type'],
				'page_type' => ! ( ( isset( $page_params['page_type'] ) && $page_params['page_type'] == 'cart' ) )
			] ),
			'page_type'         => $page_params['page_type'],
			'active_reward_tab' => self::$input->post_get( 'active_reward_page', 'rewards' ),
			'endpoint_url'      => $this->getEndPointUrl( $page_params['page_type'] )
		];
		if ( ! empty( $page_params['page_type'] ) && $page_params['page_type'] != 'cart' ) {
			$my_reward_params['expire_coupon_content'] = $this->getExpiredCouponsTabContent( $user_email, [ 'page_type' => 0 ] );
		}
		$my_reward_params['is_display_my_reward'] = true;
		$template_name                            = 'my_reward_tabs.php';
		$my_rewards_and_coupons                   = wc_get_template_html(
			$template_name,
			$my_reward_params,
			Util::getTemplatePath( 'my_reward_tabs.php' ),
			WLR_PLUGIN_PATH . 'App/Views/Site/page-content/'
		);

		return apply_filters( 'wlr_customer_page_new_my_rewards_section', $my_rewards_and_coupons, $page_params );
	}

	public static function getAvailableRewards( $user_email ) {
		if ( empty( $user_email ) ) {
			return [];
		}
		$allowed_conditions   = apply_filters( 'wlr_page_allowed_conditions', [
			'user_role',
			'customer',
			'user_point',
			'currency',
			'language'
		] );
		$extra                = [
			'user_email'         => $user_email,
			'cart'               => WC()->cart,
			'is_calculate_based' => 'cart',
			'allowed_condition'  => $allowed_conditions
		];
		$reward_helper        = \Wlr\App\Helpers\Rewards::getInstance();
		$point_rewards        = $reward_helper->getPointRewards( $user_email, $extra );
		$earned_coupon_reward = $reward_helper->getCouponRewards( $user_email, $extra );

		return apply_filters( 'wlr_after_get_available_rewards', array_merge( $point_rewards, $earned_coupon_reward ), $user_email );
	}

	function getRewardTabContent( $user_email, $args = [] ) {
		if ( empty( $user_email ) ) {
			return '';
		}
		$available_rewards = self::getAvailableRewards( $user_email );
		$offset            = (int) self::$input->post_get( 'page_number', 1 );
		$limit             = apply_filters( 'wlr_rewards_tab_card_count', 6 );
		$start             = ( $offset - 1 ) * $limit;
		$page_params       = [
			'offset'        => $offset,
			'items'         => $this->processRewardList( array_slice( $available_rewards, $start, $limit ), $args ),
			'total'         => count( $available_rewards ),
			'current_count' => (int) ( $offset * $limit ),
			'endpoint_url'  => $this->getEndPointUrl( isset( $args['page'] ) ? $args['page'] : '' )
		];
		$page_params       = wp_parse_args( $args, $page_params );
		$page_content      = wc_get_template_html(
			'reward_content.php',
			$page_params, Util::getTemplatePath( 'reward_content.php' ),
			WLR_PLUGIN_PATH . 'App/Views/Site/page-content/'
		);

		return apply_filters( 'wlr_rewards_tab_content', $page_content, $page_params );
	}

	function getCouponsTabContent( $user_email, $args = [] ) {
		if ( empty( $user_email ) ) {
			return '';
		}
		$offset         = (int) self::$input->post_get( 'page_number', 1 );
		$limit          = apply_filters( 'wlr_coupons_tab_card_count', 5 );
		$user_rewards   = new UserRewards();
		$page_params    = [
			'is_revert_enabled' => Settings::get( 'is_revert_enabled', 'no' ) == 'yes'
		];
		$page_params    = wp_parse_args( $args, $page_params );
		$coupon_rewards = $user_rewards->getCustomerCouponRewardByEmail( $user_email, [
			'limit'  => $limit,
			'offset' => (int) ( ( $offset - 1 ) * $limit )
		] );
		foreach ( $coupon_rewards as &$coupon_reward ) {
			$coupon_reward->reward_table = 'user_reward';
		}
		$page_params['offset']         = $offset;
		$page_params['items']          = $this->processRewardList( $coupon_rewards );
		$page_params['endpoint_url']   = $this->getEndPointUrl( isset( $args['page'] ) ? $args['page'] : '' );
		$page_params['total']          = $user_rewards->getCustomerCouponRewardByEmail( $user_email, [
			'limit'       => - 1,
			'count_query' => true,
		] );
		$page_params ['current_count'] = (int) ( $offset * $limit );
		$page_content                  = wc_get_template_html(
			'coupon_content.php',
			$page_params, Util::getTemplatePath( 'coupon_content.php' ),
			WLR_PLUGIN_PATH . 'App/Views/Site/page-content/'
		);

		return apply_filters( 'wlr_coupons_tab_content', $page_content, $page_params );
	}

	protected function getEndPointUrl( $page = '' ) {
		global $post;
		if ( empty( $page ) || $page == 'cart' ) {
			return ! empty( $_SERVER['HTTP_REFERER'] ) ? sanitize_url( wp_unslash( $_SERVER['HTTP_REFERER'] ) ) : '';
		} else if ( $page == 'page' && isset( $post->ID ) && $post->ID > 0 ) {
			return get_page_link( $post->ID );
		} else if ( $page == 'myaccount' ) {
			return wc_get_endpoint_url( 'loyalty_reward' );
		}

		return '';
	}

	function getExpiredCouponsTabContent( $user_email, $args = [] ) {
		if ( empty( $user_email ) ) {
			return '';
		}
		$offset                        = (int) self::$input->post_get( 'page_number', 1 );
		$limit                         = apply_filters( 'wlr_expired_coupons_tab_card_count', 5 );
		$user_rewards                  = new UserRewards();
		$page_params                   = [];
		$page_params                   = wp_parse_args( $args, $page_params );
		$page_params['offset']         = $offset;
		$page_params['items']          = $this->processRewardList( $user_rewards->getCustomerExpiredCouponByEmail( $user_email, [
			'limit'  => $limit,
			'offset' => (int) ( ( $offset - 1 ) * $limit )
		] ) );
		$page_params['total']          = $user_rewards->getCustomerExpiredCouponByEmail( $user_email, [
			'limit'       => - 1,
			'count_query' => true
		] );
		$page_params ['current_count'] = (int) ( $offset * $limit );
		$page_content                  = wc_get_template_html(
			'expired_coupon_content.php',
			$page_params, Util::getTemplatePath( 'expired_coupon_content.php' ),
			WLR_PLUGIN_PATH . 'App/Views/Site/page-content/'
		);

		return apply_filters( 'wlr_coupons_tab_content', $page_content, $page_params );
	}

	public function processRewardList( $reward_list, $args = [] ) {
		if ( empty( $reward_list ) ) {
			return $reward_list;
		}
		$default      = [
			'wp_user' => ''
		];
		$args         = wp_parse_args( $args, $default );
		$reward_types = Woocommerce::getRewardDiscountTypes();

		foreach ( $reward_list as $key => &$user_reward_data ) {
			$user_reward_data->reward_type_name = ! empty( $user_reward_data->discount_type ) && isset( $reward_types[ $user_reward_data->discount_type ] ) && $reward_types[ $user_reward_data->discount_type ] ? $reward_types[ $user_reward_data->discount_type ] : '';
			$user_reward_data->expiry_date      = ( ! empty( $user_reward_data->end_at ) && $user_reward_data->end_at >= 0 ) ? self::$woocommerce->beforeDisplayDate( $user_reward_data->end_at ) : '';
			$user_reward_data->created_at       = ( ! empty( $user_reward_data->created_at ) && $user_reward_data->created_at >= 0 ) ? self::$woocommerce->beforeDisplayDate( $user_reward_data->created_at ) : '';
			if ( ! empty( $user_reward_data->discount_type ) && ( $user_reward_data->discount_type == 'points_conversion' )
			     && isset( $user_reward_data->reward_table ) && $user_reward_data->reward_table != 'user_reward' ) {
				$this->getPointConversionRedeemData( $user_reward_data, $args['wp_user'] );
			}
			if ( ! empty( $user_reward_data->discount_type ) && ( $user_reward_data->discount_type == 'free_product' )
			     && isset( $user_reward_data->reward_table ) && in_array( $user_reward_data->reward_table, [
					'reward',
					'user_reward'
				] ) && ! empty( $user_reward_data->free_product )
			     && self::$woocommerce->isJson( $user_reward_data->free_product ) ) {

				$user_reward_free_products              = json_decode( $user_reward_data->free_product, true );
				$user_reward_data->is_out_of_stock      = false;
				$user_reward_data->out_of_stock_message = '';
				$is_stock_empty                         = [];
				foreach ( $user_reward_free_products as $f_product ) {
					$product = wc_get_product( $f_product['value'] );
					if ( $product && ! $product->is_in_stock() ) {
						$user_reward_data->is_out_of_stock      = true;
						$user_reward_data->out_of_stock_message = __( 'Out of Stock', 'wp-loyalty-rules' );
						$is_stock_empty[]                       = [
							'product_id'     => $f_product['value'],
							'product_name'   => $product->get_name(),
							'stock_quantity' => $product->get_stock_quantity(),
						];
					}
				}
				$user_reward_data->is_stock_empty_products = $is_stock_empty;
			}
			if ( isset( $user_reward_data->discount_code ) && in_array( $user_reward_data->reward_type, [
					'redeem_coupon',
					'redeem_point'
				] ) && $user_reward_data->status === 'active' ) {
				$coupon      = new \WC_Coupon( $user_reward_data->discount_code );
				$usage_count = $coupon->get_usage_count();
				if ( isset( $usage_count ) && $usage_count >= 1 ) {
					unset( $reward_list[ $key ] );
				}
			}
		}

		return apply_filters( 'wlr_tab_process_reward_list', $reward_list );
	}

	//old
	function rewardPageData( $page_type = '' ) {
		if ( ! $this->canShowRewardPage( $page_type ) ) {
			return array();
		}
		$page_params          = array( 'page_type' => $page_type );
		$user_email           = self::$woocommerce->get_login_user_email();
		$is_guest_user        = empty( $user_email );
		$earn_campaign_helper = EarnCampaign::getInstance();
		$setting_option       = self::$woocommerce->getOptions( 'wlr_settings' );
		if ( $page_type != 'cart' ) {
			$is_campaign_display = is_array( $setting_option ) && isset( $setting_option['is_campaign_display'] ) && in_array( $setting_option['is_campaign_display'], array(
				'no',
				'yes'
			) ) ? $setting_option['is_campaign_display'] : 'yes';
			if ( $is_campaign_display === 'yes' ) {
				$page_params['campaign_list'] = $this->getCampaignList();
			}
			$is_reward_display = is_array( $setting_option ) && isset( $setting_option['is_reward_display'] ) && in_array( $setting_option['is_reward_display'], array(
				'no',
				'yes'
			) ) ? $setting_option['is_reward_display'] : 'no';
			if ( $is_reward_display === 'yes' ) {
				$page_params['reward_list'] = $this->getRewardList();
			}
			$is_transaction_display = is_array( $setting_option ) && isset( $setting_option['is_transaction_display'] ) && in_array( $setting_option['is_transaction_display'], array(
				'no',
				'yes'
			) ) ? $setting_option['is_transaction_display'] : 'yes';
			if ( $is_transaction_display === 'yes' && ! $is_guest_user ) {
				$page_params['trans_details'] = $this->getTransactionDetails( $user_email );
			}
			$earn_campaign_model                         = new \Wlr\App\Models\EarnCampaign();
			$referral_campaigns                          = $earn_campaign_model->getCampaignByAction( 'referral' );
			$page_params['is_referral_action_available'] = ! $is_guest_user && ! empty( $referral_campaigns );
			if ( ! $is_guest_user && $page_params['is_referral_action_available'] ) {
				$page_params['referral_url'] = $earn_campaign_helper->getReferralUrl();
				if ( ! empty( $page_params['referral_url'] ) ) {
					$page_params['social_share_list'] = $this->getSocialShareList( $user_email, $page_params['referral_url'] );
				}
			}
		}
		$page_params['branding']          = $this->getBrandingData();
		$page_params['is_revert_enabled'] = ( isset( $setting_option['is_revert_enabled'] ) && ! empty( $setting_option['is_revert_enabled'] ) && $setting_option['is_revert_enabled'] == 'yes' );


		if ( ! $is_guest_user ) {
			$page_params['user']       = $this->getPageUserDetails( $user_email, $page_type );
			$reward_helper             = \Wlr\App\Helpers\Rewards::getInstance();
			$user_used_currency_reward = $user_used_currency_reward_count = $currency_lists = array();
			$current_currency          = self::$woocommerce->getCurrentCurrency();
			$user_transaction_price    = $reward_helper->getUserTotalTransactionAmount( $user_email );
			if ( ! isset( $user_transaction_price[ $current_currency ] ) ) {
				$currency_lists[ $current_currency ] = $current_currency;
				/* translators: 1. reward label, 2. Value */
				$user_used_currency_reward[ $current_currency ]       = sprintf( __( '%1$s value: %2$s', "wp-loyalty-rules" ), $earn_campaign_helper->getRewardLabel(), 0 );
				$user_used_currency_reward_count[ $current_currency ] = 0;
			}
			foreach ( $user_transaction_price as $currency => $currency_data ) {
				$currency_lists[ $currency ]                  = $currency;
				$user_used_currency_reward_count[ $currency ] = isset( $currency_data['reward_count'] ) && $currency_data['reward_count'] ? $currency_data['reward_count'] : 0;
				/* translators: 1. reward label, 2. Value */
				$user_used_currency_reward[ $currency ] = sprintf( __( '%1$s value: %2$s', "wp-loyalty-rules" ), $earn_campaign_helper->getRewardLabel(), ( isset( $currency_data['display_format'] ) && $currency_data['display_format'] ? $currency_data['display_format'] : '' ) );
			}
			$page_params['current_currency']                 = $current_currency;
			$page_params['used_reward_currency_values']      = $user_used_currency_reward;
			$page_params['used_reward_currency_value_count'] = $user_used_currency_reward_count;

			$page_params['current_currency_list'] = $currency_lists;
			$page_params['is_sent_email_display'] = is_array( $setting_option ) && isset( $setting_option['is_sent_email_display'] ) && in_array( $setting_option['is_sent_email_display'], array(
				'no',
				'yes'
			) ) ? $setting_option['is_sent_email_display'] : 'yes';

			$page_params['is_show_new_my_reward_section'] = self::$woocommerce->getOptions( 'wlr_new_rewards_section_enabled' );
			$page_params['user_rewards']                  = $this->getPageUserRewards( $user_email, array( 'page_type' => $page_type ) );
			if ( $page_params['is_show_new_my_reward_section'] == 'yes' ) {
				$page_params['endpoint_url']          = wc_get_endpoint_url( 'loyalty_reward' );
				$page_params['new_my_reward_section'] = $this->getNewMyRewardsSection( $page_params, $user_email );
			}
		}
		$page_params['is_one_time_birthdate_edit'] = is_array( $setting_option ) && isset( $setting_option['is_one_time_birthdate_edit'] ) && in_array( $setting_option['is_one_time_birthdate_edit'], array(
			'no',
			'yes'
		) ) ? $setting_option['is_one_time_birthdate_edit'] : 'no';

		return apply_filters( 'wlr_myaccount_page_data', $page_params );
	}

	//old
	function getNewMyRewardsSection( $page_params, $user_email ) {
		if ( empty( $page_params ) || empty( $user_email ) ) {
			return '';
		}

		$page_params['active_used_expired_reward_page'] = self::$input->post_get( 'active_reward_page', 'rewards' );
		//rewards
		$page_params['new_reward_section'] = $this->getRewardsPageContent( $page_params, $user_email );
		//coupons
		$page_params['new_coupon_section'] = $this->getCouponsPageContent( $page_params, $user_email );
		//expired coupons
		if ( $page_params['page_type'] != 'cart' ) {
			$page_params['new_expired_coupon_section'] = $this->getExpiredCouponsPageContent( $page_params, $user_email );
		}
		$page_params            = apply_filters( 'wlr_customer_page_new_my_rewards_section_params', $page_params );
		$template_name          = 'my_rewards_and_coupons.php';
		$my_rewards_and_coupons = wc_get_template_html(
			$template_name,
			$page_params,
			'',
			WLR_PLUGIN_PATH . 'App/Views/Site/rewards/'
		);

		return apply_filters( 'wlr_customer_page_new_my_rewards_section', $my_rewards_and_coupons, $page_params );
	}

	//old
	function getRewardsPageContent( $page_params, $user_email ) {
		if ( empty( $page_params ) || empty( $user_email ) ) {
			return '';
		}
		$page_content = wc_get_template_html(
			'rewards.php',
			$page_params, '',
			WLR_PLUGIN_PATH . 'App/Views/Site/rewards/'
		);

		return apply_filters( 'wlr_customer_page_new_rewards_section', $page_content, $page_params );
	}

	//old
	function getCouponsPageContent( $page_params, $user_email, $pagination_params = array() ) {
		if ( empty( $page_params ) || empty( $user_email ) ) {
			return '';
		}
		$page_params['user_coupon_rewards'] = $this->getTotalUserCouponRewards( $user_email, $pagination_params );
		$page_content                       = wc_get_template_html(
			'coupons.php',
			$page_params, '',
			WLR_PLUGIN_PATH . 'App/Views/Site/rewards/'
		);

		return apply_filters( 'wlr_customer_page_new_coupons_section', $page_content, $page_params );
	}

	//old
	function getExpiredCouponsPageContent( $page_params, $user_email, $pagination_params = array() ) {
		if ( empty( $page_params ) || empty( $user_email ) ) {
			return '';
		}
		$page_params['used_expired_rewards'] = $this->userUsedExpiredCoupons( $user_email, $pagination_params );
		$page_content                        = wc_get_template_html(
			'expired_coupons.php',
			$page_params, '',
			WLR_PLUGIN_PATH . 'App/Views/Site/rewards/'
		);

		return apply_filters( 'wlr_customer_page_new_coupons_section', $page_content, $page_params );
	}

	function canShowRewardPage( $page_type ) {
		$status = false;
		if ( is_string( $page_type ) && ! empty( $page_type ) && in_array( $page_type, $this->getValidPageTypes() ) ) {
			$status     = true;
			$user_email = self::$woocommerce->get_login_user_email();
			if ( empty( $user_email ) && $page_type == 'myaccount' ) {
				$status = false;
			}
		}

		return apply_filters( 'wlr_can_show_reward_page', $status, $page_type );
	}

	function getValidPageTypes() {
		$valid_page_types = array( 'myaccount', 'cart', 'page' );

		return apply_filters( 'wlr_valid_customer_page_types', $valid_page_types );
	}

	/**
	 * Campaign list
	 *
	 * @return array
	 */
	function getCampaignList() {
		$campaign_reward                 = new \Wlr\App\Models\EarnCampaign();
		$campaign_list                   = $campaign_reward->getCurrentCampaignList();
		$is_campaign_point_display       = Settings::get( 'is_campaign_point_display', 'yes' );
		$is_campaign_level_batch_display = Settings::get( 'is_campaign_level_batch_display', 'no' );
		$user_display_conditions         = Settings::get( 'user_display_conditions', [] );
		if ( ! empty( $user_display_conditions ) && is_string( $user_display_conditions ) ) {
			$user_display_conditions = explode( ',', $user_display_conditions );
		} else {
			$user_display_conditions = [];
		}
		$earn_campaign = EarnCampaign::getInstance();
		$current_level = 0;
		$next_level    = 0;
		$user_role     = [];
		if ( ! empty( $user_display_conditions ) ) {
			$user      = wp_get_current_user();
			$user_role = isset( $user->roles ) ? $user->roles : [];
			//For custom customer reward page
			if ( empty( $user_role ) ) {
				$user_role[] = "wlr_rules_guest";
			}
			$user_model       = new Users();
			$loyalty_user     = $user_model->getQueryData( array(
				'user_email' => array(
					'operator' => '=',
					'value'    => $user->user_email,
				),
			), '*', array(), false );
			$level_model      = new Levels();
			$total_earn_point = isset( $loyalty_user ) && ! empty( $loyalty_user->earn_total_point ) ? $loyalty_user->earn_total_point : 0;
			$total_earn_point = apply_filters( 'wlr_points_for_campaigns_list', $total_earn_point, $loyalty_user );
			$current_level    = $level_model->getCurrentLevelId( $total_earn_point );
			$user_next_level  = $earn_campaign->getNextLevel( $total_earn_point );
			if ( ! empty( $user_next_level ) ) {
				$next_level = $user_next_level->id;
			}
		}
		foreach ( $campaign_list as $campaign_key => &$campaign ) {
			if ( $is_campaign_point_display == 'yes' ) {
				$campaign = $this->getCampaignPointReward( $campaign );
			}
			if ( empty( $campaign->conditions ) ) {
				continue;
			}
			$conditions = json_decode( $campaign->conditions );
			if ( empty( $conditions ) ) {
				continue;
			}
			if ( $is_campaign_level_batch_display == 'yes' ) {
				$level_batch = $this->getCampaignsLevelBatch( $campaign, $conditions );
				if ( ! empty( $level_batch ) ) {
					$campaign->level_batch = $level_batch;
					if ( count( $level_batch ) > 2 && ( count( $level_batch ) - 2 > 0 ) ) {
						$campaign->level_batch_count_show = count( $level_batch ) - 2;
					}
				}
			}
			foreach ( $conditions as $condition ) {
				if ( empty( $condition->type ) ) {
					continue;
				}
				if ( $condition->type == 'user_role' && in_array( $condition->type, $user_display_conditions ) && ! empty( $condition->options ) && isset( $condition->options->operator ) && isset( $condition->options->value ) && ! $this->doCompareInListOperation( $condition->options->operator, $user_role, $condition->options->value ) ) {
					unset( $campaign_list[ $campaign_key ] );
					continue 2;
				}
				if ( ! empty( $user_display_conditions ) && $condition->type == 'user_level' && ! empty( $condition->options ) && isset( $condition->options->value ) ) {
					if ( in_array( 'user_level_with_next_level', $user_display_conditions ) && ! ( in_array( $current_level, $condition->options->value ) || in_array( $next_level, $condition->options->value ) ) ) {
						unset( $campaign_list[ $campaign_key ] );
						continue 2;
					}
					if ( in_array( 'user_level', $user_display_conditions ) && ! in_array( $current_level, $condition->options->value ) ) {
						unset( $campaign_list[ $campaign_key ] );
						continue 2;
					}
				}
			}
		}

		return apply_filters( 'wlr_page_campaign_list', $campaign_list );
	}

	function getCampaignPointReward( $active_campaigns ) {
		$base_helper  = new \Wlr\App\Helpers\Base();
		$reward_table = new \Wlr\App\Models\Rewards();
		if ( ! empty( $active_campaigns ) && is_object( $active_campaigns ) ) {
			$campaign_point_rule                       = self::$woocommerce->isJson( $active_campaigns->point_rule ) ? json_decode( $active_campaigns->point_rule ) : new \stdClass();
			$active_campaigns->campaign_title_discount = "";
			$action_type                               = isset( $active_campaigns->action_type ) && ! empty( $active_campaigns->action_type ) ? $active_campaigns->action_type : '';
			switch ( $action_type ) {
				case "referral":
					$active_campaigns->campaign_title_discount .= $this->getReferralPointMessage( $campaign_point_rule );
					break;
				default:
					$campaign_type = isset( $active_campaigns->campaign_type ) && ! empty( $active_campaigns->campaign_type ) && $active_campaigns->campaign_type ? $active_campaigns->campaign_type : '';
					if ( $campaign_type == "point" && isset( $campaign_point_rule->earn_point ) ) {
						$active_campaigns->campaign_title_discount .= isset( $active_campaigns->action_type ) && ( $active_campaigns->action_type == 'point_for_purchase' ) ?
							/* translators: 1: point, 2: point label 3: custom price */
							sprintf( __( '%1$d %2$s for each %3$s spent', 'wp-loyalty-rules' ), $campaign_point_rule->earn_point, $base_helper->getPointLabel( $campaign_point_rule->earn_point ), self::$woocommerce->getCustomPrice( $campaign_point_rule->wlr_point_earn_price ) ) :
							sprintf( '+%d %s', $campaign_point_rule->earn_point, $base_helper->getPointLabel( $campaign_point_rule->earn_point ) );
					} elseif ( $campaign_type == "coupon" && isset( $campaign_point_rule->earn_reward ) ) {
						$reward                                    = ! empty( $campaign_point_rule->earn_reward ) ? $reward_table->findReward( (int) $campaign_point_rule->earn_reward ) : "";
						$discount_type                             = isset( $reward->discount_type ) && ! empty( $reward->discount_type ) ? $reward->discount_type : "";
						$point_label                               = $this->getDiscountRewardLabel( $discount_type, $reward );
						$reward_label                              = $base_helper->getRewardLabel( 1 );
						$active_campaigns->campaign_title_discount .= ! empty( $reward )
							? ( isset( $reward->discount_value ) && ! empty( $reward->discount_value )
								? sprintf( '%s %s', $point_label, $reward_label )
								: ( ! empty( $point_label ) ? $point_label : "" ) )
							: "";
					}
			}
		}

		return apply_filters( "wlr_alter_campaign_selected_data", $active_campaigns );
	}

	function getCampaignsLevelBatch( $campaign, $conditions ) {
		if ( empty( $campaign ) || empty( $conditions ) ) {
			return array();
		}
		$level_batch = array();
		foreach ( $conditions as $condition ) {
			if ( ! isset( $condition->type ) || empty( $condition->type ) ) {
				continue;
			}
			if ( $condition->type == 'user_level' && isset( $condition->options ) && ! empty( $condition->options ) && isset( $condition->options->value ) ) {
				$level_batch = array_merge( $level_batch, $condition->options->value );
			}
		}
		$level_batch = array_unique( $level_batch );
		if ( empty( $level_batch ) ) {
			return array();
		}
		$level_modal = new Levels();
		$batch_label = array();
		foreach ( $level_batch as $level ) {
			$level_data    = $level_modal->getByKey( (int) $level );
			$batch_label[] = array(
				//phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText
				'name'  => isset( $level_data->name ) && ! empty( $level_data->name ) ? __( $level_data->name, 'wp-loyalty-rules' ) : "",
				'badge' => isset( $level_data->badge ) && ! empty( $level_data->badge ) ? $level_data->badge : WLR_PLUGIN_URL . "Assets/Site/image/default-level.png",
			);
		}

		return empty( $batch_label ) ? array() : $batch_label;
	}

	function getReferralPointMessage( $campaign_point_rule ) {
		if ( ! $this->checkBasicReferralCheck( $campaign_point_rule ) ) {
			return '';
		}
		$discount_title = $this->getAdvocateDiscountMessage( $campaign_point_rule );
		if ( ! empty( $discount_title ) ) {
			$discount_title .= " <br> ";
		}
		$discount_title .= $this->getFriendDiscountMessage( $campaign_point_rule );

		return $discount_title;
	}

	function checkBasicReferralCheck( $campaign_point_rule ) {
		if ( empty( $campaign_point_rule ) || ! is_object( $campaign_point_rule ) ) {
			return false;
		}

		return true;
	}

	function getAdvocateDiscountMessage( $campaign_point_rule ) {
		if ( ! $this->checkBasicReferralCheck( $campaign_point_rule ) ) {
			return '';
		}
		$base_helper    = new \Wlr\App\Helpers\Base();
		$reward_table   = new \Wlr\App\Models\Rewards();
		$discount_title = "";
		$advocate_type  = isset( $campaign_point_rule->advocate ) && isset( $campaign_point_rule->advocate->campaign_type ) && ! empty( $campaign_point_rule->advocate->campaign_type ) ? $campaign_point_rule->advocate->campaign_type : '';
		if ( $advocate_type == "point" ) {
			$earn_point  = isset( $campaign_point_rule->advocate->earn_point ) && ! empty( $campaign_point_rule->advocate->earn_point ) ? $campaign_point_rule->advocate->earn_point : 0;
			$point_label = isset( $campaign_point_rule->advocate->earn_type ) && ( $campaign_point_rule->advocate->earn_type == 'subtotal_percentage' ) && ! empty( $earn_point ) ? round( $earn_point ) . "%" : $earn_point;
			/* translators: 1: point label 2: content */
			$discount_title = ! empty( $earn_point ) ? sprintf( __( 'You get %1$s : %2$s', 'wp-loyalty-rules' ), $base_helper->getPointLabel( $campaign_point_rule->advocate->earn_point ), $point_label ) : "";
		} elseif ( $advocate_type == "coupon" ) {
			$advocate_reward = isset( $campaign_point_rule->advocate->earn_reward ) && ! empty( $campaign_point_rule->advocate->earn_reward ) ? $reward_table->findReward( (int) $campaign_point_rule->advocate->earn_reward ) : "";
			$discount_type   = isset( $advocate_reward->discount_type ) && ! empty( $advocate_reward->discount_type ) ? $advocate_reward->discount_type : '';
			$point_label     = $this->getDiscountRewardLabel( $discount_type, $advocate_reward );
			$reward_label    = $base_helper->getRewardLabel( 1 );
			if ( ! empty( $advocate_reward ) ) {
				/* translators: 1: reward label, 2: discount */
				$discount_title = ! empty( $point_label ) ? sprintf( __( 'You get %1$s: %2$s discount', 'wp-loyalty-rules' ), $reward_label, $point_label ) : "";
			}
		}

		return $discount_title;
	}

	/**
	 * @param $discount_type
	 * @param $reward
	 *
	 * @return string|null
	 */
	public function getDiscountRewardLabel( $discount_type, $reward ) {
		$point_label = "";
		switch ( $discount_type ) {
			case "percent":
				$point_label = round( $reward->discount_value ) . "%";
				break;
			case 'fixed_cart':
				$point_label = self::$woocommerce->getCustomPrice( $reward->discount_value );
				break;
			case 'free_shipping':
				$point_label = __( "Free Shipping", "wp-loyalty-rules" );
				break;
			case 'free_product':
				$point_label = __( "Free Product", "wp-loyalty-rules" );
				break;
		}

		return $point_label;
	}

	function getFriendDiscountMessage( $campaign_point_rule ) {
		if ( ! $this->checkBasicReferralCheck( $campaign_point_rule ) ) {
			return '';
		}
		$base_helper    = new \Wlr\App\Helpers\Base();
		$reward_table   = new \Wlr\App\Models\Rewards();
		$discount_title = "";
		$friend_type    = isset( $campaign_point_rule->friend ) && isset( $campaign_point_rule->friend->campaign_type ) && ! empty( $campaign_point_rule->friend->campaign_type ) ? $campaign_point_rule->friend->campaign_type : "";
		if ( $friend_type == "point" ) {
			$earn_point  = isset( $campaign_point_rule->friend->earn_point ) && ! empty( $campaign_point_rule->friend->earn_point ) ? $campaign_point_rule->friend->earn_point : 0;
			$point_label = isset( $campaign_point_rule->friend->earn_type ) && ( $campaign_point_rule->friend->earn_type == 'subtotal_percentage' ) && ! empty( $earn_point ) ? round( $earn_point ) . "%" : $earn_point;
			/* translators: 1: point, 2: content */
			$discount_title = ! empty( $earn_point ) ? sprintf( __( 'Your friend gets %1$s : %2$s', 'wp-loyalty-rules' ), $base_helper->getPointLabel( $campaign_point_rule->friend->earn_point ), $point_label ) : "";
		} elseif ( $friend_type == "coupon" ) {
			$friend_reward = isset( $campaign_point_rule->friend->earn_reward ) && ! empty( $campaign_point_rule->friend->earn_reward ) ? $reward_table->findReward( (int) $campaign_point_rule->friend->earn_reward ) : "";
			$discount_type = isset( $friend_reward->discount_type ) && ! empty( $friend_reward->discount_type ) ? $friend_reward->discount_type : '';
			$point_label   = $this->getDiscountRewardLabel( $discount_type, $friend_reward );
			$reward_label  = $base_helper->getRewardLabel( 1 );
			if ( ! empty( $friend_reward ) ) {
				/* translators: 1: point, 2: discount */
				$discount_title = ! empty( $point_label ) ? sprintf( __( 'Your friend gets %1$s: %2$s discount', 'wp-loyalty-rules' ), $reward_label, $point_label ) : "";
			}
		}

		return $discount_title;
	}

	function doCompareInListOperation( $operation, $key, $list ) {
		if ( ! is_array( $list ) ) {
			return false;
		}
		$key = is_array( $key ) || is_object( $key ) ? (array) $key : $key;
		switch ( $operation ) {
			case 'not_in_list':
				if ( is_array( $key ) ) {
					return empty( array_intersect( $key, $list ) );
				}

				return ! in_array( $key, $list );
			default:
			case 'in_list';
				if ( is_array( $key ) ) {
					return ! empty( array_intersect( $key, $list ) );
				}

				return in_array( $key, $list );
		}
	}

	function getRewardList() {
		$reward_model = new Rewards();
		$reward_list  = $reward_model->getCurrentRewardList();

		return apply_filters( 'wlr_page_reward_list', $reward_list );
	}

	function getTransactionDetails( $user_email ) {
		if ( empty( $user_email ) ) {
			return array();
		}
		$logs   = new Logs();
		$offset = (int) self::$input->post_get( 'transaction_page', 1 );
		$limit  = 5;
		$start  = ( $offset - 1 ) * $limit;

		return apply_filters( 'wlr_page_transaction_details', array(
			'transactions'        => $logs->getUserLogTransactions( $user_email, $limit, $start ),
			'transaction_total'   => (int) $logs->getUserLogTransactionsCount( $user_email ),
			'offset'              => $offset,
			'current_trans_count' => (int) ( $offset * $limit )
		) );
	}

	function getTotalUserCouponRewards( $user_email, $pagination_params = array() ) {
		if ( empty( $user_email ) ) {
			return array();
		}
		$offset        = ! empty( $pagination_params ) && isset( $pagination_params['coupon_page'] ) && ! empty( $pagination_params['coupon_page'] )
			? $pagination_params['coupon_page'] : (int) self::$input->post_get( 'coupon_page', 1 );
		$limit         = ! empty( $pagination_params ) && isset( $pagination_params['limit'] ) && ! empty( $pagination_params['limit'] )
			? $pagination_params['limit'] : 5;
		$coupons_total = ( new UserRewards() )->getTotalUserCouponRewardByEmail( $user_email );

		return array(
			'coupons_total'        => (int) $coupons_total,
			'offset'               => $offset,
			'limit'                => $limit,
			'current_coupon_count' => (int) ( $offset * $limit )
		);
	}

	function userUsedExpiredCoupons( $user_email, $pagination_params = array() ) {
		$offset               = ! empty( $pagination_params ) && isset( $pagination_params['used_expired_coupon_page'] ) && ! empty( $pagination_params['used_expired_coupon_page'] )
			? $pagination_params['used_expired_coupon_page'] : (int) self::$input->post_get( 'used_expired_coupon_page', 1 );
		$limit                = ! empty( $pagination_params ) && isset( $pagination_params['limit'] ) && ! empty( $pagination_params['limit'] )
			? $pagination_params['limit'] : 5;
		$start                = ( $offset - 1 ) * $limit;
		$used_expired_coupons = ( new UserRewards() )->getUserUsedExpiredRewardByEmail( $user_email, $limit, $start );
		$reward_types         = Woocommerce::getRewardDiscountTypes();
		foreach ( $used_expired_coupons['data'] as &$used_expired_reward ) {
			$used_expired_reward->expiry_date      = ( isset( $used_expired_reward->end_at ) && ! empty( $used_expired_reward->end_at ) && $used_expired_reward->end_at >= 0 ) ? self::$woocommerce->beforeDisplayDate( $used_expired_reward->end_at ) : '';
			$used_expired_reward->created_at       = ( isset( $used_expired_reward->created_at ) && ! empty( $used_expired_reward->created_at ) && $used_expired_reward->created_at >= 0 ) ? self::$woocommerce->beforeDisplayDate( $used_expired_reward->created_at ) : '';
			$used_expired_reward->reward_type_name = isset( $used_expired_reward->discount_type ) && ! empty( $used_expired_reward->discount_type ) && isset( $reward_types[ $used_expired_reward->discount_type ] ) && $reward_types[ $used_expired_reward->discount_type ] ? $reward_types[ $used_expired_reward->discount_type ] : '';
		}

		return apply_filters( 'wlr_page_used_expired_coupon_details', array(
			'expired_used_coupons'         => $used_expired_coupons['data'],
			'expired_used_coupons_total'   => (int) $used_expired_coupons['total'],
			'offset'                       => $offset,
			'limit'                        => $limit,
			'current_expired_coupon_count' => (int) ( $offset * $limit )
		) );
	}

	function getSocialShareList( $user_email, $url ) {
		if ( empty( $user_email ) || empty( $url ) ) {
			return array();
		}
		$social_share_list = array();
		$reward_list       = $this->getSocialRewardList( $user_email );
		foreach ( $reward_list as $key => $social_share ) {
			if ( empty( $social_share ) ) {
				continue;
			}
			$social_share_message      = $this->getSocialShareMessage( $key, $social_share, $social_share_list );
			$share_subject             = $this->getSocialMailSubject( $key, $social_share, $social_share_list );
			$share_body                = $this->getSocialMailBody( $key, $social_share, $social_share_list );
			$image_icon                = $this->getCampaignIcon( $key, $social_share, $social_share_list );
			$social_share_list[ $key ] = array(
				'icon'          => 'wlr wlrf-' . $key,
				'share_content' => $social_share_message,
				'url'           => '',
				'image_icon'    => $image_icon
			);
			switch ( $key ) {
				case 'twitter_share':
					$social_share_list[ $key ]['name'] = __( 'Twitter', 'wp-loyalty-rules' );
					$social_share_list[ $key ]['url']  = 'https://twitter.com/intent/tweet?text=' . urlencode( $social_share_message );
					break;
				case 'facebook_share':
					$social_share_list[ $key ]['name'] = __( 'Facebook', 'wp-loyalty-rules' );
					$social_share_list[ $key ]['url']  = "https://www.facebook.com/sharer/sharer.php?quote=" . urlencode( $social_share_message ) . "&u=" . urlencode( $url ) . "&display=page";
					break;
				case 'whatsapp_share':
					$social_share_list[ $key ]['name'] = __( 'WhatsApp', 'wp-loyalty-rules' );
					$social_share_list[ $key ]['url']  = 'https://api.whatsapp.com/send?text=' . urlencode( $social_share_message );
					break;
				case 'email_share':
					$social_share_list[ $key ]['name']          = __( 'E-mail', 'wp-loyalty-rules' );
					$social_share_list[ $key ]['url']           = "mailto:?subject=" . rawurlencode( $share_subject ) . "&amp;body=" . rawurlencode( $share_body );
					$social_share_list[ $key ]['share_subject'] = $share_subject;
					$social_share_list[ $key ]['share_body']    = $share_body;
					break;
			}
		}

		return apply_filters( 'wlr_page_social_share_list', $social_share_list );
	}

	function getSocialRewardList( $user_email ) {
		if ( empty( $user_email ) ) {
			return array();
		}
		$earn_campaign    = EarnCampaign::getInstance();
		$social_extra     = array(
			'user_email'         => $user_email,
			'cart'               => WC()->cart,
			'is_calculate_based' => 'cart',
			'is_message'         => true
		);
		$cart_action_list = $earn_campaign->getSocialActionList();
		$reward_list      = $earn_campaign->getActionEarning( $cart_action_list, $social_extra );

		return apply_filters( 'wlr_social_reward_list', $reward_list, $user_email );
	}

	function getSocialShareMessage( $action, $social_share, $social_share_list ) {
		if ( empty( $action ) || $action == 'email_share' || ! is_array( $social_share ) || empty( $social_share ) ) {
			return '';
		}
		$social_share_message = is_array( $social_share_list ) && isset( $social_share_list[ $action ] ) && is_array( $social_share_list[ $action ] ) && isset( $social_share_list[ $action ]['share_content'] ) && ! empty( $social_share_list[ $action ]['share_content'] ) ? $social_share_list[ $action ]['share_content'] : '';
		foreach ( $social_share as $share_list ) {
			if ( ! empty( $share_list['messages'] ) ) {
				$social_share_message .= $share_list['messages'] . ' ';
				break;
			}
		}

		return trim( $social_share_message );
	}

	function getSocialMailSubject( $action, $social_share, $social_share_list ) {
		if ( empty( $action ) || $action != 'email_share' || ! is_array( $social_share ) || empty( $social_share ) ) {
			return '';
		}
		$share_subject = is_array( $social_share_list ) && isset( $social_share_list[ $action ] ) && is_array( $social_share_list[ $action ] ) && isset( $social_share_list[ $action ]['share_subject'] ) && ! empty( $social_share_list[ $action ]['share_subject'] ) ? $social_share_list[ $action ]['share_subject'] : '';
		foreach ( $social_share as $share_list ) {
			if ( isset( $share_list['messages'] ) && ! empty( $share_list['messages'] ) ) {
				if ( isset( $share_list['messages']['subject'] ) && ! empty( $share_list['messages']['subject'] ) ) {
					$share_subject .= $share_list['messages']['subject'] . ' ';
					break;
				}
			}
		}

		return trim( $share_subject, ' ' );
	}

	function getSocialMailBody( $action, $social_share, $social_share_list ) {
		if ( empty( $action ) || $action != 'email_share' || ! is_array( $social_share ) || empty( $social_share ) ) {
			return '';
		}
		$share_subject = is_array( $social_share_list ) && isset( $social_share_list[ $action ] ) && is_array( $social_share_list[ $action ] ) && isset( $social_share_list[ $action ]['share_body'] ) && ! empty( $social_share_list[ $action ]['share_body'] ) ? $social_share_list[ $action ]['share_body'] : '';
		foreach ( $social_share as $share_list ) {
			if ( isset( $share_list['messages'] ) && ! empty( $share_list['messages'] ) ) {
				if ( isset( $share_list['messages']['body'] ) && ! empty( $share_list['messages']['body'] ) ) {
					$share_subject .= $share_list['messages']['body'] . ' ';
					break;
				}
			}
		}

		return trim( $share_subject, ' ' );
	}

	function getCampaignIcon( $action, $social_share, $social_share_list ) {
		if ( empty( $action ) || ! is_array( $social_share ) || empty( $social_share ) ) {
			return '';
		}
		$image_icon = is_array( $social_share_list ) && isset( $social_share_list[ $action ] ) && is_array( $social_share_list[ $action ] ) && isset( $social_share_list[ $action ]['image_icon'] ) && ! empty( $social_share_list[ $action ]['image_icon'] ) ? $social_share_list[ $action ]['image_icon'] : '';
		if ( empty( $image_icon ) ) {
			foreach ( $social_share as $share_list ) {
				if ( isset( $share_list['icon'] ) && ! empty( $share_list['icon'] ) ) {
					$image_icon = $share_list['icon'];
					break;
				}
			}
		}

		return $image_icon;
	}

	function getPageUserRewards( $user_email, $pagination_params = array() ) {
		if ( empty( $user_email ) ) {
			return array();
		}
		$reward_helper      = \Wlr\App\Helpers\Rewards::getInstance();
		$allowed_conditions = apply_filters( 'wlr_page_allowed_conditions', array(
			'user_role',
			'customer',
			'user_point',
			'currency',
			'language'
		) );
		$extra              = array(
			'user_email'         => $user_email,
			'cart'               => WC()->cart,
			'is_calculate_based' => 'cart',
			'allowed_condition'  => $allowed_conditions
		);
		$user_reward        = $reward_helper->getUserRewards( $user_email, $extra, false, $pagination_params );
		$point_rewards      = $reward_helper->getPointRewards( $user_email, $extra );
		if ( self::$woocommerce->getOptions( 'wlr_new_rewards_section_enabled' ) == 'yes' ) {
			$coupon_reward = $reward_helper->getCouponRewards( $user_email, $extra );
			$point_rewards = array_merge( $point_rewards, $coupon_reward );
		}
		$user_reward_list = array_merge( $user_reward, $point_rewards );
		$user             = $reward_helper->getPointUserByEmail( $user_email );
		/*$user_model = new Users();
		$user = $user_model->getQueryData(array('user_email' => array('operator' => '=', 'value' => $user_email,),), '*', array(), false);*/
		if ( ! empty( $user_reward_list ) ) {
			$reward_types = Woocommerce::getRewardDiscountTypes();
			foreach ( $user_reward_list as &$user_reward_data ) {
				$user_reward_data->reward_type_name = isset( $user_reward_data->discount_type ) && ! empty( $user_reward_data->discount_type ) && isset( $reward_types[ $user_reward_data->discount_type ] ) && $reward_types[ $user_reward_data->discount_type ] ? $reward_types[ $user_reward_data->discount_type ] : '';
				$user_reward_data->expiry_date      = ( isset( $user_reward_data->end_at ) && ! empty( $user_reward_data->end_at ) && $user_reward_data->end_at >= 0 ) ? self::$woocommerce->beforeDisplayDate( $user_reward_data->end_at ) : '';
				$user_reward_data->created_at       = ( isset( $user_reward_data->created_at ) && ! empty( $user_reward_data->created_at ) && $user_reward_data->created_at >= 0 ) ? self::$woocommerce->beforeDisplayDate( $user_reward_data->created_at ) : '';
				if ( isset( $user_reward_data->discount_type ) && ! empty( $user_reward_data->discount_type ) && ( $user_reward_data->discount_type == 'points_conversion' )
				     && isset( $user_reward_data->reward_table ) && $user_reward_data->reward_table != 'user_reward' ) {
					$this->getPointConversionRedeemData( $user_reward_data, $user );
				}
				if ( isset( $user_reward_data->discount_type ) && ! empty( $user_reward_data->discount_type ) && ( $user_reward_data->discount_type == 'free_product' )
				     && isset( $user_reward_data->reward_table ) && in_array( $user_reward_data->reward_table, array(
						'reward',
						'user_reward'
					) ) && isset( $user_reward_data->free_product ) && ! empty( $user_reward_data->free_product )
				     && self::$woocommerce->isJson( $user_reward_data->free_product ) ) {

					$user_reward_free_products              = json_decode( $user_reward_data->free_product, true );
					$user_reward_data->is_out_of_stock      = false;
					$user_reward_data->out_of_stock_message = "";
					$is_stock_empty                         = array();
					foreach ( $user_reward_free_products as $f_product ) {
						$product = wc_get_product( $f_product['value'] );
						if ( $product && ! $product->is_in_stock() ) {
							$user_reward_data->is_out_of_stock      = true;
							$user_reward_data->out_of_stock_message = __( 'Out of Stock', 'wp-loyalty-rules' );
							$is_stock_empty[]                       = array(
								'product_id'     => $f_product['value'],
								'product_name'   => $product->get_name(),
								'stock_quantity' => $product->get_stock_quantity(),
							);
						}
					}
					$user_reward_data->is_stock_empty_products = $is_stock_empty;
				}
			}
		}

		return apply_filters( 'wlr_page_user_reward_list', $user_reward_list );
	}

	protected function getPointConversionRedeemData( &$user_reward_data, $user ) {
		// case 1: if cart amount available, convert cart amount to required point
		// case 2: if cart required point greater than available point, then change required point to available point
		// case 3: if cart required point less than available point, then use required point
		// case 4: if user enter 10 point, need to display this conversion value
		$earn_campaign_helper = new EarnCampaign();
		$available_point      = ( is_object( $user ) && ! empty( $user->points ) ) ? $user->points : 0;
		$cart_amount          = self::$woocommerce->getCartSubtotal();
		$cart_amount          = self::$woocommerce->getCustomPrice( $cart_amount, false );
		$cart_required_point  = 0;
		$discount_value       = self::$woocommerce->getCustomPrice( $user_reward_data->discount_value, false );
		if ( $cart_amount > 0 ) {
			$cart_required_point = ( $user_reward_data->require_point / $discount_value ) * $cart_amount;
		}
		$woocommerce_currency = self::$woocommerce->getDisplayCurrency();
		$input_point          = ( $cart_required_point > 0 && $cart_required_point < $available_point ) ? $cart_required_point : $available_point;
		if ( isset( $user_reward_data->maximum_point ) && $user_reward_data->maximum_point > 0 && $user_reward_data->maximum_point < $input_point ) {
			$input_point = $user_reward_data->maximum_point;
		}
		$woocommerce_currency_symbol = self::$woocommerce->getCurrencySymbols( $woocommerce_currency );
		$conversion_price_format     = apply_filters( 'wlr_user_reward_point_conversion_price_format', sprintf( '=(%s) %s', $woocommerce_currency, $woocommerce_currency_symbol ), $woocommerce_currency, $woocommerce_currency_symbol );
		$max_allowed_point           = $user_reward_data->maximum_point ?? 0;
		$min_allowed_point           = $user_reward_data->minimum_point ?? 0;
		$is_max_changed              = false;

		$input_point      = floor( $input_point );
		$reward_type_name = ( $cart_amount > 0 ) ? sprintf( "%s %s =%s", $user_reward_data->require_point, $earn_campaign_helper->getPointLabel( $user_reward_data->require_point ), self::$woocommerce->getCustomPrice( $user_reward_data->discount_value ) ) : $user_reward_data->reward_type_name;
		$input_value      = number_format( ( ( $input_point / $user_reward_data->require_point ) * $discount_value ), 2 );
		$min_or_max_label = $earn_campaign_helper->getPointLabel( 1 );
		if ( $user_reward_data->discount_type == 'points_conversion' && $user_reward_data->coupon_type == 'percent' ) {
			if ( $user_reward_data->max_percentage <= 0 ) {
				$is_max_changed                   = true;
				$user_reward_data->max_percentage = 50;
			}
			$max_point = ( $user_reward_data->require_point / $user_reward_data->discount_value ) * $user_reward_data->max_percentage;
			if ( $max_point > 0 && ( $max_point < $max_allowed_point || $max_allowed_point == 0 ) ) {
				$is_max_changed    = true;
				$max_allowed_point = $max_point;
			}

			if ( $max_allowed_point > 0 && $max_allowed_point < $input_point ) {
				$input_point = $max_allowed_point;
			}
			if ( $input_point > 0 ) {
				$input_point = round( $input_point, 0, PHP_ROUND_HALF_DOWN );
			}
			$conversion_price_format = '=';
			if ( $cart_amount > 0 ) {
				$reward_type_name = sprintf( "%s %s = %s", $user_reward_data->require_point, $earn_campaign_helper->getPointLabel( $user_reward_data->require_point ), $user_reward_data->discount_value . '%' );
			}
			$input_value = ( $input_point / $user_reward_data->require_point ) * $user_reward_data->discount_value;
		}

		$data = apply_filters( 'wlr_user_reward_point_conversion_redeem_data', array(
			'reward_type_name'        => $reward_type_name,
			'input_point'             => $input_point,
			'input_value'             => $input_value,
			'available_point'         => $available_point,
			'cart_amount'             => $cart_amount,
			'max_allowed_point'       => floor( $max_allowed_point ),
			'min_allowed_point'       => floor( $min_allowed_point ),
			'conversion_price_format' => $conversion_price_format,
			'is_max_changed'          => $is_max_changed,
			/* translators: 1: label , 2: point */
			'min_message'             => sprintf( __( 'Min allowed %1$s: %2$s', 'wp-loyalty-rules' ), $min_or_max_label, floor( $min_allowed_point ) ),
			/* translators: 1: label , 2: point */
			'max_message'             => sprintf( __( 'Max allowed %1$s: %2$s', 'wp-loyalty-rules' ), $min_or_max_label, floor( $max_allowed_point ) )
		) );
		foreach ( $data as $key => $value ) {
			$user_reward_data->$key = $value;
		}
	}

	function getPageUserDetails( $user_email, $page = '' ) {
		$earn_campaign_helper = EarnCampaign::getInstance();
		$user_point_table     = new Users();
		$conditions           = array(
			'user_email' => array(
				'operator' => '=',
				'value'    => sanitize_email( $user_email )
			)
		);
		$user                 = $user_point_table->getQueryData( $conditions, '*', array(), false, true );
		if ( is_object( $user ) && isset( $user->id ) && $user->id > 0 && isset( $user->level_id ) ) {
			$user_point_table->insertOrUpdate( array( 'level_id' => $user->level_id ), $user->id );
			$user = $user_point_table->getByKey( $user->id );
			if ( $user->level_id > 0 ) {
				$level_data                            = $earn_campaign_helper->getLevel( $user->level_id );
				$level_data->current_level_name        = isset( $level_data->name ) && ! empty( $level_data->name ) ? $level_data->name : '';
				$level_data->current_level_description = isset( $level_data->description ) && ! empty( $level_data->description ) ? $level_data->description : '';
				$level_data->current_level_image       = isset( $level_data->badge ) && ! empty( $level_data->badge ) ? $level_data->badge : WLR_PLUGIN_URL . "Assets/Site/image/default-level.png";
				$level_data->current_level_start       = isset( $level_data->from_points ) && ! empty( $level_data->from_points ) ? $level_data->from_points : 0;
				if ( isset( $level_data->to_points ) && $level_data->to_points > 0 ) {
					$next_level_data             = $earn_campaign_helper->getNextLevel( $level_data->to_points, $user->level_id );
					$level_data->next_level_data = $next_level_data;
					if ( ! empty( $next_level_data ) && isset( $next_level_data->from_points ) && $next_level_data->from_points > 0 ) {
						$level_data->next_level_name        = isset( $next_level_data->name ) && ! empty( $next_level_data->name ) ? $next_level_data->name : '';
						$level_data->next_level_description = isset( $next_level_data->description ) && ! empty( $next_level_data->description ) ? $next_level_data->description : '';
						$level_data->next_level_start       = ! empty( $next_level_data->from_points ) ? $next_level_data->from_points : 0;
					}
				}
				$user->level_data = $level_data;
			}
		}
		$used_coupon_count = ( new UserRewards() )->getUserRewardsCount( $user_email );
		if ( ! empty( $used_coupon_count ) ) {
			$user->total_coupon_count = $used_coupon_count;
		}

		return apply_filters( 'wlr_page_user_details', $user );
	}

	function getBrandingData() {
		return apply_filters( 'wlr_page_branding_details', [
			'theme_color'                    => Settings::get( 'theme_color', '#4F47EB' ),
			'border_color'                   => Settings::get( 'border_color', '#CFCFCF' ),
			'background_color'               => Settings::get( 'background_color', '#ffffff' ),
			'button_text_color'              => Settings::get( 'button_text_color', '#ffffff' ),
			'heading_color'                  => Settings::get( 'heading_color', '#1D2327' ),
			'redeem_point_icon'              => Settings::get( 'redeem_point_icon' ),
			'available_point_icon'           => Settings::get( 'available_point_icon' ),
			'used_reward_icon'               => Settings::get( 'used_reward_icon' ),
			//phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText
			'redeem_button_text'             => __( Settings::get( 'redeem_button_text', 'Redeem Now' ), 'wp-loyalty-rules' ),
			'redeem_button_color'            => Settings::get( 'redeem_button_color', '#4F47EB' ),
			'redeem_button_text_color'       => Settings::get( 'redeem_button_text_color', '#ffffff' ),
			'apply_coupon_border_color'      => Settings::get( 'apply_coupon_border_color', '#FF8E3D' ),
			'apply_coupon_button_text_color' => Settings::get( 'apply_coupon_button_text_color', '#ffffff' ),
			'apply_coupon_button_color'      => Settings::get( 'apply_coupon_button_color', '#4F47EB' ),
			//phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText
			'apply_coupon_button_text'       => __( Settings::get( 'apply_coupon_button_text', 'Apply Coupon' ), 'wp-loyalty-rules' ),
			'apply_coupon_background'        => Settings::get( 'apply_coupon_background', '#FFF8F3' )
		] );
	}

	/**
	 * Enable or disable the option to send email to a user.
	 *
	 * @return void
	 */
	public static function enableEmailSend() {
		$input     = new Input();
		$wlr_nonce = (string) $input->post_get( 'wlr_nonce', '' );
		if ( ! Woocommerce::verify_nonce( $wlr_nonce, 'wlr_enable_sent_email_nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$woocommerce       = Woocommerce::getInstance();
		$input             = new Input();
		$user_email        = $woocommerce->get_login_user_email();
		$enable_sent_email = (int) $input->post_get( 'is_allow_send_email', 1 );

		if ( Users::updateSentEmailData( $user_email, $enable_sent_email ) ) {
			wp_send_json_success( [ 'message' => __( 'Email Opt-in updated successfully.', 'wp-loyalty-rules' ) ] );
		}
		wp_send_json_error( [
			'message' => __( 'Email Opt-in update failed', 'wp-loyalty-rules' )
		] );
	}

	/**
	 * Change level ID based on point
	 *
	 * @param int $level_id The current level ID
	 * @param int $point The total earn point
	 *
	 * @return int The updated level ID, or 0 if level ID is less than or equal to 0
	 */
	public static function changeLevelId( $level_id, $point, $user_fields ) {
		$level_model      = new Levels();
		$point            = apply_filters( 'wlr_points_to_get_level_id', $point, $user_fields );
		$current_level_id = $level_model->getCurrentLevelId( $point );
		$current_level_id = apply_filters( 'wlr_after_level_update', $current_level_id, $point, $user_fields );

		return $current_level_id > 0 ? $current_level_id : 0;
	}
}
