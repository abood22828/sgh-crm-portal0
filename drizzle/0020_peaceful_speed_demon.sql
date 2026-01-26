CREATE TABLE `whatsapp_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`messagesSent` int NOT NULL DEFAULT 0,
	`messagesReceived` int NOT NULL DEFAULT 0,
	`conversationsStarted` int NOT NULL DEFAULT 0,
	`averageResponseTime` int NOT NULL DEFAULT 0,
	`conversionRate` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsapp_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_auto_replies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`triggerType` enum('keyword','outside_hours','first_message','faq') NOT NULL,
	`triggerValue` varchar(500),
	`replyMessage` text NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`priority` int NOT NULL DEFAULT 0,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_auto_replies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_broadcasts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`templateId` int,
	`targetFilter` text,
	`recipientCount` int NOT NULL DEFAULT 0,
	`sentCount` int NOT NULL DEFAULT 0,
	`deliveredCount` int NOT NULL DEFAULT 0,
	`readCount` int NOT NULL DEFAULT 0,
	`failedCount` int NOT NULL DEFAULT 0,
	`status` enum('draft','scheduled','sending','completed','failed') NOT NULL DEFAULT 'draft',
	`scheduledAt` timestamp,
	`completedAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsapp_broadcasts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`customerName` varchar(255),
	`lastMessage` text,
	`lastMessageAt` timestamp,
	`unreadCount` int NOT NULL DEFAULT 0,
	`isImportant` int NOT NULL DEFAULT 0,
	`isArchived` int NOT NULL DEFAULT 0,
	`leadId` int,
	`appointmentId` int,
	`offerLeadId` int,
	`campRegistrationId` int,
	`assignedToUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`direction` enum('inbound','outbound') NOT NULL,
	`content` text NOT NULL,
	`messageType` enum('text','image','document','audio','video','location') NOT NULL DEFAULT 'text',
	`mediaUrl` varchar(500),
	`status` enum('sent','delivered','read','failed') NOT NULL DEFAULT 'sent',
	`whatsappMessageId` varchar(255),
	`sentBy` int,
	`isAutomated` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsapp_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('confirmation','reminder','thank_you','follow_up','cancellation','custom') NOT NULL,
	`content` text NOT NULL,
	`variables` text,
	`isActive` int NOT NULL DEFAULT 1,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_templates_id` PRIMARY KEY(`id`)
);
