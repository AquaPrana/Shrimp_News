-- Additive newsletter migration. Existing subscribers are preserved and activated.

ALTER TABLE `Subscriber`
  ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `subscribedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `welcomeEmailSent` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `welcomeEmailSentAt` DATETIME(3) NULL,
  ADD COLUMN `lastNewsletterSentAt` DATETIME(3) NULL,
  ADD COLUMN `unsubscribeToken` VARCHAR(64) NULL;

-- Preserve the original subscription date for every existing row.
UPDATE `Subscriber`
SET `subscribedAt` = `createdAt`;

-- MySQL RANDOM_BYTES is a cryptographically secure random generator.
UPDATE `Subscriber`
SET `unsubscribeToken` = LOWER(HEX(RANDOM_BYTES(32)))
WHERE `unsubscribeToken` IS NULL;

CREATE UNIQUE INDEX `Subscriber_unsubscribeToken_key`
  ON `Subscriber`(`unsubscribeToken`);
CREATE INDEX `Subscriber_isActive_subscribedAt_idx`
  ON `Subscriber`(`isActive`, `subscribedAt`);

CREATE TABLE `NewsletterDelivery` (
  `id` VARCHAR(191) NOT NULL,
  `subscriberId` VARCHAR(191) NOT NULL,
  `newsletterWeek` VARCHAR(10) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'processing',
  `sentAt` DATETIME(3) NULL,
  `errorMessage` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `NewsletterDelivery_subscriberId_newsletterWeek_key`
    (`subscriberId`, `newsletterWeek`),
  INDEX `NewsletterDelivery_newsletterWeek_status_idx`
    (`newsletterWeek`, `status`),
  PRIMARY KEY (`id`),
  CONSTRAINT `NewsletterDelivery_subscriberId_fkey`
    FOREIGN KEY (`subscriberId`) REFERENCES `Subscriber`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
