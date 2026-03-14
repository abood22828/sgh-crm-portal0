ALTER TABLE `whatsapp_messages` ADD `deliveredAt` timestamp;--> statement-breakpoint
ALTER TABLE `whatsapp_messages` ADD `readAt` timestamp;--> statement-breakpoint
ALTER TABLE `whatsapp_messages` ADD `errorInfo` text;