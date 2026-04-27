CREATE TABLE `quick_replies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`category` varchar(50),
	`isActive` int NOT NULL DEFAULT 1,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quick_replies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saved_searches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`searchQuery` varchar(500),
	`filterType` varchar(50),
	`dateRange` varchar(50),
	`messageType` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_searches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduled_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`content` text NOT NULL,
	`messageType` enum('text','template') NOT NULL DEFAULT 'text',
	`templateId` int,
	`templateName` varchar(255),
	`languageCode` varchar(20),
	`scheduledAt` timestamp NOT NULL,
	`status` enum('pending','sent','failed','cancelled') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`errorInfo` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scheduled_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `whatsapp_conversations` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `whatsapp_messages` ADD `replyToMessageId` int;