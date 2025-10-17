<?php

namespace Wlr\App\Emails;

use Wlr\App\Emails\Traits\Common;
use Wlr\App\Helpers\Rewards;
use Wlr\App\Helpers\Woocommerce;
use Wlr\App\Models\UserRewards;

defined( "ABSPATH" ) or die();
require_once plugin_dir_path( WC_PLUGIN_FILE ) . 'includes/emails/class-wc-email.php';

class WlrExpireEmail extends \WC_Email {
	public $lang;
	use Common;

	public function __construct() {
		$this->id             = 'wlr_expire_email';
		$this->customer_email = true;

		$this->title          = __( 'Reward expiry notification', 'wp-loyalty-rules' );
		$this->template_html  = 'emails/wlr-expire-email.php';
		$this->template_plain = 'emails/plain/wlr-expire-email.php';
		$this->template_base  = WLR_PLUGIN_PATH . 'templates/';
		$this->placeholders   = apply_filters( $this->id . '_short_codes_list', [
			'{wlr_reward_name}'       => 'WLR-YTE-F4D',
			'{wlr_expiry_redeem_url}' => 'https://example.com',
			'{wlr_expiry_date}'       => gmdate( 'Y-m-d' ),

			'{wlr_referral_url}'              => 'https://example.com/?ref_code=1234',
			'{wlr_user_point}'                => 0,
			'{wlr_total_earned_point}'        => 0,
			'{wlr_used_point}'                => 0,
			'{wlr_user_name}'                 => 'Alex',
			'{wlr_order_id}'                  => '1234',
			'{wlr_store_name}'                => 'example',
			'{wlr_customer_reward_page_link}' => 'https://example.com',
			'{wlr_expire_mail_content}'       => ''
		] );
		add_action( 'wlr_notify_send_expire_email', [ $this, 'trigger' ] );
		parent::__construct();
		$this->description = __( 'This email is sent to the customer when reward is going to expire', 'wp-loyalty-rules' );
	}

	public function get_default_subject() {
		return __( 'Your reward are about to expire. Redeem now!', 'wp-loyalty-rules' );
	}

	public function get_default_heading() {
		return __( 'Your reward are about to expire. Redeem now!', 'wp-loyalty-rules' );
	}

	public function trigger( $user_reward ) {
		if ( empty( $user_reward->email ) || empty( $user_reward->expire_email_date ) || ! isset( $user_reward->is_expire_email_send ) || $user_reward->is_expire_email_send == 1 ) {
			return;
		}

		$loyal_user = $this->getLoyaltyUser( $user_reward->email );
		if ( ! is_object( $loyal_user ) ) {
			return;
		}

		$is_send_email  = isset( $loyal_user->is_allow_send_email ) && $loyal_user->is_allow_send_email > 0;
		$is_banned_user = isset( $loyal_user->is_banned_user ) && $loyal_user->is_banned_user > 0;
		if ( ! $is_send_email || $is_banned_user || ! apply_filters( 'wlr_before_send_email', true,
				[
					'email_type'  => $this->id,
					'user_reward' => $user_reward
				] ) ) {
			return;
		}
		$this->setup_locale();
		$reward_helper      = Rewards::getInstance();
		$this->recipient    = sanitize_email( $user_reward->email );
		$this->lang         = get_locale();
		$woocommerce_helper = Woocommerce::getInstance();
		$this->object       = $user_reward;
		$ref_code           = ! empty( $loyal_user->refer_code ) ? $loyal_user->refer_code : '';
		// phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText
		$display_name = __( $user_reward->display_name, 'wp-loyalty-rules' );
		if ( ! empty( $user_reward->discount_code ) ) {
			$display_name = $user_reward->discount_code;
		}
		$expire_date_format = get_option( 'date_format', 'Y-m-d' );
		$expire_date_format = apply_filters( 'wlr_expire_mail_date_format', $expire_date_format );
		$expire_date        = ! empty( $user_reward->end_at ) ? $user_reward->end_at : 0;

		$this->placeholders['{wlr_reward_name}']       = $display_name;
		$this->placeholders['{wlr_expiry_redeem_url}'] = get_permalink( wc_get_page_id( 'shop' ) );
		$this->placeholders['{wlr_expiry_date}']       = $woocommerce_helper->beforeDisplayDate( $expire_date, $expire_date_format );

		$this->placeholders['{wlr_referral_url}']              = $ref_code ? $reward_helper->getReferralUrl( $ref_code ) : '';
		$this->placeholders['{wlr_user_point}']                = $loyal_user->points ?? 0;
		$this->placeholders['{wlr_total_earned_point}']        = $loyal_user->earn_total_point ?? 0;
		$this->placeholders['{wlr_used_point}']                = $loyal_user->used_total_points ?? 0;
		$this->placeholders['{wlr_user_name}']                 = $this->getUserDisplayName( $user_reward->email );
		$this->placeholders['{wlr_order_id}']                  = $data['order_id'] ?? '';
		$this->placeholders['{wlr_store_name}']                = apply_filters( 'wlr_before_display_store_name', get_option( 'blogname' ) );
		$this->placeholders['{wlr_customer_reward_page_link}'] = get_permalink( get_option( 'woocommerce_myaccount_page_id' ) );

		$this->placeholders = apply_filters( 'wlr_expire_coupon_email_short_codes', $this->placeholders, $user_reward );
		$content            = stripslashes( get_option( 'wlr_expire_email_template' ) );
		$content_html       = empty( $content ) ? $this->defaultContent() : $content;
		foreach ( $this->placeholders as $short_code => $short_code_value ) {
			$content_html = str_replace( $short_code, $short_code_value, $content_html );
		}
		$this->placeholders['{wlr_expire_mail_content}'] = $content_html;
		if ( $this->is_enabled() && $this->get_recipient() ) {
			$created_at = strtotime( gmdate( "Y-m-d H:i:s" ) );
			$log_data   = array(
				'user_email'          => $user_reward->email,
				'action_type'         => ! empty( $user_reward->action_type ) ? $user_reward->action_type : '',
				'earn_campaign_id'    => ! empty( $user_reward->earn_campaign_id ) ? $user_reward->earn_campaign_id : 0,
				'campaign_id'         => ! empty( $user_reward->campaign_id ) ? $user_reward->campaign_id : 0,
				'order_id'            => ! empty( $user_reward->order_id ) ? $user_reward->order_id : 0,
				'product_id'          => ! empty( $user_reward->product_id ) ? $user_reward->product_id : 0,
				'admin_id'            => ! empty( $user_reward->admin_id ) ? $user_reward->admin_id : 0,
				'created_at'          => $created_at,
				'modified_at'         => 0,
				'points'              => 0,
				'action_process_type' => 'email_notification',
				'referral_type'       => '',
				'reward_id'           => ! empty( $user_reward->reward_id ) ? $user_reward->reward_id : 0,
				'user_reward_id'      => ! empty( $user_reward->id ) ? $user_reward->id : 0,
				'expire_email_date'   => $user_reward->expire_email_date,
				'expire_date'         => ! empty( $user_reward->end_at ) ? $user_reward->end_at : 0,
				'reward_display_name' => ! empty( $user_reward->display_name ) ? $user_reward->display_name : '',
				'required_points'     => ! empty( $user_reward->required_points ) ? $user_reward->required_points : 0,
				'discount_code'       => ! empty( $user_reward->discount_code ) ? $user_reward->discount_code : null,
			);
			// translators: %s: discount code
			$log_data['note'] = sprintf( __( 'Sending expiry coupon email failed(%s)', 'wp-loyalty-rules' ), $log_data['discount_code'] );
			// translators: %s: discount code
			$log_data['customer_note'] = sprintf( __( 'Sending expiry coupon email failed(%s)', 'wp-loyalty-rules' ), $log_data['discount_code'] );
			if ( $this->send( $this->get_recipient(), $this->get_subject(), $this->get_content(), $this->get_headers(), $this->get_attachments() ) ) {
				$user_reward_table = new UserRewards();
				$update_data       = [
					'is_expire_email_send' => 1
				];
				$where             = [
					'id' => $user_reward->id
				];
				$user_reward_table->updateRow( $update_data, $where );
				// translators: %s: discount code
				$log_data['note'] = sprintf( __( 'Expiry coupon email sent to customer successfully(%s)', 'wp-loyalty-rules' ), $log_data['discount_code'] );
				// translators: %s: discount code
				$log_data['customer_note'] = sprintf( __( 'Expiry coupon email sent successfully(%s)', 'wp-loyalty-rules' ), $log_data['discount_code'] );
			}
			$reward_helper->add_note( $log_data );
		}
		$this->restore_locale();
	}

	function defaultContent() {
		return '<div style="cursor:auto;font-family: Arial;font-size:16px;line-height:24px;text-align:left;">
                   <h3 style="display: block;margin: 0 0 40px 0; color: #333;">' . esc_attr__( '{wlr_reward_name} reward are going to expire soon!', 'wp-loyalty-rules' ) . '</h3>
                   <p style="display: block;margin: 0 0 40px 0; color: #333;">' . esc_attr__( 'Redeem your hard earned reward before it expires on {wlr_expiry_date}', 'wp-loyalty-rules' ) . '</p>
                   <a href="{wlr_expiry_redeem_url}" target="_blank"> ' . esc_attr__( 'Shop & Redeem Now', 'wp-loyalty-rules' ) . '</a>
                </div>';
	}

	public function get_content_html() {
		return $this->format_string( wc_get_template_html( $this->template_html, [
			'lang'               => $this->lang,
			'user_reward'        => $this->object,
			'email_heading'      => $this->get_heading(),
			'additional_content' => $this->get_additional_content(),
			'sent_to_admin'      => false,
			'plain_text'         => false,
			'email'              => $this
		], 'wployalty', $this->template_base ) );
	}

	public function get_content_plain() {
		return $this->format_string( wc_get_template_html( $this->template_plain, [
			'lang'               => $this->lang,
			'user_reward'        => $this->object,
			'email_heading'      => $this->get_heading(),
			'additional_content' => $this->get_additional_content(),
			'sent_to_admin'      => false,
			'plain_text'         => true,
			'email'              => $this
		], 'wployalty', $this->template_base ) );
	}
}