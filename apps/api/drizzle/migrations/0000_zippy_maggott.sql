CREATE TABLE `activities` (
	`activity_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` real DEFAULT 0 NOT NULL,
	`override_points` integer DEFAULT 0,
	`created_at` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT 0 NOT NULL,
	`start_date` integer DEFAULT 0 NOT NULL,
	`end_date` integer DEFAULT 0 NOT NULL,
	`game_id` text,
	`system_id` text,
	`room_id` text,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`game_id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`system_id`) REFERENCES `systems`(`system_id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`room_id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `ix_activities_name` ON `activities` (`name`);--> statement-breakpoint
CREATE INDEX `ix_activities_game` ON `activities` (`game_id`);--> statement-breakpoint
CREATE INDEX `ix_activities_start_date` ON `activities` (`start_date`);--> statement-breakpoint
CREATE TABLE `benefits` (
	`benefit_id` text PRIMARY KEY NOT NULL,
	`level_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`level_id`) REFERENCES `levels_tiers`(`level_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ix_benefits_level` ON `benefits` (`level_id`);--> statement-breakpoint
CREATE TABLE `categories` (
	`category_id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ix_categories_kind` ON `categories` (`kind`);--> statement-breakpoint
CREATE UNIQUE INDEX `ix_categories_name` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `entity_categories` (
	`entity_category_id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`category_id` text NOT NULL,
	`created_at` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`category_id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `ix_entity_cat_entity` ON `entity_categories` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `ix_entity_cat_category` ON `entity_categories` (`category_id`);--> statement-breakpoint
CREATE TABLE `games` (
	`game_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ix_games_name` ON `games` (`name`);--> statement-breakpoint
CREATE TABLE `levels_tiers` (
	`level_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`min_points` integer NOT NULL,
	`discount_products` integer DEFAULT 0,
	`discount_activities` integer DEFAULT 0,
	`discount_games` integer DEFAULT 0,
	`fixed_products` integer DEFAULT false NOT NULL,
	`fixed_activities` integer DEFAULT false NOT NULL,
	`fixed_games` integer DEFAULT false NOT NULL,
	`default_level` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ix_levels_tiers_threshold` ON `levels_tiers` (`min_points`);--> statement-breakpoint
CREATE INDEX `ix_levels_default` ON `levels_tiers` (`default_level`);--> statement-breakpoint
CREATE INDEX `ix_levels_sort_order` ON `levels_tiers` (`sort_order`);--> statement-breakpoint
CREATE TABLE `loyalty_configs` (
	`config_id` text PRIMARY KEY NOT NULL,
	`trigger_key` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`name` text NOT NULL,
	`config_json` text NOT NULL,
	`created_at` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ix_loyalty_configs_trigger` ON `loyalty_configs` (`trigger_key`);--> statement-breakpoint
CREATE INDEX `ix_loyalty_configs_active` ON `loyalty_configs` (`active`);--> statement-breakpoint
CREATE TABLE `member_prizes_claimed` (
	`claim_id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`level_id` text NOT NULL,
	`claimed_at` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`member_id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`level_id`) REFERENCES `levels_tiers`(`level_id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_member_prize_level` ON `member_prizes_claimed` (`member_id`,`level_id`);--> statement-breakpoint
CREATE TABLE `members` (
	`member_id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text,
	`phone` text,
	`telegram_user_id` text,
	`joined_at` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`points_balance` integer DEFAULT 0 NOT NULL,
	`level_id` text NOT NULL,
	`referred_by` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`level_id`) REFERENCES `levels_tiers`(`level_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`referred_by`) REFERENCES `members`(`member_id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `points_ledger` (
	`entry_id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`occurred_at` integer DEFAULT 0 NOT NULL,
	`delta` integer NOT NULL,
	`balance_after` integer NOT NULL,
	`activity_id` text,
	`product_id` text,
	`admin_note` text,
	`idempotency_key` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`member_id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`activity_id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `ix_points_ledger_member_time` ON `points_ledger` (`member_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `ix_points_ledger_activity` ON `points_ledger` (`member_id`,`activity_id`);--> statement-breakpoint
CREATE INDEX `ix_points_ledger_product` ON `points_ledger` (`member_id`,`product_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `ux_points_ledger_member_idem` ON `points_ledger` (`member_id`,`idempotency_key`);--> statement-breakpoint
CREATE TABLE `prizes` (
	`prize_id` text PRIMARY KEY NOT NULL,
	`level_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`level_id`) REFERENCES `levels_tiers`(`level_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ix_prizes_level` ON `prizes` (`level_id`);--> statement-breakpoint
CREATE INDEX `ix_prizes_sort_order` ON `prizes` (`sort_order`);--> statement-breakpoint
CREATE TABLE `products` (
	`product_id` text PRIMARY KEY NOT NULL,
	`sku` text,
	`name` text NOT NULL,
	`price` real DEFAULT 0 NOT NULL,
	`override_points` integer DEFAULT 0,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_products_sku` ON `products` (`sku`);--> statement-breakpoint
CREATE INDEX `ix_products_active` ON `products` (`active`);--> statement-breakpoint
CREATE UNIQUE INDEX `ix_products_name` ON `products` (`name`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`room_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`created_at` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ix_rooms_name` ON `rooms` (`name`);--> statement-breakpoint
CREATE TABLE `systems` (
	`system_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`game_id` text NOT NULL,
	`created_at` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`game_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ix_game_system_game` ON `systems` (`game_id`);--> statement-breakpoint
CREATE INDEX `ix_systems_name` ON `systems` (`name`);
