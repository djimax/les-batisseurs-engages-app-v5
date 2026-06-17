CREATE TABLE `actor_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorId` int NOT NULL,
	`projectId` int,
	`role` varchar(100) NOT NULL,
	`permissions` json DEFAULT ('[]'),
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `actor_roles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `actors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`role` varchar(100) NOT NULL,
	`responsibilities` text,
	`permissions` json DEFAULT ('[]'),
	`photoUrl` text,
	`status` enum('active','inactive','on_leave') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `actors_id` PRIMARY KEY(`id`)
);
