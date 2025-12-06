-- Create leads table
CREATE TABLE IF NOT EXISTS `leads` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `campaignId` int NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(320),
  `status` enum('new','contacted','qualified','converted','rejected') NOT NULL DEFAULT 'new',
  `notes` text,
  `utmSource` varchar(100),
  `utmMedium` varchar(100),
  `utmCampaign` varchar(100),
  `utmContent` varchar(100),
  `emailSent` boolean DEFAULT false,
  `whatsappSent` boolean DEFAULT false,
  `bookingConfirmationSent` boolean DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
