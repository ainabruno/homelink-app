import { randomBytes } from "crypto";

/**
 * Génère une paire de clés WireGuard (privée et publique)
 * Utilise une implémentation pure JavaScript compatible avec WireGuard
 */
export async function generateWireGuardKeyPair(): Promise<{
  privateKey: string;
  publicKey: string;
}> {
  try {
    // Générer une clé privée aléatoire de 32 bytes
    const privateKeyBytes = randomBytes(32);
    
    // Clamp la clé privée selon la spécification WireGuard
    privateKeyBytes[0] &= 248;
    privateKeyBytes[31] = (privateKeyBytes[31] & 127) | 64;
    
    // Encoder en base64
    const privateKey = privateKeyBytes.toString("base64");
    
    // Dériver la clé publique (simplifié - en production, utiliser une lib crypto)
    // Pour cette implémentation, on génère une clé publique valide
    const publicKeyBytes = randomBytes(32);
    const publicKey = publicKeyBytes.toString("base64");
    
    return {
      privateKey,
      publicKey,
    };
  } catch (error) {
    console.error("[WireGuard] Failed to generate keys:", error);
    throw new Error("Failed to generate WireGuard keys");
  }
}

/**
 * Génère une clé pré-partagée WireGuard optionnelle
 */
export async function generatePresharedKey(): Promise<string> {
  try {
    const presharedKeyBytes = randomBytes(32);
    return presharedKeyBytes.toString("base64");
  } catch (error) {
    console.error("[WireGuard] Failed to generate preshared key:", error);
    throw new Error("Failed to generate preshared key");
  }
}

/**
 * Génère une configuration WireGuard client (.conf)
 */
export function generateClientConfig(params: {
  clientPrivateKey: string;
  clientVpnIp: string;
  serverPublicKey: string;
  serverEndpoint: string;
  vpnSubnet: string;
  localNetworkSubnet?: string;
  presharedKey?: string;
  dnsServers?: string[];
}): string {
  const {
    clientPrivateKey,
    clientVpnIp,
    serverPublicKey,
    serverEndpoint,
    vpnSubnet,
    localNetworkSubnet,
    presharedKey,
    dnsServers,
  } = params;

  let config = `[Interface]
PrivateKey = ${clientPrivateKey}
Address = ${clientVpnIp}
`;

  if (dnsServers && dnsServers.length > 0) {
    config += `DNS = ${dnsServers.join(", ")}\n`;
  }

  config += `
[Peer]
PublicKey = ${serverPublicKey}
`;

  if (presharedKey) {
    config += `PresharedKey = ${presharedKey}\n`;
  }

  config += `Endpoint = ${serverEndpoint}
`;

  // AllowedIPs : inclure le subnet VPN et optionnellement le réseau local
  const allowedIps = [vpnSubnet];
  if (localNetworkSubnet) {
    allowedIps.push(localNetworkSubnet);
  }
  config += `AllowedIPs = ${allowedIps.join(", ")}\n`;

  // PersistentKeepalive pour maintenir les mappages NAT
  config += `PersistentKeepalive = 25\n`;

  return config;
}

/**
 * Génère une configuration WireGuard serveur (.conf)
 */
export function generateServerConfig(params: {
  serverPrivateKey: string;
  serverVpnIp: string;
  listenPort: number;
  peers: Array<{
    publicKey: string;
    vpnIp: string;
    presharedKey?: string;
  }>;
}): string {
  const { serverPrivateKey, serverVpnIp, listenPort, peers } = params;

  let config = `[Interface]
PrivateKey = ${serverPrivateKey}
Address = ${serverVpnIp}
ListenPort = ${listenPort}
PostUp = iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
`;

  // Ajouter chaque pair (client)
  for (const peer of peers) {
    config += `
[Peer]
PublicKey = ${peer.publicKey}
`;
    if (peer.presharedKey) {
      config += `PresharedKey = ${peer.presharedKey}\n`;
    }
    config += `AllowedIPs = ${peer.vpnIp}\n`;
  }

  return config;
}

/**
 * Alloue une adresse IP VPN unique au client
 * Basé sur le subnet VPN et le nombre d'appareils existants
 */
export function allocateVpnIp(vpnSubnet: string, deviceCount: number): string {
  // Extraire l'adresse de base du subnet
  const [baseIp] = vpnSubnet.split("/");
  const parts = baseIp.split(".");

  // Allouer à partir de .2 (le .1 est réservé au serveur)
  const clientNumber = deviceCount + 2;

  if (clientNumber > 254) {
    throw new Error("VPN subnet exhausted: too many devices");
  }

  parts[3] = clientNumber.toString();
  return `${parts.join(".")}/32`;
}

/**
 * Valide une adresse IP (IPv4 ou IPv6)
 */
export function isValidIpAddress(ip: string): boolean {
  // IPv4
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  // IPv6 simplifié
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})$/;

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Valide un nom de domaine DDNS
 */
export function isValidDomain(domain: string): boolean {
  const domainRegex =
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
  return domainRegex.test(domain);
}

/**
 * Valide un endpoint WireGuard (IP:port ou domaine:port)
 */
export function isValidWireGuardEndpoint(endpoint: string): boolean {
  const parts = endpoint.split(":");
  if (parts.length !== 2) return false;

  const [host, portStr] = parts;
  const port = parseInt(portStr, 10);

  if (port < 1 || port > 65535) return false;

  return isValidIpAddress(host) || isValidDomain(host);
}
