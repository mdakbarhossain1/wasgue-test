<?php

use Wlr\App\Helpers\EarnCampaign;
use Wlr\App\Helpers\Settings;

defined( "ABSPATH" ) or die();
$earn_campaign_helper = EarnCampaign::getInstance();
$woocommerce_helper   = \Wlr\App\Helpers\Woocommerce::getInstance();
$is_right_to_left     = is_rtl();
?>
<?php if ( ! empty( $items ) ): ?>
	<?php $theme_color        = Settings::get( 'theme_color', '#4F47EB' );
	$button_text              = __( Settings::get( 'redeem_button_text', 'Redeem Now' ), 'wp-loyalty-rules' );//phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText
	$redeem_button_color      = Settings::get( 'redeem_button_color', '#4F47EB' );
	$button_color             = $redeem_button_color ? "background:" . $redeem_button_color . ";" : "background:" . $theme_color . ";";
	$redeem_button_text_color = Settings::get( 'redeem_button_text_color', '#ffffff' );
	$button_text_color        = $redeem_button_text_color ? "color:" . $redeem_button_text_color . ";" : "";
	$css_class_name           = 'wlr-button-reward wlr-button wlr-button-action';
	?>
    <div class="wlr-customer-reward">
		<?php $card_key = 1; ?>
		<?php foreach ( $items as $item ): ?>
			<?php
			$is_out_of_stock = ( $item->discount_type == 'free_product' && isset( $item->is_out_of_stock ) && ( $item->is_out_of_stock ) ); ?>
            <div class="wlr-rewards-content wlr-reward-card wlr-border-color <?php echo esc_attr( ! empty( $item->discount_type ) ? $item->discount_type : '' ); ?> <?php if ( $is_out_of_stock ): ?> wlr-out-of-stock <?php endif; ?>"
				<?php if ( $is_out_of_stock ) : ?>   title="<?php echo esc_html( $item->out_of_stock_message ); ?>" <?php endif; ?> >

                <div style="<?php echo $is_right_to_left ? "margin-left: -12px;" : "margin-right: -12px;"; ?>">
                    <p class="wlr-reward-type-name wlr-text-color wlr-border-color">
						<?php echo wp_kses_post( $item->reward_type_name ); ?>
						<?php $discount_value = ! empty( $item->discount_value ) && ( $item->discount_value != 0 ) ? ( $item->discount_value ) : ''; ?>
						<?php if ( $discount_value > 0 && isset( $item->discount_type ) && in_array( $item->discount_type, [
								'percent',
								'fixed_cart',
								'points_conversion'
							] ) ): ?>
							<?php if ( ( $item->discount_type == 'points_conversion' ) && ! empty( $item->discount_code ) ) : ?>
								<?php echo wp_kses_post( " - " . $woocommerce_helper->getCustomPrice( $discount_value ) ); ?>
							<?php elseif ( $item->discount_type != 'points_conversion' ): ?>
								<?php echo ( $item->discount_type == 'percent' ) ? esc_html( " - " . round( $discount_value ) . "%" ) : wp_kses_post( " - " . $woocommerce_helper->getCustomPrice( $discount_value ) ); ?>
							<?php endif; ?>
						<?php endif; ?>
                    </p>
                </div>
                <div class="wlr-card-container">
                    <div class="wlr-card-icon-container" <?php if ( $is_out_of_stock ) : ?>
                        style="display: flex;align-items: center;justify-content: space-between;"<?php endif; ?>>
                        <div class="wlr-card-icon">
							<?php $discount_type = ! empty( $item->discount_type ) ? $item->discount_type : "" ?>
							<?php $img_icon = ! empty( $item->icon ) ? $item->icon : "" ?>
							<?php echo wp_kses_post( \Wlr\App\Helpers\Base::setImageIcon( $img_icon, $discount_type, array( "alt" => $item->name ) ) ); ?>
                        </div>
						<?php if ( $is_out_of_stock ) : ?>
                            <div class="wlr wlrf-lock wlr-lock-card" style="position: relative"></div>
						<?php endif; ?>
                    </div>

                    <div class="wlr-card-inner-container">
                        <h4 class="wlr-name wlr-text-color">
							<?php echo \Wlr\App\Helpers\Base::readMoreLessContent( $item->name, $card_key, 60, esc_html__( "Show more", "wp-loyalty-rules" ), esc_html__( "Show less", "wp-loyalty-rules" ), 'card-my-reward-name', 'wlr-name wlr-pre-text wlr-text-color' );//phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
                        </h4>
						<?php $description = apply_filters( 'wlr_my_account_reward_desc', $item->description, $item ); ?>
						<?php if ( ! empty( $description ) && empty( $item->discount_code ) ): ?>
							<?php echo \Wlr\App\Helpers\Base::readMoreLessContent( $description, $card_key, 90, esc_html__( "Show more", "wp-loyalty-rules" ), esc_html__( "Show less", "wp-loyalty-rules" ), 'card-my-reward-description', 'wlr-description wlr-pre-text wlr-text-color' );//phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
						<?php endif; ?>
						<?php if ( isset( $item->discount_type ) && $item->discount_type == 'free_product' ):
							if ( ! empty( $item->is_stock_empty_products ) && is_array( $item->is_stock_empty_products ) ):
								?>
                                <div style="display: flex;flex-direction: column;gap: 3px;">
                                    <b><?php esc_html_e( 'Out of Stock:', 'wp-loyalty-rules' ); ?></b>
									<?php foreach ( $item->is_stock_empty_products as $s_product ): ?>
                                        <small><?php echo wp_kses_post( $s_product['product_name'] ); ?></small>
									<?php endforeach; ?>
                                </div>
							<?php endif;endif; ?>
                    </div>


					<?php if ( isset( $item->discount_type ) && $item->discount_type == 'points_conversion' && $item->reward_table != 'user_reward' ): ?>
                        <div style="display: none;"
                             class="wlr-point-conversion-section wlr-border-color"
                             id="<?php echo esc_attr( 'wlr_point_conversion_div_' . $item->id ); ?>">
                            <div><i class="wlrf-close wlr-cursor wlr-text-color"
                                    title="<?php esc_html_e( 'Close', 'wp-loyalty-rules' ); ?>"
                                    onclick="wlr_jquery('<?php echo esc_js( '#wlr_point_conversion_div_' . $item->id ); ?>').hide();wlr_jquery('<?php echo esc_js( '#wlr-button-action-' . $card_key ) ?>').show();">
                                </i></div>
                            <div style="display: flex;gap: 15%"
                                 id="<?php echo esc_attr( 'wlr-point-conversion-section-' . $item->id ); ?>">
                                <div class="wlr-input-point-section">
                                    <div
                                            class="wlr-input-point-conversion wlr-border-color">
                                        <input type="text" min="1" pattern="/^[0-9]+$/"
                                               class="wlr-point-conversion-box wlr-text-color"
                                               onkeypress="return wlr_jquery('body').trigger('wlr_validate_number');"
                                               onchange="wlr_jquery('body').trigger('wlr_calculate_point_conversion',
                                                       ['<?php echo esc_js( 'wlr_point_conversion_' . $item->id ); ?>','<?php echo esc_js( 'wlr_point_conversion_' . $item->id . '_value' ); ?>']);"
                                               onkeyup="wlr_jquery('body').trigger('wlr_calculate_point_conversion',
                                                       ['<?php echo esc_js( 'wlr_point_conversion_' . $item->id ); ?>','<?php echo esc_js( 'wlr_point_conversion_' . $item->id . '_value' ); ?>']);"
                                               id="<?php echo esc_attr( 'wlr_point_conversion_' . $item->id ); ?>"
                                               value="<?php echo esc_attr( $item->input_point ); ?>"
                                               oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/(\..*)\./g, '$1');"
                                               data-require-point="<?php echo esc_attr( $item->require_point ); ?>"
                                               data-discount-value="<?php echo ( $item->coupon_type == 'percent' ) ? esc_attr( $item->discount_value ) : esc_attr( $woocommerce_helper->getCustomPrice( $item->discount_value, false ) ); ?>"
                                               data-available-point="<?php echo esc_attr( $item->available_point ); ?>"
                                               data-cart-amount="<?php echo esc_attr( $item->cart_amount ); ?>"
                                               data-max-allowed-point="<?php echo esc_attr( $item->max_allowed_point ); ?>"
                                               data-min-allowed-point="<?php echo esc_attr( $item->min_allowed_point ); ?>"
                                               data-max-message="<?php echo esc_attr( $item->max_message ); ?>"
                                               data-min-message="<?php echo esc_attr( $item->min_message ); ?>"
                                               data-button-id="<?php echo esc_attr( 'wlr_point_conversion_' . $item->id . '_button' ); ?>"
                                               data-section-id="<?php echo esc_attr( 'wlr-point-conversion-section-' . $item->id ); ?>"
                                               data-is-max-changed="<?php echo esc_attr( $item->is_max_changed ); ?>"
                                        ></div>
                                    <div class="wlr-point-label-content wlr-border-color">
                                        <p class="wlr-input-point-title wlr-text-color">
											<?php
											if ( $item->coupon_type == 'percent' ) :
												echo "=";
												?>
                                                <span
                                                        id="<?php echo esc_attr( 'wlr_point_conversion_' . $item->id . '_value' ); ?>"
                                                        class="wlr-point-conversion-discount-label">
                                                    <?php echo esc_html( $item->input_value ); ?>
                                                </span>%
											<?php
											else:
												$woocommerce_currency = $woocommerce_helper->getDisplayCurrency();
												echo wp_kses_post( sprintf( '=(%s)%s', $woocommerce_currency, $woocommerce_helper->getCurrencySymbols( $woocommerce_currency ) ) ); ?>
                                                &nbsp;<span
                                                    id="<?php echo esc_attr( 'wlr_point_conversion_' . $item->id . '_value' ); ?>"
                                                    class="wlr-point-conversion-discount-label">
                                                    <?php echo esc_html( $item->input_value ); ?>
                                                </span>
											<?php endif; ?>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div
                                    id="<?php echo esc_attr( 'wlr_point_conversion_' . $item->id . '_button' ); ?>"
                                    class="wlr-button wlr-button-action"
                                    style="<?php echo esc_attr( $button_color ); ?>"
                                    onclick="wlr_jquery( 'body' ).trigger( 'wlr_apply_point_conversion_reward',['<?php echo esc_js( $item->id ); ?>','<?php echo esc_js( $item->reward_table ); ?>','<?php echo esc_js( $item->available_point ); ?>','<?php echo esc_js( '#wlr_point_conversion_' . $item->id ); ?>' ,'<?php echo esc_js( '#wlr_point_conversion_' . $item->id . '_button' ); ?>','<?php echo esc_js( $page_type ); ?>','<?php
									$endpoint_url_with_params = add_query_arg( array( 'active_reward_page' => 'coupons' ), $endpoint_url );
									echo esc_url( $endpoint_url_with_params . '#wlr-my-rewards-sections' ) ?>'] );">
                                            <span class="wlr-action-text"
                                                  style="<?php echo esc_attr( $button_text_color ); ?>"><?php echo esc_html__( 'Redeem', 'wp-loyalty-rules' ); ?></span>
                            </div>
                        </div>
                        <div class="<?php echo esc_attr( $css_class_name ); ?>"
                             style="<?php echo esc_attr( $button_color ); ?>"
                             id="<?php echo esc_attr( 'wlr-button-action-' . $card_key ) ?>"
                             onclick="wlr_jquery('<?php echo esc_js( '#wlr_point_conversion_div_' . $item->id ); ?>').show();wlr_jquery('<?php echo esc_js( '#wlr-button-action-' . $card_key ) ?>').hide();wlr_jquery('body').trigger('wlr_calculate_point_conversion',
                                     ['<?php echo esc_js( 'wlr_point_conversion_' . $item->id ); ?>','<?php echo esc_js( 'wlr_point_conversion_' . $item->id . '_value' ); ?>']);">
                                        <span class="wlr-action-text"
                                              style="<?php echo esc_attr( $button_text_color ); ?>"><?php echo esc_html( $button_text ); ?></span>
                        </div>
					<?php else: ?>

                        <div class="<?php echo esc_attr( $css_class_name ); ?> "
                             id="<?php echo esc_attr( 'wlr-button-action-' . $card_key ); ?>"
                             style="<?php echo esc_attr( $button_color ); ?><?php if ( $item->discount_type == 'free_product' && isset( $item->is_out_of_stock ) && ( $item->is_out_of_stock ) ): ?>
                                     cursor: not-allowed;opacity: 0.6;<?php endif; ?>"
							<?php if ( $item->discount_type == 'free_product' && isset( $item->is_out_of_stock ) && ! ( $item->is_out_of_stock ) || $item->discount_type != 'free_product' ): ?>
                                onclick="wlr_jquery( 'body' ).trigger( 'wlr_apply_reward_action', [ '<?php echo esc_js( $item->id ); ?>', '<?php echo esc_js( $item->reward_table ); ?>', '<?php echo esc_js( '#wlr-button-action-' . $card_key ); ?>','<?php echo esc_js( $page_type ); ?>','<?php
								$endpoint_url_with_params = add_query_arg( array( 'active_reward_page' => 'coupons' ), $endpoint_url );
								echo esc_url( $endpoint_url_with_params . '#wlr-my-rewards-sections' ) ?>'] )"
							<?php endif; ?>
                        >
                                        <span class="wlr-action-text"
                                              style="<?php echo esc_attr( $button_text_color ); ?>"><?php echo esc_html( $button_text ); ?></span>
                        </div>

					<?php endif; ?>


                </div>
            </div>
			<?php $card_key ++; ?>
		<?php endforeach; ?>
    </div>
    <div>
		<?php if ( isset( $total ) && $total > 0 ): ?>
            <div class="wlr-reward-pagination">
                <div>
                    <div style="text-align: right">
						<?php if ( isset( $offset ) && 1 !== (int) $offset ) : ?>
                            <a class="woocommerce-button woocommerce-button--previous woocommerce-Button wlr-cursor wlr-text-color"
                               onclick="wlr_jquery( 'body' ).trigger( 'wlr_my_reward_section_pagination',['rewards','<?php echo esc_js( $offset - 1 ); ?>','<?php echo esc_js( $page_type ); ?>'])"
                               id="<?php echo esc_js( WLR_PLUGIN_PREFIX . '-prev-button' ); ?>">
								<?php esc_html_e( 'Prev', 'wp-loyalty-rules' ); ?>
                            </a>
						<?php endif; ?>
						<?php if ( isset( $current_count ) && intval( $current_count ) < $total ) : ?>
                            <a class="woocommerce-button woocommerce-button--next woocommerce-Button  wlr-cursor wlr-text-color"
                               id="<?php echo esc_js( WLR_PLUGIN_PREFIX . '-next-button' ); ?>"
                               onclick="wlr_jquery( 'body' ).trigger( 'wlr_my_reward_section_pagination', ['rewards','<?php echo esc_js( $offset + 1 ); ?>','<?php echo esc_js( $page_type ); ?>'])">
								<?php esc_html_e( 'Next', 'wp-loyalty-rules' ); ?>
                            </a>
						<?php endif; ?>
                    </div>
                </div>
            </div>
		<?php endif; ?>
    </div>
<?php else: ?>
    <div class="wlr-customer-reward" style="display: flex;align-items: center;justify-content: center;">
        <div class="wlr-rewards-content wlr-norecords-container active">
            <div><i class="wlrf-reward-empty-hand wlr-text-color"></i></div>
            <div>
                <h4 class="wlr-text-color"><?php /* translators: %s: reward label */
					echo esc_html( sprintf( __( 'Begin Your %s Journey!', 'wp-loyalty-rules' ), ucfirst( $earn_campaign_helper->getRewardLabel( 3 ) ) ) ); ?></h4>
            </div>
            <div>
                <p class="wlr-text-color"><?php /* translators: %s: reward label */
					echo esc_html( sprintf( __( "Shop more and unlock amazing %s! Discover all the opportunities below!", "wp-loyalty-rules" ),
						$earn_campaign_helper->getRewardLabel( 3 ) ) ); ?></p>
            </div>
        </div>
    </div>
<?php endif; ?>

