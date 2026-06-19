import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  createAccessControlRule,
  getAccessControlRules,
  updateAccessControlRule,
  deleteAccessControlRule,
  checkPermission,
  logSecurityEvent,
  getSecurityEvents,
  getSecurityEventStats,
  logActivity,
  getActivityLogs,
  getActivityStats,
} from "./acl";
import { TRPCError } from "@trpc/server";

export const aclRouter = router({
  /**
   * Gestion des règles d'accès (ACL)
   */

  // Créer une nouvelle règle d'accès
  createRule: adminProcedure
    .input(
      z.object({
        networkId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        sourceType: z.enum(["user", "group", "device"]),
        sourceId: z.number().optional(),
        targetType: z.enum(["device", "group", "network"]),
        targetId: z.number().optional(),
        action: z.enum(["allow", "deny"]),
        priority: z.number().optional(),
        expiresAt: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await createAccessControlRule(input);
        await logActivity({
          userId: ctx.user.id,
          networkId: input.networkId,
          action: "acl_rule_created",
          resourceType: "acl_rule",
          changes: { rule: input },
        });
        return { success: true, message: "Règle créée avec succès" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la création de la règle",
        });
      }
    }),

  // Récupérer les règles d'accès d'un réseau
  getRules: protectedProcedure
    .input(z.object({ networkId: z.number() }))
    .query(async ({ input }) => {
      try {
        return await getAccessControlRules(input.networkId);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des règles",
        });
      }
    }),

  // Mettre à jour une règle d'accès
  updateRule: adminProcedure
    .input(
      z.object({
        ruleId: z.number(),
        networkId: z.number(),
        data: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          action: z.enum(["allow", "deny"]).optional(),
          priority: z.number().optional(),
          isActive: z.boolean().optional(),
          expiresAt: z.date().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await updateAccessControlRule(input.ruleId, input.data);
        await logActivity({
          userId: ctx.user.id,
          networkId: input.networkId,
          action: "acl_rule_updated",
          resourceType: "acl_rule",
          resourceId: input.ruleId,
          changes: input.data,
        });
        return { success: true, message: "Règle mise à jour avec succès" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la mise à jour de la règle",
        });
      }
    }),

  // Supprimer une règle d'accès
  deleteRule: adminProcedure
    .input(z.object({ ruleId: z.number(), networkId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        await deleteAccessControlRule(input.ruleId);
        await logActivity({
          userId: ctx.user.id,
          networkId: input.networkId,
          action: "acl_rule_deleted",
          resourceType: "acl_rule",
          resourceId: input.ruleId,
        });
        return { success: true, message: "Règle supprimée avec succès" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la suppression de la règle",
        });
      }
    }),

  // Vérifier une permission
  checkPermission: protectedProcedure
    .input(
      z.object({
        networkId: z.number(),
        targetType: z.enum(["device", "group", "network"]),
        targetId: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const hasPermission = await checkPermission(
          input.networkId,
          ctx.user.id,
          input.targetType,
          input.targetId
        );
        return { hasPermission };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la vérification de la permission",
        });
      }
    }),

  /**
   * Gestion des événements de sécurité
   */

  // Récupérer les événements de sécurité
  getSecurityEvents: adminProcedure
    .input(
      z.object({
        networkId: z.number(),
        limit: z.number().optional(),
        offset: z.number().optional(),
        severity: z.enum(["info", "warning", "critical"]).optional(),
        eventType: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        return await getSecurityEvents(input.networkId, {
          limit: input.limit,
          offset: input.offset,
          severity: input.severity,
          eventType: input.eventType,
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des événements de sécurité",
        });
      }
    }),

  // Récupérer les statistiques de sécurité
  getSecurityStats: adminProcedure
    .input(z.object({ networkId: z.number(), days: z.number().optional() }))
    .query(async ({ input }) => {
      try {
        return await getSecurityEventStats(input.networkId, input.days);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des statistiques de sécurité",
        });
      }
    }),

  /**
   * Gestion des logs d'activité
   */

  // Récupérer les logs d'activité
  getActivityLogs: adminProcedure
    .input(
      z.object({
        networkId: z.number(),
        limit: z.number().optional(),
        offset: z.number().optional(),
        action: z.string().optional(),
        resourceType: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        return await getActivityLogs(input.networkId, {
          limit: input.limit,
          offset: input.offset,
          action: input.action,
          resourceType: input.resourceType,
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des logs d'activité",
        });
      }
    }),

  // Récupérer les statistiques d'activité
  getActivityStats: adminProcedure
    .input(z.object({ networkId: z.number(), days: z.number().optional() }))
    .query(async ({ input }) => {
      try {
        return await getActivityStats(input.networkId, input.days);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des statistiques d'activité",
        });
      }
    }),
});
