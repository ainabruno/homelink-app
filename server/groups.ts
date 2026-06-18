import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { deviceGroups, deviceGroupMembers, InsertDeviceGroup, DeviceGroup, DeviceGroupMember } from "../drizzle/schema";

/**
 * Créer un nouveau groupe d'appareils
 */
export async function createDeviceGroup(group: InsertDeviceGroup): Promise<DeviceGroup | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(deviceGroups).values(group);
    const id = result[0]?.insertId;
    if (!id) return null;

    const created = await db.select().from(deviceGroups).where(eq(deviceGroups.id, Number(id))).limit(1);
    return created[0] || null;
  } catch (error) {
    console.error("[Database] Failed to create device group:", error);
    throw error;
  }
}

/**
 * Récupérer tous les groupes d'un réseau
 */
export async function getGroupsByNetworkId(networkId: number): Promise<DeviceGroup[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(deviceGroups).where(eq(deviceGroups.networkId, networkId));
  } catch (error) {
    console.error("[Database] Failed to get device groups:", error);
    return [];
  }
}

/**
 * Récupérer un groupe par ID
 */
export async function getGroupById(groupId: number): Promise<DeviceGroup | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(deviceGroups).where(eq(deviceGroups.id, groupId)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get device group:", error);
    return null;
  }
}

/**
 * Mettre à jour un groupe
 */
export async function updateDeviceGroup(groupId: number, updates: Partial<InsertDeviceGroup>): Promise<DeviceGroup | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    await db.update(deviceGroups).set(updates).where(eq(deviceGroups.id, groupId));
    return getGroupById(groupId);
  } catch (error) {
    console.error("[Database] Failed to update device group:", error);
    throw error;
  }
}

/**
 * Supprimer un groupe (supprime aussi les membres)
 */
export async function deleteDeviceGroup(groupId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.delete(deviceGroups).where(eq(deviceGroups.id, groupId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete device group:", error);
    throw error;
  }
}

/**
 * Ajouter un appareil à un groupe
 */
export async function addDeviceToGroup(groupId: number, deviceId: number): Promise<DeviceGroupMember | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Vérifier que le membre n'existe pas déjà
    const existing = await db
      .select()
      .from(deviceGroupMembers)
      .where(and(eq(deviceGroupMembers.groupId, groupId), eq(deviceGroupMembers.deviceId, deviceId)))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const result = await db.insert(deviceGroupMembers).values({ groupId, deviceId });
    const id = result[0]?.insertId;
    if (!id) return null;

    const created = await db.select().from(deviceGroupMembers).where(eq(deviceGroupMembers.id, Number(id))).limit(1);
    return created[0] || null;
  } catch (error) {
    console.error("[Database] Failed to add device to group:", error);
    throw error;
  }
}

/**
 * Retirer un appareil d'un groupe
 */
export async function removeDeviceFromGroup(groupId: number, deviceId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .delete(deviceGroupMembers)
      .where(and(eq(deviceGroupMembers.groupId, groupId), eq(deviceGroupMembers.deviceId, deviceId)));
    return true;
  } catch (error) {
    console.error("[Database] Failed to remove device from group:", error);
    throw error;
  }
}

/**
 * Récupérer les appareils d'un groupe
 */
export async function getGroupDevices(groupId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const members = await db.select().from(deviceGroupMembers).where(eq(deviceGroupMembers.groupId, groupId));
    return members;
  } catch (error) {
    console.error("[Database] Failed to get group devices:", error);
    return [];
  }
}

/**
 * Récupérer les groupes d'un appareil
 */
export async function getDeviceGroups(deviceId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const members = await db.select().from(deviceGroupMembers).where(eq(deviceGroupMembers.deviceId, deviceId));
    return members;
  } catch (error) {
    console.error("[Database] Failed to get device groups:", error);
    return [];
  }
}

/**
 * Récupérer les statistiques d'un groupe (nombre d'appareils, etc.)
 */
export async function getGroupStats(groupId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const group = await getGroupById(groupId);
    if (!group) return null;

    const members = await getGroupDevices(groupId);

    return {
      ...group,
      deviceCount: members.length,
    };
  } catch (error) {
    console.error("[Database] Failed to get group stats:", error);
    return null;
  }
}
