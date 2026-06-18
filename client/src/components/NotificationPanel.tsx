import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Check, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function NotificationPanel() {
  const [notifications, setNotifications] = useState<any[]>([]);

  // Fetch all notifications
  const { data: allNotifications, refetch } = trpc.notifications.getAll.useQuery({
    limit: 50,
  });

  // Mark as read mutation
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Toutes les notifications marquées comme lues");
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
  };

  const getNotificationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      device_connected: "Appareil Connecté",
      device_disconnected: "Appareil Déconnecté",
      connection_failed: "Connexion Échouée",
      device_added: "Appareil Ajouté",
      network_created: "Réseau Créé",
      security_alert: "Alerte Sécurité",
    };
    return labels[type] || type;
  };

  const getNotificationColor = (color?: string | null) => {
    switch (color) {
      case "green":
        return "border-green-500/30 bg-green-950/10";
      case "red":
        return "border-red-500/30 bg-red-950/10";
      case "yellow":
        return "border-yellow-500/30 bg-yellow-950/10";
      case "cyan":
      default:
        return "border-cyan-500/30 bg-cyan-950/10";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold neon-cyan">Notifications</h2>
        {notifications.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkAllAsRead}
            className="border-cyan-500 text-cyan-400 hover:bg-cyan-950/30"
          >
            <Check className="w-4 h-4 mr-2" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="grid gap-4">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`border p-4 transition-all ${getNotificationColor(
                notification.color
              )} ${!notification.isRead ? "ring-2 ring-cyan-500/50" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">
                      {notification.type === "device_connected" && "🟢"}
                      {notification.type === "device_disconnected" && "🔴"}
                      {notification.type === "connection_failed" && "⚠️"}
                      {notification.type === "device_added" && "➕"}
                      {notification.type === "network_created" && "🌐"}
                      {notification.type === "security_alert" && "🔒"}
                    </span>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {notification.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {getNotificationTypeLabel(notification.type)}
                      </p>
                    </div>
                  </div>

                  {notification.message && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {notification.message}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  {!notification.isRead && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="text-cyan-400 hover:text-cyan-300"
                      title="Marquer comme lu"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-cyan-500/30 p-8 text-center">
          <p className="text-muted-foreground">Aucune notification</p>
        </Card>
      )}
    </div>
  );
}
