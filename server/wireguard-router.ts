import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  initializeNetworkKeys,
  generateDeviceKeys,
  getDeviceClientConfig,
  getNetworkServerConfig,
  getNetworkDevices,
  revokeDeviceAccess,
  reactivateDeviceAccess,
  updateDeviceLastConnected,
} from "./wireguard-db";
import { getDb } from "./db";
import { networks, devices } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const wireguardRouter = router({
  /**
   * Initialiser les clés WireGuard pour un réseau
   */
  initializeNetwork: protectedProcedure
    .input(z.object({ networkId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const network = await initializeNetworkKeys(input.networkId);
        return {
          success: true,
          network: {
            id: network.id,
            name: network.name,
            serverPublicKey: network.serverPublicKey,
            vpnSubnet: network.vpnSubnet,
            listenPort: network.listenPort,
          },
        };
      } catch (error) {
        console.error("[WireGuard] Initialize network failed:", error);
        throw new Error("Failed to initialize network keys");
      }
    }),

  /**
   * Générer les clés WireGuard pour un nouvel appareil
   */
  generateDeviceKeys: protectedProcedure
    .input(
      z.object({
        networkId: z.number(),
        deviceName: z.string().min(1).max(255),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Vérifier que l'utilisateur a accès au réseau
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const network = await db
          .select()
          .from(networks)
          .where(eq(networks.id, input.networkId))
          .then((rows) => rows[0]);

        if (!network || network.userId !== ctx.user?.id) {
          throw new Error("Unauthorized");
        }

        const device = await generateDeviceKeys(input.networkId, input.deviceName, input.description);

        return {
          success: true,
          device: {
            id: device.id,
            name: device.name,
            vpnIp: device.vpnIp,
            publicKey: device.publicKey,
            isActive: device.isActive,
          },
        };
      } catch (error) {
        console.error("[WireGuard] Generate device keys failed:", error);
        throw new Error("Failed to generate device keys");
      }
    }),

  /**
   * Récupérer la configuration client pour un appareil
   */
  getDeviceConfig: protectedProcedure
    .input(z.object({ deviceId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        // Vérifier que l'utilisateur a accès à l'appareil
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const device = await db
          .select()
          .from(devices)
          .where(eq(devices.id, input.deviceId))
          .then((rows) => rows[0]);

        if (!device) throw new Error("Device not found");

        const network = await db
          .select()
          .from(networks)
          .where(eq(networks.id, device.networkId))
          .then((rows) => rows[0]);

        if (!network || network.userId !== ctx.user?.id) {
          throw new Error("Unauthorized");
        }

        const config = await getDeviceClientConfig(input.deviceId);

        return {
          success: true,
          config,
          device: {
            name: device.name,
            vpnIp: device.vpnIp,
          },
        };
      } catch (error) {
        console.error("[WireGuard] Get device config failed:", error);
        throw new Error("Failed to get device configuration");
      }
    }),

  /**
   * Récupérer la configuration serveur pour un réseau
   */
  getNetworkConfig: protectedProcedure
    .input(z.object({ networkId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        // Vérifier que l'utilisateur a accès au réseau
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const network = await db
          .select()
          .from(networks)
          .where(eq(networks.id, input.networkId))
          .then((rows) => rows[0]);

        if (!network || network.userId !== ctx.user?.id) {
          throw new Error("Unauthorized");
        }

        const config = await getNetworkServerConfig(input.networkId);

        return {
          success: true,
          config,
          network: {
            name: network.name,
            vpnSubnet: network.vpnSubnet,
            listenPort: network.listenPort,
          },
        };
      } catch (error) {
        console.error("[WireGuard] Get network config failed:", error);
        throw new Error("Failed to get network configuration");
      }
    }),

  /**
   * Récupérer tous les appareils d'un réseau
   */
  getNetworkDevices: protectedProcedure
    .input(z.object({ networkId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        // Vérifier que l'utilisateur a accès au réseau
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const network = await db
          .select()
          .from(networks)
          .where(eq(networks.id, input.networkId))
          .then((rows) => rows[0]);

        if (!network || network.userId !== ctx.user?.id) {
          throw new Error("Unauthorized");
        }

        const networkDevices = await getNetworkDevices(input.networkId);

        return {
          success: true,
          devices: networkDevices.map((device) => ({
            id: device.id,
            name: device.name,
            vpnIp: device.vpnIp,
            publicKey: device.publicKey,
            isActive: device.isActive,
            lastConnected: device.lastConnected,
            createdAt: device.createdAt,
          })),
        };
      } catch (error) {
        console.error("[WireGuard] Get network devices failed:", error);
        throw new Error("Failed to get network devices");
      }
    }),

  /**
   * Révoquer l'accès d'un appareil
   */
  revokeDevice: protectedProcedure
    .input(z.object({ deviceId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Vérifier que l'utilisateur a accès à l'appareil
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const device = await db
          .select()
          .from(devices)
          .where(eq(devices.id, input.deviceId))
          .then((rows) => rows[0]);

        if (!device) throw new Error("Device not found");

        const network = await db
          .select()
          .from(networks)
          .where(eq(networks.id, device.networkId))
          .then((rows) => rows[0]);

        if (!network || network.userId !== ctx.user?.id) {
          throw new Error("Unauthorized");
        }

        await revokeDeviceAccess(input.deviceId);

        return {
          success: true,
          message: `Device ${device.name} access revoked`,
        };
      } catch (error) {
        console.error("[WireGuard] Revoke device failed:", error);
        throw new Error("Failed to revoke device access");
      }
    }),

  /**
   * Réactiver l'accès d'un appareil
   */
  reactivateDevice: protectedProcedure
    .input(z.object({ deviceId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Vérifier que l'utilisateur a accès à l'appareil
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const device = await db
          .select()
          .from(devices)
          .where(eq(devices.id, input.deviceId))
          .then((rows) => rows[0]);

        if (!device) throw new Error("Device not found");

        const network = await db
          .select()
          .from(networks)
          .where(eq(networks.id, device.networkId))
          .then((rows) => rows[0]);

        if (!network || network.userId !== ctx.user?.id) {
          throw new Error("Unauthorized");
        }

        await reactivateDeviceAccess(input.deviceId);

        return {
          success: true,
          message: `Device ${device.name} access reactivated`,
        };
      } catch (error) {
        console.error("[WireGuard] Reactivate device failed:", error);
        throw new Error("Failed to reactivate device access");
      }
    }),

  /**
   * Mettre à jour la dernière connexion d'un appareil
   */
  updateLastConnected: protectedProcedure
    .input(z.object({ deviceId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        await updateDeviceLastConnected(input.deviceId);

        return {
          success: true,
          message: "Last connected timestamp updated",
        };
      } catch (error) {
        console.error("[WireGuard] Update last connected failed:", error);
        throw new Error("Failed to update last connected");
      }
    }),
});
