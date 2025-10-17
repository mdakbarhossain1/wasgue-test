<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-3.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Controllers\Site;

use Wlr\App\Controllers\Base;
use Wlr\App\Helpers\EarnCampaign;
use Wlr\App\Premium\Helpers\Referral;

defined( 'ABSPATH' ) or die;

class ProductReview extends Base {
	/* Product review start*/
	function getPointProductReview( $point, $rule, $data ) {
		$product_review_helper = \Wlr\App\Premium\Helpers\ProductReview::getInstance();

		return $product_review_helper->getTotalEarnPoint( $point, $rule, $data );
	}

	function getCouponProductReview( $point, $rule, $data ) {
		$product_review_helper = \Wlr\App\Premium\Helpers\ProductReview::getInstance();

		return $product_review_helper->getTotalEarnReward( $point, $rule, $data );
	}

	function displayProductReviewMessage( $commant_form ) {
		if ( ! is_user_logged_in() || self::$woocommerce->isBannedUser() || apply_filters( 'wlr_hide_product_review_message', false, $commant_form ) ) {
			return $commant_form;
		}
		
		global $product;
		$post_id = is_object( $product ) && self::$woocommerce->isMethodExists( $product, 'get_id' ) ? $product->get_id() : 0;
		if ( $post_id <= 0 ) {
			return $commant_form;
		}
		$earn_campaign    = EarnCampaign::getInstance();
		$cart_action_list = array(
			'product_review'
		);
		$extra            = array(
			'user_email'         => self::$woocommerce->get_login_user_email(),
			'product_id'         => $post_id,
			'is_calculate_based' => 'product',
			'product'            => self::$woocommerce->getProduct( $post_id )
		);
		$reward_list      = $earn_campaign->getActionEarning( $cart_action_list, $extra );
		$message          = '';
		foreach ( $reward_list as $action => $rewards ) {
			foreach ( $rewards as $key => $reward ) {
				if ( isset( $reward['messages'] ) && ! empty( $reward['messages'] ) ) {
					$message .= "<br/>" . $reward['messages'];
				}
			}
		}
		if ( isset( $commant_form['comment_notes_after'] ) && ! empty( $message ) ) {
			$commant_form['comment_notes_after'] = $commant_form['comment_notes_after'] . $message;
		}

		return $commant_form;
	}

	public function productReviewApproveAction( $comment ) {
		if ( ! is_object( $comment ) || ! isset( $comment->comment_post_ID ) || $comment->comment_post_ID <= 0 ) {
			return;
		}
		$post_type = get_post_type( $comment->comment_post_ID );
		if ( $post_type === 'product' && isset( $comment->comment_author_email ) && ! empty( $comment->comment_author_email ) && filter_var( $comment->comment_author_email, FILTER_VALIDATE_EMAIL ) && $this->isApproveCommandEligibleForEarning( $comment ) ) {
			$this->doEarnProductReview( $comment );
		}
	}

	function isApproveCommandEligibleForEarning( $comment ) {
		if ( ! is_object( $comment ) || ! isset( $comment->comment_author_email ) || ! isset( $comment->comment_post_ID ) || ! isset( $comment->comment_ID ) || self::$woocommerce->isBannedUser( $comment->comment_author_email ) ) {
			return false;
		}

		return apply_filters( 'wlr_point_approve_add_product_review_points', true, $comment );
	}

	function doEarnProductReview( $comment ) {
		if ( ! is_object( $comment ) || ! isset( $comment->comment_author_email ) || ! isset( $comment->comment_post_ID ) || ! isset( $comment->comment_ID ) ) {
			return;
		}
		$product_review_helper = new \Wlr\App\Premium\Helpers\ProductReview();
		$action_data           = array(
			'user_email'         => $comment->comment_author_email,
			'product_id'         => $comment->comment_post_ID,
			'is_calculate_based' => 'product',
			'product'            => self::$woocommerce->getProduct( $comment->comment_post_ID )
		);
		$product_review_helper->applyEarnProductReview( $action_data );
		$referral_helper = new Referral();
		$referral_helper->doReferralCheck( $action_data );
	}

	public function productReviewAction( $comment_id, $approved = 0 ) {
		if ( ! is_user_logged_in() || ! $approved ) {
			return;
		}
		$comment   = get_comment( $comment_id );
		$post_type = get_post_type( $comment->comment_post_ID );
		if ( $post_type === 'product' && isset( $comment->comment_author_email ) && ! empty( $comment->comment_author_email ) && filter_var( $comment->comment_author_email, FILTER_VALIDATE_EMAIL ) && $this->isProductReviewEligibleForEarning( $comment ) ) {
			$this->doEarnProductReview( $comment );
		}
	}

	function isProductReviewEligibleForEarning( $comment ) {
		if ( ! is_object( $comment ) || ! isset( $comment->comment_author_email ) || ! isset( $comment->comment_post_ID ) || ! isset( $comment->comment_ID ) ) {
			return false;
		}

		return apply_filters( 'wlr_point_post_add_product_review_points', true, $comment->comment_ID );
	}
	/*End product review*/
}