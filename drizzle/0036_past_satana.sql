ALTER TABLE `offerLeads` MODIFY COLUMN `gender` enum('male','female') NOT NULL;--> statement-breakpoint
ALTER TABLE `appointments` ADD `patientMessage` text;--> statement-breakpoint
ALTER TABLE `campRegistrations` ADD `patientMessage` text;--> statement-breakpoint
ALTER TABLE `offerLeads` ADD `age` int;--> statement-breakpoint
ALTER TABLE `offerLeads` ADD `patientMessage` text;