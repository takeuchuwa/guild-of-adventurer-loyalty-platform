CREATE TABLE `promotion_assignments` (
	`assignment_id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`promo_id` text NOT NULL,
	`status` text DEFAULT 'AVAILABLE' NOT NULL,
	`unique_code` text,
	`assigned_at` integer NOT NULL,
	`redeemed_at` integer,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`member_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`promo_id`) REFERENCES `promotions`(`promo_id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `ix_promo_assign_member_status` ON `promotion_assignments` (`member_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `ux_promo_assign_code` ON `promotion_assignments` (`unique_code`);--> statement-breakpoint
CREATE TABLE `promotions` (
	`promo_id` text PRIMARY KEY NOT NULL,
	`code` text,
	`mode` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`active` integer DEFAULT true NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`start_date` integer DEFAULT 0 NOT NULL,
	`end_date` integer DEFAULT 0 NOT NULL,
	`usage_remaining` integer,
	`config` text NOT NULL,
	`created_at` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_promotions_code` ON `promotions` (`code`);--> statement-breakpoint
CREATE INDEX `ix_promotions_mode` ON `promotions` (`mode`);--> statement-breakpoint
CREATE INDEX `ix_promotions_active` ON `promotions` (`active`);--> statement-breakpoint
CREATE INDEX `ix_promotions_priority` ON `promotions` (`priority`);--> statement-breakpoint
CREATE INDEX `ix_promotions_start_date` ON `promotions` (`start_date`);--> statement-breakpoint
CREATE INDEX `ix_promotions_end_date` ON `promotions` (`end_date`);