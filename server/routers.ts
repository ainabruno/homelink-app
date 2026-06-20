import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
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
import { permissionsRouter } from "./permissions-router";
import { monitoringRouter } from "./monitoring-router";
import { deviceGroupsRouter } from "./groups";
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
import {
  getAllUsersWithStats,
  getRecentConnections,
  getGlobalStats,
  getGlobalLogs,
  getUserDetails,
} from "./admin";
import { notifyAdminUserLogout } from "./auth-notifications";
import { wireguardRouter } from "./wireguard-router";
import { aclRouter } from "./acl-router";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      // Notifier l'admin de la déconnexion
      if (ctx.user) {
        await notifyAdminUserLogout(ctx.user.id, ctx.user.name || "Utilisateur", ctx.user.email || "inconnu");
      }
      
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
        redirectUrl: "/",
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

  // ========== SUBSCRIPTIONS & PAYMENTS ==========
  subscriptions: router({
    getPlans: publicProcedure.query(async () => {
      const { getAllPlans } = await import("./subscriptions");
      return await getAllPlans();
    }),

    getCurrentPlan: protectedProcedure.query(async ({ ctx }) => {
      const { getUserSubscription, getPlanById } = await import("./subscriptions");
      const subscription = await getUserSubscription(ctx.user.id);
      if (!subscription) return null;
      return {
        subscription,
        plan: await getPlanById(subscription.planId),
      };
    }),

    upgradePlan: protectedProcedure
      .input(z.object({ planId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { getPlanById, createSubscription, getUserSubscription } = await import("./subscriptions");
        
        const plan = await getPlanById(input.planId);
        if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });

        const existingSubscription = await getUserSubscription(ctx.user.id);
        if (existingSubscription) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "User already has an active subscription" });
        }

        const now = new Date();
        const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

        return await createSubscription({
          userId: ctx.user.id,
          planId: plan.id,
          currentPeriodStart: now,
          currentPeriodEnd: endDate,
          status: "active",
        });
      }),

    cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
      const { getUserSubscription, cancelSubscription } = await import("./subscriptions");
      
      const subscription = await getUserSubscription(ctx.user.id);
      if (!subscription) throw new TRPCError({ code: "NOT_FOUND", message: "No active subscription" });

      return await cancelSubscription(subscription.id);
    }),
  }),

  payments: router({
    initiatePayment: protectedProcedure
      .input(z.object({ planId: z.number(), phoneNumber: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { getPlanById, createPayment, generateInvoiceNumber } = await import("./subscriptions");
        const { createOrangeMoneyClient } = await import("./orangemoney");

        const plan = await getPlanById(input.planId);
        if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });

        const orderId = `ORDER-${ctx.user.id}-${Date.now()}`;
        const invoiceNumber = await generateInvoiceNumber();

        // Create payment record
        const payment = await createPayment({
          userId: ctx.user.id,
          amount: plan.priceAriary,
          currency: "MGA",
          status: "pending",
          paymentMethod: "orange_money",
          phoneNumber: input.phoneNumber,
          invoiceNumber,
          description: `HomeLink ${plan.displayName} Plan - ${invoiceNumber}`,
        });

        if (!payment) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create payment record" });

        // Initiate Orange Money payment
        const orangeMoney = createOrangeMoneyClient();
        const result = await orangeMoney.initiatePayment({
          amount: plan.priceAriary,
          phoneNumber: input.phoneNumber,
          orderId,
          description: `HomeLink ${plan.displayName} Plan`,
          callbackUrl: `${process.env.VITE_FRONTEND_URL || "http://localhost:3000"}/payment-callback`,
          notificationUrl: `${process.env.BUILT_IN_FORGE_API_URL}/webhooks/orange-money`,
        });

        if (!result.success) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.errorMessage });
        }

        return {
          paymentId: payment.id,
          redirectUrl: result.redirectUrl,
          transactionId: result.transactionId,
        };
      }),

    checkPaymentStatus: protectedProcedure
      .input(z.object({ paymentId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getPaymentById } = await import("./subscriptions");
        const { createOrangeMoneyClient } = await import("./orangemoney");

        const payment = await getPaymentById(input.paymentId);
        if (!payment || payment.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Payment not found" });
        }

        if (!payment.transactionId) {
          return { status: "pending", payment };
        }

        const orangeMoney = createOrangeMoneyClient();
        const status = await orangeMoney.checkPaymentStatus(payment.transactionId);

        return { status, payment };
      }),

    getPaymentHistory: protectedProcedure.query(async ({ ctx }) => {
      const { getUserPayments } = await import("./subscriptions");
      return await getUserPayments(ctx.user.id);
    }),

    getInvoices: protectedProcedure.query(async ({ ctx }) => {
      const { getUserInvoices } = await import("./subscriptions");
      return await getUserInvoices(ctx.user.id);
    }),
  }),

  wireguard: wireguardRouter,

  acl: aclRouter,
  permissions: permissionsRouter,
  monitoring: monitoringRouter,
  deviceGroups: deviceGroupsRouter,

  admin: router({
    getAllUsers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      return await getAllUsersWithStats();
    }),

    getRecentConnections: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        return await getRecentConnections(input.limit);
      }),

    getGlobalStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      return await getGlobalStats();
    }),

    getGlobalLogs: protectedProcedure
      .input(z.object({ limit: z.number().default(100) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        return await getGlobalLogs(input.limit);
      }),

    getUserDetails: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        return await getUserDetails(input.userId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
