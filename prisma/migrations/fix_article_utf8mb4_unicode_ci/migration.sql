-- Normalize the canonical Article table created by
-- 202608050001_remove_article_translations. The multilingual source table is
-- preserved separately by that migration and is intentionally left unchanged.

ALTER TABLE `Article`
CONVERT TO CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Article` MODIFY `title` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
ALTER TABLE `Article` MODIFY `slug` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
ALTER TABLE `Article` MODIFY `content` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
ALTER TABLE `Article` MODIFY `excerpt` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;
ALTER TABLE `Article` MODIFY `imageUrl` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;
ALTER TABLE `Article` MODIFY `mainCategory` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'india';
ALTER TABLE `Article` MODIFY `category` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
