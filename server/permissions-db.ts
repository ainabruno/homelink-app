import { getDb } from "./db";
import { devicePermissions, groupPermissions, DevicePermission, GroupPermission, InsertDevicePermission, InsertGroupPermission } from "../drizzle/schema";
import { eq, and, or, isNull, gt } from "drizzle-orm";

/**
 * Vérifier si un utilisateur a une permission sur un appareil
 */
export async function checkDevicePermission(
  userId: number,
  deviceId: number,
  requiredPermission: "view" | "connect" | "configure" | "admin"
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const permissionLevels = { view: 0, connect: 1, configure: 2, admin: 3 };
  const requiredLevel = permissionLevels[requiredPermission];

  // Vérifier les permissions directes de l'utilisateur
  const directPermission = await db
    .select()
    .from(devicePermissions)
    .where(
      and(
        eq(devicePermissions.deviceId, deviceId),
        eq(devicePermissions.userId, userId),
        or(
          isNull(devicePermissions.expiresAt),
          gt(devicePermissions.expiresAt, new Date())
        )
      )
    )
    .limit(1);

  if (directPermission.length > 0) {
    const userLevel = permissionLevels[directPermission[0].permission];
    if (userLevel >= requiredLevel) return true;
  }

  return false;
}

/**
 * Vérifier si un utilisateur a une permission sur un groupe
 */
export async function checkGroupPermission(
  userId: number,
  groupId: number,
  requiredPermission: "view" | "connect" | "configure" | "admin"
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const permissionLevels = { view: 0, connect: 1, configure: 2, admin: 3 };
  const requiredLevel = permissionLevels[requiredPermission];

  // Vérifier les permissions du groupe
  const groupPerm = await db
    .select()
    .from(groupPermissions)
    .where(
      and(
        eq(groupPermissions.groupId, groupId),
        eq(groupPermissions.userId, userId),
        or(
          isNull(groupPermissions.expiresAt),
          gt(groupPermissions.expiresAt, new Date())
        )
      )
    )
    .limit(1);

  if (groupPerm.length > 0) {
    const userLevel = permissionLevels[groupPerm[0].permission];
    if (userLevel >= requiredLevel) return true;
  }

  return false;
}

/**
 * Créer une permission pour un utilisateur sur un appareil
 */
export async function createDevicePermission(data: InsertDevicePermission): Promise<DevicePermission> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(devicePermissions).values(data);

  // Récupérer la permission créée
  const created = await db
    .select()
    .from(devicePermissions)
    .where(
      and(
        eq(devicePermissions.deviceId, data.deviceId),
        data.userId ? eq(devicePermissions.userId, data.userId) : isNull(devicePermissions.userId),
        data.groupId ? eq(devicePermissions.groupId, data.groupId) : isNull(devicePermissions.groupId)
      )
    )
    .orderBy((t) => t.id)
    .limit(1);

  if (!created.length) throw new Error("Failed to create permission");
  return created[0];
}

/**
 * Créer une permission pour un utilisateur sur un groupe
 */
export async function createGroupPermission(data: InsertGroupPermission): Promise<GroupPermission> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(groupPermissions).values(data);

  // Récupérer la permission créée
  const created = await db
    .select()
    .from(groupPermissions)
    .where(
      and(
        eq(groupPermissions.groupId, data.groupId),
        data.userId ? eq(groupPermissions.userId, data.userId) : isNull(groupPermissions.userId)
      )
    )
    .orderBy((t) => t.id)
    .limit(1);

  if (!created.length) throw new Error("Failed to create permission");
  return created[0];
}

/**
 * Récupérer toutes les permissions d'un utilisateur sur les appareils
 */
export async function getUserDevicePermissions(userId: number): Promise<DevicePermission[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(devicePermissions)
    .where(
      and(
        eq(devicePermissions.userId, userId),
        or(
          isNull(devicePermissions.expiresAt),
          gt(devicePermissions.expiresAt, new Date())
        )
      )
    );
}

/**
 * Récupérer toutes les permissions d'un utilisateur sur les groupes
 */
export async function getUserGroupPermissions(userId: number): Promise<GroupPermission[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(groupPermissions)
    .where(
      and(
        eq(groupPermissions.userId, userId),
        or(
          isNull(groupPermissions.expiresAt),
          gt(groupPermissions.expiresAt, new Date())
        )
      )
    );
}

/**
 * Mettre à jour une permission d'appareil
 */
export async function updateDevicePermission(
  permissionId: number,
  data: Partial<DevicePermission>
): Promise<DevicePermission> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(devicePermissions)
    .set(data)
    .where(eq(devicePermissions.id, permissionId));

  const updated = await db
    .select()
    .from(devicePermissions)
    .where(eq(devicePermissions.id, permissionId))
    .limit(1);

  if (!updated.length) throw new Error("Permission not found");
  return updated[0];
}

/**
 * Mettre à jour une permission de groupe
 */
export async function updateGroupPermission(
  permissionId: number,
  data: Partial<GroupPermission>
): Promise<GroupPermission> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(groupPermissions)
    .set(data)
    .where(eq(groupPermissions.id, permissionId));

  const updated = await db
    .select()
    .from(groupPermissions)
    .where(eq(groupPermissions.id, permissionId))
    .limit(1);

  if (!updated.length) throw new Error("Permission not found");
  return updated[0];
}

/**
 * Supprimer une permission d'appareil
 */
export async function deleteDevicePermission(permissionId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(devicePermissions)
    .where(eq(devicePermissions.id, permissionId));
}

/**
 * Supprimer une permission de groupe
 */
export async function deleteGroupPermission(permissionId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(groupPermissions)
    .where(eq(groupPermissions.id, permissionId));
}

/**
 * Récupérer toutes les permissions pour un appareil
 */
export async function getDevicePermissions(deviceId: number): Promise<DevicePermission[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(devicePermissions)
    .where(
      and(
        eq(devicePermissions.deviceId, deviceId),
        or(
          isNull(devicePermissions.expiresAt),
          gt(devicePermissions.expiresAt, new Date())
        )
      )
    );
}

/**
 * Récupérer toutes les permissions pour un groupe
 */
export async function getGroupPermissions(groupId: number): Promise<GroupPermission[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(groupPermissions)
    .where(
      and(
        eq(groupPermissions.groupId, groupId),
        or(
          isNull(groupPermissions.expiresAt),
          gt(groupPermissions.expiresAt, new Date())
        )
      )
    );
}
