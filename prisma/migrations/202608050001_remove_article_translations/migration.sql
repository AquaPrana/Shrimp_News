-- Preserve the complete multilingual table unchanged for rollback/audit.
RENAME TABLE `Article` TO `ArticleMultilingualArchive`;

-- The live publishing table now stores one canonical English version only.
CREATE TABLE `Article` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `excerpt` VARCHAR(191) NULL,
  `imageUrl` VARCHAR(191) NULL,
  `mainCategory` VARCHAR(191) NOT NULL DEFAULT 'india',
  `category` VARCHAR(191) NOT NULL,
  `isPublished` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `Article_slug_key`(`slug`),
  INDEX `Article_mainCategory_idx`(`mainCategory`),
  INDEX `Article_category_idx`(`category`),
  INDEX `Article_isPublished_createdAt_idx`(`isPublished`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `Article` (
  `id`, `title`, `slug`, `content`, `excerpt`, `imageUrl`,
  `mainCategory`, `category`, `isPublished`, `createdAt`, `updatedAt`
)
SELECT
  `id`,
  COALESCE(NULLIF(TRIM(`titleEn`), ''), `title`),
  `slug`,
  COALESCE(NULLIF(TRIM(`contentEn`), ''), `content`),
  COALESCE(NULLIF(TRIM(`summaryEn`), ''), `excerpt`),
  `imageUrl`, `mainCategory`, `category`, `isPublished`, `createdAt`, `updatedAt`
FROM `ArticleMultilingualArchive`
WHERE `language` = 'en';
