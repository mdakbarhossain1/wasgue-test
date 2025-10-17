<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Controllers\Site;
defined( 'ABSPATH' ) or die;

use WC_Discounts;
use Wlr\App\Controllers\Base;
use Wlr\App\Helpers\EarnCampaign;
use Wlr\App\Helpers\FreeProduct;
use Wlr\App\Helpers\Message;
use Wlr\App\Helpers\PointForPurchase;
use Wlr\App\Helpers\Validation;
use Wlr\App\Helpers\Woocommerce;
use Wlr\App\Models\EarnCampaignTransactions;
use Wlr\App\Models\Levels;
use Wlr\App\Models\Logs;
use Wlr\App\Models\PointsLedger;
use Wlr\App\Models\Rewards;
use Wlr\App\Models\RewardTransactions;
use Wlr\App\Models\UserRewards;
use Wlr\App\Models\Users;


class Main extends Base {
	static $user_reward_cart_coupon_label = array();

	function updatePoints( $order_id, $from_status, $to_status, $order_obj ) {
		if ( ! empty( $order_id ) ) {
			$options        = get_option( 'wlr_settings', '' );
			$earning_status = ( isset( $options['wlr_earning_status'] ) && ! empty( $options['wlr_earning_status'] ) ? $options['wlr_earning_status'] : [
				'processing',
				'completed'
			] );
			if ( is_string( $earning_status ) ) {
				$earning_status = explode( ',', $earning_status );
			}
			$order_status  = $order_obj->get_status();
			$earn_campaign = EarnCampaign::getInstance();
			$order_email   = self::$woocommerce->getOrderEmail( $order_obj );
			if ( self::$woocommerce->isBannedUser( $order_email ) ) {
				return;
			}
			if ( ! empty( $order_email ) && $earn_campaign->isPro() ) {
				$action_data     = array(
					'user_email' => $order_email
				);
				$referral_helper = new \Wlr\App\Premium\Helpers\Referral();
				$referral_helper->doReferralCheck( $action_data );
			}
			if ( is_array( $earning_status ) && in_array( $order_status, $earning_status ) ) {
				if ( apply_filters( 'wlr_before_process_order_earning', true, $order_id ) ) {
					$earn_campaign->processOrderEarnPoint( $order_id );
				}
			}

			$removing_status = ( isset( $options['wlr_removing_status'] ) && ! empty( $options['wlr_removing_status'] ) ? $options['wlr_removing_status'] : array() );
			if ( is_string( $removing_status ) ) {
				$removing_status = explode( ',', $removing_status );
			}
			if ( ! empty( $order_status ) && is_array( $removing_status ) && in_array( $order_status, $removing_status ) ) {
				$earn_campaign->processOrderReturn( $order_id );
			}
		}
	}

	function getPointPointForPurchase( $point, $rule, $data ) {
		$point_for_purchase = PointForPurchase::getInstance();

		return $point_for_purchase->getTotalEarnPoint( $point, $rule, $data );
	}

	function getCouponPointForPurchase( $reward, $rule, $data ) {
		$point_for_purchase = PointForPurchase::getInstance();

		return $point_for_purchase->getTotalEarnReward( $reward, $rule, $data );
	}

	/*Apply Reward*/

	function applyReward() {
		$wlr_nonce    = (string) self::$input->post_get( 'wlr_nonce', '' );
		$redirect_url = wc_get_cart_url();
		$json         = array(
			'success'  => false,
			'redirect' => $redirect_url
		);
		if ( ! Woocommerce::verify_nonce( $wlr_nonce, 'wlr_reward_nonce' ) ) {
			$json['message'] = __( 'Security validation failed', 'wp-loyalty-rules' );
			Message::error( $json );
		}
		$reward_id = (int) self::$input->post_get( 'reward_id', 0 );
		if ( empty( $reward_id ) || $reward_id <= 0 ) {
			$json['message'] = __( 'Invalid Reward', 'wp-loyalty-rules' );
			Message::error( $json );
		}
		$table = (string) self::$input->post_get( 'type', '' );
		if ( empty( $table )
		     || ! in_array( $table, array( 'user_reward', 'reward' ) )
		) {
			$json['message'] = __( 'Invalid reward type', 'wp-loyalty-rules' );
			Message::error( $json );
		}
		$user_email = self::$woocommerce->get_login_user_email();
		if ( empty( $user_email ) ) {
			$json['message'] = __( 'Invalid user', 'wp-loyalty-rules' );
			Message::error( $json );
		}
		$point = (int) self::$input->post_get( 'points', 0 );
		if ( $point < 0 ) {
			$json['message'] = __( 'Negative values not allowed', 'wp-loyalty-rules' );
			Message::error( $json );
		}
		$reward_helper = \Wlr\App\Helpers\Rewards::getInstance();
		$available_point
		               = $reward_helper->getPointBalanceByEmail( $user_email );
		if ( $available_point < $point ) {
			/* translators: %d: available point */
			$json['message'] = sprintf( __( 'Sorry! Your available balance is: %d', 'wp-loyalty-rules' ), $available_point );
			Message::error( $json );
		}
		$coupon_exist      = true;
		$user_reward_table = new UserRewards();
		if ( $table === 'user_reward' ) {
			$user_reward = $user_reward_table->getByKey( $reward_id );
			if ( ! isset( $user_reward->id ) || empty( $user_reward->id ) ) {
				$json['message'] = __( 'Invalid user reward', 'wp-loyalty-rules' );
				Message::error( $json );
			}
			/*if (isset($user_reward->reward_currency) && !empty($user_reward->reward_currency) && $user_reward->reward_currency != get_woocommerce_currency()) {
                $json['message'] = sprintf(__('Invalid currency,Please change currency to %s and apply reward.', 'wp-loyalty-rules'), $user_reward->reward_currency);
                Message::error($json);
            }*/
			if ( isset( $user_reward->discount_code )
			     && empty( $user_reward->discount_code )
			) {
				$update_data           = array(
					'start_at' => strtotime( gmdate( "Y-m-d H:i:s" ) ),
				);
				$user_reward->start_at = $update_data['start_at'];
				if ( $user_reward->expire_after > 0 ) {
					$expire_period         = isset( $user_reward->expire_period )
					                         && ! empty( $user_reward->expire_period )
						? $user_reward->expire_period : 'day';
					$update_data['end_at'] = strtotime( gmdate( "Y-m-d H:i:s", strtotime( "+" . $user_reward->expire_after . " " . $expire_period ) ) );
					$user_reward->end_at   = $update_data['end_at'];

					if ( isset( $user_reward->expire_email ) && $user_reward->expire_email > 0 && isset( $user_reward->enable_expiry_email )
					     && $user_reward->enable_expiry_email > 0 ) {
						$expire_email_period              = isset( $user_reward->expire_email_period ) && ! empty( $user_reward->expire_email_period )
							? $user_reward->expire_email_period : 'day';
						$update_data['expire_email_date'] = $user_reward->expire_email_date = strtotime( gmdate( "Y-m-d H:i:s", strtotime( "+" . $user_reward->expire_email . " " . $expire_email_period ) ) );
					}
				}
				$update_where = array( 'id' => $user_reward->id );
				$user_reward_table->updateRow( $update_data, $update_where );
			}
			$message_response = $reward_helper->createCartUserReward( $user_reward, $user_email );
		} elseif ( $table === 'reward' ) {
			//Get Reward record
			$reward_table = new Rewards();
			$reward       = $reward_table->getByKey( $reward_id );
			if ( ! is_object( $reward ) || empty( $reward->id ) ) {
				$json['message'] = __( 'Invalid reward', 'wp-loyalty-rules' );
				Message::error( $json );
			}
			if ( isset( $reward->minimum_point ) && $reward->minimum_point > 0 && $reward->minimum_point > $point ) {
				/* translators: 1: minimum point, 2: point label */
				$json['message'] = sprintf( __( 'Minimum %1$s %2$s required', 'wp-loyalty-rules' ), $reward->minimum_point, $reward_helper->getPointLabel( $reward->minimum_point ) );
				Message::error( $json );
			}
			if ( isset( $reward->maximum_point ) && $reward->maximum_point > 0 && $reward->maximum_point < $point ) {
				/* translators: 1: maximum point, 2: point label */
				$json['message'] = sprintf( __( 'Maximum %1$s %2$s allowed', 'wp-loyalty-rules' ), $reward->maximum_point, $reward_helper->getPointLabel( $reward->minimum_point ) );
				Message::error( $json );
			}
			if ( isset( $reward->discount_type ) && $reward->discount_type == 'points_conversion' ) {
				$discountPrice = 0;
				$old_point     = $point = (int) self::$input->post_get( 'points', 0 );
				if ( ! empty( $reward->discount_value ) && ! empty( $reward->require_point ) && ! empty( $point ) ) {
					$discountPrice = ( $point / $reward->require_point ) * $reward->discount_value;
					if ( isset( $reward->coupon_type ) && $reward->coupon_type == 'percent' ) {
						if ( $reward->max_percentage > 0 && $discountPrice > $reward->max_percentage ) {
							$discountPrice = $reward->max_percentage;
							$point         = ( $discountPrice / $reward->discount_value ) * $reward->require_point;
							$point         = $reward_helper->roundPoints( $point );
						}
						if ( $discountPrice > 50 ) {
							$discountPrice = 50;
							$point         = ( $discountPrice / $reward->discount_value ) * $reward->require_point;
							$point         = $reward_helper->roundPoints( $point );
						}
					}
				}
				if ( $old_point != $point ) {
					if ( isset( $reward->minimum_point ) && $reward->minimum_point > 0 && $reward->minimum_point > $point ) {
						$json['message'] = __( 'This reward cannot be create', 'wp-loyalty-rules' );
						Message::error( $json );
					}
					if ( isset( $reward->maximum_point ) && $reward->maximum_point > 0 && $reward->maximum_point < $point ) {
						$json['message'] = __( 'This reward cannot be create', 'wp-loyalty-rules' );
						Message::error( $json );
					}
				}

				$reward->discount_value = $discountPrice;
				$reward->require_point  = $point;
			}
			if ( isset( $reward->reward_type ) && $reward->reward_type == 'redeem_point' ) {
				if ( $available_point < $reward->require_point ) {
					/* translators: %d: available point */
					$json['message'] = sprintf( __( 'Sorry! Your available balance is: %d', 'wp-loyalty-rules' ), $available_point );
					Message::error( $json );
				}
				if ( $reward->usage_limits > 0 && $reward->usage_limits <= $user_reward_table->checkRewardUsedCount( $user_email, $reward_id ) ) {
					$json['message'] = __( 'Sorry! Your are reached reward limit', 'wp-loyalty-rules' );
					Message::error( $json );
				}
			}
			if ( ! apply_filters( 'wlr_apply_reward_validation', true, $reward, $user_email ) ) {
				$json['message'] = __( 'Apologies, but you are not eligible to convert this coupon at the moment', 'wp-loyalty-rules' );
				Message::error( $json );
			}
			//Need to enter data in UserReward table
			$user_data             = array(
				'name'                   => $reward->name,
				'description'            => $reward->description,
				'email'                  => $user_email,
				'reward_id'              => $reward_id,
				'campaign_id'            => 0,
				'reward_type'            => $reward->reward_type,
				'action_type'            => $reward->reward_type,
				'discount_type'          => $reward->discount_type,
				'discount_value'         => $reward->discount_value,
				'reward_currency'        => self::$woocommerce->getDefaultWoocommerceCurrency(),
				'discount_code'          => '',
				'discount_id'            => '',
				'display_name'           => $reward->display_name,
				'require_point'          => $reward->require_point,
				'status'                 => 'open',
				'end_at'                 => 0,
				'usage_limits'           => $reward->usage_limits,
				'icon'                   => $reward->icon,
				'conditions'             => $reward->conditions,
				'condition_relationship' => $reward->condition_relationship,
				'free_product'           => $reward->free_product,
				'expire_after'           => $reward->expire_after,
				'expire_period'          => $reward->expire_period,
				'enable_expiry_email'    => $reward->enable_expiry_email,
				'expire_email'           => $reward->expire_email,
				'expire_email_period'    => $reward->expire_email_period,
				'minimum_point'          => $reward->minimum_point,
				'maximum_point'          => $reward->maximum_point,
				'created_at'             => strtotime( gmdate( "Y-m-d H:i:s" ) ),
				'modified_at'            => 0,
				'is_show_reward'         => $reward->is_show_reward,
				'coupon_type'            => $reward->coupon_type,
				'max_discount'           => $reward->max_discount,
				'max_percentage'         => $reward->max_percentage
			);
			$user_data['start_at'] = strtotime( gmdate( "Y-m-d H:i:s" ) );
			if ( $reward->expire_after > 0 ) {
				$expire_period       = isset( $reward->expire_period ) && ! empty( $reward->expire_period ) ? $reward->expire_period : 'day';
				$expire_email_period = isset( $reward->expire_email_period ) && ! empty( $reward->expire_email_period ) ? $reward->expire_email_period : 'day';
				$user_data['end_at'] = strtotime( gmdate( "Y-m-d H:i:s", strtotime( "+" . $reward->expire_after . " " . $expire_period ) ) );
				if ( isset( $reward->expire_email ) && $reward->expire_email > 0 && isset( $reward->enable_expiry_email ) && $reward->enable_expiry_email > 0 ) {
					$user_data['expire_email_date'] = strtotime( gmdate( "Y-m-d H:i:s", strtotime( "+" . $reward->expire_email . " " . $expire_email_period ) ) );
				}
			}
			try {
				if ( isset( $reward->reward_type ) && $reward->reward_type == 'redeem_point' ) {
					$available_point = $reward_helper->getPointBalanceByEmail( $user_email );
					if ( $available_point < $reward->require_point ) {
						/* translators: %d: available point */
						$json['message'] = sprintf( __( 'Sorry! Your available balance is: %d', 'wp-loyalty-rules' ), $available_point );
						Message::error( $json );
					}
					if ( $reward->usage_limits > 0 && $reward->usage_limits <= $user_reward_table->checkRewardUsedCount( $user_email, $reward_id ) ) {
						$json['message'] = __( 'Sorry! Your are reached reward limit', 'wp-loyalty-rules' );
						Message::error( $json );
					}
				}
				$transient_key   = sanitize_title( 'wlr_reward_cache_' . $user_email . '_' . $reward_id );
				$transient_value = get_transient( $transient_key );
				if ( ! empty( $transient_value ) ) {
					$json['message'] = __( 'Sorry! Too many attempts detected. Wait for 2 minutes before redeeming your reward', 'wp-loyalty-rules' );
					Message::error( $json );
				}
				set_transient( $transient_key, md5( $user_email . '_' . $reward_id ), 120 );
				$user_reward_id = $user_reward_table->insertRow( $user_data );
				if ( $user_reward_id > 0 ) {
					$user_reward = $user_reward_table->getByKey( $user_reward_id );
					if ( ! isset( $user_reward->id ) || empty( $user_reward->id ) ) {
						$json['message'] = __( 'Invalid user reward', 'wp-loyalty-rules' );
						Message::error( $json );
					}
					if ( isset( $user_reward->reward_currency ) && $user_reward->reward_currency != self::$woocommerce->getDefaultWoocommerceCurrency() ) {
						$json['message'] = __( 'The reward currency does not match. Choose the correct currency before applying the reward', 'wp-loyalty-rules' );
						Message::error( $json );
					}
					if ( isset( $reward->discount_type ) && $reward->discount_type == 'points_conversion' ) {
						$post_point = (int) self::$input->post_get( 'points', 0 );
						if ( $post_point > $point ) {
							/* translators: 1: point 2. point label */
							wc_add_notice( sprintf( __( '%1$s %2$s used for created coupon', 'wp-loyalty-rules' ), $point, $reward_helper->getPointLabel( $point ) ) );
						}
					}
					$message_response = $reward_helper->createCartUserReward( $user_reward, $user_email );
					delete_transient( $transient_key );
				}
			} catch ( \Exception $e ) {
				$json['message'] = __( 'This reward cannot be used', 'wp-loyalty-rules' );
				Message::error( $json );
			}
			$coupon_exist = ! empty( self::$woocommerce->getSession( 'wlr_discount_code', '' ) );
			// If discount code available apply to cart
			// else create woccommerce coupon and apply to cart
		}
		$json = array(
			'redirect'        => $redirect_url,
			'is_coupon_exist' => $coupon_exist,
		);
		if ( ! empty( $message_response ) && isset( $message_response['message'] ) ) {
			$json = wp_parse_args( $message_response, $json );
		}
		wp_send_json_success( $json );
	}

	/**
	 * Get point conversion discount amount.
	 *
	 * @param $discount
	 * @param $price_to_discount
	 * @param $item
	 * @param $is_false
	 * @param $coupon
	 *
	 * @return float|int|mixed
	 */
	function getPointConversionDiscountAmount( $discount, $price_to_discount, $item, $is_false, $coupon ) {
		if ( ! ( $coupon instanceof \WC_Coupon ) ) {
			return $discount;
		}
		$code   = $coupon->get_code();
		$helper = EarnCampaign::getInstance();
		if ( ! $helper->is_loyalty_coupon( $code ) ) {
			return $discount;
		}
		$user_reward_model = new UserRewards();
		global $wpdb;
		$user_reward = $user_reward_model->getWhere( $wpdb->prepare( 'discount_code = %s', [ $code ] ) );
		if ( empty( $user_reward ) ) {
			return $discount;
		}
		if ( $user_reward->discount_type != 'points_conversion' || $user_reward->coupon_type != 'percent' ) {
			return $discount;
		}
		// No max amount, no need to check
		if ( isset( $user_reward->max_discount ) && $user_reward->max_discount <= 0 ) {
			return $discount;
		}
		$max_discount = self::$woocommerce->convertPrice( $user_reward->max_discount, false, $user_reward->reward_currency );

		return $this->getDiscountForItem( $discount, $max_discount, $item, $coupon );
	}

	function getItemDiscountAmount( $item_key, $max_cart_discount ) {
		$cart_items         = self::$woocommerce->getCartItems();
		$cart_item_qty      = self::$woocommerce->isMethodExists( WC()->cart, 'get_cart_contents_count' ) ? WC()->cart->get_cart_contents_count() : 1;
		$per_item_discount  = $max_cart_discount / $cart_item_qty;
		$cart_item_discount = [];
		$total_discount     = 0;
		foreach ( $cart_items as $item ) {
			// $item_discount = wc_remove_number_precision($per_item_discount * $item['quantity']);
			$item_discount                      = wc_round_discount( wc_remove_number_precision( wc_add_number_precision( $per_item_discount * $item['quantity'] ) ), 0 );
			$cart_item_discount[ $item['key'] ] = [
				'max_item_discount' => $item_discount
			];
			$total_discount                     += $item_discount;
		}
		if ( empty( $total_discount ) ) {
			$cart_item_discount = [];
			foreach ( $cart_items as $item ) {
				// $item_discount = wc_remove_number_precision($per_item_discount * $item['quantity']);
				$item_discount                      = wc_remove_number_precision( wc_add_number_precision( $per_item_discount * $item['quantity'] ) );
				$cart_item_discount[ $item['key'] ] = [
					'max_item_discount' => $item_discount
				];
				$total_discount                     += $item_discount;
			}
		}
		if ( $total_discount > $max_cart_discount ) {
			$need_to_reduce = $total_discount - $max_cart_discount;
			if ( $need_to_reduce > 0 ) {
				foreach ( $cart_item_discount as $key => $value ) {
					if ( $need_to_reduce <= 0 ) {
						break;
					}
					if ( isset( $value['max_item_discount'] ) && $value['max_item_discount'] > $need_to_reduce ) {
						$cart_item_discount[ $key ]['max_item_discount'] = $value['max_item_discount'] - $need_to_reduce;
						$need_to_reduce                                  = 0;
					} elseif ( isset( $value['max_item_discount'] ) && $value['max_item_discount'] > 0 ) {
						$cart_item_discount[ $key ]['max_item_discount'] = 0;
						$need_to_reduce                                  = $need_to_reduce - $value['max_item_discount'];
					}
				}
			}
		} else {
			$need_to_increase = $max_cart_discount - $total_discount;
			if ( $need_to_increase > 0 ) {
				$discount_obj = new \WC_Discounts();
				foreach ( $cart_item_discount as $key => $value ) {
					if ( $need_to_increase <= 0 ) {
						break;
					}
					$cart_item         = self::$woocommerce->getCartItem( $key );
					$price_to_discount = absint( round( $cart_item['data']->get_price() - $discount_obj->get_discount( $cart_item['key'], true ) ) );
					$price_to_discount = $price_to_discount * $cart_item['quantity'];
					if ( isset( $value['max_item_discount'] ) && $value['max_item_discount'] > 0 ) {
						if ( $price_to_discount >= $value['max_item_discount'] + $need_to_increase ) {
							$cart_item_discount[ $key ]['max_item_discount'] = $value['max_item_discount'] + $need_to_increase;
							$need_to_increase                                = 0;
						} else {
							$remaining_cart_item_price                       = $price_to_discount - $value['max_item_discount'];
							$cart_item_discount[ $key ]['max_item_discount'] += $remaining_cart_item_price;
							$need_to_increase                                = $need_to_increase - $remaining_cart_item_price;
						}
					}
				}
			}
		}

		return $cart_item_discount;
	}

	function getDiscountForItem( $max_item_discount, $max_cart_discount, $item, $coupon ) {

		$cart_items = self::$woocommerce->getCartItems();
		// cart count 1, no need to check
		if ( count( $cart_items ) == 1 ) {
			return min( $max_item_discount, $max_cart_discount );
		}

		$code = self::$woocommerce->isMethodExists( $coupon, 'get_code' )
			? $coupon->get_code() : '';
		if ( empty( $code ) ) {
			return 0;
		}
		// $cart_item_qty = self::$woocommerce->isMethodExists(WC()->cart, 'get_cart_contents_count') ? WC()->cart->get_cart_contents_count() : 1;
		$cart_item_discounts = $this->getItemDiscountAmount( $item['key'],
			$max_cart_discount );
		/*if (!is_array($cart_item_discounts) || empty($cart_item_discounts[$item['key']]) || empty($cart_item_discounts[$item['key']]['max_item_discount'])) {
              return 0;
        }*/
		// find per item per qty discount amount
		//  $per_item_discount = $max_cart_discount / $cart_item_qty;
		// find per item discount amount
		//$per_current_item_discount = $per_item_discount * $item['quantity'];
		$per_current_item_discount = $cart_item_discounts[ $item['key'] ]['max_item_discount'];
		// $per_item_discount = $per_current_item_discount / $item['quantity'];
		// get remaining discount amount, who have lower then "per item per qty" discount
		$discount_pending_list = \Wlr\App\Helpers\Rewards::getCouponRemainingAmount( $code, $item );
		if ( empty( $discount_pending_list ) ) {
			$discount_pending_list = $this->getCartItemsRemaingDiscountAmount( $coupon, $cart_item_discounts );
		}

		// current item not in discount pending list, then add disount amount to "per item discount"
		if ( ! empty( $discount_pending_list ) && ! isset( $discount_pending_list[ $item['key'] ] ) ) {
			if ( $max_item_discount > $per_current_item_discount ) {
				$remaining = $max_item_discount - $per_current_item_discount;
				foreach ( $discount_pending_list as $cart_key => $pending_amount ) {
					if ( $remaining >= $pending_amount ) {
						$per_current_item_discount          = $per_current_item_discount + $pending_amount;
						$discount_pending_list[ $cart_key ] = 0;
						$remaining                          = $remaining - $pending_amount;
					} elseif ( $remaining > 0 ) {
						$per_current_item_discount          = $per_current_item_discount + $remaining;
						$discount_pending_list[ $cart_key ] = $pending_amount - $remaining;
						$remaining                          = 0;
					}
				}
			}
		}
		\Wlr\App\Helpers\Rewards::setCouponRemainingAmount( $code, $discount_pending_list );

		return min( $max_item_discount, $per_current_item_discount );
	}

	function getCartItemsRemaingDiscountAmount( $coupon, $cart_item_discounts ) {
		$cart_items            = self::$woocommerce->getCartItems();
		$discount_obj          = new \WC_Discounts();
		$coupon_amount         = self::$woocommerce->isMethodExists( $coupon, 'get_amount' ) ? $coupon->get_amount() : 0;
		$discount_pending_list = [];
		foreach ( $cart_items as $cart_item ) {
			$price_to_discount = absint( round( $cart_item['data']->get_price() - $discount_obj->get_discount( $cart_item['key'], true ) ) );
			$discount          = $price_to_discount * ( $coupon_amount / 100 );
			$per_item_discount = isset( $cart_item_discounts[ $cart_item['key'] ]['max_item_discount'] ) ? ( $cart_item_discounts[ $cart_item['key'] ]['max_item_discount'] / $cart_item['quantity'] ) : 0;
			if ( $discount < $per_item_discount ) {
				$discount_pending_list[ $cart_item['key'] ] = ( $per_item_discount - $discount ) * $cart_item['quantity'];
			}
		}

		return $discount_pending_list;
	}

	function revokeCoupon() {
		$wlr_nonce = (string) self::$input->post_get( 'wlr_nonce', '' );
		$json      = array();
		if ( ! Woocommerce::verify_nonce( $wlr_nonce,
			'wlr_revoke_coupon_nonce' )
		) {
			$json['message'] = __( 'Invalid nonce', 'wp-loyalty-rules' );
			Message::error( $json );
		}
		$user_reward_id = (int) self::$input->post_get( 'user_reward_id', 0 );
		if ( empty( $user_reward_id ) || $user_reward_id <= 0 ) {
			$json['message'] = __( 'Invalid Reward', 'wp-loyalty-rules' );
			Message::error( $json );
		}
		$user_reward_table = new UserRewards();
		$user_reward       = $user_reward_table->getByKey( $user_reward_id );
		if ( ! is_object( $user_reward ) || empty( $user_reward->id ) ) {
			$json['message'] = __( 'Invalid Reward', 'wp-loyalty-rules' );
			Message::error( $json );
		}

		$user_email = self::$woocommerce->get_login_user_email();
		if ( empty( $user_email ) || $user_reward->email != $user_email ) {
			$json['message'] = __( 'Invalid user', 'wp-loyalty-rules' );
			Message::error( $json );
		}

		if ( ! is_object( $user_reward ) || empty( $user_reward->reward_type ) || $user_reward->reward_type != 'redeem_point' ) {
			$json['message'] = __( 'Invalid reward type', 'wp-loyalty-rules' );
			Message::error( $json );
		}

		if ( empty( $user_reward->discount_code ) || empty( $user_reward->status ) || ( in_array( $user_reward->status, [
				'expired',
				'used'
			] ) ) ) {
			$json['message'] = __( 'Invalid reward code', 'wp-loyalty-rules' );
			Message::error( $json );
		}
		$earn_campaign_helper = new EarnCampaign();
		//update User table require_point
		$user        = $earn_campaign_helper->getPointUserByEmail( $user_email );
		$action_data = array(
			'user_email'          => $user_email,
			'points'              => (int) $user_reward->require_point,
			'action_type'         => 'revoke_coupon',
			'action_process_type' => 'revoke_coupon',
			/* translators: 1: require point 2. point label*/
			'customer_note'       => sprintf( __( '%1$d %2$s added for coupon revoked', 'wp-loyalty-rules' ), (int) $user_reward->require_point, $earn_campaign_helper->getPointLabel( $user_reward->require_point ) ),
			/* translators: 1: customer email 2: point label 3: old point 4: new point */
			'note'                => sprintf( __( '%1$s customer %2$s changed from %3$d to %4$d via coupon revoke', 'wp-loyalty-rules' ), $user->user_email, $earn_campaign_helper->getPointLabel( 0 ), $user->points, ( $user->points + $user_reward->require_point ) ),
			'user_reward_id'      => $user_reward->id,
			'reward_id'           => $user_reward->reward_id,
		);
		$earn_campaign_helper->addExtraPointAction( 'revoke_coupon', $user_reward->require_point, $action_data, 'credit', true, false, false );
		// update user reward to expire
		$date        = gmdate( 'Y-m-d H:i:s' );
		$expire_date = gmdate( 'Y-m-d H:i:s', strtotime( $date . ' -1 day' ) );
		if ( isset( $user_reward->status ) && ! in_array( $user_reward->status, array( 'expired', 'used' ) ) ) {
			$update_data = array(
				'status' => 'expired',
				'end_at' => strtotime( $expire_date ),
			);
			$user_reward_table->updateRow( $update_data, array( 'id' => $user_reward->id ) );
		}
		// if status  active, then need to change coupon status expired
		if ( isset( $user_reward->status ) && $user_reward->status == 'active' ) {
			if ( isset( $user_reward->discount_id ) && $user_reward->discount_id && isset( $user_reward->discount_code ) && $user_reward->discount_code ) {
				update_post_meta( $user_reward->discount_id, 'expiry_date', $earn_campaign_helper->get_coupon_expiry_date( wc_clean( $expire_date ) ) );
				update_post_meta( $user_reward->discount_id, 'date_expires', $earn_campaign_helper->get_coupon_expiry_date( wc_clean( $expire_date ), true ) );
			}
		}
		$json = array(
			'success' => true,
			/* translators: %s: point label */
			'message' => sprintf( __( 'Coupon successfully revoked. %s returned', 'wp-loyalty-rules' ), $earn_campaign_helper->getPointLabel( 3 ) )
		);
		Message::success( $json );
	}

	function removeFreeProduct( $code ) {
		$reward_helper = \Wlr\App\Helpers\Rewards::getInstance();
		if ( ! empty( $code ) && $reward_helper->is_loyalty_coupon( $code ) ) {
			$free_product_helper = FreeProduct::getInstance();
			$free_product_helper->removeFreeProductFromCart( $code );
		}
	}

	function updateFreeProduct() {
		$coupons = self::$woocommerce->getAppliedCoupons();
		if ( empty( $coupons ) ) {
			$cart_items = self::$woocommerce->getCartItems();
			foreach ( $cart_items as $cart_key => $cart_item ) {
				if ( ! is_array( $cart_item ) || ! isset( $cart_item['loyalty_free_product'] ) || ! isset( $cart_item['loyalty_product_id'] ) ) {
					continue;
				}
				if ( $cart_item['loyalty_free_product'] === 'yes' ) {
					WC()->cart->remove_cart_item( $cart_key );
				}
			}
		}
		if ( self::$woocommerce->isBannedUser() ) {
			return;
		}
		$free_product_helper = FreeProduct::getInstance();
		$free_product_helper->emptyFreeProductList();
		$free_product_list = array();
		foreach ( $coupons as $coupon ) {
			$coupon = new \WC_Coupon( $coupon );
			if ( empty( $coupon ) || ! self::$woocommerce->isMethodExists( $coupon, 'get_code' ) ) {
				continue;
			}
			$code          = $coupon->get_code();
			$reward_helper = \Wlr\App\Helpers\Rewards::getInstance();
			if ( $reward_helper->is_loyalty_coupon( $code ) ) {
				$free_product_list = $free_product_helper->getFreeProductList( $code );
			}
		}
		// we have to run this loop second time,otherwise whole free product add make problem
		foreach ( $coupons as $coupon ) {
			$coupon = new \WC_Coupon( $coupon );
			if ( ! empty( $coupon ) && method_exists( $coupon, 'get_code' ) ) {
				$code          = $coupon->get_code();
				$reward_helper = \Wlr\App\Helpers\Rewards::getInstance();
				if ( $reward_helper->is_loyalty_coupon( $code ) ) {
					$free_product_helper->addFreeProductToCart( $code, $free_product_list );
				}
			}
		}
	}

	function addItemMetaForFreeProduct( $item, $cart_item_key, $values, $order ) {
		if ( is_array( $values ) && isset( $values['loyalty_free_product'] ) && $values['loyalty_free_product'] == 'yes' ) {
			$item->add_meta_data( 'loyalty_free_product', esc_html__( 'Free', 'wp-loyalty-rules' ), true );
		}

		return $item;
	}

	function displayFreeProductTextInCart( $item_data, $cart_item ) {
		if ( self::$woocommerce->isBannedUser() ) {
			return $item_data;
		}
		//This have added to display the text in translation file
		if ( ! isset( $cart_item['loyalty_free_product'] ) || $cart_item['loyalty_free_product'] != 'yes' ) {
			return $item_data;
		}


		$key         = __( 'Discount', 'wp-loyalty-rules' );
		$display     = esc_html__( "Free", 'wp-loyalty-rules' );
		$display     = '<span class="wlr_free_product_text">' . $display . '</span>';
		$item_data[] = array(
			'key'                  => apply_filters( 'wlr_free_product_key', $key ),
			'loyalty_free_product' => 'yes',
			'in_stock'             => $cart_item['data']->is_in_stock(),
			'display'              => apply_filters( 'wlr_free_product_display_name', $display ),
		);

		return $item_data;
	}

	public function displayFreeProductTextInOrder( $display_key, $meta, $order_item ) {
		if ( self::$woocommerce->isBannedUser() ) {
			return $display_key;
		}
		if ( $display_key == 'loyalty_free_product' ) {
			$display_key = esc_html__( 'Discount', 'wp-loyalty-rules' );
		}

		return $display_key;
	}

	function disableQuantityFieldForFreeProduct( $product_quantity, $cart_item_key, $cart_item = array() ) {
		if ( self::$woocommerce->isBannedUser() ) {
			return $product_quantity;
		}
		if ( isset( $cart_item['loyalty_free_product'] ) && ! empty( $cart_item['loyalty_free_product'] ) && $cart_item['loyalty_free_product'] == 'yes' ) {
			$product_quantity = '';
			if ( isset( $cart_item['quantity'] ) ) {
				$product_quantity = $cart_item['quantity'];
			}
		}

		return $product_quantity;
	}

	function disableCloseIconForFreeProduct( $close_button, $cart_item_key ) {
		$cart_item = self::$woocommerce->get_cart_item( $cart_item_key );
		if ( isset( $cart_item['loyalty_free_product'] ) && ! empty( $cart_item['loyalty_free_product'] ) && $cart_item['loyalty_free_product'] == 'yes' ) {
			$close_button = '';
		}

		return $close_button;
	}

	function loadCustomizableProductsAfterCartItemName( $cart_item, $cart_item_key ) {
		if ( self::$woocommerce->isBannedUser() ) {
			return;
		}
		if ( isset( $cart_item['loyalty_free_product'] ) && ! empty( $cart_item['loyalty_free_product'] ) && $cart_item['loyalty_free_product'] == 'yes' ) {
			if ( isset( $cart_item['loyalty_variants'] ) && ! empty( $cart_item['loyalty_variants'] ) ) {
				$main_page_params = array(
					'available_products'     => $cart_item['loyalty_variants'],
					'customer_chose_variant' => $cart_item['customer_chose_variant'],
					'parent_product_id'      => $cart_item['product_id'],
					'loyalty_user_reward_id' => $cart_item['loyalty_user_reward_id']
				);
				wc_get_template(
					'customer-variant-select.php',
					$main_page_params,
					'',
					WLR_PLUGIN_PATH . 'App/Views/Site/'
				);
			}
		}
	}

	function loadLoyaltyLabel( $cart_item, $cart_item_key ) {
		if ( self::$woocommerce->isBannedUser() ) {
			return;
		}
		if ( isset( $cart_item['loyalty_free_product'] ) && ! empty( $cart_item['loyalty_free_product'] ) && $cart_item['loyalty_free_product'] == 'yes' ) {
			$setting_option     = self::$woocommerce->getOptions( 'wlr_settings' );
			$theme_color        = is_array( $setting_option ) && isset( $setting_option["theme_color"] ) && ! empty( $setting_option["theme_color"] ) ? $setting_option["theme_color"] : "#4F47EB";
			$heading_text_color = is_array( $setting_option ) && isset( $setting_option["button_text_color"] ) && ! empty( $setting_option["button_text_color"] ) ? $setting_option["button_text_color"] : "#ffffff";
			$style              = "display:flex;white-space:nowrap;width: max-content; margin-left: 5px;font-weight: 600;letter-spacing: 0.75px;font-size: 11px;color:" . $heading_text_color . ";text-transform: uppercase;background-color: " . $theme_color . ";padding: 4px 6px;border-radius: 4px;position:relative; top:-2px;";
			echo '<span class="wlr-loyalty-label" style="' . esc_attr( $style ) . '"> &#9733; ' . esc_html( __( 'Loyalty Reward', 'wp-loyalty-rules' ) ) . '</span>';
		}
	}

	function loadLoyaltyLabelMeta( $item_id, $item, $product ) {
		if ( self::$woocommerce->isBannedUser() ) {
			return;
		}
		$meta_data          = $item->get_formatted_meta_data( '' );
		$setting_option     = self::$woocommerce->getOptions( 'wlr_settings' );
		$theme_color        = is_array( $setting_option ) && isset( $setting_option["theme_color"] ) && ! empty( $setting_option["theme_color"] ) ? $setting_option["theme_color"] : "#4F47EB";
		$heading_text_color = is_array( $setting_option ) && isset( $setting_option["button_text_color"] ) && ! empty( $setting_option["button_text_color"] ) ? $setting_option["button_text_color"] : "#ffffff";
		foreach ( $meta_data as $meta_id => $meta ) {
			if ( isset( $meta->key ) && $meta->key === 'loyalty_free_product' ) {
				$style = "display:flex;white-space:nowrap;width: max-content;margin-left: 5px;font-weight: 600;letter-spacing: 0.75px;font-size: 11px;color: " . $heading_text_color . ";text-transform: uppercase;background-color: " . $theme_color . ";padding: 4px 6px;border-radius: 4px;position:relative; top:-2px;";
				echo '<span class="wlr-loyalty-label" style="' . esc_attr( $style ) . '"> &#9733; ' . esc_html( __( 'Loyalty Reward', 'wp-loyalty-rules' ) ) . '</span>';
				break;
			}
		}
	}

	function changeVariationName( $name, $cart_item, $key ) {
		if ( isset( $cart_item['loyalty_free_product'] ) && ! empty( $cart_item['loyalty_free_product'] ) && $cart_item['loyalty_free_product'] == 'yes' ) {
			if ( empty( $cart_item['variation_id'] ) && isset( $cart_item['loyalty_product_id'] )
			     && ( $cart_item['product_id'] != $cart_item['loyalty_product_id'] ) ) {
				$cart_item['variation_id'] = $cart_item['loyalty_product_id'];
				$product                   = self::$woocommerce->getProduct( $cart_item['loyalty_product_id'] );
				$param_link                = $product->is_visible() ? $product->get_permalink( $cart_item ) : '';
				$name                      = $product->get_name();
				if ( $param_link ) {
					$name = sprintf( '<a href="%s">%s</a>', esc_url( $param_link ), $name );
				}
			}
		}

		return $name;
	}

	function customerChangeProductOptions() {
		$wlr_nonce = (string) self::$input->post_get( 'wlr_nonce', '' );
		$json      = array();
		if ( ! Woocommerce::verify_nonce( $wlr_nonce, 'wlr_reward_nonce' ) ) {
			wp_send_json_error( $json );
		}
		$rule_id    = (int) self::$input->post( 'rule_unique_id', 0 );
		$product_id = (int) self::$input->post( 'product_id', 0 );
		$variant_id = (int) self::$input->post( 'variant_id', 0 );
		if ( ! empty( $rule_id ) && ! empty( $product_id ) && ! empty( $variant_id ) ) {
			$free_product_helper = FreeProduct::getInstance();
			$free_product_helper->changeRewardsProductInCart( $rule_id, $product_id, $variant_id );
			wp_send_json_success();
		}
		wp_send_json_error( $json );
	}

	function changeFreeProductPrice() {
		if ( self::$woocommerce->isBannedUser() ) {
			return;
		}
		$cart_items = self::$woocommerce->getCartItems();
		if ( ! empty( $cart_items ) ) {
			foreach ( $cart_items as $key => $item ) {
				if ( isset( $item['loyalty_free_product'] ) && $item['loyalty_free_product'] == 'yes' ) {
					if ( ! empty( $item["data"] ) ) {
						$price = apply_filters( 'wlr_free_product_price', 0, $item );
						self::$woocommerce->setCartProductPrice( $item["data"], $price );
					}
				}
			}
		}
	}

	/*End Apply reward*/
	function updateCouponStatus( $order_id, $from_status, $to_status, $order_obj ) {
		$order = self::$woocommerce->getOrder( $order_id );
		if ( $order ) {
			$this->canChangeCouponStatus( $order_id );
		}
	}

	/*My Account*/
	function canChangeCouponStatus( $order_id ) {
		$order = self::$woocommerce->getOrder( $order_id );
		if ( ! is_object( $order ) ) {
			return;
		}
		$order_email = self::$woocommerce->getOrderEmail( $order );
		if ( ! empty( $order_email ) && self::$woocommerce->isBannedUser( $order_email ) || ! apply_filters( 'wlr_not_eligible_to_earn_via_order', true, $order_email, $order ) ) {
			return;
		}
		$coupon_items = $order->get_items( 'coupon' );
		$status       = self::$woocommerce->getOrderMetaData( $order_id, '_wlr_point_coupon_return_status' );
		$order_status = $order->get_status();
		if ( ! empty( $coupon_items ) && ! $status && ! in_array( $order_status, array( 'checkout-draft' ) ) ) {
			$reward_helper      = \Wlr\App\Helpers\Rewards::getInstance();
			$reward_transaction = new RewardTransactions();
			$user_reward_model  = new UserRewards();
			foreach ( $coupon_items as $coupon_item ) {
				$coupon_code      = $coupon_item->get_code();
				$coupon_item_data = $coupon_item->get_data();
				if ( $reward_helper->is_loyalty_coupon( $coupon_code ) ) {
					$user_reward             = $user_reward_model->getQueryData( array(
						'discount_code' => array(
							'operator' => '=',
							'value'    => $coupon_code
						)
					), '*', array(), false, true );
					$user_reward_transaction = $reward_helper->getUserRewardTransaction( $coupon_code, $order_id );
					if ( ! empty( $user_reward_transaction ) ) {
						if ( empty( $user_reward ) || $user_reward_transaction->user_reward_id != $user_reward->id ) {
							continue;
						}
					}
					if ( isset( $user_reward->status ) && $user_reward->status == 'expired' ) {
						continue;
					}
					$reward_amount     = 0;
					$reward_amount_tax = 0;
					if ( isset( $coupon_item_data['discount'] ) && ! empty( $coupon_item_data['discount'] ) ) {
						$reward_amount += $coupon_item_data['discount'];
					}

					if ( isset( $coupon_item_data['discount_tax'] ) && ! empty( $coupon_item_data['discount_tax'] ) ) {
						$reward_amount_tax += $coupon_item_data['discount_tax'];
					}
					$coupon    = new \WC_Coupon( $coupon_code );
					$discounts = new WC_Discounts( $order );
					$valid     = $discounts->is_coupon_valid( $coupon );
					if ( is_wp_error( $valid ) ) {
						if ( ! empty( $user_reward ) ) {
							//case 1: order placed, limit reached, no record in transaction, so create record in transaction
							if ( empty( $user_reward_transaction ) ) {
								$insert_data = array(
									'user_email'        => $user_reward->email,
									'action_type'       => $user_reward->action_type,
									'user_reward_id'    => $user_reward->id,
									'order_id'          => $order_id,
									'order_total'       => $order->get_total(),
									'reward_amount'     => $reward_amount,
									'reward_amount_tax' => $reward_amount_tax,
									'reward_currency'   => $order->get_currency(),
									'discount_code'     => $coupon_code,
									'discount_id'       => $coupon->get_id(),
									'display_name'      => $user_reward->display_name,
									'log_data'          => '{}',
									'created_at'        => strtotime( gmdate( "Y-m-d H:i:s" ) ),
									'modified_at'       => 0,
								);
								//create transaction
								$reward_transaction->insertRow( $insert_data );
							}
							// change status to "used"
							$updateData = array(
								'status' => 'used',
							);
							$where      = array( 'id' => $user_reward->id );
							$user_reward_model->updateRow( $updateData, $where );
						}
						//case 2: order placed, limit reached, record in transaction, do nothing
					} else {
						$order = self::$woocommerce->getOrder( $order_id );
						//case 3: order placed, not reached limit, check coupon limit reduced in order, if reduced, record in transaction
						$has_recorded = $order->get_data_store()->get_recorded_coupon_usage_counts( $order );
						if ( $has_recorded ) {
							if ( empty( $user_reward_transaction ) ) {
								$insert_data = array(
									'user_email'        => $user_reward->email,
									'action_type'       => $user_reward->action_type,
									'user_reward_id'    => $user_reward->id,
									'order_id'          => $order_id,
									'order_total'       => $order->get_total(),
									'reward_amount'     => $reward_amount,
									'reward_amount_tax' => $reward_amount_tax,
									'reward_currency'   => $order->get_currency(),
									'discount_code'     => $coupon_code,
									'discount_id'       => $coupon->get_id(),
									'log_data'          => '{}',
									'created_at'        => strtotime( gmdate( "Y-m-d H:i:s" ) ),
									'modified_at'       => 0,
								);
								//create transaction
								$reward_transaction->insertRow( $insert_data );
							}
						} else {
							//case 3: order placed, not reached limit, check coupon limit reduced in order, if not reduced, delete record in transaction
							if ( ! empty( $user_reward_transaction ) ) {
								$where = array( 'id' => $user_reward_transaction->id );
								$reward_transaction->deleteRow( $where );
							}
						}
						// change status to 'active'
						if ( ! empty( $user_reward ) ) {
							$updateData = array(
								'status' => 'active'
							);
							$where      = array( 'id' => $user_reward->id );
							$user_reward_model->updateRow( $updateData, $where );
						}
					}
				}
			}
		}
	}

	function emailUpdatePointTransfer( $status, $old_user_data, $new_user_data ) {
		//rule 1: login user email and old user email must be same
		$user_email = self::$woocommerce->get_login_user_email();
		if ( ! self::$woocommerce->isBannedUser( $user_email ) && isset( $new_user_data['user_email'] )
		     && isset( $old_user_data['user_email'] ) && ! empty( $new_user_data['user_email'] )
		     && $old_user_data['user_email'] !== $new_user_data['user_email'] && $user_email == $old_user_data['user_email'] ) {
			$earn_campaign_helper = new EarnCampaign();
			$old_user             = $earn_campaign_helper->getPointUserByEmail( $old_user_data['user_email'] );
			$new_user             = $earn_campaign_helper->getPointUserByEmail( $new_user_data['user_email'] );
			//rule 2: new email must not be available in loyalty user list
			if ( empty( $new_user ) && ! empty( $old_user ) && filter_var( $new_user_data['user_email'], FILTER_VALIDATE_EMAIL ) !== false ) {
				try {
					$new_user_email
						                     = sanitize_email( $new_user_data['user_email'] );
					$user_condition          = array(
						'id' => $old_user->id
					);
					$user_data               = (array) $old_user;
					$user_data['user_email'] = $new_user_email;
					$user_model              = new Users();
					if ( $user_model->updateRow( $user_data, $user_condition ) ) {
						$earn_campaign_model = new EarnCampaignTransactions();
						$query_condition     = array(
							'user_email' => array(
								'operator' => '=',
								'value'    => $old_user_data['user_email']
							)
						);
						$earn_campaign_data  = $earn_campaign_model->getQueryData( $query_condition, '*', array(), false, false );
						if ( ! empty( $earn_campaign_data ) ) {
							foreach ( $earn_campaign_data as $earn_campaign ) {
								$earn_campaign_condition         = array(
									'id' => $earn_campaign->id
								);
								$new_earn_campaign               = (array) $earn_campaign;
								$new_earn_campaign['user_email'] = $new_user_email;
								$earn_campaign_model->updateRow( $new_earn_campaign, $earn_campaign_condition );
							}
						}
						$reward_trans_model = new RewardTransactions();
						$reward_trans_data  = $reward_trans_model->getQueryData( $query_condition, '*', array(), false, false );
						if ( ! empty( $reward_trans_data ) ) {
							foreach ( $reward_trans_data as $reward_trans ) {
								$reward_trans_condition     = array(
									'id' => $reward_trans->id
								);
								$reward_trans               = (array) $reward_trans;
								$reward_trans['user_email'] = $new_user_email;
								$reward_trans_model->updateRow( $reward_trans,
									$reward_trans_condition );
							}
						}

						$log_table = new Logs();
						$log_data  = $log_table->getQueryData( $query_condition, '*', array(), false, false );
						if ( ! empty( $log_data ) ) {
							foreach ( $log_data as $log ) {
								$log_condition     = array(
									'id' => $log->id
								);
								$log               = (array) $log;
								$log['user_email'] = $new_user_email;
								$log_table->updateRow( $log, $log_condition );
							}
						}

						$point_ledger_table = new PointsLedger();
						$point_ledger_data  = $point_ledger_table->getQueryData( $query_condition, '*', array(), false, false );
						if ( ! empty( $point_ledger_data ) ) {
							foreach ( $point_ledger_data as $point_ledger ) {
								$ledger_condition           = array(
									'id' => $point_ledger->id
								);
								$point_ledger               = (array) $point_ledger;
								$point_ledger['user_email'] = $new_user_email;
								$point_ledger_table->updateRow( $point_ledger, $ledger_condition );
							}
						}

						$user_reward_model = new UserRewards();
						$query_condition   = array(
							'email' => array(
								'operator' => '=',
								'value'    => $old_user_data['user_email']
							)
						);
						$user_reward_data  = $user_reward_model->getQueryData( $query_condition, '*', array(), false, false );
						if ( ! empty( $user_reward_data ) ) {
							foreach ( $user_reward_data as $user_reward ) {
								$user_reward_condition = array(
									'id' => $user_reward->id
								);
								$user_reward           = (array) $user_reward;
								$user_reward['email']  = $new_user_email;
								$user_reward_model->updateRow( $user_reward, $user_reward_condition );
								if ( isset( $user_reward['discount_id'] ) && isset( $user_reward['discount_code'] ) && $user_reward['discount_id'] > 0 && ! empty( $user_reward['discount_code'] ) ) {
									$customer_emails = array(
										$new_user_email
									);
									update_post_meta( $user_reward['discount_id'], 'customer_email', array_filter( array_map( 'sanitize_email', $customer_emails ) ) );
								}
							}
						}

						$log_data = array(
							'user_email'          => $new_user_email,
							'action_type'         => 'new_user_add',
							'earn_campaign_id'    => 0,
							'campaign_id'         => 0,
							/* translators: 1: old email 2: new email */
							'note'                => sprintf( __( 'Email changed from %1$s to %2$s', 'wp-loyalty-rules' ), $old_user_data['user_email'], $new_user_email ),
							/* translators: 1: old email 2: new email */
							'customer_note'       => sprintf( __( 'Email changed from %1$s to %2$s', 'wp-loyalty-rules' ), $old_user_data['user_email'], $new_user_email ),
							'order_id'            => 0,
							'product_id'          => 0,
							'admin_id'            => 0,
							'created_at'          => strtotime( gmdate( "Y-m-d H:i:s" ) ),
							'modified_at'         => 0,
							'points'              => (int) 0,
							'action_process_type' => 'email_update',
							'referral_type'       => '',
							'reward_id'           => 0,
							'user_reward_id'      => 0,
							'expire_email_date'   => 0,
							'expire_date'         => 0,
							'reward_display_name' => null,
							'required_points'     => 0,
							'discount_code'       => null,
						);
						$earn_campaign_helper->add_note( $log_data );
						do_action( 'wlr_my_account_email_change', $new_user_email, $old_user_data['user_email'] );
					}
				} catch ( \Exception $e ) {
				}
			}
		}

		return $status;
	}

	function myRewardsPagination() {
		$wlr_nonce = (string) self::$input->post_get( 'wlr_nonce', '' );
		$json      = array(
			'status' => false,
			'data'   => array(),
		);
		if ( ! Woocommerce::verify_nonce( $wlr_nonce, 'wlr_pagination_nonce' ) ) {
			$json['data']['message'] = __( 'Invalid nonce', 'wp-loyalty-rules' );
			wp_send_json( $json );
		}
		$post          = self::$input->post();
		$validate_data = Validation::validateRenderPage( $post );
		if ( is_array( $validate_data ) ) {
			foreach ( $validate_data as $key => $validate ) {
				$validate_data[ $key ] = array( current( $validate ) );
			}
			$data['success'] = false;
			$data['data']    = array(
				'field_error' => $validate_data,
				'message'     => __( 'Basic validation failed', 'wp-loyalty-rules' )
			);
			wp_send_json( $data );
		}
		$type       = (string) isset( $post ) && is_array( $post ) && isset( $post['type'] ) && ! empty( $post['type'] ) ? $post['type'] : '';
		$user_email = self::$woocommerce->get_login_user_email();
		$params     = array(
			'branding'     => ( new CustomerPage() )->getBrandingData(),
			'endpoint_url' => $post['endpoint_url'],
		);
		$html       = '';
		switch ( $type ) {
			case 'coupons':
				$html = $this->getCouponPaginationContent( $post, $user_email, $params );
				break;
			case 'coupons-expired':
				$html = $this->getExpiredUsedCouponPaginationContent( $post, $user_email, $params );
				break;
		}
		wp_send_json( [
			'status' => true,
			'data'   => [
				'html' => $html
			]
		] );
	}

	function getCouponPaginationContent( $post, $user_email, $params ) {
		$page_number                 = (int) isset( $post ) && is_array( $post ) && isset( $post['page_number'] ) && ! empty( $post['page_number'] ) ? $post['page_number'] : 0;
		$customer_page               = new CustomerPage();
		$pagination_params           = array(
			'coupon_page' => $page_number,
			'limit'       => 5,
		);
		$user_rewards                = $customer_page->getPageUserRewards( $user_email, $pagination_params );
		$params['user_rewards']      = $user_rewards;
		$params['page_type']         = isset( $post['page_type'] ) && ! empty( $post['page_type'] ) ? $post['page_type'] : "";
		$setting_option              = self::$woocommerce->getOptions( 'wlr_settings' );
		$params['is_revert_enabled'] = ( isset( $setting_option['is_revert_enabled'] ) && ! empty( $setting_option['is_revert_enabled'] ) && $setting_option['is_revert_enabled'] == 'yes' );

		return $customer_page->getCouponsPageContent( $params, $user_email, $pagination_params );
	}

	function getExpiredUsedCouponPaginationContent( $post, $user_email, $params ) {
		$page_number       = (int) isset( $post ) && is_array( $post ) && isset( $post['page_number'] ) && ! empty( $post['page_number'] ) ? $post['page_number'] : 0;
		$customer_page     = new CustomerPage();
		$pagination_params = array(
			'used_expired_coupon_page' => $page_number,
			'limit'                    => 5,
		);

		return $customer_page->getExpiredCouponsPageContent( $params, $user_email, $pagination_params );
	}

	/**
	 * Remove free product coupon from cart.
	 *
	 * @return void
	 */
	function removeFreeProductCouponCode() {
		$applied_coupons    = WC()->cart->get_applied_coupons();
		$reward_helper      = \Wlr\App\Helpers\Rewards::getInstance();
		$woocommerce_helper = Woocommerce::getInstance();
		$current_language   = $woocommerce_helper->getCurrentLanguage();
		foreach ( $applied_coupons as $coupon_code ) {
			if ( ! $reward_helper->is_loyalty_coupon( $coupon_code ) ) {
				continue;
			}
			$reward = $reward_helper->getUserRewardByCoupon( $coupon_code );
			if ( empty( $reward ) || ! is_object( $reward ) || ! isset( $reward->discount_type ) || $reward->discount_type != 'free_product' || ! isset( $reward->free_product ) ) {
				continue;
			}
			$free_products = ( self::$woocommerce->isJson( $reward->free_product ) ) ? json_decode( $reward->free_product, true ) : array();

			$product_ids = array_map( function ( $item ) use ( $current_language, $woocommerce_helper ) {
				return $woocommerce_helper->getProductIdBasedOnCurrentLanguage( $item['value'], $current_language );
			}, $free_products );

			$cart             = self::$woocommerce->getCart();
			$cart_product_ids = [];
			foreach ( $cart->get_cart() as $item ) {
				$product_id   = isset( $item['product_id'] ) && ! empty( $item['product_id'] ) ? $item['product_id'] : 0;
				$variation_id = isset( $item['variation_id'] ) && ! empty( $item['variation_id'] ) ? $item['variation_id'] : 0;
				if ( $variation_id > 0 ) {
					$cart_product_ids[] = $variation_id;
				}
				$cart_product_ids[] = $product_id;
			}
			///$cart_product_ids = array_column($cart->get_cart(), 'product_id');
			$has_no_product = count( array_intersect( $product_ids, $cart_product_ids ) ) == count( $product_ids );
			if ( empty( $has_no_product ) ) {
				$cart->remove_coupon( $coupon_code );
				wc_clear_notices();
			}
		}
	}
}