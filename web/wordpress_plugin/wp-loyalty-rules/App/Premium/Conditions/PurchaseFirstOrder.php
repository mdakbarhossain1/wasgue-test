<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Conditions;
defined( 'ABSPATH' ) or die();

use Wlr\App\Conditions\Base;

class PurchaseFirstOrder extends Base {
	public function __construct() {
		parent::__construct();
		$this->name  = 'purchase_first_order';
		$this->label = __( 'First order', 'wp-loyalty-rules' );
		$this->group = __( 'Purchase History', 'wp-loyalty-rules' );
	}

	public function isProductValid( $options, $data ) {
		return $this->check( $options, $data );
	}

	function check( $options, $data ) {
		$billing_email = isset( $data['user_email'] ) && ! empty( $data['user_email'] ) ? $data['user_email'] : '';
		if ( ! empty( $billing_email ) ) {
			$args              = array(
				'billing_email' => $billing_email,
				'limit'         => 2
			);
			$orders            = self::$woocommerce_helper->getOrdersThroughWCOrderQuery( $args );
			$first_order       = (int) isset( $options->value ) ? $options->value : 1;
			$is_calculate_base = isset( $data['is_calculate_based'] ) && ! empty( $data['is_calculate_based'] ) ? $data['is_calculate_based'] : '';
			if ( $is_calculate_base === 'cart' && isset( $data[ $is_calculate_base ] ) && ! empty( $data[ $is_calculate_base ] ) ) {
				if ( $first_order ) {
					return empty( $orders );
				} else {
					return ! empty( $orders );
				}
			} elseif ( $is_calculate_base === 'order' && isset( $data[ $is_calculate_base ] ) && ! empty( $data[ $is_calculate_base ] ) ) {
				if ( $first_order ) {
					return count( $orders ) <= 1;
				} else {
					return count( $orders ) > 1;
				}
			}
		}

		return false;
	}
}