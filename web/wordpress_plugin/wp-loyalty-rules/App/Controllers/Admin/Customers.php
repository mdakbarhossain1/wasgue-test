<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Controllers\Admin;
defined( 'ABSPATH' ) or die;

use Valitron\Validator;
use Wlr\App\Helpers\Input;
use Wlr\App\Helpers\Rewards;
use Wlr\App\Helpers\Util;
use Wlr\App\Helpers\Validation;
use Wlr\App\Helpers\Woocommerce;
use Wlr\App\Models\EarnCampaignTransactions;
use Wlr\App\Models\Logs;
use Wlr\App\Models\RewardTransactions;
use Wlr\App\Models\UserRewards;
use Wlr\App\Models\Users;
use Wlr\App\Helpers\Settings;

class Customers {
	/**
	 * Retrieves the list of customers with additional information.
	 *
	 * @return void
	 */
	public static function gets() {
		if ( ! Util::isBasicSecurityValid( 'wlr-user-nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$input         = new Input();
		$post_data     = $input->post();
		$validate_data = Validation::validateCommonFields( $post_data );
		if ( is_array( $validate_data ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$user               = new Users();
		$query_data         = self::getQueryData();
		$items              = $user->getQueryData( $query_data, '*', [ 'user_email', 'refer_code' ], true, false );
		$total_count        = $user->getQueryData( $query_data, 'COUNT( DISTINCT id) as total_count', [
			'user_email',
			'refer_code'
		], false );
		$reward_helper      = Rewards::getInstance();
		$woocommerce_helper = Woocommerce::getInstance();
		foreach ( $items as $item ) {
			$item->referral_link                = ! empty( $item->refer_code ) ? $reward_helper->getReferralUrl( $item->refer_code ) : '';
			$item->birthday_date                = empty( $item->birthday_date ) || $item->birthday_date == '0000-00-00' ? ( ! empty( $item->birth_date ) ? $woocommerce_helper->beforeDisplayDate( $item->birth_date, 'Y-m-d' ) : '' ) : $item->birthday_date;
			$item->birthday_date_display_format = empty( $item->birthday_date ) ? '-' : $woocommerce_helper->convertDateFormat( $item->birthday_date );
			$item->earned_rewards               = $reward_helper->getUserRewardCount( $item->user_email );
			$item->used_rewards                 = $reward_helper->getUserRewardCount( $item->user_email, 'used' );
			$item->level_data                   = isset( $item->level_id ) && $item->level_id > 0 ? $reward_helper->getLevel( $item->level_id ) : null;
			$item->created_date                 = ! empty( $item->created_date ) ? $woocommerce_helper->beforeDisplayDate( $item->created_date ) : '';
		}
		wp_send_json_success( [
			'item'        => $items,
			'total_count' => $total_count->total_count,
			'limit'       => (int) $input->post_get( 'limit', 5 )
		] );
	}

	/**
	 * Retrieves the query data based on the input parameters.
	 *
	 * @return array The query data array.
	 */
	protected static function getQueryData() {
		$input           = new Input();
		$condition_field = (string) $input->post_get( 'sorting_field', 'all' );
		switch ( $condition_field ) {
			case 'email_asc':
				$filter_order     = 'user_email';
				$filter_order_dir = 'ASC';
				break;
			case 'email_desc':
				$filter_order     = 'user_email';
				$filter_order_dir = 'DESC';
				break;
			case 'level_asc':
				$filter_order     = 'level_id';
				$filter_order_dir = 'ASC';
				break;
			case 'level_desc':
				$filter_order     = 'level_id';
				$filter_order_dir = 'DESC';
				break;
			case 'point_asc':
				$filter_order     = 'points';
				$filter_order_dir = 'ASC';
				break;
			case 'point_desc':
				$filter_order     = 'points';
				$filter_order_dir = 'DESC';
				break;
			case 'id_asc':
				$filter_order     = 'id';
				$filter_order_dir = 'ASC';
				break;
			default:
				$filter_order     = 'id';
				$filter_order_dir = 'DESC';
				break;
		}
		$limit      = (int) $input->post_get( 'limit', 5 );
		$query_data = [
			'id'               => [
				'operator' => '>',
				'value'    => 0
			],
			'filter_order'     => $filter_order,
			'filter_order_dir' => $filter_order_dir,
			'limit'            => $limit,
			'offset'           => (int) $input->post_get( 'offset', 0 )
		];
		$search     = (string) $input->post_get( 'search', '' );
		if ( ! empty( $search ) ) {
			$query_data['search'] = sanitize_text_field( $search );
		}

		return apply_filters( 'wlr_customers_query_data', $query_data );
	}

	/**
	 * Handles the bulk delete operation for users.
	 *
	 * @return void
	 */
	public static function handleBulkDelete() {
		if ( ! Util::isBasicSecurityValid( 'wlr-user-nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$input       = new Input();
		$user_list   = (string) $input->post_get( 'user_list', '' );
		$user_list   = explode( ',', $user_list );
		$user_model  = new Users();
		$failed_list = [];
		foreach ( $user_list as $user_id ) {
			$user = $user_model->getByKey( (int) $user_id );
			if ( ! empty( $user ) && ! empty( $user->user_email ) && ! self::deleteCustomers( $user ) ) {
				$failed_list[] = $user->user_email;
			}
		}
		if ( empty( $failed_list ) ) {
			wp_send_json_success( [ 'message' => __( 'Customer deleted Successfully', 'wp-loyalty-rules' ) ] );
		}
		wp_send_json_error( [
			'message'   => __( 'Customer delete failed', 'wp-loyalty-rules' ),
			'customers' => $failed_list
		] );
	}

	/**
	 * Deletes a customer and associated data from the database.
	 *
	 * @param object $user The user object containing the customer information.
	 *
	 * @return bool True if the customer and associated data were successfully deleted, false otherwise.
	 */
	public static function deleteCustomers( $user ) {
		if ( empty( $user ) || ! is_object( $user ) ) {
			return false;
		}
		$user_email = ! empty( $user->user_email ) ? $user->user_email : '';
		if ( empty( $user_email ) ) {
			return false;
		}
		$user_model          = new Users();
		$earn_campaign_model = new EarnCampaignTransactions();
		$reward_trans_model  = new RewardTransactions();
		$user_reward_model   = new UserRewards();
		$log_table           = new Logs();
		$base_helper         = new \Wlr\App\Helpers\Base();
		$condition           = [
			'user_email' => $user_email
		];
		$status              = $user_model->deleteRow( $condition );
		$log_table->deleteRow( $condition );
		$earn_campaign_model->deleteRow( $condition );
		$reward_trans_model->deleteRow( $condition );
		$user_condition = [
			'email' => $user_email
		];
		$user_reward_model->deleteRow( $user_condition );
		$ledger_data = [
			'user_email'          => $user_email,
			'action_type'         => 'user_removed',
			'action_process_type' => 'user_removed',
			'note'                => __( 'User full available point debited', 'wp-loyalty-rules' ),
			'created_at'          => strtotime( gmdate( "Y-m-d H:i:s" ) ),
			'points'              => (int) $user->points
		];
		$base_helper->updatePointLedger( $ledger_data, 'debit' );

		return apply_filters( 'wlr_delete_customer', $status, $condition );
	}

	/**
	 * Retrieves a customer and deletes them from the system.
	 *
	 * @return void
	 */
	public static function delete() {
		if ( ! Util::isBasicSecurityValid( 'wlr-user-nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$input       = new Input();
		$customer_id = (int) $input->post_get( 'id', 0 );
		if ( $customer_id <= 0 ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$user_model = new Users();
		$user       = $user_model->getByKey( $customer_id );
		if ( ! empty( $user ) && is_object( $user ) && ! empty( $user->user_email ) && self::deleteCustomers( $user ) ) {
			wp_send_json_success( [ 'message' => __( 'Customer deleted Successfully', 'wp-loyalty-rules' ) ] );
		}
		wp_send_json_error( [ 'message' => __( 'Customer delete failed', 'wp-loyalty-rules' ) ] );
	}

	/**
	 * Retrieves the customer activity log.
	 *
	 * @return void
	 */
	public static function getActivityLog() {
		if ( ! Util::isBasicSecurityValid( 'wlr-user-detail-nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$input         = new Input();
		$post_data     = $input->post();
		$validate_data = Validation::validateCommonFields( $post_data );
		if ( is_array( $validate_data ) ) {
			wp_send_json_error( [
				'field_error' => $validate_data,
				'message'     => __( 'Basic validation failed', 'wp-loyalty-rules' )
			] );
		}
		$query_data = self::getActivityQueryData();
		if ( empty( $query_data ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$limit              = (int) $input->post_get( 'limit', 5 );
		$log_model          = new Logs();
		$items              = $log_model->getQueryData( $query_data, '*', [], true, false );
		$woocommerce_helper = Woocommerce::getInstance();
		foreach ( $items as $item ) {
			$item->created_at = $woocommerce_helper->beforeDisplayDate( $item->created_at, 'D j M Y H:i:s' );
		}
		$total_count = $log_model->getQueryData( $query_data, 'COUNT( DISTINCT id) as total_count', [], false );
		wp_send_json_success( [
			'items'       => $items,
			'total_count' => $total_count->total_count,
			'limit'       => $limit
		] );
	}

	/**
	 * Retrieves the query data for fetching customer activity.
	 *
	 * @return array The query data for fetching customer activity.
	 */
	protected static function getActivityQueryData() {
		$input = new Input();
		$email = (string) $input->post_get( 'email', '' );
		if ( empty( $email ) ) {
			return [];
		}
		$email = sanitize_email( $email );
		$limit = (int) $input->post_get( 'limit', 5 );

		return [
			'id'               => [
				'operator' => '>',
				'value'    => 0
			],
			'user_email'       => [
				'operator' => '=',
				'value'    => $email
			],
			'filter_order'     => (string) $input->post_get( 'filter_order', 'id' ),
			'filter_order_dir' => (string) $input->post_get( 'filter_order_dir', 'DESC' ),
			'limit'            => $limit,
			'offset'           => (int) $input->post_get( 'offset', 0 )
		];
	}

	/**
	 * Get customer details.
	 *
	 * @return void
	 */
	public static function get() {
		if ( ! Util::isBasicSecurityValid( 'wlr-user-detail-nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$input = new Input();
		$id    = (int) $input->post_get( 'id', 0 );

		if ( $id <= 0 ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$data = [];
		try {
			$point_user = new Users();
			$user       = $point_user->getByKey( $id );
			if ( empty( $user ) || ! is_object( $user ) ) {
				wp_send_json_error( [ 'message' => __( 'Customer not found', 'wp-loyalty-rules' ) ] );
			}
			$reward_helper      = Rewards::getInstance();
			$woocommerce_helper = Woocommerce::getInstance();
			$user_data          = get_user_by( 'email', $user->user_email );
			$user->display_name = '';
			if ( ! empty( $user_data ) ) {
				$user->user_data    = get_metadata( 'user', $user_data->ID, '', true );
				$user->display_name = (string) ( is_object( $user_data ) && isset( $user_data->data->user_nicename ) && ! empty( $user_data->data->user_nicename ) ? $user_data->data->user_nicename : $user_data->data->display_name );
			}
			$user->referral_link                = ! empty( $user->refer_code ) ? $reward_helper->getReferralUrl( $user->refer_code ) : '';
			$user->birthday_date                = empty( $user->birthday_date ) || $user->birthday_date == '0000-00-00' ? ( ! empty( $user->birth_date ) ? $woocommerce_helper->beforeDisplayDate( $user->birth_date, 'Y-m-d' ) : '' ) : $user->birthday_date;
			$user->birthday_date_display_format = empty( $user->birthday_date ) ? '-' : $woocommerce_helper->convertDateFormat( $user->birthday_date );
			$user->earned_rewards               = $reward_helper->getUserRewardCount( $user->user_email );
			$user->used_rewards                 = $reward_helper->getUserRewardCount( $user->user_email, 'used' );
			$user->transaction_price            = $reward_helper->getUserTotalTransactionAmount( $user->user_email );
			$user->level_data                   = isset( $user->level_id ) && $user->level_id > 0 ? $reward_helper->getLevel( $user->level_id ) : null;
			$user->created_date                 = ! empty( $user->created_date ) ? $woocommerce_helper->beforeDisplayDate( $user->created_date ) : '';

			$data['success'] = true;
			$data['data']    = $user;
		} catch ( \Exception $e ) {
			$data['success'] = false;
			$data['data']    = [
				'message' => __( 'Invalid customer id', 'wp-loyalty-rules' )
			];
		}
		wp_send_json( $data );
	}

	public static function updateBirthday() {
		if ( ! Util::isBasicSecurityValid( 'wlr_common_user_nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$input = new Input();
		$id    = (int) $input->post_get( 'id', 0 );
		if ( $id <= 0 ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$birth_date = $input->post_get( 'birth_date', '' );
		if ( empty( $birth_date ) ) {
			wp_send_json_error( [ 'message' => __( 'The birth date should not be empty', 'wp-loyalty-rules' ) ] );
		}
		$validator = new Validator( $birth_date );
		Validator::addRule( 'dateORNull', [
			Validation::class,
			'validateDateORNull'
		], __( '{field} should be a valid date', 'wp-loyalty-rules' ) );
		$validator->labels( [ 'birth_date' => __( 'Birth date', 'wp-loyalty-rules' ) ] );
		$validator->rule( 'dateORNull', [ 'birth_date' ] )->message( __( '{field} should be a valid date', 'wp-loyalty-rules' ) );
		if ( ! $validator->validate() ) {
			$validate_data = $validator->errors();
			foreach ( $validate_data as $key => $validate ) {
				$validate_data[ $key ] = array( current( $validate ) );
			}
			wp_send_json_error( [
				'field_error' => $validate_data,
				'message'     => __( 'Failed to validate the birthday input', 'wp-loyalty-rules' )
			] );
		}
		$point_user = new Users();
		$user       = $point_user->getByKey( $id );
		if ( empty( $user ) ) {
			wp_send_json_error( [ 'message' => __( 'Invalid customer id', 'wp-loyalty-rules' ) ] );
		}
		$woocommerce_helper = Woocommerce::getInstance();
		$old_birth_date     = ! empty( $user->birthday_date ) ? $user->birthday_date : $woocommerce_helper->beforeDisplayDate( $user->birth_date, 'Y-m-d' );
		$action_data        = [
			'user_email'          => $user->user_email,
			'points'              => 0,
			'birthday_date'       => ! empty( $birth_date ) ? $woocommerce_helper->convertDateFormat( $birth_date, 'Y-m-d' ) : null,
			'action_type'         => 'birthday_change',
			'action_process_type' => 'admin_change',
			/* translators: %s: birthday date */
			'customer_note'       => sprintf( __( 'Birthday has been changed by the site administrator. The new value is %s', 'wp-loyalty-rules' ), $birth_date ),
			/* translators: 1: customer email, 2: old birthday date, 3: new birthday date, 4: admin email */
			'note'                => sprintf( __( '%1$s customer birthday changed from %2$s to %3$s by store admin(%4$s)', 'wp-loyalty-rules' ), $user->user_email, $old_birth_date, $birth_date, $woocommerce_helper->get_email_by_id( get_current_user_id() ) ),
		];
		$base               = new \Wlr\App\Helpers\Base();
		$base->addExtraPointAction( 'admin_change', 0, $action_data, 'credit', false );
		wp_send_json_success( [ 'message' => __( 'Customer birthday updated successfully', 'wp-loyalty-rules' ) ] );
	}

	/**
	 * Update point with command.
	 *
	 * @return void
	 */
	public static function updatePointWithCommand() {
		if ( ! Util::isBasicSecurityValid( 'wlr_common_user_nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic verification failed', 'wp-loyalty-rules' ) ] );
		}
		$input      = new Input();
		$id         = (int) $input->post_get( 'id', 0 );
		$points     = (int) $input->post_get( 'points', 0 );
		$point_type = (string) $input->post_get( 'action_type', 'add' );
		if ( $id <= 0 || $points <= 0 || ! in_array( $point_type, [ 'add', 'reduce', 'overwrite' ] ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic verification failed', 'wp-loyalty-rules' ) ] );
		}
		$customer_command = (string) $input->post_get( 'comments', '' );
		$post_data        = $input->post();
		$validate_data    = Validation::validateCustomerPointUpdate( $post_data );
		if ( is_array( $validate_data ) ) {
			foreach ( $validate_data as $key => $validate ) {
				$validate_data[ $key ] = [ current( $validate ) ];
			}
			wp_send_json_error( [
				'field_error' => $validate_data,
				'message'     => __( 'Customer could not be saved', 'wp-loyalty-rules' )
			] );
		}
		$point_user = new Users();
		$user       = $point_user->getByKey( $id );
		if ( empty( $user ) ) {
			wp_send_json_error( [ 'message' => __( 'Invalid customer id', 'wp-loyalty-rules' ) ] );
		}
		$woocommerce_helper = Woocommerce::getInstance();
		$is_banned_user     = $woocommerce_helper->isBannedUser( $user->user_email );
		if ( $is_banned_user ) {
			wp_send_json_error( [ 'message' => __( 'This email is banned user, unban to update points', 'wp-loyalty-rules' ) ] );
		}
		$data = [];

		$action_type = 'admin_change';
		$action_data = [
			'user_email'    => $user->user_email,
			'action_type'   => $action_type,
			// translators: 1: point label 2: points
			'customer_note' => sprintf( __( '%1$s value changed to %2$d by store administrator(s)', 'wp-loyalty-rules' ), Settings::getPointLabel( $points ), $points ),
			// translators: 1: customer email, 2: point label, 3: old points, 4: new points, 5: admin email
			'note'          => sprintf( __( '%1$s customer %2$s value changed from %3$d to %4$d by store administrator(%5$s)', 'wp-loyalty-rules' ), $user->user_email, Settings::getPointLabel( $points ), $user->points, $points, $woocommerce_helper->get_email_by_id( get_current_user_id() ) )
		];
		$trans_type  = 'credit';
		if ( $point_type == 'add' ) {
			$action_data['points']              = $points;
			$action_data['action_process_type'] = 'earn_point';
			/* translators: 1: point label, 2: points */
			$action_data['customer_note'] = sprintf( __( '%1$s %2$s added by store administrator', 'wp-loyalty-rules' ), Settings::getPointLabel( $points ), $points );
			/* translators: 1: point label, 2: points */
			$action_data['note'] = sprintf( __( '%1$s %2$s added by store administrator', 'wp-loyalty-rules' ), Settings::getPointLabel( $points ), $points );
		} elseif ( $point_type == 'reduce' ) {
			if ( $points > $user->points ) {
				$points = $user->points;
			}
			if ( $points <= 0 ) {
				$data['success'] = false;
				$data['data']    = [
					/* translators: %s: point label */
					'message' => sprintf( __( 'Current user %s must be greater then zero', 'wp-loyalty-rules' ), Settings::getPointLabel( $points ) )
				];
				wp_send_json( $data );
			}
			$trans_type                         = 'debit';
			$action_data['points']              = $points;
			$action_data['action_process_type'] = 'reduce_point';
			/* translators: 1: point label, 2: points */
			$action_data['customer_note'] = sprintf( __( '%1$s %2$s subtract by store administrator(s)', 'wp-loyalty-rules' ), Settings::getPointLabel( $points ), $points );
			/* translators: 1: point label, 2: points */
			$action_data['note'] = sprintf( __( '%1$s %2$s subtract by store administrator(s)', 'wp-loyalty-rules' ), Settings::getPointLabel( $points ), $points );
		} elseif ( $point_type == 'overwrite' ) {
			if ( $points >= $user->points ) {
				$added_point                        = (int) ( $points - $user->points );
				$action_data['points']              = $added_point;
				$action_data['action_process_type'] = 'earn_point';
			} elseif ( $points < $user->points ) {
				$reduced_point                      = ( $user->points - $points );
				$action_data['points']              = $reduced_point;
				$trans_type                         = 'debit';
				$action_data['action_process_type'] = 'reduce_point';
			}
			// translators: 1: customer email, 2: point label, 3: old points, 4: new points, 5: admin email
			$action_data['customer_note'] = sprintf( __( '%1$s customer %2$s value changed from %3$d to %4$d by store administrator(%5$s)', 'wp-loyalty-rules' ), $user->user_email, Settings::getPointLabel( $points ), $user->points, $points, $woocommerce_helper->get_email_by_id( get_current_user_id() ) );
			// translators: 1: customer email, 2: point label, 3: old points, 4: new points, 5: admin email
			$action_data['note'] = sprintf( __( '%1$s customer %2$s value changed from %3$d to %4$d by store administrator(%5$s)', 'wp-loyalty-rules' ), $user->user_email, Settings::getPointLabel( $points ), $user->points, $points, $woocommerce_helper->get_email_by_id( get_current_user_id() ) );
		}
		$data['success'] = false;
		$message         = __( 'Customer point updated failed', 'wp-loyalty-rules' );
		$action_data     = apply_filters( 'wlr_before_update_customer_point', $action_data );
		$base            = new \Wlr\App\Helpers\Base();
		if ( isset( $action_data['points'] ) && $action_data['points'] > 0 ) {
			if ( ! empty( $customer_command ) ) {
				$action_data['customer_command'] = $customer_command;
			}
			$base->addExtraPointAction( $action_type, $action_data['points'], $action_data, $trans_type );
			$data['success'] = true;
			$message         = __( 'Customer point updated successfully', 'wp-loyalty-rules' );
		}
		$data['data'] = [
			'message' => $message
		];
		$data         = apply_filters( 'wlr_after_update_customer_point', $data, $action_data );
		wp_send_json( $data );
	}

	/**
	 * Get customer transaction.
	 *
	 * @return void
	 */
	public static function getTransaction() {
		if ( ! Util::isBasicSecurityValid( 'wlr-user-detail-nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic verification failed', 'wp-loyalty-rules' ) ] );
		}
		$input         = new Input();
		$post_data     = $input->post();
		$validate_data = Validation::validateCommonFields( $post_data );
		if ( is_array( $validate_data ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic verification failed', 'wp-loyalty-rules' ) ] );
		}
		$query_data = self::getTransactionQueryData();
		if ( empty( $query_data ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic verification failed', 'wp-loyalty-rules' ) ] );
		}
		$earn_transaction   = new EarnCampaignTransactions();
		$items              = $earn_transaction->getQueryData( $query_data, 'id,action_type,order_id,order_currency,order_total,points,display_name,transaction_type,customer_command,created_at', [
			'order_id',
			'display_name'
		], true, false );
		$total_count        = $earn_transaction->getQueryData( $query_data, 'COUNT( DISTINCT id) as total_count', [
			'order_id',
			'display_name'
		], false );
		$earn_helper        = \Wlr\App\Helpers\EarnCampaign::getInstance();
		$woocommerce_helper = Woocommerce::getInstance();
		foreach ( $items as &$item ) {
			$item->order_total      = wc_price( $item->order_total, [ 'currency' => empty( $item->order_currency ) ? get_woocommerce_currency() : $item->order_currency ] );
			$item->action_name      = $earn_helper->getActionName( $item->action_type );
			$item->customer_command = ! empty( $item->customer_command ) ? stripslashes( $item->customer_command ) : '';
			$item->order_link       = $woocommerce_helper->getOrderLink( $item->order_id );
			$item->currency_symbol  = get_woocommerce_currency_symbol( $item->order_currency );
			$item->created_at       = ! empty( $item->created_at ) ? $woocommerce_helper->beforeDisplayDate( $item->created_at ) : '';
			$item                   = apply_filters( 'wlr_customer_transaction_before_display', $item );
		}
		wp_send_json_success( [
			'items'       => $items,
			'total_count' => $total_count->total_count,
			'limit'       => (int) $input->post_get( 'limit', 5 )
		] );
	}

	/**
	 * Get transaction query data.
	 *
	 * @return array
	 */
	public static function getTransactionQueryData() {
		$input = new Input();
		$email = (string) $input->post_get( 'email', '' );
		if ( empty( $email ) ) {
			return [];
		}
		$email      = sanitize_email( $email );
		$limit      = (int) $input->post_get( 'limit', 5 );
		$query_data = [
			'id'               => [
				'operator' => '>',
				'value'    => 0
			],
			'user_email'       => [
				'operator' => '=',
				'value'    => $email
			],
			'filter_order'     => (string) $input->post_get( 'filter_order', 'id' ),
			'filter_order_dir' => (string) $input->post_get( 'filter_order_dir', 'DESC' ),
			'limit'            => $limit,
			'offset'           => (int) $input->post_get( 'offset', 0 )
		];
		$search     = (string) $input->post_get( 'transaction_search', '' );
		if ( ! empty( $search ) ) {
			$query_data['search'] = sanitize_text_field( $search );
		}

		return $query_data;
	}

	/**
	 * Get customer rewards.
	 *
	 * @return void
	 */
	public static function getRewards() {
		if ( ! Util::isBasicSecurityValid( 'wlr-user-detail-nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic verification failed', 'wp-loyalty-rules' ) ] );
		}
		$input         = new Input();
		$post_data     = $input->post();
		$validate_data = Validation::validateCommonFields( $post_data );
		if ( is_array( $validate_data ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic verification failed', 'wp-loyalty-rules' ) ] );
		}
		$query_data = self::getRewardQueryData();
		if ( empty( $query_data ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic verification failed', 'wp-loyalty-rules' ) ] );
		}
		$earn_helper        = new \Wlr\App\Helpers\EarnCampaign();
		$user_reward        = new UserRewards();
		$items              = $user_reward->getQueryData( $query_data, '*', [
			'discount_code',
			'display_name'
		], true, false );
		$total_count        = $user_reward->getQueryData( $query_data, 'COUNT( DISTINCT id) as total_count', [
			'discount_code',
			'display_name'
		], false );
		$woocommerce_helper = Woocommerce::getInstance();
		foreach ( $items as $item ) {
			if ( isset( $item->discount_code ) && in_array( $item->reward_type, [ 'redeem_coupon', 'redeem_point' ] )
			     && $item->status === 'active' ) {
				$coupon      = new \WC_Coupon( $item->discount_code );
				$usage_count = $coupon->get_usage_count();
				if ( isset( $usage_count ) && $usage_count >= 1 ) {
					$item->status = 'used';
				}
			}
			$item->action_name                 = $earn_helper->getActionName( $item->action_type );
			$item->end_at_converted            = empty( $item->end_at ) ? '-' : $woocommerce_helper->beforeDisplayDate( $item->end_at );
			$item->end_at                      = empty( $item->end_at ) ? '-' : $woocommerce_helper->beforeDisplayDate( $item->end_at, 'Y-m-d' );
			$item->start_at                    = $woocommerce_helper->beforeDisplayDate( $item->start_at, 'D j M Y H:i:s' );
			$item->created_at                  = $woocommerce_helper->beforeDisplayDate( $item->created_at );
			$item->currency_symbol             = get_woocommerce_currency_symbol( $item->reward_currency );
			$item->expire_email_date_converted = empty( $item->expire_email_date ) ? '-' : $woocommerce_helper->beforeDisplayDate( $item->expire_email_date );
			$item->expire_email_date           = empty( $item->expire_email_date ) ? '-' : $woocommerce_helper->beforeDisplayDate( $item->expire_email_date, 'Y-m-d' );
		}
		wp_send_json_success( [
			'items'       => $items,
			'total_count' => $total_count->total_count,
			'limit'       => (int) $input->post_get( 'limit', 5 )
		] );
	}

	/**
	 * Get reward query data.
	 *
	 * @return array
	 */
	protected static function getRewardQueryData() {
		$input = new Input();
		$email = (string) $input->post_get( 'email', '' );
		if ( empty( $email ) ) {
			return [];
		}
		$email      = sanitize_email( $email );
		$query_data = [
			'id'               => [
				'operator' => '>',
				'value'    => 0
			],
			'email'            => [
				'operator' => '=',
				'value'    => $email
			],
			'filter_order'     => (string) $input->post_get( 'filter_order', 'id' ),
			'filter_order_dir' => (string) $input->post_get( 'filter_order_dir', 'DESC' ),
			'limit'            => (int) $input->post_get( 'limit', 5 ),
			'offset'           => (int) $input->post_get( 'offset', 0 )
		];
		$search     = (string) $input->post_get( 'reward_search', '' );
		if ( ! empty( $search ) ) {
			$query_data['search'] = sanitize_text_field( $search );
		}

		return $query_data;
	}

	/**
	 * Update expire dates.
	 *
	 * @return void
	 */
	public static function updateExpiryDates() {
		if ( ! Util::isBasicSecurityValid( 'wlr-user-detail-nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic verification failed', 'wp-loyalty-rules' ) ] );
		}
		$input     = new Input();
		$reward_id = (int) $input->post_get( 'reward_id', 0 );
		if ( $reward_id <= 0 ) {
			wp_send_json_error( [ 'message' => __( 'Basic verification failed', 'wp-loyalty-rules' ) ] );
		}

		$user_reward        = new UserRewards();
		$single_user_reward = $user_reward->getByKey( $reward_id );
		if ( ! isset( $single_user_reward->id ) || $single_user_reward->id <= 0 ) {
			wp_send_json_error( [ 'message' => __( 'Basic verification failed', 'wp-loyalty-rules' ) ] );
		}
		$end_at             = (string) $input->post_get( 'end_at', '' );
		$expire_email_date  = $input->post_get( 'expire_email_date', '' );
		$change_type        = (string) $input->post_get( 'change_type', '' );
		$expire_date_name   = '';
		$update_data        = [];
		$action_type        = 'expire_date_change';
		$woocommerce_helper = Woocommerce::getInstance();
		if ( ! empty( $end_at ) && $end_at != '-' && $change_type == 'expiry_date' ) {
			$end_at                = $end_at . ' 23:59:59';
			$expire_date_name      = __( "expire date", 'wp-loyalty-rules' );
			$update_data['end_at'] = $woocommerce_helper->beforeSaveDate( $end_at );
		}
		if ( ! empty( $expire_email_date ) && $expire_email_date != '-' && $change_type == 'expiry_email' ) {
			$expire_email_date                = $expire_email_date . ' 23:59:59';
			$expire_date_name                 = __( "expire email date", 'wp-loyalty-rules' );
			$update_data['expire_email_date'] = $woocommerce_helper->beforeSaveDate( $expire_email_date );
			$action_type                      = 'expire_email_date_change';
		}
		$expire_email_date_field = isset( $update_data['expire_email_date'] ) && $update_data['expire_email_date'] != '-' ? $update_data['expire_email_date'] : $single_user_reward->expire_email_date;
		$end_at_field            = isset( $update_data['end_at'] ) && $update_data['end_at'] != '-' ? $update_data['end_at'] : $single_user_reward->end_at;
		$reward_update_status    = false;
		if ( ! empty( $update_data ) ) {
			$reward_condition     = [
				'id' => $single_user_reward->id
			];
			$reward_update_status = $user_reward->updateRow( $update_data, $reward_condition );
		}
		if ( $reward_update_status ) {
			$log_data = [
				'user_email'          => $single_user_reward->email,
				'action_type'         => $action_type,
				// translators: 1: customer email, 2: expire date name, 3: admin email
				'note'                => sprintf( __( '%1$s %2$s updated by admin(%3$s)', 'wp-loyalty-rules' ), $single_user_reward->email, $expire_date_name, $woocommerce_helper->get_email_by_id( get_current_user_id() ) ),
				'customer_note'       => __( 'Added to reward program by site admin', 'wp-loyalty-rules' ),
				'user_reward_id'      => $single_user_reward->id,
				'reward_id'           => $single_user_reward->reward_id,
				'campaign_id'         => $single_user_reward->campaign_id,
				'admin_id'            => get_current_user_id(),
				'created_at'          => strtotime( gmdate( 'Y-m-d H:i:s' ) ),
				'expire_email_date'   => $expire_email_date_field,
				'expire_date'         => $end_at_field,
				'reward_display_name' => $single_user_reward->display_name,
				'discount_code'       => $single_user_reward->discount_code,
				'action_process_type' => $change_type,
			];
			$base     = new \Wlr\App\Helpers\Base();
			$base->add_note( $log_data );
			//Need to update woocommerce coupon expire date
			if ( ! empty( $single_user_reward->discount_code ) ) {
				$id = wc_get_coupon_id_by_code( $single_user_reward->discount_code );
				if ( $id > 0 ) {
					update_post_meta( $id, 'expiry_date', gmdate( 'Y-m-d', $end_at_field ) );
					update_post_meta( $id, 'date_expires', $end_at_field );
				}
			}
		}
		// translators: %s: expire date name
		wp_send_json_success( [ 'message' => sprintf( __( 'The %s has been updated successfully', 'wp-loyalty-rules' ), $expire_date_name ) ] );
	}

	/**
	 * Toggle banned user.
	 *
	 * @return void
	 */
	public static function toggleIsBannedUser() {
		if ( ! Util::isBasicSecurityValid( 'wlr_common_user_nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$input   = new Input();
		$user_id = (int) $input->post_get( 'user_id', 0 );
		if ( empty( $user_id ) ) {
			wp_send_json_error( [ 'message' => __( 'Ban user update failed', 'wp-loyalty-rules' ) ] );
		}
		$user_email     = (string) $input->post_get( 'email', '' );
		$is_banned_user = (int) $input->post_get( 'is_banned_user', 1 );
		$user_model     = new Users();
		global $wpdb;
		$where     = $wpdb->prepare( 'id = %d AND user_email = %s', [ $user_id, $user_email ] );
		$user_data = $user_model->getWhere( $where );
		$status    = false;
		if ( ! empty( $user_data ) && is_object( $user_data ) && isset( $user_data->id ) && $user_data->id > 0 ) {
			$status = $user_model->insertOrUpdate( [ 'is_banned_user' => (int) $is_banned_user ], $user_id );
		}
		if ( $status ) {
			wp_send_json_success( [ 'message' => __( 'Ban user updated successfully.', 'wp-loyalty-rules' ) ] );
		}
		wp_send_json_error( [ 'message' => __( 'Ban user update failed', 'wp-loyalty-rules' ) ] );
	}

	/**
	 * Toggle email send.
	 *
	 * @return void
	 */
	public static function toggleEMailSend() {
		if ( ! Util::isBasicSecurityValid( 'wlr_common_user_nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$input             = new Input();
		$user_email        = (string) $input->post_get( 'email', '' );
		$enable_sent_email = (int) $input->post_get( 'is_allow_send_email', 1 );
		if ( Users::updateSentEmailData( $user_email, $enable_sent_email ) ) {
			wp_send_json_success( [ 'message' => __( 'Email Opt-in updated successfully.', 'wp-loyalty-rules' ) ] );
		}
		wp_send_json_error( [ 'message' => __( 'Email Opt-in update failed', 'wp-loyalty-rules' ) ] );
	}
}