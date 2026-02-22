CREATE TABLE `userPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`preferenceKey` varchar(100) NOT NULL,
	`preferenceValue` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPreferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `userPreferences_userKey_idx` ON `userPreferences` (`userId`,`preferenceKey`);