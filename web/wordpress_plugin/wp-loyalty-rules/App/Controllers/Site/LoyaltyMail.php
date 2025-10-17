<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Controllers\Site;

use Wlr\App\Controllers\Base;
use Wlr\App\Emails\WlrBirthdayEmail;
use Wlr\App\Emails\WlrEarnPointEmail;
use Wlr\App\Emails\WlrEarnRewardEmail;
use Wlr\App\Emails\WlrExpireEmail;
use Wlr\App\Emails\WlrNewLevelEmail;
use Wlr\App\Emails\WlrPointExpireEmail;

defined( 'ABSPATH' ) or die;

class LoyaltyMail extends Base {
	public static function initNotification() {
		add_filter( 'woocommerce_email_classes', [ self::class, 'addEmailClass' ] );
		add_filter( 'woocommerce_template_directory', function ( $template_dir, $template ) {
			if ( in_array( $template, [
				'emails/wlr-earn-point.php',
				'emails/plain/wlr-earn-point.php',
				'emails/wlr-earn-reward.php',
				'emails/plain/wlr-earn-reward.php',
				'emails/wlr-expire-email.php',
				'emails/plain/wlr-expire-email.php',
				'emails/wlr-birthday-email.php',
				'emails/plain/wlr-birthday-email.php',
				'emails/wlr-new-level-email.php',
				'emails/plain/wlr-new-level-email.php',
				'emails/wlr-point-expire-email.php',
				'emails/plain/wlr-point-expire-email.php'
			] ) ) {
				return 'wployalty';
			}

			return $template_dir;
		}, 10, 2 );
	}

	public static function addEmailClass( $emails ) {
		require_once plugin_dir_path( WC_PLUGIN_FILE ) . 'includes/emails/class-wc-email.php';
		if ( class_exists( 'Wlr\App\Emails\WlrEarnPointEmail' ) ) {
			$emails['WlrEarnPointEmail'] = new WlrEarnPointEmail();
		}
		if ( class_exists( 'Wlr\App\Emails\WlrEarnRewardEmail' ) ) {
			$emails['WlrEarnRewardEmail'] = new WlrEarnRewardEmail();
		}
		if ( class_exists( 'Wlr\App\Emails\WlrExpireEmail' ) ) {
			$emails['WlrExpireEmail'] = new WlrExpireEmail();
		}
		if ( class_exists( 'Wlr\App\Emails\WlrBirthdayEmail' ) ) {
			$emails['WlrBirthdayEmail'] = new WlrBirthdayEmail();
		}

		if ( class_exists( 'Wlr\App\Emails\WlrNewLevelEmail' ) ) {
			$emails['WlrNewLevelEmail'] = new WlrNewLevelEmail();
		}

		if ( class_exists( 'Wlr\App\Emails\WlrPointExpireEmail' ) ) {
			$emails['WlrPointExpireEmail'] = new WlrPointExpireEmail();
		}

		return $emails;
	}
}