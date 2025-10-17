<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Conditions;
defined( 'ABSPATH' ) or die();

use Wlr\App\Conditions\Base;
use Wlr\App\Models\Levels;

class UserLevel extends Base {
	public function __construct() {
		parent::__construct();
		$this->name  = 'user_level';
		$this->label = __( 'Customer Level', 'wp-loyalty-rules' );
		$this->group = __( 'Level', 'wp-loyalty-rules' );
	}

	public function isProductValid( $options, $data ) {
		return $this->check( $options, $data );
	}

	function check( $options, $data ) {
		$status      = false;
		$level_model = new Levels();
		// case 1: WPL user - yes, wp user
		// case 2: No WPL user, WP User -yes
		// case 3: WPL user, NO WP user
		// case 4: NO WPL user, NO WP user
		if ( isset( $options->value ) && isset( $data['user_email'] ) && ! empty( $data['user_email'] ) ) {
			$value       = $options->value;
			$base_helper = new \Wlr\App\Helpers\Base();
			$user        = $base_helper->getPointUserByEmail( $data['user_email'] );
			$level_id    = isset( $user->level_id ) && ! empty( $user->level_id ) ? $user->level_id : 0;
			if ( $level_id <= 0 ) {
				$points   = (int) ( isset( $user->points ) && $user->points > 0 ? $user->points : 0 );
				$level_id = $level_model->getCurrentLevelId( $points );
			}
			$status = in_array( $level_id, $value );
		} elseif ( isset( $options->value ) && isset( $data['user_email'] ) && empty( $data['user_email'] ) ) {
			$level_id = $level_model->getCurrentLevelId( 0 );
			$status   = in_array( $level_id, $options->value );
		}

		return apply_filters( 'wlr_user_level_conditions', $status, $options, $data );
	}
}