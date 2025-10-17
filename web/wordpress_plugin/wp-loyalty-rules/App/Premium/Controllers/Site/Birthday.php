<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Controllers\Site;

use Automattic\WooCommerce\StoreApi\Schemas\V1\CheckoutSchema;
use Wlr\App\Controllers\Base;
use Wlr\App\Helpers\EarnCampaign;
use Wlr\App\Helpers\Woocommerce;
use Wlr\App\Models\Logs;
use Wlr\App\Models\Users;

defined( 'ABSPATH' ) or die;

class Birthday extends Base {
	public static $birthday_campaigns = [];

	/* Birthday Start */
	function getPointBirthday( $point, $rule, $data ) {
		$birthday_helper = \Wlr\App\Premium\Helpers\Birthday::getInstance();

		return $birthday_helper->getTotalEarnPoint( $point, $rule, $data );
	}

	function getCouponBirthday( $point, $rule, $data ) {
		$birthday_helper = \Wlr\App\Premium\Helpers\Birthday::getInstance();

		return $birthday_helper->getTotalEarnReward( $point, $rule, $data );
	}

	function onBirthDayPoints() {
		global $wpdb;
		$user         = new Users();
		$null_date    = 0;
		$current_date = gmdate( 'Y-m-d H:i:s' );
		if ( apply_filters( 'wlr_sent_birthday_email_based_on_time_zone', false ) ) {
			$current_date = self::$woocommerce->convert_utc_to_wp_time( $current_date, 'Y-m-d' );
		}
		$month           = gmdate( 'm', strtotime( $current_date ) );
		$day             = gmdate( 'd', strtotime( $current_date ) );
		$user_where      = $wpdb->prepare( 'CASE WHEN birthday_date IS NOT NULL THEN MONTH(birthday_date) = %s AND DAY(birthday_date) = %s 
        WHEN birthday_date IS NULL THEN MONTH(from_unixtime(birth_date)) = %s AND DAY(from_unixtime(birth_date)) = %s AND birth_date > %s END',
			[
				$month,
				$day,
				$month,
				$day,
				$null_date
			] );
		$birth_users     = $user->getWhere( $user_where, '*', false );
		$birthday_helper = \Wlr\App\Premium\Helpers\Birthday::getInstance();
		foreach ( $birth_users as $birth_user ) {
			if ( empty( $birth_user->user_email ) ) {
				continue;
			}
			if ( isset( $birth_user->is_banned_user ) && $birth_user->is_banned_user == 1 ) {
				continue;
			}
			$action_data = [
				'user_email'         => $birth_user->user_email,
				'birthday_earn_type' => 'on_their_birthday'
			];
			$birthday_helper->applyEarnBirthday( $action_data );
		}
	}

	function onUpdateBirthDay() {
		$wlr_nonce = (string) self::$input->post_get( 'wlr_nonce', '' );
		if ( ! Woocommerce::verify_nonce( $wlr_nonce, 'wlr_reward_nonce' ) ) {
			$message = __( 'Invalid nonce', 'wp-loyalty-rules' );
			$json    = [
				'success' => false,
				'message' => $message
			];
			wc_add_notice( $message, 'error' );
			wp_send_json_error( $json );
		}
		$campaign_id = (int) self::$input->post_get( 'campaign_id', 0 );
		if ( empty( $campaign_id ) ) {
			$message = __( 'Invalid Campaign', 'wp-loyalty-rules' );
			$json    = [
				'success' => false,
				'message' => $message
			];
			wc_add_notice( $message, 'error' );
			wp_send_json_error( $json );
		}
		$birthdate = (string) self::$input->post_get( 'birth_date', '' );
		if ( empty( $birthdate ) ) {
			$message = __( 'Invalid Birthdate', 'wp-loyalty-rules' );
			$json    = [
				'success' => false,
				'message' => $message
			];
			wc_add_notice( $message, 'error' );
			wp_send_json_error( $json );
		}
		$user_email = self::$woocommerce->get_login_user_email();
		if ( empty( $user_email ) ) {
			$message = __( 'Invalid user', 'wp-loyalty-rules' );
			$json    = [
				'success' => false,
				'message' => $message
			];
			wc_add_notice( $message, 'error' );
			wp_send_json_error( $json );
		}
		$this->earnViaBirthdateUpdate( $user_email, $birthdate, $campaign_id );
		$display_birth_date = ! empty( $birthdate ) && $birthdate != '0000-00-00' ? self::$woocommerce->convertDateFormat( $birthdate )
			: ( ! empty( $birthdate ) ? self::$woocommerce->beforeDisplayDate( $birthdate ) : '' );
		$json               = [
			'success'             => true,
			'display_format_date' => $display_birth_date,
		];
		wp_send_json_success( $json );
	}
	/* Birthday End */

	/**
	 * @param $user_email
	 * @param $birthdate
	 * @param $campaign_id
	 *
	 * @return void
	 */
	public function earnViaBirthdateUpdate( $user_email, $birthdate, $campaign_id = 0 ) {
		if ( self::$woocommerce->isBannedUser( $user_email ) ) {
			return;
		}
		if ( empty( $user_email ) || empty( $birthdate ) ) {
			return;
		}
		$user_table       = new Users();
		$birthdate_helper = \Wlr\App\Premium\Helpers\Birthday::getInstance();
		$already_user     = $birthdate_helper->getPointUserByEmail( $user_email );
		if ( empty( $already_user ) ) {
			$id = 0;
			//Create New User
			$unique_refer_code = $birthdate_helper->get_unique_refer_code( '', false, $user_email );
			$_data             = [
				'user_email'        => sanitize_email( $user_email ),
				'points'            => 0,
				'earn_total_point'  => 0,
				'used_total_points' => 0,
				'refer_code'        => $unique_refer_code,
				'birth_date'        => self::$woocommerce->beforeSaveDate( $birthdate, 'Y-m-d' ),
				'birthday_date'     => self::$woocommerce->convertDateFormat( $birthdate, 'Y-m-d' ),
				'created_date'      => strtotime( gmdate( "Y-m-d H:i:s" ) ),
			];

		} else {
			$id = $already_user->id;
			// update birthdate
			$_data = [
				'birth_date'    => self::$woocommerce->beforeSaveDate( $birthdate, 'Y-m-d' ),
				'birthday_date' => self::$woocommerce->convertDateFormat( $birthdate, 'Y-m-d' ),
				'level_id'      => $already_user->level_id
			];
		}
		$admin_user = wp_get_current_user();
		$log_data   = [
			'user_email'          => sanitize_email( $user_email ),
			'action_type'         => 'birthday_change',
			/* translators: 1: customer email 2: birthdate*/
			'note'                => sprintf( __( '%1$s customer birthday updated to %2$s.', 'wp-loyalty-rules' ), $user_email, $birthdate ),
			'admin_id'            => isset( $admin_user->ID ) && ! empty( $admin_user->ID ) ? $admin_user->ID : 0,
			'created_at'          => strtotime( gmdate( 'Y-m-d H:i:s' ) ),
			'modified_at'         => 0,
			'action_process_type' => 'customer_change',
		];
		( new Logs() )->saveLog( $log_data );
		$user_table->insertOrUpdate( $_data, $id );
        do_action('wlr_after_birthday_updated', $user_email, $birthdate, $campaign_id);
		if ( ! self::$woocommerce->isBannedUser( $user_email ) ) {
			// add point or reward to that customer
			$action_data = [
				'user_email'         => $user_email,
				'birthday_earn_type' => 'update_birth_date',
				'campaign_id'        => $campaign_id
			];
			$birthdate_helper->applyEarnBirthday( $action_data );
		}
	}

	function initProSchedule() {
		//every 3 hours
		$hook      = 'wlr_birth_day_points';
		$timestamp = wp_next_scheduled( $hook );
		if ( false === $timestamp ) {
			$scheduled_time = strtotime( '+3 hours', current_time( 'timestamp' ) );
			wp_schedule_event( $scheduled_time, 'hourly', $hook );
		}
	}

	/* Birthday End */

	function addCustomBirthdayField() {
		if ( self::$woocommerce->isBannedUser() ) {
			return;
		}
		if ( ! apply_filters( 'wlr_show_birthday_input_for_guest_user', true ) ) {
			return;
		}
		$earn_campaign_model = new \Wlr\App\Models\EarnCampaign();
		$birthday_campaigns  = $earn_campaign_model->getCampaignByAction( 'birthday' );
		if ( empty( $birthday_campaigns ) ) {
			return;
		}
		$options = self::$woocommerce->getOptions( 'wlr_settings', [] );
		if ( empty( $options ) || ! is_array( $options ) || empty( $options['birthday_display_place'] ) || ! is_string( $options['birthday_display_place'] ) ) {
			return;
		}
		$display_places = explode( ',', $options['birthday_display_place'] );
		if ( empty( $display_places ) || ! is_array( $display_places ) ) {
			return;
		}
		foreach ( $display_places as $display_place ) {
			switch ( $display_place ) {
				case 'checkout':
					$this->addInCheckoutForm();
					break;
				case 'registration':
					$this->addInRegistrationForm();
					break;
				case 'account_details':
					$this->addInAccountDetailsPageForm();
					break;
				default:
					return;
			}
		}
		if ( is_admin() ) {
			add_action( 'show_user_profile', [ $this, 'addBirthdayInProfile' ] );
		}

	}

	/**
	 * Checkout block birthdate.
	 *
	 * @param string $birth_date Birthdate.
	 *
	 * @return string
	 */
	function addCustomerBirthday( $birth_date ) {
		$billing_email = self::$woocommerce->get_login_user_email();

		return self::getUserBirthday( $billing_email, $birth_date );
	}

	/**
	 * Add checkout birthdate input field schema.
	 *
	 * @param Object $extend Extend schema object.
	 *
	 * @return void
	 */
	function addBirthdayEndPointData( $extend ) {
		if ( ! is_object( $extend ) ) {
			return;
		}
		$extend->register_endpoint_data(
			[
				'endpoint'        => CheckoutSchema::IDENTIFIER,
				'namespace'       => 'wlr_checkout_block',
				'schema_callback' => [ $this, 'getBirthdayDateSchema' ],
				'schema_type'     => ARRAY_A,
			]
		);
	}

	/**
	 * Birthdate input schema.
	 *
	 * @return array[]
	 */
	public function getBirthdayDateSchema() {
		$validate_callback = function ( $value ) {
			if ( ! is_string( $value ) && null !== $value ) {
				return new \WP_Error(
					'api-error',
					esc_html__( 'Please enter valid date.', 'wp-loyalty-rules' )
				);
			}
			if ( ! ( strtotime( $value ) !== false ) ) {
				return new \WP_Error(
					'api-error',
					esc_html__( 'Please enter valid date.', 'wp-loyalty-rules' )
				);
			}

			return true;
		};

		$sanitize_callback = function ( $value ) {
			return sanitize_text_field( $value );
		};

		return [
			'wlr_dob' => [
				'description' => __( 'Checkout birthday input', 'wp-loyalty-rules' ),
				'type'        => [ 'string', 'null' ],
				'context'     => [],
				'arg_options' => [
					'validate_callback' => $validate_callback,
					'sanitize_callback' => $sanitize_callback,
				],
			]
		];
	}

	/**
	 * Save birthday date of user.
	 *
	 * @param \WC_Customer $customer Customer object.
	 * @param \WP_REST_Request $request Request object.
	 *
	 * @return void
	 */
	function saveBirthdayDate( \WC_Customer $customer, \WP_REST_Request $request ) {
		if ( ! isset( $request['extensions'] ) || ! isset( $request['extensions']['wlr_checkout_block'] )
		     || ! isset( $request['extensions']['wlr_checkout_block']['wlr_dob'] ) || empty( $request['extensions']['wlr_checkout_block']['wlr_dob'] ) ) {
			return;
		}
		if ( ! is_object( $customer ) ) {
			return;
		}
		$billing_email = $customer->get_billing_email();

		if ( empty( $billing_email ) || ! is_email( $billing_email ) ) {
			return;
		}
		$this->saveBirthdayDateAction( $request['extensions']['wlr_checkout_block']['wlr_dob'], $billing_email );
	}

	private function addInCheckoutForm() {
		/* check user email earned birthday point */
		$user_email           = self::$woocommerce->get_login_user_email();
		$earn_campaign_helper = EarnCampaign::getInstance();
		$user                 = $earn_campaign_helper->getPointUserByEmail( $user_email );

		$birthday_date = is_object( $user ) && isset( $user->birthday_date ) && ! empty( $user->birthday_date ) && $user->birthday_date != '0000-00-00'
			? $user->birthday_date
			: ( is_object( $user ) && isset( $user->birth_date ) && ! empty( $user->birth_date )
				? self::$woocommerce->beforeDisplayDate( $user->birth_date, "Y-m-d" ) : '' );

		if ( empty( $birthday_date ) || $birthday_date == '0000-00-00' ) {
			/* Checkout form start*/
			$checkout_place = apply_filters( 'wlr_birthday_checkout_field_place', 'billing' );
			if ( $checkout_place == 'billing' ) {
				add_action( 'woocommerce_after_checkout_billing_form', [ $this, 'addBirthdayInCheckoutForm' ] );
			} else if ( $checkout_place == 'shipping' ) {
				add_action( 'woocommerce_after_checkout_shipping_form', [ $this, 'addBirthdayInCheckoutForm' ] );
			} else if ( $checkout_place == 'order_notes' ) {
				add_action( 'woocommerce_after_order_notes', [ $this, 'addBirthdayInCheckoutForm' ] );
			}
			add_action( 'woocommerce_after_checkout_validation', [ $this, 'validateBirthdayInCheckoutForm' ], 10, 2 );
			add_action( 'woocommerce_checkout_create_order', [ $this, 'saveBirthdayInCheckoutForm' ], 10, 2 );
			/* Checkout form end*/
		}
	}

	private function addInRegistrationForm() {
		if ( self::$woocommerce->canShowBirthdateField() ) {
			/* Registration form start */
			add_action( 'woocommerce_register_form', [ $this, 'addBirthdayInRegisterForm' ] );
			add_action( 'woocommerce_register_post', [ $this, 'validateBirthdayInRegisterForm' ], 10, 3 );
			add_action( 'woocommerce_created_customer', [ $this, 'saveBirthdayInRegisterForm' ], 10, 3 );
			/* Registration form end */
		}
	}

	private function addInAccountDetailsPageForm() {
		if ( self::$woocommerce->canShowBirthdateField() ) {
			/* Account details form start */
			add_action( 'woocommerce_edit_account_form', [ $this, 'addBirthdayInAccountDetailsForm' ] );
			add_action( 'woocommerce_save_account_details_errors', [ $this, 'validateBirthdayInAccountDetailsForm' ] );
			add_action( 'woocommerce_save_account_details', [ $this, 'saveBirthdayInAccountDetailsForm' ] );
			/* Account details form start */
		}
	}

	function addBirthdayInProfile( $user ) {
		if ( empty( $user ) || ! is_object( $user ) || empty( $user->ID ) ) {
			return '';
		}
		$user_model = new \Wlr\App\Models\Users();
		$user_data  = $user_model->getByKey( $user->ID );
		if ( empty( $user_data ) || ! is_object( $user_data ) || ! isset( $user_data->birth_date ) ) {
			return '';
		}
		$dob           = ! empty( $user_data->birth_date ) ? self::$woocommerce->beforeDisplayDate( $user_data->birth_date ) : "";
		$validate_date = self::validateDateORNull( $dob );
		if ( $validate_date ) {
			?>
            <h3><?php esc_html_e( 'Extra account details', 'wp-loyalty-rules' ); ?></h3>
            <table class="form-table">
                <tr>
                    <th><label for="birthday_date"><?php esc_html_e( 'Date of birth', 'wp-loyalty-rules' ); ?></label>
                    </th>
                    <td>
                        <p><?php echo esc_html( $dob ); ?></p>
                    </td>
                </tr>
            </table>
			<?php
		}
	}

	static function validateDateORNull( $value ) {
		if ( empty( $value ) || in_array( $value, [ '', null, 0, '-' ] ) ) {
			return apply_filters( 'wlr_custom_birthday_validation_check', true, $value );
		}
		$is_date = false;
		if ( $value instanceof \DateTime ) {
			$is_date = true;
		} else {
			$is_date = ( strtotime( $value ) !== false );
		}

		return apply_filters( 'wlr_custom_birthday_validation_check', $is_date, $value );
	}

	function addBirthdayInRegisterForm() {
		woocommerce_form_field( 'wlr_dob', [
			'label'             => __( 'Birthday', 'wp-loyalty-rules' ),
			'required'          => apply_filters( 'wlr_is_required_birthday_registration_field', false ),
			'class'             => [ 'form-row-wide' ],
			'type'              => 'date',
			'custom_attributes' => [
				'max' => gmdate( 'Y-m-d' ),
			],
		] );
	}

	function validateBirthdayInRegisterForm( $username, $user_email, $errors ) {
		if ( empty( $username ) || empty( $user_email ) ) {
			return $errors;
		}
		$dob           = self::$input->post_get( 'wlr_dob', '' );
		$validate_date = self::validateDateORNull( $dob );
		if ( ! $validate_date ) {
			$errors->add( 'dob_error', __( 'Birthday date is required!', 'wp-loyalty-rules' ) );
		}

		return $errors;
	}

	function saveBirthdayInRegisterForm( $customer_id, $new_customer_data, $password_generated ) {
		if ( empty( $customer_id ) ) {
			return;
		}
		$dob           = self::$input->post_get( 'wlr_dob', '' );
		$user_email    = self::$input->post_get( 'email', '' );
		$validate_date = self::validateDateORNull( $dob );
		if ( ! empty( $dob ) && $validate_date && ! empty( $user_email ) && $customer_id > 0 && is_email( $user_email ) ) {
			$this->saveBirthdayDateAction( $dob, $user_email );
		}
	}

	function saveBirthdayDateAction( $dob, $user_email ) {
		$validate_date = self::validateDateORNull( $dob );
		if ( self::$woocommerce->isBannedUser( $user_email ) ) {
			return;
		}
		if ( ! empty( $user_email ) && $validate_date === true ) {
			$birthday_helper    = new \Wlr\App\Premium\Controllers\Site\Birthday();
			$birthday_campaigns = $this->getBirthdayCampaigns();
			if ( empty( $birthday_campaigns ) || ! is_array( $birthday_campaigns ) ) {
				return;
			}
			foreach ( $birthday_campaigns as $birthday_campaign ) {
				$campaign_id = is_object( $birthday_campaign ) && isset( $birthday_campaign->id ) && $birthday_campaign->id > 0 ? $birthday_campaign->id : 0;
				$birthday_helper->earnViaBirthdateUpdate( $user_email, $dob, $campaign_id );
			}
		}
	}

	function getBirthdayCampaigns() {
		if ( ! empty( self::$birthday_campaigns ) ) {
			return self::$birthday_campaigns;
		}
		$earn_campaign_model = new \Wlr\App\Models\EarnCampaign();
		$campaigns           = $earn_campaign_model->getCampaignByAction( 'birthday' );
		if ( empty( $campaigns ) ) {
			return self::$birthday_campaigns;
		}

		return self::$birthday_campaigns = $campaigns;
	}

	/**
	 * @param $billing_email
	 * @param $dob
	 *
	 * @return string
	 */
	public static function getUserBirthday( $billing_email, $dob ) {
		if ( empty( $billing_email ) ) {
			return $dob;
		}
		$earn_campaign_helper = EarnCampaign::getInstance();
		$user                 = $earn_campaign_helper->getPointUserByEmail( $billing_email );
		if ( ! empty( $user ) && is_object( $user ) && isset( $user->birthday_date ) && ( $user->birthday_date != '0000-00-00' ) ) {
			return $user->birthday_date;
		}

		return $dob;
	}

	function addBirthdayInCheckoutForm( $checkout ) {
		if ( empty( $checkout ) || ! is_object( $checkout ) ) {
			return;
		}
		$billing_email = $checkout->get_value( 'billing_email' );
		$dob           = $checkout->get_value( 'wlr_dob' );
		$dob           = self::getUserBirthday( $billing_email, $dob );
		$field_params  = apply_filters( 'wlr_before_birthday_field_params', [
			'type'              => 'date',
			'required'          => apply_filters( 'wlr_is_required_birthday_checkout_field', false ),
			'class'             => [ 'form-row-wide' ],
			'label'             => __( 'Birthday', 'wp-loyalty-rules' ),
			'priority'          => 10,
			'custom_attributes' => [
				'max' => gmdate( 'Y-m-d' ),
			]
		] );
		woocommerce_form_field( 'wlr_dob', $field_params, $dob );

	}

	function validateBirthdayInCheckoutForm( $fields, $errors ) {
		$dob           = self::$input->post_get( 'wlr_dob', '' );
		$validate_date = self::validateDateORNull( $dob );
		if ( ! $validate_date ) {
			$errors->add( 'dob_error', __( 'Birthday date is required!', 'wp-loyalty-rules' ) );
		}

		return $errors;
	}

	function saveBirthdayInCheckoutForm( $order, $data ) {
		$dob           = self::$input->post_get( 'wlr_dob', '' );
		$validate_date = self::validateDateORNull( $dob );
		$user_email    = isset( $data['billing_email'] ) && ! empty( $data['billing_email'] ) ? $data['billing_email'] : "";
		if ( self::$woocommerce->isBannedUser( $user_email ) ) {
			return;
		}
		if ( ! empty( $dob ) && $validate_date === true && ! empty( $user_email ) && is_email( $user_email ) ) {
			$this->saveBirthdayDateAction( $dob, $user_email );
		}
	}

	function addBirthdayInAccountDetailsForm() {
		$user_email    = self::$woocommerce->get_login_user_email();
		$dob           = self::getUserBirthday( $user_email, '' );
		$validate_date = self::validateDateORNull( $dob );
		if ( ! $validate_date ) {
			return;
		}
		woocommerce_form_field( 'wlr_dob', [
			'label'             => __( 'Birthday', 'wp-loyalty-rules' ),
			'type'              => 'date',
			'required'          => apply_filters( 'wlr_is_required_birthday_account_details_field', false ),
			'class'             => [ 'form-row-wide' ],
			'custom_attributes' => [ 'max' => gmdate( 'Y-m-d' ) ],
		], $dob );
	}

	function validateBirthdayInAccountDetailsForm( $args ) {
		$dob           = self::$input->post_get( 'wlr_dob', '' );
		$validate_date = self::validateDateORNull( $dob );
		if ( ! $validate_date ) {
			$args->add( 'dob_error', __( 'Birthday date is required!', 'wp-loyalty-rules' ) );
		}

		return $args;
	}

	function saveBirthdayInAccountDetailsForm( $user_id ) {
		$dob           = self::$input->post_get( 'wlr_dob', '' );
		$user_email    = self::$woocommerce->get_email_by_id( $user_id );
		$validate_date = self::validateDateORNull( $dob );
		if ( ! empty( $dob ) && $validate_date === true && ! empty( $user_email ) && is_email( $user_email ) ) {
			$this->saveBirthdayDateAction( $dob, $user_email );
		}
	}
}