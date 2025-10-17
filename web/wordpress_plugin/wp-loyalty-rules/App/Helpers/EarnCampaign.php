<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Helpers;
defined( 'ABSPATH' ) or die;

use stdClass;
use Wlr\App\Models\EarnCampaignTransactions;
use Wlr\App\Models\Logs;
use Wlr\App\Models\RewardTransactions;
use Wlr\App\Models\UserRewards;
use Wlr\App\Models\Users;

class EarnCampaign extends Base {
	public static $instance = null;
	public static $single_campaign = [];
	public $earn_campaign, $available_conditions = [];

	public function __construct( $config = [] ) {
		parent::__construct( $config );
	}

	function getCampaign( $campaign ) {
		if ( empty( $campaign ) || ! isset( $campaign->id ) || empty( $campaign->id ) ) {
			$this->earn_campaign = new stdClass();

			return $this;
		}

		if ( isset( self::$single_campaign[ $campaign->id ] ) && ! empty( self::$single_campaign[ $campaign->id ] ) ) {
			$this->available_conditions = ( ! empty( $this->available_conditions ) ) ? $this->available_conditions : $this->getAvailableConditions();
			$this->earn_campaign        = self::$single_campaign[ $campaign->id ];

			return $this;
		}

		$this->earn_campaign        = self::$single_campaign[ $campaign->id ] = $campaign;
		$this->available_conditions = ( ! empty( $this->available_conditions ) ) ? $this->available_conditions : $this->getAvailableConditions();

		return $this;
	}

	public function getAvailableConditions() {
		$available_conditions = [];
		//Read the conditions directory and create condition object
		if ( file_exists( WLR_PLUGIN_PATH . 'App/Conditions/' ) ) {
			$conditions_list = array_slice( scandir( WLR_PLUGIN_PATH . 'App/Conditions/' ), 2 );

			if ( ! empty( $conditions_list ) ) {
				foreach ( $conditions_list as $condition ) {
					$class_name = basename( $condition, '.php' );
					if ( $class_name == 'Base' ) {
						continue;
					}

					$condition_class_name = 'Wlr\App\Conditions\\' . $class_name;
					if ( ! class_exists( $condition_class_name ) ) {
						continue;
					}

					$condition_object = new $condition_class_name();
					if ( $condition_object instanceof \Wlr\App\Conditions\Base ) {

						$condition_name = $condition_object->name();
						if ( ! empty( $condition_name ) ) {
							$available_conditions[ $condition_name ] = [
								'object'       => $condition_object,
								'label'        => $condition_object->label,
								'group'        => $condition_object->group,
								'extra_params' => $condition_object->extra_params,
							];
						}
					}
				}
			}
		}
		$this->available_conditions = apply_filters( 'wlr_available_conditions', $available_conditions );

		return $this->available_conditions;
	}

	function getCampaignReward( $data ) {
		/**
		 * 1. Check level, active
		 */
		$status = true;
		if ( ! $this->isActive() ) {
			$status = false;
		}
		$is_product_level = false;
		if ( isset( $data['is_product_level'] ) && $data['is_product_level'] ) {
			$is_product_level = true;
		}

		if ( $status && isset( $data['is_calculate_based'] ) && $data['is_calculate_based'] == 'cart' ) {
			$status = $this->isAllowEarningWhenCoupon();
		} elseif ( $status && isset( $data['is_calculate_based'] ) && $data['is_calculate_based'] == 'order' ) {
			$status = $this->isAllowEarningWhenCoupon( false, $data['order'] );
		}
		$status = apply_filters( 'wlr_before_earn_reward_conditions', $status, $data );
		/**
		 * 2. check condition
		 */
		if ( $status && ! $this->processCampaignCondition( $data, $is_product_level ) ) {
			$status = false;
		}
		$status = apply_filters( 'wlr_before_earn_reward_calculation', $status, $data );
		/**
		 * 3. calculate point based on action
		 */
		$rewards = [];
		if ( $status ) {
			$rewards = $this->processCampaignRewards( $data );
		}

		return $rewards;
	}

	function isActive() {
		$status = false;
		if ( isset( $this->earn_campaign->active ) && $this->earn_campaign->active ) {
			$status = true;
		}

		return $status;
	}

	function processCampaignCondition( $data, $is_product_level = false ) {
		if ( ! $this->isPro() ) {
			return true;
		}
		/**
		 * 1. check start and end date
		 */
		$current_date = gmdate( "Y-m-d" );
		$status       = false;
		if ( ( ( isset( $this->earn_campaign->start_at ) && $current_date >= gmdate( "Y-m-d", $this->earn_campaign->start_at ) ) || $this->earn_campaign->start_at == 0 )
		     && ( ( isset( $this->earn_campaign->end_at ) && $current_date >= gmdate( "Y-m-d", $this->earn_campaign->end_at ) ) || $this->earn_campaign->end_at ) ) {
			$status = true;
		}

		/**
		 * 2. Condition type all match or any match
		 */
		$conditions = $this->getConditions();
		if ( $status && $conditions ) {

			//2. other request
			foreach ( $this->available_conditions as $condition_name => $ava_condition ) {
				foreach ( $conditions as $condition ) {
					if ( isset( $condition->type ) && isset( $condition->options ) && isset( $ava_condition['object'] ) && $condition->type == $condition_name ) {

						if ( isset( $data['ignore_condition'] ) && ! empty( $data['ignore_condition'] ) && in_array( $condition->type, $data['ignore_condition'] ) ) {
							continue;
						}

						if ( isset( $data['allowed_condition'] ) && ! empty( $data['allowed_condition'] ) && ! in_array( $condition->type, $data['allowed_condition'] ) ) {
							continue;
						}

						if ( ! $is_product_level ) {
							if ( ! isset( $data['campaign'] ) ) {
								$data['campaign'] = $this->earn_campaign;
							}

							$condition_status = $ava_condition['object']->check( $condition->options, $data );
						} else {
							$condition_status = $ava_condition['object']->isProductValid( $condition->options, $data );
						}

						if ( isset( $this->earn_campaign->condition_relationship ) && $this->earn_campaign->condition_relationship == 'and' ) {
							if ( ! $condition_status ) {
								$status = false;
								break 2;
							}
						} elseif ( isset( $this->earn_campaign->condition_relationship ) && $this->earn_campaign->condition_relationship == 'or' ) {
							if ( $condition_status ) {
								$status = true;
								break 2;
							} else {
								$status = false;
							}
						}
					}
				}
			}
		}

		return $status;
	}

	function getConditions() {
		if ( $this->hasConditions() ) {
			return json_decode( $this->earn_campaign->conditions );
		}

		return false;
	}

	protected function hasConditions() {
		$status = false;
		if ( isset( $this->earn_campaign->conditions ) ) {
			$status = true;
			if ( empty( $this->earn_campaign->conditions ) || $this->earn_campaign->conditions == '{}' || $this->earn_campaign->conditions == '[]' ) {
				$status = false;
			}
		}

		return apply_filters( 'wlr_has_earn_campaign_conditions', $status, $this->earn_campaign );
	}

	function processCampaignRewards( $data ) {
		$rewards = [];
		if ( isset( $data['action_type'] ) && ! empty( $data['action_type'] ) ) {
			$action_type = trim( $data['action_type'] );
			$rewards     = $this->processCampaignAction( $action_type, 'coupon', $this, $data );
		}

		return $rewards;
	}

	protected function processCampaignAction( $action_type, $type, $campaign, $data ) {
		if ( empty( $type ) ) {
			return null;
		}
		$reward = [];
		if ( $type == 'point' ) {
			$reward = 0;
		}
		if ( empty( $action_type ) ) {
			return $reward;
		}
		if ( isset( $data['action_type'] ) && ! empty( $data['action_type'] ) && $action_type == $data['action_type'] ) {
			$action_type = trim( $action_type );
			$reward      = apply_filters( 'wlr_earn_' . strtolower( $type ) . '_' . strtolower( $action_type ), $reward, $campaign, $data );
		}

		return $reward;
	}

	function getCampaignPoint( $data ) {
		/**
		 * 1. Check level, active
		 */
		$status = true;
		if ( ! $this->isActive() ) {
			$status = false;
		}
		$is_product_level = false;
		if ( isset( $data['is_product_level'] ) && $data['is_product_level'] ) {
			$is_product_level = true;
		}
		if ( $status && isset( $data['is_calculate_based'] ) && $data['is_calculate_based'] == 'cart' ) {
			$status = $this->isAllowEarningWhenCoupon();
		} elseif ( $status && isset( $data['is_calculate_based'] ) && $data['is_calculate_based'] == 'order' ) {
			$status = $this->isAllowEarningWhenCoupon( false, $data['order'] );
		}
		$status = apply_filters( 'wlr_before_earn_point_conditions', $status, $data );
		/**
		 * 2. check condition
		 */
		if ( $status && ! $this->processCampaignCondition( $data, $is_product_level ) ) {
			$status = false;
		}
		$status = apply_filters( 'wlr_before_earn_point_calculation', $status, $data );
		/**
		 * 3. calculate point based on action
		 */
		$point = 0;
		if ( $status ) {
			$point = $this->processCampaignPoint( $data );
		}

		return $point;
	}

	private function processCampaignPoint( $data ) {
		if ( ! is_array( $data ) || empty( $data['action_type'] ) ) {
			return 0;
		}

		return $this->processCampaignAction( trim( $data['action_type'] ), 'point', $this, $data );
	}

	function getActionEarning( $cart_action_list, $extra ) {
		$reward_list = [];
		foreach ( $cart_action_list as $action_type ) {
			$reward_list[ $action_type ] = $this->getTotalEarning( $action_type, [], $extra );
		}

		return $reward_list;
	}

	function processOrderReturn( $order_id ) {
		if ( empty( $order_id ) || $order_id <= 0 ) {
			return false;
		}
		$status = self::$woocommerce_helper->getOrderMetaData( $order_id, '_wlr_points_return_status', false );
		self::$woocommerce_helper->_log( 'ORDER: return meta data status:' . $status );
		if ( $status ) {
			return $status;
		}
		$order = self::$woocommerce_helper->getOrder( $order_id );
		if ( empty( $order ) || ! is_object( $order ) ) {
			return false;
		}

		global $wpdb;
		$user_reward_model = new UserRewards();
		$where             = $wpdb->prepare( 'order_id = %s AND transaction_type = %s', [ $order_id, 'credit' ] );
		//user reward table
		$earn_campaign_trans = self::$earn_campaign_transaction_model->getWhere( $where, '*', false );
		foreach ( $earn_campaign_trans as $earn_campaign_tran ) {
			$args = [
				'user_email'       => $earn_campaign_tran->user_email,
				'points'           => $earn_campaign_tran->points,
				'action_type'      => $earn_campaign_tran->action_type,
				'campaign_type'    => $earn_campaign_tran->campaign_type,
				'transaction_type' => 'debit',
				'display_name'     => $earn_campaign_tran->display_name,
				'campaign_id'      => $earn_campaign_tran->campaign_id,
				'reward_id'        => $earn_campaign_tran->reward_id,
				'created_at'       => strtotime( gmdate( "Y-m-d H:i:s" ) ),
				'modified_at'      => 0,
				'product_id'       => $earn_campaign_tran->product_id,
				'order_id'         => $earn_campaign_tran->order_id,
				'admin_user_id'    => $earn_campaign_tran->admin_user_id,
				'log_data'         => $earn_campaign_tran->log_data,
				'referral_type'    => $earn_campaign_tran->referral_type,
				'order_currency'   => $earn_campaign_tran->order_currency,
				'order_total'      => $earn_campaign_tran->order_total,
			];
			if ( isset( $earn_campaign_tran->campaign_type ) && $earn_campaign_tran->campaign_type == 'point' && isset( $earn_campaign_tran->user_email ) && ! empty( $earn_campaign_tran->user_email ) ) {
				$user_model           = new Users();
				$conditions           = [
					'user_email' => [
						'operator' => '=',
						'value'    => sanitize_email( $earn_campaign_tran->user_email )
					]
				];
				$user                 = $user_model->getQueryData( $conditions, '*', [], false );
				$need_to_reduce_point = isset( $earn_campaign_tran->points ) && ! empty( $earn_campaign_tran->points ) ? $earn_campaign_tran->points : 0;
				if ( ! empty( $user ) && isset( $user->id ) && $user->id > 0 ) {
					if ( isset( $user->points ) && $user->points < $need_to_reduce_point ) {
						$need_to_reduce_point = $user->points;
					}

					$user_update_data = [
						'points'           => max( ( $user->points - $need_to_reduce_point ), 0 ),
						'earn_total_point' => max( ( $user->earn_total_point - $need_to_reduce_point ), 0 ),
					];
					$ledger_data      = [
						'user_email'          => $earn_campaign_tran->user_email,
						'points'              => $need_to_reduce_point,
						'action_type'         => $earn_campaign_tran->action_type,
						'action_process_type' => 'order_return',
						/* translators: %s: point label */
						'note'                => sprintf( __( '%s debited for order return/cancellation', 'wp-loyalty-rules' ), $this->getPointLabel( $need_to_reduce_point ) ),
						'created_at'          => strtotime( gmdate( "Y-m-d H:i:s" ) )
					];
					$this->updatePointLedger( $ledger_data, 'debit' );
					self::$user_model->insertOrUpdate( $user_update_data, $user->id );

					$log_data = [
						'user_email'          => $user->user_email,
						'action_type'         => $earn_campaign_tran->action_type,
						'reward_id'           => $earn_campaign_tran->reward_id,
						'campaign_id'         => $earn_campaign_tran->campaign_id,
						'earn_campaign_id'    => $earn_campaign_tran->id,
						/* translators: 1: email 2: point label 3: point 4: new point 5: order id */
						'note'                => sprintf( __( '%1$s customer %2$s changed from %3$d to %4$d via order return(%5$s)', 'wp-loyalty-rules' ), $user->user_email, $this->getPointLabel( $user->points ), $user->points, $user_update_data['points'], $order_id ),
						/* translators: 1: reduce point 2: point label  */
						'customer_note'       => sprintf( __( '%1$d %2$s reduced for order return', 'wp-loyalty-rules' ), $need_to_reduce_point, $this->getPointLabel( $need_to_reduce_point ) ),
						'order_id'            => $order_id,
						'created_at'          => strtotime( gmdate( 'Y-m-d H:i:s' ) ),
						'action_process_type' => 'reduce_point',
						'added_point'         => 0,
						'reduced_point'       => $need_to_reduce_point,
					];
					$this->add_note( $log_data );
					$args['points'] = $need_to_reduce_point;
				}
			} elseif ( isset( $earn_campaign_tran->campaign_type ) && $earn_campaign_tran->campaign_type == 'coupon' && isset( $earn_campaign_tran->user_email ) && ! empty( $earn_campaign_tran->user_email ) ) {
				$log_table_name = ( new Logs() )->getTableName();

				$user_reward_table_name = $user_reward_model->getTableName();
				$query                  = "SELECT user_reward.* FROM " . esc_sql( $log_table_name ) . " as log LEFT JOIN " . esc_sql( $user_reward_table_name ) . " as user_reward ON user_reward.id = log.user_reward_id";
				$log_where              = $wpdb->prepare( 'log.action_type = %s AND log.user_email = %s AND log.order_id = %s AND log.campaign_id = %d AND log.reward_id =%d', [
					$earn_campaign_tran->action_type,
					$earn_campaign_tran->user_email,
					$order_id,
					$earn_campaign_tran->campaign_id,
					$earn_campaign_tran->reward_id
				] );
				//phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.NotPrepared,
				$user_reward = $wpdb->get_row( $query . ' WHERE ' . $log_where, OBJECT );
				if ( ! empty( $user_reward ) ) {
					$date        = gmdate( 'Y-m-d H:i:s' );
					$expire_date = gmdate( 'Y-m-d H:i:s', strtotime( $date . ' -1 day' ) );
					// if status open or active, then change expired
					if ( isset( $user_reward->status ) && ! in_array( $user_reward->status, [ 'expired', 'used' ] ) ) {
						$update_data = [ 'status' => 'expired', 'end_at' => strtotime( $expire_date ) ];
						$user_reward_model->updateRow( $update_data, [ 'id' => $user_reward->id ] );

						$log_data = [
							'user_email'          => $earn_campaign_tran->user_email,
							'action_type'         => $earn_campaign_tran->action_type,
							'reward_id'           => $user_reward->reward_id,
							'user_reward_id'      => $user_reward->id,
							'campaign_id'         => $user_reward->campaign_id,
							'earn_campaign_id'    => $earn_campaign_tran->id,
							/* translators: 1: email 2: reward display name 3: order id */
							'note'                => sprintf( __( '%1$s customer reward(%2$s) marked as expired due to order return(%3$s)', 'wp-loyalty-rules' ), $earn_campaign_tran->user_email, $user_reward->display_name, $order_id ),
							/* translators: %s: reward display name */
							'customer_note'       => sprintf( __( '%s reward marked as expired for order return', 'wp-loyalty-rules' ), $user_reward->display_name ),
							'order_id'            => $order_id,
							'created_at'          => strtotime( gmdate( 'Y-m-d H:i:s' ) ),
							'action_process_type' => 'return_reward',
							'reward_display_name' => $user_reward->display_name,
							'required_points'     => 0,
							'discount_code'       => $user_reward->discount_code,
						];
						$this->add_note( $log_data );
					}
					// if status  active, then need to change coupon status expired
					if ( isset( $user_reward->status ) && $user_reward->status == 'active' ) {
						if ( isset( $user_reward->discount_id ) && $user_reward->discount_id && isset( $user_reward->discount_code ) && $user_reward->discount_code ) {
							update_post_meta( $user_reward->discount_id, 'expiry_date', $this->get_coupon_expiry_date( wc_clean( $expire_date ) ) );
							update_post_meta( $user_reward->discount_id, 'date_expires', $this->get_coupon_expiry_date( wc_clean( $expire_date ), true ) );
						}
					}
				}
			}
			try {
				$insert_id = self::$earn_campaign_transaction_model->insertRow( $args );
				$insert_id = apply_filters( 'wlr_order_return_transaction', $insert_id, $args );
			} catch ( \Exception $e ) {
			}
		}
		$reward_helper = \Wlr\App\Helpers\Rewards::getInstance();
		$status        = self::$woocommerce_helper->getOrderMetaData( $order_id, '_wlr_point_coupon_return_status', false );
		if ( ! $status ) {
			$coupons      = $order->get_coupons();
			$order_status = $order->get_status();
			$user_email   = sanitize_email( self::$woocommerce_helper->getOrderEmail( $order ) );
			$date         = gmdate( 'Y-m-d H:i:s' );
			$expire_date  = gmdate( 'Y-m-d H:i:s', strtotime( $date . ' -1 day' ) );
			foreach ( $coupons as $coupon ) {
				if ( ! is_object( $coupon ) || ! self::$woocommerce_helper->isMethodExists( $coupon, 'get_code' ) ) {
					continue;
				}

				$coupon_code = $coupon->get_code();
				if ( ! $reward_helper->is_loyalty_coupon( $coupon_code ) ) {
					continue;
				}
				$where          = $wpdb->prepare( 'discount_code = %s AND email = %s', [ $coupon_code, $user_email ] );
				$applied_coupon = $user_reward_model->getWhere( $where );

				if ( empty( $applied_coupon ) || ! is_object( $applied_coupon ) || ! isset( $applied_coupon->status ) || $applied_coupon->status != 'used' ) {
					continue;
				}

				$current_date            = strtotime( gmdate( "Y-m-d H:i:s" ) );
				$update_user_reward_data = [];
				$discount_id             = isset( $applied_coupon->discount_id ) && $applied_coupon->discount_id > 0 ? $applied_coupon->discount_id : 0;
				if ( isset( $applied_coupon->end_at ) && ( $applied_coupon->end_at == 0 || ( $applied_coupon->end_at > 0 && $current_date < $applied_coupon->end_at ) ) ) {
					$update_user_reward_data['status'] = 'active';

					if ( $order_status != 'cancelled' ) {
						$usage_count        = get_post_meta( $discount_id, 'usage_count', true );
						$usage_count_status = $usage_count - 1 >= 0;
						update_post_meta( $discount_id, 'usage_count', ( $usage_count_status ? $usage_count - 1 : 0 ) );
						delete_post_meta( $discount_id, '_used_by' );
					}
				} elseif ( $applied_coupon->end_at > 0 ) {
					$update_user_reward_data = [
						'status' => 'expired',
						'end_at' => strtotime( $expire_date ),
					];
					update_post_meta( $discount_id, 'expiry_date', $this->get_coupon_expiry_date( wc_clean( $expire_date ) ) );
					update_post_meta( $discount_id, 'date_expires', $this->get_coupon_expiry_date( wc_clean( $expire_date ), true ) );
				}

				if ( ! empty( $update_user_reward_data ) ) {
					$update_where            = [
						'email'         => $user_email,
						'discount_code' => $coupon_code
					];
					$user_reward_model_table = new UserRewards();
					$user_reward_model_table->updateRow( $update_user_reward_data, $update_where );
				}
				$reward_translation_model_table = new RewardTransactions();
				$update_where                   = [
					'user_email'    => $user_email,
					'order_id'      => $order_id,
					'discount_code' => $coupon_code
				];
				$reward_translation_model_table->deleteRow( $update_where );
				$log_data = [
					'user_email'          => $user_email,
					'action_type'         => $applied_coupon->action_type,
					'reward_id'           => $applied_coupon->reward_id,
					'user_reward_id'      => $applied_coupon->id,
					'campaign_id'         => $applied_coupon->campaign_id,
					'earn_campaign_id'    => 0,
					/* translators: 1: coupon code 2: email 3: order id */
					'note'                => sprintf( __( '%1$s coupon return back to %2$s for # %3$s order return', 'wp-loyalty-rules' ), $coupon_code, $user_email, $order_id ),
					/* translators: %s: coupon code */
					'customer_note'       => sprintf( __( '%s coupon return back for order return', 'wp-loyalty-rules' ), $coupon_code ),
					'order_id'            => $order_id,
					'created_at'          => strtotime( gmdate( 'Y-m-d H:i:s' ) ),
					'action_process_type' => 'return_reward',
					'reward_display_name' => $applied_coupon->display_name,
					'required_points'     => 0,
					'discount_code'       => $coupon_code,
				];
				$this->add_note( $log_data );

				// if status is used and not expired, then change user reward status active
				// delete record from Reward Transaction
				// if status is used and expired, then change user reward status expired
				// delete record from Reward Transaction

			}
			self::$woocommerce_helper->updateOrderMetaData( $order_id, '_wlr_point_coupon_return_status', true );
		}
		self::$woocommerce_helper->updateOrderMetaData( $order_id, '_wlr_points_return_status', true );
	}

	public static function getInstance( array $config = [] ) {
		if ( ! self::$instance ) {
			self::$instance = new self( $config );
		}

		return self::$instance;
	}

	function processOrderEarnPoint( $order_id ) {
		if ( empty( $order_id ) ) {
			return false;
		}

		if ( self::$woocommerce_helper->getOrderMetaData( $order_id, '_wlr_points_earned_status', false ) ) {
			return true;
		}

		$order = self::$woocommerce_helper->getOrder( $order_id );
		if ( empty( $order ) || ! is_object( $order ) ) {
			return false;
		}

		$user_email = self::$woocommerce_helper->getOrderEmail( $order );
		if ( empty( $user_email ) ) {
			return false;
		}

		$action_data = [
			'user_email'         => $user_email,
			'order'              => $order,
			'order_id'           => $order_id,
			'is_calculate_based' => 'order'
		];

		if ( $this->applyEarnCampaign( $action_data ) ) {
			self::$woocommerce_helper->updateOrderMetaData( $order_id, '_wlr_points_earned_status', true );

			return true;
		}

		return false;
	}

	function applyEarnCampaign( $action_data ) {
		if ( ! is_array( $action_data ) || empty( $action_data['user_email'] ) ) {
			return false;
		}

		$status           = false;
		$cart_action_list = $this->getCartActionList();

		foreach ( $cart_action_list as $action_type ) {
			$variant_reward = $this->getTotalEarning( $action_type, [], $action_data );

			foreach ( $variant_reward as $campaign_id => $v_reward ) {
				if ( isset( $v_reward['point'] ) && ! empty( $v_reward['point'] ) && $v_reward['point'] > 0 ) {
					$point_status = $this->addEarnCampaignPoint( $action_type, $v_reward['point'], $campaign_id, $action_data );
					if ( $point_status ) {
						$status = true;
					}
				}

				if ( isset( $v_reward['rewards'] ) && $v_reward['rewards'] ) {
					foreach ( $v_reward['rewards'] as $single_reward ) {
						$reward_status = $this->addEarnCampaignReward( $action_type, $single_reward, $campaign_id, $action_data );
						if ( $reward_status ) {
							$status = true;
						}
					}
				}

			}
		}
		self::$woocommerce_helper->_log( 'applyEarnCampaign status:' . $status );

		return $status;
	}

	function addEarnCampaignPoint( $action_type, $point, $campaign_id, $action_data ) {
		self::$woocommerce_helper->_log( 'Reached EarnCampaign::addEarnCampaignPoint' );
		if ( ! is_array( $action_data ) || $point <= 0 || empty( $action_data['user_email'] ) || empty( $action_type ) || ! $this->is_valid_action( $action_type ) ) {
			return false;
		}
		self::$woocommerce_helper->_log( 'Action :' . $action_type . ',Campaign id:' . $campaign_id . ', Point :' . $point );

		$point      = apply_filters( 'wlr_before_add_earn_point', $point, $action_type, $action_data );
		$point      = apply_filters( 'wlr_notify_before_add_earn_point', $point, $action_type, $action_data );
		$conditions = [
			'user_email' => [
				'operator' => '=',
				'value'    => sanitize_email( $action_data['user_email'] )
			]
		];
		$user       = self::$user_model->getQueryData( $conditions, '*', [], false );
		$id         = 0;
		if ( ! empty( $user ) && $user->id > 0 ) {
			$id               = $user->id;
			$user->points     += $point;
			$earn_total_point = $user->earn_total_point + $point;
			$_data            = [
				'points'           => $user->points,
				'earn_total_point' => $earn_total_point
			];
		} else {
			$uniqueReferCode = $this->get_unique_refer_code( '', false, $action_data['user_email'] );
			$_data           = [
				'user_email'        => sanitize_email( $action_data['user_email'] ),
				'refer_code'        => $uniqueReferCode,
				'used_total_points' => 0,
				'points'            => $point,
				'earn_total_point'  => $point,
				'birth_date'        => 0,
				'created_date'      => strtotime( gmdate( "Y-m-d H:i:s" ) ),
			];
		}

		if ( ( isset( $action_data['order_id'] ) && ! empty( $action_data['order_id'] ) && isset( $action_data['order'] ) && ! empty( $action_data['order'] ) ) && self::$woocommerce_helper->isMethodExists( $action_data['order'], 'get_meta' ) ) {
			$user_dob = $action_data['order']->get_meta( 'wlr_dob' );
			if ( ! empty( $user_dob ) ) {
				$_data['birth_date']    = strtotime( $user_dob );
				$_data['birthday_date'] = $user_dob;
			}
		}

		$ledger_data = [
			'user_email'  => $action_data['user_email'],
			'points'      => $point,
			'action_type' => $action_type,
			'note'        => $this->processLogData( 'point', $action_type, $point, '', $action_data ),
			'created_at'  => strtotime( gmdate( "Y-m-d H:i:s" ) )
		];

		self::$woocommerce_helper->_log( 'Action :' . $action_type . ',Campaign id:' . $campaign_id . ', Ledger data:' . json_encode( $ledger_data ) . ',User data:' . json_encode( $_data ) );

		if ( $action_type == 'referral' ) {
			self::$woocommerce_helper->set_referral_code( '' );
		}
		$args = [
			'user_email'       => $action_data['user_email'],
			'points'           => (int) $point,
			'action_type'      => $action_type,
			'campaign_type'    => 'point',
			'transaction_type' => 'credit',
			'referral_type'    => isset( $action_data['referral_type'] ) && ! empty( $action_data['referral_type'] ) ? $action_data['referral_type'] : '',
			'display_name'     => '',
			'campaign_id'      => $campaign_id,
			'created_at'       => strtotime( gmdate( "Y-m-d H:i:s" ) ),
			'modified_at'      => 0,
			'product_id'       => null,
			'order_id'         => null,
			'admin_user_id'    => null,
			'log_data'         => '{}',
			'action_sub_type'  => isset( $action_data['action_sub_type'] ) && ! empty( $action_data['action_sub_type'] ) ? $action_data['action_sub_type'] : '',
			'action_sub_value' => isset( $action_data['action_sub_value'] ) && ! empty( $action_data['action_sub_value'] ) ? $action_data['action_sub_value'] : '',
		];
		if ( ( isset( $action_data['order_currency'] ) && ! empty( $action_data['order_currency'] ) ) ) {
			$args['order_currency'] = $action_data['order_currency'];
		}
		if ( ( isset( $action_data['order_total'] ) && ! empty( $action_data['order_total'] ) ) ) {
			$args['order_total'] = $action_data['order_total'];
		}
		if ( isset( $action_data['product_id'] ) ) {
			$args['product_id'] = $action_data['product_id'];
		}
		if ( isset( $action_data['log_data'] ) ) {
			$args['log_data'] = json_encode( $action_data['log_data'] );
		}
		if ( is_admin() ) {
			$admin_user            = wp_get_current_user();
			$args['admin_user_id'] = $admin_user->ID;
		}
		if ( ( isset( $action_data['order_id'] ) && ! empty( $action_data['order_id'] ) ) ) {
			$args['order_id'] = $action_data['order_id'];
			if ( isset( $action_data['order'] ) && ! empty( $action_data['order'] ) && ( ! isset( $args['order_currency'] ) || ! isset( $args['order_total'] ) ) ) {
				$args['order_currency'] = $action_data['order']->get_currency();
				$args['order_total']    = $action_data['order']->get_total();
			}
		}

		self::$woocommerce_helper->_log( 'Action :' . $action_type . ',Campaign id:' . $campaign_id . ', Earn Trans Data:' . json_encode( $args ) );

		try {
			$earn_trans_id = self::$earn_campaign_transaction_model->insertRow( $args );
			if ( ! self::$user_model->insertOrUpdate( $_data, $id ) ) {
				self::$earn_campaign_transaction_model->deleteRow( [ 'id' => $earn_trans_id ] );

				return false;
			}
			$this->updatePointLedger( $ledger_data );
			self::$woocommerce_helper->_log( 'Action :' . $action_type . ',Campaign id:' . $campaign_id . ', Earn Trans id:' . $earn_trans_id );

			$earn_trans_id = apply_filters( 'wlr_after_add_earn_point_transaction', $earn_trans_id, $args );
			if ( $earn_trans_id == 0 ) {
				return false;
			}

			$customer_note = apply_filters( 'wlr_earn_point_customer_note', $this->processLogData( 'point', $action_type, $point, '', $action_data ), [
				'type'        => 'point',
				'action_type' => $action_type,
				'campaign_id' => $campaign_id,
				'point'       => $point,
				'action_data' => $action_data
			] );

			if ( ! empty( $customer_note ) && isset( $args['order_id'] ) && $args['order_id'] > 0 ) {
				$order_obj = self::$woocommerce_helper->getOrder( $args['order_id'] );
				if ( ! empty( $order_obj ) ) {
					$order_note = $customer_note . '(' . $action_data['user_email'] . ')';
					$order_obj->add_order_note( $order_note );
				}
			}

			$log_data = [
				'user_email'          => sanitize_email( $action_data['user_email'] ),
				'action_type'         => $action_type,
				'earn_campaign_id'    => $earn_trans_id,
				'campaign_id'         => $campaign_id,
				'note'                => $customer_note,
				'customer_note'       => $customer_note,
				'order_id'            => isset( $args['order_id'] ) && ! empty( $args['order_id'] ) ? $args['order_id'] : 0,
				'product_id'          => isset( $args['product_id'] ) && ! empty( $args['product_id'] ) ? $args['product_id'] : 0,
				'admin_id'            => isset( $args['admin_user_id'] ) && ! empty( $args['admin_user_id'] ) ? $args['admin_user_id'] : 0,
				'created_at'          => strtotime( gmdate( 'Y-m-d H:i:s' ) ),
				'modified_at'         => 0,
				'points'              => $point,
				'action_process_type' => 'earn_point',
				'referral_type'       => isset( $action_data['referral_type'] ) && ! empty( $action_data['referral_type'] ) ? $action_data['referral_type'] : '',
			];
			self::$woocommerce_helper->_log( 'Action :' . $action_type . ',Campaign id:' . $campaign_id . ', Log data:' . json_encode( $log_data ) );

			$log_data = apply_filters( 'wlr_before_earn_point_log_data', $log_data, $action_type, $action_data );
			$this->add_note( $log_data );
		} catch ( \Exception $e ) {
			self::$woocommerce_helper->_log( 'Action :' . $action_type . ',Campaign id:' . $campaign_id . ', Earn Trans/ Log Exception:' . $e->getMessage() );

			return false;
		}
		self::$woocommerce_helper->_log( 'Action :' . $action_type . ',Campaign id:' . $campaign_id . ', Point earning status: yes' );

		\WC_Emails::instance();
		$action_data['campaign_id'] = $campaign_id;
		do_action( 'wlr_after_add_earn_point', $action_data['user_email'], $point, $action_type, $action_data );
		do_action( 'wlr_notify_after_add_earn_point', $action_data['user_email'], $point, $action_type, $action_data );

		return true;
	}

	function addEarnCampaignReward(
		$action_type, $reward, $campaign_id, $action_data,
		$force_generate_coupon = false
	) {
		self::$woocommerce_helper->_log( 'Reached EarnCampaign::addEarnCampaignReward' );
		if ( ! is_array( $action_data ) || ! isset( $reward->id ) || $reward->id <= 0 || empty( $action_data['user_email'] ) || empty( $action_type ) || ! $this->is_valid_action( $action_type ) ) {
			return false;
		}
		self::$woocommerce_helper->_log( 'Action :' . $action_type . ',Campaign id:' . $campaign_id . ', Reward id :' . $reward->id );

		$reward   = apply_filters( 'wlr_before_add_earn_reward', $reward, $action_type, $action_data );
		$reward   = apply_filters( 'wlr_notify_before_add_earn_reward', $reward, $action_type, $action_data );
		$user     = $this->getPointUserByEmail( $action_data['user_email'] );
		$status   = true;
		$user_dob = null;

		if ( ( isset( $action_data['order_id'] ) && ! empty( $action_data['order_id'] ) && isset( $action_data['order'] ) && ! empty( $action_data['order'] ) ) && self::$woocommerce_helper->isMethodExists( $action_data['order'], 'get_meta' ) ) {
			$user_dob = $action_data['order']->get_meta( 'wlr_dob' );
		}

		if ( empty( $user ) ) {
			$uniqueReferCode = $this->get_unique_refer_code( '', false, $action_data['user_email'] );
			$_data           = [
				'user_email'        => $action_data['user_email'],
				'refer_code'        => $uniqueReferCode,
				'points'            => 0,
				'used_total_points' => 0,
				'earn_total_point'  => 0,
				'birth_date'        => ! empty( $user_dob ) ? strtotime( $user_dob ) : 0,
				'birthday_date'     => $user_dob,
				'created_date'      => strtotime( gmdate( "Y-m-d H:i:s" ) ),
			];

			self::$woocommerce_helper->_log( 'Action :' . $action_type . ',Campaign id:' . $campaign_id . ',Reward id :' . $reward->id . ', User data:' . json_encode( $_data ) );

			$status = (bool) self::$user_model->insertOrUpdate( $_data );
			self::$woocommerce_helper->_log( 'Action :' . $action_type . ',Campaign id:' . $campaign_id . ',Reward id :' . $reward->id . ', User insert status:' . $status );
		} elseif ( is_object( $user ) && isset( $user->id ) && $user->id > 0 &&
		           ( isset( $action_data['order_id'] ) && ! empty( $action_data['order_id'] ) && isset( $action_data['order'] )
		             && ! empty( $action_data['order'] ) ) && self::$woocommerce_helper->isMethodExists( $action_data['order'], 'get_meta' ) ) {

			$user_dob = $action_data['order']->get_meta( 'wlr_dob' );
			if ( ! empty( $user_dob ) ) {
				$_data  = array( 'birth_date' => $user_dob );
				$status = (bool) self::$user_model->insertOrUpdate( $_data, $user->id );
			}
		}
		if ( ! $status ) {
			return false;
		}

		if ( $action_type == 'referral' ) {
			self::$woocommerce_helper->set_referral_code( '' );
		}
		$args = [
			'user_email'       => $action_data['user_email'],
			'points'           => 0,
			'action_type'      => $action_type,
			'campaign_type'    => 'coupon',
			'transaction_type' => 'credit',
			'display_name'     => $reward->display_name,
			'campaign_id'      => $campaign_id,
			'reward_id'        => $reward->id,
			'created_at'       => strtotime( gmdate( "Y-m-d H:i:s" ) ),
			'modified_at'      => 0,
			'product_id'       => null,
			'order_id'         => null,
			'admin_user_id'    => null,
			'log_data'         => '{}',
			'referral_type'    => isset( $action_data['referral_type'] ) && ! empty( $action_data['referral_type'] ) ? $action_data['referral_type'] : '',
			'action_sub_type'  => isset( $action_data['action_sub_type'] ) && ! empty( $action_data['action_sub_type'] ) ? $action_data['action_sub_type'] : '',
			'action_sub_value' => isset( $action_data['action_sub_value'] ) && ! empty( $action_data['action_sub_value'] ) ? $action_data['action_sub_value'] : '',
		];
		if ( ( isset( $action_data['order_currency'] ) && ! empty( $action_data['order_currency'] ) ) ) {
			$args['order_currency'] = $action_data['order_currency'];
		}
		if ( ( isset( $action_data['order_total'] ) && ! empty( $action_data['order_total'] ) ) ) {
			$args['order_total'] = $action_data['order_total'];
		}

		if ( ( isset( $action_data['order_id'] ) && ! empty( $action_data['order_id'] ) ) ) {
			$args['order_id'] = $action_data['order_id'];
			if ( isset( $action_data['order'] ) && ! empty( $action_data['order'] ) && ( ! isset( $args['order_currency'] ) || ! isset( $args['order_total'] ) ) ) {
				$args['order_currency'] = $action_data['order']->get_currency();
				$args['order_total']    = $action_data['order']->get_total();
			}
		}
		if ( isset( $action_data['product_id'] ) ) {
			$args['product_id'] = $action_data['product_id'];
		}
		if ( isset( $action_data['log_data'] ) ) {
			$args['log_data'] = json_encode( $action_data['log_data'] );
		}
		if ( is_admin() ) {
			$admin_user            = wp_get_current_user();
			$args['admin_user_id'] = $admin_user->ID;
		}

		self::$woocommerce_helper->_log( 'Action :' . $action_type . ',Campaign id:' . $campaign_id . ',Reward id :' . $reward->id . ', Earn trans data:' . json_encode( $args ) );

		try {
			$earn_trans_id = self::$earn_campaign_transaction_model->insertRow( $args );
			self::$woocommerce_helper->_log( 'Action :' . $action_type . ',Campaign id:' . $campaign_id . ',Reward id :' . $reward->id . ', Earn trans id:' . $earn_trans_id );
			if ( $earn_trans_id == 0 ) {
				$status = false;
			}
		} catch ( \Exception $e ) {
			self::$woocommerce_helper->_log( 'Action :' . $action_type . ',Campaign id:' . $campaign_id . ',Reward id :' . $reward->id . ', Earn trans exception:' . $e->getMessage() );
			$status = false;
		}
		if ( ! $status ) {
			return false;
		}
		$user_reward_data = [
			'name'                   => $reward->name,
			'description'            => $reward->description,
			'email'                  => sanitize_email( $action_data['user_email'] ),
			'reward_type'            => $reward->reward_type,
			'display_name'           => $reward->display_name,
			'discount_type'          => $reward->discount_type,
			'discount_value'         => $reward->discount_value,
			'reward_currency'        => self::$woocommerce_helper->getDefaultWoocommerceCurrency(),
			'discount_code'          => '',
			'discount_id'            => 0,
			'require_point'          => $reward->require_point,
			'status'                 => 'open',
			'start_at'               => 0,
			'end_at'                 => 0,
			'conditions'             => $reward->conditions,
			'condition_relationship' => $reward->condition_relationship,
			'usage_limits'           => $reward->usage_limits,
			'icon'                   => $reward->icon,
			'action_type'            => $action_type,
			'reward_id'              => $reward->id,
			'campaign_id'            => $campaign_id,
			'free_product'           => $reward->free_product,
			'expire_after'           => $reward->expire_after,
			'expire_period'          => $reward->expire_period,
			'enable_expiry_email'    => $reward->enable_expiry_email,
			'expire_email'           => $reward->expire_email,
			'expire_email_period'    => $reward->expire_email_period,
			'created_at'             => strtotime( gmdate( "Y-m-d H:i:s" ) ),
			'modified_at'            => 0
		];
		self::$woocommerce_helper->_log( 'Action :' . $action_type . ',Campaign id:' . $campaign_id . ',Reward id :' . $reward->id . ', User reward data:' . json_encode( $user_reward_data ) );
		$user_reward_model = new UserRewards();
		try {
			$user_reward_status
				= $user_reward_model->insertRow( $user_reward_data );
			self::$woocommerce_helper->_log( 'Action :' . $action_type . ',Campaign id:' . $campaign_id . ',Reward id :' . $reward->id . ', User reward status:' . $user_reward_status );
			if ( $user_reward_status <= 0 ) {
				return false;
			}
			$action_data['user_reward_id'] = $user_reward_status;
			$customer_note                 = $this->processLogData( 'reward', $action_type, '', $reward->display_name, $action_data );

			if ( ! empty( $customer_note ) && isset( $args['order_id'] ) && $args['order_id'] > 0 ) {
				$order_obj  = self::$woocommerce_helper->getOrder( $args['order_id'] );
				$order_note = $customer_note . '(' . $action_data['user_email'] . ')';
				if ( ! empty( $order_obj ) ) {
					$order_obj->add_order_note( $order_note );
				}
			}

			$log_data = [
				'user_email'          => sanitize_email( $action_data['user_email'] ),
				'action_type'         => $action_type,
				'reward_id'           => $reward->id,
				'user_reward_id'      => $user_reward_status,
				'campaign_id'         => $campaign_id,
				'note'                => $customer_note,
				'customer_note'       => $customer_note,
				'order_id'            => isset( $action_data['order_id'] ) && ! empty( $action_data['order_id'] ) ? $action_data['order_id'] : 0,
				'product_id'          => isset( $action_data['product_id'] ) && ! empty( $action_data['product_id'] ) ? $action_data['product_id'] : 0,
				'admin_id'            => isset( $action_data['admin_user_id'] ) && ! empty( $action_data['admin_user_id'] ) ? $action_data['admin_user_id'] : 0,
				'created_at'          => strtotime( gmdate( 'Y-m-d H:i:s' ) ),
				'modified_at'         => 0,
				'action_process_type' => 'earn_reward',
				'reward_display_name' => $reward->display_name,
				'referral_type'       => isset( $action_data['referral_type'] ) && ! empty( $action_data['referral_type'] ) ? $action_data['referral_type'] : '',
			];
			self::$woocommerce_helper->_log( 'Action :' . $action_type . ',Campaign id:' . $campaign_id . ',Reward id :' . $reward->id . ', Log data:' . json_encode( $log_data ) );
			$log_data = apply_filters( 'wlr_before_earn_reward_log_data', $log_data, $action_type, $action_data, $reward );
			$this->add_note( $log_data );
			$options                    = self::$woocommerce_helper->getOptions( 'wlr_settings' );
			$allow_auto_generate_coupon = $force_generate_coupon || ( ! ( is_array( $options ) && isset( $options['allow_auto_generate_coupon'] ) && $options['allow_auto_generate_coupon'] == 'no' ) );
			if ( $allow_auto_generate_coupon ) {
				$allow_auto_generate_coupon = $this->checkFreeProductCoupon( $allow_auto_generate_coupon, $reward );
			}
			if ( $allow_auto_generate_coupon ) {
				$user_reward_table = $user_reward_model->getByKey( $user_reward_status );
				if ( ! empty( $user_reward_table ) ) {
					$reward_helper = new Rewards();
					if ( isset( $user_reward_table->discount_code ) && empty( $user_reward_table->discount_code ) ) {
						$update_data                 = [
							'start_at' => strtotime( gmdate( "Y-m-d H:i:s" ) ),
						];
						$user_reward_table->start_at = $update_data['start_at'];
						if ( $user_reward_table->expire_after > 0 ) {
							$expire_period             = isset( $user_reward_table->expire_period ) && ! empty( $user_reward_table->expire_period ) ? $user_reward_table->expire_period : 'day';
							$update_data['end_at']     = strtotime( gmdate( "Y-m-d H:i:s", strtotime( "+" . $user_reward_table->expire_after . " " . $expire_period ) ) );
							$user_reward_table->end_at = $update_data['end_at'];

							if ( isset( $user_reward_table->expire_email ) && $user_reward_table->expire_email > 0 && isset( $user_reward_table->enable_expiry_email ) && $user_reward_table->enable_expiry_email > 0 ) {
								$expire_email_period              = isset( $user_reward_table->expire_email_period ) && ! empty( $user_reward_table->expire_email_period ) ? $user_reward_table->expire_email_period : 'day';
								$update_data['expire_email_date'] = $user_reward_table->expire_email_date = strtotime( gmdate( "Y-m-d H:i:s", strtotime( "+" . $user_reward_table->expire_email . " " . $expire_email_period ) ) );
							}
						}
						self::$woocommerce_helper->_log( 'Action :' . $action_type . ',Campaign id:' . $campaign_id . ',Reward id :' . $reward->id . ', auto generate Update data:' . json_encode( $update_data ) );
						$update_where = [ 'id' => $user_reward_table->id ];
						$user_reward_model->updateRow( $update_data, $update_where );
					}
					$reward_helper->createCartUserReward( $user_reward_table, $log_data['user_email'] );
				}
			}
		} catch ( \Exception $e ) {
			self::$woocommerce_helper->_log( 'Action :' . $action_type . ',Campaign id:' . $campaign_id . ',Reward id :' . $reward->id . ', User reward exception:' . $e->getMessage() );
			$status = false;
		}
		self::$woocommerce_helper->_log( 'Action :' . $action_type . ',Campaign id:' . $campaign_id . ',Reward id :' . $reward->id . ', Reward earning status:' . $status );
		if ( $status ) {
			\WC_Emails::instance();
			$action_data['campaign_id'] = $campaign_id;
			do_action( 'wlr_after_add_earn_reward', $action_data['user_email'], $reward, $action_type, $action_data );
			do_action( 'wlr_notify_after_add_earn_reward', $action_data['user_email'], $reward, $action_type, $action_data );
		}

		return $status;
	}

	function processLogData( $log_type, $action_type, $point, $reward_name, $action_data ) {
		$label = ( $log_type == 'point' ) ? $this->getPointLabel( $point ) : $this->getRewardLabel( 1 );
		if ( $log_type == 'reward' && $action_type == 'achievement' ) {
			/* translators: 1: reward name 2: label 3: action name 4. Achievement name */
			return sprintf( __( '%1$s %2$s earned via %3$s (%4$s)', 'wp-loyalty-rules' ), $reward_name, $label, $this->getActionName( $action_type ), $this->getAchievementName( $action_data['action_sub_type'] ) );
		} elseif ( $log_type == 'reward' && $action_type == 'referral' ) {
			$referral_type = ! empty( $action_data['referral_type'] ) ? $action_data['referral_type'] : '';
			$mail          = ( $referral_type == 'advocate' ) ? $action_data['friend_email'] : $action_data['advocate_email'];
			if ( $referral_type == 'advocate' ) {
				/* translators: 1: reward name 2: label 3: action name 4: email */
				return sprintf( __( '%1$s %2$s earned via %3$s for referring %4$s', 'wp-loyalty-rules' ), $reward_name, $label, $this->getActionName( $action_type ), $mail );
			} else {
				/* translators: 1: reward name 2: label 3: action name 4: email */
				return sprintf( __( '%1$s %2$s earned via %3$s from referrer %4$s', 'wp-loyalty-rules' ), $reward_name, $label, $this->getActionName( $action_type ), $mail );
			}
		} elseif ( $log_type == 'reward' ) {
			/* translators: 1: reward name 2: reward label 3: action name */
			return sprintf( __( '%1$s %2$s earned via %3$s', 'wp-loyalty-rules' ), $reward_name, $label, $this->getActionName( $action_type ) );
		} elseif ( $log_type == 'point' && $action_type == 'achievement' ) {
			/* translators: 1: point 2: label 3: action name 4: Achievement name */
			return sprintf( __( '%1$s %2$s earned via %3$s (%4$s)', 'wp-loyalty-rules' ), $point, $label, $this->getActionName( $action_type ), $this->getAchievementName( $action_data['action_sub_type'] ) );
		} elseif ( $log_type == 'point' && $action_type == 'referral' ) {
			$referral_type = ! empty( $action_data['referral_type'] ) ? $action_data['referral_type'] : '';
			$mail          = ( $referral_type == 'advocate' ) ? $action_data['friend_email'] : $action_data['advocate_email'];
			if ( $referral_type == 'advocate' ) {
				/* translators: 1: point 2: label 3: action name 4: email */
				return sprintf( __( '%1$s %2$s earned via %3$s for referring %4$s', 'wp-loyalty-rules' ), $point, $label, $this->getActionName( $action_type ), $mail );
			} else {
				/* translators: 1: point 2: label 3: action name 4: email */
				return sprintf( __( '%1$s %2$s earned via %3$s from referrer %4$s', 'wp-loyalty-rules' ), $point, $label, $this->getActionName( $action_type ), $mail );
			}
		} else {
			/* translators: 1: point 2: label 3: action name */
			return sprintf( __( '%1$s %2$s earned via %3$s ', 'wp-loyalty-rules' ), $point, $label, $this->getActionName( $action_type ) );
		}

	}

	/**
	 * Check free product out of stock status.
	 *
	 * @param boolean $status Instant coupon apply.
	 * @param object $reward Reward data.
	 *
	 * @return bool
	 */
	function checkFreeProductCoupon( $status, $reward ) {
		if ( ! isset( $reward->id ) || $reward->id <= 0 ) {
			return $status;
		}
		$reward_modal = new \Wlr\App\Models\Rewards();
		$reward_data  = $reward_modal->getByKey( $reward->id );
		if ( empty( $reward_data ) || $reward_data->discount_type != "free_product" ) {
			return $status;
		}
		$free_products = self::$woocommerce_helper->isJson( $reward_data->free_product ) ? json_decode( $reward_data->free_product, true ) : [];
		if ( empty( $free_products ) ) {
			return $status;
		}
		foreach ( $free_products as $f_product ) {
			$product = wc_get_product( $f_product['value'] );
			if ( $product && ! $product->is_in_stock() ) {
				return false;
			}
		}

		return $status;
	}

	function addPointValue( $reward_list ) {
		$point = 0;
		if ( empty( $reward_list ) || ! is_array( $reward_list ) ) {
			return $point;
		}

		foreach ( $reward_list as $action_rewards ) {
			if ( ! is_array( $action_rewards ) ) {
				continue;
			}
			foreach ( $action_rewards as $campaign ) {
				if ( isset( $campaign['point'] ) ) {
					$point += $campaign['point'];
				}
			}
		}

		return $point;
	}

	function concatRewards( $reward_list ) {
		$reward = '';
		if ( empty( $reward_list ) || ! is_array( $reward_list ) ) {
			return $reward;
		}
		foreach ( $reward_list as $action_rewards ) {
			if ( ! is_array( $action_rewards ) ) {
				continue;
			}
			foreach ( $action_rewards as $campaign ) {
				if ( isset( $campaign['rewards'] ) && ! empty( $campaign['rewards'] ) ) {
					foreach ( $campaign['rewards'] as $single_reward ) {
						if ( isset( $single_reward->display_name ) && ! empty( $single_reward->display_name ) ) {
							$reward .= __( $single_reward->display_name, 'wp-loyalty-rules' ) . ',';//phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText
						}
					}
				}
			}
		}

		return trim( $reward, ',' );
	}

	function getPointEarnedFromOrder( $order_id, $email = '' ) {
		$point = 0;
		if ( $order_id <= 0 ) {
			return $point;
		}
		$point_transaction = new EarnCampaignTransactions();
		global $wpdb;
		$where = $wpdb->prepare( 'order_id = %s AND transaction_type = %s', [ $order_id, 'credit' ] );
		if ( ! empty( $email ) ) {
			$where .= $wpdb->prepare( ' AND user_email = %s', [ $email ] );
		}
		$transactions = $point_transaction->getWhere( $where, '*', false );
		if ( ! empty( $transactions ) ) {
			foreach ( $transactions as $transaction ) {
				$point += $transaction->points;
			}
		}

		return $point;
	}

	function changeDisplayDate( $campaign ) {
		if ( isset( $campaign->start_at ) && ! empty( $campaign->start_at ) ) {
			$campaign->start_at = self::$woocommerce_helper->beforeDisplayDate( $campaign->start_at, 'Y-m-d' );
		}
		if ( isset( $campaign->end_at ) && ! empty( $campaign->end_at ) ) {
			$campaign->end_at = self::$woocommerce_helper->beforeDisplayDate( $campaign->end_at, 'Y-m-d' );
		}

		return $campaign;
	}

	function getCampaignPointReward( $active_campaigns ) {
		$base_helper  = new \Wlr\App\Helpers\Base();
		$reward_table = new \Wlr\App\Models\Rewards();
		if ( empty( $active_campaigns ) || ! is_object( $active_campaigns ) ) {
			return $active_campaigns;
		}
		$campaign_point_rule                       = self::$woocommerce_helper->isJson( $active_campaigns->point_rule ) ? json_decode( $active_campaigns->point_rule ) : new stdClass();
		$active_campaigns->campaign_title_discount = "";
		if ( isset( $active_campaigns->action_type ) && $active_campaigns->action_type == "referral" ) {
			/* advocate point & coupon*/
			if ( isset( $campaign_point_rule->advocate ) && isset( $campaign_point_rule->advocate->campaign_type ) && ! empty( $campaign_point_rule->advocate->campaign_type ) && $campaign_point_rule->advocate->campaign_type == 'point' ) {
				$point_label                               = isset( $campaign_point_rule->advocate->earn_type ) && ( $campaign_point_rule->advocate->earn_type == 'subtotal_percentage' )
				                                             && isset( $campaign_point_rule->advocate->earn_point ) && ! empty( $campaign_point_rule->advocate->earn_point ) ? round( $campaign_point_rule->advocate->earn_point ) . "%" : " ";
				$point_label                               = isset( $campaign_point_rule->advocate->earn_type ) && ( $campaign_point_rule->advocate->earn_type == 'fixed_point' )
				                                             && isset( $campaign_point_rule->advocate->earn_point ) && ! empty( $campaign_point_rule->advocate->earn_point ) ? $campaign_point_rule->advocate->earn_point : $point_label;
				$active_campaigns->campaign_title_discount .= isset( $campaign_point_rule->advocate->earn_point ) && ! empty( $campaign_point_rule->advocate->earn_point ) && ! empty( $point_label )
					? /* translators: 1: point label 2: content */
					sprintf( __( 'You get %1$s : %2$s', 'wp-loyalty-rules' ), $base_helper->getPointLabel( $campaign_point_rule->advocate->earn_point ), $point_label ) : "";
			} else if ( isset( $campaign_point_rule->advocate ) && isset( $campaign_point_rule->advocate->campaign_type )
			            && ! empty( $campaign_point_rule->advocate->campaign_type )
			            && $campaign_point_rule->advocate->campaign_type == 'coupon' ) {
				$advocate_reward = isset( $campaign_point_rule->advocate->earn_reward ) && ! empty( $campaign_point_rule->advocate->earn_reward )
					? $reward_table->findReward( (int) $campaign_point_rule->advocate->earn_reward ) : "";

				$point_label = isset( $advocate_reward->discount_type ) && ( $advocate_reward->discount_type == 'percent' ) ? round( $advocate_reward->discount_value ) . "%" : " ";
				$point_label = isset( $advocate_reward->discount_type ) && ( $advocate_reward->discount_type == 'fixed_cart' )
					? wc_price( $advocate_reward->discount_value, [] ) : $point_label;

				if ( ! empty( $advocate_reward ) ) {
					$active_campaigns->campaign_title_discount .= ! empty( $point_label ) ? /* translators: %s: point label  */
						sprintf( __( '%s Advocate reward', 'wp-loyalty-rules' ), $point_label ) : "";
				}
			}

			/* Friend point & coupon */
			if ( isset( $campaign_point_rule->friend ) && isset( $campaign_point_rule->friend->campaign_type )
			     && ! empty( $campaign_point_rule->friend->campaign_type ) && $campaign_point_rule->friend->campaign_type == 'point' ) {

				$point_label = isset( $campaign_point_rule->friend->earn_type ) && ( $campaign_point_rule->friend->earn_type == 'subtotal_percentage' )
				               && isset( $campaign_point_rule->friend->earn_point ) && ! empty( $campaign_point_rule->friend->earn_point ) ? round( $campaign_point_rule->friend->earn_point ) . "%" : " ";

				$point_label = isset( $campaign_point_rule->friend->earn_type ) && ( $campaign_point_rule->friend->earn_type == 'fixed_point' )
				               && isset( $campaign_point_rule->friend->earn_point ) && ! empty( $campaign_point_rule->friend->earn_point ) ? $campaign_point_rule->friend->earn_point : $point_label;

				$active_campaigns->campaign_title_discount .= isset( $campaign_point_rule->friend->earn_point ) && ! empty( $campaign_point_rule->friend->earn_point ) && ! empty( $point_label )
					? /* translators: 1: point label 2: label  */
					sprintf( __( ' | Your friend gets %1$s : %2$s', 'wp-loyalty-rules' ), $base_helper->getPointLabel( $campaign_point_rule->friend->earn_point ), $point_label ) : "";

			} else if ( isset( $campaign_point_rule->friend ) && isset( $campaign_point_rule->friend->campaign_type )
			            && ! empty( $campaign_point_rule->friend->campaign_type ) && $campaign_point_rule->friend->campaign_type == 'coupon' ) {

				$friend_reward = isset( $campaign_point_rule->friend->earn_reward ) && ! empty( $campaign_point_rule->friend->earn_reward )
					? $reward_table->findReward( (int) $campaign_point_rule->friend->earn_reward ) : "";

				$point_label = isset( $friend_reward->discount_type ) && ( $friend_reward->discount_type == 'percent' )
					? round( $friend_reward->discount_value ) . "%" : " ";

				$point_label = isset( $friend_reward->discount_type ) && ( $friend_reward->discount_type == 'fixed_cart' )
					? wc_price( $friend_reward->discount_value, [] ) : $point_label;

				if ( ! empty( $friend_reward ) ) {
					$active_campaigns->campaign_title_discount .= ! empty( $point_label ) ? /* translators: %s: point label  */
						sprintf( __( ' | %s Friend reward', 'wp-loyalty-rules' ), $point_label ) : "";
				}
			}

		} else if ( isset( $active_campaigns->campaign_type ) && ! empty( $active_campaigns->campaign_type )
		            && $active_campaigns->campaign_type == 'point' && isset( $campaign_point_rule->earn_point ) ) {

			$active_campaigns->campaign_title_discount .= isset( $active_campaigns->action_type ) && ( $active_campaigns->action_type == 'point_for_purchase' )
				?  /* translators: 1: point 2: point label 3: price */
				sprintf( __( '%1$d %2$s for each %3$d spent', 'wp-loyalty-rules' ), $campaign_point_rule->earn_point, $base_helper->getPointLabel( $campaign_point_rule->earn_point ), $campaign_point_rule->wlr_point_earn_price )
				: sprintf( '+%d %s', $campaign_point_rule->earn_point, $base_helper->getPointLabel( $campaign_point_rule->earn_point ) );

		} else if ( isset( $active_campaigns->campaign_type ) && ! empty( $active_campaigns->campaign_type ) && $active_campaigns->campaign_type == 'coupon' && isset( $campaign_point_rule->earn_reward ) ) {

			$reward      = ! empty( $campaign_point_rule->earn_reward ) ? $reward_table->findReward( (int) $campaign_point_rule->earn_reward ) : "";
			$point_label = isset( $reward->discount_type ) && ( $reward->discount_type == 'percent' ) ? round( $reward->discount_value ) . "%" : " ";
			$point_label = isset( $reward->discount_type ) && ( $reward->discount_type == 'fixed_cart' ) ? wc_price( $reward->discount_value, [] ) : $point_label;
			if ( ! empty( $reward ) ) {
				$active_campaigns->campaign_title_discount .= isset( $reward->discount_value ) && ! empty( $reward->discount_value ) ? /* translators: %s: point label  */
					sprintf( __( '%s reward', 'wp-loyalty-rules' ), $point_label ) : "";
			}
		}

		return apply_filters( "wlr_alter_campaign_selected_data", $active_campaigns );
	}

}
