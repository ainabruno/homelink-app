import { execSync } from "child_process";
import { Buffer } from "buffer";

/**
 * Génère une paire de clés WireGuard (privée et publique)
 * Utilise wg-keygen qui doit être installé sur le système
 */
export function generateWireGuardKeyPair(): { privateKey: string; publicKey: string } {
  try {
    // Générer la clé privée
    const privateKey = execSync("wg genkey").toString().trim();

    // Générer la clé publique à partir de la clé privée
    const publicKey = execSync(`echo "${privateKey}" | wg pubkey`).toString().trim();

    return { privateKey, publicKey };
  } catch (error) {
    console.error("[WireGuard] Failed to generate key pair:", error);
    throw new Error("Failed to generate WireGuard keys. Ensure wireguard-tools is installed.");
  }
}

/**
 * Génère une adresse IP VPN unique pour un utilisateur
 * Basé sur l'ID utilisateur et le subnet
 */
export function generateVPNAddress(userId: number, subnet: string): string {
  // Extraire le réseau de base du subnet (ex: 10.191.143.0 de 10.191.143.0/24)
  const [baseNetwork] = subnet.split("/");
  const parts = baseNetwork.split(".");

  // Utiliser l'ID utilisateur pour générer une adresse unique
  // Limiter à 254 (0 et 255 sont réservés)
  const lastOctet = ((userId - 1) % 254 + 1).toString();
  parts[3] = lastOctet;

  return parts.join(".");
}

/**
 * Valide une clé WireGuard (privée ou publique)
 */
export function isValidWireGuardKey(key: string): boolean {
  // Les clés WireGuard sont en base64 et font 44 caractères
  return /^[A-Za-z0-9+/]{42,43}=?$/.test(key);
}

/**
 * Génère une configuration serveur WireGuard complète
 */
export function generateServerConfig(
  privateKey: string,
  listenPort: number,
  vpnSubnet: string,
  peers: Array<{ publicKey: string; allowedIp: string }>
): string {
<<<<<<< Updated upstream
  // Extraire le réseau de base et générer l'IP serveur correctement
  // Ex: 10.191.143.0/24 -> 10.191.143.1
  const baseNetwork = vpnSubnet.split("/")[0];
  const parts = baseNetwork.split(".");
  parts[3] = "1";
  const serverIp = parts.join(".");
=======
  const baseNetwork = vpnSubnet.split("/")[0];
  const serverIp = baseNetwork.replace(/\.0$/, ".1");
>>>>>>> Stashed changes

  let config = `[Interface]
Address = ${serverIp}
ListenPort = ${listenPort}
PrivateKey = ${privateKey}

`;

  // Ajouter les peers (clients)
  peers.forEach((peer, index) => {
    const allowedIp = peer.allowedIp.includes("/") ? peer.allowedIp : `${peer.allowedIp}/32`;
    config += `# Client ${index + 1}
[Peer]
PublicKey = ${peer.publicKey}
AllowedIPs = ${allowedIp}

`;
  });

  return config;
}

/**
 * Génère une configuration client WireGuard complète
 */
export function generateClientConfig(
  privateKey: string,
  clientIp: string,
  serverPublicKey: string,
  serverEndpoint: string,
  listenPort: number,
  vpnSubnet: string
): string {
  // Extraire le réseau VPN pour AllowedIPs
  const vpnNetwork = vpnSubnet;

  const address = clientIp.includes("/") ? clientIp : `${clientIp}/32`;
  return `[Interface]
Address = ${address}
PrivateKey = ${privateKey}
DNS = 8.8.8.8, 8.8.4.4

[Peer]
PublicKey = ${serverPublicKey}
AllowedIPs = ${vpnNetwork}
Endpoint = ${serverEndpoint}:${listenPort}
PersistentKeepalive = 25
`
}

/**
 * Génère une configuration client pour un réseau spécifique
 * Inclut toutes les informations nécessaires
 */
export interface ClientConfigOptions {
  clientPrivateKey: string;
  clientPublicKey: string;
  clientIp: string;
  serverPublicKey: string;
  serverEndpoint: string;
  listenPort: number;
  vpnSubnet: string;
  deviceName: string;
}

export function generateCompleteClientConfig(options: ClientConfigOptions): string {
  const config = generateClientConfig(
    options.clientPrivateKey,
    options.clientIp,
    options.serverPublicKey,
    options.serverEndpoint,
    options.listenPort,
    options.vpnSubnet
  );

  // Ajouter un commentaire avec le nom de l'appareil
  return `# Configuration WireGuard pour ${options.deviceName}
# Généré automatiquement par HomeLink
# Date: ${new Date().toISOString()}

${config}`;
}
