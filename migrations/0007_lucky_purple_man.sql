CREATE TABLE `settlement_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ad_id` integer NOT NULL,
	`org_id` text NOT NULL,
	`type` text NOT NULL,
	`quantity` integer,
	`period_start` integer,
	`period_end` integer,
	`total_days` integer,
	`memo` text,
	`performed_by_user_id` text NOT NULL,
	`performed_by_user_name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_settlement_logs_org_id` ON `settlement_logs` (`org_id`);--> statement-breakpoint
CREATE INDEX `idx_settlement_logs_ad_id` ON `settlement_logs` (`ad_id`);--> statement-breakpoint
CREATE INDEX `idx_settlement_logs_org_created` ON `settlement_logs` (`org_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `settlements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ad_id` integer NOT NULL,
	`org_id` text NOT NULL,
	`agency_org_id` text,
	`agency_name` text,
	`advertiser_org_id` text,
	`advertiser_name` text,
	`quantity` integer NOT NULL,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`total_days` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`confirmed_at` integer,
	`confirmed_by_user_id` text,
	`memo` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_settlements_org_id` ON `settlements` (`org_id`);--> statement-breakpoint
CREATE INDEX `idx_settlements_org_created` ON `settlements` (`org_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_settlements_status` ON `settlements` (`status`);--> statement-breakpoint
CREATE INDEX `idx_settlements_ad_id` ON `settlements` (`ad_id`);