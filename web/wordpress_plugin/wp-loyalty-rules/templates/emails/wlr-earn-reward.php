<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-3.0.html
 * @link        https://www.wployalty.net
 * */
defined( 'ABSPATH' ) or die;
/*
 * @hooked WC_Emails::email_header() Output the email header
*/
do_action( 'woocommerce_email_header', $email_heading, $email );
?>
    <h3><?php esc_html_e( 'You have earned {wlr_earn_reward} reward!', 'wp-loyalty-rules' ) ?></h3>
    <div>
        <p><?php esc_html_e( 'Refer your friends and earn more points and reward.', 'wp-loyalty-rules' ); ?></p>
        <p><?php echo esc_html__( 'Your Referral Link', 'wp-loyalty-rules' ); ?> - <a href="{wlr_referral_url}"
                                                                                      target="_blank">{wlr_referral_url}</a>
        </p>
    </div>
<?php
/**
 * Show user-defined additional content - this is set in each email's settings.
 */
if ( $additional_content ) {
	echo wp_kses_post( wpautop( wptexturize( $additional_content ) ) );
}

do_action( 'woocommerce_email_footer', $email );