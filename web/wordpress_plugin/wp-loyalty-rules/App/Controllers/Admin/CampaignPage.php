<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Controllers\Admin;

use Wlr\App\Helpers\Input;
use Wlr\App\Helpers\Util;
use Wlr\App\Helpers\Validation;
use Wlr\App\Helpers\Woocommerce;
use Wlr\App\Models\EarnCampaign;
use Exception;

defined( 'ABSPATH' ) or die();

class CampaignPage {
	/**
	 * Retrieves the campaigns based on the provided parameters.
	 *
	 * @return void
	 */
	public static function gets() {
		if ( ! Util::isBasicSecurityValid( 'wlr-earn-campaign-nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$input         = new Input();
		$post_data     = $input->post();
		$validate_data = Validation::validateCommonFields( $post_data );
		if ( is_array( $validate_data ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$campaign_table     = new EarnCampaign();
		$limit              = (int) $input->post_get( 'limit', 5 );
		$query_data         = self::getQueryData();
		$items              = $campaign_table->getQueryData( $query_data, '*', [ 'name' ], true, false );
		$woocommerce_helper = Woocommerce::getInstance();
		foreach ( $items as $item ) {
			$item->end_date_format = __( 'N/A', 'wp-loyalty-rules' );
			$item->created_at      = ! empty( $item->created_at ) ? $woocommerce_helper->beforeDisplayDate( $item->created_at ) : '';
			if ( $item->end_at > 0 ) {
				$item->end_date_format = $woocommerce_helper->beforeDisplayDate( $item->end_at );
				if ( $item->end_at < strtotime( gmdate( "Y-m-d H:i:s" ) ) ) {
					$item->end_date_format = __( 'Expired', 'wp-loyalty-rules' );
				}
			}
		}
		$total_count = $campaign_table->getQueryData( $query_data, 'COUNT( DISTINCT id) as total_count', [ 'name' ], false );
		wp_send_json_success( [
			'items'         => $items,
			'total_count'   => $total_count->total_count,
			'limit'         => $limit,
			'edit_base_url' => admin_url( 'admin.php?' . http_build_query( [
					'page' => WLR_PLUGIN_SLUG,
					'view' => 'edit_earn_campaign'
				] ) )
		] );
	}

	/**
	 * Retrieves query data based on user input.
	 *
	 * @return array The query data.
	 */
	protected static function getQueryData() {
		$input      = new Input();
		$limit      = (int) $input->post_get( 'limit', 5 );
		$query_data = [
			'id'     => [ 'operator' => '>', 'value' => 0 ],
			'limit'  => $limit,
			'offset' => (int) $input->post_get( 'offset', 0 )
		];
		$search     = (string) $input->post_get( 'search', '' );
		if ( ! empty( $search ) ) {
			$query_data['search'] = sanitize_text_field( $search );
		}

		$condition_field = (string) $input->post_get( 'condition_field', 'all' );//active,in_active
		switch ( $condition_field ) {
			case 'active':
				$query_data['active'] = [ 'operator' => '=', 'value' => 1 ];
				break;
			case 'in_active':
				$query_data['active'] = [ 'operator' => '=', 'value' => 0 ];
				break;
			case 'all';
			default:
				break;
		}
		$condition_field = (string) $input->post_get( 'sorting_field', 'id_desc' );//id_desc,id_asc,name_asc,name_desc,active_asc,active_desc
		switch ( $condition_field ) {
			case 'id_asc':
				$query_data['filter_order']     = 'id';
				$query_data['filter_order_dir'] = 'ASC';
				break;
			case 'name_asc':
				$query_data['filter_order']     = 'name';
				$query_data['filter_order_dir'] = 'ASC';
				break;
			case 'name_desc':
				$query_data['filter_order']     = 'name';
				$query_data['filter_order_dir'] = 'DESC';
				break;
			case 'active_asc':
				$query_data['filter_order']     = 'active';
				$query_data['filter_order_dir'] = 'ASC';
				break;
			case 'active_desc':
				$query_data['filter_order']     = 'active';
				$query_data['filter_order_dir'] = 'DESC';
				break;
			case 'id_desc':
			default:
				$query_data['filter_order']     = 'id';
				$query_data['filter_order_dir'] = 'DESC';
				break;
		}

		return $query_data;
	}

	/**
	 * Performs a bulk action on earn campaigns.
	 *
	 * @return void
	 */
	public static function handleBulkAction() {
		if ( ! Util::isBasicSecurityValid( 'wlr-earn-campaign-nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$input       = new Input();
		$action_mode = (string) $input->post_get( 'action_mode', '' );

		if ( ! in_array( $action_mode, [ 'activate', 'deactivate', 'delete' ] ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}

		$selected_list = (string) $input->post_get( 'selected_list', '' );
		$selected_list = explode( ',', $selected_list );
		$validate_data = apply_filters( 'wlr_before_campaign_bulk_action', [], $action_mode, $selected_list );
		if ( ! empty( $validate_data ) ) {
			wp_send_json( $validate_data );
		}

		$earn_campaign = new EarnCampaign();
		if ( $earn_campaign->bulkAction( $selected_list, $action_mode ) ) {
			if ( $action_mode == 'delete' ) {
				$earn_campaign->reOrder();
			}
			wp_send_json_success( [ 'message' => self::getBulkActionMessage( $action_mode, true ) ] );
		}
		wp_send_json_error( [ 'message' => self::getBulkActionMessage( $action_mode ) ] );
	}

	/**
	 * Get the bulk action message based on the action mode and status.
	 *
	 * @param string $action_mode The action mode. Possible values are 'activate', 'deactivate', and 'delete'.
	 * @param bool $status The status of the action. Default is false.
	 *
	 * @return string The bulk action message.
	 */
	protected static function getBulkActionMessage( $action_mode, $status = false ) {
		if ( empty( $action_mode ) ) {
			return '';
		}
		switch ( $action_mode ) {
			case 'activate':
				$message = $status ? __( 'Campaign activation is successful', 'wp-loyalty-rules' ) : __( 'Campaign activation failed', 'wp-loyalty-rules' );
				break;
			case 'deactivate':
				$message = $status ? __( 'Campaign de-activation is successful', 'wp-loyalty-rules' ) : __( 'Campaign de-activation failed', 'wp-loyalty-rules' );
				break;
			case 'delete':
				$message = $status ? __( 'Campaign deletion is successful', 'wp-loyalty-rules' ) : __( 'Campaign deletion failed', 'wp-loyalty-rules' );
				break;
			default:
				$message = '';
				break;
		}

		return $message;
	}

	/**
	 * Delete a campaign by ID.
	 *
	 * @return void
	 */
	public static function delete() {
		if ( ! Util::isBasicSecurityValid( 'wlr-earn-campaign-nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$input = new Input();
		$id    = (int) $input->post_get( 'id', 0 );
		if ( $id <= 0 ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}

		$validate_data = apply_filters( 'wlr_before_delete_campaign', [], $id );
		if ( ! empty( $validate_data ) ) {
			wp_send_json( $validate_data );
		}

		$earn_campaign = new EarnCampaign();
		if ( $earn_campaign->deleteById( $id ) ) {
			$earn_campaign->reOrder();
			wp_send_json_success( [ 'message' => __( 'Campaign deletion is successful', 'wp-loyalty-rules' ) ] );
		}
		wp_send_json_error( [ 'message' => __( 'Campaign deletion failed', 'wp-loyalty-rules' ) ] );
	}

	/**
	 * Toggles the active status of a campaign.
	 *
	 * @return void
	 */
	public static function toggleActive() {
		if ( ! Util::isBasicSecurityValid( 'wlr-earn-campaign-nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$input = new Input();
		$id    = (int) $input->post_get( 'id', 0 );
		if ( $id <= 0 ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		try {
			$earn_campaign = new EarnCampaign();
			$campaign      = $earn_campaign->getByKey( $id );
			$data          = apply_filters( 'wlr_before_toggle_campaign_active', [], $campaign );
			if ( ! empty( $data ) ) {
				wp_send_json( $data );
			}
			if ( ! empty( $campaign ) ) {
				$active = (int) $input->post_get( 'active', 0 );
				if ( $earn_campaign->activateOrDeactivate( $id, $active ) ) {
					$message = __( 'Campaign disabled successfully', 'wp-loyalty-rules' );
					if ( $active ) {
						$message = __( 'Campaign enabled successfully', 'wp-loyalty-rules' );
					}
					wp_send_json_success( [
						'redirect' => admin_url( 'admin.php?' . http_build_query( [
								'page' => WLR_PLUGIN_SLUG,
								'view' => 'earn_campaign'
							] ) ),
						'message'  => $message
					] );
				}
			}
		} catch ( Exception $e ) {
		}
		wp_send_json_error( [ 'message' => __( 'Campaign status change has failed', 'wp-loyalty-rules' ) ] );
	}

	/**
	 * Get a campaign by id.
	 *
	 * @return void
	 */
	public static function get() {
		$data = [];
		if ( ! Util::isBasicSecurityValid( 'wlr-campaign-nonce' ) ) {
			$data['success'] = false;
			$data['data']    = null;
		}
		try {
			$input           = new Input();
			$id              = (int) $input->post_get( 'id', 0 );
			$earn_campaign   = new EarnCampaign();
			$single_campaign = $earn_campaign->getByKey( $id );
			$data['data']    = \Wlr\App\Helpers\EarnCampaign::getInstance()->changeDisplayDate( $single_campaign );
			$data['success'] = true;
		} catch ( Exception $e ) {
			$data['success'] = false;
			$data['data']    = null;
		}
		wp_send_json( $data );
	}

	/**
	 * Save a campaign.
	 *
	 * @return void
	 */
	public static function save() {
		if ( ! Util::isBasicSecurityValid( 'wlr-campaign-nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$input     = new Input();
		$post_data = $input->post();
		//phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$post_data['name'] = ! empty( $_REQUEST['name'] ) ? apply_filters( 'title_save_pre', sanitize_text_field( wp_unslash( $_REQUEST['name'] ) ) ) : '';
		//phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$post_data['description'] = ! empty( $_REQUEST['description'] ) ? apply_filters( 'title_save_pre', sanitize_textarea_field( wp_unslash( $_REQUEST['description'] ) ) ) : '';
		$post_data['conditions']  = ! empty( $post_data['conditions'] ) ? json_decode( stripslashes( $post_data['conditions'] ), true ) : [];
		$post_data['point_rule']  = ! empty( $post_data['point_rule'] ) ? json_decode( stripslashes( $post_data['point_rule'] ), true ) : [];
		$validate_data            = Validation::validateRuleTab( $post_data );
		if ( is_array( $validate_data ) ) {
			foreach ( $validate_data as $key => $validate ) {
				$validate_data[ $key ] = [ current( $validate ) ];
			}
			wp_send_json_error( [
				'field_error' => $validate_data,
				'message'     => __( 'Campaign could not be saved', 'wp-loyalty-rules' )
			] );
		}
		$data = apply_filters( 'wlr_before_save_campaign_validation', [] );
		if ( ! empty( $data ) ) {
			wp_send_json( $data );
		}
		try {
			// do save campaign
			$earn_campaign = new EarnCampaign();
			$id            = $earn_campaign->save( $post_data );
			$action_type   = ( ! empty( $post_data['action_type'] ) ) ? $post_data['action_type'] : '';
			if ( $id <= 0 ) {
				global $wpdb;
				wp_send_json_error( [
					'error'   => $wpdb->last_error,
					'message' => __( 'Campaign could not be saved', 'wp-loyalty-rules' )
				] );
			}
			wp_send_json_success( [
				'redirect' => admin_url( 'admin.php?' . http_build_query( [
						'page'        => WLR_PLUGIN_SLUG,
						'view'        => 'edit_earn_campaign',
						'action_type' => $action_type,
						'id'          => $id
					] ) ),
				'message'  => __( 'Campaign saved successfully', 'wp-loyalty-rules' )
			] );
		} catch ( Exception $e ) {
			wp_send_json_error( [ 'message' => $e->getMessage() ] );
		}
		wp_send_json_error( [ 'message' => __( 'Campaign save failed.', 'wp-loyalty-rules' ) ] );
	}

	/**
	 * Duplicate a campaign by id.
	 *
	 * @return void
	 */
	public static function duplicate() {
		if ( ! Util::isBasicSecurityValid( 'wlr-earn-campaign-nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$input       = new Input();
		$campaign_id = (int) $input->post_get( 'campaign_id', 0 );
		if ( $campaign_id <= 0 ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$earn_campaign = new EarnCampaign();
		$campaign      = $earn_campaign->getByKey( $campaign_id );
		if ( empty( $campaign ) || ! isset( $campaign->id ) || (int) $campaign->id <= 0 ) {
			wp_send_json_error( [ 'message' => __( 'Campaign not found', 'wp-loyalty-rules' ) ] );
		}
		$campaign->id         = 0;
		$campaign->name       = $campaign->name . '(' . __( 'copy', 'wp-loyalty-rules' ) . ')';
		$campaign->ordering   = 0;
		$woocommerce_helper   = Woocommerce::getInstance();
		$campaign->conditions = ! empty( $campaign->conditions ) ? json_decode( stripslashes( $campaign->conditions ), true ) : [];
		$campaign->point_rule = ! empty( $campaign->point_rule ) ? json_decode( stripslashes( $campaign->point_rule ), true ) : [];
		$campaign->start_at   = ! empty( $campaign->start_at ) ? $woocommerce_helper->beforeDisplayDate( $campaign->start_at, 'Y-m-d' ) : 0;
		$campaign->end_at     = ! empty( $campaign->end_at ) ? $woocommerce_helper->beforeDisplayDate( $campaign->end_at, 'Y-m-d' ) : 0;
		$id                   = $earn_campaign->save( (array) $campaign );
		if ( $id <= 0 ) {
			global $wpdb;
			wp_send_json_error( [
				'error'   => $wpdb->last_error,
				'message' => __( 'Campaign could not be saved', 'wp-loyalty-rules' )
			] );
		}
		wp_send_json_success( [ 'message' => __( 'Campaign duplicated successfully', 'wp-loyalty-rules' ) ] );
	}
}