import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function useNotificationPoller(enabled = true, interval = 5000) {
  const pollerRef = useRef<NodeJS.Timeout | null>(null);
  const lastNotificationIdRef = useRef<number | null>(null);

  // Fetch unread notifications
  const { data: unreadNotifications, refetch } =
    trpc.notifications.getUnread.useQuery(undefined, {
      enabled: false, // Disable automatic fetching
    });

  useEffect(() => {
    if (!enabled) return;

    const pollNotifications = async () => {
      try {
        await refetch();
      } catch (error) {
        console.error("Error polling notifications:", error);
      }
    };

    // Initial poll
    pollNotifications();

    // Set up polling interval
    pollerRef.current = setInterval(pollNotifications, interval);

    return () => {
      if (pollerRef.current) {
        clearInterval(pollerRef.current);
      }
    };
  }, [enabled, interval, refetch]);

  // Show toast for new notifications
  useEffect(() => {
    if (!unreadNotifications || unreadNotifications.length === 0) return;

    const latestNotification = unreadNotifications[0];
    if (
      lastNotificationIdRef.current &&
      latestNotification.id !== lastNotificationIdRef.current
    ) {
      // New notification detected
      const icon = getNotificationIcon(latestNotification.type);
      const color = getToastColor(latestNotification.color);

      toast.success(`${icon} ${latestNotification.title}`, {
        description: latestNotification.message || undefined,
        duration: 5000,
        className: color,
      });
    }

    lastNotificationIdRef.current = latestNotification.id;
  }, [unreadNotifications]);

  return {
    unreadNotifications,
    refetch,
  };
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case "device_connected":
      return "🟢";
    case "device_disconnected":
      return "🔴";
    case "connection_failed":
      return "⚠️";
    case "device_added":
      return "➕";
    case "network_created":
      return "🌐";
    case "security_alert":
      return "🔒";
    default:
      return "ℹ️";
  }
}

function getToastColor(color?: string | null): string {
  switch (color) {
    case "green":
      return "bg-green-950 border-green-500";
    case "red":
      return "bg-red-950 border-red-500";
    case "yellow":
      return "bg-yellow-950 border-yellow-500";
    case "cyan":
    default:
      return "bg-cyan-950 border-cyan-500";
  }
}
