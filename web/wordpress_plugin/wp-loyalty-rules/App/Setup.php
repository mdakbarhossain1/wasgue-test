<?php
/**
 * @author      Wployalty (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-2.0.html
 * @link        https://www.wployalty.net
 * */

namespace Wlr\App;

use Wlr\App\Helpers\CompatibleCheck;
use Wlr\App\Models\EarnCampaign;
use Wlr\App\Models\EarnCampaignTransactions;
use Wlr\App\Models\Levels;
use Wlr\App\Models\Logs;
use Wlr\App\Models\PointsLedger;
use Wlr\App\Models\Referral;
use Wlr\App\Models\Rewards;
use Wlr\App\Models\RewardTransactions;
use Wlr\App\Models\UserRewards;
use Wlr\App\Models\Users;
use Exception;

defined( 'ABSPATH' ) or die;

class Setup {
	public static function init() {
		register_activation_hook( WLR_PLUGIN_FILE, [ self::class, 'activate' ] );
		add_action( 'wpmu_new_blog', [ self::class, 'onCreateBlog' ], 10, 6 );
		add_filter( 'wpmu_drop_tables', [ self::class, 'onDeleteBlog' ] );
		add_action( 'plugins_loaded', [ __CLASS__, 'maybeRunMigration' ] );
		add_action( 'upgrader_process_complete', [ self::class, 'maybeRunMigration' ] );
		add_filter( 'dbdelta_create_queries', [ self::class, 'createQueryCheck' ] );
	}

	/**
	 * Activates the plugin by performing the necessary checks and creating the required table.
	 *
	 * @return bool True if the plugin is successfully activated, false otherwise.
	 */
	public static function activate() {
		$check = new CompatibleCheck();
		if ( $check->init_check( true ) ) {
			try {
				self::createRequiredTable();
			} catch ( Exception $e ) {
				exit( esc_html( WLR_PLUGIN_NAME . __( 'Plugin required table creation failed.', 'wp-loyalty-rules' ) ) );
			}
		}

		return true;
	}

	/**
	 * Creates a new blog and performs necessary setup tasks if the plugin is active for the network.
	 *
	 * @param int $blog_id The ID of the new blog.
	 * @param int $user_id The ID of the user creating the blog.
	 * @param string $domain The domain of the new blog.
	 * @param string $path The path of the new blog.
	 * @param int $site_id The ID of the site associated with the blog.
	 * @param mixed $meta Additional meta-data for the blog.
	 *
	 * @return void
	 */
	public static function onCreateBlog( $blog_id, $user_id, $domain, $path, $site_id, $meta ) {
		if ( is_plugin_active_for_network( WLR_PLUGIN_FILE ) ) {
			switch_to_blog( $blog_id );
			self::createRequiredTable();
			restore_current_blog();
		}
	}

	/**
	 * Creates the required tables for the plugin.
	 *
	 * @throws Exception If the table creation fails.
	 */
	public static function createRequiredTable() {
		try {
			$user = new Users();
			$user->create();
			$earn_campaign = new EarnCampaign();
			$earn_campaign->create();
			$earn_campaign_transaction = new EarnCampaignTransactions();
			$earn_campaign_transaction->create();
			$rewards = new Rewards();
			$rewards->create();
			$reward_transaction = new RewardTransactions();
			$reward_transaction->create();
			$user_rewards = new UserRewards();
			$user_rewards->create();
			$referral = new Referral();
			$referral->create();
			$log_model = new Logs();
			$log_model->create();
			$levels = new Levels();
			$levels->create();
			$points_ledger = new PointsLedger();
			$points_ledger->create();
			do_action( 'wlr_create_required_table' );
		} catch ( Exception $e ) {
			exit( esc_html( WLR_PLUGIN_NAME . __( 'Plugin required table creation failed.', 'wp-loyalty-rules' ) ) );
		}
	}

	/**
	 * Add additional table names to the given array.
	 *
	 * @param array $tables The array to which table names should be added.
	 *
	 * @return array The modified array with additional table names.
	 */
	public static function onDeleteBlog( $tables ) {
		$models = [
			new Users(),
			new EarnCampaign(),
			new EarnCampaignTransactions(),
			new Rewards(),
			new RewardTransactions(),
			new UserRewards(),
			new Referral(),
			new Logs(),
			new Levels(),
			new PointsLedger()
		];
		foreach ( $models as $model ) {
			if ( is_a( $model, '\Wlr\App\Models\Base' ) ) {
				$tables[] = $model->getTableName();
			}
		}

		return $tables;
	}


	/**
	 * Maybe run database migration.
	 */
	public static function maybeRunMigration() {
		$db_version = get_option( 'wlr_version', '0.0.1' );

		if ( version_compare( $db_version, WLR_PLUGIN_VERSION, '<' ) ) {
			self::runMigration();
			update_option( 'wlr_version', WLR_PLUGIN_VERSION );
		}
	}

	/**
	 * Run database migration
	 */
	private static function runMigration() {
		$models = [
			new Users(),
			new EarnCampaign(),
			new EarnCampaignTransactions(),
			new Rewards(),
			new RewardTransactions(),
			new UserRewards(),
			new Referral(),
			new Logs(),
			new Levels(),
			new PointsLedger()
		];
		foreach ( $models as $model ) {
			if ( is_a( $model, '\Wlr\App\Models\Base' ) ) {
				$model->create();
			}
		}
		do_action( 'wlr_create_required_table' );
	}

	/**
	 * Modify the given array of queries by extracting and re-organizing table names.
	 *
	 * @param array $queries The array of queries to be modified.
	 *
	 * @return array The modified array of queries with extracted and re-organized table names.
	 */
	public static function createQueryCheck( $queries ) {
		if ( ! empty( $queries ) ) {
			foreach ( $queries as $key => $value ) {
				if ( $key == 'IF' && preg_match( '|CREATE TABLE IF NOT EXISTS ([^ ]*)|', $value, $matches ) ) {
					$key_name = trim( $matches[1], '`' );
					unset( $queries[ $key ] );
					$queries[ $key_name ] = $value;
				}
			}
		}

		return $queries;
	}
}