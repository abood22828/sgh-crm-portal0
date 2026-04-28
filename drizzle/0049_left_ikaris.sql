CREATE TABLE `whatsapp_account_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alertType` varchar(100) NOT NULL,
	`details` text,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`resolved` boolean NOT NULL DEFAULT false,
	`resolvedAt` timestamp,
	`resolvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsapp_account_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_conversation_quality` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`qualityScore` int,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsapp_conversation_quality_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_phone_quality` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`qualityScore` int,
	`qualityRating` enum('unknown','yellow','green','gray','red') NOT NULL DEFAULT 'unknown',
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsapp_phone_quality_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_security_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`details` text,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`phoneNumber` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsapp_security_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_template_quality` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` varchar(255) NOT NULL,
	`qualityScore` int,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsapp_template_quality_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_user_opt_ins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`optInType` enum('general','marketing') NOT NULL DEFAULT 'general',
	`status` enum('opted_in','opted_out') NOT NULL DEFAULT 'opted_in',
	`source` varchar(100),
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_user_opt_ins_id` PRIMARY KEY(`id`)
);
