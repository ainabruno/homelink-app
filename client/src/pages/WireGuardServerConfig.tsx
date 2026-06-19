import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Download, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function WireGuardServerConfig() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  // Récupérer les réseaux de l'utilisateur
  const { data: networks, isLoading: networksLoading } = trpc.networks.list.useQuery();

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

  // Générer une configuration serveur exemple
  const generateServerConfig = (network: any) => {
    return `[Interface]
Address = ${network.vpnSubnet.replace("/24", ".1")}
ListenPort = ${network.listenPort}
PrivateKey = ${network.serverPrivateKey}

# Client: Device 1
[Peer]
PublicKey = <CLIENT_PUBLIC_KEY>
AllowedIPs = 10.191.143.2/32

# Client: Device 2
[Peer]
PublicKey = <CLIENT_PUBLIC_KEY>
AllowedIPs = 10.191.143.3/32`;
  };

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
              <span>Téléchargez la configuration serveur ci-dessous</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold neon-cyan">2.</span>
              <span>Connectez-vous à votre Raspberry Pi via SSH</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold neon-cyan">3.</span>
              <span>Copiez le fichier dans <code className="bg-slate-900 px-2 py-1 rounded">/etc/wireguard/wg0.conf</code></span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold neon-cyan">4.</span>
              <span>Exécutez <code className="bg-slate-900 px-2 py-1 rounded">sudo wg-quick up wg0</code></span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold neon-cyan">5.</span>
              <span>Activez le démarrage automatique : <code className="bg-slate-900 px-2 py-1 rounded">sudo systemctl enable wg-quick@wg0</code></span>
            </li>
          </ol>
        </Card>

        {/* Configurations */}
        <Tabs defaultValue="networks" className="space-y-4">
          <TabsList className="bg-slate-900/50 border border-cyan-500/30">
            <TabsTrigger value="networks">Réseaux</TabsTrigger>
            <TabsTrigger value="guide">Guide Complet</TabsTrigger>
          </TabsList>

          {/* Networks Tab */}
          <TabsContent value="networks" className="space-y-4">
            {networksLoading ? (
              <Card className="p-6 text-center text-muted-foreground">Chargement...</Card>
            ) : networks && networks.length > 0 ? (
              networks.map((network) => (
                <Card key={network.id} className="border-cyan-500/30 p-6 bg-slate-900/30">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold neon-cyan">{network.name}</h3>
                        <p className="text-sm text-muted-foreground">Subnet: {network.vpnSubnet}</p>
                      </div>
                      <Badge variant={network.isActive ? "default" : "secondary"}>
                        {network.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </div>

                    {/* Server Config */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-cyan-400">Configuration Serveur (wg0.conf)</label>
                      <div className="bg-slate-950 rounded border border-cyan-500/20 p-4 font-mono text-xs overflow-x-auto">
                        <pre className="text-green-400 whitespace-pre-wrap break-words">
                          {generateServerConfig(network)}
                        </pre>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyConfig(generateServerConfig(network))}
                          className="gap-2"
                        >
                          {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied ? "Copié !" : "Copier"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadConfig(generateServerConfig(network), `wg0-${network.name}.conf`)}
                          className="gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Télécharger
                        </Button>
                      </div>
                    </div>

                    {/* Server Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Port d'écoute</p>
                        <p className="font-mono neon-cyan">{network.listenPort}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Clé Publique</p>
                        <p className="font-mono text-xs neon-green truncate">{network.serverPublicKey}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-6 text-center text-muted-foreground">
                Aucun réseau configuré. Créez d'abord un réseau dans la section Réseaux.
              </Card>
            )}
          </TabsContent>

          {/* Guide Tab */}
          <TabsContent value="guide" className="space-y-4">
            <Card className="border-green-500/30 p-6 bg-green-950/20">
              <h3 className="text-lg font-semibold neon-green mb-4">🚀 Guide Complet d'Installation</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold neon-green mb-2">Prérequis</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Raspberry Pi avec Raspberry Pi OS</li>
                    <li>Accès SSH au Raspberry Pi</li>
                    <li>Connexion Internet stable</li>
                    <li>Port 51820 UDP ouvert sur votre routeur (port forwarding)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold neon-green mb-2">Étape 1 : Installer WireGuard</h4>
                  <div className="bg-slate-950 rounded p-3 font-mono text-xs overflow-x-auto">
                    <pre className="text-green-400">
{`sudo apt update
sudo apt install wireguard wireguard-tools -y`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold neon-green mb-2">Étape 2 : Configurer WireGuard</h4>
                  <div className="bg-slate-950 rounded p-3 font-mono text-xs overflow-x-auto">
                    <pre className="text-green-400">
{`sudo nano /etc/wireguard/wg0.conf
# Collez la configuration serveur ici
# Appuyez sur Ctrl+X, puis Y, puis Entrée pour sauvegarder`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold neon-green mb-2">Étape 3 : Activer le routage IP</h4>
                  <div className="bg-slate-950 rounded p-3 font-mono text-xs overflow-x-auto">
                    <pre className="text-green-400">
{`sudo nano /etc/sysctl.conf
# Décommentez la ligne : net.ipv4.ip_forward=1
# Appuyez sur Ctrl+X, puis Y, puis Entrée

sudo sysctl -p`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold neon-green mb-2">Étape 4 : Démarrer WireGuard</h4>
                  <div className="bg-slate-950 rounded p-3 font-mono text-xs overflow-x-auto">
                    <pre className="text-green-400">
{`sudo wg-quick up wg0
sudo systemctl enable wg-quick@wg0
sudo systemctl status wg-quick@wg0`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold neon-green mb-2">Étape 5 : Configurer le Port Forwarding</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Accédez à l'interface de votre routeur (généralement 192.168.1.1)</li>
                    <li>Allez dans Paramètres → Port Forwarding</li>
                    <li>Redirigez le port 51820 UDP vers l'IP locale de votre Raspberry Pi</li>
                    <li>Sauvegardez les modifications</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold neon-green mb-2">Étape 6 : Tester la Connexion</h4>
                  <div className="bg-slate-950 rounded p-3 font-mono text-xs overflow-x-auto">
                    <pre className="text-green-400">
{`# Sur le Raspberry Pi
sudo wg show

# Vous devriez voir les clients connectés`}
                    </pre>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
