CREATE TABLE `message_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageType` varchar(100) NOT NULL,
	`displayName` varchar(255) NOT NULL,
	`category` enum('patient_journey','executive_reports','task_management','doctor_notifications') NOT NULL,
	`messageContent` text NOT NULL,
	`isEnabled` int NOT NULL DEFAULT 1,
	`deliveryChannel` enum('whatsapp_api','whatsapp_integration','both') NOT NULL DEFAULT 'whatsapp_integration',
	`availableVariables` text,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `message_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `message_settings_messageType_unique` UNIQUE(`messageType`)
);
