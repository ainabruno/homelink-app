CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`networkId` int,
	`deviceId` int,
	`type` enum('device_connected','device_disconnected','connection_failed','network_created','device_added','security_alert') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text,
	`isRead` boolean NOT NULL DEFAULT false,
	`icon` varchar(50),
	`color` varchar(20) DEFAULT 'cyan',
	`actionUrl` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_networkId_networks_id_fk` FOREIGN KEY (`networkId`) REFERENCES `networks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_deviceId_devices_id_fk` FOREIGN KEY (`deviceId`) REFERENCES `devices`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_notifications_userId` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_notifications_networkId` ON `notifications` (`networkId`);--> statement-breakpoint
CREATE INDEX `idx_notifications_deviceId` ON `notifications` (`deviceId`);--> statement-breakpoint
CREATE INDEX `idx_notifications_isRead` ON `notifications` (`isRead`);