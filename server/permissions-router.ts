import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  checkDevicePermission,
  checkGroupPermission,
  createDevicePermission,
  createGroupPermission,
  updateDevicePermission,
  updateGroupPermission,
  deleteDevicePermission,
  deleteGroupPermission,
  getDevicePermissions,
  getGroupPermissions,
  getUserDevicePermissions,
  getUserGroupPermissions,
} from "./permissions-db";
import { getDb } from "./db";
import { devices, deviceGroups, networks } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const permissionsRouter = router({
  /**
   * Vérifier si l'utilisateur a une permission sur un appareil
   */
  checkDeviceAccess: protectedProcedure
    .input(
      z.object({
        deviceId: z.number(),
        permission: z.enum(["view", "connect", "configure", "admin"]).default("connect"),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Vérifier que l'utilisateur a accès au réseau
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const device = await db
          .select()
          .from(devices)
          .where(eq(devices.id, input.deviceId))
          .limit(1)
          .then((rows) => rows[0]);

        if (!device) throw new Error("Device not found");

        const network = await db
          .select()
          .from(networks)
          .where(eq(networks.id, device.networkId))
          .limit(1)
          .then((rows) => rows[0]);

        if (!network || network.userId !== ctx.user?.id) {
          throw new Error("Unauthorized");
        }

        // Vérifier la permission
        const hasPermission = await checkDevicePermission(
          ctx.user.id,
          input.deviceId,
          input.permission
        );

        return {
          success: true,
          hasPermission,
        };
      } catch (error) {
        console.error("[Permissions] Check device access failed:", error);
        throw new Error("Failed to check device access");
      }
    }),

  /**
   * Vérifier si l'utilisateur a une permission sur un groupe
   */
  checkGroupAccess: protectedProcedure
    .input(
      z.object({
        groupId: z.number(),
        permission: z.enum(["view", "connect", "configure", "admin"]).default("connect"),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Vérifier que l'utilisateur a accès au réseau
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const group = await db
          .select()
          .from(deviceGroups)
          .where(eq(deviceGroups.id, input.groupId))
          .limit(1)
          .then((rows) => rows[0]);

        if (!group) throw new Error("Group not found");

        const network = await db
          .select()
          .from(networks)
          .where(eq(networks.id, group.networkId))
          .limit(1)
          .then((rows) => rows[0]);

        if (!network || network.userId !== ctx.user?.id) {
          throw new Error("Unauthorized");
        }

        // Vérifier la permission
        const hasPermission = await checkGroupPermission(
          ctx.user.id,
          input.groupId,
          input.permission
        );

        return {
          success: true,
          hasPermission,
        };
      } catch (error) {
        console.error("[Permissions] Check group access failed:", error);
        throw new Error("Failed to check group access");
      }
    }),

  /**
   * Récupérer toutes les permissions de l'utilisateur
   */
  getMyPermissions: protectedProcedure.query(async ({ ctx }) => {
    try {
      const devicePerms = await getUserDevicePermissions(ctx.user!.id);
      const groupPerms = await getUserGroupPermissions(ctx.user!.id);

      return {
        success: true,
        devicePermissions: devicePerms,
        groupPermissions: groupPerms,
      };
    } catch (error) {
      console.error("[Permissions] Get my permissions failed:", error);
      throw new Error("Failed to get permissions");
    }
  }),

  /**
   * Admin: Créer une permission pour un appareil
   */
  createDevicePermission: adminProcedure
    .input(
      z.object({
        deviceId: z.number(),
        userId: z.number().optional(),
        groupId: z.number().optional(),
        permission: z.enum(["view", "connect", "configure", "admin"]).default("view"),
        expiresAt: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        if (!input.userId && !input.groupId) {
          throw new Error("Either userId or groupId must be provided");
        }

        const permission = await createDevicePermission({
          deviceId: input.deviceId,
          userId: input.userId,
          groupId: input.groupId,
          permission: input.permission,
          expiresAt: input.expiresAt,
        });

        return {
          success: true,
          permission,
        };
      } catch (error) {
        console.error("[Permissions] Create device permission failed:", error);
        throw new Error("Failed to create device permission");
      }
    }),

  /**
   * Admin: Créer une permission pour un groupe
   */
  createGroupPermission: adminProcedure
    .input(
      z.object({
        groupId: z.number(),
        userId: z.number(),
        permission: z.enum(["view", "connect", "configure", "admin"]).default("view"),
        expiresAt: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const permission = await createGroupPermission({
          groupId: input.groupId,
          userId: input.userId,
          permission: input.permission,
          expiresAt: input.expiresAt,
        });

        return {
          success: true,
          permission,
        };
      } catch (error) {
        console.error("[Permissions] Create group permission failed:", error);
        throw new Error("Failed to create group permission");
      }
    }),

  /**
   * Admin: Récupérer toutes les permissions pour un appareil
   */
  getDevicePermissions: adminProcedure
    .input(z.object({ deviceId: z.number() }))
    .query(async ({ input }) => {
      try {
        const permissions = await getDevicePermissions(input.deviceId);

        return {
          success: true,
          permissions,
        };
      } catch (error) {
        console.error("[Permissions] Get device permissions failed:", error);
        throw new Error("Failed to get device permissions");
      }
    }),

  /**
   * Admin: Récupérer toutes les permissions pour un groupe
   */
  getGroupPermissions: adminProcedure
    .input(z.object({ groupId: z.number() }))
    .query(async ({ input }) => {
      try {
        const permissions = await getGroupPermissions(input.groupId);

        return {
          success: true,
          permissions,
        };
      } catch (error) {
        console.error("[Permissions] Get group permissions failed:", error);
        throw new Error("Failed to get group permissions");
      }
    }),

  /**
   * Admin: Mettre à jour une permission d'appareil
   */
  updateDevicePermission: adminProcedure
    .input(
      z.object({
        permissionId: z.number(),
        permission: z.enum(["view", "connect", "configure", "admin"]).optional(),
        expiresAt: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const permission = await updateDevicePermission(input.permissionId, {
          permission: input.permission,
          expiresAt: input.expiresAt,
        });

        return {
          success: true,
          permission,
        };
      } catch (error) {
        console.error("[Permissions] Update device permission failed:", error);
        throw new Error("Failed to update device permission");
      }
    }),

  /**
   * Admin: Mettre à jour une permission de groupe
   */
  updateGroupPermission: adminProcedure
    .input(
      z.object({
        permissionId: z.number(),
        permission: z.enum(["view", "connect", "configure", "admin"]).optional(),
        expiresAt: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const permission = await updateGroupPermission(input.permissionId, {
          permission: input.permission,
          expiresAt: input.expiresAt,
        });

        return {
          success: true,
          permission,
        };
      } catch (error) {
        console.error("[Permissions] Update group permission failed:", error);
        throw new Error("Failed to update group permission");
      }
    }),

  /**
   * Admin: Supprimer une permission d'appareil
   */
  deleteDevicePermission: adminProcedure
    .input(z.object({ permissionId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await deleteDevicePermission(input.permissionId);

        return {
          success: true,
        };
      } catch (error) {
        console.error("[Permissions] Delete device permission failed:", error);
        throw new Error("Failed to delete device permission");
      }
    }),

  /**
   * Admin: Supprimer une permission de groupe
   */
  deleteGroupPermission: adminProcedure
    .input(z.object({ permissionId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await deleteGroupPermission(input.permissionId);

        return {
          success: true,
        };
      } catch (error) {
        console.error("[Permissions] Delete group permission failed:", error);
        throw new Error("Failed to delete group permission");
      }
    }),
});
