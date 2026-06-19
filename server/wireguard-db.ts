import { getDb } from "./db";
import { networks, devices, Device, Network } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import {
  generateWireGuardKeyPair,
  generateVPNAddress,
  generateServerConfig,
  generateCompleteClientConfig,
} from "./wireguard-keys";

/**
 * Initialise les clés WireGuard pour un réseau
 * Génère les clés serveur si elles n'existent pas
 */
export async function initializeNetworkKeys(networkId: number): Promise<Network> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Récupérer le réseau
  const network = await db.select().from(networks).where(eq(networks.id, networkId)).then((rows) => rows[0]);

  if (!network) {
    throw new Error(`Network ${networkId} not found`);
  }

  // Si les clés existent déjà, retourner le réseau
  if (network.serverPrivateKey && network.serverPublicKey) {
    return network;
  }

  // Générer les clés serveur
  const { privateKey, publicKey } = generateWireGuardKeyPair();

  // Mettre à jour le réseau avec les clés
  await db
    .update(networks)
    .set({
      serverPrivateKey: privateKey,
      serverPublicKey: publicKey,
      updatedAt: new Date(),
    })
    .where(eq(networks.id, networkId));

  // Retourner le réseau mis à jour
  return {
    ...network,
    serverPrivateKey: privateKey,
    serverPublicKey: publicKey,
    updatedAt: new Date(),
  };
}

/**
 * Génère les clés WireGuard pour un appareil
 * Crée une entrée dans la table devices avec les clés
 */
export async function generateDeviceKeys(
  networkId: number,
  deviceName: string,
  description?: string
): Promise<Device> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Récupérer le réseau pour obtenir le subnet
  const network = await db.select().from(networks).where(eq(networks.id, networkId)).then((rows) => rows[0]);

  if (!network) {
    throw new Error(`Network ${networkId} not found`);
  }

  // Générer les clés client
  const { privateKey, publicKey } = generateWireGuardKeyPair();

  // Compter les appareils existants pour générer une adresse IP unique
  const existingDevices = await db
    .select()
    .from(devices)
    .where(eq(devices.networkId, networkId));

  const vpnIp = generateVPNAddress(existingDevices.length + 1, network.vpnSubnet);

  // Créer l'appareil
  const result = await db.insert(devices).values({
    networkId,
    name: deviceName,
    description: description || null,
    vpnIp,
    privateKey,
    publicKey,
    isActive: true,
  });

  // Récupérer l'appareil créé
  const deviceId = (result as any).insertId || (result as any)[0]?.id;
  const device = await db
    .select()
    .from(devices)
    .where(eq(devices.id, Number(deviceId)))
    .then((rows) => rows[0]);

  if (!device) {
    throw new Error("Failed to create device");
  }

  return device;
}

/**
 * Récupère la configuration client complète pour un appareil
 */
export async function getDeviceClientConfig(deviceId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Récupérer l'appareil
  const device = await db.select().from(devices).where(eq(devices.id, deviceId)).then((rows) => rows[0]);

  if (!device) {
    throw new Error(`Device ${deviceId} not found`);
  }

  // Récupérer le réseau
  const network = await db
    .select()
    .from(networks)
    .where(eq(networks.id, device.networkId))
    .then((rows) => rows[0]);

  if (!network) {
    throw new Error(`Network ${device.networkId} not found`);
  }

  // Générer la configuration client
  return generateCompleteClientConfig({
    clientPrivateKey: device.privateKey,
    clientPublicKey: device.publicKey,
    clientIp: device.vpnIp,
    serverPublicKey: network.serverPublicKey,
    serverEndpoint: network.publicIp || network.ddnsDomain || "YOUR_PUBLIC_IP",
    listenPort: network.listenPort,
    vpnSubnet: network.vpnSubnet,
    deviceName: device.name,
  });
}

/**
 * Récupère la configuration serveur complète pour un réseau
 */
export async function getNetworkServerConfig(networkId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Récupérer le réseau
  const network = await db.select().from(networks).where(eq(networks.id, networkId)).then((rows) => rows[0]);

  if (!network) {
    throw new Error(`Network ${networkId} not found`);
  }

  if (!network.serverPrivateKey) {
    throw new Error("Network keys not initialized");
  }

  // Récupérer tous les appareils du réseau
  const networkDevices = await db.select().from(devices).where(eq(devices.networkId, networkId));

  // Construire la liste des peers
  const peers = networkDevices.map((device) => ({
    publicKey: device.publicKey,
    allowedIp: device.vpnIp,
  }));

  // Générer la configuration serveur
  return generateServerConfig(
    network.serverPrivateKey,
    network.listenPort,
    network.vpnSubnet,
    peers
  );
}

/**
 * Récupère tous les appareils d'un réseau avec leurs configurations
 */
export async function getNetworkDevices(networkId: number): Promise<Device[]> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  return db.select().from(devices).where(eq(devices.networkId, networkId));
}

/**
 * Désactive un appareil (révoque l'accès)
 */
export async function revokeDeviceAccess(deviceId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  await db
    .update(devices)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(devices.id, deviceId));
}

/**
 * Réactive un appareil
 */
export async function reactivateDeviceAccess(deviceId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  await db
    .update(devices)
    .set({
      isActive: true,
      updatedAt: new Date(),
    })
    .where(eq(devices.id, deviceId));
}

/**
 * Met à jour la dernière connexion d'un appareil
 */
export async function updateDeviceLastConnected(deviceId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  await db
    .update(devices)
    .set({
      lastConnected: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(devices.id, deviceId));
}
