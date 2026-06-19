import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Download, Copy, CheckCircle2, Loader } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function WireGuardServerConfig() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [selectedNetworkId, setSelectedNetworkId] = useState<number | null>(null);

  // Récupérer les réseaux de l'utilisateur
  const { data: networks, isLoading: networksLoading } = trpc.networks.list.useQuery();

  // Charger la configuration serveur pour le réseau sélectionné
  const { data: configData, isLoading: configLoading } = trpc.wireguard.getNetworkConfig.useQuery(
    { networkId: selectedNetworkId || 0 },
    { enabled: !!selectedNetworkId }
  );

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 border-red-500/30 bg-red-950/20">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-red-500">Accès Refusé</h2>
          <p className="text-muted-foreground mt-2">Vous n'avez pas les permissions pour accéder à cette page.</p>
        </Card>
      </div>
    );
  }

  const handleCopyConfig = (config: string) => {
    navigator.clipboard.writeText(config);
    setCopied(true);
    toast.success("Configuration copiée !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadConfig = (config: string, filename: string) => {
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(config));
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success(`${filename} téléchargé !`);
  };

  const handleLoadConfig = (networkId: number) => {
    setSelectedNetworkId(networkId);
  };

  const serverConfig = configData?.config || "";
  const selectedNetwork = networks?.find((n: any) => n.id === selectedNetworkId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold neon-cyan">Configuration Serveur WireGuard</h1>
          <p className="text-muted-foreground">Générez et déployez la configuration WireGuard sur votre Raspberry Pi</p>
        </div>

        {/* Instructions */}
        <Card className="border-cyan-500/30 p-6 bg-cyan-950/20">
          <h2 className="text-xl font-semibold neon-cyan mb-4">📋 Instructions d'Installation</h2>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="font-bold neon-cyan">1.</span>
              <span>Sélectionnez un réseau et cliquez sur "Charger"</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold neon-cyan">2.</span>
              <span>Téléchargez la configuration serveur</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold neon-cyan">3.</span>
              <span>Connectez-vous à votre Raspberry Pi via SSH</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold neon-cyan">4.</span>
              <span>Copiez le fichier dans <code className="bg-slate-900 px-2 py-1 rounded">/etc/wireguard/wg0.conf</code></span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold neon-cyan">5.</span>
              <span>Exécutez <code className="bg-slate-900 px-2 py-1 rounded">sudo wg-quick up wg0</code></span>
            </li>
          </ol>
        </Card>

        {/* Networks */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold neon-cyan">Réseaux Disponibles</h2>

          {networksLoading ? (
            <Card className="p-6 text-center text-muted-foreground">Chargement...</Card>
          ) : networks && networks.length > 0 ? (
            networks.map((network: any) => (
              <Card key={network.id} className="border-cyan-500/30 p-6 bg-slate-900/30">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold neon-cyan">{network.name}</h3>
                    <p className="text-sm text-muted-foreground">Subnet: {network.vpnSubnet}</p>
                  </div>
                  <Badge variant={network.isActive ? "default" : "secondary"}>
                    {network.isActive ? "Actif" : "Inactif"}
                  </Badge>
                </div>

                {selectedNetworkId === network.id && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-cyan-400">Configuration Serveur (wg0.conf)</label>
                      <div className="bg-slate-950 rounded border border-cyan-500/20 p-4 font-mono text-xs overflow-x-auto max-h-96">
                        <pre className="text-green-400 whitespace-pre-wrap break-words">
                          {configLoading ? "Chargement..." : serverConfig || "Aucune configuration"}
                        </pre>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyConfig(serverConfig)}
                          disabled={!serverConfig || configLoading}
                          className="gap-2"
                        >
                          {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied ? "Copié !" : "Copier"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadConfig(serverConfig, `wg0-${network.name}.conf`)}
                          disabled={!serverConfig || configLoading}
                          className="gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Télécharger
                        </Button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-slate-950/50 rounded p-3">
                        <p className="text-muted-foreground">Subnet VPN</p>
                        <p className="font-mono neon-cyan">{network.vpnSubnet}</p>
                      </div>
                      <div className="bg-slate-950/50 rounded p-3">
                        <p className="text-muted-foreground">Port d'écoute</p>
                        <p className="font-mono neon-cyan">{network.listenPort}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedNetworkId !== network.id && (
                  <Button
                    onClick={() => handleLoadConfig(network.id)}
                    disabled={networksLoading}
                    className="gap-2 w-full"
                  >
                    {networksLoading ? <Loader className="w-4 h-4 animate-spin" /> : "Charger"}
                    Charger la configuration
                  </Button>
                )}
              </Card>
            ))
          ) : (
            <Card className="p-6 text-center text-muted-foreground">
              Aucun réseau disponible. Créez d'abord un réseau.
            </Card>
          )}
        </div>

        {/* Guide */}
        <Card className="border-blue-500/30 p-6 bg-blue-950/20">
          <h2 className="text-lg font-semibold neon-cyan mb-3">📚 Guide Complet</h2>
          <Tabs defaultValue="install" className="space-y-4">
            <TabsList className="bg-slate-900/50 border border-cyan-500/30">
              <TabsTrigger value="install">Installation</TabsTrigger>
              <TabsTrigger value="portforward">Port Forwarding</TabsTrigger>
              <TabsTrigger value="routing">Routage IP</TabsTrigger>
            </TabsList>

            <TabsContent value="install" className="space-y-3 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold neon-cyan">1. Installation de WireGuard</h4>
                <code className="block bg-slate-950 p-3 rounded text-green-400 text-xs overflow-x-auto">
                  sudo apt update && sudo apt install wireguard wireguard-tools
                </code>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold neon-cyan">2. Copier la configuration</h4>
                <code className="block bg-slate-950 p-3 rounded text-green-400 text-xs overflow-x-auto">
                  sudo cp wg0.conf /etc/wireguard/
                </code>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold neon-cyan">3. Activer l'interface</h4>
                <code className="block bg-slate-950 p-3 rounded text-green-400 text-xs overflow-x-auto">
                  sudo wg-quick up wg0
                </code>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold neon-cyan">4. Démarrage automatique</h4>
                <code className="block bg-slate-950 p-3 rounded text-green-400 text-xs overflow-x-auto">
                  sudo systemctl enable wg-quick@wg0
                </code>
              </div>
            </TabsContent>

            <TabsContent value="portforward" className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Vous devez configurer le port forwarding sur votre routeur pour que WireGuard soit accessible depuis l'extérieur.
              </p>
              <div className="bg-slate-950/50 rounded p-3 space-y-2">
                <p className="font-semibold neon-cyan">Étapes:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Accédez à l'interface d'administration de votre routeur</li>
                  <li>Allez dans la section "Port Forwarding"</li>
                  <li>Créez une règle pour rediriger le port UDP vers votre Raspberry Pi</li>
                  <li>Exemple: Port externe 51820 → IP interne 192.168.1.100 Port 51820</li>
                </ol>
              </div>
            </TabsContent>

            <TabsContent value="routing" className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Pour accéder aux appareils du réseau domestique via WireGuard, activez le routage IP.
              </p>
              <div className="bg-slate-950/50 rounded p-3 space-y-2">
                <p className="font-semibold neon-cyan">Activer le routage IP:</p>
                <code className="block bg-slate-950 p-3 rounded text-green-400 text-xs overflow-x-auto">
                  sudo sysctl -w net.ipv4.ip_forward=1
                </code>
              </div>
              <div className="bg-slate-950/50 rounded p-3 space-y-2">
                <p className="font-semibold neon-cyan">Rendre permanent:</p>
                <code className="block bg-slate-950 p-3 rounded text-green-400 text-xs overflow-x-auto">
                  echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
                </code>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
