<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Conditions;
defined( 'ABSPATH' ) or die();

use Wlr\App\Conditions\Base;

class PaymentMethod extends Base {
	function __construct() {
		parent::__construct();
		$this->name  = 'payment_method';
		$this->label = __( 'Payment Method', 'wp-loyalty-rules' );
		$this->group = __( 'Cart', 'wp-loyalty-rules' );
	}

	public function isProductValid( $options, $data ) {
		return $this->check( $options, $data );
	}

	public function check( $options, $data ) {
		$status = false;
		if ( isset( $options->operator ) && isset( $options->value ) ) {
			$operator          = sanitize_text_field( $options->operator );
			$payment_method    = '';
			$is_calculate_base = isset( $data['is_calculate_based'] ) && ! empty( $data['is_calculate_based'] ) ? $data['is_calculate_based'] : '';
			if ( $is_calculate_base === 'cart' && isset( $data[ $is_calculate_base ] ) && ! empty( $data[ $is_calculate_base ] ) ) {
				$post_data = $this->input->post( 'post_data' );
				$post      = array();
				if ( ! empty( $post_data ) ) {
					parse_str( $post_data, $post );
				}
				if ( ! isset( $post['payment_method'] ) ) {
					$post['payment_method'] = $this->input->post( 'payment_method' );
				}
				if ( isset( $post['payment_method'] ) && ! empty( $post['payment_method'] ) ) {
					$payment_method = $post['payment_method'];
				}
				if ( empty( $payment_method ) ) {
					$payment_method = self::$woocommerce_helper->getSession( 'chosen_payment_method', null );
				}
			} elseif ( $is_calculate_base === 'order' && isset( $data[ $is_calculate_base ] ) && ! empty( $data[ $is_calculate_base ] ) ) {
				$order = self::$woocommerce_helper->getOrder( $data[ $is_calculate_base ] );
				if ( ! empty( $order ) ) {
					$payment_method = $order->get_payment_method();
				}
			} elseif ( $is_calculate_base === 'product' ) {
				return true;
			}
			if ( empty( $payment_method ) ) {
				return true;
			}
			$status = $this->doCompareInListOperation( $operator, $payment_method, $options->value );
		}

		return $status;
	}
}