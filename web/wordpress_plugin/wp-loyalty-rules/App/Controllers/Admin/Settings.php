<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Controllers\Admin;
defined( 'ABSPATH' ) or die;

use Wlr\App\Helpers\Base;
use Wlr\App\Helpers\CompatibleCheck;
use Wlr\App\Helpers\Input;
use Wlr\App\Helpers\Util;
use Wlr\App\Helpers\Validation;
use Wlr\App\Helpers\Woocommerce;

class Settings {
	/**
	 * Get settings.
	 *
	 * @return void
	 */
	public static function gets() {
		if ( ! Util::isBasicSecurityValid( 'wlr_setting_nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$setting_data = \Wlr\App\Helpers\Settings::getSettings();
		if ( ! is_array( $setting_data ) ) {
			$setting_data = [];
		}
		$data                          = [
			'success' => true,
			'data'    => apply_filters( 'wlr_get_setting_data', $setting_data ),
		];
		$data['data']['email_content'] = [];
		\WC_Emails::instance();
		$data = apply_filters( 'wlr_notify_email_content_data', $data );
		wp_send_json( $data );
	}

	/**
	 * Save settings.
	 *
	 * @return void
	 */
	public static function save() {
		$input      = new Input();
		$option_key = (string) $input->post_get( 'option_key', '' );
		$option_key = Validation::validateInputAlpha( $option_key );
		if ( empty( $option_key ) || ! Util::isBasicSecurityValid( 'wlr_setting_nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}

		$data        = $input->post();
		$is_valid    = apply_filters( 'wlr_is_license_valid', true, $data );
		$unset_array = [ 'option_key', 'action', 'wlr_nonce', 'license_key' ];
		foreach ( $unset_array as $unset_key ) {
			if ( isset( $data[ $unset_key ] ) ) {
				unset( $data[ $unset_key ] );
			}
		}

		$data          = apply_filters( 'wlr_before_save_settings', $data, $option_key );
		$validate_data = Validation::validateSettingsTab( $data );
		if ( is_array( $validate_data ) ) {
			foreach ( $validate_data as $field => $messages ) {
				$validate_data[ $field ] = explode( ',', str_replace( 'Wlr', '', implode( ',', $messages ) ) );
			}
			wp_send_json_error( [
				'field_error' => $validate_data,
				'message'     => __( 'Settings not saved!', 'wp-loyalty-rules' )
			] );
		}
		foreach ( $data as $d_key => $d_value ) {
			if ( in_array( $d_key, [
				'wlr_cart_earn_points_message',
				'wlr_checkout_earn_points_message',
				'wlr_cart_redeem_points_message',
				'wlr_checkout_redeem_points_message',
				'wlr_thank_you_message',
				'wlr_earn_point_order_summary_text',
				'wlr_point_label',
				'wlr_point_singular_label',
				'reward_plural_label',
				'reward_singular_label'
			] ) ) {
				$d_value        = stripslashes( $d_value );
				$data[ $d_key ] = Woocommerce::getCleanHtml( $d_value );
			}
		}
		$response = [];
		if ( isset( $data['generate_api_key'] ) && $data['generate_api_key'] == 1 ) {
			$consumer_key              = 'ck_' . wc_rand_hash();
			$consumer_secret           = 'cs_' . wc_rand_hash();
			$data['wlr_client_id']     = $consumer_key;
			$data['wlr_client_secret'] = $consumer_secret;
			$response['redirect']      = admin_url( 'admin.php?' . http_build_query( [
					'page' => WLR_PLUGIN_SLUG,
					'view' => 'settings'
				] ) );
		}
		update_option( $option_key, $data, true );
		do_action( 'wlr_after_save_settings', $data, $option_key );
		$response['success'] = true;
		$response['message'] = esc_html__( 'Settings saved successfully!', 'wp-loyalty-rules' );
		if ( ! $is_valid ) {
			$response['success']                            = false;
			$response['data']['field_error']['license_key'] = [ __( 'License key invalid', 'wp-loyalty-rules' ) ];
			//$response['data']['message'] = __('License key invalid', 'wp-loyalty-rules');
		}
		wp_send_json( $response );
	}

	/**
	 * Create block page.
	 *
	 * @return void
	 */
	public static function createBlockPage() {
		if ( ! Util::isBasicSecurityValid( 'wlr_common_user_nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		try {
			$post_information = [
				'post_title'   => 'Loyalty Reward Page',
				'post_content' => '<!-- wp:shortcode -->
[wlr_page_content]
<!-- /wp:shortcode -->',
				'post_type'    => 'page',
				'post_status'  => 'pending'
			];
			$post_id          = wp_insert_post( $post_information );
			if ( ! empty( $post_id ) ) {
				wp_send_json_success( [
					'post_id' => $post_id,
					'message' => __( 'Page created successfully', 'wp-loyalty-rules' )
				] );
			}
			wp_send_json_error( [ 'message' => __( 'Page creation has failed', 'wp-loyalty-rules' ) ] );
		} catch ( \Exception $e ) {
		}
		wp_send_json_error( [ 'message' => __( 'Page creation has failed', 'wp-loyalty-rules' ) ] );
	}

	/*End Settings*/

	public static function updateEmailTemplate() {
		if ( ! Util::isBasicSecurityValid( 'wlr_setting_nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$input         = new Input();
		$email_type    = (string) $input->post( 'email_type', '' );
		$email_type    = Validation::validateInputAlpha( $email_type );
		$template_body = (string) $input->post( 'template_body', '', false );

		if ( empty( $email_type ) || empty( $template_body ) || ! Settings::isValidEmailType( $email_type ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$status = apply_filters( 'wlr_save_email_template', false, $template_body, $email_type );
		if ( $status ) {
			wp_send_json_success( [ 'message' => __( 'Email template updated successfully.', 'wp-loyalty-rules' ) ] );
		}
		wp_send_json_error( [ 'message' => __( 'Email template update failed.', 'wp-loyalty-rules' ) ] );
	}

	/**
	 * Reset email template.
	 *
	 * @return void
	 */
	public static function resetEmailTemplate() {
		if ( ! Util::isBasicSecurityValid( 'wlr_setting_nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$input      = new Input();
		$email_type = (string) $input->post( 'email_type', '' );
		$email_type = Validation::validateInputAlpha( $email_type );
		if ( empty( $email_type ) || ! Settings::isValidEmailType( $email_type ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$status = apply_filters( 'wlr_reset_email_template', false, $email_type );
		if ( $status ) {
			wp_send_json_success( [ 'message' => __( 'Email template reset successfully.', 'wp-loyalty-rules' ) ] );
		}
		wp_send_json_error( [ 'message' => __( 'Email template reset failed.', 'wp-loyalty-rules' ) ] );
	}

	/**
	 * Check if a given email type is valid.
	 *
	 * @param string $email_type The email type to check.
	 *
	 * @return bool True if the email type is valid, false otherwise.
	 */
	public static function isValidEmailType( $email_type ) {
		if ( empty( $email_type ) || ! is_string( $email_type ) ) {
			return false;
		}
		$email_types = apply_filters( 'wlr_is_valid_email_types', [
			'earn_point_email',
			'earn_reward_email',
			'expire_email',
			'expire_point_email',
			'birthday_email',
			'new_level_email'
		] );

		return in_array( $email_type, $email_types );
	}

	/**
	 * Check if there are any notifications available.
	 *
	 * @return void
	 */
	public static function isAnyNotifications() {
		if ( ! Util::isBasicSecurityValid( 'wlr_common_user_nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$data            = [];
		$data['success'] = true;
		$data['data']    = [];
		$check           = new CompatibleCheck();
		$content         = $check->getCompatibleContent();
		if ( ! empty( $content ) ) {
			$data['data']['title']   = __( 'Plugin Compatible', "wp-loyalty-rules" );
			$data['data']['content'] = $content;
		}
		$data = apply_filters( 'wlr_is_any_dynamic_notification', $data );
		wp_send_json( $data );
	}
}