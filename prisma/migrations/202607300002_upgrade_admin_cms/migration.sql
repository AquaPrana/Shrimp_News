-- Additive CMS authentication upgrade. No content tables or rows are removed.

CREATE TABLE IF NOT EXISTS `Admin` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Admin_email_key`(`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Admin`
  ADD COLUMN IF NOT EXISTS `name` VARCHAR(191) NOT NULL DEFAULT 'Shrimp.News Admin',
  ADD COLUMN IF NOT EXISTS `role` VARCHAR(191) NOT NULL DEFAULT 'super_admin',
  ADD COLUMN IF NOT EXISTS `imageUrl` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `isActive` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS `sessionVersion` INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS `lastLoginAt` DATETIME(3) NULL,
  ADD COLUMN IF NOT EXISTS `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS `Admin_role_idx` ON `Admin`(`role`);
CREATE INDEX IF NOT EXISTS `Admin_isActive_idx` ON `Admin`(`isActive`);

CREATE TABLE IF NOT EXISTS `AdminSessionRecord` (
  `id` VARCHAR(191) NOT NULL,
  `adminId` VARCHAR(191) NOT NULL,
  `userAgent` TEXT NULL,
  `ipAddress` VARCHAR(191) NULL,
  `rememberMe` BOOLEAN NOT NULL DEFAULT false,
  `expiresAt` DATETIME(3) NOT NULL,
  `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `revokedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `AdminSessionRecord_adminId_revokedAt_expiresAt_idx`(`adminId`, `revokedAt`, `expiresAt`),
  CONSTRAINT `AdminSessionRecord_adminId_fkey`
    FOREIGN KEY (`adminId`) REFERENCES `Admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AdminPasswordReset` (
  `id` VARCHAR(191) NOT NULL,
  `adminId` VARCHAR(191) NOT NULL,
  `tokenHash` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `usedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `AdminPasswordReset_tokenHash_key`(`tokenHash`),
  INDEX `AdminPasswordReset_adminId_expiresAt_idx`(`adminId`, `expiresAt`),
  CONSTRAINT `AdminPasswordReset_adminId_fkey`
    FOREIGN KEY (`adminId`) REFERENCES `Admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AdminLoginAudit` (
  `id` VARCHAR(191) NOT NULL,
  `adminId` VARCHAR(191) NULL,
  `email` VARCHAR(191) NOT NULL,
  `success` BOOLEAN NOT NULL,
  `userAgent` TEXT NULL,
  `ipAddress` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `AdminLoginAudit_adminId_createdAt_idx`(`adminId`, `createdAt`),
  INDEX `AdminLoginAudit_email_createdAt_idx`(`email`, `createdAt`),
  CONSTRAINT `AdminLoginAudit_adminId_fkey`
    FOREIGN KEY (`adminId`) REFERENCES `Admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
