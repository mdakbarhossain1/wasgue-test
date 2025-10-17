<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-3.0.html
 * @link        https://www.wployalty.net
 * */

use Wlr\App\Helpers\EarnCampaign;
use Wlr\App\Helpers\Settings;

defined( 'ABSPATH' ) or die;
$earn_campaign_helper = EarnCampaign::getInstance();
$woocommerce_helper   = new \Wlr\App\Helpers\Woocommerce();
$is_user_available    = ( isset( $user ) && is_object( $user ) && isset( $user->id ) && $user->id > 0 );
$theme_color          = Settings::get( 'theme_color', '#4F47EB' );
$border_color         = Settings::get( 'border_color', '#CFCFCF' );
$heading_color        = Settings::get( 'heading_color', '#1D2327' );
$background_color     = Settings::get( 'background_color', '#ffffff' );
$button_text_color    = Settings::get( 'button_text_color', '#ffffff' );
$is_right_to_left     = is_rtl();
?>
<style>
    .wlr-myaccount-page {
    <?php echo !empty($background_color) ? esc_attr("background-color:".$background_color.";") : "";?>
    }

    .wlr-myaccount-page .wlr-heading {
    <?php echo !empty($heading_color) ? esc_attr("color:" . $heading_color . " !important;") : "";?><?php echo !empty($theme_color) ? esc_attr("border-left: 3px solid " . $theme_color . " !important;") : "";?>
    }

    .wlr-myaccount-page .wlr-theme-color-apply {
    <?php echo isset($theme_color) && !empty($theme_color) ?  esc_attr("color :".$theme_color.";") : "";?>;
    }

    .wlr-myaccount-page .wlr-earning-options .wlr-card .wlr-date {
    <?php echo $is_right_to_left ? "left: 0;right:unset;": "right:0;left:unset;";?>
    }

    .wlr-myaccount-page .wlr-your-reward .wlr-reward-type-name {
    <?php echo $is_right_to_left ? "float: left;border-radius: 8px 0 2px 0;": "float:right;";?>
    }

    .wlr-myaccount-page .wlr-progress-bar .wlr-progress-level {
        background-color: <?php echo esc_attr($theme_color);?>;
    }

    .wlr-myaccount-page .wlr-text-color {
        color: <?php echo esc_attr($heading_color);?>
    }

    .wlr-myaccount-page .wlr-border-color {
        border-color: <?php echo esc_attr($border_color);?>;
    }

    .wlr-myaccount-page .wlr-button-text-color {
        color: <?php echo esc_attr($button_text_color);?>
    }

    .wlr-myaccount-page table:not( .has-background ) th {
        background-color: <?php echo esc_attr($theme_color."30");?>;
    }

    .wlr-myaccount-page table thead {
        outline: solid 1px<?php echo esc_attr($border_color);?>
    }

    .alertify .ajs-ok {
        color: <?php echo esc_attr($button_text_color);?>;
        background: <?php echo esc_attr($theme_color);?>;
    }

    .alertify .ajs-cancel {
        border: <?php echo esc_attr("1px solid ".$theme_color);?>;
        color: <?php echo esc_attr($theme_color);?>;
        background: unset;
    }

    .wlr-myaccount-page .wlr-my-rewards-title.active {
        border-bottom: 3px solid<?php echo esc_attr($theme_color);?>;
    }

    .wlr-myaccount-page .wlr-my-rewards-title.active h4,
    .wlr-myaccount-page .wlr-my-rewards-title.active i {
        color: <?php echo esc_attr($theme_color);?>;
    }

    .wlr-myaccount-page .wlr-coupons-expired-content .wlr-card-icon-container i {
        color: <?php echo esc_attr($heading_color);?>;
    }

    .wlr-myaccount-page .wlr-user-reward-titles {
        border-bottom: 0.5px solid<?php echo esc_attr($border_color);?>;
    }

    .wlr-myaccount-page .wlr-out-of-stock {
        background: #ceced1;
        cursor: not-allowed;
    }

    .ajs-dialog .ajs-ok {
        border-radius: 6px;
    }

    .ajs-dialog .ajs-cancel {
        border-radius: 6px;
    }
</style>
<div class="wlr-myaccount-page <?php echo esc_attr( ! empty( $page_type ) ? 'wlr-page-' . $page_type : '' ); ?>">
	<?php do_action( 'wlr_before_customer_reward_cart_page_content' ); ?>
	<?php if ( $is_user_available || get_current_user_id() ): ?>
        <div class="wlr-user-details">
            <div class="wlr-heading-container">
                <h3 class="wlr-heading"><?php /* translators: %s: label */
					echo esc_html( sprintf( __( 'My %s', 'wp-loyalty-rules' ), $earn_campaign_helper->getPointLabel( 3 ) ) ); ?></h3>
            </div>
            <div class="wlr-points-container">
				<?php do_action( 'wlr_before_customer_reward_page_my_points_content' ); ?>
                <div id="<?php echo esc_attr( WLR_PLUGIN_PREFIX . '-points' ) ?>">
                    <div id="<?php echo esc_attr( WLR_PLUGIN_PREFIX . '-available-points' ); ?>"
                         class="wlr-border-color">
                        <div>
							<?php echo wp_kses_post( \Wlr\App\Helpers\Base::setImageIcon( Settings::get( 'available_point_icon' ), "available-points", [
								"alt"    => esc_html__( "Available point", "wp-loyalty-rules" ),
								"height" => 64,
								"width"  => 64
							] ) ); ?>
                        </div>
                        <div>
							<?php $user_points = (int) ( ! empty( $user ) && ! empty( $user->points ) ? $user->points : 0 ); ?>
                            <span id="<?php echo esc_attr( WLR_PLUGIN_PREFIX . '-available-points-heading' ); ?>"
                                  class="wlr-text-color">
        <?php /* translators: %s: label */
        echo esc_html( sprintf( __( 'Available %s', 'wp-loyalty-rules' ), $earn_campaign_helper->getPointLabel( $user_points ) ) ) ?></span>
                            <div id="<?php echo esc_attr( WLR_PLUGIN_PREFIX . '-available-point-value' ) ?>"
                                 class="wlr-text-color">
								<?php echo esc_html( $user_points ); ?>
                            </div>
							<?php if ( ! empty( $user->earn_total_point ) ): ?>
                                <div class="wlr-text-color">
                                    <p> <?php /* translators: 1: point label 2: total points */
										echo esc_html( sprintf( __( 'Total %1$s earned: %2$s', 'wp-loyalty-rules' ), $earn_campaign_helper->getPointLabel( $user->earn_total_point ), $user->earn_total_point ) ); ?></p>
                                </div>
							<?php endif; ?>
                        </div>
                    </div>
                    <div id="<?php echo esc_attr( WLR_PLUGIN_PREFIX . '-redeemed-points' ) ?>" class="wlr-border-color">
                        <div>
							<?php echo wp_kses_post( \Wlr\App\Helpers\Base::setImageIcon( Settings::get( 'redeem_point_icon' ), "redeem-points", [
								"alt"    => esc_html__( "Redeem point", "wp-loyalty-rules" ),
								"height" => 64,
								"width"  => 64
							] ) ); ?>
                        </div>
                        <div>
							<?php $user_total_points = (int) ( ! empty( $user ) && ! empty( $user->used_total_points ) ? $user->used_total_points : 0 ); ?>
                            <span id="<?php echo esc_attr( WLR_PLUGIN_PREFIX . '-redeemed-points-heading' ) ?>"
                                  class="wlr-text-color">
        <?php /* translators: %s: point label */
        echo esc_html( sprintf( __( 'Redeemed %s', 'wp-loyalty-rules' ), $earn_campaign_helper->getPointLabel( $user_total_points ) ) ) ?></span>
                            <div id="<?php echo esc_attr( WLR_PLUGIN_PREFIX . '-redeemed-point-value' ) ?>"
                                 class="wlr-text-color">
								<?php echo esc_html( $user_total_points ); ?>
                            </div>
							<?php if ( ! empty( $user ) && ! empty( $user->total_coupon_count ) ): ?>
                                <div class="wlr-text-color">
                                    <p> <?php /* translators: 1: point label 2: total count */
										echo esc_html( sprintf( __( '%1$s to Coupons : %2$s ', 'wp-loyalty-rules' ), ucfirst( $earn_campaign_helper->getPointLabel( 3 ) ), $user->total_coupon_count ) ); ?></p>
                                </div>
							<?php endif; ?>
                        </div>
                    </div>
                    <div id="<?php echo esc_attr( WLR_PLUGIN_PREFIX . '-used-rewards' ); ?>" class="wlr-border-color">
                        <div style="display: flex;justify-content: space-between;align-items:center;">
                            <div>
								<?php echo wp_kses_post( \Wlr\App\Helpers\Base::setImageIcon( Settings::get( 'used_reward_icon' ), "used-rewards", [
									"alt"    => esc_html__( "User used rewards", "wp-loyalty-rules" ),
									"height" => 64,
									"width"  => 64
								] ) ); ?>
                            </div>
                            <div>
								<?php if ( ! empty( $used_reward_currency_values ) && isset( $current_currency_list ) && isset( $used_reward_currency_value_count ) ) : ?>
                                    <select id="wlr_currency_list" class="wlr-border-color wlr-text-color"
                                            data-user-used-reward='<?php echo json_encode( $used_reward_currency_values ); ?>'
                                            data-user-used-reward-count='<?php echo json_encode( $used_reward_currency_value_count ); ?>'
                                            onchange="wlr_jquery( 'body' ).trigger( 'wlr_get_used_reward')">
										<?php foreach ( $current_currency_list as $currency_key => $currency_label ): ?>
                                            <option value="<?php echo esc_attr( $currency_key ); ?>"
												<?php echo ( ! empty( $current_currency ) && ( $currency_key === $current_currency ) ) ? "selected" : ""; ?>><?php echo esc_html( $currency_key ); ?></option>
										<?php endforeach; ?>
                                    </select>
								<?php endif; ?>
                            </div>
                        </div>
                        <div>
                            <span id="<?php echo esc_attr( WLR_PLUGIN_PREFIX . '-used-rewards-heading' ); ?>"
                                  class="wlr-text-color">
        <?php echo /* translators: %s: reward label */
        esc_html( sprintf( __( 'Used %s', 'wp-loyalty-rules' ), $earn_campaign_helper->getRewardLabel() ) ) ?></span>
                            <div id="<?php echo esc_attr( WLR_PLUGIN_PREFIX . '-used-reward-value-count' ) ?>"
                                 class="wlr-text-color">
								<?php echo esc_html( ! empty( $used_reward_currency_value_count ) && ! empty( $current_currency ) ? $used_reward_currency_value_count[ $current_currency ] : 0 ) ?>
                            </div>
							<?php if ( ! empty( $user ) && ! empty( $used_reward_currency_values ) && isset( $current_currency ) ): ?>
                                <div class="wlr-text-color">
                                    <p id="<?php echo esc_attr( WLR_PLUGIN_PREFIX . '-used-reward-value' ) ?>">
										<?php echo wp_kses_post( $used_reward_currency_values[ $current_currency ] ); ?>
                                    </p>
                                </div>
							<?php endif; ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
	<?php endif; ?>
	<?php do_action( 'wlr_before_customer_reward_cart_page_user_rewards_content' ); ?>
    <!--    customer rewards start here -->
	<?php echo $my_reward_section;//phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
    <!--    customer rewards end here -->
	<?php do_action( 'wlr_after_customer_reward_cart_page_content' ); ?>
</div>