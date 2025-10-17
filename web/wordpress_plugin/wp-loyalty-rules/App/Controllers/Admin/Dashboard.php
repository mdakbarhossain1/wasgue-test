<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Controllers\Admin;
defined( 'ABSPATH' ) or die;

use DateTime;
use DateTimeZone;
use Exception;
use Wlr\App\Helpers\Input;
use Wlr\App\Helpers\Util;
use Wlr\App\Helpers\Validation;
use Wlr\App\Helpers\Woocommerce;
use Wlr\App\Models\EarnCampaignTransactions;
use Wlr\App\Models\RewardTransactions;
use Wlr\App\Models\Logs;
use Wlr\App\Models\UserRewards;

class Dashboard {
	/**
	 * Get analytic data.
	 *
	 * @return void
	 */
	public static function getDashboardAnalyticData() {
		if ( ! Util::isBasicSecurityValid( 'wlr_dashboard_nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$input         = new Input();
		$post          = $input->post();
		$validate_data = Validation::validateDashboard( $post, 'getActivityLoyalData' );
		$data          = self::getValidateData( $validate_data, [] );
		if ( ! empty( $data ) && isset( $data['success'] ) ) {
			wp_send_json( $data );
		}

		try {
			global $wpdb;
			$currency            = (string) $input->post_get( 'currency', '' );
			$start_and_end       = self::getStartAndEnd();
			$start               = ! empty( $start_and_end['start'] ) ? strtotime( $start_and_end['start'] ) : 0;
			$end                 = ! empty( $start_and_end['end'] ) ? strtotime( $start_and_end['end'] ) : 0;
			$reward_transactions = new RewardTransactions();
			//total order count
			$campaign_transaction = new EarnCampaignTransactions();
			//total points, total rewards
			$points_where = $wpdb->prepare( '((created_at) >= %s OR created_at = 0) AND ((created_at) <= %s OR created_at = 0) AND transaction_type = %s', [
				$start,
				$end,
				'credit'
			] );
			//AND action_type != 'revoke_coupon'
			$points_lists = $campaign_transaction->getWhere( $points_where, "SUM(CASE WHEN campaign_type='point'  THEN points ELSE 0 END) as total_points, 
       SUM(CASE WHEN campaign_type='coupon' THEN 1 ELSE 0 END) as total_reward" );
			$total_points = (int) ( ! empty( $points_lists->total_points ) ? $points_lists->total_points : 0 );
			$total_reward = (int) ( ! empty( $points_lists->total_reward ) ? $points_lists->total_reward : 0 );
			// total user reward count
			$user_reward_model    = new UserRewards();
			$user_reward_where    = $wpdb->prepare( '((created_at) >= %s OR created_at = 0) AND ((created_at) <= %s OR created_at = 0) AND reward_type= %s ', [
				$start,
				$end,
				'redeem_point'
			] );
			$allowed_action_types = apply_filters( 'wlr_dashboard_point_reward_action_type', [ 'redeem_point' ] );
			//phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
			$user_reward_where  .= $wpdb->prepare( ' AND action_type IN (' . trim( str_repeat( '%s,', count( $allowed_action_types ) ), ',' ) . ')', $allowed_action_types );
			$user_redeem_reward = $user_reward_model->getWhere( $user_reward_where, 'COUNT(DISTINCT id) as total_point_reward' );
			$total_reward       += ( ! empty( $user_redeem_reward ) && ! empty( $user_redeem_reward->total_point_reward ) ) ? $user_redeem_reward->total_point_reward : 0;
			$reward_where       = $wpdb->prepare( 'reward_currency = %s AND discount_code != %s', [
				sanitize_text_field( $currency ),
				''
			] );
			$reward_where       .= $wpdb->prepare( ' AND (created_at >= %s OR created_at = 0) AND (created_at <= %s OR created_at = 0) AND order_id > 0', [
				$start,
				$end
			] );
			//total order count
			$order_lists_count = $reward_transactions->getWhere( $reward_where, 'COUNT(DISTINCT order_id) as total_count' );
			$total_order_count = (int) ( ! empty( $order_lists_count->total_count ) ? $order_lists_count->total_count : 0 );
			//total order value
			$order_lists_total = $reward_transactions->getWhere( $reward_where, 'order_id, order_total, reward_amount', false );
			$total_order_value = 0;
			$used_order_ids    = [];
			foreach ( $order_lists_total as $order_total_data ) {
				if ( isset( $order_total_data->order_id ) && ! in_array( $order_total_data->order_id, $used_order_ids ) ) {
					$total_order_value += $order_total_data->order_total;
					$used_order_ids[]  = $order_total_data->order_id;
				}
			}
			//Reward redeem amount
			$redeem_reward       = $reward_transactions->getWhere( $reward_where, 'SUM(reward_amount) as total_redeem_reward' );
			$total_redeem_reward = ! empty( $redeem_reward ) && isset( $redeem_reward->total_redeem_reward ) && $redeem_reward->total_redeem_reward > 0 ? $redeem_reward->total_redeem_reward : 0;
			wp_send_json_success( [
				'total_order_count'   => $total_order_count,
				'total_order_value'   => wc_price( $total_order_value, [ 'currency' => $currency ] ),
				'total_points'        => $total_points,
				'total_reward'        => $total_reward,
				'total_redeem_reward' => wc_price( $total_redeem_reward, [ 'currency' => $currency ] )
			] );
		} catch ( Exception $e ) {
		}
		wp_send_json_error( [] );
	}

	/**
	 * @param $validate_data
	 * @param array $data
	 *
	 * @return array
	 */
	public static function getValidateData( $validate_data, array $data ) {
		if ( is_array( $validate_data ) && ! empty( $validate_data ) ) {
			foreach ( $validate_data as $field => $messages ) {
				$validate_data[ $field ] = str_replace( 'Wlr', '', implode( ',', $messages ) );
			}
			$data['success']     = false;
			$data['field_error'] = $validate_data;
			$data['data']        = [];
		}

		return $data;
	}

	/**
	 * Get chart data.
	 *
	 * @return void
	 */
	public static function getChartsData() {
		if ( ! Util::isBasicSecurityValid( 'wlr_dashboard_nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$input         = new Input();
		$post          = $input->post();
		$validate_data = Validation::validateDashboard( $post, 'getChartData' );
		$data          = self::getValidateData( $validate_data, [] );
		if ( ! empty( $data ) && isset( $data['success'] ) ) {
			wp_send_json( $data );
		}

		global $wpdb;
		$currency      = (string) $input->post_get( 'currency', '' );
		$filter_type   = (string) $input->post_get( 'fil_type', '90_days' );
		$start_and_end = self::getStartAndEnd();
		$start         = ! empty( $start_and_end['start'] ) ? strtotime( $start_and_end['start'] ) : 0;
		$end           = ! empty( $start_and_end['end'] ) ? strtotime( $start_and_end['end'] ) : 0;
		$date_format   = in_array( $filter_type, [ '90_days', 'last_year' ] ) ? "m-Y" : "d-m-Y";
		//Revenue chart
		$reward_transactions = new RewardTransactions();
		$order_query_where   = $wpdb->prepare( " discount_code != %s 
                AND reward_currency = %s AND (created_at >= %s OR created_at = 0) 
                AND (created_at <= %s OR created_at = 0) AND order_id > 0", [
			'',
			sanitize_text_field( $currency ),
			$start,
			$end
		] );
		$chart_data          = $reward_transactions->getWhere( $order_query_where, 'order_id,created_at,order_total', false );
		$new_chart_data      = [];
		$used_order_ids      = [];
		foreach ( $chart_data as $chart_value ) {
			if ( isset( $chart_value->order_id ) && ! in_array( $chart_value->order_id, $used_order_ids ) ) {
				$new_chart_data[] = $chart_value;
				$used_order_ids[] = $chart_value->order_id;
			}
		}
		$data                    = [];
		$data['success']         = true;
		$data['data']['revenue'] = [];
		$revenue_data            = [];
		$woocommerce_helper      = Woocommerce::getInstance();
		foreach ( $new_chart_data as $chart ) {
			$revenue_date = $woocommerce_helper->beforeDisplayDate( $chart->created_at, $date_format );
			if ( ! isset( $revenue_data[ $revenue_date ] ) ) {
				$revenue_data[ $revenue_date ] = ! empty( $chart->order_total ) ? $chart->order_total : 0;
			} else {
				$revenue_data[ $revenue_date ] += ! empty( $chart->order_total ) ? $chart->order_total : 0;
			}
		}
		if ( ! empty( $revenue_data ) ) {
			$data['data']['revenue'][] = [ __( 'Date', 'wp-loyalty-rules' ), __( 'Revenue', 'wp-loyalty-rules' ) ];
			//ksort($revenue_data);
			$revenue_data = self::sortByDate( $revenue_data );
			foreach ( $revenue_data as $key => $value ) {
				$data['data']['revenue'][] = [ $key, round( (float) $value, 2 ) ];
			}
		}
		//Reward chart
		$campaign_transaction = new EarnCampaignTransactions();
		$where                = $wpdb->prepare( '((created_at) >= %s OR created_at = 0) 
                AND ((created_at) <= %s OR created_at = 0)  AND campaign_type = %s AND transaction_type = %s', [
			$start,
			$end,
			'coupon',
			'credit'
		] );
		$where                .= 'ORDER BY created_at';
		$reward_redeem_data   = $campaign_transaction->getWhere( $where, '*', false );

		$user_reward_model    = new UserRewards();
		$user_reward_where    = $wpdb->prepare( '((created_at) >= %s OR created_at = 0) AND ((created_at) <= %s OR created_at = 0) AND reward_type= %s', [
			$start,
			$end,
			'redeem_point'
		] );
		$allowed_action_types = apply_filters( 'wlr_dashboard_point_reward_action_type', [ 'redeem_point' ] );
		//phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		$user_reward_where      .= $wpdb->prepare( ' AND action_type IN (' . trim( str_repeat( '%s,', count( $allowed_action_types ) ), ',' ) . ')', $allowed_action_types );
		$user_reward_where      .= 'ORDER BY created_at';
		$user_redeem_rewards    = $user_reward_model->getWhere( $user_reward_where, '*', false );
		$data['data']['reward'] = [];
		$reward_data            = [];
		foreach ( $reward_redeem_data as $reward_redeem ) {
			$reward_date = $woocommerce_helper->beforeDisplayDate( $reward_redeem->created_at, $date_format );
			if ( ! isset( $reward_data[ $reward_date ] ) ) {
				$reward_data[ $reward_date ] = 1;
			} else {
				$reward_data[ $reward_date ] += 1;
			}
		}

		foreach ( $user_redeem_rewards as $user_redeem_reward ) {
			$reward_date = $woocommerce_helper->beforeDisplayDate( $user_redeem_reward->created_at, $date_format );
			if ( ! isset( $reward_data[ $reward_date ] ) ) {
				$reward_data[ $reward_date ] = 1;
			} else {
				$reward_data[ $reward_date ] += 1;
			}
		}

		if ( ! empty( $reward_data ) ) {
			$data['data']['reward'][] = [ __( 'Date', 'wp-loyalty-rules' ), __( 'Reward', 'wp-loyalty-rules' ) ];
			//ksort($reward_data);
			$reward_data = self::sortByDate( $reward_data );
			foreach ( $reward_data as $key => $value ) {
				$data['data']['reward'][] = [ $key, (int) $value ];
			}
		}
		//Points chart
		$earn_where            = $wpdb->prepare( '((created_at) >= %s OR created_at = 0) AND ((created_at) <= %s OR created_at = 0) AND campaign_type = %s AND transaction_type = %s', [
			$start,
			$end,
			'point',
			'credit'
		] );
		$earn_where            .= 'ORDER BY created_at';
		$earn_data             = $campaign_transaction->getWhere( $earn_where, '*', false );
		$data['data']['point'] = [];
		$points_data           = [];
		foreach ( $earn_data as $earning ) {
			$earning_date = $woocommerce_helper->beforeDisplayDate( $earning->created_at, $date_format );
			if ( ! isset( $points_data[ $earning_date ] ) ) {
				$points_data[ $earning_date ] = $earning->points;
			} else {
				$points_data[ $earning_date ] += $earning->points;
			}
		}
		if ( ! empty( $points_data ) ) {
			$data['data']['point'][] = [ __( 'Date', 'wp-loyalty-rules' ), __( 'Point', 'wp-loyalty-rules' ) ];
			//ksort($points_data);
			$points_data = self::sortByDate( $points_data );
			foreach ( $points_data as $key => $value ) {
				$data['data']['point'][] = [ $key, (int) $value ];
			}
		}
		wp_send_json( $data );
	}

	/**
	 * Sorts an array by the date values of its keys.
	 *
	 * @param array $input The array to be sorted by date keys.
	 *
	 * @return array The sorted array.
	 */
	public static function sortByDate( $input ) {
		if ( empty( $input ) ) {
			return $input;
		}
		// Custom comparison function
		$compareDates = function ( $date1, $date2 ) {
			$timestamp1 = strtotime( $date1 );
			$timestamp2 = strtotime( $date2 );

			if ( $timestamp1 == $timestamp2 ) {
				return 0;
			}

			return ( $timestamp1 < $timestamp2 ) ? - 1 : 1;
		};
		// Sort the array based on the key date
		uksort( $input, $compareDates );

		return $input;
	}


	/**
	 * Retrieves the recent customer activity lists.
	 *
	 * @return void This method does not return anything. It sends a JSON response instead.
	 */
	public static function getCustomerRecentActivityLists() {
		if ( ! Util::isBasicSecurityValid( 'wlr_dashboard_nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic validation failed', 'wp-loyalty-rules' ) ] );
		}
		$input         = new Input();
		$post          = $input->post();
		$validate_data = Validation::validateDashboard( $post, 'getCustomerRecentActivity' );
		$data          = self::getValidateData( $validate_data, [] );
		if ( ! empty( $data ) && isset( $data['success'] ) ) {
			wp_send_json( $data );
		}

		global $wpdb;
		$limit              = (int) $input->post_get( 'limit', 5 );
		$offset             = (int) $input->post_get( 'offset', 0 );
		$start_and_end      = self::getStartAndEnd();
		$start              = ! empty( $start_and_end['start'] ) ? strtotime( $start_and_end['start'] ) : 0;
		$end                = ! empty( $start_and_end['end'] ) ? strtotime( $start_and_end['end'] ) : 0;
		$log_model          = new Logs();
		$condition_where    = $wpdb->prepare( ' id > %d  AND (created_at >= %s OR created_at=0) AND (created_at <= %s OR created_at = 0) ', [
			0,
			$start,
			$end
		] );
		$where              = $condition_where . "  ORDER BY id DESC ";
		$select_query       = $where . $wpdb->prepare( ' LIMIT %d OFFSET %d', [ $limit, $offset ] );
		$items              = $log_model->getWhere( $select_query, '*', false );
		$items_count        = $log_model->getWhere( $where, 'DISTINCT COUNT(id) as total_count' );
		$items_count        = ( ! empty( $items_count->total_count ) ) ? (int) $items_count->total_count : 0;
		$woocommerce_helper = Woocommerce::getInstance();
		foreach ( $items as $item ) {
			$item->created_at = $woocommerce_helper->beforeDisplayDate( $item->created_at, 'D j M Y H:i:s' );
		}
		wp_send_json_success( [
			'items'       => $items,
			'total_count' => $items_count,
			'limit'       => $limit
		] );
	}

	/**
	 * Retrieves the notification data.
	 *
	 * @return void
	 */
	public static function getNotification() {
		if ( ! Util::isBasicSecurityValid( 'wlr_common_user_nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic security validation failed', 'wp-loyalty-rules' ) ] );
		}
		
		$woocommerce_helper = Woocommerce::getInstance();
		$status             = $woocommerce_helper->checkStatusNewRewardSection();
		if ( $status ) {
			wp_send_json_error( [
				'message'        => __( 'Status failed', 'wp-loyalty-rules' ),
				'is_show_notify' => false
			] );
		}
		wp_send_json_success( [
			'is_show_notify' => true,
			'labels'         => [
				'title'           => __( 'Updates available for Customers Rewards page', 'wp-loyalty-rules' ),
				'title_question'  => __( "We have rolled out a number of improvements for the Customer Rewards page. Would you like to apply these enhancements now?", "wp-loyalty-rules" ),
				'yes'             => __( "Yes, update now", "wp-loyalty-rules" ),
				'no'              => __( "No, remind me later.", "wp-loyalty-rules" ),
				'popup_title'     => __( "Irreversible Action Alert", "wp-loyalty-rules" ),
				'popup_desc'      => __( "It looks like you have theme level overrides for the Customer Rewards page. Applying these updates will overwrite these theme overrides. These changes are irreversible.", "wp-loyalty-rules" ),
				'popup_yes_text'  => __( "Yes, update to the latest", "wp-loyalty-rules" ),
				'popup_no_text'   => __( "No, remind me later.", "wp-loyalty-rules" ),
				'upgreaded_title' => __( "Customer Rewards page updated!", "wp-loyalty-rules" ),
				'preview_desc'    => __( "Great news! Your 'My Rewards' section has been successfully updated to the latest version. Enjoy all the exciting new features and improvements.", "wp-loyalty-rules" ),
				'rename_desc'     => __( "We have renamed the previous theme override files. Here are the details:", "wp-loyalty-rules" ),
				'thanks_text'     => __( "Your improved Customer Reward page is now ready.", "wp-loyalty-rules" ),
				'okay_text'       => __( "Okay", "wp-loyalty-rules" ),
			]
		] );
	}

	/**
	 * Enables the new "My Rewards" section.
	 *
	 * @return void
	 */
	public static function enableMyRewardSection() {
		if ( ! Util::isBasicSecurityValid( 'wlr_common_user_nonce' ) ) {
			wp_send_json_error( [ 'message' => __( 'Basic security validation failed', 'wp-loyalty-rules' ) ] );
		}
		$input              = new Input();
		$is_enabled         = $input->post_get( 'is_enabled', '' );
		$renamed            = [];
		$file_rename_status = false;
		if ( $is_enabled === 'yes' ) {
			$files              = apply_filters( 'wlr_customer_reward_page_templates', [
				'customer_page.php',
				'cart_page.php',
				'my_account_reward.php',
				'cart_page_rewards.php'
			] );
			$woocommerce_helper = Woocommerce::getInstance();
			$renamed            = $woocommerce_helper->renameTemplateOverwritedFiles( $files );
			if ( ! empty( $renamed ) && is_array( $renamed ) ) {
				$file_rename_status = true;
			}
		}
		update_option( 'wlr_new_rewards_section_enabled', $is_enabled );
		wp_send_json_success( [
			'labels'        => [
				'renamed_files'       => __( "The template-overwritten files listed below have been successfully renamed:", "wp-loyalty-rules" ),
				'failed_rename_files' => __( "The files that have undergone template overwrites but were not successfully renamed are as follows:", "wp-loyalty-rules" ),
				'note'                => __( "Note:To address the issue of failed renaming for overwritten template files, you will need to manually create a template overwrite.", "wp-loyalty-rules" ),
				'ok'                  => __( "Ok", "wp-loyalty-rules" ),
			],
			'renamed_files' => $renamed,
			'rename_status' => $file_rename_status,
			'message'       => __( 'Update successful!', 'wp-loyalty-rules' )
		] );
	}

	/**
	 * Retrieves the start and end dates based on the filter type.
	 *
	 * @return array An associative array containing the start and end dates.
	 */
	public static function getStartAndEnd() {
		$start     = 0;
		$end       = 0;
		$null_date = 0;
		try {
			$input       = new Input();
			$filter_type = (string) $input->post_get( 'fil_type', '90_days' );
			$timezone    = new DateTimeZone( 'UTC' );
			if ( $filter_type == '90_days' ) {
				$current_time = new DateTime( 'now', $timezone );
				$last_time    = new DateTime( '-90 days', $timezone );
				$start        = $last_time->format( 'Y-m-d 00:00:00' );
				$end          = $current_time->format( 'Y-m-d 23:59:59' );
			} elseif ( $filter_type == 'this_month' ) {
				$current_time = new DateTime( 'now', $timezone );
				$start        = $current_time->format( 'Y-m-01 00:00:00' );
				$end          = $current_time->format( 'Y-m-d 23:59:59' );
			} elseif ( $filter_type == 'last_month' ) {
				$current_time = new DateTime();
				$current_time->modify( 'last day of last month' );
				//$current_time = new DateTime('-1 month', $timezone);
				$start = $current_time->format( 'Y-m-01 00:00:00' );
				$end   = $current_time->format( 'Y-m-t 23:59:59' );
			} elseif ( $filter_type == 'last_year' ) {
				$current_time = new DateTime( '-1 year', $timezone );
				$start        = $current_time->format( 'Y-01-01 00:00:00' );
				$end          = $current_time->format( 'Y-12-t 23:59:59' );
			} elseif ( $filter_type == 'custom' ) {
				$from_date = $input->post( 'from_date', $null_date );
				$to_date   = $input->post( 'to_date', $null_date );
				if ( ! empty( $to_date ) && $to_date != $null_date ) {
					$current_time = new DateTime( $to_date );
					$end          = $current_time->format( 'Y-m-d 23:59:59' );
				}
				if ( ! empty( $from_date ) && $from_date != $null_date ) {
					$current_time = new DateTime( $from_date );
					$start        = $current_time->format( 'Y-m-d 00:00:00' );
				}
			}
		} catch ( Exception $e ) {
		}

		return [
			'start' => $start,
			'end'   => $end,
		];
	}
}