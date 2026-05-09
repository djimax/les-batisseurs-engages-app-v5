CREATE TABLE `cotisation_criteria` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`montantAnnuel` decimal(10,2) NOT NULL,
	`dateDebut` timestamp NOT NULL,
	`dateFin` timestamp NOT NULL,
	`joursRetardMax` int NOT NULL DEFAULT 30,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cotisation_criteria_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `adhesions` DROP INDEX `adhesions_adhesionId_unique`;--> statement-breakpoint
ALTER TABLE `adhesions` ADD `firstName` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `adhesions` ADD `lastName` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `adhesions` ADD `email` varchar(320);--> statement-breakpoint
ALTER TABLE `adhesions` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `adhesions` ADD `gender` enum('homme','femme','autre') DEFAULT 'autre' NOT NULL;--> statement-breakpoint
ALTER TABLE `members` ADD `cotisationStatus` enum('à_jour','en_retard','impayé','exempté') DEFAULT 'à_jour' NOT NULL;--> statement-breakpoint
ALTER TABLE `adhesions` DROP COLUMN `adhesionId`;