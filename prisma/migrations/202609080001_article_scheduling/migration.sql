-- Additive migration for the active Prisma Article table (not legacy articles).
ALTER TABLE `Article`
  ADD COLUMN `scheduledAt` DATETIME(3) NULL,
  ADD COLUMN `publishedAt` DATETIME(3) NULL,
  ADD INDEX `Article_isPublished_scheduledAt_idx` (`isPublished`, `scheduledAt`);

-- Preserve the publication dates previously displayed for existing stories.
UPDATE `Article` SET `publishedAt` = `createdAt`
WHERE `isPublished` = TRUE AND `publishedAt` IS NULL;
