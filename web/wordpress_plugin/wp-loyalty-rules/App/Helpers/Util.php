<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Helpers;
defined( 'ABSPATH' ) or die;

class Util {
	/**
	 * render template.
	 *
	 * @param string $file File path.
	 * @param array $data Template data.
	 * @param bool $display Display or not.
	 *
	 * @return string|void
	 */
	public static function renderTemplate( string $file, array $data = [], bool $display = true ) {
		$content = '';
		if ( file_exists( $file ) ) {
			ob_start();
			extract( $data );
			include $file;
			$content = ob_get_clean();
		}
		if ( $display ) {
			echo $content;//phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		} else {
			return $content;
		}
	}

	/**
	 * Check if basic security is valid.
	 *
	 * @param string $nonce_name Name of the nonce.
	 *
	 * @return bool Indicates if basic security is valid or not.
	 */
	public static function isBasicSecurityValid( $nonce_name = '' ) {
		$input     = new Input();
		$wlr_nonce = (string) $input->post_get( 'wlr_nonce', '' );
		if ( ! Woocommerce::hasAdminPrivilege() || ! Woocommerce::verify_nonce( $wlr_nonce, $nonce_name ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Returns a list of files for export.
	 *
	 * @return array
	 */
	public static function exportFileList() {
		$path             = WLR_PLUGIN_PATH . 'App/File';
		$file_name        = 'customer_export_*.*';
		$delete_file_path = trim( $path . '/' . $file_name );
		$download_list    = array();
		foreach ( glob( $delete_file_path ) as $file_path ) {
			if ( file_exists( $file_path ) ) {
				$file_detail            = new \stdClass();
				$file_detail->file_name = basename( $file_path );
				$file_detail->file_path = $file_path;
				$file_detail->file_url  = rtrim( WLR_PLUGIN_URL, '/' ) . '/App/File/' . $file_detail->file_name;
				$download_list[]        = $file_detail;
			}
		}

		return $download_list;
	}

	/**
	 * Checks if a plugin is active.
	 *
	 * @param string $plugin_path The path of the plugin to check.
	 *
	 * @return bool True if the plugin is active, false otherwise.
	 */
	public static function isPluginActive( $plugin_path ) {
		if ( empty( $plugin_path ) || ! is_string( $plugin_path ) ) {
			return false;
		}
		$active_plugins = apply_filters( 'active_plugins', get_option( 'active_plugins', array() ) );
		if ( is_multisite() ) {
			$active_plugins = array_merge( $active_plugins, get_site_option( 'active_sitewide_plugins', array() ) );
		}

		return in_array( $plugin_path, $active_plugins ) || array_key_exists( $plugin_path, $active_plugins );
	}

	/**
	 * Determines if the search is available.
	 *
	 * @param array|string $search_terms The search terms to check.
	 * @param mixed $search_values The values to search through.
	 *
	 * @return bool  Returns true if all search terms are found in the search values, false otherwise.
	 */
	public static function isSearchAvailable( $search_terms, $search_values ) {
		if ( ! is_array( $search_terms ) ) {
			return false;
		}
		if ( is_string( $search_values ) ) {
			$search_values = [ $search_values ];
		}
		if ( is_object( $search_values ) ) {
			$search_values = (array) $search_values;
		}
		$is_all_success = [];
		foreach ( $search_terms as $search ) {
			$status = false;
			foreach ( $search_values as $search_value ) {
				if ( strpos( $search_value, $search ) !== false ) {
					$status = true;
				}
			}
			$is_all_success[] = $status;
		}

		return ! in_array( false, $is_all_success );
	}

	/**
	 * Returns a list of valid search words.
	 *
	 * @param array $terms The array of search terms.
	 *
	 * @return array The array of valid search words.
	 */
	public static function getValidSearchWords( $terms ) {
		$valid_terms   = [];
		$invalid_words = self::getSearchStopWords();

		foreach ( $terms as $term ) {
			// keep before/after spaces when term is for exact match, otherwise trim quotes and spaces.
			if ( preg_match( '/^".+"$/', $term ) ) {
				$term = trim( $term, "\"'" );
			} else {
				$term = trim( $term, "\"' " );
			}
			// Avoid single A-Z and single dashes.
			if ( empty( $term ) || ( strlen( $term ) <= 0 && preg_match( '/^[a-z\-]$/i', $term ) ) ) {
				continue;
			}

			if ( in_array( wc_strtolower( $term ), $invalid_words, true ) ) {
				continue;
			}

			$valid_terms[] = $term;
		}

		return $valid_terms;
	}

	/**
	 * Returns a list of search stopwords.
	 *
	 * This method retrieves a comma-separated list of very common words that should be excluded from a search, such as "a", "an", and "the". These words are commonly known as "stopwords". Translators should not simply translate individual words into their language. Instead, they should provide commonly accepted stopwords in their language.
	 *
	 * @return array Returns an array of search stopwords.
	 */
	protected static function getSearchStopWords() {
		// Translators: This is a comma-separated list of very common words that should be excluded from a search, like a, an, and the. These are usually called "stopwords". You should not simply translate these individual words into your language. Instead, look for and provide commonly accepted stopwords in your language.
		return array_map(
			'wc_strtolower',
			array_map(
				'trim',
				explode(
					',',
					_x(
						'about,an,are,as,at,be,by,com,for,from,how,in,is,it,of,on,or,that,the,this,to,was,what,when,where,who,will,with,www',
						'Comma-separated list of search stopwords in your language',
						'wp-loyalty-rules'
					)
				)
			)
		);
	}

	public static function getTemplatePath( $template_name, $is_page_content = true ) {
		$check_path_content = '/wployalty/';
		if ( $is_page_content ) {
			$check_path_content = '/wployalty/page-content/';
		}
		$template_path = '';
		if ( file_exists( get_template_directory() . $check_path_content . $template_name ) || ! file_exists( get_template_directory() . '/' . $template_name ) ) {
			$template_path = trim( $check_path_content, '/' );
		}

		return $template_path;
	}

	public static function getImageUrl( $file_name, $folder = 'add-ons' ) {
		return 'https://static.flycart.net/wployalty/image/' . $folder . '/' . $file_name . '/' . $file_name . '.png';
	}

	/**
	 * Check the plugin are active or not.
	 *
	 * @param string $plugin_path Plugin path.
	 *
	 * @return bool
	 */
	public static function isActive( string $plugin_path ): bool {
		$active_plugins = apply_filters( 'active_plugins', get_option( 'active_plugins', [] ) );
		if ( is_multisite() ) {
			$active_plugins = array_merge( $active_plugins, get_site_option( 'active_sitewide_plugins', [] ) );
		}

		return in_array( $plugin_path, $active_plugins ) || array_key_exists( $plugin_path, $active_plugins );
	}

	/**
	 * Is object have search word.
	 *
	 * @param string $search Search word.
	 * @param object $object Search object.
	 * @param array $fields Search fields.
	 *
	 * @return bool
	 */
	public static function isSearchHaveIt( string $search, $object, array $fields = [] ): bool {
		if ( empty( $search ) || empty( $fields ) || empty( $object ) ) {
			return true;
		}

		preg_match_all( '/".*?("|$)|((?<=[\t ",+])|^)[^\t ",+]+/', $search, $matches );
		$search_keys = Util::getValidSearchWords( $matches[0] );
		if ( empty( $search_keys ) ) {
			return false;
		}

		foreach ( $fields as $field ) {
			if ( ! empty( $field ) && ! empty( $object->$field ) ) {

				foreach ( $search_keys as $search_key ) {
					if ( strpos( strtolower( $object->$field ), strtolower( $search_key ) ) !== false ) {
						return true;
					}
				}
			}
		}

		return false;
	}
}