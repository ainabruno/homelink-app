CREATE TABLE `accessControlRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`networkId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`sourceType` enum('user','group','device') NOT NULL,
	`sourceId` int,
	`targetType` enum('device','group','network') NOT NULL,
	`targetId` int,
	`action` enum('allow','deny') NOT NULL DEFAULT 'allow',
	`priority` int NOT NULL DEFAULT 100,
	`isActive` boolean NOT NULL DEFAULT true,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accessControlRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `activityLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`networkId` int,
	`action` varchar(255) NOT NULL,
	`resourceType` varchar(100) NOT NULL,
	`resourceId` int,
	`changes` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `securityEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`networkId` int,
	`deviceId` int,
	`eventType` enum('login_success','login_failed','access_allowed','access_denied','device_connected','device_disconnected','config_changed','key_rotated','key_revoked','suspicious_activity','brute_force_attempt') NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
	`sourceIp` varchar(45),
	`userAgent` text,
	`details` text,
	`isResolved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `securityEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `accessControlRules` ADD CONSTRAINT `accessControlRules_networkId_networks_id_fk` FOREIGN KEY (`networkId`) REFERENCES `networks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activityLogs` ADD CONSTRAINT `activityLogs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activityLogs` ADD CONSTRAINT `activityLogs_networkId_networks_id_fk` FOREIGN KEY (`networkId`) REFERENCES `networks`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityEvents` ADD CONSTRAINT `securityEvents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityEvents` ADD CONSTRAINT `securityEvents_networkId_networks_id_fk` FOREIGN KEY (`networkId`) REFERENCES `networks`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `securityEvents` ADD CONSTRAINT `securityEvents_deviceId_devices_id_fk` FOREIGN KEY (`deviceId`) REFERENCES `devices`(`id`) ON DELETE set null ON UPDATE no action;