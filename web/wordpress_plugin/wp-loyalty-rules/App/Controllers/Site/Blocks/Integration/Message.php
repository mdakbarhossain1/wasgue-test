<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Controllers\Site\Blocks\Integration;


use Automattic\WooCommerce\Blocks\Integrations\IntegrationInterface;
use Automattic\WooCommerce\StoreApi\Schemas\ExtendSchema;
use Automattic\WooCommerce\StoreApi\Schemas\V1\CartSchema;
use Automattic\WooCommerce\StoreApi\StoreApi;
use Wlr\App\Helpers\EarnCampaign;
use Wlr\App\Helpers\Rewards;
use Wlr\App\Helpers\Woocommerce;

defined( 'ABSPATH' ) or die;

class Message implements IntegrationInterface {
	/**
	 * The name of the integration.
	 *
	 * @return string
	 */
	public function get_name() {
		return WLR_TEXT_DOMAIN . '-message';
	}

	/**
	 * Get handler name.
	 *
	 * @param string $handler handler name.
	 *
	 * @return string
	 */
	protected function getHandlerName( $handler = '' ) {
		return trim( WLR_TEXT_DOMAIN . '-message-' . $handler, '-' );
	}

	/**
	 * When called invokes any initialization/setup for the integration.
	 */
	public function initialize() {
		$script_asset_path = WLR_PLUGIN_PATH . 'blocks/build/index.asset.php';
		$script_asset      = file_exists( $script_asset_path )
			? require $script_asset_path
			: [
				'dependencies' => [],
				'version'      => WLR_PLUGIN_VERSION,
			];
		// $script_asset['dependencies'][] = WLR_PLUGIN_SLUG . '-main-front';
		wp_register_script( $this->getHandlerName(),
			WLR_PLUGIN_URL . 'blocks/build/index.js',
			$script_asset['dependencies'],
			$script_asset['version'],
			true );

		$extend = StoreApi::container()->get( ExtendSchema::class );
		$extend->register_endpoint_data(
			[
				'endpoint'        => CartSchema::IDENTIFIER,
				'namespace'       => str_replace( '-', '_', $this->get_name() ),
				'data_callback'   => [ $this, 'extendData' ],
				'schema_callback' => [ $this, 'extendDataSchema' ],
				'schema_type'     => ARRAY_A,
			]
		);
		do_action( 'wlr_register_endpoint_data', $extend );
	}

	/**
	 * Extend message data.
	 *
	 * @return array
	 */
	public function extendData() {
		$message_data  = [
			'checkout_earning_message'   => '',
			'cart_earning_message'       => '',
			'checkout_redeeming_message' => '',
			'cart_redeeming_message'     => ''
		];
		$earn_campaign = EarnCampaign::getInstance();

		$message = self::getEarnMessage();
		if ( ! empty( $message ) && $earn_campaign->isAllowEarningWhenCoupon() ) {
			$message_data['cart_earning_message'] = self::getEarnMessageDesign( $message );
		}
		$cart_redeem_message = self::getRedeemMessage();

		if ( ! empty( $cart_redeem_message ) ) {
			$message_data['cart_redeeming_message'] = self::getRedeemMessageDesign( $cart_redeem_message );
		}

		$checkout_message = self::getEarnMessage( true );
		if ( ! empty( $checkout_message ) && $earn_campaign->isAllowEarningWhenCoupon() ) {
			$message_data['checkout_earning_message'] = self::getEarnMessageDesign( $checkout_message );
		}

		$checkout_redeem_message = self::getRedeemMessage( true );
		if ( ! empty( $checkout_redeem_message ) ) {
			$message_data['checkout_redeeming_message'] = self::getRedeemMessageDesign( $checkout_redeem_message );
		}

		return $message_data;
	}

	/**
	 * Get a redeem message.
	 *
	 * @param bool $is_checkout Is checkout
	 *
	 * @return string
	 */
	protected static function getRedeemMessage( $is_checkout = false ) {
		$woocommerce_helper = Woocommerce::getInstance();
		$setting_option     = $woocommerce_helper->getOptions( 'wlr_settings', [] );
		$message            = '';
		if ( $is_checkout ) {
			$checkout_redeem_point_display = ( ! empty( $setting_option['wlr_is_checkout_redeem_message_enable'] ) ? $setting_option['wlr_is_checkout_redeem_message_enable'] : 'yes' ) == 'yes';
			if ( $checkout_redeem_point_display ) {
				// phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText
				$message = ( ! empty( $setting_option['wlr_checkout_redeem_points_message'] ) ) ? __( $setting_option['wlr_checkout_redeem_points_message'], 'wp-loyalty-rules' ) : __( 'You have {wlr_redeem_cart_points} {wlr_points_label} earned choose your rewards {wlr_reward_link}', 'wp-loyalty-rules' );
			}
		} else {
			$cart_redeem_point_display = ( ! empty( $setting_option['wlr_is_cart_redeem_message_enable'] ) ? $setting_option['wlr_is_cart_redeem_message_enable'] : 'yes' ) == 'yes';
			if ( $cart_redeem_point_display ) {
				// phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText
				$message = ( ! empty( $setting_option['wlr_cart_redeem_points_message'] ) ) ? __( $setting_option['wlr_cart_redeem_points_message'], 'wp-loyalty-rules' ) : __( 'You have {wlr_redeem_cart_points} {wlr_points_label} earned choose your rewards {wlr_reward_link}', 'wp-loyalty-rules' );
			}
		}

		if ( empty( $message ) ) {
			return '';
		}


		$user_email = $woocommerce_helper->get_login_user_email();
		if ( empty( $user_email ) ) {
			return '';
		}

		$extra         = [
			'user_email'         => $user_email,
			'cart'               => WC()->cart,
			'is_calculate_based' => 'cart',
			'allowed_condition'  => [ 'user_role', 'customer', 'user_point', 'currency', 'language' ]
		];
		$reward_helper = Rewards::getInstance();
		$points        = $reward_helper->getUserPoint( $user_email );
		$user_reward   = $reward_helper->getUserRewards( $user_email, $extra );
		$point_rewards = $reward_helper->getPointRewards( $user_email, $extra );
		$reward_list   = array_merge( $user_reward, $point_rewards );
		if ( count( $reward_list ) <= 0 && $points <= 0 ) {
			return '';
		}
		$short_code_list = [
			'{wlr_points}'             => $points > 0 ? $woocommerce_helper->numberFormatI18n( $points ) : '',
			'{wlr_redeem_cart_points}' => $points > 0 ? $woocommerce_helper->numberFormatI18n( $points ) : '',
			'{wlr_points_label}'       => $reward_helper->getPointLabel( $points ),
			'{wlr_reward_label}'       => $reward_helper->getRewardLabel( count( $reward_list ) ),
			'{wlr_reward_link}'        => '<a id="wlr-reward-link" href="javascript:void(0);">' . __( 'Click Here', 'wp-loyalty-rules' ) . '</a>'
		];
		$message         = apply_filters( 'wlr_point_redeem_points_message', $message );

		return $reward_helper->processShortCodes( $short_code_list, $message );
	}

	/**
	 * Get redeem message design.
	 *
	 * @param string $message Message.
	 *
	 * @return string
	 */
	protected static function getRedeemMessageDesign( $message ) {
		if ( empty( $message ) ) {
			return '';
		}
		$woocommerce_helper    = Woocommerce::getInstance();
		$setting_option        = $woocommerce_helper->getOptions( 'wlr_settings', [] );
		$cart_text_color       = ( ! empty( $setting_option['redeem_cart_text_color'] ) ) ? $setting_option['redeem_cart_text_color'] : '#9CC21D';
		$cart_border_color     = ( ! empty( $setting_option['redeem_cart_border_color'] ) ) ? $setting_option['redeem_cart_border_color'] : '#9CC21D';
		$cart_background_color = ( ! empty( $setting_option['redeem_cart_background_color'] ) ) ? $setting_option['redeem_cart_background_color'] : '#ffffff';
		$message_icon          = ! empty( $setting_option['redeem_message_icon'] ) ? $setting_option['redeem_message_icon'] : '';
		$svg_file              = EarnCampaign::setImageIcon(
			$message_icon,
			'point',
			[
				'alt'   => __( 'Redeem point message', 'wp-loyalty-rules' ),
				'style' => 'color: $cart_border_color;margin: 8px 20px 8px 0; font-size: 30px;border-radius:6px;',
			]
		);
		$design_message        = '<div class="wlr-message-info wlr_point_redeem_message" style="' . esc_attr( 'margin:5px 0;padding: 5px 28px;border:1px solid ' . $cart_border_color . '; border-radius: 6px; color:' . $cart_text_color . '; background-color: ' . $cart_background_color . '; font-size: 15px;font-weight: 600; display: flex; align-items: center;' ) . '">
' . $svg_file . '<p style="margin: 0 0 0;">' . $message . '</p></div>';

		return apply_filters( 'wlr_redeem_message_after_design', $design_message, $message );
	}

	/**
	 * Get earn message design.
	 *
	 * @param string $message Message.
	 *
	 * @return string
	 */
	protected static function getEarnMessageDesign( $message ) {
		if ( empty( $message ) ) {
			return '';
		}
		$woocommerce_helper    = Woocommerce::getInstance();
		$setting_option        = $woocommerce_helper->getOptions( 'wlr_settings', [] );
		$cart_text_color       = ( ! empty( $setting_option['earn_cart_text_color'] ) ) ? $setting_option['earn_cart_text_color'] : '#9CC21D';
		$cart_border_color     = ( ! empty( $setting_option['earn_cart_border_color'] ) ) ? $setting_option['earn_cart_border_color'] : '#9CC21D';
		$cart_background_color = ( ! empty( $setting_option['earn_cart_background_color'] ) ) ? $setting_option['earn_cart_background_color'] : '#ffffff';
		$message_icon          = ! empty( $setting_option['earn_message_icon'] ) ? $setting_option['earn_message_icon'] : '';
		$svg_file              = EarnCampaign::setImageIcon(
			$message_icon,
			'point',
			[
				'alt'   => __( 'Earn point message', 'wp-loyalty-rules' ),
				'style' => 'color: $cart_border_color;margin: 8px 20px 8px 0; font-size: 30px;border-radius:6px;',
			]
		);
		$design_message        = '<div class="wlr-message-info wlr_block_points_rewards_earn_points" style="' . esc_attr( 'margin:5px 0;padding: 5px 28px;border:1px solid ' . $cart_border_color . '; border-radius: 6px; color:' . $cart_text_color . '; background-color: ' . $cart_background_color . '; font-size: 15px;font-weight: 600; display: flex; align-items: center;' ) . '">
' . $svg_file . '<p style="margin:0 0 0;">' . $message . '</p>' . '</div>';

		return apply_filters( 'wlr_earn_message_after_design', $design_message, $message );
	}

	/**
	 * Get earn message.
	 *
	 * @param bool $is_checkout Is checkout.
	 *
	 * @return string|null
	 */
	protected static function getEarnMessage( $is_checkout = false ) {
		$woocommerce_helper = Woocommerce::getInstance();
		$setting_option     = $woocommerce_helper->getOptions( 'wlr_settings', [] );
		$message            = '';
		if ( $is_checkout ) {
			$checkout_earn_point_display = ( ! empty( $setting_option['wlr_is_checkout_earn_message_enable'] ) ? $setting_option['wlr_is_checkout_earn_message_enable'] : 'yes' ) == 'yes';
			if ( $checkout_earn_point_display ) {
				// phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText
				$message = ( ! empty( $setting_option['wlr_checkout_earn_points_message'] ) ) ? __( $setting_option['wlr_checkout_earn_points_message'], 'wp-loyalty-rules' ) : __( 'Complete your order and earn {wlr_cart_points} {wlr_points_label} for a discount on a future purchase', 'wp-loyalty-rules' );
			}
		} else {
			$cart_earn_point_display = ( ! empty( $setting_option['wlr_is_cart_earn_message_enable'] ) ? $setting_option['wlr_is_cart_earn_message_enable'] : 'yes' ) == 'yes';
			if ( $cart_earn_point_display ) {
				// phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText
				$message = ( ! empty( $setting_option['wlr_cart_earn_points_message'] ) ) ? __( $setting_option['wlr_cart_earn_points_message'], 'wp-loyalty-rules' ) : __( 'Complete your order and earn {wlr_cart_points} {wlr_points_label} for a discount on a future purchase', 'wp-loyalty-rules' );
			}
		}
		if ( empty( $message ) ) {
			return $message;
		}
		$earn_campaign = EarnCampaign::getInstance();

		$user_email        = $woocommerce_helper->get_login_user_email();
		$extra             = [
			'user_email'         => $user_email,
			'cart'               => WC()->cart,
			'is_calculate_based' => 'cart',
			'is_cart_message'    => true
		];
		$cart_action_list  = $earn_campaign->getCartActionList();
		$reward_list       = $earn_campaign->getActionEarning( $cart_action_list, $extra );
		$point             = $earn_campaign->addPointValue( $reward_list );
		$available_rewards = $earn_campaign->concatRewards( $reward_list );
		if ( empty( $point ) && empty( $available_rewards ) ) {
			return '';
		}
		$reward_count = 0;
		if ( ! empty( $available_rewards ) ) {
			$reward_count = count( explode( ',', $available_rewards ) );
		}
		$point           = $earn_campaign->roundPoints( $point );
		$short_code_list = [
			'{wlr_points}'               => $point > 0 ? $woocommerce_helper->numberFormatI18n( $point ) : '',
			'{wlr_cart_point_or_reward}' => $earn_campaign->getPointOrRewardText( $point, $available_rewards ),
			'{wlr_cart_points}'          => $point > 0 ? $woocommerce_helper->numberFormatI18n( $point ) : '',
			'{wlr_points_label}'         => $earn_campaign->getPointLabel( $point ),
			'{wlr_reward_label}'         => $earn_campaign->getRewardLabel( $reward_count ),
			'{wlr_rewards}'              => $available_rewards,
			'{wlr_cart_rewards}'         => $available_rewards,
		];
		$message         = $earn_campaign->processShortCodes( $short_code_list, $message );
		$message         = apply_filters( 'wlr_points_rewards_earn_points_message', $message, $short_code_list );

		return Woocommerce::getCleanHtml( $message );
	}

	/**
	 * Extend data schema.
	 *
	 * @return array
	 */
	public function extendDataSchema() {
		return [
			'properties' => [
				'checkout_earning_message'   => [
					'description' => __( 'Checkout earning message', 'wp-loyalty-rules' ),
					'type'        => 'string',
					'readonly'    => true,
				],
				'cart_earning_message'       => [
					'description' => __( 'Cart earning message', 'wp-loyalty-rules' ),
					'type'        => 'string',
					'readonly'    => true,
				],
				'checkout_redeeming_message' => [
					'description' => __( 'Checkout redeeming message', 'wp-loyalty-rules' ),
					'type'        => 'string',
					'readonly'    => true,
				],
				'cart_redeeming_message'     => [
					'description' => __( 'Cart redeeming message', 'wp-loyalty-rules' ),
					'type'        => 'string',
					'readonly'    => true,
				]
			]
		];
	}

	/**
	 * Returns an array of script handles to enqueue in the frontend context.
	 *
	 * @return string[]
	 */
	public function get_script_handles() {
		return [ $this->getHandlerName() ];
	}

	/**
	 * Returns an array of script handles to enqueue in the editor context.
	 *
	 * @return string[]
	 */
	public function get_editor_script_handles() {
		return [];
	}

	/**
	 * An array of key, value pairs of data made available to the block on the client side.
	 *
	 * @return array
	 */
	public function get_script_data() {
		$woocommerce = Woocommerce::getInstance();
		$settings    = $woocommerce->getOptions( 'wlr_settings', [] );

		//order_meta,shipping,coupon
		return apply_filters( 'wlr_block_checkout_script_data', [
			'earn_display_position'   => ! empty( $settings['wlr_cart_earn_point_display'] ) ? $settings['wlr_cart_earn_point_display'] : 'before',
			'redeem_display_position' => ! empty( $settings['wlr_cart_redeem_point_display'] ) ? $settings['wlr_cart_redeem_point_display'] : 'before',
		] );
	}
}