CREATE TABLE `crawl_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`base_url` text NOT NULL,
	`status` text NOT NULL,
	`max_pages` integer,
	`completed` integer,
	`total` integer,
	`created_at` integer NOT NULL,
	`completed_at` integer
);
