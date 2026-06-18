CREATE TABLE `speedTests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`networkId` int,
	`ping` decimal(10,2) NOT NULL,
	`downloadSpeed` decimal(10,2) NOT NULL,
	`uploadSpeed` decimal(10,2) NOT NULL,
	`jitter` decimal(10,2),
	`packetLoss` decimal(5,2),
	`testServer` varchar(255),
	`vpnConnected` boolean NOT NULL DEFAULT false,
	`quality` enum('excellent','good','fair','poor') NOT NULL DEFAULT 'good',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `speedTests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `speedTests` ADD CONSTRAINT `speedTests_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `speedTests` ADD CONSTRAINT `speedTests_networkId_networks_id_fk` FOREIGN KEY (`networkId`) REFERENCES `networks`(`id`) ON DELETE set null ON UPDATE no action;