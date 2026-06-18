import { desc, eq } from "drizzle-orm";
import { speedTests, SpeedTest, InsertSpeedTest } from "../drizzle/schema";
import { getDb } from "./db";

export async function createSpeedTest(data: InsertSpeedTest): Promise<SpeedTest | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(speedTests).values(data);
  const id = result[0]?.insertId;
  
  if (!id) return null;

  const test = await db.select().from(speedTests).where(eq(speedTests.id, id as number)).limit(1);
  return test[0] || null;
}

export async function getSpeedTests(userId: number, limit: number = 50): Promise<SpeedTest[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(speedTests)
    .where(eq(speedTests.userId, userId))
    .orderBy(desc(speedTests.createdAt))
    .limit(limit);
}

export async function getSpeedTestsByNetwork(networkId: number, limit: number = 50): Promise<SpeedTest[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(speedTests)
    .where(eq(speedTests.networkId, networkId))
    .orderBy(desc(speedTests.createdAt))
    .limit(limit);
}

export async function getLatestSpeedTest(userId: number): Promise<SpeedTest | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(speedTests)
    .where(eq(speedTests.userId, userId))
    .orderBy(desc(speedTests.createdAt))
    .limit(1);

  return result[0] || null;
}

export async function getSpeedTestStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const tests = await getSpeedTests(userId, 100);
  
  if (tests.length === 0) {
    return {
      avgPing: 0,
      avgDownload: 0,
      avgUpload: 0,
      maxDownload: 0,
      maxUpload: 0,
      minDownload: 0,
      minUpload: 0,
      totalTests: 0,
    };
  }

  const pings = tests.map(t => parseFloat(t.ping.toString()));
  const downloads = tests.map(t => parseFloat(t.downloadSpeed.toString()));
  const uploads = tests.map(t => parseFloat(t.uploadSpeed.toString()));

  return {
    avgPing: pings.reduce((a, b) => a + b, 0) / pings.length,
    avgDownload: downloads.reduce((a, b) => a + b, 0) / downloads.length,
    avgUpload: uploads.reduce((a, b) => a + b, 0) / uploads.length,
    maxDownload: Math.max(...downloads),
    maxUpload: Math.max(...uploads),
    minDownload: Math.min(...downloads),
    minUpload: Math.min(...uploads),
    totalTests: tests.length,
  };
}

export function getQualityRating(ping: number, download: number, upload: number): "excellent" | "good" | "fair" | "poor" {
  // Excellent: ping < 20ms, download > 100 Mbps, upload > 50 Mbps
  if (ping < 20 && download > 100 && upload > 50) return "excellent";
  
  // Good: ping < 50ms, download > 50 Mbps, upload > 25 Mbps
  if (ping < 50 && download > 50 && upload > 25) return "good";
  
  // Fair: ping < 100ms, download > 10 Mbps, upload > 5 Mbps
  if (ping < 100 && download > 10 && upload > 5) return "fair";
  
  // Poor
  return "poor";
}
