import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { AlertCircle, CheckCircle, Lock, LogOut } from "lucide-react";
import { toast } from "sonner";

export default function SecuritySettings() {
  const { user, logout } = useAuth();
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [selectedNetworkId, setSelectedNetworkId] = useState<number | null>(null);

  // Fetch networks
  const { data: networks, isLoading: networksLoading } = trpc.networks.list.useQuery();

  // Fetch logs for selected network
  const { data: logs, isLoading: logsLoading } = trpc.logs.list.useQuery(
    { networkId: selectedNetworkId || 0, limit: 50 },
    { enabled: !!selectedNetworkId }
  );

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Déconnecté avec succès");
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      network_created: "Réseau créé",
      network_updated: "Réseau mis à jour",
      network_deleted: "Réseau supprimé",
      device_created: "Appareil créé",
      device_updated: "Appareil mis à jour",
      device_deleted: "Appareil supprimé",
      connection_established: "Connexion établie",
      connection_ended: "Connexion terminée",
    };
    return labels[action] || action;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return null;
    }
  };

  if (networksLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold neon-cyan">Paramètres de Sécurité</h1>
        <p className="text-muted-foreground">
          Gérez vos paramètres de sécurité et consultez l'audit log.
        </p>
      </div>

      {/* User Profile */}
      <Card className="border-neon-green p-6">
        <h2 className="text-xl font-bold mb-4 neon-green">Profil Utilisateur</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground">Nom</Label>
            <p className="text-lg font-semibold mt-1">{user?.name || "N/A"}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Email</Label>
            <p className="text-lg font-semibold mt-1">{user?.email || "N/A"}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Rôle</Label>
            <p className="text-lg font-semibold mt-1 capitalize">{user?.role || "user"}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Dernière connexion</Label>
            <p className="text-lg font-semibold mt-1">
              {user?.lastSignedIn ? new Date(user.lastSignedIn).toLocaleString() : "N/A"}
            </p>
          </div>
        </div>
      </Card>

      {/* Session Management */}
      <Card className="border-neon-cyan p-6">
        <h2 className="text-xl font-bold mb-4 neon-cyan">Gestion de Session</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="timeout">Délai d'expiration de session (minutes)</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="timeout"
                type="number"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(parseInt(e.target.value))}
                className="border-neon-cyan"
                min="5"
                max="1440"
              />
              <Button className="btn-neon-cyan">Enregistrer</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Votre session expirera après {sessionTimeout} minutes d'inactivité.
            </p>
          </div>

          <div className="pt-4 border-t border-neon-cyan">
            <Button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Se Déconnecter
            </Button>
          </div>
        </div>
      </Card>

      {/* Audit Log */}
      {networks && networks.length > 0 && (
        <>
          <Card className="border-neon-green p-6">
            <label className="text-base font-semibold">Sélectionner un Réseau pour l'Audit</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
              {networks.map((network) => (
                <Button
                  key={network.id}
                  variant={selectedNetworkId === network.id ? "default" : "outline"}
                  onClick={() => setSelectedNetworkId(network.id)}
                  className={selectedNetworkId === network.id ? "btn-neon-cyan" : ""}
                >
                  {network.name}
                </Button>
              ))}
            </div>
          </Card>

          {selectedNetworkId && (
            <Card className="border-neon-cyan p-6 overflow-x-auto">
              <h2 className="text-xl font-bold mb-4 neon-cyan">Journal d'Audit</h2>
              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner />
                </div>
              ) : logs && logs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-neon-cyan">
                      <TableHead className="text-cyan-400">Statut</TableHead>
                      <TableHead className="text-cyan-400">Action</TableHead>
                      <TableHead className="text-cyan-400">Détails</TableHead>
                      <TableHead className="text-cyan-400">IP</TableHead>
                      <TableHead className="text-cyan-400">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="border-neon-cyan/30 hover:bg-cyan-950/20">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(log.status)}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {getActionLabel(log.action)}
                        </TableCell>
                        <TableCell className="text-sm">{log.details || "-"}</TableCell>
                        <TableCell className="font-mono text-sm">{log.ipAddress || "-"}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
                  <h3 className="text-xl font-bold mb-2">Aucun journal</h3>
                  <p className="text-muted-foreground">
                    Aucune action enregistrée pour ce réseau.
                  </p>
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {/* Security Tips */}
      <Card className="border-neon-green p-6">
        <h2 className="text-xl font-bold mb-4 neon-green flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Conseils de Sécurité
        </h2>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <span>Utilisez des mots de passe forts pour vos appareils VPN</span>
          </li>
          <li className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <span>Mettez à jour régulièrement vos clés WireGuard</span>
          </li>
          <li className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <span>Surveillez l'historique des connexions pour détecter les accès non autorisés</span>
          </li>
          <li className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <span>Révoquez l'accès des appareils que vous n'utilisez plus</span>
          </li>
          <li className="flex gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <span>Utilisez DDNS pour une meilleure disponibilité</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
