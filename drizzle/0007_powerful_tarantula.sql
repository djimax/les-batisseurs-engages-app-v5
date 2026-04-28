CREATE TABLE `user_widget_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`widgetId` varchar(100) NOT NULL,
	`widgetType` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`position` int NOT NULL,
	`isVisible` boolean NOT NULL DEFAULT true,
	`width` int NOT NULL DEFAULT 1,
	`height` int NOT NULL DEFAULT 1,
	`config` json DEFAULT ('{}'),
	`refreshInterval` int DEFAULT 300,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_widget_preferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user_widget_preferences` ADD CONSTRAINT `user_widget_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;