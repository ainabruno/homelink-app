import { describe, it, expect } from "vitest";
import {
  generateVPNAddress,
  isValidWireGuardKey,
  generateServerConfig,
  generateClientConfig,
} from "./wireguard-keys";

describe("WireGuard Key Generation", () => {
  describe("generateVPNAddress", () => {
    it("should generate unique VPN addresses for different user IDs", () => {
      const subnet = "10.191.143.0/24";
      const ip1 = generateVPNAddress(1, subnet);
      const ip2 = generateVPNAddress(2, subnet);
      const ip3 = generateVPNAddress(3, subnet);

      expect(ip1).toBe("10.191.143.1");
      expect(ip2).toBe("10.191.143.2");
      expect(ip3).toBe("10.191.143.3");
    });

    it("should wrap around after 254 users", () => {
      const subnet = "10.191.143.0/24";
      const ip254 = generateVPNAddress(254, subnet);
      const ip255 = generateVPNAddress(255, subnet);

      expect(ip254).toBe("10.191.143.254");
      expect(ip255).toBe("10.191.143.1"); // Wraps around
    });

    it("should work with different subnets", () => {
      const ip1 = generateVPNAddress(1, "192.168.0.0/24");
      const ip2 = generateVPNAddress(1, "172.16.0.0/24");

      expect(ip1).toBe("192.168.0.1");
      expect(ip2).toBe("172.16.0.1");
    });
  });

  describe("isValidWireGuardKey", () => {
    it("should validate correct WireGuard keys", () => {
      // Example valid WireGuard key (base64, 44 chars)
      const validKey = "NusRLhJ7ppCOta6xaGD2/kZqEwZ85NPHEIfdXB/oU=";
      expect(isValidWireGuardKey(validKey)).toBe(true);
    });

    it("should reject invalid keys", () => {
      expect(isValidWireGuardKey("invalid")).toBe(false);
      expect(isValidWireGuardKey("")).toBe(false);
      expect(isValidWireGuardKey("NusRLhJ7ppCOta6xaGD2/kZqEwZ85NPHEIfdXB/oU")).toBe(false); // Missing =
    });
  });

  describe("generateServerConfig", () => {
    it("should generate valid server configuration", () => {
      const privateKey = "NusRLhJ7ppCOta6xaGD2/kZqEwZ85NPHEIfdXB/oU=";
      const listenPort = 51820;
      const vpnSubnet = "10.191.143.0/24";
      const peers = [
        { publicKey: "abc123def456ghi789jkl012mno345pqr678stu=", allowedIp: "10.191.143.2" },
        { publicKey: "xyz789uvw012abc345def678ghi901jkl234mno=", allowedIp: "10.191.143.3" },
      ];

      const config = generateServerConfig(privateKey, listenPort, vpnSubnet, peers);

      expect(config).toContain("[Interface]");
      expect(config).toContain("Address = 10.191.143.1");
      expect(config).toContain(`ListenPort = ${listenPort}`);
      expect(config).toContain(`PrivateKey = ${privateKey}`);
      expect(config).toContain("[Peer]");
      expect(config).toContain("abc123def456ghi789jkl012mno345pqr678stu=");
      expect(config).toContain("10.191.143.2/32");
      expect(config).toContain("xyz789uvw012abc345def678ghi901jkl234mno=");
      expect(config).toContain("10.191.143.3/32");
    });

    it("should handle empty peers list", () => {
      const privateKey = "NusRLhJ7ppCOta6xaGD2/kZqEwZ85NPHEIfdXB/oU=";
      const config = generateServerConfig(privateKey, 51820, "10.191.143.0/24", []);

      expect(config).toContain("[Interface]");
      expect(config).not.toContain("[Peer]");
    });
  });

  describe("generateClientConfig", () => {
    it("should generate valid client configuration", () => {
      const clientConfig = generateClientConfig(
        "clientPrivateKey123456789012345678901234=",
        "10.191.143.2",
        "serverPublicKey1234567890123456789012345=",
        "example.com",
        51820,
        "10.191.143.0/24"
      );

      expect(clientConfig).toContain("[Interface]");
      expect(clientConfig).toContain("Address = 10.191.143.2/32");
      expect(clientConfig).toContain("PrivateKey = clientPrivateKey123456789012345678901234=");
      expect(clientConfig).toContain("[Peer]");
      expect(clientConfig).toContain("PublicKey = serverPublicKey1234567890123456789012345=");
      expect(clientConfig).toContain("AllowedIPs = 10.191.143.0/24");
      expect(clientConfig).toContain("Endpoint = example.com:51820");
      expect(clientConfig).toContain("PersistentKeepalive = 25");
    });

    it("should handle IP addresses as endpoints", () => {
      const clientConfig = generateClientConfig(
        "clientPrivateKey123456789012345678901234=",
        "10.191.143.2",
        "serverPublicKey1234567890123456789012345=",
        "203.0.113.1",
        51820,
        "10.191.143.0/24"
      );

      expect(clientConfig).toContain("Endpoint = 203.0.113.1:51820");
    });
  });
});
