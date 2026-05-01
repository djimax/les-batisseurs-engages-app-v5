-- Add memberId column to members table with default value
ALTER TABLE `members` ADD `memberId` varchar(50) DEFAULT CONCAT('MEM-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', SUBSTRING(MD5(RAND()), 1, 4));

-- Add adhesionId column to adhesions table with default value
ALTER TABLE `adhesions` ADD `adhesionId` varchar(50) DEFAULT CONCAT('ADH-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', SUBSTRING(MD5(RAND()), 1, 4));

-- Update existing records with unique IDs
UPDATE `members` SET `memberId` = CONCAT('MEM-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(id, 4, '0')) WHERE `memberId` LIKE 'MEM-%' OR `memberId` IS NULL;

UPDATE `adhesions` SET `adhesionId` = CONCAT('ADH-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(id, 4, '0')) WHERE `adhesionId` LIKE 'ADH-%' OR `adhesionId` IS NULL;

-- Add unique constraints
ALTER TABLE `members` MODIFY `memberId` varchar(50) NOT NULL;
ALTER TABLE `adhesions` MODIFY `adhesionId` varchar(50) NOT NULL;

ALTER TABLE `members` ADD CONSTRAINT `members_memberId_unique` UNIQUE(`memberId`);
ALTER TABLE `adhesions` ADD CONSTRAINT `adhesions_adhesionId_unique` UNIQUE(`adhesionId`);
