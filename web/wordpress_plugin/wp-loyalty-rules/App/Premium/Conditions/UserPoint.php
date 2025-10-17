<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Conditions;
defined( 'ABSPATH' ) or die();

use Wlr\App\Conditions\Base;

class UserPoint extends Base {
	public function __construct() {
		parent::__construct();
		$this->name  = 'user_point';
		$this->label = __( 'User Point', 'wp-loyalty-rules' );
		$this->group = __( 'User', 'wp-loyalty-rules' );
	}

	public function isProductValid( $options, $data ) {
		return $this->check( $options, $data );
	}

	function check( $options, $data ) {
		$status = false;
		if ( isset( $options->operator ) && isset( $options->value ) && isset( $data['user_email'] ) && ! empty( $data['user_email'] ) ) {
			$operator    = sanitize_text_field( $options->operator );
			$value       = $options->value;
			$base_helper = new \Wlr\App\Helpers\Base();
			$user_table  = $base_helper->getPointUserByEmail( sanitize_email( $data['user_email'] ) );
			$total_point = 0;
			if ( ! empty( $user_table ) ) {
				if ( isset( $options->point_type ) && $options->point_type == 'available_point' ) {
					$total_point = isset( $user_table->points ) && $user_table->points > 0 ? $user_table->points : 0;
				} elseif ( isset( $options->point_type ) && $options->point_type == 'total_earned_point' ) {
					$total_point = isset( $user_table->earn_total_point ) && $user_table->earn_total_point > 0 ? $user_table->earn_total_point : 0;
				} elseif ( isset( $options->point_type ) && $options->point_type == 'total_used_point' ) {
					$total_point = isset( $user_table->used_total_points ) && $user_table->used_total_points > 0 ? $user_table->used_total_points : 0;
				}
			}
			$user_point_status = $this->doComparisionOperation( $operator, $total_point, $value );
			if ( $user_point_status ) {
				$status = true;
			}
		}

		return $status;
	}
}