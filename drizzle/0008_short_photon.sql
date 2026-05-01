ALTER TABLE `adhesions` ADD `adhesionId` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `members` ADD `memberId` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `adhesions` ADD CONSTRAINT `adhesions_adhesionId_unique` UNIQUE(`adhesionId`);--> statement-breakpoint
ALTER TABLE `members` ADD CONSTRAINT `members_memberId_unique` UNIQUE(`memberId`);