-- Migration 0039: add deliveredAt, readAt, errorInfo to whatsapp_messages
ALTER TABLE `whatsapp_messages`
  ADD COLUMN `deliveredAt` TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN `readAt` TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN `errorInfo` TEXT NULL DEFAULT NULL;

-- Optional: set default values for existing rows (no-op)
-- UPDATE `whatsapp_messages` SET `deliveredAt` = NULL, `readAt` = NULL WHERE `deliveredAt` IS NULL;
