import { getDb } from "./db";
import { activityLogs, securityEvents, ActivityLog, SecurityEvent, InsertActivityLog, InsertSecurityEvent } from "../drizzle/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

/**
 * Créer un log d'activité
 */
export async function createActivityLog(data: InsertActivityLog): Promise<ActivityLog> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(activityLogs).values(data);

  // Récupérer le log créé
  const created = await db
    .select()
    .from(activityLogs)
    .orderBy(desc(activityLogs.id))
    .limit(1);

  if (!created.length) throw new Error("Failed to create activity log");
  return created[0];
}

/**
 * Créer un événement de sécurité
 */
export async function createSecurityEvent(data: InsertSecurityEvent): Promise<SecurityEvent> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(securityEvents).values(data);

  // Récupérer l'événement créé
  const created = await db
    .select()
    .from(securityEvents)
    .orderBy(desc(securityEvents.id))
    .limit(1);

  if (!created.length) throw new Error("Failed to create security event");
  return created[0];
}

/**
 * Récupérer les logs d'activité avec filtrage
 */
export async function getActivityLogs(options: {
  userId?: number;
  networkId?: number;
  action?: string;
  resourceType?: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}): Promise<ActivityLog[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  if (options.userId) {
    conditions.push(eq(activityLogs.userId, options.userId));
  }
  if (options.networkId) {
    conditions.push(eq(activityLogs.networkId, options.networkId));
  }
  if (options.action) {
    conditions.push(eq(activityLogs.action, options.action));
  }
  if (options.resourceType) {
    conditions.push(eq(activityLogs.resourceType, options.resourceType));
  }
  if (options.startDate) {
    conditions.push(gte(activityLogs.createdAt, options.startDate));
  }
  if (options.endDate) {
    conditions.push(lte(activityLogs.createdAt, options.endDate));
  }

  let query = db.select().from(activityLogs) as any;

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  query = query.orderBy(desc(activityLogs.createdAt));

  if (options.limit) {
    query = query.limit(options.limit);
  }
  if (options.offset) {
    query = query.offset(options.offset);
  }

  return query;
}

/**
 * Récupérer les événements de sécurité avec filtrage
 */
export async function getSecurityEvents(options: {
  userId?: number;
  networkId?: number;
  deviceId?: number;
  eventType?: string;
  severity?: "info" | "warning" | "critical";
  isResolved?: boolean;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}): Promise<SecurityEvent[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  if (options.userId) {
    conditions.push(eq(securityEvents.userId, options.userId));
  }
  if (options.networkId) {
    conditions.push(eq(securityEvents.networkId, options.networkId));
  }
  if (options.deviceId) {
    conditions.push(eq(securityEvents.deviceId, options.deviceId));
  }
  if (options.eventType) {
    conditions.push(eq(securityEvents.eventType, options.eventType as any));
  }
  if (options.severity) {
    conditions.push(eq(securityEvents.severity, options.severity));
  }
  if (options.isResolved !== undefined) {
    conditions.push(eq(securityEvents.isResolved, options.isResolved));
  }
  if (options.startDate) {
    conditions.push(gte(securityEvents.createdAt, options.startDate));
  }
  if (options.endDate) {
    conditions.push(lte(securityEvents.createdAt, options.endDate));
  }

  let query = db.select().from(securityEvents) as any;

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  query = query.orderBy(desc(securityEvents.createdAt));

  if (options.limit) {
    query = query.limit(options.limit);
  }
  if (options.offset) {
    query = query.offset(options.offset);
  }

  return query;
}

/**
 * Récupérer les statistiques d'activité
 */
export async function getActivityStats(networkId: number): Promise<{
  totalActions: number;
  actionsByType: Record<string, number>;
  actionsByResource: Record<string, number>;
  recentActions: ActivityLog[];
}> {
  const db = await getDb();
  if (!db) {
    return {
      totalActions: 0,
      actionsByType: {},
      actionsByResource: {},
      recentActions: [],
    };
  }

  const logs = await db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.networkId, networkId))
    .orderBy(desc(activityLogs.createdAt));

  const actionsByType: Record<string, number> = {};
  const actionsByResource: Record<string, number> = {};

  logs.forEach((log) => {
    actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
    actionsByResource[log.resourceType] = (actionsByResource[log.resourceType] || 0) + 1;
  });

  return {
    totalActions: logs.length,
    actionsByType,
    actionsByResource,
    recentActions: logs.slice(0, 10),
  };
}

/**
 * Récupérer les statistiques de sécurité
 */
export async function getSecurityStats(networkId: number): Promise<{
  totalEvents: number;
  eventsBySeverity: Record<string, number>;
  eventsByType: Record<string, number>;
  unresolvedCount: number;
  recentEvents: SecurityEvent[];
}> {
  const db = await getDb();
  if (!db) {
    return {
      totalEvents: 0,
      eventsBySeverity: {},
      eventsByType: {},
      unresolvedCount: 0,
      recentEvents: [],
    };
  }

  const events = await db
    .select()
    .from(securityEvents)
    .where(eq(securityEvents.networkId, networkId))
    .orderBy(desc(securityEvents.createdAt));

  const eventsBySeverity: Record<string, number> = {};
  const eventsByType: Record<string, number> = {};
  let unresolvedCount = 0;

  events.forEach((event) => {
    eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
    if (!event.isResolved) unresolvedCount++;
  });

  return {
    totalEvents: events.length,
    eventsBySeverity,
    eventsByType,
    unresolvedCount,
    recentEvents: events.slice(0, 10),
  };
}

/**
 * Marquer un événement de sécurité comme résolu
 */
export async function resolveSecurityEvent(eventId: number): Promise<SecurityEvent> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(securityEvents)
    .set({ isResolved: true })
    .where(eq(securityEvents.id, eventId));

  const updated = await db
    .select()
    .from(securityEvents)
    .where(eq(securityEvents.id, eventId))
    .limit(1);

  if (!updated.length) throw new Error("Event not found");
  return updated[0];
}

/**
 * Compter les événements de sécurité non résolus
 */
export async function getUnresolvedSecurityEventCount(networkId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select()
    .from(securityEvents)
    .where(
      and(
        eq(securityEvents.networkId, networkId),
        eq(securityEvents.isResolved, false)
      )
    );

  return result.length;
}
