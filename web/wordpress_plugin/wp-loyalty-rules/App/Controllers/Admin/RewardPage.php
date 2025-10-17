<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Controllers\Admin;

use Exception;
use Wlr\App\Helpers\Input;
use Wlr\App\Helpers\Util;
use Wlr\App\Helpers\Validation;
use Wlr\App\Helpers\Woocommerce;
use Wlr\App\Models\EarnCampaign;
use Wlr\App\Models\Rewards;

defined( 'ABSPATH' ) or die;

class RewardPage {
	/**
	 * Retrieves the list of reward items.
	 *
	 * @return void
	 */
	public static function gets() {
		if ( ! Util::isBasicSecurityValid( 'wlr-reward-nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$input         = new Input();
		$post_data     = $input->post();
		$validate_data = Validation::validateCommonFields( $post_data );
		if ( is_array( $validate_data ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$limit              = (int) $input->post_get( 'limit', 5 );
		$query_data         = self::getQueryData();
		$rewards_table      = new Rewards();
		$items              = $rewards_table->getQueryData( $query_data, '*', [ 'name' ], true, false );
		$total_count        = $rewards_table->getQueryData( $query_data, 'COUNT( DISTINCT id) as total_count', [ 'name' ], false );
		$reward_types       = Woocommerce::getRewardDiscountTypes();
		$campaign_model     = new EarnCampaign();
		$reward_count_list  = $campaign_model->getRewardUsedCountInCampaign();
		$woocommerce_helper = Woocommerce::getInstance();
		foreach ( $items as $item ) {
			if ( is_object( $item ) ) {
				$item->created_at       = ! empty( $item->created_at ) ? $woocommerce_helper->beforeDisplayDate( $item->created_at ) : '';
				$item->campaign_count   = isset( $reward_count_list[ $item->id ] ) && $reward_count_list[ $item->id ] > 0 ? $reward_count_list[ $item->id ] : 0;
				$item->reward_type_name = ! empty( $item->discount_type ) && isset( $reward_types[ $item->discount_type ] ) && $reward_types[ $item->discount_type ] ? $reward_types[ $item->discount_type ] : '';
			}
		}
		wp_send_json_success( [
			'items'         => $items,
			'total_count'   => $total_count->total_count,
			'limit'         => $limit,
			'edit_base_url' => admin_url( 'admin.php?' . http_build_query( [
					'page' => WLR_PLUGIN_SLUG,
					'view' => 'edit_reward'
				] ) )
		] );
	}

	/**
	 * Retrieves the query data for retrieving rewards.
	 *
	 * @return array The query data for retrieving rewards.
	 */
	public static function getQueryData() {
		$input      = new Input();
		$limit      = (int) $input->post_get( 'limit', 5 );
		$search     = (string) $input->post_get( 'search', '' );
		$query_data = [
			'id'     => [
				'operator' => '>',
				'value'    => 0
			],
			'limit'  => $limit,
			'offset' => (int) $input->post_get( 'offset', 0 )
		];
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
	 * Retrieves the reward campaigns based on the given reward ID.
	 *
	 * @return void
	 */
	public static function getRewardCampaigns() {
		$input     = new Input();
		$reward_id = (int) $input->post_get( 'id', 0 );
		if ( ! Util::isBasicSecurityValid( 'wlr-reward-nonce' ) || $reward_id <= 0 ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$earn_campaign = new EarnCampaign();
		$campaign_list = $earn_campaign->getCampaignListByRewardId( $reward_id );
		wp_send_json_success( $campaign_list );
	}

	/**
	 * Perform a bulk action on rewards.
	 *
	 * @return void
	 */
	public static function bulkAction() {
		if ( ! Util::isBasicSecurityValid( 'wlr-reward-nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$input         = new Input();
		$selected_list = (string) $input->post_get( 'selected_list', '' );
		$selected_list = explode( ',', $selected_list );
		$action_mode   = (string) $input->post_get( 'action_mode', '' );
		$data          = apply_filters( 'wlr_before_reward_bulk_action', [], $action_mode, $selected_list );
		if ( ! empty( $data ) ) {
			wp_send_json( $data );
		}
		$reward_model = new Rewards();
		if ( in_array( $action_mode, [ 'deactivate', 'delete' ] ) ) {
			$message        = [];
			$success_status = false;
			foreach ( $selected_list as $id ) {
				$reward = $reward_model->getByKey( $id );
				if ( ! empty( $reward ) && $reward->reward_type == 'redeem_coupon' ) {
					$status = $reward_model->checkCampaignHaveReward( $id );
					if ( ! $status ) {
						if ( $action_mode == 'deactivate' ) {
							$status = $reward_model->activateOrDeactivate( $id );
						} elseif ( $action_mode == 'delete' ) {
							$status = $reward_model->deleteById( $id );
						}
						if ( ! $status ) {
							/* translators: 1: name, 2: action mode */
							$message[] = sprintf( __( '%1$s %2$s failed', 'wp-loyalty-rules' ), $reward->name, $action_mode );
						} else {
							$success_status = true;
						}
					} else {
						// translators: %s: reward name
						$message[] = sprintf( __( 'Please remove "%s" reward in campaign', 'wp-loyalty-rules' ), $reward->name );
					}
				} else {
					if ( $action_mode == 'deactivate' ) {
						$status = $reward_model->activateOrDeactivate( $id );
					} else {
						$status = $reward_model->deleteById( $id );
					}
					if ( ! $status ) {
						/* translators: %s: reward name */
						$message[] = sprintf( __( '%s delete failed', 'wp-loyalty-rules' ), $reward->name );
					} else {
						$success_status = true;
					}
				}
				// do code here
			}

			if ( $action_mode == 'delete' ) {
				$reward_model->reOrder();
			}
			$response = [
				'reward_message' => $message,
			];
			if ( $success_status ) {
				$data['success']     = true;
				$response['message'] = $reward_model->getBulkActionMessage( $action_mode, true );
				wp_send_json_success( $response );
			}
			wp_send_json_error( $response );
		} elseif ( $action_mode == 'activate' ) {
			if ( $reward_model->bulkAction( $selected_list, $action_mode ) ) {
				wp_send_json_success( [ 'message' => $reward_model->getBulkActionMessage( $action_mode, true ) ] );
			}
		}
		wp_send_json_error( [ 'message' => __( 'Invalid action mode', 'wp-loyalty-rules' ) ] );
	}

	/**
	 * Delete a reward.
	 *
	 * @return void
	 */
	public static function delete() {
		$input = new Input();
		$id    = (int) $input->post_get( 'id', 0 );
		if ( ! Util::isBasicSecurityValid( 'wlr-reward-nonce' ) || $id <= 0 ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$reward_model = new Rewards();
		$reward       = $reward_model->getByKey( $id );

		if ( ! empty( $reward ) && $reward->reward_type == 'redeem_coupon' && $reward_model->checkCampaignHaveReward( $id ) ) {
			// translators: %s: reward name
			wp_send_json_error( [ 'message' => sprintf( __( 'Please remove "%s" reward in campaign', 'wp-loyalty-rules' ), $reward->name ) ] );
		}

		if ( $reward_model->deleteById( $id ) ) {
			$reward_model->reOrder();
			wp_send_json_success( [ 'message' => __( 'Reward deleted successfully', 'wp-loyalty-rules' ) ] );
		}
		wp_send_json_error( [ 'message' => __( 'Reward delete failed', 'wp-loyalty-rules' ) ] );
	}

	/**
	 * Toggle the active status of a reward.
	 *
	 * @return void
	 */
	public static function toggleActive() {
		$input = new Input();
		$id    = (int) $input->post_get( 'id', 0 );
		if ( ! Util::isBasicSecurityValid( 'wlr-reward-nonce' ) || $id <= 0 ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		try {
			$reward_model = new Rewards();
			$reward       = $reward_model->getByKey( $id );
			if ( empty( $reward ) || ! is_object( $reward ) ) {
				wp_send_json_error( [ 'message' => __( 'Reward status change has failed', 'wp-loyalty-rules' ) ] );
			}
			$data = apply_filters( 'wlr_before_toggle_reward_active', [], $reward );
			if ( ! empty( $data ) ) {
				wp_send_json( $data );
			}
			$active = (int) $input->post_get( 'active', 0 );

			if ( isset( $reward->reward_type ) && $reward->reward_type == 'redeem_coupon' && $active == 0 ) {
				if ( $reward_model->checkCampaignHaveReward( $id ) ) {
					// translators: %s: reward name
					wp_send_json_error( [ 'message' => sprintf( __( 'Please remove "%s" reward in campaign', 'wp-loyalty-rules' ), $reward->name ) ] );
				}
			}

			$message = __( 'Disabling reward has failed', 'wp-loyalty-rules' );
			if ( $active ) {
				$message = __( 'Reward activation has failed', 'wp-loyalty-rules' );
			}
			if ( ! $reward_model->activateOrDeactivate( $id, $active ) ) {
				wp_send_json_error( [ 'message' => $message ] );
			}

			$message = __( 'Reward disabled successfully', 'wp-loyalty-rules' );
			if ( $active ) {
				$message = __( 'Reward activated successfully', 'wp-loyalty-rules' );
			}
			wp_send_json_success( [ 'message' => $message ] );
		} catch ( Exception $e ) {
			$message = __( 'Reward status change has failed', 'wp-loyalty-rules' );
		}
		wp_send_json_error( [ 'message' => $message ] );
	}

	/**
	 * Duplicate a reward.
	 *
	 * @return void
	 */
	public static function duplicate() {
		$input     = new Input();
		$reward_id = (int) $input->post_get( 'reward_id', 0 );
		if ( ! Util::isBasicSecurityValid( 'wlr-reward-nonce' ) || $reward_id <= 0 ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$reward_model = new Rewards();
		$reward       = $reward_model->getByKey( $reward_id );
		if ( empty( $reward ) || ! isset( $reward->id ) || (int) $reward->id <= 0 ) {
			wp_send_json_error( [ 'message' => __( 'Reward not found', 'wp-loyalty-rules' ) ] );
		}
		$reward->id       = 0;
		$reward->name     = $reward->name . '(' . __( 'copy', 'wp-loyalty-rules' ) . ')';
		$reward->ordering = 0;
		global $wpdb;
		$reward->conditions = ! empty( $reward->conditions ) ? json_decode( stripslashes( $reward->conditions ), true ) : [];
		$reward->point_rule = ! empty( $reward->point_rule ) ? json_decode( stripslashes( $reward->point_rule ), true ) : [];
		if ( ! empty( $reward->free_product ) ) {
			$reward->free_product = json_decode( stripslashes( $reward->free_product ) );
		}
		$id = $reward_model->save( (array) $reward );
		if ( $id <= 0 ) {
			wp_send_json_error( [
				'error'   => $wpdb->last_error,
				'message' => __( 'Reward could not be saved', 'wp-loyalty-rules' )
			] );
		}
		wp_send_json_success( [ 'message' => __( 'Reward duplicated successfully', 'wp-loyalty-rules' ) ] );
	}

	/**
	 * Retrieve a reward by its ID.
	 *
	 * @return void
	 */
	public static function get() {
		$data = [
			'success' => false,
			'data'    => null
		];
		if ( ! Util::isBasicSecurityValid( 'wlr-edit-reward-nonce' ) ) {
			wp_send_json( $data );
		}
		try {
			$input        = new Input();
			$id           = (int) $input->post_get( 'id', 0 );
			$reward_model = new Rewards();
			$reward       = $reward_model->getByKey( $id );
			if ( is_object( $reward ) && empty( $reward->coupon_type ) ) {
				$reward->coupon_type = "fixed_cart";
			}
			$data['data']    = $reward;
			$data['success'] = true;
		} catch ( Exception $e ) {
			$data['success'] = false;
			$data['data']    = null;
		}
		wp_send_json( $data );
	}

	public static function save() {
		if ( ! Util::isBasicSecurityValid( 'wlr-edit-reward-nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$input                     = new Input();
		$post_data                 = $input->post();
		$post_data['name']         = ! empty( $_REQUEST['name'] ) ? apply_filters( 'title_save_pre', sanitize_text_field( wp_unslash( ( $_REQUEST['name'] ) ) ) ) : '';//phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$post_data['description']  = ! empty( $_REQUEST['description'] ) ? apply_filters( 'title_save_pre', wp_kses_post( wp_unslash( ( $_REQUEST['description'] ) ) ) ) : '';// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$post_data['conditions']   = ! empty( $post_data['conditions'] ) ? json_decode( stripslashes( $post_data['conditions'] ), true ) : [];
		$post_data['free_product'] = ! empty( $post_data['free_product'] ) ? json_decode( stripslashes( $post_data['free_product'] ), true ) : [];
		if ( $post_data['discount_type'] != "points_conversion" && empty( $post_data['coupon_type'] ) ) {
			$post_data['coupon_type'] = "fixed_cart";
		}
		$validate_data = Validation::validateReward( $post_data );
		if ( is_array( $validate_data ) ) {
			foreach ( $validate_data as $key => $validate ) {
				$validate_data[ $key ] = [ current( $validate ) ];
			}
			wp_send_json_error( [
				'field_error' => $validate_data,
				'message'     => __( 'Basic validation failed', 'wp-loyalty-rules' )
			] );
		}
		$data = apply_filters( 'wlr_before_save_reward_validation', [] );
		if ( ! empty( $data ) ) {
			wp_send_json( $data );
		}
		$reward_model = new Rewards();
		$reward_id    = (int) $post_data['id'];
		$reward       = $reward_model->getByKey( $reward_id );
		if ( ! empty( $reward ) && $reward->reward_type == 'redeem_coupon' ) {
			$status = $reward_model->checkCampaignHaveReward( $reward_id );
			if ( $status ) {
				if ( isset( $post_data['reward_type'] ) && $post_data['reward_type'] == 'redeem_point' ) {
					wp_send_json_error( [ 'message' => __( 'Before change reward type, please remove reward in campaign.', 'wp-loyalty-rules' ) ] );
				}
				if ( isset( $post_data['active'] ) && $post_data['active'] == 0 ) {
					wp_send_json_error( [ 'message' => __( 'Before change active status, please remove reward in campaign.', 'wp-loyalty-rules' ) ] );
				}
			}
		}
		if ( ( ! isset( $data['success'] ) || $data['success'] ) ) {
			global $wpdb;
			try {
				// do save a campaign
				$reward_model = new Rewards();
				$id           = $reward_model->save( $post_data );
				$reward_type  = ( ! empty( $post_data['reward_type'] ) ) ? $post_data['reward_type'] : '';
				if ( $id <= 0 ) {
					wp_send_json_error( [
						'error'   => $wpdb->last_error,
						'message' => __( 'Reward not saved', 'wp-loyalty-rules' )
					] );
				}
				wp_send_json_success( [
					'redirect' => admin_url( 'admin.php?' . http_build_query( [
							'page'        => WLR_PLUGIN_SLUG,
							'view'        => 'edit_reward',
							'reward_type' => $reward_type,
							'id'          => $id
						] ) ),
					'message'  => __( 'Reward saved successfully', 'wp-loyalty-rules' )
				] );
			} catch ( Exception $e ) {
			}
		}
		wp_send_json_error( [ 'message' => __( 'Reward save has failed', 'wp-loyalty-rules' ) ] );
	}

	public static function freeProductOptions() {
		$data = [];
		if ( ! Util::isBasicSecurityValid( 'wlr-edit-reward-nonce' ) ) {
			$data['success'] = false;
			$data['data']    = null;
			wp_send_json( $data );
		}
		try {
			$input = new Input();
			$query = (string) $input->post_get( 'q', '' );
			//to disable other search classes
			remove_all_filters( 'woocommerce_data_stores' );
			$data_store = \WC_Data_Store::load( 'product' );
			$ids        = $data_store->search_products( $query, '', true, false, 20 );
			foreach ( $ids as $key => $post_id ) {
				if ( $post_id > 0 ) {
					$product_type = wc_get_product( $post_id )->get_type();
					if ( ! in_array( $product_type, [ 'simple', 'variable', 'variation' ] ) ) {
						unset( $ids[ $key ] );
					}
				}
			}
			$data['success'] = true;
			$data['data']    = array_values( array_map( function ( $post_id ) {
				return [
					'value' => (string) $post_id,
					'label' => '#' . $post_id . ' ' . html_entity_decode( esc_html( get_the_title( $post_id ) ), ENT_NOQUOTES, 'UTF-8' ),
				];

			}, array_filter( $ids ) ) );
		} catch ( Exception $e ) {
			$data['success'] = false;
			$data['data']    = null;
		}
		wp_send_json( $data );
	}
}