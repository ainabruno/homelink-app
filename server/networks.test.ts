import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Networks Router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let ctx: TrpcContext;
  let networkId: number;

  beforeAll(() => {
    ctx = createAuthContext(1);
    caller = appRouter.createCaller(ctx);
  });

  it("should create a network", async () => {
    const result = await caller.networks.create({
      name: "Test Network",
      vpnSubnet: "10.191.143.0/24",
      listenPort: 51820,
    });

    expect(result).toBeDefined();
    expect(result.name).toBe("Test Network");
    expect(result.userId).toBe(ctx.user.id);
    expect(result.vpnSubnet).toBe("10.191.143.0/24");
    expect(result.listenPort).toBe(51820);
    expect(result.serverPrivateKey).toBeDefined();
    expect(result.serverPublicKey).toBeDefined();

    networkId = result.id;
  });

  it("should list networks for user", async () => {
    const networks = await caller.networks.list();

    expect(Array.isArray(networks)).toBe(true);
    expect(networks.length).toBeGreaterThan(0);
    expect(networks[0]?.userId).toBe(ctx.user.id);
  });

  it("should get a specific network", async () => {
    const network = await caller.networks.get({ networkId });

    expect(network).toBeDefined();
    expect(network.id).toBe(networkId);
    expect(network.name).toBe("Test Network");
  });

  it("should update a network", async () => {
    const updated = await caller.networks.update({
      networkId,
      name: "Updated Network",
      publicIp: "203.0.113.42",
      isActive: true,
    });

    expect(updated.name).toBe("Updated Network");
    expect(updated.publicIp).toBe("203.0.113.42");
    expect(updated.isActive).toBe(true);
  });

  it("should reject invalid IP address", async () => {
    try {
      await caller.networks.update({
        networkId,
        publicIp: "invalid-ip",
      });
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error.message).toContain("Invalid");
    }
  });

  it("should reject access to other user's network", async () => {
    const otherUserCtx = createAuthContext(2);
    const otherCaller = appRouter.createCaller(otherUserCtx);

    try {
      await otherCaller.networks.get({ networkId });
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error.message).toContain("access denied");
    }
  });

  it("should delete a network", async () => {
    const result = await caller.networks.delete({ networkId });

    expect(result.success).toBe(true);

    // Verify network is deleted
    try {
      await caller.networks.get({ networkId });
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error.message).toContain("not found");
    }
  });
});

describe("Devices Router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let ctx: TrpcContext;
  let networkId: number;
  let deviceId: number;

  beforeAll(async () => {
    ctx = createAuthContext(1);
    caller = appRouter.createCaller(ctx);

    // Create a network first
    const network = await caller.networks.create({
      name: "Device Test Network",
    });
    networkId = network.id;
  });

  it("should create a device", async () => {
    const result = await caller.devices.create({
      networkId,
      name: "Test Device",
      description: "iPhone 14 Pro",
    });

    expect(result).toBeDefined();
    expect(result.name).toBe("Test Device");
    expect(result.description).toBe("iPhone 14 Pro");
    expect(result.networkId).toBe(networkId);
    expect(result.vpnIp).toBeDefined();
    expect(result.privateKey).toBeDefined();
    expect(result.publicKey).toBeDefined();
    expect(result.presharedKey).toBeDefined();

    deviceId = result.id;
  });

  it("should list devices for network", async () => {
    const devices = await caller.devices.list({ networkId });

    expect(Array.isArray(devices)).toBe(true);
    expect(devices.length).toBeGreaterThan(0);
    expect(devices[0]?.networkId).toBe(networkId);
  });

  it("should get device config", async () => {
    const config = await caller.devices.getConfig({ deviceId });

    expect(config).toBeDefined();
    expect(config.config).toBeDefined();
    expect(config.deviceName).toBe("Test Device");
    expect(config.config).toContain("[Interface]");
    expect(config.config).toContain("[Peer]");
    expect(config.config).toContain("PrivateKey");
    expect(config.config).toContain("PublicKey");
  });

  it("should delete a device", async () => {
    const result = await caller.devices.delete({ deviceId });

    expect(result.success).toBe(true);
  });
});

describe("Connections Router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let ctx: TrpcContext;
  let networkId: number;
  let deviceId: number;
  let connectionId: number;

  beforeAll(async () => {
    ctx = createAuthContext(1);
    caller = appRouter.createCaller(ctx);

    // Create network and device
    const network = await caller.networks.create({
      name: "Connection Test Network",
    });
    networkId = network.id;

    const device = await caller.devices.create({
      networkId,
      name: "Connection Test Device",
    });
    deviceId = device.id;
  });

  it("should create a connection", async () => {
    const result = await caller.connections.create({
      deviceId,
      sourceIp: "203.0.113.100",
      sourceCountry: "FR",
    });

    expect(result).toBeDefined();
    expect(result.deviceId).toBe(deviceId);
    expect(result.networkId).toBe(networkId);
    expect(result.sourceIp).toBe("203.0.113.100");
    expect(result.sourceCountry).toBe("FR");
    expect(result.status).toBe("connected");

    connectionId = result.id;
  });

  it("should list connections", async () => {
    const connections = await caller.connections.list({ networkId });

    expect(Array.isArray(connections)).toBe(true);
    expect(connections.length).toBeGreaterThan(0);
    expect(connections[0]?.networkId).toBe(networkId);
  });

  it("should end a connection", async () => {
    const result = await caller.connections.endConnection({
      connectionId,
      durationSeconds: 3600,
      bytesReceived: "1000000",
      bytesSent: "500000",
    });

    expect(result.status).toBe("disconnected");
    expect(result.durationSeconds).toBe(3600);
    expect(result.endTime).toBeDefined();
  });
});
