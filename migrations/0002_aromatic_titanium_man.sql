CREATE TABLE `organization_hierarchy` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`clerk_org_id` text NOT NULL,
	`org_type` text NOT NULL,
	`parent_clerk_org_id` text,
	`depth` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_org_hierarchy_clerk_org_id` ON `organization_hierarchy` (`clerk_org_id`);--> statement-breakpoint
CREATE INDEX `idx_org_hierarchy_parent` ON `organization_hierarchy` (`parent_clerk_org_id`);--> statement-breakpoint
CREATE INDEX `idx_org_hierarchy_type` ON `organization_hierarchy` (`org_type`);