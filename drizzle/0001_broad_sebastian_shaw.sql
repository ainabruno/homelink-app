CREATE TABLE `connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` int NOT NULL,
	`networkId` int NOT NULL,
	`sourceIp` varchar(45) NOT NULL,
	`sourceCountry` varchar(2),
	`status` enum('connected','disconnected','failed') NOT NULL DEFAULT 'connected',
	`startTime` timestamp NOT NULL DEFAULT (now()),
	`endTime` timestamp,
	`durationSeconds` int,
	`bytesReceived` decimal(15,0),
	`bytesSent` decimal(15,0),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `connections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`networkId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`localIp` varchar(45),
	`vpnIp` varchar(45) NOT NULL,
	`privateKey` text NOT NULL,
	`publicKey` varchar(44) NOT NULL,
	`presharedKey` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastConnected` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `devices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`networkId` int,
	`action` varchar(100) NOT NULL,
	`details` text,
	`ipAddress` varchar(45),
	`status` enum('success','error','warning') NOT NULL DEFAULT 'success',
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `networks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL DEFAULT 'Mon réseau',
	`publicIp` varchar(45),
	`ddnsDomain` varchar(255),
	`ddnsLastResolvedIp` varchar(45),
	`ddnsLastUpdated` timestamp,
	`routerUsername` varchar(255),
	`routerPasswordHash` text,
	`serverPrivateKey` text NOT NULL,
	`serverPublicKey` varchar(44) NOT NULL,
	`vpnSubnet` varchar(18) NOT NULL DEFAULT '10.191.143.0/24',
	`listenPort` int NOT NULL DEFAULT 51820,
	`isActive` boolean NOT NULL DEFAULT false,
	`lastHealthCheck` timestamp,
	`isHealthy` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `networks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `connections` ADD CONSTRAINT `connections_deviceId_devices_id_fk` FOREIGN KEY (`deviceId`) REFERENCES `devices`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `connections` ADD CONSTRAINT `connections_networkId_networks_id_fk` FOREIGN KEY (`networkId`) REFERENCES `networks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `devices` ADD CONSTRAINT `devices_networkId_networks_id_fk` FOREIGN KEY (`networkId`) REFERENCES `networks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `logs` ADD CONSTRAINT `logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `logs` ADD CONSTRAINT `logs_networkId_networks_id_fk` FOREIGN KEY (`networkId`) REFERENCES `networks`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `networks` ADD CONSTRAINT `networks_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_connections_deviceId` ON `connections` (`deviceId`);--> statement-breakpoint
CREATE INDEX `idx_connections_networkId` ON `connections` (`networkId`);--> statement-breakpoint
CREATE INDEX `idx_devices_networkId` ON `devices` (`networkId`);--> statement-breakpoint
CREATE INDEX `idx_logs_userId` ON `logs` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_logs_networkId` ON `logs` (`networkId`);--> statement-breakpoint
CREATE INDEX `idx_networks_userId` ON `networks` (`userId`);