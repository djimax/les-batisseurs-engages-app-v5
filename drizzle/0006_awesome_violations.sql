CREATE TABLE `task_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`task_id` int NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_key` varchar(500) NOT NULL,
	`file_url` text NOT NULL,
	`file_size` int NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`uploaded_by` int NOT NULL,
	`uploaded_at` timestamp DEFAULT (now()),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `task_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `projects` RENAME COLUMN `name` TO `title`;--> statement-breakpoint
ALTER TABLE `projects` RENAME COLUMN `priority` TO `spent`;--> statement-breakpoint
ALTER TABLE `tasks` RENAME COLUMN `progress` TO `completedAt`;--> statement-breakpoint
ALTER TABLE `projects` MODIFY COLUMN `status` enum('planning','in-progress','on-hold','completed','cancelled') NOT NULL DEFAULT 'planning';--> statement-breakpoint
ALTER TABLE `projects` MODIFY COLUMN `spent` decimal(10,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `projects` MODIFY COLUMN `budget` decimal(10,2);--> statement-breakpoint
ALTER TABLE `projects` MODIFY COLUMN `createdBy` int NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` MODIFY COLUMN `status` enum('todo','in-progress','review','done','cancelled') NOT NULL DEFAULT 'todo';--> statement-breakpoint
ALTER TABLE `tasks` MODIFY COLUMN `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE `tasks` MODIFY COLUMN `completedAt` timestamp;--> statement-breakpoint
ALTER TABLE `tasks` MODIFY COLUMN `createdBy` int NOT NULL;--> statement-breakpoint
ALTER TABLE `task_attachments` ADD CONSTRAINT `task_attachments_task_id_tasks_id_fk` FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `task_attachments` ADD CONSTRAINT `task_attachments_uploaded_by_users_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;