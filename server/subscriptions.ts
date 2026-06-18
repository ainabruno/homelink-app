import { eq, desc, and } from "drizzle-orm";
import { plans, subscriptions, payments, invoices, Plan, Subscription, Payment, Invoice, InsertSubscription, InsertPayment, InsertInvoice } from "../drizzle/schema";
import { getDb } from "./db";

// ========== PLANS ==========
export async function getAllPlans(): Promise<Plan[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(plans).where(eq(plans.isActive, true));
}

export async function getPlanById(planId: number): Promise<Plan | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
  return result[0] || null;
}

export async function getPlanByName(name: string): Promise<Plan | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(plans).where(eq(plans.name, name)).limit(1);
  return result[0] || null;
}

// ========== SUBSCRIPTIONS ==========
export async function createSubscription(data: InsertSubscription): Promise<Subscription | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(subscriptions).values(data);
  const id = result[0]?.insertId;
  
  if (!id) return null;

  const sub = await db.select().from(subscriptions).where(eq(subscriptions.id, id as number)).limit(1);
  return sub[0] || null;
}

export async function getUserSubscription(userId: number): Promise<Subscription | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")))
    .limit(1);

  return result[0] || null;
}

export async function updateSubscription(subscriptionId: number, data: Partial<Subscription>): Promise<Subscription | null> {
  const db = await getDb();
  if (!db) return null;

  await db.update(subscriptions).set(data).where(eq(subscriptions.id, subscriptionId));
  
  const result = await db.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId)).limit(1);
  return result[0] || null;
}

export async function cancelSubscription(subscriptionId: number): Promise<Subscription | null> {
  return updateSubscription(subscriptionId, {
    status: "cancelled",
    cancelledAt: new Date(),
  });
}

// ========== PAYMENTS ==========
export async function createPayment(data: InsertPayment): Promise<Payment | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(payments).values(data);
  const id = result[0]?.insertId;
  
  if (!id) return null;

  const payment = await db.select().from(payments).where(eq(payments.id, id as number)).limit(1);
  return payment[0] || null;
}

export async function getPaymentById(paymentId: number): Promise<Payment | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
  return result[0] || null;
}

export async function getPaymentByTransactionId(transactionId: string): Promise<Payment | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(payments).where(eq(payments.transactionId, transactionId)).limit(1);
  return result[0] || null;
}

export async function updatePayment(paymentId: number, data: Partial<Payment>): Promise<Payment | null> {
  const db = await getDb();
  if (!db) return null;

  await db.update(payments).set(data).where(eq(payments.id, paymentId));
  
  const result = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
  return result[0] || null;
}

export async function getUserPayments(userId: number, limit: number = 50): Promise<Payment[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt))
    .limit(limit);
}

// ========== INVOICES ==========
export async function createInvoice(data: InsertInvoice): Promise<Invoice | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(invoices).values(data);
  const id = result[0]?.insertId;
  
  if (!id) return null;

  const invoice = await db.select().from(invoices).where(eq(invoices.id, id as number)).limit(1);
  return invoice[0] || null;
}

export async function getInvoiceById(invoiceId: number): Promise<Invoice | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  return result[0] || null;
}

export async function getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(invoices).where(eq(invoices.invoiceNumber, invoiceNumber)).limit(1);
  return result[0] || null;
}

export async function getUserInvoices(userId: number, limit: number = 50): Promise<Invoice[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(invoices)
    .where(eq(invoices.userId, userId))
    .orderBy(desc(invoices.createdAt))
    .limit(limit);
}

export async function updateInvoice(invoiceId: number, data: Partial<Invoice>): Promise<Invoice | null> {
  const db = await getDb();
  if (!db) return null;

  await db.update(invoices).set(data).where(eq(invoices.id, invoiceId));
  
  const result = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  return result[0] || null;
}

// ========== STATISTICS ==========
export async function getSubscriptionStats() {
  const db = await getDb();
  if (!db) return null;

  const allSubscriptions = await db.select().from(subscriptions);
  const activeCount = allSubscriptions.filter(s => s.status === "active").length;
  const totalRevenue = await db
    .select()
    .from(payments)
    .where(eq(payments.status, "completed"));

  const revenue = totalRevenue.reduce((sum, p) => sum + p.amount, 0);

  return {
    totalSubscriptions: allSubscriptions.length,
    activeSubscriptions: activeCount,
    totalRevenue: revenue,
    totalPayments: totalRevenue.length,
  };
}

export async function generateInvoiceNumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `INV-${year}${month}${day}-${random}`;
}
