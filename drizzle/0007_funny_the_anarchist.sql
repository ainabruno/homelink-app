CREATE TABLE `devicePermissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` int NOT NULL,
	`userId` int,
	`groupId` int,
	`permission` enum('view','connect','configure','admin') NOT NULL DEFAULT 'view',
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `devicePermissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `groupPermissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`userId` int,
	`permission` enum('view','connect','configure','admin') NOT NULL DEFAULT 'view',
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `groupPermissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `devicePermissions` ADD CONSTRAINT `devicePermissions_deviceId_devices_id_fk` FOREIGN KEY (`deviceId`) REFERENCES `devices`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `devicePermissions` ADD CONSTRAINT `devicePermissions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `devicePermissions` ADD CONSTRAINT `devicePermissions_groupId_deviceGroups_id_fk` FOREIGN KEY (`groupId`) REFERENCES `deviceGroups`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `groupPermissions` ADD CONSTRAINT `groupPermissions_groupId_deviceGroups_id_fk` FOREIGN KEY (`groupId`) REFERENCES `deviceGroups`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `groupPermissions` ADD CONSTRAINT `groupPermissions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_devicePermissions_deviceId` ON `devicePermissions` (`deviceId`);--> statement-breakpoint
CREATE INDEX `idx_devicePermissions_userId` ON `devicePermissions` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_devicePermissions_groupId` ON `devicePermissions` (`groupId`);--> statement-breakpoint
CREATE INDEX `idx_groupPermissions_groupId` ON `groupPermissions` (`groupId`);--> statement-breakpoint
CREATE INDEX `idx_groupPermissions_userId` ON `groupPermissions` (`userId`);