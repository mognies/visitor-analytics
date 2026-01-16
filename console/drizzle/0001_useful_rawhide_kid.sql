CREATE TABLE `pages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`path` text NOT NULL,
	`title` text,
	`description` text,
	`imported_at` integer NOT NULL,
	`base_url` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pages_url_unique` ON `pages` (`url`);