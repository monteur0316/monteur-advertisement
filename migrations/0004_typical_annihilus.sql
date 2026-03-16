CREATE TABLE `ads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`org_id` text NOT NULL,
	`author_id` text NOT NULL,
	`author_name` text NOT NULL,
	`quantity` integer NOT NULL,
	`days` integer NOT NULL,
	`work_start_date` integer NOT NULL,
	`work_end_date` integer NOT NULL,
	`product_url` text NOT NULL,
	`price_compare_url` text,
	`main_keyword` text NOT NULL,
	`memo` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_ads_org_id` ON `ads` (`org_id`);--> statement-breakpoint
CREATE INDEX `idx_ads_org_created` ON `ads` (`org_id`,`created_at`);