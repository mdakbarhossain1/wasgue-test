<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Controllers\Admin;

use Wlr\App\Helpers\AjaxCondition;
use Wlr\App\Helpers\Input;
use Wlr\App\Helpers\Util;
use Wlr\App\Helpers\Woocommerce;
use Wlr\App\Models\EarnCampaign;
use Wlr\App\Models\Rewards;
use Wlr\App\Helpers\EarnCampaign as EarnCampaignHelper;

defined( 'ABSPATH' ) or die();

class Common {
	/**
	 * Adds a menu page for WPLoyalty in the WordPress admin menu.
	 *
	 * @since 1.0.0
	 */
	public static function addMenu() {
		if ( Woocommerce::hasAdminPrivilege() ) {
			add_menu_page( __( 'WPLoyalty', 'wp-loyalty-rules' ), __( 'WPLoyalty', 'wp-loyalty-rules' ),
				'manage_woocommerce',
				WLR_PLUGIN_SLUG, [
					self::class,
					'manageLoyaltyPages'
				], 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzYiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAzNiAzNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yLjMwMzAxIDcuOTM2ODFDMi44MDY1OSA0LjgzMTgxIDYuMjU2MzQgLTAuNDQ1ODI5IDE2LjAyNjYgMy4yODM2M0MyMi4zOTEgNS41Mzk1MyAyOS4xMDggOS4xNjEwMyAzMS42NzEgMTAuNjg5OEMzNC4zMjI5IDEyLjY3MTggMzcuNzk0OCAxOC4wNjY5IDMwLjQ2NTkgMjMuNzkxN0MyMy4xMzcgMjkuNTE2MyAxOC44NTY0IDMxLjgzNzUgMTcuNjMyMyAzMi4yODI1QzExLjU0NTggMzQuODEyMSA1LjM5NTM2IDM1LjcyODEgMy4xOTUxMiAyNC4yNzg4QzIuNTUwNjIgMjAuMjIwOSAxLjQ2OTkxIDExLjI3MTUgMi4zMDMwMSA3LjkzNjgxWk0xMi40MDI5IDEwLjQwNDlDMTIuNDA1OCAxNC41MjkgMTQuNTA0NiAxOC4zNzIxIDE2Ljc1NCAxOC4zNzIxQzE5LjAwMzMgMTguMzcyMSAyMS4xMDIgMTQuNTI5IDIxLjEwNTEgMTAuNDA0OUwyMS4xMDU1IDkuNjY4OTVIMTIuNDAyM0wxMi40MDI5IDEwLjQwNDlaTTEwLjIyNjYgMTEuNTYxOUMxMC4yMjY2IDEzLjY4NjQgMTEuNDgyOCAxNS45MTcyIDEzLjE1NjcgMTYuNzY1NEMxMy41MTYxIDE2Ljk0NzUgMTMuODEwMiAxNy4wNjg3IDEzLjgxMDIgMTcuMDM0OEMxMy44MTAyIDE2Ljc2MjkgMTMuMzAzMyAxNi4wNjMyIDEyLjg3ODIgMTUuNzQ4NEMxMS45Mzc0IDE1LjA1MTUgMTEuMTYxIDEzLjU2OTkgMTAuOTUwMSAxMi4wNjg3TDEwLjg4MjYgMTEuNTg4OEgxMS40NTA1QzExLjk5NjEgMTEuNTg4OCAxMi4wMTg0IDExLjU3MzggMTIuMDE4NCAxMS4yMDQ4VjEwLjgyMDhIMTAuMjI2NlYxMS41NjE5Wk0yMS40NTg3IDExLjEzNzdDMjEuMzc5NSAxMS41NTI0IDIxLjQyOTggMTEuNTg4OCAyMi4wODM3IDExLjU4ODhIMjIuNjM1TDIyLjU2MTcgMTIuMDA0N0MyMi4yNjEzIDEzLjcwODIgMjEuNTQ2NSAxNS4wOTQ5IDIwLjYyODQgMTUuNzU0OEMyMC4xNTczIDE2LjA5MzQgMTkuNjk3NyAxNi42OTY5IDE5LjY5NzcgMTYuOTc2OEMxOS42OTc3IDE3LjA0MjcgMTkuOTg5MyAxNi45NDg4IDIwLjM0NTggMTYuNzY4MkMyMi4wMDY2IDE1LjkyNjUgMjMuMjgxNCAxMy42NjU2IDIzLjI4MTQgMTEuNTYxOVYxMC44MjA4SDIyLjQwMDVDMjEuNTY0NSAxMC44MjA4IDIxLjUxNjIgMTAuODM3MSAyMS40NTg3IDExLjEzNzdaTTE2LjA1NzYgMTkuMzY0QzE1LjkwOTQgMjAuNDE4MyAxNS40NzUgMjEuODU4NiAxNS4wMTg2IDIyLjgwOThDMTQuOTgwMSAyMi44OSAxNC45NDM0IDIyLjk2NTQgMTQuOTA4OSAyMy4wMzYyQzE0LjY3ODQgMjMuNTEwMSAxNC41NDczIDIzLjc3OTggMTQuNjMwNSAyMy45MzNDMTQuNzQwNCAyNC4xMzUzIDE1LjIyNDUgMjQuMTM0NCAxNi4zNDggMjQuMTMyMUMxNi40NzUgMjQuMTMxOCAxNi42MTAyIDI0LjEzMTUgMTYuNzU0IDI0LjEzMTVDMTYuODk3NyAyNC4xMzE1IDE3LjAzMjkgMjQuMTMxOCAxNy4xNiAyNC4xMzIxQzE4LjI4MzQgMjQuMTM0NCAxOC43Njc0IDI0LjEzNTMgMTguODc3NCAyMy45MzNDMTguOTYwNiAyMy43Nzk4IDE4LjgyOTQgMjMuNTEwMSAxOC41OTg5IDIzLjAzNjNDMTguNTY0NSAyMi45NjU0IDE4LjUyNzggMjIuODkgMTguNDg5MyAyMi44MDk4QzE4LjAzMjkgMjEuODU4NiAxNy41OTg1IDIwLjQxODMgMTcuNDUwNCAxOS4zNjRMMTcuMzY0OSAxOC43NTYxSDE2LjE0MzFMMTYuMDU3NiAxOS4zNjRaTTEyLjQwMjMgMjYuMzA3NEgyMS4xMDU1VjI0LjUxNTVIMTIuNDAyM1YyNi4zMDc0Wk0xNi42MjQ2IDExLjc1ODRDMTYuNjg1MSAxMS41NzI0IDE2Ljk0ODIgMTEuNTcyNCAxNy4wMDg2IDExLjc1ODRMMTcuMzExOSAxMi42OTIxQzE3LjMzOSAxMi43NzUyIDE3LjQxNjQgMTIuODMxNSAxNy41MDM5IDEyLjgzMTVIMTguNDg1N0MxOC42ODEyIDEyLjgzMTUgMTguNzYyNiAxMy4wODE4IDE4LjYwNDQgMTMuMTk2N0wxNy44MSAxMy43NzM3QzE3LjczOTMgMTMuODI1MSAxNy43MDk4IDEzLjkxNjMgMTcuNzM2NyAxMy45OTk0TDE4LjA0MDEgMTQuOTMzMUMxOC4xMDA2IDE1LjExOTEgMTcuODg3NyAxNS4yNzM3IDE3LjcyOTYgMTUuMTU4OEwxNi45MzUzIDE0LjU4MTdDMTYuODY0NSAxNC41MzAzIDE2Ljc2ODcgMTQuNTMwMyAxNi42OTggMTQuNTgxN0wxNS45MDM3IDE1LjE1ODhDMTUuNzQ1NSAxNS4yNzM3IDE1LjUzMjcgMTUuMTE5MSAxNS41OTMxIDE0LjkzMzFMMTUuODk2NSAxMy45OTk0QzE1LjkyMzUgMTMuOTE2MyAxNS44OTM5IDEzLjgyNTEgMTUuODIzMSAxMy43NzM3TDE1LjAyODkgMTMuMTk2N0MxNC44NzA3IDEzLjA4MTggMTQuOTUyIDEyLjgzMTUgMTUuMTQ3NiAxMi44MzE1SDE2LjEyOTNDMTYuMjE2NyAxMi44MzE1IDE2LjI5NDIgMTIuNzc1MiAxNi4zMjEzIDEyLjY5MjFMMTYuNjI0NiAxMS43NTg0WiIgZmlsbD0iYmxhY2siLz4KPC9zdmc+Cg==', 57 );
		}
	}

	/**
	 * Manages the loyalty pages in the WordPress admin.
	 *
	 * @since 1.0.0
	 */
	public static function manageLoyaltyPages() {
		if ( ! Woocommerce::hasAdminPrivilege() ) {
			wp_die( esc_html( __( "Don't have access permission", 'wp-loyalty-rules' ) ) );
		}
		$input = new Input();
		//it will automatically add new table column,via auto generate alter query
		if ( $input->get( 'page', null ) == WLR_PLUGIN_SLUG ) {
			self::updateDataForFree();
			$view             = (string) $input->get( 'view', 'dashboard' );
			$main_page_params = [
				'current_view' => $view,
				'tab_content'  => null,
			];
			if ( in_array( $view, [
				'settings',
				'point_users',
				'point_user_details',
				'dashboard',
				'earn_campaign',
				'add_new_campaign',
				'edit_earn_campaign',
				'rewards',
				'add_new_reward',
				'edit_reward'
			] ) ) {
				$path = WLR_PLUGIN_PATH . 'App/Views/Admin/main.php';
				Util::renderTemplate( $path, $main_page_params );
			}
			do_action( 'wlr_manage_pages', $view );
		} else {
			wp_die( esc_html( __( 'Page query params missing...', 'wp-loyalty-rules' ) ) );
		}
	}

	/**
	 * Updates data for the free version of the application.
	 *
	 * This method checks if the application is the pro version and performs certain actions accordingly.
	 * If the application is not the pro version, it updates the campaign status and reward status for the free version.
	 * If the application is the pro version and there are reward counts in the campaign, it activates the used rewards in the campaigns.
	 *
	 * @return void
	 * @since 1.0.0
	 *
	 */
	protected static function updateDataForFree() {
		$is_pro         = EarnCampaignHelper::getInstance()->isPro();
		$campaign_table = new EarnCampaign();
		$rewards_table  = new Rewards();
		if ( ! $is_pro ) {
			$campaign_table->updateFreeCampaignStatus();
			$rewards_table->updateFreeRewardStatus();
		}
		$reward_count_list = $campaign_table->getRewardUsedCountInCampaign();
		if ( $is_pro && ! empty( $reward_count_list ) ) {
			$rewards_table->activateUsedRewardInCampaigns( $reward_count_list );
		}
	}

	/**
	 * Adds custom action links to the plugin.
	 *
	 * @param array $links An array of existing action links.
	 *
	 * @return array The modified array of action links.
	 */
	public static function pluginActionLinks( $links ) {
		if ( ! Woocommerce::hasAdminPrivilege() ) {
			return $links;
		}
		$action_links = [
			'dashboard' => '<a href="' . admin_url( 'admin.php?page=' . WLR_PLUGIN_SLUG . '#/dashboard' ) . '">' . __( 'Dashboard', 'wp-loyalty-rules' ) . '</a>',
			'settings'  => '<a href="' . admin_url( 'admin.php?page=' . WLR_PLUGIN_SLUG . '#/settings' ) . '">' . __( 'Settings', 'wp-loyalty-rules' ) . '</a>',
			'customer'  => '<a href="' . admin_url( 'admin.php?page=' . WLR_PLUGIN_SLUG . '#/point_users' ) . '">' . __( 'Manage Points', 'wp-loyalty-rules' ) . '</a>'
		];
		if ( ! EarnCampaignHelper::getInstance()->isPro() ) {
			$action_links['pro'] = '<a style="color: #4f47eb; font-weight: bold;" target="_blank" href="https://wployalty.net/pricing/?utm_campaign=wployalty-link&utm_medium=pro_url&utm_source=pricing">' . __( 'Get Pro', 'wp-loyalty-rules' ) . '</a>';
		}
		$action_links = apply_filters( 'wlr_point_action_links', $action_links );

		return array_merge( $action_links, $links );
	}

	/**
	 * Modifies the script tag for a specific handle.
	 *
	 * @param string $tag The original script tag.
	 * @param string $handle The handle of the script.
	 *
	 * @return string The modified script tag.
	 */
	public static function scriptLoaderTag( $tag, $handle ) {
		$code = '/^' . WLR_PLUGIN_SLUG . '-react-/';
		if ( ! preg_match( $code, $handle ) ) {
			return $tag;
		}

		return str_replace( ' src', ' async="async" defer="defer" src', $tag );
	}

	/**
	 * Registers and enqueues admin scripts and styles.
	 *
	 * @return void
	 */
	public static function adminScripts() {
		if ( ! Woocommerce::hasAdminPrivilege() ) {
			return;
		}
		$input = new Input();
		if ( $input->get( 'page', null ) != WLR_PLUGIN_SLUG ) {
			return;
		}
		$suffix = '.min';
		if ( defined( 'SCRIPT_DEBUG' ) ) {
			$suffix = SCRIPT_DEBUG ? '' : '.min';
		}
		self::removeAdminNotice();
		wp_enqueue_media();
		//Register the styles
		wp_enqueue_style( WLR_PLUGIN_SLUG . '-alertify', WLR_PLUGIN_URL . 'Assets/Admin/Css/alertify' . $suffix . '.css', [], WLR_PLUGIN_VERSION . '&t=' . time() );
		wp_enqueue_style( WLR_PLUGIN_SLUG . '-wlr-font', WLR_PLUGIN_URL . 'Assets/Site/Css/wlr-fonts' . $suffix . '.css', [], WLR_PLUGIN_VERSION . '&t=' . time() );
		wp_enqueue_style( WLR_PLUGIN_SLUG . '-wlr-admin', WLR_PLUGIN_URL . 'Assets/Admin/Css/wlr-admin' . $suffix . '.css', [], WLR_PLUGIN_VERSION . '&t=' . time() );
		//Register the scripts
		wp_enqueue_script( WLR_PLUGIN_SLUG . '-alertify', WLR_PLUGIN_URL . 'Assets/Admin/Js/alertify' . $suffix . '.js', [], WLR_PLUGIN_VERSION . '&t=' . time(), true );
		/* Admin React */
		$common_path = WLR_PLUGIN_PATH . 'Assets/Admin/Js/dist';
		$js_files    = Woocommerce::getDirFileLists( $common_path );
		foreach ( $js_files as $file ) {
			$path         = str_replace( WLR_PLUGIN_PATH, '', $file );
			$js_file_name = str_replace( $common_path . '/', '', $file );
			if ( $js_file_name == 'main.bundle.js' ) {
				$js_name     = WLR_PLUGIN_SLUG . '-react-ui-' . substr( $js_file_name, 0, - 3 );
				$js_file_url = WLR_PLUGIN_URL . $path;
				wp_enqueue_script( $js_name, $js_file_url, [
					'jquery',
					WLR_PLUGIN_SLUG . '-alertify'
				], WLR_PLUGIN_VERSION . '&t=' . time(), true );
			}
		}
		/*End Admin React */
		$localize = [
			'home_url'   => get_home_url(),
			'admin_url'  => admin_url(),
			'plugin_url' => WLR_PLUGIN_URL,
			'ajax_url'   => admin_url( 'admin-ajax.php' )
		];
		wp_localize_script( WLR_PLUGIN_SLUG . '-alertify', 'wlr_localize_data', $localize );
	}

	/**
	 * Removes all actions associated with the 'admin_notices' hook.
	 *
	 * @return void
	 */
	public static function removeAdminNotice() {
		remove_all_actions( 'admin_notices' );
	}

	/**
	 * Hides certain menu items from the WordPress dashboard menu.
	 *
	 * @return void
	 */
	public static function hideMenu() {
		?>
        <style>
            #toplevel_page_wp-loyalty-launcher,
            #toplevel_page_wp-loyalty-point-expire {
                display: none !important;
            }
        </style>
		<?php
	}

	/**
	 * Retrieves condition data based on input parameters.
	 *
	 * @return void
	 */
	public static function getConditionData() {
		if ( ! Util::isBasicSecurityValid( 'wlr_ajax_select2' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic security validation failed', 'wp-loyalty-rules' ) ] );
		}
		$input  = new Input();
		$method = (string) $input->post_get( 'method', '' );
		$query  = (string) $input->post_get( 'q', '' );
		if ( empty( $method ) || empty( $query ) ) {
			wp_send_json_error( [ 'message' => __( 'Invalid method', 'wp-loyalty-rules' ) ] );
		}

		$method_name        = 'ajax' . ucfirst( $method );
		$ajax_condition     = AjaxCondition::getInstance();
		$is_pro             = \Wlr\App\Helpers\EarnCampaign::getInstance()->isPro();
		$woocommerce_helper = Woocommerce::getInstance();
		if ( $woocommerce_helper->isMethodExists( $ajax_condition, $method_name ) ) {
			wp_send_json_success( $ajax_condition->$method_name() );
		} else if ( $is_pro && class_exists( '\Wlr\App\Premium\Helpers\AjaxProCondition' ) ) {
			$ajax_pro_condition = \Wlr\App\Premium\Helpers\AjaxProCondition::getInstance();
			if ( $woocommerce_helper->isMethodExists( $ajax_pro_condition, $method_name ) ) {
				wp_send_json_success( $ajax_pro_condition->$method_name() );
			}
			$data = apply_filters( 'wlr_condition_class_loading', [] );
			if ( ! empty( $data ) ) {
				wp_send_json( $data );
			}
			wp_send_json_error( [ 'message' => __( 'Method not found', 'wp-loyalty-rules' ) ] );
		}
		wp_send_json_error( [ 'message' => __( 'Invalid method', 'wp-loyalty-rules' ) ] );
	}

	/**
	 * Get recommendation list.
	 *
	 * @return void
	 */
	public static function getRecommendationList() {
		if ( ! Util::isBasicSecurityValid( 'wlr_ajax_select2' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic security validation failed', 'wp-loyalty-rules' ) ] );
		}
		$addons = get_transient( 'wlr_remote_recommendation_list' );

		if ( empty( $addons ) ) {
			$addons   = [];
			$response = wp_remote_get( 'https://static.flycart.net/recommendation/product/wployalty.json' );
			if ( ! is_wp_error( $response ) ) {
				$response = (array) json_decode( wp_remote_retrieve_body( $response ), true );
				if ( ! empty( $response ) ) {
					$domain = ! empty( $_SERVER['SERVER_NAME'] ) ? sanitize_text_field( wp_unslash( $_SERVER['SERVER_NAME'] ) ) : '';
					foreach ( $response as $addon ) {
						if ( ! empty( $addon['plugin_url'] ) ) {
							$addon['plugin_url'] = str_replace( '{site-name}', $domain, $addon['plugin_url'] );
						}
						$addons[] = $addon;
					}
					set_transient( 'wlr_remote_recommendation_list', $addons, 24 * 60 * 60 );
				}
			}
		}
		wp_send_json_success( [ 'items' => $addons ] );
	}
}