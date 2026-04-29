CREATE TABLE `member_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`name` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`member_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_member_settings_member_name` ON `member_settings` (`member_id`,`name`);--> statement-breakpoint
ALTER TABLE `members` ADD `birth_date` integer;