<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Controllers;
defined( 'ABSPATH' ) or die;

use Wlr\App\Helpers\Input;
use Wlr\App\Helpers\Woocommerce;

class Base {
	public static $input, $woocommerce, $template, $rule;

	function __construct() {
		self::$input       = empty( self::$input ) ? new Input() : self::$input;
		self::$woocommerce = empty( self::$woocommerce ) ? Woocommerce::getInstance() : self::$woocommerce;
	}

}
