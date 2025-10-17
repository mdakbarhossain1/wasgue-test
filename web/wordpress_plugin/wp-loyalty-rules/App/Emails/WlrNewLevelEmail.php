<?php

namespace Wlr\App\Emails;

use Wlr\App\Emails\Traits\Common;
use Wlr\App\Helpers\Rewards;
use Wlr\App\Helpers\Woocommerce;
use Wlr\App\Models\EarnCampaign;
use Wlr\App\Models\Levels;

defined( "ABSPATH" ) or die();
require_once plugin_dir_path( WC_PLUGIN_FILE ) . 'includes/emails/class-wc-email.php';

class WlrNewLevelEmail extends \WC_Email {
	public $lang;
	use Common;

	public function __construct() {
		$this->id             = 'wlr_new_level_email';
		$this->customer_email = true;

		$this->title          = __( 'Level achievement notification', 'wp-loyalty-rules' );
		$this->template_html  = 'emails/wlr-new-level-email.php';
		$this->template_plain = 'emails/plain/wlr-new-level-email.php';
		$this->template_base  = WLR_PLUGIN_PATH . 'templates/';
		$this->placeholders   = apply_filters( $this->id . '_short_codes_list', [
			'{wlr_level_name}'                => 'Silver',
			'{wlr_referral_url}'              => 'https://example.com/?ref_code=1234',
			'{wlr_user_point}'                => 0,
			'{wlr_total_earned_point}'        => 0,
			'{wlr_used_point}'                => 0,
			'{wlr_user_name}'                 => 'Alex',
			'{wlr_store_name}'                => 'example',
			'{wlr_customer_reward_page_link}' => 'https://example.com',
			'{wlr_new_level_mail_content}'    => ''
		] );

		add_action( 'wlr_after_user_level_changed', [ $this, 'trigger' ], 10, 2 );
		parent::__construct();
		$this->description = __( 'This email is sent to the customer when they move to new level', 'wp-loyalty-rules' );
	}

	public function get_default_subject() {
		return __( 'You\'ve unlocked a new level!', 'wp-loyalty-rules' );
	}

	public function get_default_heading() {
		return __( 'Well Done! You have Reached an Exciting New Level!', 'wp-loyalty-rules' );
	}

	function trigger( $old_level_id, $user_fields ) {
		if ( empty( $user_fields['user_email'] ) || empty( $user_fields['level_id'] ) ) {
			return;
		}

		$loyal_user = $this->getLoyaltyUser( $user_fields['user_email'] );
		if ( ! is_object( $loyal_user ) ) {
			return;
		}
		$is_send_email  = isset( $loyal_user->is_allow_send_email ) && $loyal_user->is_allow_send_email > 0;
		$is_banned_user = isset( $loyal_user->is_banned_user ) && $loyal_user->is_banned_user > 0;

		if ( ! $is_send_email || $is_banned_user || ! apply_filters( 'wlr_before_send_email', true,
				[
					'email_type'   => $this->id,
					'old_level_id' => $old_level_id,
					'user_fields'  => $user_fields
				] ) ) {
			return;
		}
		$this->setup_locale();
		$reward_helper   = Rewards::getInstance();
		$this->recipient = $user_fields['user_email'];
		$this->lang      = get_locale();
		$ref_code        = ! empty( $loyal_user->refer_code ) ? $loyal_user->refer_code : '';

		$level_model  = new Levels();
		$level        = $level_model->getByKey( $user_fields['level_id'] );
		$this->object = $level;
		// phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText
		$this->placeholders['{wlr_level_name}']                = ! empty( $level->name ) ? __( $level->name, 'wp-loyalty-rules' ) : '';
		$this->placeholders['{wlr_referral_url}']              = $ref_code ? $reward_helper->getReferralUrl( $ref_code ) : '';
		$this->placeholders['{wlr_user_point}']                = $loyal_user->points ?? 0;
		$this->placeholders['{wlr_total_earned_point}']        = $loyal_user->earn_total_point ?? 0;
		$this->placeholders['{wlr_used_point}']                = $loyal_user->used_total_points ?? 0;
		$this->placeholders['{wlr_user_name}']                 = $this->getUserDisplayName( $user_fields['user_email'] );
		$this->placeholders['{wlr_store_name}']                = apply_filters( 'wlr_before_display_store_name', get_option( 'blogname' ) );
		$this->placeholders['{wlr_customer_reward_page_link}'] = get_permalink( get_option( 'woocommerce_myaccount_page_id' ) );
		$this->placeholders                                    = apply_filters( 'wlr_earn_point_email_short_codes', $this->placeholders, $user_fields );

		$content      = stripslashes( get_option( 'wlr_new_level_email_template' ) );
		$content_html = empty( $content ) ? $this->defaultContent() : $content;
		foreach ( $this->placeholders as $short_code => $short_code_value ) {
			$content_html = str_replace( $short_code, $short_code_value, $content_html );
		}

		$this->placeholders['{wlr_new_level_mail_content}'] = $content_html;

		if ( $this->is_enabled() && $this->get_recipient() ) {
			$created_at = strtotime( gmdate( "Y-m-d H:i:s" ) );
			$log_data   = [
				'user_email'          => sanitize_email( $user_fields['user_email'] ),
				'action_type'         => 'new_level',
				'earn_campaign_id'    => 0,
				'campaign_id'         => 0,
				'order_id'            => 0,
				'product_id'          => 0,
				'admin_id'            => 0,
				'created_at'          => $created_at,
				'modified_at'         => 0,
				'points'              => 0,
				'action_process_type' => 'email_notification',
				'referral_type'       => '',
				'reward_id'           => 0,
				'user_reward_id'      => 0,
				'expire_email_date'   => 0,
				'expire_date'         => 0,
				'reward_display_name' => null,
				'required_points'     => 0,
				'discount_code'       => null,
			];
			// translators: %s: email
			$note                      = sprintf( __( 'Sending level update email failed(%s)', 'wp-loyalty-rules' ), $user_fields['user_email'] );
			$log_data['note']          = $note;
			$log_data['customer_note'] = $note;
			if ( $this->send( $this->get_recipient(), $this->get_subject(), $this->get_content(), $this->get_headers(), $this->get_attachments() ) ) {
				// translators: %s: email
				$note                      = sprintf( __( 'Level update email successfully sent!(%s)', 'wp-loyalty-rules' ), $user_fields['user_email'] );
				$log_data['note']          = $note;
				$log_data['customer_note'] = $note;
			}
			$reward_helper->add_note( $log_data );
		}
		$this->restore_locale();
	}

	function defaultContent() {
		return '<div style="cursor:auto;font-family: Arial;font-size:16px;line-height:24px;text-align:left;">
    <h3 style="display: block;margin: 0 0 40px 0; color: #333;">' . esc_attr__( 'Hey!', 'wp-loyalty-rules' ) . '</h3>
    <h3 style="display: block;margin: 0 0 40px 0; color: #333;">' . esc_attr__( 'Congratulations on reaching new level {wlr_level_name} at {wlr_store_name}!', 'wp-loyalty-rules' ) . '</h3>
    <div style="display: block;margin: 0 0 24px 0;border: 1px solid #e1e7ea;padding:30px 30px;border-radius: 5px;">
        <p style="font-size: 28px; text-align: center;  font-weight: 600; color: #333;"> ' . esc_attr__( 'You\'ve unlocked new earning opportunities!', 'wp-loyalty-rules' ) . '</p>
        <p style="display: block;text-align: center;padding: 8px 0 10px 0;color: #333;"> ' . esc_attr__( 'Check out now! ', 'wp-loyalty-rules' ) . '<a href="{wlr_customer_reward_page_link}" target="_blank" style="color: #3439a2;font-weight: 600;text-align: center;">{wlr_customer_reward_page_link}</a></p>
        <p style="display: block;text-align: center;padding: 8px 0 10px 0;color: #333;">' . esc_attr__( 'Refer your friends and earn more rewards.', 'wp-loyalty-rules' ) . '</p>
        <p style="text-align: center;font-weight: 600;font-size: 15px;color: #333;text-transform: uppercase;padding: 10px 0px;">' . esc_attr__( 'Your Referral Link', 'wp-loyalty-rules' ) . '</p>
        <p style="text-align: center;"><a href="{wlr_referral_url}" target="_blank" style="color: #3439a2;font-weight: 600;text-align: center;font-size: 18px;">{wlr_referral_url}</a></p>
    </div>
</div>';
	}

	public function get_content_html() {
		return $this->format_string( wc_get_template_html( $this->template_html, [
			'lang'               => $this->lang,
			'level'              => $this->object,
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
			'level'              => $this->object,
			'email_heading'      => $this->get_heading(),
			'additional_content' => $this->get_additional_content(),
			'sent_to_admin'      => false,
			'plain_text'         => true,
			'email'              => $this
		], 'wployalty', $this->template_base ) );
	}
}