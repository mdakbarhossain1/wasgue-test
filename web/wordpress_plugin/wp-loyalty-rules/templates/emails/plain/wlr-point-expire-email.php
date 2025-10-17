<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-3.0.html
 * @link        https://www.wployalty.net
 * */
defined( 'ABSPATH' ) or die;

esc_html_e( '{wlr_expiry_points} {wlr_points_label} are about to expire', 'wp-loyalty-rules' );
esc_html_e( 'Redeem your hard earned {wlr_points_label} before they expire on {wlr_expiry_date}', 'wp-loyalty-rules' );
echo esc_html__( 'Your Referral Link', 'wp-loyalty-rules' ); ?> - {wlr_referral_url}
