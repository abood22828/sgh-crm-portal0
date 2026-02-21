CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` enum('appointment','lead','offerLead','campRegistration') NOT NULL,
	`entityId` int NOT NULL,
	`content` text NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `comments_entity_idx` ON `comments` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `comments_createdAt_idx` ON `comments` (`createdAt`);