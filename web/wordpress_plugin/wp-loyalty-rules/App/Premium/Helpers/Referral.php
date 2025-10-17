<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Helpers;

use Wlr\App\Helpers\EarnCampaign;

defined( 'ABSPATH' ) or die();

class Referral extends EarnCampaign {
	public static $instance = null;

	public function __construct( $config = array() ) {
		parent::__construct( $config );
	}

	public static function getInstance( array $config = array() ) {
		if ( ! self::$instance ) {
			self::$instance = new self( $config );
		}

		return self::$instance;
	}

	function processReferralEarnPoint( $order_id ) {
		if ( empty( $order_id ) ) {
			return false;
		}
		$status = self::$woocommerce_helper->getOrderMetaData( $order_id, '_wlr_points_referral_earned_status', false );
		if ( $status ) {
			return $status;
		}
		$order = self::$woocommerce_helper->getOrder( $order_id );

		if ( ! is_null( $order ) && ! empty( $order ) ) {
			$userEmail      = $this->getCustomerEmail( '', $order );
			$advocate_email = $this->getAdvocateEmail( $userEmail );
			if ( ! empty( $userEmail ) && ! empty( $advocate_email ) ) {
				$action_data = array(
					'user_email'         => $userEmail,
					'advocate_email'     => $advocate_email,
					'order'              => $order,
					'order_id'           => $order_id,
					'is_calculate_based' => 'order'
				);

				$status = $this->applyReferralEarnCampaign( $action_data );
				if ( $status ) {
					$referral_table = new \Wlr\App\Models\Referral();
					$query_data     = array(
						'advocate_email' => array( 'operator' => '=', 'value' => $advocate_email ),
						'friend_email'   => array( 'operator' => '=', 'value' => $userEmail ),
						'status'         => array( 'operator' => '=', 'value' => 'pending' )
					);
					$referrals      = $referral_table->getQueryData( $query_data, '*', array(), false, false );
					foreach ( $referrals as $referral ) {
						$updateData = array(
							'status' => 'completed'
						);
						$where      = array( 'id' => $referral->id );
						if ( isset( $referral->id ) && $referral->id > 0 ) {
							$referral_table->updateRow( $updateData, $where );
						}
					}
					self::$woocommerce_helper->updateOrderMetaData( $order_id, '_wlr_points_referral_earned_status', $status );
				}
			}
		}

		return $status;
	}

	function getAdvocateEmail( $friend_email ) {
		$advocate_email = '';
		if ( empty( $friend_email ) ) {
			return $advocate_email;
		}
		$referral_table = new \Wlr\App\Models\Referral();
		$query_data     = array(
			'friend_email' => array( 'operator' => '=', 'value' => $friend_email ),
			'status'       => array( 'operator' => '=', 'value' => 'pending' )
		);
		$referral       = $referral_table->getQueryData( $query_data, '*', array(), false, true );
		$advocate_email = ! empty( $referral ) && isset( $referral->advocate_email ) && ! empty( $referral->advocate_email ) ? $referral->advocate_email : "";
		if ( empty( $advocate_email ) ) {
			$referral_code = self::$woocommerce_helper->get_referral_code();
			if ( ! empty( $referral_code ) ) {
				$advocate_user  = self::$user_model->getQueryData( array(
					'refer_code' => array(
						'operator' => '=',
						'value'    => sanitize_text_field( $referral_code )
					)
				), '*', array(), false, true );
				$advocate_email = ! empty( $advocate_user ) && isset( $advocate_user->user_email ) && ! empty( $advocate_user->user_email ) ? $advocate_user->user_email : '';
			}
		}

		return $advocate_email;
	}

	function applyReferralEarnCampaign( $action_data ) {
		if ( ! is_array( $action_data ) || empty( $action_data['user_email'] ) || ! $this->isEligibleReferralForEarn( 'referral', $action_data ) ) {
			return false;
		}
		$status           = false;
		$cart_action_list = array( 'referral' );
		foreach ( $cart_action_list as $action_type ) {
			$action_data['friend_email'] = $action_data['user_email'];
			$variant_reward              = $this->getTotalReferralEarning( $action_type, array(), $action_data );
			foreach ( $variant_reward as $campaign_id => $v_reward ) {
				if ( isset( $v_reward['advocate']['point'] ) && ! empty( $v_reward['advocate']['point'] ) && $v_reward['advocate']['point'] > 0 && isset( $action_data['advocate_email'] ) && ! empty( $action_data['advocate_email'] ) && ! self::$woocommerce_helper->isBannedUser( $action_data['advocate_email'] ) ) {
					$advocate_data                  = $action_data;
					$advocate_data['user_email']    = $action_data['advocate_email'];
					$advocate_data['referral_type'] = 'advocate';
					$status                         = $this->addEarnCampaignPoint( $action_type, $v_reward['advocate']['point'], $campaign_id, $advocate_data );
				}
				if ( isset( $v_reward['friend']['point'] ) && ! empty( $v_reward['friend']['point'] ) && $v_reward['friend']['point'] > 0 ) {
					$friend_data                  = $action_data;
					$friend_data['referral_type'] = 'friend';
					$status                       = $this->addEarnCampaignPoint( $action_type, $v_reward['friend']['point'], $campaign_id, $friend_data );
				}
				if ( isset( $v_reward['advocate']['coupon'] ) && $v_reward['advocate']['coupon'] && ! self::$woocommerce_helper->isBannedUser( $action_data['advocate_email'] ) ) {
					$advocate_reward_data                  = $action_data;
					$advocate_reward_data['user_email']    = $action_data['advocate_email'];
					$advocate_reward_data['referral_type'] = 'advocate';
					$status                                = $this->addEarnCampaignReward( $action_type, $v_reward['advocate']['coupon'], $campaign_id, $advocate_reward_data );

				}
				if ( isset( $v_reward['friend']['coupon'] ) && $v_reward['friend']['coupon'] ) {
					$friend_reward_data                  = $action_data;
					$friend_reward_data['referral_type'] = 'friend';
					$status                              = $this->addEarnCampaignReward( $action_type, $v_reward['friend']['coupon'], $campaign_id, $friend_reward_data );
				}
			}
		}

		return $status;
	}

	function isEligibleReferralForEarn( $action_type, $extra = array() ) {
		return apply_filters( 'wlr_is_referral_eligible_for_earning', true, $action_type, $extra );
	}

	function getTotalReferralEarning( $action_type = '', $ignore_condition = array(), $extra = array(), $is_product_level = false ) {
		$earning = array();
		if ( ! $this->is_valid_action( $action_type ) ) {
			return $earning;
		}
		$earn_campaign_table = new \Wlr\App\Models\EarnCampaign();
		$campaign_list       = $earn_campaign_table->getCampaignByAction( $action_type );
		if ( ! empty( $campaign_list ) ) {
			$action_data = array(
				'action_type'      => $action_type,
				'ignore_condition' => $ignore_condition,
				'is_product_level' => $is_product_level
			);
			if ( ! empty( $extra ) && is_array( $extra ) ) {
				foreach ( $extra as $key => $value ) {
					$action_data[ $key ] = $value;
				}
			}
			$action_data = apply_filters( 'wlr_before_rule_data_process', $action_data, $campaign_list );
			foreach ( $campaign_list as $campaign ) {
				$processing_campaign = $this->getCampaign( $campaign );
				if ( isset( $processing_campaign->earn_campaign->point_rule ) && ! empty( $processing_campaign->earn_campaign->point_rule ) ) {
					$point_rule = $processing_campaign->earn_campaign->point_rule;
					if ( self::$woocommerce_helper->isJson( $processing_campaign->earn_campaign->point_rule ) ) {
						$point_rule = json_decode( $processing_campaign->earn_campaign->point_rule );
					}
					$campaign_earning = array();
					if ( isset( $point_rule->advocate->campaign_type ) && $point_rule->advocate->campaign_type === 'point' ) {
						$earning[ $campaign->id ]['advocate']['point'] = $campaign_earning['advocate']['point'] = $processing_campaign->getCampaignReferral( $action_data, 'advocate', 'point' );
					} else if ( isset( $point_rule->advocate->campaign_type ) && $point_rule->advocate->campaign_type === 'coupon' ) {
						$earning[ $campaign->id ]['advocate']['coupon'] = $campaign_earning['advocate']['coupon'] = $processing_campaign->getCampaignReferral( $action_data, 'advocate', 'coupon' );
					}
					if ( isset( $point_rule->friend->campaign_type ) && $point_rule->friend->campaign_type === 'point' ) {
						$earning[ $campaign->id ]['friend']['point'] = $campaign_earning['friend']['point'] = $processing_campaign->getCampaignReferral( $action_data, 'friend', 'point' );
					} else if ( isset( $point_rule->friend->campaign_type ) && $point_rule->friend->campaign_type === 'coupon' ) {
						$earning[ $campaign->id ]['friend']['coupon'] = $campaign_earning['friend']['coupon'] = $processing_campaign->getCampaignReferral( $action_data, 'friend', 'coupon' );
					}
					$earning[ $campaign->id ]['messages'] = $this->processCampaignMessage( $action_type, $processing_campaign, $campaign_earning );
				}
			}
		}

		return $earning;
	}

	function getCampaignReferral( $data, $referral_type, $earn_type = 'point' ) {
		/**
		 * 1. Check level, active
		 */
		$status = true;
		if ( ! $this->isActive() ) {
			$status = false;
		}
		if ( $status && ( empty( $referral_type ) || ! in_array( $referral_type, array( 'advocate', 'friend' ) ) ) ) {
			$status = false;
		}
		if ( $status && ( empty( $earn_type ) || ! in_array( $earn_type, array( 'point', 'coupon' ) ) ) ) {
			$status = false;
		}
		$is_product_level = false;
		if ( isset( $data['is_product_level'] ) && $data['is_product_level'] ) {
			$is_product_level = true;
		}
		/**
		 * 2. check condition
		 */
		if ( $status && ! $this->processCampaignCondition( $data, $is_product_level ) ) {
			$status = false;
		}
		/**
		 * 3. calculate point based on action
		 */
		$point = 0;
		if ( $status ) {
			$point = $this->processReferralCampaign( $data, $referral_type, $earn_type );
		}

		return $point;
	}

	private function processReferralCampaign( $data, $referral_type, $earn_type ) {
		$point = 0;
		if ( isset( $data['action_type'] ) && ! empty( $data['action_type'] ) ) {
			$action_type = trim( $data['action_type'] );
			$point       = $this->processReferralCampaignAction( $action_type, $earn_type, $this, $data, $referral_type );
		}

		return $point;
	}

	protected function processReferralCampaignAction( $action_type, $type, $campaign, $data, $referral_type ) {
		if ( empty( $type ) || empty( $referral_type ) ) {
			return null;
		}
		$reward = array();
		if ( $type == 'point' ) {
			$reward = 0;
		}
		if ( empty( $action_type ) ) {
			return $reward;
		}
		if ( isset( $data['action_type'] ) && ! empty( $data['action_type'] ) && $action_type == $data['action_type'] ) {
			$action_type = trim( $action_type );
			//$action_type = $this->camelCaseAction($action_type);
			$reward = apply_filters( 'wlr_earn_' . strtolower( $type ) . '_' . strtolower( $referral_type ) . '_' . strtolower( $action_type ), $reward, $campaign, $data );
		}

		return $reward;
	}

	function getTotalReferralEarn( $point, $rule, $data, $referral_type, $earn_type ) {
		if ( empty( $referral_type ) || ! in_array( $referral_type, array( 'advocate', 'friend' ) ) ) {
			return $point;
		}
		if ( empty( $earn_type ) || ! in_array( $earn_type, array( 'point', 'coupon' ) ) ) {
			return $point;
		}
		if ( isset( $rule->earn_campaign->point_rule ) && ! empty( $rule->earn_campaign->point_rule ) ) {
			$point_rule = $rule->earn_campaign->point_rule;
			if ( self::$woocommerce_helper->isJson( $rule->earn_campaign->point_rule ) ) {
				$point_rule = json_decode( $rule->earn_campaign->point_rule );
			}
			if ( isset( $rule->earn_campaign->id ) && ! empty( $rule->earn_campaign->id ) ) {
				$data['campaign_id'] = $rule->earn_campaign->id;
			}
			if ( isset( $point_rule->$referral_type ) && ! empty( $point_rule->$referral_type ) ) {
				$data[ $referral_type ] = $point_rule->$referral_type;
			}
			$data['referral_type'] = $referral_type;
			$status                = $this->checkReferralData( $data );
			if ( $status && isset( $point_rule->$referral_type ) && ! empty( $point_rule->$referral_type ) ) {
				$referral_point = $point_rule->$referral_type;
				if ( $earn_type == 'point' && isset( $referral_point->earn_point ) && $referral_point->earn_point > 0 ) {
					if ( $referral_point->earn_type == 'fixed_point' ) {
						$point = (int) $referral_point->earn_point;
					} elseif ( $referral_point->earn_type == 'subtotal_percentage' ) {
						$is_calculate_base = isset( $data['is_calculate_based'] ) && ! empty( $data['is_calculate_based'] ) ? $data['is_calculate_based'] : '';
						$subtotal          = 0;
						if ( $is_calculate_base === 'cart' && isset( $data[ $is_calculate_base ] ) && ! empty( $data[ $is_calculate_base ] ) ) {
							$subtotal = self::$woocommerce_helper->getCartSubtotal( $data[ $is_calculate_base ] );
						} elseif ( $is_calculate_base === 'order' && isset( $data[ $is_calculate_base ] ) && ! empty( $data[ $is_calculate_base ] ) ) {
							$subtotal = self::$woocommerce_helper->getOrderSubtotal( $data[ $is_calculate_base ] );
						}
						$percentage = (int) $referral_point->earn_point;
						if ( $percentage > 0 ) {
							$point = ( $percentage * $subtotal ) / 100;
							$point = $this->roundPoints( $point );
						}
					}
				} elseif ( $earn_type == 'coupon' && isset( $referral_point->earn_reward ) ) {
					$action_reward = $this->getRewardById( $referral_point->earn_reward );
					$point         = ! empty( $action_reward ) ? $action_reward : $point;
				}
			}
		}

		return apply_filters( 'wlr_total_referral_earn', $point, $rule, $data, $referral_type, $earn_type );
	}

	function checkReferralData( $data ) {
		//Need to check, valid referral code
		$status = $this->checkReferralTable( $data );
		if ( $status && isset( $data['campaign_id'] ) && isset( $data['referral_type'] ) && $data['referral_type'] == 'friend' && $data['campaign_id'] > 0 ) {
			$user_email = isset( $data['user_email'] ) && ! empty( $data['user_email'] ) ? $data['user_email'] : '';
			// Need to check friend user already exit
			$query_data       = array(
				'user_email'    => array( 'operator' => '=', 'value' => sanitize_email( $user_email ) ),
				'action_type'   => array( 'operator' => '=', 'value' => 'referral' ),
				'referral_type' => array( 'operator' => '=', 'value' => $data['referral_type'] ),
				'campaign_id'   => array( 'operator' => '=', 'value' => (int) $data['campaign_id'] )
			);
			$transaction_data = self::$earn_campaign_transaction_model->getQueryData( $query_data, '*', false, true );
			if ( ! empty( $transaction_data ) ) {
				$status = false;
			}
		}

		return $status;
	}

	function checkReferralTable( $data, $order_count = 1 ) {
		// 1.advocate email and friend email must not same
		if ( ! isset( $data['user_email'] ) || ! isset( $data['advocate_email'] ) || ( $data['user_email'] == $data['advocate_email'] ) ) {
			return false;
		}
		$referral_code  = self::$woocommerce_helper->get_referral_code();
		$advocate_email = sanitize_email( $data['advocate_email'] );
		$friend_email   = sanitize_email( $data['user_email'] );
		$orders         = wc_get_orders( array( 'billing_email' => $friend_email ) );
		// 2. check any old order available
		if ( ( ! empty( $orders ) && count( $orders ) > $order_count ) && ! apply_filters( 'wlr_referral_force_earning', false, $orders, $data ) ) {
			return false;
		}
		// 3. Referral table must not have advocate and friend email match
		$referral_table = new \Wlr\App\Models\Referral();
		$query_data     = array(
			'advocate_email' => array( 'operator' => '=', 'value' => $advocate_email ),
			'friend_email'   => array( 'operator' => '=', 'value' => $friend_email ),
		);
		$referral       = $referral_table->getQueryData( $query_data, '*', array(), false, true );
		if ( ! empty( $referral ) && isset( $referral->status ) && $referral->status == 'pending' ) {
			return true;
		} else if ( empty( $referral ) && ! empty( $referral_code ) ) {
			// 4. add to referral table
			$_data = array(
				'advocate_email' => $advocate_email,
				'friend_email'   => $friend_email,
				'status'         => 'pending',
				'created_date'   => strtotime( gmdate( "Y-m-d H:i:s" ) )
			);
			try {
				$id = $referral_table->insertRow( $_data );
				if ( $id > 0 ) {
					return true;
				}
			} catch ( \Exception $e ) {

			}
		}

		return false;
	}

	function doReferralCheck( $action_data, $referral_type = 'friend' ) {
		$ref_code = self::$woocommerce_helper->get_referral_code();
		if ( ! empty( $ref_code ) && $ref_code ) {
			if ( $this->isValidRefCode( $ref_code ) ) {
				$action_data['advocate_email'] = $this->getAdvocateEmail( $action_data['user_email'] );
				$action_data['referral_type']  = $referral_type;
				$this->checkReferralData( $action_data );
			}
		}
	}

	function isValidRefCode( $ref_code ) {
		if ( empty( $ref_code ) ) {
			return false;
		}
		$query_data    = array(
			'refer_code' => array( 'operator' => '=', 'value' => sanitize_text_field( $ref_code ) )
		);
		$advocate_user = self::$user_model->getQueryData( $query_data, '*', array(), false, true );
		if ( ! empty( $advocate_user ) && $advocate_user->user_email ) {
			return true;
		}

		return false;
	}
}