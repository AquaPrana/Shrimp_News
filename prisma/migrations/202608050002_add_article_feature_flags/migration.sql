ALTER TABLE `Article`
  ADD COLUMN `isFeatured` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `isPopular` BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX `Article_isPublished_isFeatured_createdAt_idx`
  ON `Article`(`isPublished`, `isFeatured`, `createdAt`);

CREATE INDEX `Article_isPublished_isPopular_createdAt_idx`
  ON `Article`(`isPublished`, `isPopular`, `createdAt`);
