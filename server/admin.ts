import { drizzle } from "drizzle-orm/mysql2";
import { eq, desc } from "drizzle-orm";
import { users, connections, devices, networks, logs } from "../drizzle/schema";
import { getDb } from "./db";
import { TRPCError } from "@trpc/server";

/**
 * Récupérer tous les utilisateurs avec leurs statistiques
 */
export async function getAllUsersWithStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
      })
      .from(users)
      .orderBy(desc(users.lastSignedIn));

    // Pour chaque utilisateur, récupérer le nombre de réseaux et connexions
    const usersWithStats = await Promise.all(
      allUsers.map(async (user) => {
        const userNetworks = await db
          .select()
          .from(networks)
          .where(eq(networks.userId, user.id));

        const userConnections = await db
          .select()
          .from(connections)
          .innerJoin(devices, eq(connections.deviceId, devices.id))
          .innerJoin(networks, eq(devices.networkId, networks.id))
          .where(eq(networks.userId, user.id));

        const recentConnection = userConnections[0];

        return {
          ...user,
          networkCount: userNetworks.length,
          connectionCount: userConnections.length,
          lastConnection: recentConnection?.connections.startTime || null,
        };
      })
    );

    return usersWithStats;
  } catch (error) {
    console.error("[Admin] Failed to get users with stats:", error);
    throw error;
  }
}

/**
 * Récupérer les connexions récentes de tous les utilisateurs
 */
export async function getRecentConnections(limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const recentConnections = await db
      .select({
        id: connections.id,
        status: connections.status,
        startTime: connections.startTime,
        endTime: connections.endTime,
        sourceIp: connections.sourceIp,
        sourceCountry: connections.sourceCountry,
        deviceName: devices.name,
        networkName: networks.name,
        userName: users.name,
        userEmail: users.email,
      })
      .from(connections)
      .innerJoin(devices, eq(connections.deviceId, devices.id))
      .innerJoin(networks, eq(connections.networkId, networks.id))
      .innerJoin(users, eq(networks.userId, users.id))
      .orderBy(desc(connections.startTime))
      .limit(limit);

    return recentConnections;
  } catch (error) {
    console.error("[Admin] Failed to get recent connections:", error);
    throw error;
  }
}

/**
 * Récupérer les statistiques d'utilisation globales
 */
export async function getGlobalStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const totalUsers = await db.select().from(users);
    const totalNetworks = await db.select().from(networks);
    const totalDevices = await db.select().from(devices);
    const totalConnections = await db.select().from(connections);

    // Connexions actives (sans endTime)
    const activeConnections = await db
      .select()
      .from(connections)
      .where(eq(connections.status, "connected"));

    // Connexions du dernier jour
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const connectionsLastDay = await db
      .select()
      .from(connections)
      .where(eq(connections.status, "connected"));

    return {
      totalUsers: totalUsers.length,
      totalNetworks: totalNetworks.length,
      totalDevices: totalDevices.length,
      totalConnections: totalConnections.length,
      activeConnections: activeConnections.length,
      connectionsLastDay: connectionsLastDay.filter(
        (c) => c.startTime && c.startTime > oneDayAgo
      ).length,
    };
  } catch (error) {
    console.error("[Admin] Failed to get global stats:", error);
    throw error;
  }
}

/**
 * Récupérer les logs d'audit globaux
 */
export async function getGlobalLogs(limit: number = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const globalLogs = await db
      .select({
        id: logs.id,
        action: logs.action,
        details: logs.details,
        status: logs.status,
        timestamp: logs.timestamp,
        userName: users.name,
        userEmail: users.email,
        networkName: networks.name,
      })
      .from(logs)
      .leftJoin(users, eq(logs.userId, users.id))
      .leftJoin(networks, eq(logs.networkId, networks.id))
      .orderBy(desc(logs.timestamp))
      .limit(limit);

    return globalLogs;
  } catch (error) {
    console.error("[Admin] Failed to get global logs:", error);
    throw error;
  }
}

/**
 * Récupérer les détails d'un utilisateur spécifique
 */
export async function getUserDetails(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .then((rows) => rows[0]);

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const userNetworks = await db
      .select()
      .from(networks)
      .where(eq(networks.userId, userId));

    const userConnections = await db
      .select()
      .from(connections)
      .innerJoin(devices, eq(connections.deviceId, devices.id))
      .where(eq(devices.networkId, userNetworks[0]?.id || 0));

    const userLogs = await db
      .select()
      .from(logs)
      .where(eq(logs.userId, userId))
      .orderBy(desc(logs.timestamp))
      .limit(50);

    return {
      user,
      networks: userNetworks,
      connections: userConnections,
      logs: userLogs,
    };
  } catch (error) {
    console.error("[Admin] Failed to get user details:", error);
    throw error;
  }
}
