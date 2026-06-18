import { useState, useEffect } from "react";
import { Bell, X, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Notification {
  id: number;
  title: string;
  message?: string | null;
  type: string;
  isRead: boolean;
  icon?: string | null;
  color?: string | null;
  createdAt: Date;
  actionUrl?: string | null;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch unread notifications
  const { data: unreadNotifications, refetch: refetchUnread } =
    trpc.notifications.getUnread.useQuery();

  // Fetch all notifications
  const { data: allNotifications, refetch: refetchAll } =
    trpc.notifications.getAll.useQuery({ limit: 10 });

  // Get notification count
  const { data: notificationCount } = trpc.notifications.getCount.useQuery();

  // Mark as read mutation
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetchUnread();
      refetchAll();
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetchUnread();
      refetchAll();
    },
  });

  useEffect(() => {
    if (allNotifications) {
      setNotifications(allNotifications);
    }
  }, [allNotifications]);

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate({ notificationId });
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
    toast.success("Toutes les notifications marquées comme lues");
  };

  const getNotificationIcon = (type: string) => {
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
  };

  const getNotificationColor = (color?: string) => {
    switch (color) {
      case "green":
        return "text-green-400";
      case "red":
        return "text-red-400";
      case "yellow":
        return "text-yellow-400";
      case "cyan":
      default:
        return "text-cyan-400";
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/30"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {notificationCount && notificationCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full animate-pulse">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 border-neon-cyan p-0">
        <div className="space-y-0">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-cyan-500/30 p-4">
            <h3 className="font-semibold neon-cyan">Notifications</h3>
            {notificationCount && notificationCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleMarkAllAsRead}
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                <Check className="w-3 h-3 mr-1" />
                Tout marquer comme lu
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications && notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border-b border-cyan-500/20 p-4 hover:bg-slate-900/50 transition-colors ${
                    !notification.isRead ? "bg-slate-900/30" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="text-xl mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`font-semibold text-sm ${getNotificationColor(
                            notification.color || undefined
                          )}`}
                        >
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0 mt-1.5" />
                        )}
                      </div>

                      {notification.message && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {/* Action */}
                    {!notification.isRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-cyan-400 hover:text-cyan-300 p-1 h-auto"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Aucune notification
                </p>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
