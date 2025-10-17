<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Conditions;
defined( 'ABSPATH' ) or die();

use Wlr\App\Conditions\Base;

class OrderStatus extends Base {
	public function __construct() {
		parent::__construct();
		$this->name  = 'order_status';
		$this->label = __( 'Order Status', 'wp-loyalty-rules' );
		$this->group = __( 'Order', 'wp-loyalty-rules' );
	}

	public function isProductValid( $options, $data ) {
		return $this->check( $options, $data );
	}

	function check( $options, $data ) {
		$status = false;
		if ( isset( $options->value ) && isset( $options->operator ) ) {
			$operator          = sanitize_text_field( $options->operator );
			$order_status      = '';
			$is_calculate_base = isset( $data['is_calculate_based'] ) && ! empty( $data['is_calculate_based'] ) ? $data['is_calculate_based'] : '';
			if ( $is_calculate_base === 'order' && isset( $data[ $is_calculate_base ] ) && ! empty( $data[ $is_calculate_base ] ) ) {
				$order_status = self::$woocommerce_helper->getOrderStatus( $data[ $is_calculate_base ] );
			} elseif ( in_array( $is_calculate_base, array( 'cart', 'product' ) ) ) {
				return true;
			}
			$status = $this->doCompareInListOperation( $operator, $order_status, $options->value );
		}

		return $status;
	}
}