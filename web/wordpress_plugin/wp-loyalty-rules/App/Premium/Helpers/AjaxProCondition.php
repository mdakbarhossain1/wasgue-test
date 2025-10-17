<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App\Premium\Helpers;
defined( 'ABSPATH' ) or die();

use WC_Data_Store;
use Wlr\App\Helpers\Base;
use Wlr\App\Models\Users;

class AjaxProCondition extends Base {
	public static $instance = null;
	protected static $products = array();
	public $search_result_limit = 20;

	public static function getInstance( array $config = array() ) {
		if ( ! self::$instance ) {
			self::$instance = new self( $config );
		}

		return self::$instance;
	}

	function ajaxProductAttributes() {
		global $wc_product_attributes, $wpdb;
		$query = (string) self::$input->post( 'q', '' );
		$query = esc_sql( stripslashes( $query ) );

		/*$taxonomies = array_map( function ( $item ) {
			return "'$item'";
		}, array_keys( $wc_product_attributes ) );

		$taxonomies = implode( ', ', $taxonomies );*/
		$taxonomies             = array_keys( $wc_product_attributes );
		$taxonomies_placeholder = implode( ', ', array_fill( 0, count( $taxonomies ), '%s' ) );
		//phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$items = $wpdb->get_results( $wpdb->prepare( "SELECT $wpdb->terms.term_id, $wpdb->terms.name, taxonomy FROM $wpdb->term_taxonomy INNER JOIN $wpdb->terms USING (term_id) WHERE taxonomy in ($taxonomies_placeholder) AND $wpdb->terms.name  like %s", array_merge( $taxonomies, [ '%' . $wpdb->esc_like( $query ) . '%' ] ) ) );

		/*$items      = $wpdb->get_results( "
			SELECT $wpdb->terms.term_id, $wpdb->terms.name, taxonomy
			FROM $wpdb->term_taxonomy INNER JOIN $wpdb->terms USING (term_id)
			WHERE taxonomy in ($taxonomies) AND $wpdb->terms.name  like '%$query%'" );*/

		return array_map( function ( $term ) use ( $wc_product_attributes ) {
			$attribute = $wc_product_attributes[ $term->taxonomy ]->attribute_label;

			return array(
				'value' => (string) $term->term_id,
				'label' => $attribute . ': ' . $term->name,
			);
		}, $items );
	}

	function ajaxProductCategory() {
		$taxonomy = apply_filters( 'wlr_category_taxonomies', array( 'product_cat' ) );
		if ( ! is_array( $taxonomy ) ) {
			$taxonomy = array( 'product_cat' );
		}
		//For loading all language categories in select box.
		global $sitepress;
		if ( ! empty( $sitepress ) ) {
			remove_filter( 'get_terms_args', array( $sitepress, 'get_terms_args_filter' ), 10 );
			remove_filter( 'get_term', array( $sitepress, 'get_term_adjust_id' ), 1 );
			remove_filter( 'terms_clauses', array( $sitepress, 'terms_clauses' ), 10 );
		}
		$query = self::$input->post( 'q', '' );
		$query = esc_sql( stripslashes( $query ) );
		$terms = get_terms( array(
			'taxonomy'   => $taxonomy,
			'name__like' => $query,
			'hide_empty' => false,
			'number'     => $this->search_result_limit
		) );

		return array_map( function ( $term ) {
			$parant_name = '';
			if ( ! empty( $term->parent ) ) {
				if ( function_exists( 'get_the_category_by_ID' ) ) {
					$parant_names    = get_the_category_by_ID( (int) $term->parent );
					$parant_name     = $parant_names . ' -> ';
					$parant_category = get_term( (int) $term->parent );
					if ( is_object( $parant_category ) && ! empty( $parant_category->parent ) ) {
						$grant_parant_names    = get_the_category_by_ID( (int) $parant_category->parent );
						$parant_name           = $grant_parant_names . ' -> ' . $parant_names . ' -> ';
						$grant_parant_category = get_term( (int) $parant_category->parent );
						if ( is_object( $grant_parant_category ) && ! empty( $grant_parant_category->parent ) ) {
							$grant_grant_parant_names = get_the_category_by_ID( (int) $grant_parant_category->parent );
							$parant_name              = $grant_grant_parant_names . ' -> ' . $grant_parant_names . ' -> ' . $parant_names . ' -> ';
						}
					}
				}
			}

			return array(
				'value' => (string) $term->term_id,
				'label' => $parant_name . $term->name,
			);
		}, $terms );
	}

	function ajaxProductSku() {
		global $wpdb;
		$query = self::$input->post( 'q', '' );
		$query = esc_sql( stripslashes( $query ) );
		//phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$results = $wpdb->get_results( $wpdb->prepare( "SELECT DISTINCT meta_value FROM $wpdb->postmeta WHERE meta_key = %s AND meta_value  like %s", '_sku', "%" . $wpdb->esc_like( $query ) . "%" ) );

		return array_map( function ( $result ) {
			$p_title = '';
			if ( function_exists( 'wc_get_product_id_by_sku' ) && function_exists( 'get_the_title' ) ) {
				$p_id = wc_get_product_id_by_sku( $result->meta_value );
				if ( $p_id > 0 ) {
					$p_title = $p_id . ': ' . html_entity_decode( get_the_title( $p_id ) );
					if ( ! empty( $p_title ) ) {
						$p_title = 'SKU: ' . $result->meta_value . ' ( ' . $p_title . ' )';
					}
				}
			}
			if ( empty( $p_title ) ) {
				$p_title = 'SKU: ' . $result->meta_value;
			}

			return array(
				'value' => (string) $result->meta_value,
				'label' => $p_title,
			);
		}, $results );
	}

	function ajaxProductTags() {
		$query = self::$input->post( 'q', '' );
		$terms = get_terms( array(
			'taxonomy'   => 'product_tag',
			'name__like' => $query,
			'hide_empty' => false,
			'number'     => $this->search_result_limit
		) );

		return array_map( function ( $term ) {
			return array(
				'value' => (string) $term->term_id,
				'label' => $term->name,
			);
		}, $terms );
	}

	function ajaxProducts() {
		$query = self::$input->post( 'q', '' );
		//to disable other search classes
		remove_all_filters( 'woocommerce_data_stores' );
		$data_store = WC_Data_Store::load( 'product' );
		$ids        = $data_store->search_products( $query, '', true, false, $this->search_result_limit );

		return array_values( array_filter( array_map( function ( $post_id ) {
			$product = self::$woocommerce_helper->getProduct( $post_id );
			if ( $product->has_child() ) {
				return false;
			}

			return array(
				'value' => (string) $post_id,
				'label' => '#' . $post_id . ' ' . html_entity_decode( get_the_title( $post_id ) ),
			);
		}, array_filter( $ids ) ) ) );
	}

	function ajaxCustomer() {
		$query = self::$input->post( 'q', '' );
		/*//to disable other search classes
		remove_all_filters('woocommerce_data_stores');
		$data_store = WC_Data_Store::load('customer');
		$customers = $data_store->search_customers($query, '', true, false, $this->search_result_limit);
		return array_values(array_map(function ($user_id) {
			return array(
				'value' => (string)$user_id,
				'label' => '#' . $user_id . ' ' . get_user_by('id', $user_id)->user_email,
			);
		}, array_filter($customers)));*/
		$query_data = array(
			'id'     => array(
				'operator' => '>',
				'value'    => 0
			),
			'limit'  => $this->search_result_limit,
			'offset' => 0,
			'search' => $query
		);
		$user       = new Users();
		$items      = $user->getQueryData( $query_data, '*', array( 'user_email', 'id' ), true, false );

		return array_values( array_map( function ( $user_data ) {
			return array(
				'value' => (string) $user_data->user_email,
				'label' => '#' . $user_data->id . ' ' . $user_data->user_email,
			);
		}, array_filter( $items ) ) );
	}
}