CREATE TABLE `block_durations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`block_id` text NOT NULL,
	`path` text NOT NULL,
	`duration` integer NOT NULL,
	`timestamp` integer NOT NULL,
	`visitor_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `block_durations_unique_visit` ON `block_durations` (`visitor_id`,`block_id`,`path`,`timestamp`);--> statement-breakpoint
CREATE TABLE `page_blocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`page_id` integer NOT NULL,
	`block_name` text NOT NULL,
	`block_summary` text NOT NULL,
	`block_dom` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `path_durations_unique_visit` ON `path_durations` (`visitor_id`,`path`,`timestamp`);