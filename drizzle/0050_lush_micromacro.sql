CREATE TABLE `whatsapp_webhook_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` varchar(255),
	`eventType` varchar(100) NOT NULL,
	`subType` varchar(100),
	`phoneNumber` varchar(20),
	`rawPayload` text NOT NULL,
	`processed` boolean NOT NULL DEFAULT false,
	`handlerExists` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	CONSTRAINT `whatsapp_webhook_events_id` PRIMARY KEY(`id`)
);
