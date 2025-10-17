<?php

namespace Wlr\App\Emails;

use Wlpe\App\Model\ExpirePoints;
use Wlr\App\Emails\Traits\Common;
use Wlr\App\Helpers\Rewards;
use Wlr\App\Helpers\Woocommerce;
use Wlr\App\Models\EarnCampaign;

defined( "ABSPATH" ) or die();
require_once plugin_dir_path( WC_PLUGIN_FILE ) . 'includes/emails/class-wc-email.php';

class WlrPointExpireEmail extends \WC_Email {
	public $lang;
	use Common;

	public function __construct() {
		$this->id             = 'wlr_point_expire_email';
		$this->customer_email = true;

		$this->title          = __( 'Point expiry notification', 'wp-loyalty-rules' );
		$this->template_html  = 'emails/wlr-point-expire-email.php';
		$this->template_plain = 'emails/plain/wlr-point-expire-email.php';
		$this->template_base  = WLR_PLUGIN_PATH . 'templates/';
		$this->placeholders   = apply_filters( $this->id . '_short_codes_list', [
			'{wlr_expiry_points}' => '20',
			'{wlr_points_label}'  => 'points',
			'{wlr_shop_url}'      => 'https://example.com',
			'{wlr_expiry_date}'   => gmdate( 'Y-m-d' ),

			'{wlr_referral_url}'              => 'https://example.com/?ref_code=1234',
			'{wlr_user_point}'                => 0,
			'{wlr_total_earned_point}'        => 0,
			'{wlr_used_point}'                => 0,
			'{wlr_user_name}'                 => 'Alex',
			'{wlr_store_name}'                => 'example',
			'{wlr_customer_reward_page_link}' => 'https://example.com',
			'{wlr_point_expiry_content}'      => ''
		] );

		add_action( 'wlr_notify_send_expire_point_email', [ $this, 'trigger' ] );
		parent::__construct();
		$this->description = __( 'This email is sent to the customer when point is going to expire', 'wp-loyalty-rules' );
	}

	public function get_default_subject() {
		return __( 'Your points are about to expire. Redeem now!', 'wp-loyalty-rules' );
	}

	public function get_default_heading() {
		return __( 'Your points are about to expire. Redeem now!', 'wp-loyalty-rules' );
	}

	public function trigger( $user_emails ) {
		if ( ! class_exists( '\Wlpe\App\Model\ExpirePoints' ) || ! is_array( $user_emails ) || empty( $user_emails ) ) {
			return;
		}

		$expire_date_format = get_option( 'date_format', 'Y-m-d' );
		$expire_date_format = apply_filters( 'wlr_expire_mail_date_format', $expire_date_format );
		$expire_point_model = new ExpirePoints();
		foreach ( $user_emails as $email_data ) {
			if ( empty( $email_data->user_email ) || empty( $email_data->expire_date ) ) {
				continue;
			}

			$loyal_user = $this->getLoyaltyUser( $email_data->user_email );
			if ( ! is_object( $loyal_user ) ) {
				continue;
			}

			$is_send_email  = isset( $loyal_user->is_allow_send_email ) && $loyal_user->is_allow_send_email > 0;
			$is_banned_user = isset( $loyal_user->is_banned_user ) && $loyal_user->is_banned_user > 0;

			if ( ! $is_send_email || $is_banned_user || ! apply_filters( 'wlr_before_send_email', true,
					[
						'email_type' => $this->id,
						'email_data' => $email_data
					] ) ) {
				continue;
			}
			$this->setup_locale();
			$this->object       = $email_data;
			$woocommerce_helper = Woocommerce::getInstance();
			$this->lang         = get_locale();
			$ref_code           = ! empty( $loyal_user->refer_code ) ? $loyal_user->refer_code : '';
			$this->recipient    = sanitize_email( $email_data->user_email );
			$reward_helper      = Rewards::getInstance();
			$available_point    = ! empty( $email_data->available_points ) ? $email_data->available_points : 0;
			$point_label        = $reward_helper->getPointLabel( $available_point );

			$this->placeholders['{wlr_expiry_points}'] = $available_point;
			$this->placeholders['{wlr_points_label}']  = $point_label;
			$this->placeholders['{wlr_shop_url}']      = get_permalink( wc_get_page_id( 'shop' ) );
			$this->placeholders['{wlr_expiry_date}']   = $woocommerce_helper->beforeDisplayDate( $email_data->expire_date, $expire_date_format );

			$this->placeholders['{wlr_referral_url}']              = $ref_code ? $reward_helper->getReferralUrl( $ref_code ) : '';
			$this->placeholders['{wlr_user_point}']                = $loyal_user->points ?? 0;
			$this->placeholders['{wlr_total_earned_point}']        = $loyal_user->earn_total_point ?? 0;
			$this->placeholders['{wlr_used_point}']                = $loyal_user->used_total_points ?? 0;
			$this->placeholders['{wlr_user_name}']                 = $this->getUserDisplayName( $email_data->user_email );
			$this->placeholders['{wlr_store_name}']                = apply_filters( 'wlr_before_display_store_name', get_option( 'blogname' ) );
			$this->placeholders['{wlr_customer_reward_page_link}'] = get_permalink( get_option( 'woocommerce_myaccount_page_id' ) );
			$this->placeholders                                    = apply_filters( 'wlr_point_expire_mail_short_codes', $this->placeholders, $email_data );

			$content_html = stripslashes( get_option( 'wlr_expire_point_email_template' ) );
			if ( empty( $content_html ) ) {
				$wlpe_options = (array) get_option( 'wlpe_settings', array() );
				$content_html = ! empty( $wlpe_options['email_template'] ) ? $wlpe_options['email_template'] : $this->defaultContent();
			}
			foreach ( $this->placeholders as $short_code => $short_code_value ) {
				$content_html = str_replace( $short_code, $short_code_value, $content_html );
			}
			$this->placeholders['{wlr_point_expiry_content}'] = $content_html;

			if ( $this->is_enabled() && $this->get_recipient() ) {
				$created_at = strtotime( gmdate( "Y-m-d H:i:s" ) );
				$log_data   = [
					'user_email'          => $email_data->user_email,
					'action_type'         => 'expire_point',
					'earn_campaign_id'    => 0,
					'campaign_id'         => 0,
					'order_id'            => 0,
					'product_id'          => 0,
					'admin_id'            => 0,
					'created_at'          => $created_at,
					'modified_at'         => 0,
					'points'              => (int) $available_point,
					'action_process_type' => 'email_notification',
					'referral_type'       => '',
					'reward_id'           => 0,
					'user_reward_id'      => 0,
					'expire_email_date'   => ! empty( $email_data->expire_email_date ) ? $email_data->expire_email_date : 0,
					'expire_date'         => 0,
					'reward_display_name' => '',
					'required_points'     => 0,
					'discount_code'       => null,
				];
				// translators: 1: label 2: point
				$log_data['note'] = sprintf( __( 'Sending expiry %1$s(%2$s) email failed', 'wp-loyalty-rules' ), $point_label, $available_point );
				// translators: 1: label 2: point
				$log_data['customer_note'] = sprintf( __( 'Sending expiry %1$s(%2$s) email failed', 'wp-loyalty-rules' ), $point_label, $available_point );
				if ( $this->send( $this->get_recipient(), $this->get_subject(), $this->get_content(), $this->get_headers(), $this->get_attachments() ) ) {
					$update_data = [
						'is_expire_email_send' => 1
					];

					foreach ( $email_data->email_status as $id ) {
						$where = [
							'id' => $id
						];
						$expire_point_model->updateRow( $update_data, $where );
					}
					// translators: 1: label 2: point
					$log_data['note'] = sprintf( __( 'Expiry %1$s (%2$s) email sent successfully', 'wp-loyalty-rules' ), $point_label, $available_point );
					// translators: 1: label 2: point
					$log_data['customer_note'] = sprintf( __( 'Expiry %1$s (%2$s) email sent successfully', 'wp-loyalty-rules' ), $point_label, $available_point );
				}
				$reward_helper->add_note( $log_data );
			}
		}
		$this->restore_locale();
	}

	function defaultContent() {
		return '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                            <tbody>
                                            <tr>
                                                <td style="word-wrap: break-word;padding: 0px;" align="left">
                                                    <div style="cursor:auto;font-family: Arial;font-size:16px;line-height:24px;text-align:left;">
                                                        <h3 style="display: block;margin: 0 0 40px 0; color: #333;">' . esc_attr__( '{wlr_expiry_points} {wlr_points_label} are about to expire', 'wp-loyalty-rules' ) . '</h3>
                                                        <p style="display: block;margin: 0 0 40px 0; color: #333;">' . esc_attr__( 'Redeem your hard earned {wlr_points_label} before they expire on {wlr_expiry_date}', 'wp-loyalty-rules' ) . '</p>
                                                        <a href="{wlr_shop_url}" target="_blank"> ' . esc_attr__( 'Shop & Redeem Now', 'wp-loyalty-rules' ) . '</a>
                                                    </div>
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>';
	}

	public function get_content_html() {
		return $this->format_string( wc_get_template_html( $this->template_html, [
			'lang'               => $this->lang,
			'expire_user'        => $this->object,
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
			'expire_user'        => $this->object,
			'email_heading'      => $this->get_heading(),
			'additional_content' => $this->get_additional_content(),
			'sent_to_admin'      => false,
			'plain_text'         => true,
			'email'              => $this
		], 'wployalty', $this->template_base ) );
	}
}