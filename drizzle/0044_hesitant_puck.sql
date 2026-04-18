CREATE TABLE `whatsapp_blocked_numbers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phone` varchar(20) NOT NULL,
	`reason` varchar(255),
	`blockedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsapp_blocked_numbers_id` PRIMARY KEY(`id`),
	CONSTRAINT `whatsapp_blocked_numbers_phone_unique` UNIQUE(`phone`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` enum('appointment','camp_registration','offer_lead') NOT NULL,
	`entityId` int NOT NULL,
	`notificationType` enum('booking_confirmation','reminder_24h','reminder_1h','post_visit_followup','cancellation','status_update','custom') NOT NULL,
	`phone` varchar(20) NOT NULL,
	`recipientName` varchar(255),
	`templateName` varchar(255),
	`messageContent` text,
	`variables` text,
	`status` enum('pending','sent','delivered','read','failed') NOT NULL DEFAULT 'pending',
	`metaMessageId` varchar(255),
	`errorMessage` text,
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`readAt` timestamp,
	`sentBy` int,
	`isAutomatic` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `wn_entity_idx` ON `whatsapp_notifications` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `wn_phone_idx` ON `whatsapp_notifications` (`phone`);--> statement-breakpoint
CREATE INDEX `wn_status_idx` ON `whatsapp_notifications` (`status`);--> statement-breakpoint
CREATE INDEX `wn_createdAt_idx` ON `whatsapp_notifications` (`createdAt`);