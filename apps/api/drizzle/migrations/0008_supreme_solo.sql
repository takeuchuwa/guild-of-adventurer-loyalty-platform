CREATE TABLE `member_promotion_usages` (
	`usage_id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`promo_id` text NOT NULL,
	`used_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`member_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`promo_id`) REFERENCES `promotions`(`promo_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ix_member_promo_usage_member` ON `member_promotion_usages` (`member_id`);--> statement-breakpoint
CREATE INDEX `ix_member_promo_usage_promo` ON `member_promotion_usages` (`promo_id`);