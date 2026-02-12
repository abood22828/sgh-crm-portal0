CREATE INDEX `appointments_phone_idx` ON `appointments` (`phone`);--> statement-breakpoint
CREATE INDEX `appointments_email_idx` ON `appointments` (`email`);--> statement-breakpoint
CREATE INDEX `appointments_status_idx` ON `appointments` (`status`);--> statement-breakpoint
CREATE INDEX `appointments_createdAt_idx` ON `appointments` (`createdAt`);--> statement-breakpoint
CREATE INDEX `appointments_doctorId_idx` ON `appointments` (`doctorId`);--> statement-breakpoint
CREATE INDEX `campRegistrations_phone_idx` ON `campRegistrations` (`phone`);--> statement-breakpoint
CREATE INDEX `campRegistrations_email_idx` ON `campRegistrations` (`email`);--> statement-breakpoint
CREATE INDEX `campRegistrations_status_idx` ON `campRegistrations` (`status`);--> statement-breakpoint
CREATE INDEX `campRegistrations_createdAt_idx` ON `campRegistrations` (`createdAt`);--> statement-breakpoint
CREATE INDEX `campRegistrations_campId_idx` ON `campRegistrations` (`campId`);--> statement-breakpoint
CREATE INDEX `offerLeads_phone_idx` ON `offerLeads` (`phone`);--> statement-breakpoint
CREATE INDEX `offerLeads_email_idx` ON `offerLeads` (`email`);--> statement-breakpoint
CREATE INDEX `offerLeads_status_idx` ON `offerLeads` (`status`);--> statement-breakpoint
CREATE INDEX `offerLeads_createdAt_idx` ON `offerLeads` (`createdAt`);--> statement-breakpoint
CREATE INDEX `offerLeads_offerId_idx` ON `offerLeads` (`offerId`);