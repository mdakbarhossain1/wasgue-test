<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Conditions;

use Wlr\App\Conditions\Base;

defined( 'ABSPATH' ) or die();

class Currency extends Base {
	function __construct() {
		parent::__construct();
		$this->name  = 'currency';
		$this->label = __( 'Currency', 'wp-loyalty-rules' );
		$this->group = __( 'Common', 'wp-loyalty-rules' );
	}

	public function isProductValid( $options, $data ) {
		return $this->check( $options, $data );
	}

	public function check( $options, $data ) {
		if ( isset( $options->value ) && isset( $options->operator ) && $options->operator == 'equal' ) {
			$is_calculate_base = isset( $data['is_calculate_based'] ) && ! empty( $data['is_calculate_based'] ) ? $data['is_calculate_based'] : '';
			$current_currency  = self::$woocommerce_helper->getCurrentCurrency();
			if ( $is_calculate_base === 'order' && isset( $data[ $is_calculate_base ] ) && ! empty( $data[ $is_calculate_base ] ) ) {
				$order            = self::$woocommerce_helper->getOrder( $data[ $is_calculate_base ] );
				$current_currency = is_object( $order ) && method_exists( $order, 'get_currency' ) ? $order->get_currency() : self::$woocommerce_helper->getCurrentCurrency();
			}
			if ( ! empty( $options->value ) && $current_currency == $options->value ) {
				return true;
			}
		}

		return false;
	}
}