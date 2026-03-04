PRAGMA defer_foreign_keys=on;--> statement-breakpoint
CREATE TABLE `__new_promotions` (
	`promo_id` text PRIMARY KEY NOT NULL,
	`code` text,
	`mode` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`active` integer DEFAULT true NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`combinable` integer DEFAULT false NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`start_date` integer DEFAULT -1 NOT NULL,
	`end_date` integer DEFAULT -1 NOT NULL,
	`usage_remaining` integer,
	`config` text NOT NULL,
	`created_at` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_promotions`("promo_id", "code", "mode", "name", "description", "active", "priority", "combinable", "version", "start_date", "end_date", "usage_remaining", "config", "created_at", "updated_at") SELECT "promo_id", "code", "mode", "name", "description", "active", "priority", "combinable", "version", coalesce("start_date", -1), coalesce("end_date", -1), "usage_remaining", "config", "created_at", "updated_at" FROM `promotions`;--> statement-breakpoint
DROP TABLE `promotions`;--> statement-breakpoint
ALTER TABLE `__new_promotions` RENAME TO `promotions`;--> statement-breakpoint
PRAGMA defer_foreign_keys=off;--> statement-breakpoint
CREATE UNIQUE INDEX `ux_promotions_code` ON `promotions` (`code`);--> statement-breakpoint
CREATE INDEX `ix_promotions_mode` ON `promotions` (`mode`);--> statement-breakpoint
CREATE INDEX `ix_promotions_active` ON `promotions` (`active`);--> statement-breakpoint
CREATE INDEX `ix_promotions_priority` ON `promotions` (`priority`);--> statement-breakpoint
CREATE INDEX `ix_promotions_start_date` ON `promotions` (`start_date`);--> statement-breakpoint
CREATE INDEX `ix_promotions_end_date` ON `promotions` (`end_date`);