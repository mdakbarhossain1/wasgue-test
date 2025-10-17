<?php

use Wlr\App\Helpers\Settings;

defined( "ABSPATH" ) or die();
$earn_campaign_helper = \Wlr\App\Helpers\EarnCampaign::getInstance();
$woocommerce_helper   = \Wlr\App\Helpers\Woocommerce::getInstance();
?>
<div class="wlr-coupons-list">
	<?php if ( ! empty( $items ) ): ?>
		<?php
		$theme_color                    = Settings::get( 'theme_color', '#4F47EB' );
		$apply_coupon_border_color      = Settings::get( 'apply_coupon_border_color', '#FF8E3D' );
		$coupon_border                  = $apply_coupon_border_color ? "border:1px dashed " . $apply_coupon_border_color . ";" : "";
		$apply_coupon_background        = Settings::get( 'apply_coupon_background', '#FFF8F3' );
		$coupon_background              = $apply_coupon_background ? "background:" . $apply_coupon_background . ";" : "";
		$apply_coupon_button_color      = Settings::get( 'apply_coupon_button_color', '#4F47EB' );
		$button_color                   = $apply_coupon_button_color ? "background:" . $apply_coupon_button_color . ";" : "background:" . $theme_color . ";";
		$apply_coupon_button_text_color = Settings::get( 'apply_coupon_button_text_color', '#ffffff' );
		$button_text_color              = $apply_coupon_button_text_color ? "color:" . $apply_coupon_button_text_color . ";" : "";
		$css_class_name                 = 'wlr-button-reward-apply wlr-button wlr-button-action';
		$button_text                    = __( Settings::get( 'apply_coupon_button_text', 'Apply Coupon' ), 'wp-loyalty-rules' );//phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText
		$card_key                       = 1;
		foreach ( $items as $item ):?>
			<?php
			/* translators: %s: point label */
			$revert_button   = sprintf( __( 'Revert to %s', 'wp-loyalty-rules' ), $earn_campaign_helper->getPointLabel( 3 ) );
			$is_out_of_stock = ( $item->discount_type == 'free_product' && isset( $item->is_out_of_stock ) && ( $item->is_out_of_stock ) );
			?>
            <div class="wlr-coupons-content <?php echo ( ! empty( $item->discount_code ) ) ? 'wlr-new-coupon-card' : ''; ?> wlr-border-color
 <?php if ( $is_out_of_stock ) : ?> wlr-out-of-stock <?php endif; ?>" <?php if ( $is_out_of_stock ) : ?>   title="<?php echo esc_attr( $item->out_of_stock_message ); ?>" <?php endif; ?>>
				<?php if ( $is_out_of_stock ) : ?>
                    <div class="wlr wlrf-lock wlr-lock-card"></div>
				<?php endif; ?>
                <div class="wlr-card-container"
                     style="<?php echo ( $is_out_of_stock ) ? "opacity:0.6" : ""; ?>">
                    <div class="wlr-coupon-card-header">
                        <div class="wlr-title-icon">
                            <div class="wlr-card-icon-container">
                                <div class="wlr-card-icon">
									<?php $discount_type = ! empty( $item->discount_type ) ? $item->discount_type : ""; ?>
									<?php $img_icon = ! empty( $item->icon ) ? $item->icon : ""; ?>
									<?php echo wp_kses_post( \Wlr\App\Helpers\Base::setImageIcon( $img_icon, $discount_type, [ "alt" => $item->name ] ) ); ?>
                                </div>
                            </div>
                            <div class="wlr-name-container">
                                <h4 class="wlr-name wlr-text-color">
									<?php //phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
									echo \Wlr\App\Helpers\Base::readMoreLessContent( $item->name, $card_key, 60, esc_html__( "Show more", "wp-loyalty-rules" ), esc_html__( "Show less", "wp-loyalty-rules" ), 'card-my-reward-name', 'wlr-name wlr-pre-text wlr-text-color' ); ?>
                                </h4>
                                <p class="wlr-theme-color-apply">
									<?php echo wp_kses_post( $item->reward_type_name ); ?>
									<?php $discount_value = ! empty( $item->discount_value ) && ( $item->discount_value != 0 ) ? ( $item->discount_value ) : ''; ?>
									<?php if ( $discount_value > 0 && isset( $item->discount_type ) && in_array( $item->discount_type, [
											'percent',
											'fixed_cart',
											'points_conversion'
										] ) ): ?>
										<?php if ( $item->discount_type == 'points_conversion' && ! empty( $item->discount_code ) ) : ?>
											<?php echo $item->coupon_type != 'percent' ? wp_kses_post( " - " . $woocommerce_helper->convertPrice( $discount_value, true, $item->reward_currency ) ) : esc_html( " - " . number_format( $discount_value, 2 ) . '%' ); ?>
										<?php elseif ( $item->discount_type != 'points_conversion' ): ?>
											<?php echo ( $item->discount_type == 'percent' ) ? esc_html( " - " . round( $discount_value ) . "%" ) : wp_kses_post( " - " . $woocommerce_helper->convertPrice( $discount_value, true, $item->reward_currency ) ); ?>
										<?php endif; ?>
									<?php endif; ?>
                                </p>
                            </div>
                        </div>
                        <div class="wlr-code-button">
                            <div class="wlr-code" style="<?php echo esc_attr( $coupon_border );
							echo ( $is_out_of_stock ) ? "cursor:not-allowed;" : ""; ?>">
                                <div class="wlr-coupon-code"
                                     style="<?php echo esc_attr( $coupon_background ); ?>">
                                    <p title="<?php esc_html_e( 'Coupon Code', 'wp-loyalty-rules' ); ?>"
										<?php if ( ! $is_out_of_stock ): ?>
                                            onclick="wlr_jquery( 'body' ).trigger( 'wlr_copy_coupon',[ '<?php echo esc_js( '#wlr-' . $item->discount_code ) ?>','<?php echo esc_js( '#wlr-icon-' . $item->discount_code ) ?>'])"
										<?php endif; ?>
                                    >
                                                <span
                                                        style="<?php echo ! empty( $apply_coupon_border_color ) ? esc_attr( "color:" . $apply_coupon_border_color . ";" ) : ""; ?>"
                                                        id="<?php echo esc_attr( 'wlr-' . $item->discount_code ) ?>"><?php echo esc_html( $item->discount_code ); ?></span>
                                    </p>
                                </div>
                                <div class="wlr-coupon-copy-icon"
                                     style="<?php echo esc_attr( "color:" . $apply_coupon_border_color . ";" . $coupon_background ); ?>">
                                    <i id="<?php echo esc_attr( 'wlr-icon-' . $item->discount_code ) ?>"
                                       class="wlr wlrf-copy wlr-icon"
                                       title="<?php esc_html_e( 'copy to clipboard', 'wp-loyalty-rules' ); ?>"
										<?php if ( ! $is_out_of_stock ): ?>
                                            onclick="wlr_jquery( 'body' ).trigger( 'wlr_copy_coupon',[ '<?php echo esc_js( '#wlr-' . $item->discount_code ) ?>','<?php echo esc_js( '#wlr-icon-' . $item->discount_code ) ?>'])"
										<?php endif; ?>
                                       style="font-size:20px;"></i>
                                </div>
                            </div>

                            <div class="<?php echo esc_attr( $css_class_name ); ?> "
                                 id="<?php echo esc_attr( 'wlr-button-coupon-action-' . $card_key ); ?>"
                                 style="<?php echo esc_attr( $button_color );
							     echo ( $is_out_of_stock ) ? "cursor:not-allowed;" : ""; ?>"
								<?php if ( ! $is_out_of_stock ): ?>
                                 onclick="wlr_jquery( 'body' ).trigger( 'wlr_apply_reward_action', [ '<?php echo esc_js( $item->id ); ?>', '<?php echo esc_js( $item->reward_table ); ?>', '<?php echo esc_js( '#wlr-button-coupon-action-' . $card_key ); ?>',<?php echo esc_js( $page_type ); ?>,'<?php
								 $endpoint_url_with_params = add_query_arg( array( 'active_reward_page' => 'coupons' ), $endpoint_url );
								 echo esc_url( $endpoint_url_with_params . '#wlr-my-rewards-sections' ) ?>'] )">
								<?php endif;
								?>
                                <span class="wlr-action-text"
                                      style="<?php echo ( $is_out_of_stock ) ? "cursor:not-allowed;" : "";
								      echo esc_attr( $button_text_color ); ?>"><?php echo esc_html( $button_text ); ?></span>
                            </div>
                        </div>
                    </div>
                    <div class="wlr-coupon-card-footer">
                        <div class="wlr-coupon-date-section">
							<?php if ( ! empty( $item->expiry_date ) && ! empty( $item->discount_code ) ): ?>
                                <div class="wlr-flex"><i class="wlrf-clock wlr-text-color"></i>
                                    <p class="wlr-expire-date wlr-text-color">
										<?php /* translators: %s: expired date */
										echo esc_html( sprintf( __( "Expires on %s", "wp-loyalty-rules" ), $item->expiry_date ) ); ?></p>
                                </div>
							<?php endif; ?>
                        </div>
                        <div>
							<?php if ( ! empty( $revert_button ) && ( $item->reward_type == 'redeem_point' ) && ! empty( $item->discount_code ) && isset( $is_revert_enabled ) && $is_revert_enabled ): ?>
                                <div class="wlr-revert wlr-revert-active wlr-flex"
                                     id="<?php echo esc_attr( 'wlr-' . $item->id . '-' . $item->discount_code ); ?>"
                                     onclick="wlr_jquery( 'body' ).trigger('wlr_new_revoke_coupon',['<?php echo esc_js( $item->id ); ?>','<?php echo esc_js( $item->discount_code ); ?>','<?php
								     $endpoint_url_with_params = add_query_arg( array( 'active_reward_page' => 'coupons' ), $endpoint_url );
								     echo esc_url( $endpoint_url_with_params . '#wlr-my-rewards-sections' ); ?>']);">
                                    <i class="wlrf-refresh_2 wlr-theme-color-apply"></i>
                                    <span
                                            class="wlr-revert-reward wlr-theme-color-apply"><?php echo esc_html( $revert_button ); ?></span>
                                </div>
							<?php endif; ?>
                        </div>

                    </div>
                </div>
            </div>
			<?php $card_key ++; ?>
		<?php endforeach; ?>
		<?php if ( isset( $total ) && $total > 0 ): ?>
            <div class="wlr-coupon-pagination">
                <div>
                    <div style="text-align: right">
						<?php if ( isset( $offset ) && 1 !== (int) $offset ) : ?>
                            <a class="woocommerce-button woocommerce-button--previous woocommerce-Button wlr-cursor wlr-text-color"
                               onclick="wlr_jquery( 'body' ).trigger( 'wlr_my_reward_section_pagination',['coupons','<?php echo esc_js( $offset - 1 ); ?>','<?php echo esc_js( $page_type ); ?>'])"
                               id="<?php echo esc_attr( WLR_PLUGIN_PREFIX . '-prev-button' ) ?>">
								<?php esc_html_e( 'Prev', 'wp-loyalty-rules' ); ?>
                            </a>
						<?php endif; ?>
						<?php if ( isset( $offset ) && isset( $current_count ) && intval( $current_count ) < $total ) : ?>
                            <a class="woocommerce-button woocommerce-button--next woocommerce-Button  wlr-cursor wlr-text-color"
                               id="<?php echo esc_attr( WLR_PLUGIN_PREFIX . '-next-button' ) ?>"
                               onclick="wlr_jquery( 'body' ).trigger( 'wlr_my_reward_section_pagination', ['coupons','<?php echo esc_js( $offset + 1 ); ?>','<?php echo esc_js( $page_type ); ?>'])">
								<?php esc_html_e( 'Next', 'wp-loyalty-rules' ); ?>
                            </a>
						<?php endif; ?>
                    </div>
                </div>
            </div>
		<?php endif; ?>
	<?php else: ?>
        <div class="wlr-norecords-container">
            <div><i class="wlrf-coupon-empty wlr-text-color"></i></div>
            <div>
                <h4 class="wlr-text-color"><?php esc_html_e( 'Transform your points into savings! Convert to coupons now.', 'wp-loyalty-rules' ); ?></h4>
            </div>
            <div>
                <p class="wlr-text-color"><?php esc_html_e( "Maximize the value of your earned points by converting them into discount coupons. Make your shopping experience even more rewarding!", "wp-loyalty-rules" ); ?></p>
            </div>
        </div>
	<?php endif; ?>
</div>
