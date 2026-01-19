CREATE TABLE `page_blocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`page_id` integer NOT NULL,
	`block_name` text NOT NULL,
	`block_summary` text NOT NULL,
	`block_dom` text NOT NULL,
	`created_at` integer NOT NULL
);
