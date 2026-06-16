CREATE TABLE `group_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`memberId` int NOT NULL,
	`role` enum('member','coordinator','leader') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `group_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(150) NOT NULL,
	`description` text,
	`location` varchar(200) NOT NULL,
	`city` varchar(100) NOT NULL,
	`region` varchar(100),
	`country` varchar(100) DEFAULT 'France',
	`responsibleId` int,
	`responsibleName` varchar(150),
	`responsibleEmail` varchar(320),
	`responsiblePhone` varchar(20),
	`responsiblePhotoUrl` text,
	`status` enum('active','inactive','pending') NOT NULL DEFAULT 'active',
	`photoUrl` text,
	`memberCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `groups_id` PRIMARY KEY(`id`)
);
