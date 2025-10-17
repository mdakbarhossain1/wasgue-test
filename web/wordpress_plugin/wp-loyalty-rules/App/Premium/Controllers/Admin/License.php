<?php

namespace Wlr\App\Premium\Controllers\Admin;

use Wlr\App\Helpers\Input;
use Wlr\App\Helpers\Woocommerce;
use Wlr\App\Premium\Helpers\License as LicenseHelper;

defined( 'ABSPATH' ) or die;

class License {

	public static function activate() {
		$input     = new Input();
		$wlr_nonce = $input->post_get( 'wlr_nonce', '' );
		if ( ! Woocommerce::hasAdminPrivilege() || ! Woocommerce::verify_nonce( $wlr_nonce, 'wlr_common_user_nonce' ) ) {
			wp_send_json_error( [
				'status'  => 'inactive',
				'message' => __( 'Basic check failed', 'wp-loyalty-rules' )
			] );
		}

		$license_key = $input->post_get( 'license_key', '' );
		if ( empty( $license_key ) ) {
			wp_send_json_error( [
				'status'  => 'inactive',
				'message' => __( 'License key is required.', 'wp-loyalty-rules' )
			] );
		}

		$response = LicenseHelper::activate( $license_key );
		if ( empty( $response ) || $response['status'] == 'failed' ) {
			wp_send_json_error( [
				'status'  => 'inactive',
				'message' => ! empty( $response['error'] ) ? $response['error'] : __( 'License activation failed', 'wp-loyalty-rules' )
			] );
		}

		$license_status      = LicenseHelper::getLicenseStatus();
		$data                = get_option( 'wlr_settings', [] );
		$data['license_key'] = $license_key;
		update_option( 'wlr_settings', $data, true );
		if ( $license_status == 'active' ) {
			wp_send_json_success( [
				'status'  => 'active',
				'message' => esc_html__( 'License activated. Thank you!', 'wp-loyalty-rules' )
			] );
		}
		if ( $license_status == 'expired' ) {
			wp_send_json_success( [
				'status'  => 'inactive',
				'message' => esc_html__( 'License is expired.', 'wp-loyalty-rules' )
			] );
		}
		wp_send_json_error( [
			'status'  => 'inactive',
			'message' => esc_html__( 'Invalid license key.', 'wp-loyalty-rules' )
		] );
	}

	public static function deActivate() {
		$input     = new Input();
		$wlr_nonce = $input->post_get( 'wlr_nonce', '' );
		if ( ! Woocommerce::hasAdminPrivilege() || ! Woocommerce::verify_nonce( $wlr_nonce, 'wlr_common_user_nonce' ) ) {
			wp_send_json_error( [
				'status'  => 'inactive',
				'message' => __( 'Basic check failed', 'wp-loyalty-rules' )
			] );
		}

		$response = LicenseHelper::deactivate();
		if ( empty( $response ) || $response['status'] == 'failed' ) {
			wp_send_json_error( [
				'status'  => 'inactive',
				'message' => ! empty( $response['error'] ) ? $response['error'] : __( 'License deactivation failed', 'wp-loyalty-rules' )
			] );
		}
		$license_status = LicenseHelper::getLicenseStatus();
		if ( $license_status == 'inactive' ) {
			wp_send_json_success( [
				'status'  => 'inactive',
				'message' => esc_html__( 'License deactivated.', 'wp-loyalty-rules' )
			] );
		}
		wp_send_json_success( [
			'status'  => 'inactive',
			'message' => esc_html__( 'License deactivated successfully.', 'wp-loyalty-rules' )
		] );
	}

	public static function checkStatus() {
		$input     = new Input();
		$wlr_nonce = $input->post_get( 'wlr_nonce', '' );
		if ( ! Woocommerce::hasAdminPrivilege() || ! Woocommerce::verify_nonce( $wlr_nonce, 'wlr_common_user_nonce' ) ) {
			wp_send_json_error( [
				'status'  => 'inactive',
				'message' => __( 'Basic check failed', 'wp-loyalty-rules' )
			] );
		}

		$license_key = $input->post_get( 'license_key', '' );
		if ( empty( $license_key ) ) {
			wp_send_json_error( [
				'status'  => 'inactive',
				'message' => __( 'License key is required.', 'wp-loyalty-rules' )
			] );
		}

		$response = LicenseHelper::checkStatus( $license_key );
		if ( empty( $response ) || $response['status'] == 'failed' ) {
			wp_send_json_error( [
				'status'  => 'inactive',
				'message' => ! empty( $response['error'] ) ? $response['error'] : __( 'License status check failed', 'wp-loyalty-rules' )
			] );
		}

		if ( $response['status'] == 'active' ) {
			wp_send_json_success( [
				'status'  => 'active',
				'message' => esc_html__( 'License is active.', 'wp-loyalty-rules' )
			] );
		} elseif ( $response['status'] == 'expired' ) {
			wp_send_json_success( [
				'status'  => 'inactive',
				'message' => esc_html__( 'License is expired.', 'wp-loyalty-rules' )
			] );
		} elseif ( $response['status'] == 'inactive' ) {
			wp_send_json_success( [
				'status'  => 'inactive',
				'message' => esc_html__( 'License is inactive.', 'wp-loyalty-rules' )
			] );
		}

		wp_send_json_error( [
			'status'  => 'inactive',
			'message' => esc_html__( 'License is inactive.', 'wp-loyalty-rules' )
		] );
	}

	public static function getLicenseStatus( array $data ) {
		$data['license_status'] = LicenseHelper::getLicenseStatus();
		$data['license_key']    = LicenseHelper::getLicenseKey();

		return $data;
	}

	public static function getLicenseCheckStatus( $data ) {
		$input       = new Input();
		$license_key = $input->get( 'license_key', '' );
		if ( ! empty( $license_key ) && $license_key != LicenseHelper::getLicenseKey() ) {
			LicenseHelper::activate( $license_key );
		}

		$data['license_key'] = $license_key;

		return $data;
	}

	public static function showHeaderNotice() {
		$input = new Input();
		$page  = $input->get( 'page', '' );

		if ( ! isset( $page ) || $page !== WLR_PLUGIN_SLUG ) {
			return;
		}

		if ( LicenseHelper::getLicenseStatus() != 'active' || empty( LicenseHelper::getLicenseKey() ) ) {
			$html = '<div id="wlr-admin-notice" class="wlr-admin-notice-top-of-page wlr-promo-notice wlr-pro-inactive">';
			$html .= __( 'Make sure to activate your license to receive updates, support and security fixes!', 'wp-loyalty-rules' );
			$html .= ' <a id="activate-license-btn" href="' . admin_url( 'admin.php?page=' . WLR_PLUGIN_SLUG . '#/settings?sub_tab=license' ) . '">' . __( 'Enter license key', 'wp-loyalty-rules' ) . '</a>';
			$html .= '</div><style>.wlr-admin-notice-top-of-page{
text-align: center;
    padding: 10px 46px 10px 22px;
    font-size: 15px;
    line-height: 1.4;
    color: #fff;
    margin-left: -20px;
}
.wlr-admin-notice-top-of-page a {
 color: #fff;
    text-decoration: underline;
}
.wlr-pro-inactive {
background: #d63638;
}
</style>';
			echo wp_kses_post( $html );
		}
	}
}