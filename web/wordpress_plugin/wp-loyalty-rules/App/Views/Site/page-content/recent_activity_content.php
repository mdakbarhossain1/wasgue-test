<?php
defined( 'ABSPATH' ) or die;
$earn_campaign_helper = \Wlr\App\Helpers\EarnCampaign::getInstance();
?>
<?php if ( ! empty( $items ) ): ?>
	<?php foreach ( $items as $transaction ): ?>
        <tr>
            <td class="<?php echo esc_attr( WLR_PLUGIN_PREFIX . '-transaction-table-body set-center wlr-text-color wlr-border-color' ) ?> ">
				<?php if ( ! empty( $transaction->order_id ) && $transaction->order_id > 0 ):
					$order = wc_get_order( $transaction->order_id );
					if ( isset( $order ) && is_object( $order ) && method_exists( $order, 'get_view_order_url' ) ): ?>
						<?php if ( $transaction->action_type != 'referral' ): ?>
                            <a class="wlr-theme-color-apply wlr-nowrap"
                               href="<?php echo esc_url( $order->get_view_order_url() ); ?>">
								<?php echo esc_html( '#' . $order->get_order_number() ); ?>
                            </a>
						<?php else: ?>
							<?php echo esc_html( '#' . $order->get_order_number() ); ?>
						<?php endif; ?>
					<?php else: ?>
						<?php echo esc_html( '#' . $transaction->order_id ); ?>
					<?php endif; ?>
				<?php else: ?>
                    -
				<?php endif; ?>
            </td>
            <td class="<?php echo esc_attr( WLR_PLUGIN_PREFIX . '-transaction-table-body wlr-text-color wlr-border-color' ) ?>"><?php echo esc_html( $earn_campaign_helper->getActionName( $transaction->action_type ) ); ?></td>
            <td class="<?php echo esc_attr( WLR_PLUGIN_PREFIX . '-transaction-table-body wlr-text-color wlr-border-color' ) ?>">
				<?php echo ! empty( $transaction->processed_custom_note ) ? wp_kses_post( $transaction->processed_custom_note ) : wp_kses_post( $transaction->customer_note );
				?></td>
            <td class="<?php echo esc_attr( WLR_PLUGIN_PREFIX . '-transaction-table-body set-center wlr-text-color wlr-border-color' ) ?> ">
				<?php echo ( $transaction->points == 0 ) ? "-" : (int) $transaction->points; ?>
            </td>
            <td class="<?php echo esc_attr( WLR_PLUGIN_PREFIX . '-transaction-table-body wlr-text-color wlr-border-color' ) ?>"><?php echo esc_html( ! empty( $transaction->reward_display_name ) ? /* phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText */ __( $transaction->reward_display_name, "wp-loyalty-rules" ) : '-' ); ?></td>
        </tr>
	<?php endforeach; ?>
    <tr>
        <td colspan="5">
			<?php if ( isset( $total ) && $total > 0 ): ?>
                <div style="text-align: right">
					<?php if ( isset( $offset ) && 1 !== (int) $offset ) : ?>
                        <a class="woocommerce-button woocommerce-button--previous woocommerce-Button wlr-cursor wlr-text-color"
                           onclick="wlr_jquery( 'body' ).trigger( 'wlr_my_reward_section_pagination', [ 'transaction','<?php echo esc_js( $offset - 1 ); ?>','<?php echo esc_js( $page_type ) ?>'] )"
                           id="<?php echo esc_attr( WLR_PLUGIN_PREFIX . '-prev-button' ) ?>">
							<?php esc_html_e( 'Prev', 'wp-loyalty-rules' ); ?>
                        </a>
					<?php endif; ?>
					<?php if ( isset( $offset ) && isset( $current_count ) && intval( $current_count ) < $total ) : ?>
                        <a class="woocommerce-button woocommerce-button--next woocommerce-Button  wlr-cursor wlr-text-color"
                           id="<?php echo esc_attr( WLR_PLUGIN_PREFIX . '-next-button' ) ?>"
                           onclick="wlr_jquery( 'body' ).trigger( 'wlr_my_reward_section_pagination', [ 'transaction','<?php echo esc_js( $offset + 1 ); ?>','<?php echo esc_js( $page_type ) ?>'] )">
							<?php esc_html_e( 'Next', 'wp-loyalty-rules' ); ?>
                        </a>
					<?php endif; ?>
                </div>
			<?php endif; ?>
        </td>
    </tr>
<?php endif; ?>