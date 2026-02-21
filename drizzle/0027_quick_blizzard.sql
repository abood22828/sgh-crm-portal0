CREATE TABLE `followUpTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` enum('appointment','lead','offerLead','campRegistration') NOT NULL,
	`entityId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`dueDate` timestamp,
	`assignedToId` int,
	`assignedToName` varchar(255),
	`createdById` int NOT NULL,
	`createdByName` varchar(255) NOT NULL,
	`completedAt` timestamp,
	`completedById` int,
	`completedByName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `followUpTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `tasks_entity_idx` ON `followUpTasks` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `tasks_status_idx` ON `followUpTasks` (`status`);--> statement-breakpoint
CREATE INDEX `tasks_dueDate_idx` ON `followUpTasks` (`dueDate`);--> statement-breakpoint
CREATE INDEX `tasks_assignedTo_idx` ON `followUpTasks` (`assignedToId`);