<?php

namespace Wlr\App\Emails;

use Wlr\App\Emails\Traits\Common;
use Wlr\App\Helpers\Rewards;
use Wlr\App\Helpers\Woocommerce;
use Wlr\App\Models\EarnCampaign;

defined( "ABSPATH" ) or die();
require_once plugin_dir_path( WC_PLUGIN_FILE ) . 'includes/emails/class-wc-email.php';

class WlrEarnPointEmail extends \WC_Email {
	public $order = false;
	public $lang;
	use Common;

	public function __construct() {
		$this->id             = 'wlr_earn_point_email';
		$this->customer_email = true;

		$this->title          = __( 'Points earned', 'wp-loyalty-rules' );
		$this->template_html  = 'emails/wlr-earn-point.php';
		$this->template_plain = 'emails/plain/wlr-earn-point.php';
		$this->template_base  = WLR_PLUGIN_PATH . 'templates/';
		$this->placeholders   = apply_filters( $this->id . '_short_codes_list', [
			'{wlr_campaign_name}'             => 'Purchase',
			'{wlr_points_label}'              => 'points',
			'{wlr_action_name}'               => 'Point for Purchase',
			'{wlr_earn_point}'                => 0,
			'{wlr_referral_url}'              => 'https://example.com/?ref_code=1234',
			'{wlr_user_point}'                => 0,
			'{wlr_total_earned_point}'        => 0,
			'{wlr_used_point}'                => 0,
			'{wlr_user_name}'                 => 'Alex',
			'{wlr_order_id}'                  => '1234',
			'{wlr_store_name}'                => 'example',
			'{wlr_customer_reward_page_link}' => 'https://example.com',
			'{wlr_earn_point_mail_content}'   => ''
		] );

		add_action( 'wlr_notify_after_add_earn_point', [ $this, 'trigger' ], 10, 4 );
		parent::__construct();
		$this->description = __( 'This email is sent to the customer when they earn points', 'wp-loyalty-rules' );
	}

	public function get_default_subject() {
		return __( 'You have earned points.', 'wp-loyalty-rules' );
	}

	public function get_default_heading() {
		return __( 'You have earned points', 'wp-loyalty-rules' );
	}

	public function trigger( $email, $point, $action_type, $data ) {
		$reward_helper = Rewards::getInstance();
		if ( empty( $email ) || ! $reward_helper->is_valid_action( $action_type ) || ! $this->isEligibleForSentEmail( $action_type, $data ) ) {
			return;
		}

		$loyal_user = $this->getLoyaltyUser( $email );
		if ( ! is_object( $loyal_user ) ) {
			return;
		}
		$is_send_email  = isset( $loyal_user->is_allow_send_email ) && $loyal_user->is_allow_send_email > 0;
		$is_banned_user = isset( $loyal_user->is_banned_user ) && $loyal_user->is_banned_user > 0;

		if ( ! $is_send_email || $is_banned_user || ! apply_filters( 'wlr_before_send_email', true,
				[
					'email_type'  => $this->id,
					'point'       => $point,
					'action_type' => $action_type,
					'data'        => $data
				] ) ) {
			return;
		}
		$woocommerce_helper = Woocommerce::getInstance();
		$this->lang         = get_locale();
		if ( ! empty( $data['order_id'] ) ) {
			$this->order = wc_get_order( $data['order_id'] );
			$this->lang  = $woocommerce_helper->getOrderLanguage( $data['order_id'] );
		}
		$this->setLocale( $this->lang );

		$this->recipient = $email;

		$ref_code = ! empty( $loyal_user->refer_code ) ? $loyal_user->refer_code : '';

		$campaign_name = '';
		if ( ! empty( $data['campaign_id'] ) ) {
			$campaign_model = new EarnCampaign();
			$campaign       = $campaign_model->getByKey( $data['campaign_id'] );
			$this->object   = $campaign;
			// phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText
			$campaign_name = ! empty( $campaign ) && ! empty( $campaign->nme ) ? __( $campaign->name, 'wp-loyalty-rules' ) : '';
		}


		$this->placeholders['{wlr_campaign_name}']             = $campaign_name;
		$this->placeholders['{wlr_points_label}']              = $reward_helper->getPointLabel( $point );
		$this->placeholders['{wlr_action_name}']               = $reward_helper->getActionName( $action_type );
		$this->placeholders['{wlr_earn_point}']                = $point;
		$this->placeholders['{wlr_referral_url}']              = $ref_code ? $reward_helper->getReferralUrl( $ref_code ) : '';
		$this->placeholders['{wlr_user_point}']                = $loyal_user->points ?? 0;
		$this->placeholders['{wlr_total_earned_point}']        = $loyal_user->earn_total_point ?? 0;
		$this->placeholders['{wlr_used_point}']                = $loyal_user->used_total_points ?? 0;
		$this->placeholders['{wlr_user_name}']                 = $this->getUserDisplayName( $email );
		$this->placeholders['{wlr_order_id}']                  = $data['order_id'] ?? '';
		$this->placeholders['{wlr_store_name}']                = apply_filters( 'wlr_before_display_store_name', get_option( 'blogname' ) );
		$this->placeholders['{wlr_customer_reward_page_link}'] = get_permalink( get_option( 'woocommerce_myaccount_page_id' ) );
		$this->placeholders                                    = apply_filters( 'wlr_earn_point_email_short_codes', $this->placeholders, $email, $point, $action_type, $data );

		$content      = stripslashes( get_option( 'wlr_earn_point_email_template' ) );
		$content_html = empty( $content ) ? $this->defaultContent() : $content;
		foreach ( $this->placeholders as $short_code => $short_code_value ) {
			$content_html = str_replace( $short_code, $short_code_value, $content_html );
		}
		$this->placeholders['{wlr_earn_point_mail_content}'] = $content_html;

		if ( $this->is_enabled() && $this->get_recipient() ) {
			$created_at  = strtotime( gmdate( "Y-m-d H:i:s" ) );
			$log_data    = [
				'user_email'          => sanitize_email( $email ),
				'action_type'         => $action_type,
				'earn_campaign_id'    => 0,
				'campaign_id'         => ! empty( $data['campaign_id'] ) ? $data['campaign_id'] : 0,
				'order_id'            => ! empty( $data['order_id'] ) ? $data['order_id'] : 0,
				'product_id'          => ! empty( $data['product_id'] ) ? $data['product_id'] : 0,
				'admin_id'            => ! empty( $data['admin_id'] ) ? $data['admin_id'] : 0,
				'created_at'          => $created_at,
				'modified_at'         => 0,
				'points'              => (int) $point,
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
			$point_label = $reward_helper->getPointLabel( $point );
			// translators: 1: label 2: campaign name
			$log_data['note'] = sprintf( __( 'Sending earned %1$s email failed(%2$s)', 'wp-loyalty-rules' ), $point_label, $campaign_name );
			// translators: 1: label 2: email 3: campaign name
			$log_data['customer_note'] = sprintf( __( 'Sending earned %1$s email failed to %2$s for %3$s campaign', 'wp-loyalty-rules' ), $point_label, $email, $campaign_name );
			if ( $this->send( $this->get_recipient(), $this->get_subject(), $this->get_content(), $this->get_headers(), $this->get_attachments() ) ) {
				// translators: 1: label 2: campaign name
				$log_data['note'] = sprintf( __( 'Earned %1$s email sent to customer successfully(%2$s)', 'wp-loyalty-rules' ), $point_label, $campaign_name );
				// translators: 1: label 2: email 3: campaign name
				$log_data['customer_note'] = sprintf( __( 'Earned %1$s email sent to %2$s for %3$s campaign', 'wp-loyalty-rules' ), $point_label, $email, $campaign_name );
			}
			$reward_helper->add_note( $log_data );
		}

		$this->restore_locale();
	}

	function defaultContent() {
		return '<div style="cursor:auto;font-family: Arial;font-size:16px;line-height:24px;text-align:left;">
    <h3 style="display: block;margin: 0 0 40px 0; color: #333;">' . esc_attr__( 'You have earned {wlr_earn_point} points!', 'wp-loyalty-rules' ) . '</h3>
    <div style="display: block;margin: 0 0 24px 0;border: 1px solid #e1e7ea;padding:30px 30px;border-radius: 5px;">
        <p style="font-size: 28px; text-align: center;  font-weight: 600; color: #333;"> ' . esc_attr__( 'Nice work! You have earned {wlr_earn_point} points!.', 'wp-loyalty-rules' ) . '</p>
        <p style="display: block;text-align: center;padding: 8px 0 10px 0;color: #333;">' . esc_attr__( 'Refer your friends and earn more points.', 'wp-loyalty-rules' ) . '</p>
        <p style="text-align: center;font-weight: 600;font-size: 15px;color: #333;text-transform: uppercase;padding: 10px 0px;">' . esc_attr__( 'Your Referral Link', 'wp-loyalty-rules' ) . '</p>
        <p style="text-align: center;"><a href="{wlr_referral_url}" target="_blank" style="color: #3439a2;font-weight: 600;text-align: center;font-size: 18px;">{wlr_referral_url}</a></p>
    </div>
</div>';
	}

	public function get_content_html() {
		return $this->format_string( wc_get_template_html( $this->template_html, [
			'lang'               => $this->lang,
			'campaign'           => $this->object,
			'order'              => $this->order,
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
			'campaign'           => $this->object,
			'order'              => $this->order,
			'email_heading'      => $this->get_heading(),
			'additional_content' => $this->get_additional_content(),
			'sent_to_admin'      => false,
			'plain_text'         => true,
			'email'              => $this
		], 'wployalty', $this->template_base ) );
	}
}