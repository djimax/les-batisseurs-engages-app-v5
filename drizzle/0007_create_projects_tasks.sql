-- Create projects table
CREATE TABLE IF NOT EXISTS `projects` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `description` text,
  `status` enum('planification','en_cours','suspendu','termine','annule') DEFAULT 'planification' NOT NULL,
  `priority` enum('Basse','Moyenne','Haute') DEFAULT 'Moyenne' NOT NULL,
  `startDate` timestamp,
  `endDate` timestamp,
  `budget` decimal(12,2) DEFAULT '0',
  `progress` int DEFAULT 0,
  `createdBy` int,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `projectId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `status` enum('pending','in_progress','completed','cancelled') DEFAULT 'pending' NOT NULL,
  `priority` enum('Basse','Moyenne','Haute') DEFAULT 'Moyenne' NOT NULL,
  `dueDate` timestamp,
  `assignedTo` int,
  `createdBy` int,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`assignedTo`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

-- Create project_members table for assigning members to projects
CREATE TABLE IF NOT EXISTS `project_members` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `projectId` int NOT NULL,
  `userId` int NOT NULL,
  `role` enum('lead','member','viewer') DEFAULT 'member' NOT NULL,
  `joinedAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_project_member` (`projectId`, `userId`),
  FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Create project_expenses table for budget tracking
CREATE TABLE IF NOT EXISTS `project_expenses` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `projectId` int NOT NULL,
  `description` varchar(255) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `category` varchar(100),
  `date` timestamp DEFAULT CURRENT_TIMESTAMP,
  `createdBy` int,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
