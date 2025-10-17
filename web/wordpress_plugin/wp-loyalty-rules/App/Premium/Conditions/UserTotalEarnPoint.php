<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Conditions;
defined( 'ABSPATH' ) or die();

use Wlr\App\Conditions\Base;

class UserTotalEarnPoint extends Base {
	public function __construct() {
		parent::__construct();
		$this->name  = 'user_total_earn_point';
		$this->label = __( 'User Total Earn Point', 'wp-loyalty-rules' );
		$this->group = __( 'User', 'wp-loyalty-rules' );
	}

	public function isProductValid( $options, $data ) {
		return $this->check( $options, $data );
	}

	function check( $options, $data ) {
		$status = false;
		if ( isset( $options->operator ) && isset( $options->value ) && isset( $data['user_email'] ) && ! empty( $data['user_email'] ) ) {
			$operator          = sanitize_text_field( $options->operator );
			$value             = $options->value;
			$base_helper       = new \Wlr\App\Helpers\Base();
			$point_user        = $base_helper->getPointUserByEmail( $data['user_email'] );
			$total_earn_point  = isset( $point_user->earn_total_point ) ? $point_user->earn_total_point : 0;
			$user_point_status = $this->doComparisionOperation( $operator, $total_earn_point, $value );
			if ( $user_point_status ) {
				$status = true;
			}
		}

		return $status;
	}
}