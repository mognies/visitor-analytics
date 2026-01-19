CREATE TABLE `block_durations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`block_id` text NOT NULL,
	`path` text NOT NULL,
	`duration` integer NOT NULL,
	`timestamp` integer NOT NULL,
	`visitor_id` text NOT NULL,
	`created_at` integer NOT NULL
);
