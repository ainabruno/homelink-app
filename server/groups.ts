import { getDb } from "./db";
import { deviceGroups, deviceGroupMembers, InsertDeviceGroup, DeviceGroup, DeviceGroupMember } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

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


// Import tRPC
import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

/**
 * tRPC Router pour la gestion des groupes d'appareils
 */
export const deviceGroupsRouter = router({
  list: protectedProcedure
    .input(z.object({ networkId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      try {
        // Si networkId n'est pas fourni, utiliser le premier réseau de l'utilisateur
        let networkId = input?.networkId;
        if (!networkId) {
          const { getNetworksByUserId } = await import("./db");
          const userNetworks = await getNetworksByUserId(ctx.user.id);
          networkId = userNetworks?.[0]?.id;
          if (!networkId) return [];
        }

        const groups = await getGroupsByNetworkId(networkId);

        // Enrichir chaque groupe avec le nombre d'appareils
        const enrichedGroups = await Promise.all(
          (groups || []).map(async (group: any) => {
            const stats = await getGroupStats(group.id);
            return {
              ...group,
              deviceCount: stats?.deviceCount || 0,
            };
          })
        );

        return enrichedGroups;
      } catch (error) {
        console.error("[tRPC] Failed to list device groups:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to list device groups" });
      }
    }),

  create: protectedProcedure
    .input(
      z.object({
        networkId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const group = await createDeviceGroup({
          networkId: input.networkId,
          name: input.name,
          description: input.description || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        if (!group) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create device group" });
        }

        return group;
      } catch (error) {
        console.error("[tRPC] Failed to create device group:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create device group" });
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        groupId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const group = await updateDeviceGroup(input.groupId, {
          name: input.name,
          description: input.description,
          updatedAt: new Date(),
        });

        if (!group) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Device group not found" });
        }

        return group;
      } catch (error) {
        console.error("[tRPC] Failed to update device group:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update device group" });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ groupId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const success = await deleteDeviceGroup(input.groupId);

        if (!success) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete device group" });
        }

        return { success: true };
      } catch (error) {
        console.error("[tRPC] Failed to delete device group:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete device group" });
      }
    }),

  addDevice: protectedProcedure
    .input(
      z.object({
        groupId: z.number(),
        deviceId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const member = await addDeviceToGroup(input.groupId, input.deviceId);

        if (!member) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to add device to group" });
        }

        return member;
      } catch (error) {
        console.error("[tRPC] Failed to add device to group:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to add device to group" });
      }
    }),

  removeDevice: protectedProcedure
    .input(
      z.object({
        groupId: z.number(),
        deviceId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const success = await removeDeviceFromGroup(input.groupId, input.deviceId);

        if (!success) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to remove device from group" });
        }

        return { success: true };
      } catch (error) {
        console.error("[tRPC] Failed to remove device from group:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to remove device from group" });
      }
    }),

  getDevices: protectedProcedure
    .input(z.object({ groupId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const devices = await getGroupDevices(input.groupId);
        return devices || [];
      } catch (error) {
        console.error("[tRPC] Failed to get group devices:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get group devices" });
      }
    }),

  getStats: protectedProcedure
    .input(z.object({ groupId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const stats = await getGroupStats(input.groupId);

        if (!stats) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Device group not found" });
        }

        return stats;
      } catch (error) {
        console.error("[tRPC] Failed to get group stats:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get group stats" });
      }
    }),
});
