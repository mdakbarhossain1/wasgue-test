<?php

namespace Wlr\App\Premium\Helpers;
defined( 'ABSPATH' ) || exit;

class License {
	/**
	 * License data.
	 *
	 * @var array
	 */
	private static $data;

	/**
	 * Remote API base url.
	 *
	 * @var string
	 */
	private static $remote_url = 'https://wployalty.net/wp-json/products/v1';

	/**
	 * Plugin details.
	 *
	 * @var string[]
	 */
	private static $plugin = [
		'name'                => WLR_PLUGIN_NAME,
		'file'                => WLR_PLUGIN_FILE,
		'version'             => WLR_PLUGIN_VERSION,
		'slug'                => 'wp-loyalty-rules',
		'prefix'              => WLR_PLUGIN_PREFIX,
		'url'                 => 'https://wployalty.net',
		'home_url'            => 'https://wployalty.net',
		'account_url'         => 'https://wployalty.net/my-account/api-keys',
		'icon_url'            => 'https://plugins.svn.wordpress.org/wployalty/assets/icon-128x128.gif',
		//'icon_url'            => 'https://static.flycart.net/wployalty/logo.png',
		'settings_url'        => 'admin.php?page=' . WLR_PLUGIN_SLUG . '&tab=settings#/settings?sub_tab=license',
		'update_check_period' => 12, // hours
	];

	/**
	 * Init hooks.
	 */
	public static function init() {
		if ( ! is_admin() ) {
			return;
		}

		global $pagenow;
		$plugin_basename = plugin_basename( self::$plugin['file'] );
		add_filter( 'puc_request_info_result-' . self::$plugin['slug'], [ __CLASS__, 'modifyPluginInfo' ], 10, 2 );
		add_filter( 'in_plugin_update_message-' . $plugin_basename, [ __CLASS__, 'showExpiredLicenseMessage' ], 10, 2 );

		if ( ! empty( $pagenow ) && in_array( $pagenow, [ 'plugins.php', 'plugins-network.php' ] ) ) {
			add_action( 'admin_notices', [ __CLASS__, 'showEnterLicenseKeyNotice' ] );
		}
		$license_key = self::getLicenseKey();
		if ( ! empty( $license_key ) ) {
			self::runUpdater();
		}
	}

	/**
	 * To perform license activation.
	 */
	public static function activate( $key ) {
		$result   = [ 'status' => 'failed' ];
		$response = self::apiRequest( 'license/activate', [ 'key' => $key ] );

		if ( empty( $response ) ) {
			$result['error'] = esc_html__( "Unable to connect server. Try again later!", 'wp-loyalty-rules' );

			return $result;
		}

		if ( ! empty( $response['status'] ) && in_array( $response['status'], [ 'active', 'activated' ] ) ) {
			self::updateData( [
				'key'     => $key,
				'status'  => 'active',
				'expires' => ! empty( $response['expires'] ) ? $response['expires'] : '',
			] );
		} else {
			update_option( self::$plugin['prefix'] . 'license', [] );
			self::$data = null;
			self::updateData( [ 'key' => $key ] );
		}


		return $response;
	}

	/**
	 * To perform license deactivation.
	 */
	public static function deactivate() {
		$result = [ 'status' => 'failed' ];
		if ( empty( self::getLicenseKey() ) ) {
			return $result;
		}
		$response = self::apiRequest( 'license/deactivate' );
		if ( empty( $response ) ) {
			$result['error'] = esc_html__( "Unable to connect server. Try again later!", 'wp-loyalty-rules' );

			return $result;
		}

		if ( ! empty( $response['status'] ) && in_array( $response['status'], [ 'inactive', 'deactivated' ] ) ) {
			self::deleteData();
		}

		return $response;
	}

	/**
	 * To perform license check.
	 */
	public static function checkStatus( $key ) {
		$result   = [ 'status' => 'failed' ];
		$response = self::apiRequest( 'license/status', [ 'key' => $key ] );
		if ( empty( $response ) ) {
			$result['error'] = esc_html__( "Unable to connect server. Try again later!", 'wp-loyalty-rules' );

			return $result;
		}

		return $response;
	}

	/**
	 * To get license data.
	 */
	private static function getData( $key = '', $default = false ) {
		if ( ! isset( self::$data ) ) {
			self::$data = get_option( self::$plugin['prefix'] . 'license', [] );
		}

		return $key == '' ? self::$data : ( self::$data[ $key ] ?? $default );
	}

	/**
	 * Get the license key.
	 *
	 * @return string
	 */
	public static function getLicenseKey() {
		return self::getData( 'key', '' );
	}

	/**
	 * Get license key status
	 *
	 * @return string
	 */
	public static function getLicenseStatus( $format = false ) {
		$status = self::getData( 'status', 'inactive' );
		if ( $status === 'valid' ) {
			$status = 'active';
		}
		if ( ! $format ) {
			return $status;
		}

		switch ( $status ) {
			case 'active':
				return __( 'Active', 'wp-loyalty-rules' );
			case 'inactive':
				return __( 'Inactive', 'wp-loyalty-rules' );
			case 'expired':
				return __( 'Expired', 'wp-loyalty-rules' );
		}

		return '';
	}

	/**
	 * Get license URL.
	 */
	public static function getAccountUrl() {
		return self::$plugin['account_url'] ?? '';
	}

	/**
	 * Update license data.
	 */
	private static function updateData( $data ) {
		update_option( self::$plugin['prefix'] . 'license', array_merge( self::getData(), $data ) );
		self::$data = null;
	}

	/**
	 * Delete license data.
	 */
	private static function deleteData() {
		$key = self::getLicenseKey();
		update_option( self::$plugin['prefix'] . 'license', [ 'key' => $key ] );
		self::$data = null;
	}

	/**
	 * To run the updater.
	 */
	private static function runUpdater() {
		$update_url = self::getApiUrl( 'update' );
		if ( class_exists( '\YahnisElsts\PluginUpdateChecker\v5\PucFactory' ) ) {
			\YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker( $update_url, self::$plugin['file'], self::$plugin['slug'], self::$plugin['update_check_period'] );
		} /*elseif ( ! empty( self::getLicenseKey() ) && class_exists( 'Puc_v4_Factory' ) ) {
			\Puc_v4_Factory::buildUpdateChecker( $update_url, self::$plugin['file'], self::$plugin['slug'], self::$plugin['update_check_period'] );
		}*/
	}

	/**
	 * To prepare API request url.
	 */
	private static function getApiUrl( $endpoint, $params = [] ) {
		$license_key = self::getLicenseKey();
		if ( $endpoint == 'update' && self::getLicenseStatus() !== 'active' ) {
			$license_key = '';
		}
		$default_params = [
			'key'     => $license_key,
			'slug'    => self::$plugin['slug'],
			'version' => self::$plugin['version'],
		];

		return self::$remote_url . '/' . $endpoint . '?' . http_build_query( array_merge( $default_params, $params ) );
	}

	/**
	 * Make API request.
	 */
	private static function apiRequest( $endpoint, $params = [] ) {
		$response = wp_remote_get( self::getApiUrl( $endpoint, $params ) );
		if ( ! empty( $response ) && ! is_wp_error( $response ) && wp_remote_retrieve_response_code( $response ) == 200 ) {
			return json_decode( wp_remote_retrieve_body( $response ), true );
		}

		return false;
	}

	/**
	 * Allow to modify plugin info if needed.
	 */
	public static function modifyPluginInfo( $plugin_info, $result ) {
		if ( ! empty( $plugin_info ) && is_object( $plugin_info ) && empty( $plugin_info->icons ) ) {
			$plugin_info->icons['default'] = self::$plugin['icon_url'];
		}

		return $plugin_info;
	}

	/**
	 * Message on plugin page when license is expired
	 *
	 * @param $plugin_data
	 * @param $response
	 *
	 * @return mixed
	 */
	public static function showExpiredLicenseMessage( $plugin_data, $response ) {
		if ( ! empty( $response ) && empty( $response->package ) ) {
			$renewal_url  = self::$plugin['url'];
			$settings_url = admin_url( self::$plugin['settings_url'] );
			if ( filter_var( $response->upgrade_notice, FILTER_VALIDATE_URL ) !== false ) {
				$renewal_url = $response->upgrade_notice;
			}
			if ( empty( self::getLicenseKey() ) ) {
				$upgrade_url = '<a href="' . $settings_url . '">' . esc_html__( 'enter license key', 'wp-loyalty-rules' ) . '</a>';
			} else {
				$upgrade_url = '<a target="_blank" href="' . $renewal_url . '">' . esc_html__( 'renew your license', 'wp-loyalty-rules' ) . '</a>';
			}
			// translators: 1. %s will replace upgrade url
			echo '<br>' . sprintf( esc_html__( 'Please %s to receive automatic updates or you can manually update the plugin by downloading it.', 'wp-loyalty-rules' ), esc_url( $upgrade_url ) );
		}

		return $plugin_data;
	}

	/**
	 * To display waring message in plugin page while there is no licence key.
	 */
	public static function showEnterLicenseKeyNotice() {
		if ( empty( self::getLicenseKey() ) || self::getLicenseStatus() != 'active' ) {
			$html_prefix = '<div class="notice notice-warning">';
			$message     = '<p><strong>' . self::$plugin['name'] . ' - </strong>';
			$message     .= __( "Make sure to activate your license to receive updates, support and security fixes!", 'wp-loyalty-rules' ) . '</p>';
			$message     .= '<p>';
			$message     .= '<a href="' . admin_url( self::$plugin['settings_url'] ) . '" class="button-secondary">';
			$message     .= ( empty( self::getLicenseKey() ) ? __( "Enter license key", 'wp-loyalty-rules' ) : __( "Activate license", 'wp-loyalty-rules' ) ) . '</a>';
			$message     .= '<a href="' . self::getAccountUrl() . '" target="_blank" class="button-primary" style="margin-left: 12px;">';
			$message     .= __( "Get License", 'wp-loyalty-rules' ) . '</a>';
			$message     .= '</p>';
			$html_suffix = '</div>';
			echo wp_kses_post( $html_prefix . $message . $html_suffix );
		}
	}
}