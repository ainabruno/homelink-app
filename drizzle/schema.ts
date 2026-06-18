import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, index } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Networks table: Configuration réseau domestique
 * Stocke les paramètres de connexion au routeur domestique et serveur WireGuard
 */
export const networks = mysqlTable("networks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull().default("Mon réseau"),
  publicIp: varchar("publicIp", { length: 45 }), // Support IPv4 et IPv6
  ddnsDomain: varchar("ddnsDomain", { length: 255 }),
  ddnsLastResolvedIp: varchar("ddnsLastResolvedIp", { length: 45 }),
  ddnsLastUpdated: timestamp("ddnsLastUpdated"),
  routerUsername: varchar("routerUsername", { length: 255 }),
  routerPasswordHash: text("routerPasswordHash"), // Stockage sécurisé
  serverPrivateKey: text("serverPrivateKey").notNull(), // Clé privée WireGuard serveur
  serverPublicKey: varchar("serverPublicKey", { length: 44 }).notNull(), // Clé publique WireGuard serveur
  vpnSubnet: varchar("vpnSubnet", { length: 18 }).notNull().default("10.191.143.0/24"),
  listenPort: int("listenPort").notNull().default(51820),
  isActive: boolean("isActive").notNull().default(false),
  lastHealthCheck: timestamp("lastHealthCheck"),
  isHealthy: boolean("isHealthy").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_networks_userId").on(table.userId),
}));

export type Network = typeof networks.$inferSelect;
export type InsertNetwork = typeof networks.$inferInsert;

/**
 * Devices table: Appareils connectés au réseau domestique
 * Chaque appareil a une configuration WireGuard unique
 */
export const devices = mysqlTable("devices", {
  id: int("id").autoincrement().primaryKey(),
  networkId: int("networkId").notNull().references(() => networks.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  localIp: varchar("localIp", { length: 45 }),
  vpnIp: varchar("vpnIp", { length: 45 }).notNull(), // Adresse VPN attribuée (ex: 10.191.143.2)
  privateKey: text("privateKey").notNull(), // Clé privée WireGuard client
  publicKey: varchar("publicKey", { length: 44 }).notNull(), // Clé publique WireGuard client
  presharedKey: text("presharedKey"), // Clé pré-partagée optionnelle
  isActive: boolean("isActive").notNull().default(true),
  lastConnected: timestamp("lastConnected"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  networkIdIdx: index("idx_devices_networkId").on(table.networkId),
}));

export type Device = typeof devices.$inferSelect;
export type InsertDevice = typeof devices.$inferInsert;

/**
 * Connections table: Historique des connexions VPN
 * Enregistre chaque session de connexion
 */
export const connections = mysqlTable("connections", {
  id: int("id").autoincrement().primaryKey(),
  deviceId: int("deviceId").notNull().references(() => devices.id, { onDelete: "cascade" }),
  networkId: int("networkId").notNull().references(() => networks.id, { onDelete: "cascade" }),
  sourceIp: varchar("sourceIp", { length: 45 }).notNull(),
  sourceCountry: varchar("sourceCountry", { length: 2 }),
  status: mysqlEnum("status", ["connected", "disconnected", "failed"]).notNull().default("connected"),
  startTime: timestamp("startTime").defaultNow().notNull(),
  endTime: timestamp("endTime"),
  durationSeconds: int("durationSeconds"),
  bytesReceived: decimal("bytesReceived", { precision: 15, scale: 0 }),
  bytesSent: decimal("bytesSent", { precision: 15, scale: 0 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  deviceIdIdx: index("idx_connections_deviceId").on(table.deviceId),
  networkIdIdx: index("idx_connections_networkId").on(table.networkId),
}));

export type Connection = typeof connections.$inferSelect;
export type InsertConnection = typeof connections.$inferInsert;

/**
 * Logs table: Journalisation détaillée des actions
 * Audit trail pour sécurité et dépannage
 */
export const logs = mysqlTable("logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  networkId: int("networkId").references(() => networks.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(), // ex: "network_created", "device_added", "connection_established"
  details: text("details"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  status: mysqlEnum("status", ["success", "error", "warning"]).notNull().default("success"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_logs_userId").on(table.userId),
  networkIdIdx: index("idx_logs_networkId").on(table.networkId),
}));

export type Log = typeof logs.$inferSelect;
export type InsertLog = typeof logs.$inferInsert;

/**
 * Notifications table: Notifications visuelles pour l'administrateur
 * Alerte lors de nouvelles connexions et événements importants
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  networkId: int("networkId").references(() => networks.id, { onDelete: "cascade" }),
  deviceId: int("deviceId").references(() => devices.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["device_connected", "device_disconnected", "connection_failed", "network_created", "device_added", "security_alert"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  isRead: boolean("isRead").notNull().default(false),
  icon: varchar("icon", { length: 50 }), // lucide-react icon name
  color: varchar("color", { length: 20 }).default("cyan"), // cyan, green, red, yellow
  actionUrl: varchar("actionUrl", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
}, (table) => ({
  userIdIdx: index("idx_notifications_userId").on(table.userId),
  networkIdIdx: index("idx_notifications_networkId").on(table.networkId),
  deviceIdIdx: index("idx_notifications_deviceId").on(table.deviceId),
  isReadIdx: index("idx_notifications_isRead").on(table.isRead),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Device Groups table: Groupes d'appareils pour catégorisation
 * Permet de catégoriser les appareils (Mobiles, Ordinateurs, IoT, etc.)
 */
export const deviceGroups = mysqlTable("deviceGroups", {
  id: int("id").autoincrement().primaryKey(),
  networkId: int("networkId").notNull().references(() => networks.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["mobile", "computer", "iot", "other"]).notNull().default("other"),
  color: varchar("color", { length: 20 }).default("cyan"),
  icon: varchar("icon", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  networkIdIdx: index("idx_deviceGroups_networkId").on(table.networkId),
}));

export type DeviceGroup = typeof deviceGroups.$inferSelect;
export type InsertDeviceGroup = typeof deviceGroups.$inferInsert;

/**
 * Device Group Members table: Relation many-to-many entre appareils et groupes
 */
export const deviceGroupMembers = mysqlTable("deviceGroupMembers", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull().references(() => deviceGroups.id, { onDelete: "cascade" }),
  deviceId: int("deviceId").notNull().references(() => devices.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  groupIdIdx: index("idx_deviceGroupMembers_groupId").on(table.groupId),
  deviceIdIdx: index("idx_deviceGroupMembers_deviceId").on(table.deviceId),
}));

export type DeviceGroupMember = typeof deviceGroupMembers.$inferSelect;
export type InsertDeviceGroupMember = typeof deviceGroupMembers.$inferInsert;

/**
 * Relations pour Drizzle ORM
 */
export const usersRelations = relations(users, ({ many }) => ({
  networks: many(networks),
  logs: many(logs),
  notifications: many(notifications),
}));

export const networksRelations = relations(networks, ({ one, many }) => ({
  user: one(users, {
    fields: [networks.userId],
    references: [users.id],
  }),
  devices: many(devices),
  connections: many(connections),
  logs: many(logs),
}));

export const devicesRelations = relations(devices, ({ one, many }) => ({
  network: one(networks, {
    fields: [devices.networkId],
    references: [networks.id],
  }),
  connections: many(connections),
}));

export const connectionsRelations = relations(connections, ({ one }) => ({
  device: one(devices, {
    fields: [connections.deviceId],
    references: [devices.id],
  }),
  network: one(networks, {
    fields: [connections.networkId],
    references: [networks.id],
  }),
}));

export const logsRelations = relations(logs, ({ one }) => ({
  user: one(users, {
    fields: [logs.userId],
    references: [users.id],
  }),
  network: one(networks, {
    fields: [logs.networkId],
    references: [networks.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  network: one(networks, {
    fields: [notifications.networkId],
    references: [networks.id],
  }),
  device: one(devices, {
    fields: [notifications.deviceId],
    references: [devices.id],
  }),
}));

export const deviceGroupsRelations = relations(deviceGroups, ({ one, many }) => ({
  network: one(networks, {
    fields: [deviceGroups.networkId],
    references: [networks.id],
  }),
  members: many(deviceGroupMembers),
}));

export const deviceGroupMembersRelations = relations(deviceGroupMembers, ({ one }) => ({
  group: one(deviceGroups, {
    fields: [deviceGroupMembers.groupId],
    references: [deviceGroups.id],
  }),
  device: one(devices, {
    fields: [deviceGroupMembers.deviceId],
    references: [devices.id],
  }),
}));


/**
 * Speed Tests table: Historique des tests de vitesse réseau
 * Stocke les résultats des tests ping, download, upload
 */
export const speedTests = mysqlTable("speedTests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  networkId: int("networkId").references(() => networks.id, { onDelete: "set null" }),
  ping: decimal("ping", { precision: 10, scale: 2 }).notNull(), // en ms
  downloadSpeed: decimal("downloadSpeed", { precision: 10, scale: 2 }).notNull(), // en Mbps
  uploadSpeed: decimal("uploadSpeed", { precision: 10, scale: 2 }).notNull(), // en Mbps
  jitter: decimal("jitter", { precision: 10, scale: 2 }), // en ms
  packetLoss: decimal("packetLoss", { precision: 5, scale: 2 }), // en %
  testServer: varchar("testServer", { length: 255 }), // Serveur de test utilisé
  vpnConnected: boolean("vpnConnected").notNull().default(false), // Test avec/sans VPN
  quality: mysqlEnum("quality", ["excellent", "good", "fair", "poor"]).notNull().default("good"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SpeedTest = typeof speedTests.$inferSelect;
export type InsertSpeedTest = typeof speedTests.$inferInsert;

export const speedTestsRelations = relations(speedTests, ({ one }) => ({
  user: one(users, {
    fields: [speedTests.userId],
    references: [users.id],
  }),
  network: one(networks, {
    fields: [speedTests.networkId],
    references: [networks.id],
  }),
}));
