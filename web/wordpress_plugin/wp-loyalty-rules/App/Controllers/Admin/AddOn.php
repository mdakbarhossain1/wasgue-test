<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Controllers\Admin;

use Automattic\WooCommerce\Admin\PluginsHelper;
use Wlr\App\Helpers\EarnCampaign;
use Wlr\App\Helpers\Input;
use Wlr\App\Helpers\Util;
use Wlr\App\Helpers\Validation;

defined( 'ABSPATH' ) or die();

class AddOn {
	/**
	 * Add-ons remote list file.
	 *
	 * @var string
	 */
	private static $remote_url = 'https://static.flycart.net/wployalty/add-ons.json';
	private static $addons_list = [];

	/**
	 * Get add-on list.
	 * @return array
	 */
	protected static function getAddonList() {
		if ( ! empty( self::$addons_list ) ) {
			return self::$addons_list;
		}
		$addons = apply_filters( 'wlr_addon_list', array_merge( self::getInternalAddonsList(), self::getRemoteAddonsList() ) );
		if ( empty( $addons ) ) {
			return [];
		}
		$default_data = [
			'name'         => '',
			'description'  => '',
			'icon_url'     => '',
			'download_url' => '',
			'plugin_file'  => '',
			'document_url' => '',
			'page_url'     => '',
			'requires'     => [
				'wp'       => '',
				'wc'       => '',
				'wlr_core' => '',
				'wlr_pro'  => '',
			],
			'is_pro'       => false,
			'is_external'  => true,
		];

		$active_addons     = (array) get_option( 'wlr_active_addons', [] );
		$available_plugins = array_keys( get_plugins() );
		foreach ( $addons as $slug => $addon ) {
			$addon             = array_merge( $default_data, $addon );
			$addon['page_url'] = self::parseAddonUrl( $addon['page_url'] ?? '', $slug );
			if ( ! empty( $addon['is_external'] ) ) {
				$addon['is_active']    = in_array( $slug, $active_addons ) || Util::isActive( $addon['plugin_file'] );
				$addon['is_installed'] = ! empty( $addon['plugin_file'] ) && in_array( $addon['plugin_file'], $available_plugins );
			} else {
				switch ( $slug ) {
					case 'wp-loyalty-point-expire':
						$is_active = in_array( get_option( 'wlr_expire_point_active', 'no' ), [ 1, 'yes' ] );
						break;
					default:
						$is_active = in_array( $slug, $active_addons );
						break;
				}
				$addon['is_active']    = $is_active;
				$addon['is_installed'] = true;
			}
			$addons[ $slug ] = $addon;
		}

		return self::$addons_list = $addons;
	}

	/**
	 * Get external add-ons.
	 * @return array
	 */
	private static function getRemoteAddonsList(): array {
		$addons = get_transient( 'wlr_remote_addons_list' );
		if ( empty( $addons ) ) {
			$addons   = [];
			$response = wp_remote_get( self::$remote_url );
			if ( ! is_wp_error( $response ) ) {
				$addons = (array) json_decode( wp_remote_retrieve_body( $response ), true );
				set_transient( 'wlr_remote_addons_list', $addons, 24 * 60 * 60 );
			}
		}

		return $addons;
	}

	/**
	 * Parse addon url.
	 *
	 * @param string $url Default url.
	 * @param string $slug add-on slug.
	 *
	 * @return string
	 */
	private static function parseAddonUrl( string $url, string $slug ): string {
		$addon_page = admin_url( 'admin.php?page=' . $slug );

		return str_replace( '{addon_page}', $addon_page, $url );
	}

	/**
	 * Get internal add-ons.
	 * @return array
	 */
	private static function getInternalAddonsList(): array {
		$add_ons['wll-loyalty-launcher']    = [
			'name'         => esc_html__( 'WPLoyalty - Launcher', 'wp-loyalty-rules' ),
			'description'  => __( 'Launcher widget for WPLoyalty. Let your customers easily discover your loyalty rewards.', 'wp-loyalty-rules' ),
			'icon_url'     => \Wlr\App\Helpers\Util::getImageUrl( 'wll-loyalty-launcher' ),
			'page_url'     => '{addon_page}',
			'document_url' => '',
			'download_url' => 'https://wployalty.net/add-ons/launcher-widget/?utm_campaign=add-on-page&utm_medium=plugin-add-on&utm_source=wployalty-plugin',
			'is_external'  => true,
			'is_pro'       => false,
			'dependencies' => [],
			'plugin_file'  => 'wll-loyalty-launcher/wll-loyalty-launcher.php',
		];
		$add_ons['wp-loyalty-point-expire'] = [
			'name'         => esc_html__( 'WPLoyalty - Points Expiry', 'wp-loyalty-rules' ),
			'description'  => __( 'The add-on helps you set up an expiry for the points earned by customers and manage it.', 'wp-loyalty-rules' ),
			'icon_url'     => Util::getImageUrl( 'wp-loyalty-point-expire' ),
			'page_url'     => '{addon_page}',
			'document_url' => '',
			'is_external'  => false,
			'is_pro'       => false,
			'dependencies' => [],
			'plugin_file'  => ''
		];

		return apply_filters( 'wlr_internal_addons_list', $add_ons );
	}

	/**
	 * Get active addons.
	 *
	 * @return void
	 */
	public static function getActiveAddOns() {
		if ( ! Util::isBasicSecurityValid( 'wlr_apps_nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'You do not have access to the add-ons page', 'wp-loyalty-rules' ) ] );
		}
		$input         = new Input();
		$post_data     = $input->post();
		$validate_data = Validation::validateAddonSearchFields( $post_data );
		if ( is_array( $validate_data ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$search       = (string) $input->post_get( 'search', '' );
		$limit        = (int) $input->post_get( 'limit', 5 );
		$offset       = (int) $input->post_get( 'offset', 0 );
		$items        = [];
		$offset_count = $total_count = 0;
		foreach ( self::getAddonList() as $slug => $addon ) {
			$addon['add_on_slug'] = $slug;
			if ( ! isset( $addon['is_active'] ) || ! $addon['is_active'] ) {
				continue;
			}
			if ( ! empty( $search ) && ! Util::isSearchHaveIt( $search, (object) $addon, [ 'name' ] ) ) {
				continue;
			}
			$total_count += 1;
			if ( count( $items ) >= $limit ) {
				continue;
			}
			if ( ! empty( $offset ) && $offset > $offset_count ) {
				$offset_count ++;
				continue;
			}
			$offset_count ++;
			$items[] = $addon;
		}
		wp_send_json_success( [
			'search'      => $search,
			'limit'       => $limit,
			'total_count' => $total_count,
			'items'       => $items
		] );
	}

	/**
	 * Get available addons.
	 *
	 * @return void
	 */
	public static function getAvailableAddOns() {
		if ( ! Util::isBasicSecurityValid( 'wlr_apps_nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'You do not have access to the add-ons page', 'wp-loyalty-rules' ) ] );
		}
		$input         = new Input();
		$post_data     = $input->post();
		$validate_data = Validation::validateAddonSearchFields( $post_data );
		if ( is_array( $validate_data ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$search = (string) $input->post_get( 'search', '' );
		$limit  = (int) $input->post_get( 'limit', 5 );
		$offset = (int) $input->post_get( 'offset', 0 );

		$items        = [];
		$offset_count = $total_count = 0;
		foreach ( self::getAddonList() as $slug => $addon ) {
			$addon['add_on_slug'] = $slug;
			if ( isset( $addon['is_active'] ) && $addon['is_active'] ) {
				continue;
			}
			if ( ! empty( $search ) && ! Util::isSearchHaveIt( $search, (object) $addon, [ 'name' ] ) ) {
				continue;
			}
			$total_count += 1;
			if ( count( $items ) >= $limit ) {
				continue;
			}
			if ( ! empty( $offset ) && $offset > $offset_count ) {
				$offset_count ++;
				continue;
			}
			$offset_count ++;
			$items[] = $addon;
		}
		wp_send_json_success( [
			'search'      => $search,
			'limit'       => $limit,
			'total_count' => $total_count,
			'items'       => $items
		] );
	}

	/**
	 * Activate/ Deactivate add-ons
	 * @return void
	 */
	public static function activateAddonToggle() {
		if ( ! Util::isBasicSecurityValid( 'wlr_apps_nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'You do not have access to the add-ons page', 'wp-loyalty-rules' ) ] );
		}
		$input  = new Input();
		$action = $input->post_get( 'perform_action', '' );
		$slug   = $input->post_get( 'slug', '' );
		$addons = self::getAddonList();
		$is_pro = EarnCampaign::getInstance()->isPro();
		if ( ! is_string( $action ) || ! is_string( $slug ) || ! isset( $addons[ $slug ] ) || ! in_array( $action, [
				'activate',
				'deactivate'
			] ) ) {
			wp_send_json_error( [ 'message' => esc_html__( 'Invalid request', 'wp-loyalty-rules' ) ] );
		}
		if ( ! empty( $addons[ $slug ]['is_external'] ) ) {
			if ( $action == 'activate' ) {
				if ( ! empty( $addons[ $slug ]['is_pro'] ) && ! $is_pro ) {
					wp_send_json_error( [ 'message' => esc_html__( 'You will require the PRO version for this add-on', 'wp-loyalty-rules' ) ] );
				}
			}
			$response = self::doExternalToggle( $action, $slug, $addons );
			wp_send_json( $response );
		} else {
			$active_addons = (array) get_option( 'wlr_active_addons', [] );
			if ( $action == 'activate' && ! in_array( $slug, $active_addons ) ) {
				if ( ! empty( $addons[ $slug ]['dependencies'] ) ) {
					$need_add_ons = [];

					foreach ( $addons[ $slug ]['dependencies'] as $dependency ) {
						if ( ! empty( $dependency['file'] ) ) {
							$is_need_to_add = false;
							if ( is_array( $dependency['file'] ) ) {
								// PRO or Free Required check
								$is_need_to_add = true;
								foreach ( $dependency['file'] as $plugin_file ) {
									if ( Util::isActive( $plugin_file ) ) {
										$is_need_to_add = false;
										break;
									}
								}
							} elseif ( ! Util::isActive( $dependency['file'] ) ) {
								$is_need_to_add = true;
							}
							if ( $is_need_to_add ) {
								$need_add_ons[] = $dependency['name'];
							}
						}
					}
					if ( ! empty( $need_add_ons ) ) {
						// translators: 1. %s will replace a require plugin list
						wp_send_json_error( [ 'message' => sprintf( esc_html__( 'Sorry, you need %s plugin', 'wp-loyalty-rules' ), implode( ',', $need_add_ons ) ) ] );
					}
				}

				if ( ! empty( $addons[ $slug ]['is_pro'] ) && ! $is_pro ) {
					wp_send_json_error( [ 'message' => esc_html__( 'You will require the PRO version to activate this add-on', 'wp-loyalty-rules' ) ] );
				}
				$active_addons[] = $slug;
			} elseif ( $action == 'deactivate' && in_array( $slug, $active_addons ) ) {
				if ( ( $key = array_search( $slug, $active_addons ) ) !== false ) {
					unset( $active_addons[ $key ] );
				}
			}
			switch ( $slug ) {
				case 'wp-loyalty-point-expire':
					if ( $action == 'deactivate' ) {
						update_option( 'wlr_expire_point_active', 'no' );
					} else {
						update_option( 'wlr_expire_point_active', 'yes' );
					}
					break;
			}
			update_option( 'wlr_active_addons', $active_addons );
			wp_send_json_success( [
				'message' => ( $action == 'activate' )
					? esc_html__( 'Add-on has been activated', 'wp-loyalty-rules' )
					: esc_html__( 'Add-on deactivated', 'wp-loyalty-rules' )
			] );
		}
	}

	/**
	 * Perform activation or deactivation of an external add-on.
	 *
	 * @param string $action The action to perform ('activate' or 'deactivate').
	 * @param string $slug The slug of the add-on.
	 * @param array $addons The array of add-ons information.
	 *
	 * @return array The result of the action with success status and message data.
	 */
	protected static function doExternalToggle( $action, $slug, $addons ) {
		if ( $action == 'activate' ) {
			if ( empty( $addons[ $slug ]['plugin_file'] ) || ! current_user_can( 'activate_plugin', $addons[ $slug ]['plugin_file'] ) ) {
				return [
					'success' => false,
					'data'    => [ 'message' => esc_html__( 'You are not allowed to activate this add-on.', 'wp-loyalty-rules' ) ]
				];
			}

			if ( is_multisite() && ! is_network_admin() && is_network_only_plugin( $addons[ $slug ]['plugin_file'] ) ) {
				return [
					'success' => false,
					'data'    => [ 'message' => esc_html__( 'You are not allowed to activate this add-on.', 'wp-loyalty-rules' ) ]
				];
			}
			if ( ! empty( $addons[ $slug ]['dependencies'] ) ) {
				$need_add_ons = [];
				foreach ( $addons[ $slug ]['dependencies'] as $dependency ) {
					if ( ! empty( $dependency['file'] ) ) {
						$is_need_to_add = false;
						if ( is_array( $dependency['file'] ) ) {
							// PRO or Free Required check
							$is_need_to_add = true;
							foreach ( $dependency['file'] as $plugin_file ) {
								if ( Util::isActive( $plugin_file ) ) {
									$is_need_to_add = false;
									break;
								}
							}
						} elseif ( ! Util::isActive( $dependency['file'] ) ) {
							$is_need_to_add = true;
						}
						if ( $is_need_to_add ) {
							$need_add_ons[] = $dependency['name'];
						}
					}
				}
				if ( ! empty( $need_add_ons ) ) {
					// translators: 1. %s will replace a require plugin list
					wp_send_json_error( [ 'message' => sprintf( esc_html__( 'Sorry, you need %s plugin', 'wp-loyalty-rules' ), implode( ',', $need_add_ons ) ) ] );
				}
			}

			$activated = activate_plugin( $addons[ $slug ]['plugin_file'], '', is_network_admin() );
			if ( is_wp_error( $activated ) ) {
				return [
					'success' => false,
					'data'    => [ 'message' => esc_html__( 'Add-on activation has failed', 'wp-loyalty-rules' ) ]
				];
			}

			return [
				'success' => true,
				'data'    => [ 'message' => esc_html__( 'Add-on has been activated', 'wp-loyalty-rules' ) ]
			];
		} elseif ( $action == 'deactivate' ) {
			if ( empty( $addons[ $slug ]['plugin_file'] ) || ! current_user_can( 'deactivate_plugin', $addons[ $slug ]['plugin_file'] ) ) {
				return [
					'success' => true,
					'data'    => [ 'message' => esc_html__( 'You are not allowed to deactivate this add-on.', 'wp-loyalty-rules' ) ]
				];
			}
			if ( ! is_network_admin() && is_plugin_active_for_network( $addons[ $slug ]['plugin_file'] ) ) {
				return [
					'success' => true,
					'data'    => [ 'message' => esc_html__( 'You are not allowed to deactivate this add-on.', 'wp-loyalty-rules' ) ]
				];
			}
			deactivate_plugins( $addons[ $slug ]['plugin_file'], false, is_network_admin() );
			if ( ! is_network_admin() ) {
				update_option( 'recently_activated', [ $addons[ $slug ]['plugin_file'] => time() ] + (array) get_option( 'recently_activated' ) );
			} else {
				update_site_option( 'recently_activated', [ $addons[ $slug ]['plugin_file'] => time() ] + (array) get_site_option( 'recently_activated' ) );
			}

			return [
				'success' => true,
				'data'    => [ 'message' => esc_html__( 'Add-on deactivated', 'wp-loyalty-rules' ) ]
			];
		}

		return [
			'success' => false,
			'data'    => [ 'message' => esc_html__( 'Add-on activation has failed', 'wp-loyalty-rules' ) ]
		];
	}
}