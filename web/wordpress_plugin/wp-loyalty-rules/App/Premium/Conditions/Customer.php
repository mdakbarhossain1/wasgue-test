<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Conditions;

use Wlr\App\Conditions\Base;

defined( 'ABSPATH' ) or die();

class Customer extends Base {
	function __construct() {
		parent::__construct();
		$this->name  = 'customer';
		$this->label = __( 'WPLoyalty Customer', 'wp-loyalty-rules' );
		$this->group = __( 'Common', 'wp-loyalty-rules' );
	}

	public function isProductValid( $options, $data ) {
		return $this->check( $options, $data );
	}

	public function check( $options, $data ) {
		if ( isset( $options->value ) && isset( $options->operator ) ) {
			$user_email = isset( $data['user_email'] ) && ! empty( $data['user_email'] ) ? $data['user_email'] : '';
			$values     = array();
			foreach ( $options->value as $o_value ) {
				$values[] = $o_value->value;
			}

			return $this->doCompareInListOperation( $options->operator, $user_email, $values );
			/* $user = get_user_by('email', sanitize_email($user_email));
			 if (!empty($user)) {
				 return $this->doCompareInListOperation($options->operator, $user->ID, $values);
			 }*/
		}

		return false;
	}
}