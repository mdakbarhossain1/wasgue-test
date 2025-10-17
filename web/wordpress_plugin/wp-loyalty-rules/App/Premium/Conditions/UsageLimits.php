<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Conditions;

use Wlr\App\Conditions\Base;
use Wlr\App\Models\EarnCampaignTransactions;

defined( 'ABSPATH' ) or die();

class UsageLimits extends Base {
	function __construct() {
		parent::__construct();
		$this->name  = 'usage_limits';
		$this->label = __( 'Campaign usage limit per customer', 'wp-loyalty-rules' );
		$this->group = __( 'Order', 'wp-loyalty-rules' );
	}

	public function check( $options, $data ) {
		$status = false;
		if ( isset( $options->value ) && $options->value > 0 ) {
			$user_email       = isset( $data['user_email'] ) && ! empty( $data['user_email'] ) ? $data['user_email'] : '';
			$campaign_id      = isset( $data['campaign'] ) && isset( $data['campaign']->id ) && ! empty( $data['campaign']->id ) ? $data['campaign']->id : 0;
			$user_rewards     = new EarnCampaignTransactions();
			$user_reward_list = $user_rewards->getCampaignTransactionByEmail( $user_email, $campaign_id );
			if ( $options->value > count( $user_reward_list ) ) {
				$status = true;
			}
		}

		return $status;
	}
}