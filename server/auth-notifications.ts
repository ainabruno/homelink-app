import { getDb } from "./db";
import { notifications, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

/**
 * Créer une notification pour l'admin quand un utilisateur se connecte
 */
export async function notifyAdminUserLogin(userId: number, userName: string, userEmail: string) {
  const db = await getDb();
  if (!db) return;

  try {
    // Récupérer l'admin (owner)
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"))
      .then((rows) => rows[0]);

    if (!adminUser) return;

    // Créer une notification pour l'admin
    await db.insert(notifications).values({
      userId: adminUser.id,
      type: "device_connected",
      title: `Nouvel utilisateur connecté`,
      message: `${userName} (${userEmail}) s'est connecté à la plateforme`,
      isRead: false,
      icon: "LogIn",
      color: "green",
      actionUrl: "/admin",
    });

    // Envoyer une notification au propriétaire
    await notifyOwner({
      title: "Nouvel utilisateur connecté",
      content: `${userName} (${userEmail}) s'est connecté à HomeLink à ${new Date().toLocaleTimeString("fr-FR")}`,
    });
  } catch (error) {
    console.error("[Auth Notifications] Failed to notify admin of login:", error);
  }
}

/**
 * Créer une notification pour l'admin quand un utilisateur se déconnecte
 */
export async function notifyAdminUserLogout(userId: number, userName: string, userEmail: string) {
  const db = await getDb();
  if (!db) return;

  try {
    // Récupérer l'admin (owner)
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"))
      .then((rows) => rows[0]);

    if (!adminUser) return;

    // Créer une notification pour l'admin
    await db.insert(notifications).values({
      userId: adminUser.id,
      type: "device_disconnected",
      title: `Utilisateur déconnecté`,
      message: `${userName} (${userEmail}) s'est déconnecté de la plateforme`,
      isRead: false,
      icon: "LogOut",
      color: "slate",
      actionUrl: "/admin",
    });
  } catch (error) {
    console.error("[Auth Notifications] Failed to notify admin of logout:", error);
  }
}

/**
 * Créer une notification pour l'admin quand une tentative de connexion échoue
 */
export async function notifyAdminLoginFailure(email: string, reason: string) {
  const db = await getDb();
  if (!db) return;

  try {
    // Récupérer l'admin (owner)
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"))
      .then((rows) => rows[0]);

    if (!adminUser) return;

    // Créer une notification pour l'admin
    await db.insert(notifications).values({
      userId: adminUser.id,
      type: "connection_failed",
      title: `Tentative de connexion échouée`,
      message: `Tentative de connexion pour ${email}: ${reason}`,
      isRead: false,
      icon: "AlertCircle",
      color: "red",
      actionUrl: "/admin",
    });
  } catch (error) {
    console.error("[Auth Notifications] Failed to notify admin of login failure:", error);
  }
}
