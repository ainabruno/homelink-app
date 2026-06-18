import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, networks, devices, connections, logs, Network, Device, Connection, Log } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ========== NETWORKS ==========

export async function createNetwork(data: {
  userId: number;
  name: string;
  serverPrivateKey: string;
  serverPublicKey: string;
  vpnSubnet?: string;
  listenPort?: number;
}): Promise<Network> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(networks).values({
    userId: data.userId,
    name: data.name,
    serverPrivateKey: data.serverPrivateKey,
    serverPublicKey: data.serverPublicKey,
    vpnSubnet: data.vpnSubnet || "10.191.143.0/24",
    listenPort: data.listenPort || 51820,
  });

  const networkId = (result as any).insertId;
  const created = await db.select().from(networks).where(eq(networks.id, networkId)).limit(1);
  return created[0]!;
}

export async function getNetworksByUserId(userId: number): Promise<Network[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(networks).where(eq(networks.userId, userId));
}

export async function getNetworkById(networkId: number): Promise<Network | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(networks).where(eq(networks.id, networkId)).limit(1);
  return result[0];
}

export async function updateNetwork(networkId: number, data: Partial<Network>): Promise<Network> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(networks).set(data).where(eq(networks.id, networkId));
  const updated = await db.select().from(networks).where(eq(networks.id, networkId)).limit(1);
  return updated[0]!;
}

export async function deleteNetwork(networkId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(networks).where(eq(networks.id, networkId));
}

// ========== DEVICES ==========

export async function createDevice(data: {
  networkId: number;
  name: string;
  vpnIp: string;
  privateKey: string;
  publicKey: string;
  presharedKey?: string;
  description?: string;
}): Promise<Device> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(devices).values({
    networkId: data.networkId,
    name: data.name,
    vpnIp: data.vpnIp,
    privateKey: data.privateKey,
    publicKey: data.publicKey,
    presharedKey: data.presharedKey,
    description: data.description,
  });

  const deviceId = (result as any).insertId;
  const created = await db.select().from(devices).where(eq(devices.id, deviceId)).limit(1);
  return created[0]!;
}

export async function getDevicesByNetworkId(networkId: number): Promise<Device[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(devices).where(eq(devices.networkId, networkId));
}

export async function getDeviceById(deviceId: number): Promise<Device | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(devices).where(eq(devices.id, deviceId)).limit(1);
  return result[0];
}

export async function updateDevice(deviceId: number, data: Partial<Device>): Promise<Device> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(devices).set(data).where(eq(devices.id, deviceId));
  const updated = await db.select().from(devices).where(eq(devices.id, deviceId)).limit(1);
  return updated[0]!;
}

export async function deleteDevice(deviceId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(devices).where(eq(devices.id, deviceId));
}

// ========== CONNECTIONS ==========

export async function createConnection(data: {
  deviceId: number;
  networkId: number;
  sourceIp: string;
  sourceCountry?: string;
  status?: "connected" | "disconnected" | "failed";
}): Promise<Connection> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(connections).values({
    deviceId: data.deviceId,
    networkId: data.networkId,
    sourceIp: data.sourceIp,
    sourceCountry: data.sourceCountry,
    status: data.status || "connected",
  });

  const connectionId = (result as any).insertId;
  const created = await db.select().from(connections).where(eq(connections.id, connectionId)).limit(1);
  return created[0]!;
}

export async function getConnectionsByNetworkId(networkId: number, limit: number = 100): Promise<Connection[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(connections)
    .where(eq(connections.networkId, networkId))
    .orderBy(desc(connections.startTime))
    .limit(limit);
}

export async function getConnectionsByDeviceId(deviceId: number, limit: number = 50): Promise<Connection[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(connections)
    .where(eq(connections.deviceId, deviceId))
    .orderBy(desc(connections.startTime))
    .limit(limit);
}

export async function updateConnection(connectionId: number, data: Partial<Connection>): Promise<Connection> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(connections).set(data).where(eq(connections.id, connectionId));
  const updated = await db.select().from(connections).where(eq(connections.id, connectionId)).limit(1);
  return updated[0]!;
}

// ========== LOGS ==========

export async function createLog(data: {
  userId?: number;
  networkId?: number;
  action: string;
  details?: string;
  ipAddress?: string;
  status?: "success" | "error" | "warning";
}): Promise<Log> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(logs).values({
    userId: data.userId,
    networkId: data.networkId,
    action: data.action,
    details: data.details,
    ipAddress: data.ipAddress,
    status: data.status || "success",
  });

  const logId = (result as any).insertId;
  const created = await db.select().from(logs).where(eq(logs.id, logId)).limit(1);
  return created[0]!;
}

export async function getLogsByNetworkId(networkId: number, limit: number = 100): Promise<Log[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(logs)
    .where(eq(logs.networkId, networkId))
    .orderBy(desc(logs.timestamp))
    .limit(limit);
}

export async function getLogsByUserId(userId: number, limit: number = 100): Promise<Log[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(logs)
    .where(eq(logs.userId, userId))
    .orderBy(desc(logs.timestamp))
    .limit(limit);
}
