import { getDb } from "./db";
import { accessControlRules, securityEvents, activityLogs, devices, users } from "../drizzle/schema";
import { eq, and, or, desc, lte, gte } from "drizzle-orm";

/**
 * Gestion des règles d'accès (ACL)
 */

export async function createAccessControlRule(data: {
  networkId: number;
  name: string;
  description?: string;
  sourceType: "user" | "group" | "device";
  sourceId?: number;
  targetType: "device" | "group" | "network";
  targetId?: number;
  action: "allow" | "deny";
  priority?: number;
  expiresAt?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(accessControlRules).values({
    ...data,
    priority: data.priority ?? 100,
  });
  return result;
}

export async function getAccessControlRules(networkId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(accessControlRules)
    .where(and(eq(accessControlRules.networkId, networkId), eq(accessControlRules.isActive, true)))
    .orderBy(accessControlRules.priority);
}

export async function updateAccessControlRule(
  ruleId: number,
  data: Partial<{
    name: string;
    description: string;
    action: "allow" | "deny";
    priority: number;
    isActive: boolean;
    expiresAt: Date;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(accessControlRules).set(data).where(eq(accessControlRules.id, ruleId));
}

export async function deleteAccessControlRule(ruleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(accessControlRules).where(eq(accessControlRules.id, ruleId));
}

/**
 * Vérification des permissions
 */

export async function checkPermission(
  networkId: number,
  userId: number,
  targetType: "device" | "group" | "network",
  targetId?: number
): Promise<boolean> {
  const rules = await getAccessControlRules(networkId);
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Récupérer les groupes de l'utilisateur
  const userGroups = await db
    .select({ groupId: devices.id })
    .from(devices)
    .where(eq(devices.networkId, networkId));

  // Évaluer les règles dans l'ordre de priorité
  for (const rule of rules) {
    // Vérifier si la règle s'applique à cet utilisateur
    if (rule.sourceType === "user" && rule.sourceId === userId) {
      // Vérifier si la règle cible correspond
      if (rule.targetType === targetType && (rule.targetId === null || rule.targetId === targetId)) {
        return rule.action === "allow";
      }
    }
  }

  // Par défaut, autoriser si aucune règle n'est trouvée
  return true;
}

/**
 * Gestion des événements de sécurité
 */

export async function logSecurityEvent(data: {
  userId?: number;
  networkId?: number;
  deviceId?: number;
  eventType:
    | "login_success"
    | "login_failed"
    | "access_allowed"
    | "access_denied"
    | "device_connected"
    | "device_disconnected"
    | "config_changed"
    | "key_rotated"
    | "key_revoked"
    | "suspicious_activity"
    | "brute_force_attempt";
  severity?: "info" | "warning" | "critical";
  sourceIp?: string;
  userAgent?: string;
  details?: Record<string, any>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(securityEvents).values({
    ...data,
    details: data.details ? JSON.stringify(data.details) : null,
    severity: data.severity ?? "info",
  });
}

export async function getSecurityEvents(
  networkId: number,
  options?: {
    limit?: number;
    offset?: number;
    severity?: "info" | "warning" | "critical";
    eventType?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [eq(securityEvents.networkId, networkId)];
  if (options?.severity) {
    conditions.push(eq(securityEvents.severity, options.severity));
  }
  if (options?.eventType) {
    conditions.push(eq(securityEvents.eventType, options.eventType as any));
  }

  return db
    .select()
    .from(securityEvents)
    .where(and(...conditions))
    .orderBy(desc(securityEvents.createdAt))
    .limit(options?.limit ?? 100)
    .offset(options?.offset ?? 0);
}

export async function getSecurityEventStats(networkId: number, days: number = 7) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const events = await db
    .select()
    .from(securityEvents)
    .where(and(eq(securityEvents.networkId, networkId), gte(securityEvents.createdAt, since)));

  const stats = {
    total: events.length,
    byType: {} as Record<string, number>,
    bySeverity: { info: 0, warning: 0, critical: 0 } as Record<string, number>,
    criticalEvents: events    .filter((e: any) => e.severity === "critical"),
  };

  for (const event of events) {
    stats.byType[event.eventType] = (stats.byType[event.eventType] ?? 0) + 1;
    if (event.severity && (event.severity as string) in stats.bySeverity) {
      (stats.bySeverity as Record<string, number>)[event.severity as string]++;
    }
  }

  return stats;
}

/**
 * Gestion des logs d'activité
 */

export async function logActivity(data: {
  userId?: number;
  networkId?: number;
  action: string;
  resourceType: string;
  resourceId?: number;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(activityLogs).values({
    ...data,
    changes: data.changes ? JSON.stringify(data.changes) : null,
  });
}

export async function getActivityLogs(
  networkId: number,
  options?: {
    limit?: number;
    offset?: number;
    action?: string;
    resourceType?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [eq(activityLogs.networkId, networkId)];
  if (options?.action) {
    conditions.push(eq(activityLogs.action, options.action));
  }
  if (options?.resourceType) {
    conditions.push(eq(activityLogs.resourceType, options.resourceType));
  }

  return db
    .select()
    .from(activityLogs)
    .where(and(...conditions))
    .orderBy(desc(activityLogs.createdAt))
    .limit(options?.limit ?? 100)
    .offset(options?.offset ?? 0);
}

export async function getActivityStats(networkId: number, days: number = 7) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const logs = await db
    .select()
    .from(activityLogs)
    .where(and(eq(activityLogs.networkId, networkId), gte(activityLogs.createdAt, since)));

  const stats = {
    total: logs.length,
    byAction: {} as Record<string, number>,
    byResourceType: {} as Record<string, number>,
    topUsers: {} as Record<number, number>,
  };

  for (const log of logs) {
    stats.byAction[log.action] = (stats.byAction[log.action] ?? 0) + 1;
    stats.byResourceType[log.resourceType] = (stats.byResourceType[log.resourceType] ?? 0) + 1;
    if (log.userId) {
      stats.topUsers[log.userId as number] = (stats.topUsers[log.userId as number] ?? 0) + 1;
    }
  }

  return stats;
}
