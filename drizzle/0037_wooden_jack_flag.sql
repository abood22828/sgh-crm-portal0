ALTER TABLE `appointments` MODIFY COLUMN `status` enum('pending','contacted','no_answer','confirmed','attended','completed','cancelled') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `campRegistrations` MODIFY COLUMN `status` enum('pending','contacted','no_answer','confirmed','attended','completed','cancelled') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `offerLeads` MODIFY COLUMN `status` enum('pending','contacted','no_answer','confirmed','attended','completed','cancelled') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `appointments` ADD `contactedAt` timestamp;--> statement-breakpoint
ALTER TABLE `appointments` ADD `confirmedAt` timestamp;--> statement-breakpoint
ALTER TABLE `appointments` ADD `attendedAt` timestamp;--> statement-breakpoint
ALTER TABLE `appointments` ADD `completedAt` timestamp;--> statement-breakpoint
ALTER TABLE `appointments` ADD `cancelledAt` timestamp;--> statement-breakpoint
ALTER TABLE `campRegistrations` ADD `contactedAt` timestamp;--> statement-breakpoint
ALTER TABLE `campRegistrations` ADD `confirmedAt` timestamp;--> statement-breakpoint
ALTER TABLE `campRegistrations` ADD `attendedAt` timestamp;--> statement-breakpoint
ALTER TABLE `campRegistrations` ADD `completedAt` timestamp;--> statement-breakpoint
ALTER TABLE `campRegistrations` ADD `cancelledAt` timestamp;--> statement-breakpoint
ALTER TABLE `offerLeads` ADD `contactedAt` timestamp;--> statement-breakpoint
ALTER TABLE `offerLeads` ADD `confirmedAt` timestamp;--> statement-breakpoint
ALTER TABLE `offerLeads` ADD `attendedAt` timestamp;--> statement-breakpoint
ALTER TABLE `offerLeads` ADD `completedAt` timestamp;--> statement-breakpoint
ALTER TABLE `offerLeads` ADD `cancelledAt` timestamp;