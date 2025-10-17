<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-3.0.html
 * @link        https://www.wployalty.net
 * */
defined( 'ABSPATH' ) or die;

esc_html_e( 'Congratulations on reaching new level {wlr_level_name} at {wlr_store_name}!', 'wp-loyalty-rules' );
esc_html_e( 'You\'ve unlocked new earning opportunities!', 'wp-loyalty-rules' );
esc_html_e( 'Refer your friends and earn more points and reward.', 'wp-loyalty-rules' );
echo esc_html__( 'Your Referral Link', 'wp-loyalty-rules' ); ?> - {wlr_referral_url}