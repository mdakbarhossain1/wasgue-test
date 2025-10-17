<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Conditions;
defined( 'ABSPATH' ) or die();

use Wlr\App\Conditions\Base;

class Products extends Base {
	function __construct() {
		parent::__construct();
		$this->name  = 'products';
		$this->label = __( 'Products', 'wp-loyalty-rules' );
		$this->group = __( 'Product', 'wp-loyalty-rules' );
	}

	public function check( $options, $data ) {
		$status = false;
		if ( isset( $options->operator ) && isset( $options->value ) ) {
			$options->value    = $this->changeOptionValue( $options->value );
			$is_calculate_base = isset( $data['is_calculate_based'] ) && ! empty( $data['is_calculate_based'] ) ? $data['is_calculate_based'] : '';
			if ( $is_calculate_base === 'cart' && isset( $data[ $is_calculate_base ] ) && ! empty( $data[ $is_calculate_base ] ) ) {
				$object = self::$woocommerce_helper->getCart( $data[ $is_calculate_base ] );
				$items  = self::$woocommerce_helper->getCartItems( $object );
				$status = $this->doItemsCheck( $object, $items, $options, $data, 'products' );
			} elseif ( $is_calculate_base === 'order' && isset( $data[ $is_calculate_base ] ) && ! empty( $data[ $is_calculate_base ] ) ) {
				$object = self::$woocommerce_helper->getOrder( $data[ $is_calculate_base ] );
				$items  = self::$woocommerce_helper->getOrderItems( $object );
				$status = $this->doItemsCheck( $object, $items, $options, $data, 'products' );
			} elseif ( $is_calculate_base === 'product' && isset( $data[ $is_calculate_base ] ) && ! empty( $data[ $is_calculate_base ] ) ) {
				$status = $this->isProductValid( $options, $data );
			}
		}

		return $status;
	}

	public function isProductValid( $options, $data ) {
		$status            = false;
		$is_calculate_base = isset( $data['is_calculate_based'] ) && ! empty( $data['is_calculate_based'] ) ? $data['is_calculate_based'] : '';
		$item              = array();
		$product           = array();
		if ( $is_calculate_base == 'cart' && isset( $data[ $is_calculate_base ] ) && ! empty( $data[ $is_calculate_base ] ) ) {
			$item    = isset( $data['current'] ) ? $data['current'] : array();
			$product = isset( $item['data'] ) ? $item['data'] : array();
		} elseif ( $is_calculate_base == 'order' && isset( $data[ $is_calculate_base ] ) && ! empty( $data[ $is_calculate_base ] ) ) {
			$order   = self::$woocommerce_helper->getOrder( $data[ $is_calculate_base ] );
			$item    = isset( $data['current'] ) ? $data['current'] : array();
			$product = version_compare( WC_VERSION, '4.4.0', '<' )
				? $order->get_product_from_item( $item )
				: $item->get_product();
		} elseif ( $is_calculate_base == 'product' && isset( $data[ $is_calculate_base ] ) && ! empty( $data[ $is_calculate_base ] ) ) {
			$product = self::$woocommerce_helper->getProduct( $data[ $is_calculate_base ] );
		}
		if ( empty( $product ) ) {
			return $status;
		}
		$product = apply_filters( 'wlr_product_level_item', $product, $data );
		//$values             = (array) isset( $options->value ) ? $this->changeOptionValue( $options->value ) : array();
		$values             = (array) isset( $options->value ) ? ( array_column( $options->value, 'value' ) ? $this->changeOptionValue( $options->value ) : $options->value ) : array();
		$comparision_method = isset( $options->operator ) ? $options->operator : 'in_list';
		$values             = $this->getProductValues( $values );
		$is_in_list         = $this->compareWithProducts( $product, $values, $item );
		if ( $is_in_list && $comparision_method == 'in_list' ) {
			$status = true;
		}
		if ( ! $is_in_list && $comparision_method == 'not_in_list' ) {
			$status = true;
		}

		return $status;
	}

	public function getProductInclude( $condition ) {
		$products = array();
		if ( isset( $condition->operator ) && isset( $condition->value ) && in_array( $condition->operator, array( 'in_list' ) ) ) {
			$products = (array) isset( $options->value ) ? $this->changeOptionValue( $condition->value ) : array();
		}

		return $products;
	}

	public function getProductExclude( $condition ) {
		$products = array();
		if ( isset( $condition->operator ) && isset( $condition->value ) && in_array( $condition->operator, array( 'not_in_list' ) ) ) {
			$products = (array) isset( $options->value ) ? $this->changeOptionValue( $condition->value ) : array();
		}

		return $products;
	}
}