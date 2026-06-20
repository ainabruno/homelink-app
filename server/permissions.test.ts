import { describe, it, expect, beforeAll, afterAll } from "vitest";
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
} from "./permissions-db";

describe("Permissions ACL", () => {
  const testDeviceId = 1;
  const testGroupId = 1;
  const testUserId = 1;

  describe("Device Permissions", () => {
    it("should create a device permission", async () => {
      const permission = await createDevicePermission({
        deviceId: testDeviceId,
        userId: testUserId,
        permission: "connect",
      });

      expect(permission).toBeDefined();
      expect(permission.deviceId).toBe(testDeviceId);
      expect(permission.userId).toBe(testUserId);
      expect(permission.permission).toBe("connect");
    });

    it("should check device permission - allowed", async () => {
      const hasPermission = await checkDevicePermission(testUserId, testDeviceId, "view");
      expect(hasPermission).toBe(true);
    });

    it("should check device permission - denied for higher level", async () => {
      // Permission est "connect" (niveau 1), on demande "configure" (niveau 2)
      const hasPermission = await checkDevicePermission(testUserId, testDeviceId, "configure");
      expect(hasPermission).toBe(false);
    });

    it("should update device permission", async () => {
      const permissions = await getDevicePermissions(testDeviceId);
      if (permissions.length > 0) {
        const updated = await updateDevicePermission(permissions[0].id, {
          permission: "configure",
        });

        expect(updated.permission).toBe("configure");
      }
    });

    it("should get all device permissions", async () => {
      const permissions = await getDevicePermissions(testDeviceId);
      expect(Array.isArray(permissions)).toBe(true);
    });

    it("should delete device permission", async () => {
      const permissions = await getDevicePermissions(testDeviceId);
      if (permissions.length > 0) {
        await deleteDevicePermission(permissions[0].id);
        const remaining = await getDevicePermissions(testDeviceId);
        expect(remaining.length).toBeLessThan(permissions.length);
      }
    });
  });

  describe("Group Permissions", () => {
    it("should create a group permission", async () => {
      const permission = await createGroupPermission({
        groupId: testGroupId,
        userId: testUserId,
        permission: "view",
      });

      expect(permission).toBeDefined();
      expect(permission.groupId).toBe(testGroupId);
      expect(permission.userId).toBe(testUserId);
      expect(permission.permission).toBe("view");
    });

    it("should check group permission - allowed", async () => {
      const hasPermission = await checkGroupPermission(testUserId, testGroupId, "view");
      expect(hasPermission).toBe(true);
    });

    it("should check group permission - denied for higher level", async () => {
      // Permission est "view" (niveau 0), on demande "connect" (niveau 1)
      const hasPermission = await checkGroupPermission(testUserId, testGroupId, "connect");
      expect(hasPermission).toBe(false);
    });

    it("should update group permission", async () => {
      const permissions = await getGroupPermissions(testGroupId);
      if (permissions.length > 0) {
        const updated = await updateGroupPermission(permissions[0].id, {
          permission: "admin",
        });

        expect(updated.permission).toBe("admin");
      }
    });

    it("should get all group permissions", async () => {
      const permissions = await getGroupPermissions(testGroupId);
      expect(Array.isArray(permissions)).toBe(true);
    });

    it("should delete group permission", async () => {
      const permissions = await getGroupPermissions(testGroupId);
      if (permissions.length > 0) {
        await deleteGroupPermission(permissions[0].id);
        const remaining = await getGroupPermissions(testGroupId);
        expect(remaining.length).toBeLessThan(permissions.length);
      }
    });
  });

  describe("Permission Levels", () => {
    it("should respect permission hierarchy", async () => {
      // Créer une permission avec niveau "connect"
      const perm = await createDevicePermission({
        deviceId: testDeviceId,
        userId: 999,
        permission: "connect",
      });

      // Vérifier les niveaux
      const canView = await checkDevicePermission(999, testDeviceId, "view");
      const canConnect = await checkDevicePermission(999, testDeviceId, "connect");
      const canConfigure = await checkDevicePermission(999, testDeviceId, "configure");
      const canAdmin = await checkDevicePermission(999, testDeviceId, "admin");

      expect(canView).toBe(true); // view < connect
      expect(canConnect).toBe(true); // connect == connect
      expect(canConfigure).toBe(false); // configure > connect
      expect(canAdmin).toBe(false); // admin > connect

      // Cleanup
      await deleteDevicePermission(perm.id);
    });
  });

  describe("Permission Expiration", () => {
    it("should respect permission expiration", async () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60); // 1 heure passée

      const perm = await createDevicePermission({
        deviceId: testDeviceId,
        userId: 888,
        permission: "admin",
        expiresAt: pastDate,
      });

      // La permission est expirée
      const hasPermission = await checkDevicePermission(888, testDeviceId, "view");
      expect(hasPermission).toBe(false);

      // Cleanup
      await deleteDevicePermission(perm.id);
    });

    it("should allow future expiration", async () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60); // 1 heure future

      const perm = await createDevicePermission({
        deviceId: testDeviceId,
        userId: 777,
        permission: "admin",
        expiresAt: futureDate,
      });

      // La permission est valide
      const hasPermission = await checkDevicePermission(777, testDeviceId, "view");
      expect(hasPermission).toBe(true);

      // Cleanup
      await deleteDevicePermission(perm.id);
    });
  });
});
