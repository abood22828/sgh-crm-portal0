CREATE TABLE `pwaInstalls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`appType` enum('public','admin') NOT NULL,
	`userId` int,
	`userAgent` text,
	`platform` varchar(100),
	`ipAddress` varchar(45),
	`installedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pwaInstalls_id` PRIMARY KEY(`id`)
);
