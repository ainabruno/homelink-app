import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  createActivityLog,
  createSecurityEvent,
  getActivityLogs,
  getSecurityEvents,
  getActivityStats,
  getSecurityStats,
  resolveSecurityEvent,
  getUnresolvedSecurityEventCount,
} from "./monitoring-db";
import { getDb } from "./db";
import { networks } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const monitoringRouter = router({
  /**
   * Récupérer les logs d'activité avec filtrage
   */
  getActivityLogs: protectedProcedure
    .input(
      z.object({
        networkId: z.number(),
        action: z.string().optional(),
        resourceType: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Vérifier que l'utilisateur a accès au réseau
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const network = await db
          .select()
          .from(networks)
          .where(eq(networks.id, input.networkId))
          .limit(1)
          .then((rows) => rows[0]);

        if (!network || network.userId !== ctx.user?.id) {
          throw new Error("Unauthorized");
        }

        const logs = await getActivityLogs({
          networkId: input.networkId,
          action: input.action,
          resourceType: input.resourceType,
          limit: input.limit,
          offset: input.offset,
          startDate: input.startDate,
          endDate: input.endDate,
        });

        return {
          success: true,
          logs,
        };
      } catch (error) {
        console.error("[Monitoring] Get activity logs failed:", error);
        throw new Error("Failed to get activity logs");
      }
    }),

  /**
   * Récupérer les événements de sécurité avec filtrage
   */
  getSecurityEvents: protectedProcedure
    .input(
      z.object({
        networkId: z.number(),
        eventType: z.string().optional(),
        severity: z.enum(["info", "warning", "critical"]).optional(),
        isResolved: z.boolean().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Vérifier que l'utilisateur a accès au réseau
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const network = await db
          .select()
          .from(networks)
          .where(eq(networks.id, input.networkId))
          .limit(1)
          .then((rows) => rows[0]);

        if (!network || network.userId !== ctx.user?.id) {
          throw new Error("Unauthorized");
        }

        const events = await getSecurityEvents({
          networkId: input.networkId,
          eventType: input.eventType,
          severity: input.severity,
          isResolved: input.isResolved,
          limit: input.limit,
          offset: input.offset,
          startDate: input.startDate,
          endDate: input.endDate,
        });

        return {
          success: true,
          events,
        };
      } catch (error) {
        console.error("[Monitoring] Get security events failed:", error);
        throw new Error("Failed to get security events");
      }
    }),

  /**
   * Récupérer les statistiques d'activité
   */
  getActivityStats: protectedProcedure
    .input(z.object({ networkId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        // Vérifier que l'utilisateur a accès au réseau
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const network = await db
          .select()
          .from(networks)
          .where(eq(networks.id, input.networkId))
          .limit(1)
          .then((rows) => rows[0]);

        if (!network || network.userId !== ctx.user?.id) {
          throw new Error("Unauthorized");
        }

        const stats = await getActivityStats(input.networkId);

        return {
          success: true,
          stats,
        };
      } catch (error) {
        console.error("[Monitoring] Get activity stats failed:", error);
        throw new Error("Failed to get activity stats");
      }
    }),

  /**
   * Récupérer les statistiques de sécurité
   */
  getSecurityStats: protectedProcedure
    .input(z.object({ networkId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        // Vérifier que l'utilisateur a accès au réseau
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const network = await db
          .select()
          .from(networks)
          .where(eq(networks.id, input.networkId))
          .limit(1)
          .then((rows) => rows[0]);

        if (!network || network.userId !== ctx.user?.id) {
          throw new Error("Unauthorized");
        }

        const stats = await getSecurityStats(input.networkId);

        return {
          success: true,
          stats,
        };
      } catch (error) {
        console.error("[Monitoring] Get security stats failed:", error);
        throw new Error("Failed to get security stats");
      }
    }),

  /**
   * Marquer un événement de sécurité comme résolu (admin seulement)
   */
  resolveSecurityEvent: adminProcedure
    .input(z.object({ eventId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const event = await resolveSecurityEvent(input.eventId);

        return {
          success: true,
          event,
        };
      } catch (error) {
        console.error("[Monitoring] Resolve security event failed:", error);
        throw new Error("Failed to resolve security event");
      }
    }),

  /**
   * Récupérer le nombre d'événements non résolus
   */
  getUnresolvedCount: protectedProcedure
    .input(z.object({ networkId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        // Vérifier que l'utilisateur a accès au réseau
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const network = await db
          .select()
          .from(networks)
          .where(eq(networks.id, input.networkId))
          .limit(1)
          .then((rows) => rows[0]);

        if (!network || network.userId !== ctx.user?.id) {
          throw new Error("Unauthorized");
        }

        const count = await getUnresolvedSecurityEventCount(input.networkId);

        return {
          success: true,
          count,
        };
      } catch (error) {
        console.error("[Monitoring] Get unresolved count failed:", error);
        throw new Error("Failed to get unresolved count");
      }
    }),
});
