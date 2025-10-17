<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Controllers\Admin;

use Wlr\App\Controllers\Base;
use Wlr\App\Helpers\Validation;
use Wlr\App\Helpers\Woocommerce;
use Wlr\App\Models\Levels;
use Wlr\App\Models\Users;

defined( 'ABSPATH' ) or die;

class UserLevels extends Base {
	function getLevels() {
		$wlr_nonce = (string) self::$input->post_get( 'wlr_nonce', '' );
		$data      = array();
		if ( Woocommerce::hasAdminPrivilege() && Woocommerce::verify_nonce( $wlr_nonce, 'levels_nonce' ) ) {
			$limit     = (int) self::$input->post_get( 'limit', 5 );
			$post_data = self::$input->post();
			if ( ! isset( $data['success'] ) || $data['success'] === true ) {
				$validate_data = Validation::validateCommonFields( $post_data );
				if ( is_array( $validate_data ) ) {
					$data['success'] = false;
					$data['message'] = $validate_data;
				}
			}
			if ( ! isset( $data['success'] ) || $data['success'] === true ) {
				$query_data = array(
					'id'     => array(
						'operator' => '>',
						'value'    => 0
					),
					/*'filter_order' => (string)self::$input->post_get('filter_order', 'id'),
					'filter_order_dir' => (string)self::$input->post_get('filter_order_dir', 'DESC'),*/
					'limit'  => $limit,
					'offset' => (int) self::$input->post_get( 'offset', 0 )
				);
				$search     = (string) self::$input->post_get( 'search', '' );
				if ( ! empty( $search ) ) {
					$query_data['search'] = $search;
				}
				$condition_field = (string) self::$input->post_get( 'condition_field', 'all' );//active,in_active
				switch ( $condition_field ) {
					case 'active':
						$query_data['active'] = array( 'operator' => '=', 'value' => 1 );
						break;
					case 'in_active':
						$query_data['active'] = array( 'operator' => '=', 'value' => 0 );
						break;
					case 'all';
					default:
						break;
				}
				$condition_field = (string) self::$input->post_get( 'sorting_field', 'id_desc' );//id_desc,id_asc,name_asc,name_desc,active_asc,active_desc
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
				$level_table = new Levels();
				$items       = $level_table->getQueryData( $query_data, '*', array( 'name' ), true, false );
				$total_count = $level_table->getQueryData( $query_data, 'COUNT( DISTINCT id) as total_count', array( 'name' ), false );
				foreach ( $items as $item ) {
					$item->created_at = isset( $item->created_at ) && ! empty( $item->created_at ) ? self::$woocommerce->beforeDisplayDate( $item->created_at ) : '';
				}
				$data['success'] = true;
				$data['data']    = array(
					'items'       => $items,
					'total_count' => $total_count->total_count,
					'limit'       => $limit,
				);
			}
		}
		wp_send_json( $data );
	}

	function bulkAction() {
		$wlr_nonce   = (string) self::$input->post_get( 'wlr_nonce', '' );
		$action_mode = (string) self::$input->post_get( 'action_mode', '' );
		$level_model = new Levels();
		$data        = array(
			'success' => false,
			'data'    => array(
				'message' => $level_model->getBulkActionMessage( $action_mode )
			)
		);
		if ( Woocommerce::hasAdminPrivilege() && Woocommerce::verify_nonce( $wlr_nonce, 'levels_nonce' ) ) {
			$selected_list = (string) self::$input->post_get( 'selected_list', '' );
			$selected_list = explode( ',', $selected_list );
			if ( in_array( $action_mode, array( 'deactivate', 'delete' ) ) ) {
				$messages       = array();
				$success_status = false;
				foreach ( $selected_list as $id ) {
					$status = $level_model->checkCampaignHaveLevels( $id );
					$level  = $level_model->getByKey( $id );
					if ( $status ) {
						/* translators: %s: level name */
						$messages[] = sprintf( __( 'Please remove %s in campaign condition', 'wp-loyalty-rules' ), $level->name );
					} else {
						if ( $action_mode == 'deactivate' ) {
							$status = $level_model->activateOrDeactivate( $id );
						} elseif ( $action_mode == 'delete' ) {
							$status = $level_model->deleteById( $id );
						}
						if ( ! $status ) {
							/* translators: 1: name, 2: action mode */
							$messages[] = sprintf( __( '%1$s %2$s failed', 'wp-loyalty-rules' ), $level->name, $action_mode );
						} else {
							$success_status = true;
						}
					}
				}
				$data['data']['level_message'] = ! empty( $messages ) ? $messages : array();
				if ( $success_status ) {
					$data['success']         = true;
					$data['data']['message'] = $level_model->getBulkActionMessage( $action_mode, true );
				}
			} elseif ( $action_mode == 'activate' ) {
				if ( $level_model->bulkAction( $selected_list, $action_mode ) ) {
					$data['data']['message'] = $level_model->getBulkActionMessage( $action_mode, true );
					$data['success']         = true;
				}
			}
		}
		wp_send_json( $data );
	}

	function getLevelPopup() {
		$wlr_nonce = (string) self::$input->post_get( 'wlr_nonce', '' );
		$data      = array();
		if ( Woocommerce::hasAdminPrivilege() && Woocommerce::verify_nonce( $wlr_nonce, 'level_popup_nonce' ) ) {
			try {
				$id              = (int) self::$input->post_get( 'id', 0 );
				$level           = new Levels();
				$data['data']    = $level->getByKey( $id );
				$data['success'] = true;
			} catch ( \Exception $e ) {
				$data['success'] = false;
				$data['data']    = null;
			}
		} else {
			$data['success'] = false;
			$data['data']    = null;
		}
		wp_send_json( $data );
	}

	function saveLevel() {
		$wlr_nonce = (string) self::$input->post_get( 'wlr_nonce', '' );
		$response  = array(
			'success' => false,
			'data'    => array( 'message' => __( "You don't have access or invalid nonce", 'wp-loyalty-rules' ) )
		);
		if ( Woocommerce::hasAdminPrivilege() && Woocommerce::verify_nonce( $wlr_nonce, 'level_save_level' ) ) {
			$post_data     = self::$input->post();
			$validate_data = Validation::validateEditLevelFields( $post_data );
			if ( is_array( $validate_data ) ) {
				foreach ( $validate_data as $key => $validate ) {
					$validate_data[ $key ] = array( current( $validate ) );
				}
				$response = array(
					'success' => false,
					'data'    => array(
						'field_error' => $validate_data,
						'message'     => __( 'Levels not saved!', 'wp-loyalty-rules' )
					)
				);
				wp_send_json( $response );
			}
			try {
				$level                       = new Levels();
				$id                          = $level->save( $post_data );
				$response['data']['message'] = __( 'Level not saved!', 'wp-loyalty-rules' );
				if ( $id > 0 ) {
					$response = array(
						'success' => true,
						'data'    => array(
							'message' => __( 'Level saved successfully!', 'wp-loyalty-rules' ),
							'id'      => $id
						)
					);
				}
			} catch ( \Exception $e ) {
				$response = array(
					'success' => false,
					'data'    => array( 'message' => $e->getMessage() )
				);
			}
		}
		wp_send_json( $response );
	}

	function deleteLevel() {
		$wlr_nonce = (string) self::$input->post_get( 'wlr_nonce', '' );
		$data      = array(
			'success' => false,
			'data'    => array(
				'message' => __( 'Level delete failed', 'wp-loyalty-rules' )
			)
		);
		$id        = (int) self::$input->post_get( 'id', 0 );
		if ( Woocommerce::hasAdminPrivilege() && Woocommerce::verify_nonce( $wlr_nonce, 'level_delete_none' ) && $id > 0 ) {
			$level_model = new Levels();
			$status      = $level_model->checkCampaignHaveLevels( $id );
			if ( $status ) {
				$data['data']['message'] = __( 'Level used in campaign', 'wp-loyalty-rules' );
			}
			if ( ! $status && $level_model->deleteById( $id ) ) {
				$data['data']['message'] = __( 'Level deleted successfully', 'wp-loyalty-rules' );
				$data['success']         = true;
			}
		}
		wp_send_json( $data );
	}

	function toggleActiveLevel() {
		$wlr_nonce = (string) self::$input->post_get( 'wlr_nonce', '' );
		$data      = array(
			'success' => false,
			'message' => __( 'Levels status change failed', 'wp-loyalty-rules' )
		);
		if ( Woocommerce::hasAdminPrivilege() && Woocommerce::verify_nonce( $wlr_nonce, 'level_active_nonce' ) ) {
			$id                      = (int) self::$input->post_get( 'id', 0 );
			$level_table             = new Levels();
			$level                   = $level_table->getByKey( $id );
			$data['data']['message'] = __( 'Level status change failed', 'wp-loyalty-rules' );
			if ( ! empty( $level ) ) {
				$active  = (int) self::$input->post_get( 'active', 0 );
				$status  = $level_table->checkCampaignHaveLevels( $id );
				$message = __( 'Level disable failed', 'wp-loyalty-rules' );
				if ( $active ) {
					$message = __( 'Level activation failed', 'wp-loyalty-rules' );
				}
				if ( $status ) {
					$message = sprintf( __( 'Level used in campaign', 'wp-loyalty-rules' ), $level->name );
				}
				if ( ! $status && $level_table->activateOrDeactivate( $id, $active ) ) {
					$message = __( 'Level disabled successfully', 'wp-loyalty-rules' );
					if ( $active ) {
						$message = __( 'Level activated successfully', 'wp-loyalty-rules' );
					}
					$data['success'] = true;
				}
				$data['data'] = array(
					'message' => $message
				);
			}
		}
		wp_send_json( $data );
	}

	function updateLevelPreview() {
		$wlr_nonce = (string) self::$input->post_get( 'wlr_nonce', '' );
		$response  = array();
		if ( Woocommerce::hasAdminPrivilege() && Woocommerce::verify_nonce( $wlr_nonce, 'level_update_nonce' ) ) {
			$level_table         = new Users();
			$query_data          = array(
				'id' => array(
					'operator' => '>',
					'value'    => 0
				)
			);
			$levels              = $level_table->getQueryData( $query_data, 'COUNT( DISTINCT id) as total_count', array(), false, true );
			$response['success'] = true;
			$base_url            = admin_url( 'admin.php?' . http_build_query( array(
					'page' => WLR_PLUGIN_SLUG,
					'view' => 'levels'
				) ) );
			$response['data']    = array(
				'base_url'      => $base_url,
				'total_count'   => (int) $levels->total_count,
				'process_count' => 0,
				'limit_start'   => 0,
				'limit'         => (int) 10
			);
		} else {
			$response['success'] = false;
			$response['data']    = array(
				'message' => __( 'Customer level update failed', 'wp-loyalty-rules' )
			);
		}
		wp_send_json( $response );
	}

	function updateLevelProcess() {
		$wlr_nonce = (string) self::$input->post_get( 'wlr_nonce', '' );
		$data      = array(
			'success' => false,
			'data'    => array()
		);
		if ( Woocommerce::hasAdminPrivilege() && Woocommerce::verify_nonce( $wlr_nonce, 'level_update_nonce' ) ) {
			$limit_start = (int) self::$input->post_get( 'limit_start', 0 );
			$limit       = (int) self::$input->post_get( 'limit', 10 );
			$total_count = (int) self::$input->post_get( 'total_count', 0 );
			if ( $total_count > $limit_start ) {
				$query_data = array(
					'id'               => array(
						'operator' => '>',
						'value'    => 0
					),
					'filter_order'     => 'id',
					'filter_order_dir' => 'ASC',
					'limit'            => $limit,
					'offset'           => $limit_start
				);
				$user_model = new Users();
				$level_data = $user_model->getQueryData( $query_data, "*", array(), true, false );
				if ( ! empty( $level_data ) ) {
					foreach ( $level_data as $single_level ) {
						if ( $single_level->id > 0 ) {
							$update_data = array(
								'level_id' => $single_level->level_id
							);
							$user_model->insertOrUpdate( $update_data, $single_level->id );
						}
					}
				}
				$data['success']         = true;
				$data['data']['success'] = 'incomplete';
				$limit_start             = $limit_start + $limit;
				if ( $limit_start >= $total_count ) {
					$limit_start = $total_count;
				}
				$data['data']['limit_start'] = $limit_start;
				/* translators: %s: customer count */
				$data['data']['notification'] = sprintf( __( '%s customer level updated', 'wp-loyalty-rules' ), $limit_start );
			} else {
				$data['success']          = true;
				$data['data']['success']  = 'completed';
				$data['data']['message']  = __( 'Customer level updated successfully', 'wp-loyalty-rules' );
				$data['data']['redirect'] = admin_url( 'admin.php?' . http_build_query( array(
						'page' => WLR_PLUGIN_SLUG,
						'view' => 'levels'
					) ) );
			}
		} else {
			$data['success']         = false;
			$data['data']['success'] = 'error';
			$data['data']['message'] = __( 'Invalid request', 'wp-loyalty-rules' );
		}
		wp_send_json( $data );
	}

	function addLevelCondition( $conditions ) {
		if ( empty( $conditions ) ) {
			return $conditions;
		}
		$allowed_conditions = array(
			'point_for_purchase',
			'subtotal',
			'purchase_histories',
			'product_review',
			'birthday',
			'facebook_share',
			'twitter_share',
			'whatsapp_share',
			'email_share',
			'followup_share'
		);
		foreach ( $conditions as $key => &$condition ) {
			if ( isset( $key ) && in_array( $key, $allowed_conditions ) ) {
				if ( isset( $condition['Common'] ) && isset( $condition['Common']['options'] ) ) {
					$condition['Common']['options']['user_level'] = __( 'Customer Level', 'wp-loyalty-rules' );
				}
			}
		}

		return $conditions;
	}
}