import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createNetwork,
  getNetworksByUserId,
  getNetworkById,
  updateNetwork,
  deleteNetwork,
  createDevice,
  getDevicesByNetworkId,
  getDeviceById,
  updateDevice,
  deleteDevice,
  getConnectionsByNetworkId,
  getConnectionsByDeviceId,
  createConnection,
  updateConnection,
  getLogsByNetworkId,
  getLogsByUserId,
  createLog,
  getBandwidthStats,
} from "./db";
import {
  createNotification,
  getUnreadNotifications,
  getAllNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationCount,
} from "./notifications";
import {
  generateWireGuardKeyPair,
  generatePresharedKey,
  generateClientConfig,
  allocateVpnIp,
  isValidIpAddress,
  isValidDomain,
  isValidWireGuardEndpoint,
} from "./wireguard";
import {
  createSpeedTest,
  getSpeedTests,
  getLatestSpeedTest,
  getSpeedTestStats,
  getQualityRating,
} from "./speedtest";
import {
  createDeviceGroup,
  getGroupsByNetworkId,
  getGroupById,
  updateDeviceGroup,
  deleteDeviceGroup,
  addDeviceToGroup,
  removeDeviceFromGroup,
  getGroupDevices,
  getDeviceGroups,
  getGroupStats,
} from "./groups";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ========== NETWORKS ==========
  networks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getNetworksByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ networkId: z.number() }))
      .query(async ({ ctx, input }) => {
        const network = await getNetworkById(input.networkId);
        if (!network || network.userId !== ctx.user.id) {
          throw new Error("Network not found or access denied");
        }
        return network;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        vpnSubnet: z.string().optional(),
        listenPort: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Générer les clés WireGuard du serveur
        const { privateKey: serverPrivateKey, publicKey: serverPublicKey } = await generateWireGuardKeyPair();

        const network = await createNetwork({
          userId: ctx.user.id,
          name: input.name,
          serverPrivateKey,
          serverPublicKey,
          vpnSubnet: input.vpnSubnet,
          listenPort: input.listenPort,
        });

        // Log l'action
        await createLog({
          userId: ctx.user.id,
          networkId: network.id,
          action: "network_created",
          details: `Network "${input.name}" created`,
          status: "success",
        });

        return network;
      }),

    update: protectedProcedure
      .input(z.object({
        networkId: z.number(),
        name: z.string().optional(),
        publicIp: z.string().optional(),
        ddnsDomain: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const network = await getNetworkById(input.networkId);
        if (!network || network.userId !== ctx.user.id) {
          throw new Error("Network not found or access denied");
        }

        // Valider DDNS si fourni
        if (input.ddnsDomain && !isValidDomain(input.ddnsDomain)) {
          throw new Error("Invalid DDNS domain");
        }

        // Valider IP publique si fournie
        if (input.publicIp && !isValidIpAddress(input.publicIp)) {
          throw new Error("Invalid public IP address");
        }

        const updated = await updateNetwork(input.networkId, {
          name: input.name,
          publicIp: input.publicIp,
          ddnsDomain: input.ddnsDomain,
          isActive: input.isActive,
        });

        await createLog({
          userId: ctx.user.id,
          networkId: input.networkId,
          action: "network_updated",
          details: `Network updated`,
          status: "success",
        });

        return updated;
      }),

    delete: protectedProcedure
      .input(z.object({ networkId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const network = await getNetworkById(input.networkId);
        if (!network || network.userId !== ctx.user.id) {
          throw new Error("Network not found or access denied");
        }

        await deleteNetwork(input.networkId);

        await createLog({
          userId: ctx.user.id,
          networkId: input.networkId,
          action: "network_deleted",
          details: `Network deleted`,
          status: "success",
        });

        return { success: true };
      }),
  }),

  // ========== DEVICES ==========
  devices: router({
    list: protectedProcedure
      .input(z.object({ networkId: z.number() }))
      .query(async ({ ctx, input }) => {
        const network = await getNetworkById(input.networkId);
        if (!network || network.userId !== ctx.user.id) {
          throw new Error("Network not found or access denied");
        }
        return getDevicesByNetworkId(input.networkId);
      }),

    get: protectedProcedure
      .input(z.object({ deviceId: z.number() }))
      .query(async ({ ctx, input }) => {
        const device = await getDeviceById(input.deviceId);
        if (!device) throw new Error("Device not found");

        const network = await getNetworkById(device.networkId);
        if (!network || network.userId !== ctx.user.id) {
          throw new Error("Access denied");
        }

        return device;
      }),

    create: protectedProcedure
      .input(z.object({
        networkId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const network = await getNetworkById(input.networkId);
        if (!network || network.userId !== ctx.user.id) {
          throw new Error("Network not found or access denied");
        }

        // Générer les clés WireGuard du client
        const { privateKey, publicKey } = await generateWireGuardKeyPair();
        const presharedKey = await generatePresharedKey();

        // Compter les appareils existants pour allouer une IP VPN
        const existingDevices = await getDevicesByNetworkId(input.networkId);
        const vpnIp = allocateVpnIp(network.vpnSubnet, existingDevices.length);

        const device = await createDevice({
          networkId: input.networkId,
          name: input.name,
          vpnIp,
          privateKey,
          publicKey,
          presharedKey,
          description: input.description,
        });

        await createLog({
          userId: ctx.user.id,
          networkId: input.networkId,
          action: "device_created",
          details: `Device "${input.name}" created with VPN IP ${vpnIp}`,
          status: "success",
        });

        return device;
      }),

    update: protectedProcedure
      .input(z.object({
        deviceId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const device = await getDeviceById(input.deviceId);
        if (!device) throw new Error("Device not found");

        const network = await getNetworkById(device.networkId);
        if (!network || network.userId !== ctx.user.id) {
          throw new Error("Access denied");
        }

        const updated = await updateDevice(input.deviceId, {
          name: input.name,
          description: input.description,
          isActive: input.isActive,
        });

        await createLog({
          userId: ctx.user.id,
          networkId: device.networkId,
          action: "device_updated",
          details: `Device updated`,
          status: "success",
        });

        return updated;
      }),

    delete: protectedProcedure
      .input(z.object({ deviceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const device = await getDeviceById(input.deviceId);
        if (!device) throw new Error("Device not found");

        const network = await getNetworkById(device.networkId);
        if (!network || network.userId !== ctx.user.id) {
          throw new Error("Access denied");
        }

        await deleteDevice(input.deviceId);

        await createLog({
          userId: ctx.user.id,
          networkId: device.networkId,
          action: "device_deleted",
          details: `Device deleted`,
          status: "success",
        });

        return { success: true };
      }),

    getConfig: protectedProcedure
      .input(z.object({ deviceId: z.number() }))
      .query(async ({ ctx, input }) => {
        const device = await getDeviceById(input.deviceId);
        if (!device) throw new Error("Device not found");

        const network = await getNetworkById(device.networkId);
        if (!network || network.userId !== ctx.user.id) {
          throw new Error("Access denied");
        }

        // Déterminer l'endpoint du serveur
        const serverEndpoint = network.ddnsDomain
          ? `${network.ddnsDomain}:${network.listenPort}`
          : network.publicIp
            ? `${network.publicIp}:${network.listenPort}`
            : "0.0.0.0:51820"; // Fallback

        // Générer la configuration client
        const config = generateClientConfig({
          clientPrivateKey: device.privateKey,
          clientVpnIp: device.vpnIp,
          serverPublicKey: network.serverPublicKey,
          serverEndpoint,
          vpnSubnet: network.vpnSubnet,
          presharedKey: device.presharedKey || undefined,
          dnsServers: ["8.8.8.8", "8.8.4.4"],
        });

        return {
          config,
          deviceName: device.name,
        };
      }),
  }),

  // ========== CONNECTIONS ==========
  connections: router({
    list: protectedProcedure
      .input(z.object({ networkId: z.number(), limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const network = await getNetworkById(input.networkId);
        if (!network || network.userId !== ctx.user.id) {
          throw new Error("Network not found or access denied");
        }
        return getConnectionsByNetworkId(input.networkId, input.limit || 100);
      }),

    listByDevice: protectedProcedure
      .input(z.object({ deviceId: z.number(), limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const device = await getDeviceById(input.deviceId);
        if (!device) throw new Error("Device not found");

        const network = await getNetworkById(device.networkId);
        if (!network || network.userId !== ctx.user.id) {
          throw new Error("Access denied");
        }

        return getConnectionsByDeviceId(input.deviceId, input.limit || 50);
      }),

    create: protectedProcedure
      .input(z.object({
        deviceId: z.number(),
        sourceIp: z.string(),
        sourceCountry: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const device = await getDeviceById(input.deviceId);
        if (!device) throw new Error("Device not found");

        const network = await getNetworkById(device.networkId);
        if (!network || network.userId !== ctx.user.id) {
          throw new Error("Access denied");
        }

        const connection = await createConnection({
          deviceId: input.deviceId,
          networkId: network.id,
          sourceIp: input.sourceIp,
          sourceCountry: input.sourceCountry,
          status: "connected",
        });

        await createLog({
          userId: ctx.user.id,
          networkId: network.id,
          action: "connection_established",
          details: `Device "${device.name}" connected from ${input.sourceIp}`,
          status: "success",
        });

        return connection;
      }),

    endConnection: protectedProcedure
      .input(z.object({
        connectionId: z.number(),
        durationSeconds: z.number().optional(),
        bytesReceived: z.string().optional(),
        bytesSent: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const connection = await updateConnection(input.connectionId, {
          endTime: new Date(),
          durationSeconds: input.durationSeconds,
          bytesReceived: input.bytesReceived ? input.bytesReceived : undefined,
          bytesSent: input.bytesSent ? input.bytesSent : undefined,
          status: "disconnected",
        });

        return connection;
      }),
  }),

  // ========== LOGS ==========
  logs: router({
    list: protectedProcedure
      .input(z.object({ networkId: z.number(), limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const network = await getNetworkById(input.networkId);
        if (!network || network.userId !== ctx.user.id) {
          throw new Error("Network not found or access denied");
        }
        return getLogsByNetworkId(input.networkId, input.limit || 100);
      }),

    listByUser: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return getLogsByUserId(ctx.user.id, input.limit || 100);
      }),
  }),

  notifications: router({
    getUnread: protectedProcedure.query(async ({ ctx }) => {
      return getUnreadNotifications(ctx.user.id);
    }),

    getAll: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return getAllNotifications(ctx.user.id, input.limit || 50);
      }),

    getCount: protectedProcedure.query(async ({ ctx }) => {
      return getNotificationCount(ctx.user.id);
    }),

    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return markNotificationAsRead(input.notificationId);
      }),

    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      return markAllNotificationsAsRead(ctx.user.id);
    }),
  }),

  // ========== BANDWIDTH ==========
  bandwidth: router({
    getStats: protectedProcedure
      .input(z.object({ networkId: z.number() }))
      .query(async ({ ctx, input }) => {
        const network = await getNetworkById(input.networkId);
        if (!network || network.userId !== ctx.user.id) {
          throw new Error("Network not found or access denied");
        }
        return getBandwidthStats(input.networkId);
      }),
  }),
  // ========== DEVICE GROUPS ==========
  groups: router({
    list: protectedProcedure
      .input(z.object({ networkId: z.number() }))
      .query(async ({ ctx, input }) => {
        const network = await getNetworkById(input.networkId);
        if (!network || network.userId !== ctx.user.id) {
          throw new Error("Network not found or access denied");
        }
        return getGroupsByNetworkId(input.networkId);
      }),

    create: protectedProcedure
      .input(z.object({
        networkId: z.number(),
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        category: z.enum(["mobile", "computer", "iot", "other"]),
        color: z.string().optional(),
        icon: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const network = await getNetworkById(input.networkId);
        if (!network || network.userId !== ctx.user.id) {
          throw new Error("Network not found or access denied");
        }
        return createDeviceGroup(input);
      }),

    update: protectedProcedure
      .input(z.object({
        groupId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        category: z.enum(["mobile", "computer", "iot", "other"]).optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const group = await getGroupById(input.groupId);
        if (!group) throw new Error("Group not found");
        const network = await getNetworkById(group.networkId);
        if (!network || network.userId !== ctx.user.id) {
          throw new Error("Access denied");
        }
        const { groupId, ...updates } = input;
        return updateDeviceGroup(groupId, updates);
      }),

    delete: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const group = await getGroupById(input.groupId);
        if (!group) throw new Error("Group not found");
        const network = await getNetworkById(group.networkId);
        if (!network || network.userId !== ctx.user.id) {
          throw new Error("Access denied");
        }
        return deleteDeviceGroup(input.groupId);
      }),

    addDevice: protectedProcedure
      .input(z.object({ groupId: z.number(), deviceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const group = await getGroupById(input.groupId);
        if (!group) throw new Error("Group not found");
        const network = await getNetworkById(group.networkId);
        if (!network || network.userId !== ctx.user.id) {
          throw new Error("Access denied");
        }
        return addDeviceToGroup(input.groupId, input.deviceId);
      }),

    removeDevice: protectedProcedure
      .input(z.object({ groupId: z.number(), deviceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const group = await getGroupById(input.groupId);
        if (!group) throw new Error("Group not found");
        const network = await getNetworkById(group.networkId);
        if (!network || network.userId !== ctx.user.id) {
          throw new Error("Access denied");
        }
        return removeDeviceFromGroup(input.groupId, input.deviceId);
      }),

    getDevices: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .query(async ({ ctx, input }) => {
        const group = await getGroupById(input.groupId);
        if (!group) throw new Error("Group not found");
        const network = await getNetworkById(group.networkId);
        if (!network || network.userId !== ctx.user.id) {
          throw new Error("Access denied");
        }
        return getGroupDevices(input.groupId);
      }),

    getStats: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .query(async ({ ctx, input }) => {
        const group = await getGroupById(input.groupId);
        if (!group) throw new Error("Group not found");
        const network = await getNetworkById(group.networkId);
        if (!network || network.userId !== ctx.user.id) {
          throw new Error("Access denied");
        }
        return getGroupStats(input.groupId);
      }),
  }),

  // ========== SPEED TESTS ==========
  speedtest: router({
    create: protectedProcedure
      .input(z.object({
        networkId: z.number().optional(),
        ping: z.number(),
        downloadSpeed: z.number(),
        uploadSpeed: z.number(),
        jitter: z.number().optional(),
        packetLoss: z.number().optional(),
        testServer: z.string().optional(),
        vpnConnected: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const quality = getQualityRating(input.ping, input.downloadSpeed, input.uploadSpeed);
        return createSpeedTest({
          userId: ctx.user.id,
          networkId: input.networkId || null,
          ping: input.ping.toString(),
          downloadSpeed: input.downloadSpeed.toString(),
          uploadSpeed: input.uploadSpeed.toString(),
          jitter: input.jitter ? input.jitter.toString() : null,
          packetLoss: input.packetLoss ? input.packetLoss.toString() : null,
          testServer: input.testServer,
          vpnConnected: input.vpnConnected || false,
          quality,
        });
      }),

    getHistory: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return getSpeedTests(ctx.user.id, input.limit || 50);
      }),

    getLatest: protectedProcedure.query(async ({ ctx }) => {
      return getLatestSpeedTest(ctx.user.id);
    }),

    getStats: protectedProcedure.query(async ({ ctx }) => {
      return getSpeedTestStats(ctx.user.id);
    }),
  }),
});


export type AppRouter = typeof appRouter;
