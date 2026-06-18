import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc";
import { Activity, Wifi, Users, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Fetch networks
  const { data: networks, isLoading: networksLoading } = trpc.networks.list.useQuery();

  if (networksLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  const primaryNetwork = networks?.[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold neon-cyan">HomeLink Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenue, {user?.name || "utilisateur"}. Gérez votre accès VPN sécurisé.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          onClick={() => navigate("/networks")}
          className="btn-neon-cyan h-12 text-lg"
        >
          Configurer Réseau
        </Button>
        <Button
          onClick={() => navigate("/devices")}
          className="btn-neon-green h-12 text-lg"
        >
          Gérer Appareils
        </Button>
      </div>

      {/* Network Status Cards */}
      {primaryNetwork ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status */}
          <Card className="border-neon-cyan p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">État du Réseau</p>
                <p className="text-2xl font-bold mt-2">
                  {primaryNetwork.isActive ? (
                    <span className="status-online">
                      <CheckCircle className="w-5 h-5" />
                      Actif
                    </span>
                  ) : (
                    <span className="status-offline">
                      <AlertCircle className="w-5 h-5" />
                      Inactif
                    </span>
                  )}
                </p>
              </div>
              <Wifi className="w-8 h-8 neon-cyan" />
            </div>
          </Card>

          {/* Health */}
          <Card className="border-neon-green p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Santé Réseau</p>
                <p className="text-2xl font-bold mt-2">
                  {primaryNetwork.isHealthy ? (
                    <span className="status-online">
                      <CheckCircle className="w-5 h-5" />
                      Sain
                    </span>
                  ) : (
                    <span className="status-idle">
                      <AlertCircle className="w-5 h-5" />
                      Vérification
                    </span>
                  )}
                </p>
              </div>
              <Activity className="w-8 h-8 neon-green" />
            </div>
          </Card>

          {/* VPN Subnet */}
          <Card className="border-neon-cyan p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Subnet VPN</p>
                <p className="text-lg font-mono mt-2 break-all">
                  {primaryNetwork.vpnSubnet}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 neon-cyan" />
            </div>
          </Card>

          {/* Listen Port */}
          <Card className="border-neon-green p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Port d'écoute</p>
                <p className="text-2xl font-bold mt-2">{primaryNetwork.listenPort}</p>
              </div>
              <Users className="w-8 h-8 neon-green" />
            </div>
          </Card>
        </div>
      ) : (
        <Card className="border-neon-cyan p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
          <h3 className="text-xl font-bold mb-2">Aucun réseau configuré</h3>
          <p className="text-muted-foreground mb-4">
            Commencez par créer votre premier réseau domestique.
          </p>
          <Button
            onClick={() => navigate("/networks")}
            className="btn-neon-cyan"
          >
            Créer un Réseau
          </Button>
        </Card>
      )}

      {/* Network Details */}
      {primaryNetwork && (
        <Card className="border-neon-cyan p-6">
          <h2 className="text-xl font-bold mb-4 neon-cyan">Détails du Réseau</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nom du Réseau</p>
              <p className="text-lg font-semibold mt-1">{primaryNetwork.name}</p>
            </div>
            {primaryNetwork.publicIp && (
              <div>
                <p className="text-sm text-muted-foreground">IP Publique</p>
                <p className="text-lg font-mono mt-1">{primaryNetwork.publicIp}</p>
              </div>
            )}
            {primaryNetwork.ddnsDomain && (
              <div>
                <p className="text-sm text-muted-foreground">Domaine DDNS</p>
                <p className="text-lg font-mono mt-1">{primaryNetwork.ddnsDomain}</p>
              </div>
            )}
            {primaryNetwork.ddnsLastUpdated && (
              <div>
                <p className="text-sm text-muted-foreground">Dernière mise à jour DDNS</p>
                <p className="text-lg font-mono mt-1">
                  {new Date(primaryNetwork.ddnsLastUpdated).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Quick Links */}
      <Card className="border-neon-green p-6">
        <h2 className="text-xl font-bold mb-4 neon-green">Navigation Rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/devices")}
            className="justify-start"
          >
            <Users className="w-4 h-4 mr-2" />
            Gérer Appareils
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/history")}
            className="justify-start"
          >
            <Activity className="w-4 h-4 mr-2" />
            Historique Connexions
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/settings")}
            className="justify-start"
          >
            <Wifi className="w-4 h-4 mr-2" />
            Paramètres Sécurité
          </Button>
        </div>
      </Card>
    </div>
  );
}
