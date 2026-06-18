import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function ConnectionHistory() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedNetworkId, setSelectedNetworkId] = useState<number | null>(null);

  // Fetch networks
  const { data: networks, isLoading: networksLoading } = trpc.networks.list.useQuery();

  // Fetch connections for selected network
  const { data: connections, isLoading: connectionsLoading } = trpc.connections.list.useQuery(
    { networkId: selectedNetworkId || 0, limit: 100 },
    { enabled: !!selectedNetworkId }
  );

  if (networksLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!networks || networks.length === 0) {
    return (
      <div className="space-y-8">
        <h1 className="text-4xl font-bold neon-cyan">Historique des Connexions</h1>
        <Card className="border-neon-cyan p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
          <h3 className="text-xl font-bold mb-2">Aucun réseau disponible</h3>
          <p className="text-muted-foreground mb-4">
            Créez d'abord un réseau pour voir l'historique des connexions.
          </p>
          <Button onClick={() => navigate("/networks")} className="btn-neon-cyan">
            Créer un Réseau
          </Button>
        </Card>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "disconnected":
        return <XCircle className="w-4 h-4 text-yellow-400" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "connected":
        return "Connecté";
      case "disconnected":
        return "Déconnecté";
      case "failed":
        return "Échoué";
      default:
        return status;
    }
  };

  const formatBytes = (bytes: number | null | undefined) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds) return "0s";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold neon-cyan">Historique des Connexions</h1>
        <p className="text-muted-foreground">
          Consultez l'historique détaillé de toutes les connexions VPN.
        </p>
      </div>

      {/* Network Selector */}
      <Card className="border-neon-green p-6">
        <label className="text-base font-semibold">Sélectionner un Réseau</label>
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

      {/* Connections Table */}
      {selectedNetworkId && (
        <Card className="border-neon-cyan p-6 overflow-x-auto">
          {connectionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : connections && connections.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-neon-cyan">
                  <TableHead className="text-cyan-400">Statut</TableHead>
                  <TableHead className="text-cyan-400">IP Source</TableHead>
                  <TableHead className="text-cyan-400">Pays</TableHead>
                  <TableHead className="text-cyan-400">Début</TableHead>
                  <TableHead className="text-cyan-400">Durée</TableHead>
                  <TableHead className="text-cyan-400">Données Reçues</TableHead>
                  <TableHead className="text-cyan-400">Données Envoyées</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connections.map((connection) => (
                  <TableRow key={connection.id} className="border-neon-cyan/30 hover:bg-cyan-950/20">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(connection.status)}
                        <span>{getStatusLabel(connection.status)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{connection.sourceIp}</TableCell>
                    <TableCell>{connection.sourceCountry || "-"}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(connection.startTime).toLocaleString()}
                    </TableCell>
                    <TableCell>{formatDuration(connection.durationSeconds)}</TableCell>
                    <TableCell className="text-sm">
                      {formatBytes(connection.bytesReceived ? Number(connection.bytesReceived) : null)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatBytes(connection.bytesSent ? Number(connection.bytesSent) : null)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
              <h3 className="text-xl font-bold mb-2">Aucune connexion</h3>
              <p className="text-muted-foreground">
                Aucune connexion enregistrée pour ce réseau.
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
