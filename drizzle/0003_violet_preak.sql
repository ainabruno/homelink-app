CREATE TABLE `deviceGroupMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`deviceId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deviceGroupMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deviceGroups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`networkId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`category` enum('mobile','computer','iot','other') NOT NULL DEFAULT 'other',
	`color` varchar(20) DEFAULT 'cyan',
	`icon` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deviceGroups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `deviceGroupMembers` ADD CONSTRAINT `deviceGroupMembers_groupId_deviceGroups_id_fk` FOREIGN KEY (`groupId`) REFERENCES `deviceGroups`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deviceGroupMembers` ADD CONSTRAINT `deviceGroupMembers_deviceId_devices_id_fk` FOREIGN KEY (`deviceId`) REFERENCES `devices`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deviceGroups` ADD CONSTRAINT `deviceGroups_networkId_networks_id_fk` FOREIGN KEY (`networkId`) REFERENCES `networks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_deviceGroupMembers_groupId` ON `deviceGroupMembers` (`groupId`);--> statement-breakpoint
CREATE INDEX `idx_deviceGroupMembers_deviceId` ON `deviceGroupMembers` (`deviceId`);--> statement-breakpoint
CREATE INDEX `idx_deviceGroups_networkId` ON `deviceGroups` (`networkId`);