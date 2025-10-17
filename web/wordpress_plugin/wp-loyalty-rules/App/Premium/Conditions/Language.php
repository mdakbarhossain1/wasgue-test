<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Conditions;

use Wlr\App\Conditions\Base;

defined( 'ABSPATH' ) or die();

class Language extends Base {
	function __construct() {
		parent::__construct();
		$this->name  = 'language';
		$this->label = __( 'Language', 'wp-loyalty-rules' );
		$this->group = __( 'Common', 'wp-loyalty-rules' );
	}

	public function isProductValid( $options, $data ) {
		return $this->check( $options, $data );
	}

	public function check( $options, $data ) {
		if ( isset( $options->value ) && isset( $options->operator ) && $options->operator == 'equal' ) {
			$is_calculate_base = isset( $data['is_calculate_based'] ) && ! empty( $data['is_calculate_based'] ) ? $data['is_calculate_based'] : '';
			$current_langu     = get_locale();
			if ( $is_calculate_base === 'order' && isset( $data[ $is_calculate_base ] ) && ! empty( $data[ $is_calculate_base ] ) && is_object( $data[ $is_calculate_base ] ) ) {
				$order_id      = self::$woocommerce_helper->isMethodExists( $data[ $is_calculate_base ], 'get_id' ) ? $data[ $is_calculate_base ]->get_id() : 0;
				$current_langu = self::$woocommerce_helper->getOrderLanguage( $order_id );
			}
			self::$woocommerce_helper->_log( 'Condition Langu:' . json_encode( $current_langu ) );
			if ( ! empty( $options->value ) && $current_langu == $options->value ) {
				return true;
			}
		}

		return false;
	}
}