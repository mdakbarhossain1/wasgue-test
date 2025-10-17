<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Models;
defined( 'ABSPATH' ) or die();

class Users extends Base {
	function __construct() {
		parent::__construct();
		$this->table       = self::$db->prefix . 'wlr_users';
		$this->primary_key = 'id';
		$this->fields      = array(
			'user_email'          => '%s',
			'refer_code'          => '%s',
			'points'              => '%s',
			'used_total_points'   => '%s',
			'earn_total_point'    => '%s',
			'birth_date'          => '%s',
			'level_id'            => '%s',
			'is_allow_send_email' => '%d',
			'created_date'        => '%s',
			'birthday_date'       => '%s',
			'last_login'          => '%s',
			'is_banned_user'      => '%d',
		);
	}

	function beforeTableCreation() {
	}

	function runTableCreation() {
		$create_table_query = "CREATE TABLE IF NOT EXISTS {$this->table} (
				 `{$this->getPrimaryKey()}` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                 `user_email` varchar(180) DEFAULT NULL,
                 `refer_code` varchar(180) DEFAULT NULL,
                 `points` BIGINT DEFAULT 0,
                 `used_total_points` BIGINT DEFAULT 0,
                 `earn_total_point` BIGINT DEFAULT 0,
                 `birth_date` BIGINT DEFAULT 0,
                 `level_id` BIGINT DEFAULT 0,
                 `is_banned_user` TINYINT DEFAULT 0,
                 `is_allow_send_email` TINYINT DEFAULT 1,
                 `birthday_date` DATE DEFAULT NULL,
                 `last_login` BIGINT DEFAULT 0, 
                 `created_date` BIGINT DEFAULT 0,
                 PRIMARY KEY (`{$this->getPrimaryKey()}`)
			)";
		$this->createTable( $create_table_query );
	}

	function afterTableCreation() {
		if ( $this->checkTableExists() ) {
			if ( ! self::$db->get_var( "SHOW KEYS FROM {$this->table} WHERE Key_name = 'user_email'" ) ) {
				self::$db->query(
					"ALTER TABLE `{$this->table}` ADD UNIQUE (user_email(150))"
				);
			}
		}
		if ( $this->checkTableExists() ) {
			$existing_columns = $this->getTableFields();
			if ( ! in_array( 'birthday_date', $existing_columns ) ) {
				self::$db->query(
					"ALTER TABLE `{$this->table}` ADD COLUMN birthday_date DATE DEFAULT NULL"
				);
			}
			if ( ! in_array( 'level_id', $existing_columns ) ) {
				self::$db->query(
					"ALTER TABLE `{$this->table}` ADD COLUMN level_id BIGINT DEFAULT 0"
				);
			}
			if ( ! in_array( 'is_allow_send_email', $existing_columns ) ) {
				self::$db->query(
					"ALTER TABLE `{$this->table}` ADD COLUMN is_allow_send_email TINYINT DEFAULT 1"
				);
			}
			if ( ! in_array( 'last_login', $existing_columns ) ) {
				self::$db->query(
					"ALTER TABLE `{$this->table}` ADD COLUMN last_login BIGINT DEFAULT 0"
				);
			}
			if ( ! in_array( 'is_banned_user', $existing_columns ) ) {
				self::$db->query(
					"ALTER TABLE `{$this->table}` ADD COLUMN is_banned_user TINYINT DEFAULT 0"
				);
			}
			//
		}
		$index_fields = array( 'created_date', 'refer_code', 'birth_date', 'birthday_date', 'is_banned_user' );
		$this->insertIndex( $index_fields );
	}

	function insertOrUpdate( $data, $id = 0 ) {
		if ( empty( $data ) ) {
			return false;
		}
		$user = new \stdClass();
		if ( $id > 0 ) {
			$user = $this->getByKey( $id );
		}
		$user_fields = array(
			'user_email'          => '',
			'refer_code'          => '',
			'points'              => 0,
			'used_total_points'   => 0,
			'earn_total_point'    => 0,
			'birth_date'          => 0,
			'level_id'            => 0,
			'is_allow_send_email' => 1,
			'created_date'        => 0,
			'birthday_date'       => null,
			'last_login'          => 0,
			'is_banned_user'      => 0
		);
		foreach ( $user_fields as $field_name => $field_value ) {
			$user_fields[ $field_name ] = ( isset( $data[ $field_name ] ) ) ? $data[ $field_name ] :
				( isset( $user ) && ! empty( $user ) && isset( $user->$field_name ) ? $user->$field_name : $field_value );
		}
		$old_level_id            = $user_fields['level_id'];
		$user_fields['level_id'] = apply_filters( 'wlr_user_level_id', $user_fields['level_id'], $user_fields['earn_total_point'], $user_fields );
		if ( ! empty( $id ) && $id > 0 && ! empty( $user ) ) {
			$this->updateRow( $user_fields, array( 'id' => $user->id ) );
			$status = true;
		} else {
			$status = $this->insertRow( $user_fields );
		}
		if ( $status && ( $old_level_id != $user_fields['level_id'] ) ) {
			\WC_Emails::instance();
			do_action( 'wlr_after_user_level_changed', $old_level_id, $user_fields );
		}

		return apply_filters( 'wlr_after_user_updated', $status, $user_fields );
	}

	function resetPoint( $id = 0 ) {
		if ( $id <= 0 ) {
			return false;
		}

		$user_fields = array(
			'points'            => 0,
			'used_total_points' => 0,
			'earn_total_point'  => 0,
			'level_id'          => 0,
		);

		return $this->insertOrUpdate( $user_fields, $id );
	}

	public static function updateSentEmailData( $user_email, $enable_sent_email ) {
		if ( empty( $user_email ) || ! in_array( (int) $enable_sent_email, array( 0, 1 ) ) ) {
			return false;
		}
		$user_email = sanitize_email( $user_email );
		if ( empty( $user_email ) ) {
			return false;
		}
		$user_model = new Users();
		global $wpdb;
		$where     = $wpdb->prepare( 'user_email = %s', [ $user_email ] );
		$user_data = $user_model->getWhere( $where, '*', true );
		$status    = false;
		if ( ! empty( $user_data ) && is_object( $user_data ) && isset( $user_data->id ) && $user_data->id > 0 ) {
			$data   = [ 'is_allow_send_email' => (int) $enable_sent_email ];
			$status = $user_model->insertOrUpdate( $data, $user_data->id );
		}

		return $status;
	}

}