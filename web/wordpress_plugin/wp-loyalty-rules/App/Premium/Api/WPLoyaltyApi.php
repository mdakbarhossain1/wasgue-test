<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-3.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Api;
defined( 'ABSPATH' ) or die();

use Wlr\App\Helpers\EarnCampaign;
use Wlr\App\Helpers\Woocommerce;
use Wlr\App\Models\Users;

class WPLoyaltyApi extends \WC_REST_CRUD_Controller {
	protected $namespace = 'wc/v3';

	/* public function __construct()
	 {
		 add_action('rest_api_init', array($this, 'register_routes'));
	 }*/

	public function register_routes() {
		register_rest_route(
			'wc/v3',
			'/wployalty/customers/points/add',
			array(
				'methods'             => 'POST',
				'callback'            => [ $this, 'add_point' ],
				'permission_callback' => array( $this, 'permissionCheck' ),
				'args'                => array(
					'user_email' => array(
						'required'          => true,
						'validate_callback' => function ( $param, $request, $key ) {
							return filter_var( $param, FILTER_VALIDATE_EMAIL );
						}
					),
					'points'     => array(
						'required'          => true,
						'validate_callback' => function ( $param, $request, $key ) {
							return is_numeric( $param );
						}
					),/*
					'command'    => array(
						'validate_callback' => '__return_true',
					)*/
				)
			)
		);
		register_rest_route(
			'wc/v3',
			'/wployalty/customers/points/reduce',
			array(
				'methods'             => 'POST',
				'callback'            => [ $this, 'subtract_point' ],
				'permission_callback' => array( $this, 'permissionCheck' ),
				'args'                => array(
					'user_email' => array(
						'required'          => true,
						'validate_callback' => function ( $param, $request, $key ) {
							return filter_var( $param, FILTER_VALIDATE_EMAIL );
						}
					),
					'points'     => array(
						'required'          => true,
						'validate_callback' => function ( $param, $request, $key ) {
							return is_numeric( $param );
						}
					),/*
					'command'    => array(
						'validate_callback' => '__return_true',
					)*/
				)
			)
		);
	}

	public function subtract_point( $request ) {
		$params = $request->get_params();
		$data   = array( 'success' => false, 'data' => array() );
		if ( ! is_array( $params ) || ! isset( $params['user_email'] ) || ! isset( $params['points'] ) || $params['points'] <= 0 ) {
			$data['data']['message'] = __( 'Basic security validation failed', 'wp-loyalty-rules' );

			return new \WP_REST_Response( $data, 200 );
		}
		$user_model = new Users();
		$user       = $user_model->getQueryData( array(
			'user_email' => array(
				'operator' => '=',
				'value'    => $params['user_email']
			)
		), '*', array(), false );
		$old_point  = 0;
		if ( isset( $user->points ) && ! empty( $user->points ) ) {
			$old_point = $user->points;
		}
		$earn_point_helper = new EarnCampaign();
		if ( empty( $user ) ) {
			$data['data']['message'] = __( 'Customer not found', 'wp-loyalty-rules' );

			return new \WP_REST_Response( $data, 200 );
		}
		if ( ( $user->points < $params['points'] ) ) {
			/* translators: 1: old point 2: point label */
			$data['data']['message'] = sprintf( __( 'Customer have only %1$s %2$s', 'wp-loyalty-rules' ), $old_point, $earn_point_helper->getPointLabel( $old_point ) );

			return new \WP_REST_Response( $data, 200 );
		}
		$trans_type    = 'debit';
		$reduced_point = (int) $params['points'];
		if ( $reduced_point <= 0 ) {
			$reduced_point = 0;
		}
		$action_data = array(
			'user_email'  => $params['user_email'],
			'action_type' => 'rest_api',
		);
		if ( $user->points <= $reduced_point ) {
			$user->points = 0;
		} else {
			$user->points -= $reduced_point;
		}
		$action_data['points']              = $reduced_point;
		$action_data['action_process_type'] = 'reduce_point';
		/* translators: 1: email 2: point label 3: old point 4: current point */
		$action_data['note'] = sprintf( __( '%1$s customer %2$s changed from %3$d to %4$d via REST API', 'wp-loyalty-rules' ), $params['user_email'], $earn_point_helper->getPointLabel( 3 ), $old_point, $user->points );
		// translators: 1: point label 2: points
		$action_data['customer_note'] = sprintf( __( '%1$s value changed to %2$d by store administrator(s)', 'wp-loyalty-rules' ), $earn_point_helper->getPointLabel( $user->points ), $user->points );
		$status                       = $earn_point_helper->addExtraPointAction( 'rest_api', $action_data['points'], $action_data, $trans_type, false, true );
		$data['success']              = $status;
		$data['data']                 = array(
			'message' => $status ? __( 'Successfully reduced customer points via REST API.', 'wp-loyalty-rules' ) : __( 'Failed to reduce customer points via REST API.', 'wp-loyalty-rules' )
		);

		return new \WP_REST_Response( $data, 200 );
	}

	public function add_point( $request ) {
		$params = $request->get_params();
		$data   = array( 'success' => false, 'data' => array() );
		if ( ! is_array( $params ) || ! isset( $params['user_email'] ) || ! isset( $params['points'] ) || $params['points'] <= 0 ) {
			$data['data']['message'] = __( 'Basic security validation failed', 'wp-loyalty-rules' );

			return new \WP_REST_Response( $data, 200 );
		}
		$user_model = new Users();
		$user       = $user_model->getQueryData( array(
			'user_email' => array(
				'operator' => '=',
				'value'    => $params['user_email']
			)
		), '*', array(), false );
		$old_point  = 0;
		if ( isset( $user->points ) && ! empty( $user->points ) ) {
			$old_point = $user->points;
		}
		$action_data       = array(
			'user_email'  => $params['user_email'],
			'action_type' => 'rest_api',
		);
		$trans_type        = 'credit';
		$earn_point_helper = new EarnCampaign();
		if ( empty( $user ) ) {
			$action_data['referral_code']       = '';
			$action_data['points']              = $params['points'];
			$action_data['action_process_type'] = 'new_user';
			/* translators: 1: point 2: point label */
			$action_data['customer_note'] = sprintf( __( 'Added %1$d %2$s via REST API', 'wp-loyalty-rules' ), $params['points'], $earn_point_helper->getPointLabel( $params['points'] ) );
			/* translators: 1: customer email 2: point 3: point label */
			$action_data['note'] = sprintf( __( '%1$s customer added with %2$d %3$s via REST API', 'wp-loyalty-rules' ), $params['user_email'], $params['points'], $earn_point_helper->getPointLabel( $params['points'] ) );
			$status              = $earn_point_helper->addExtraPointAction( 'rest_api', $params['points'], $action_data );
		} else {
			$added_point                        = (int) $params['points'];
			$user->points                       += $added_point;
			$action_data['points']              = $added_point;
			$action_data['action_process_type'] = 'earn_point';
			/* translators: 1: email 2: point label 3: old point 4: current point */
			$action_data['note'] = sprintf( __( '%1$s customer %2$s changed from %3$d to %4$d via REST API', 'wp-loyalty-rules' ), $params['user_email'], $earn_point_helper->getPointLabel( 3 ), $old_point, $user->points );
			// translators: 1: point label 2: points
			$action_data['customer_note'] = sprintf( __( '%1$s value changed to %2$d by store administrator(s)', 'wp-loyalty-rules' ), $earn_point_helper->getPointLabel( $user->points ), $user->points );
			$status                       = $earn_point_helper->addExtraPointAction( 'rest_api', $action_data['points'], $action_data, $trans_type, false, true );
		}
		$data['success'] = $status;
		$data['data']    = array(
			'message' => $status ? __( 'Successfully added customer points via REST API.', 'wp-loyalty-rules' ) : __( 'Failed to add customer points via REST API.', 'wp-loyalty-rules' )
		);

		return new \WP_REST_Response( $data, 200 );
	}

	function permissionCheck() {
		return Woocommerce::hasAdminPrivilege();
	}
}