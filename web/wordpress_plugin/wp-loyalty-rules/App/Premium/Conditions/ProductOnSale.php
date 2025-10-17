<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Conditions;
defined( 'ABSPATH' ) or die();

use Wlr\App\Conditions\Base;

class ProductOnSale extends Base {
	function __construct() {
		parent::__construct();
		$this->name  = 'product_onsale';
		$this->label = __( 'On sale products', 'wp-loyalty-rules' );
		$this->group = __( 'Product', 'wp-loyalty-rules' );
	}

	public function check( $options, $data ) {
		$status = false;
		if ( isset( $options->operator ) ) {
			$comparison_method = ! empty( $options->operator ) ? $options->operator : 'include';
			$is_calculate_base = isset( $data['is_calculate_based'] ) && ! empty( $data['is_calculate_based'] ) ? $data['is_calculate_based'] : '';
			if ( $is_calculate_base === 'cart' && isset( $data[ $is_calculate_base ] ) && ! empty( $data[ $is_calculate_base ] ) ) {
				$object = self::$woocommerce_helper->getCart( $data[ $is_calculate_base ] );
				$items  = self::$woocommerce_helper->getCartItems( $object );
				$status = $this->doOnSaleCheck( $object, $items, $comparison_method, $data );


				/*foreach ($items as $item) {
					$item_status = $this->checkAdditionalRestriction($item, $is_calculate_base);
					if (!$item_status) continue;
					$product = isset($item['data']) ? $item['data'] : array();
					if (!empty($product)) {
						$result[] = $this->isSingleProductOnSale($product, $comparison_method);
					}
				}
				if (!empty($result)) {
					$result = array_unique($result);
					$status = !in_array("false", $result);
				}*/
			} elseif ( $is_calculate_base === 'order' && isset( $data[ $is_calculate_base ] ) && ! empty( $data[ $is_calculate_base ] ) ) {
				$object = self::$woocommerce_helper->getOrder( $data[ $is_calculate_base ] );
				$items  = self::$woocommerce_helper->getOrderItems( $object );
				$status = $this->doOnSaleCheck( $object, $items, $comparison_method, $data );
				/*foreach ($items as $item) {
					$item_status = $this->checkAdditionalRestriction($item, $is_calculate_base);
					if (!$item_status) continue;
					$product = version_compare(WC_VERSION, '4.4.0', '<')
						? $object->get_product_from_item($item)
						: $item->get_product();
					if (!empty($product)) {
						$result[] = $this->isSingleProductOnSale($product, $comparison_method);
					}
				}
				if (!empty($result)) {
					$result = array_unique($result);
					$status = !in_array("false", $result);
				}*/
			} elseif ( $is_calculate_base === 'product' && isset( $data[ $is_calculate_base ] ) && ! empty( $data[ $is_calculate_base ] ) ) {
				$product = self::$woocommerce_helper->getProduct( $data[ $is_calculate_base ] );
				//$current_status = $this->isSingleProductOnSale($product, $comparison_method);
				$current_status = self::$woocommerce_helper->isProductInSale( $product );
				if ( ( $comparison_method == 'include' ) || ( ! $current_status && $comparison_method == 'exclude' ) ) {
					$status = true;
				}
				/*if ($current_status === 'true') {
					$status = true;
				}*/
			}
		}

		return $status;
	}

	function doOnSaleCheck( $object, $items, $comparison_method, $data ) {
		if ( empty( $object ) || empty( $items ) ) {
			return false;
		}
		$is_calculate_base = isset( $data['is_calculate_based'] ) && ! empty( $data['is_calculate_based'] ) ? $data['is_calculate_based'] : '';
		$count             = 0;
		$items             = $this->getItemsWithoutFreeProduct( $items, $is_calculate_base );
		foreach ( $items as $item ) {
			$product = new \stdClass();
			if ( $is_calculate_base === 'cart' ) {
				$product = isset( $item['data'] ) ? $item['data'] : new \stdClass();
			} elseif ( $is_calculate_base === 'order' ) {
				$product = version_compare( WC_VERSION, '4.4.0', '<' )
					? $object->get_product_from_item( $item )
					: $item->get_product();
			}
			$current_status = self::$woocommerce_helper->isProductInSale( $product );
			if ( ( $comparison_method == 'include' ) || ( ! $current_status && $comparison_method == 'exclude' ) ) {
				$count += 1;
			}
		}

		return $count >= 1;
	}

	/*protected function isSingleProductOnSale($product, $comparision_method)
	{
		$current_status = self::$woocommerce_helper->isProductInSale($product);
		if (!$current_status) {
			return 'true';
		}
		$status_string = 'false';
		if ($comparision_method == 'include') {
			$status_string = 'true';
		}
		return $status_string;
	}*/

	public function isProductValid( $options, $data ) {
		$status            = false;
		$is_calculate_base = isset( $data['is_calculate_based'] ) && ! empty( $data['is_calculate_based'] ) ? $data['is_calculate_based'] : '';
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
		$comparision_method = isset( $options->operator ) ? $options->operator : 'in_list';
		$current_status     = $this->isSingleProductOnSale( $product, $comparision_method );
		if ( $current_status === 'true' ) {
			$status = true;
		}

		return $status;
	}

	protected function isSingleProductOnSale( $product, $comparision_method ) {
		$current_status = self::$woocommerce_helper->isProductInSale( $product );
		if ( ! $current_status ) {
			return 'true';
		}
		$status_string = 'false';
		if ( $comparision_method == 'include' ) {
			$status_string = ( $current_status ) ? 'true' : 'false';
		} elseif ( $comparision_method == 'exclude' ) {
			$status_string = ( $current_status ) ? 'false' : 'true';
		}

		return $status_string;
	}

	public function isSaleItemExclude( $condition ) {
		$status = false;
		if ( isset( $condition->operator ) && in_array( $condition->operator, array( 'exclude' ) ) ) {
			$status = true;
		}

		return $status;
	}
}