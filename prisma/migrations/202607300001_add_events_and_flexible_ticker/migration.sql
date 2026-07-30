-- Additive migration only. Existing tables and legacy ticker columns are retained.

CREATE TABLE `Event` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `shortDescription` TEXT NULL,
  `description` LONGTEXT NULL,
  `startDate` DATETIME(3) NOT NULL,
  `endDate` DATETIME(3) NULL,
  `dateLabel` VARCHAR(191) NULL,
  `venue` VARCHAR(191) NOT NULL,
  `duration` VARCHAR(191) NULL,
  `category` VARCHAR(191) NOT NULL,
  `region` VARCHAR(191) NOT NULL,
  `audience` LONGTEXT NULL,
  `imageUrl` VARCHAR(191) NULL,
  `officialWebsite` VARCHAR(191) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
  `isFeatured` BOOLEAN NOT NULL DEFAULT false,
  `displayOrder` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `Event_slug_key`(`slug`),
  INDEX `Event_status_displayOrder_startDate_idx`(`status`, `displayOrder`, `startDate`),
  INDEX `Event_region_idx`(`region`),
  INDEX `Event_category_idx`(`category`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `TickerItem`
  ADD COLUMN `value` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `description` TEXT NULL,
  ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'market',
  ADD COLUMN `linkUrl` VARCHAR(191) NULL,
  ADD COLUMN `linkLabel` VARCHAR(191) NULL,
  ADD COLUMN `imageUrl` VARCHAR(191) NULL,
  ADD COLUMN `displayOrder` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `startsAt` DATETIME(3) NULL,
  ADD COLUMN `endsAt` DATETIME(3) NULL;

-- Preserve every legacy row and provide a non-empty flexible value immediately.
UPDATE `TickerItem`
SET
  `value` = CAST(`price` AS CHAR),
  `displayOrder` = `sortOrder`
WHERE `value` = '';

CREATE INDEX `TickerItem_isActive_displayOrder_createdAt_idx`
  ON `TickerItem`(`isActive`, `displayOrder`, `createdAt`);
CREATE INDEX `TickerItem_startsAt_idx` ON `TickerItem`(`startsAt`);
CREATE INDEX `TickerItem_endsAt_idx` ON `TickerItem`(`endsAt`);
