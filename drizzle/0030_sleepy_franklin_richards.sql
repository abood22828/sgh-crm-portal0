CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` int NOT NULL,
	`action` varchar(50) NOT NULL,
	`oldValue` text,
	`newValue` text,
	`userId` int,
	`userName` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedFilters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`pageType` varchar(50) NOT NULL,
	`filterConfig` text NOT NULL,
	`userId` int NOT NULL,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savedFilters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `auditLogs_entity_idx` ON `auditLogs` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `auditLogs_action_idx` ON `auditLogs` (`action`);--> statement-breakpoint
CREATE INDEX `auditLogs_user_idx` ON `auditLogs` (`userId`);--> statement-breakpoint
CREATE INDEX `savedFilters_userPage_idx` ON `savedFilters` (`userId`,`pageType`);