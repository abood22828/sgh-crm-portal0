CREATE TABLE `campaignCamps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`campId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campaignCamps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaignDoctors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`doctorId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campaignDoctors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaignOffers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`offerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campaignOffers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `campRegistrations` ADD `campaignId` int;--> statement-breakpoint
ALTER TABLE `offerLeads` ADD `campaignId` int;--> statement-breakpoint
CREATE INDEX `campaignCamps_campaign_idx` ON `campaignCamps` (`campaignId`);--> statement-breakpoint
CREATE INDEX `campaignCamps_camp_idx` ON `campaignCamps` (`campId`);--> statement-breakpoint
CREATE INDEX `campaignCamps_unique_idx` ON `campaignCamps` (`campaignId`,`campId`);--> statement-breakpoint
CREATE INDEX `campaignDoctors_campaign_idx` ON `campaignDoctors` (`campaignId`);--> statement-breakpoint
CREATE INDEX `campaignDoctors_doctor_idx` ON `campaignDoctors` (`doctorId`);--> statement-breakpoint
CREATE INDEX `campaignDoctors_unique_idx` ON `campaignDoctors` (`campaignId`,`doctorId`);--> statement-breakpoint
CREATE INDEX `campaignOffers_campaign_idx` ON `campaignOffers` (`campaignId`);--> statement-breakpoint
CREATE INDEX `campaignOffers_offer_idx` ON `campaignOffers` (`offerId`);--> statement-breakpoint
CREATE INDEX `campaignOffers_unique_idx` ON `campaignOffers` (`campaignId`,`offerId`);