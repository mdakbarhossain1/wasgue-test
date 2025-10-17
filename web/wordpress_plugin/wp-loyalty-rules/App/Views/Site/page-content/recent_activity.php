<?php
defined( 'ABSPATH' ) or die;
$earn_campaign_helper = \Wlr\App\Helpers\EarnCampaign::getInstance();
?>
<?php if ( ! empty( $recent_activity_content ) ): ?>
    <div class="wlr-transaction-blog"
         id="<?php echo esc_attr( WLR_PLUGIN_PREFIX . '-transaction-details-table' ) ?>">
        <div class="wlr-heading-container">
            <h3 class="wlr-heading"><?php echo esc_html__( 'Recent Activities', 'wp-loyalty-rules' ); ?></h3>
        </div>
        <div id="<?php echo esc_attr( WLR_PLUGIN_PREFIX . '-transaction-table' ) ?>">
            <table class="wlr-table">
                <thead id="<?php echo esc_attr( WLR_PLUGIN_PREFIX . '-transaction-table-header' ) ?>"
                       class="wlr-table-header"
                >
                <tr>
                    <th class="set-center wlr-text-color"><?php echo esc_html__( 'Order No.', 'wp-loyalty-rules' ) ?></th>
                    <th class="wlr-text-color"><?php echo esc_html__( 'Action Type', 'wp-loyalty-rules' ) ?></th>
                    <th class="wlr-text-color"><?php echo esc_html__( 'Message', 'wp-loyalty-rules' ) ?></th>
                    <th class="set-center wlr-text-color"><?php echo esc_html( $earn_campaign_helper->getPointLabel( 3 ) ); ?></th>
                    <th class="wlr-text-color"><?php echo esc_html( $earn_campaign_helper->getRewardLabel( 3 ) ) ?></th>
                </tr>
                </thead>
                <tbody class="wlr-transaction-container">
				<?php echo $recent_activity_content;//phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
                </tbody>
            </table>
        </div>
    </div>
<?php endif; ?>
