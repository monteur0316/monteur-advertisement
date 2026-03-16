CREATE TABLE `settlements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`org_id` text NOT NULL,
	`agency_org_id` text NOT NULL,
	`agency_name` text NOT NULL,
	`advertiser_org_id` text NOT NULL,
	`advertiser_name` text NOT NULL,
	`quantity` integer NOT NULL,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`total_days` integer NOT NULL,
	`author_id` text NOT NULL,
	`author_name` text NOT NULL,
	`memo` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_settlements_org_id` ON `settlements` (`org_id`);--> statement-breakpoint
CREATE INDEX `idx_settlements_org_created` ON `settlements` (`org_id`,`created_at`);