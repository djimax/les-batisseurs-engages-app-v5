-- Create users_local table for email/password authentication
CREATE TABLE IF NOT EXISTS `users_local` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL UNIQUE,
  `email` varchar(320) NOT NULL UNIQUE,
  `passwordHash` varchar(255) NOT NULL,
  `isEmailVerified` boolean DEFAULT false,
  `emailVerificationToken` varchar(255),
  `emailVerificationTokenExpiry` timestamp,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
