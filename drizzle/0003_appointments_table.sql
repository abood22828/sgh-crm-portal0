-- Create appointments table
CREATE TABLE IF NOT EXISTS `appointments` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `campaignId` int NOT NULL,
  `doctorId` int NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(320),
  `preferredDate` varchar(100),
  `preferredTime` varchar(100),
  `appointmentDate` timestamp,
  `status` enum('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
  `notes` text,
  `utmSource` varchar(100),
  `utmMedium` varchar(100),
  `utmCampaign` varchar(100),
  `utmContent` varchar(100),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
