ALTER TABLE `activities` ADD `uppercase_name` text;--> statement-breakpoint
CREATE INDEX `ix_activities_uppercase_name` ON `activities` (`uppercase_name`);--> statement-breakpoint
ALTER TABLE `products` ADD `uppercase_name` text;--> statement-breakpoint
CREATE INDEX `ix_products_uppercase_name` ON `products` (`uppercase_name`);
