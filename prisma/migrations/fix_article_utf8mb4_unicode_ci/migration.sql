-- Fix Illegal mix of collations for Article search (LIKE / contains).
-- Safe: converts charset/collation only; does not delete or rewrite row values.
-- Run against local and Hostinger MySQL as needed.

ALTER TABLE `Article`
CONVERT TO CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Article` MODIFY `title` VARCHAR(191) NOT NULL CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Article` MODIFY `slug` VARCHAR(191) NOT NULL CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Article` MODIFY `content` LONGTEXT NOT NULL CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Article` MODIFY `excerpt` TEXT NULL CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Article` MODIFY `imageUrl` TEXT NULL CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Article` MODIFY `mainCategory` VARCHAR(191) NOT NULL DEFAULT 'india' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Article` MODIFY `category` VARCHAR(191) NOT NULL CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Article` MODIFY `language` VARCHAR(191) NOT NULL DEFAULT 'en' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Article` MODIFY `translationGroupId` VARCHAR(191) NULL CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Article` MODIFY `titleEn` TEXT NULL CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Article` MODIFY `summaryEn` TEXT NULL CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Article` MODIFY `contentEn` LONGTEXT NULL CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Article` MODIFY `titleTe` TEXT NULL CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Article` MODIFY `summaryTe` TEXT NULL CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Article` MODIFY `contentTe` LONGTEXT NULL CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Article` MODIFY `titleHi` TEXT NULL CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Article` MODIFY `summaryHi` TEXT NULL CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Article` MODIFY `contentHi` LONGTEXT NULL CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
