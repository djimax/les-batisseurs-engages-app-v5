CREATE TABLE `project_milestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`dueDate` timestamp NOT NULL,
	`status` enum('pending','in-progress','completed','delayed') NOT NULL DEFAULT 'pending',
	`completedAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_milestones_id` PRIMARY KEY(`id`)
);
