CREATE TABLE `sharedColumnTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`tableKey` varchar(50) NOT NULL,
	`columns` text NOT NULL,
	`createdBy` int NOT NULL,
	`createdByName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sharedColumnTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `sharedColumnTemplates_tableKey_idx` ON `sharedColumnTemplates` (`tableKey`);