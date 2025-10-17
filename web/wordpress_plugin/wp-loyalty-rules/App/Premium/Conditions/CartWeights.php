<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Conditions;
defined( 'ABSPATH' ) or die();

use Wlr\App\Conditions\Base;

class CartWeights extends Base {
	public function __construct() {
		parent::__construct();
		$this->name  = 'cart_weights';
		$this->label = __( 'Cart Weight', 'wp-loyalty-rules' );
		$this->group = __( 'Cart', 'wp-loyalty-rules' );
	}

	public function isProductValid( $options, $data ) {
		return $this->check( $options, $data );
	}

	function check( $options, $data ) {
		$status = false;
		if ( isset( $options->operator ) && isset( $options->value ) ) {
			$operator          = sanitize_text_field( $options->operator );
			$value             = $options->value;
			$is_calculate_base = isset( $data['is_calculate_based'] ) && ! empty( $data['is_calculate_based'] ) ? $data['is_calculate_based'] : '';
			$total_weight      = 0;
			if ( $is_calculate_base === 'cart' && isset( $data[ $is_calculate_base ] ) && ! empty( $data[ $is_calculate_base ] ) ) {
				$cart_items = self::$woocommerce_helper->getCartItems( $data[ $is_calculate_base ] );
				$cart_items = $this->getItemsWithoutFreeProduct( $cart_items, $is_calculate_base );
				if ( isset( $options->sub_condition_type ) && $options->sub_condition_type == 'all_item_weight' ) {
					foreach ( $cart_items as $cart_item ) {
						if ( isset( $cart_item['data'] ) && $cart_item['data']->has_weight() ) {
							$total_weight += (float) $cart_item['data']->get_weight() * $cart_item['quantity'];
						}
					}
				} elseif ( isset( $options->sub_condition_type ) && $options->sub_condition_type == 'each_item_weight' ) {
					foreach ( $cart_items as $values ) {
						if ( isset( $values['data'] ) && $values['data']->has_weight() ) {
							$total_weight    = (float) $values['data']->get_weight() * $values['quantity'];
							$cartitem_status = $this->doComparisionOperation( $operator, $total_weight, $value );
							if ( ! $cartitem_status ) {
								return $status;
							}
						} else {
							return $status;
						}
					}
				}
			} elseif ( $is_calculate_base === 'order' && isset( $data[ $is_calculate_base ] ) && ! empty( $data[ $is_calculate_base ] ) ) {
				$order_items = self::$woocommerce_helper->getOrderItems( $data[ $is_calculate_base ] );
				$order_items = $this->getItemsWithoutFreeProduct( $order_items, $is_calculate_base );
				foreach ( $order_items as $order_item ) {
					$product = $order_item->get_product();
					if ( isset( $options->sub_condition_type ) && $options->sub_condition_type == 'all_item_weight' ) {
						if ( $product->has_weight() ) {
							$total_weight += (float) $product->get_weight() * $order_item->get_quantity();
						}
					} elseif ( isset( $options->sub_condition_type ) && $options->sub_condition_type == 'each_item_weight' ) {
						if ( $product->has_weight() ) {
							$total_weight    = (float) $product->get_weight() * $order_item->get_quantity();
							$cartitem_status = $this->doComparisionOperation( $operator, $total_weight, $value );
							if ( ! $cartitem_status ) {
								return $status;
							}
						} else {
							return $status;
						}
					}
				}
			} elseif ( $is_calculate_base === 'product' ) {
				return true;
			}
			$status = $this->doComparisionOperation( $operator, $total_weight, $value );
		}

		return $status;
	}
}