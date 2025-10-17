<?php

use Wlr\App\Helpers\EarnCampaign;

defined( 'ABSPATH' ) or die;
$earn_campaign_helper = EarnCampaign::getInstance();
?>
<?php if ( ! empty( $is_display_my_reward ) ) : ?>
    <div class="wlr-your-reward" id="wlr-your-reward">
        <div class="wlr-heading-container"><h3
                    class="wlr-heading"><?php /* translators: %s: label */
				echo esc_html( sprintf( __( 'My %s', 'wp-loyalty-rules' ), $earn_campaign_helper->getRewardLabel( 3 ) ) ); ?></h3>
        </div>
        <div class="wlr-my-rewards-sections" id="wlr-my-rewards-sections">
            <div class="wlr-user-reward-titles">
                <div
                        class="wlr-my-rewards-title wlr-rewards-title <?php echo ( isset( $active_reward_tab ) && $active_reward_tab == 'rewards' ) ? 'active' : ''; ?>"
                        onclick="wlr_jquery( 'body' ).trigger( 'wlr_my_reward_section_tab',[ 'rewards','<?php echo esc_js( $endpoint_url ); ?>'])"
                        data-reward-type="rewards">
                    <i class="wlrf-rewards wlr-text-color"></i>
                    <h4 class="wlr-text-color"><?php echo esc_html( ucfirst( $earn_campaign_helper->getRewardLabel() ) ); ?></h4>
                </div>
                <div
                        class="wlr-my-rewards-title wlr-coupons-title <?php echo ( isset( $active_reward_tab ) && $active_reward_tab == 'coupons' ) ? 'active' : ''; ?>"
                        onclick="wlr_jquery( 'body' ).trigger( 'wlr_my_reward_section_tab',[ 'coupons','<?php echo esc_js( $endpoint_url ); ?>'])"
                        data-reward-type="coupons">
                    <i class="wlrf-reward-show wlr-text-color"></i>
                    <h4 class="wlr-text-color"><?php echo esc_html__( 'Coupons', 'wp-loyalty-rules' ); ?></h4>
                </div>
				<?php if ( ! empty( $page_type ) && $page_type != 'cart' ): ?>
                    <div
                            class="wlr-my-rewards-title wlr-coupons-expired-title <?php echo ( isset( $active_reward_tab ) && $active_reward_tab == 'coupons-expired' ) ? 'active' : ''; ?>"
                            onclick="wlr_jquery( 'body' ).trigger( 'wlr_my_reward_section_tab',[ 'coupons-expired','<?php echo esc_js( $endpoint_url ); ?>'])"
                            data-reward-type="coupons-expired">
                        <i class="wlrf-clock wlr-text-color"></i>
                        <h4 class="wlr-text-color"><?php echo esc_html__( 'Used & Expired Coupons', 'wp-loyalty-rules' ); ?></h4>
                    </div>
				<?php endif; ?>
            </div>
            <div class="wlr-user-reward-contents">
                <div class="wlr-rewards-container <?php echo ( isset( $active_reward_tab ) && $active_reward_tab == 'rewards' ) ? 'active' : ''; ?>">
					<?php echo ! empty( $rewards_content ) ? $rewards_content : '';//phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped  ?>
                </div>
                <div class="wlr-coupons-container <?php echo ( isset( $active_reward_tab ) && $active_reward_tab == 'coupons' ) ? 'active' : ''; ?>">
					<?php echo ! empty( $coupon_content ) ? $coupon_content : '';//phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped  ?>
                </div>
				<?php if ( ! empty( $page_type ) && $page_type != 'cart' ): ?>
                    <div class="wlr-coupons-expired-container <?php echo ( isset( $active_reward_tab ) && $active_reward_tab == 'coupons-expired' ) ? 'active' : ''; ?>">
						<?php echo ( ! empty( $expire_coupon_content ) ) ? $expire_coupon_content : '';//phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped  ?>
                    </div>
				<?php endif; ?>
            </div>
        </div>
    </div>
<?php endif; ?>
