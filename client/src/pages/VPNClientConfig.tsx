import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Copy, CheckCircle2, QrCode } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function VPNClientConfig() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  // Récupérer les réseaux disponibles
  const { data: networks, isLoading: networksLoading } = trpc.networks.list.useQuery();

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

  // Générer une configuration client exemple
  const generateClientConfig = (network: any, deviceName: string) => {
    return `[Interface]
Address = ${network.vpnSubnet.replace("0/24", `${Math.floor(Math.random() * 254) + 2}`)}
PrivateKey = <YOUR_PRIVATE_KEY>
DNS = 8.8.8.8, 8.8.4.4

[Peer]
PublicKey = ${network.serverPublicKey}
AllowedIPs = 0.0.0.0/0
Endpoint = <YOUR_PUBLIC_IP>:${network.listenPort}
PersistentKeepalive = 25`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-green-950 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold neon-green">Configuration Client VPN</h1>
          <p className="text-muted-foreground">Téléchargez votre configuration WireGuard et connectez-vous à HomeLink</p>
        </div>

        {/* Quick Start */}
        <Card className="border-green-500/30 p-6 bg-green-950/20">
          <h2 className="text-xl font-semibold neon-green mb-4">⚡ Démarrage Rapide</h2>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <span className="font-bold neon-green">1.</span>
              <span>Sélectionnez un réseau ci-dessous</span>
            </div>
            <div className="flex gap-3">
              <span className="font-bold neon-green">2.</span>
              <span>Téléchargez votre configuration client</span>
            </div>
            <div className="flex gap-3">
              <span className="font-bold neon-green">3.</span>
              <span>Installez WireGuard sur votre appareil</span>
            </div>
            <div className="flex gap-3">
              <span className="font-bold neon-green">4.</span>
              <span>Importez la configuration et connectez-vous</span>
            </div>
          </div>
        </Card>

        {/* Networks */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold neon-green">Réseaux Disponibles</h2>
          
          {networksLoading ? (
            <Card className="p-6 text-center text-muted-foreground">Chargement...</Card>
          ) : networks && networks.length > 0 ? (
            networks.map((network) => (
              <Card key={network.id} className="border-green-500/30 p-6 bg-slate-900/30">
                <Tabs defaultValue="config" className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold neon-green">{network.name}</h3>
                      <p className="text-sm text-muted-foreground">Subnet: {network.vpnSubnet}</p>
                    </div>
                    <Badge variant={network.isActive ? "default" : "secondary"}>
                      {network.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </div>

                  <TabsList className="bg-slate-900/50 border border-green-500/30">
                    <TabsTrigger value="config">Configuration</TabsTrigger>
                    <TabsTrigger value="guide">Guide</TabsTrigger>
                    <TabsTrigger value="qr">QR Code</TabsTrigger>
                  </TabsList>

                  {/* Config Tab */}
                  <TabsContent value="config" className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-green-400">Configuration Client</label>
                      <div className="bg-slate-950 rounded border border-green-500/20 p-4 font-mono text-xs overflow-x-auto">
                        <pre className="text-green-400 whitespace-pre-wrap break-words">
                          {generateClientConfig(network, user?.name || "Device")}
                        </pre>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyConfig(generateClientConfig(network, user?.name || "Device"))}
                          className="gap-2"
                        >
                          {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied ? "Copié !" : "Copier"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadConfig(generateClientConfig(network, user?.name || "Device"), `${network.name}-client.conf`)}
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
                        <p className="text-muted-foreground">Serveur Public</p>
                        <p className="font-mono neon-green text-xs">Votre IP publique</p>
                      </div>
                      <div className="bg-slate-950/50 rounded p-3">
                        <p className="text-muted-foreground">Port</p>
                        <p className="font-mono neon-green">{network.listenPort}</p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Guide Tab */}
                  <TabsContent value="guide" className="space-y-3">
                    <div className="space-y-4 text-sm">
                      <div>
                        <h4 className="font-semibold neon-green mb-2">📱 Sur Téléphone (Android/iOS)</h4>
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                          <li>Installez l'application WireGuard depuis l'App Store</li>
                          <li>Appuyez sur "+" pour ajouter une configuration</li>
                          <li>Sélectionnez "Créer à partir de fichier"</li>
                          <li>Choisissez le fichier .conf téléchargé</li>
                          <li>Appuyez sur "Activer" pour vous connecter</li>
                        </ol>
                      </div>

                      <div>
                        <h4 className="font-semibold neon-green mb-2">💻 Sur Windows/Mac/Linux</h4>
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                          <li>Installez WireGuard depuis wireguard.com</li>
                          <li>Ouvrez l'application WireGuard</li>
                          <li>Cliquez sur "Importer un tunnel depuis un fichier"</li>
                          <li>Sélectionnez le fichier .conf téléchargé</li>
                          <li>Cliquez sur "Activer" pour vous connecter</li>
                        </ol>
                      </div>

                      <div className="bg-green-950/20 border border-green-500/30 rounded p-3">
                        <p className="text-green-400 font-semibold mb-2">💡 Conseil</p>
                        <p className="text-muted-foreground text-xs">
                          Remplacez "&lt;YOUR_PUBLIC_IP&gt;" par l'adresse IP publique de votre routeur. Vous pouvez la trouver en visitant whatismyipaddress.com
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* QR Code Tab */}
                  <TabsContent value="qr" className="space-y-3">
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-white p-4 rounded-lg">
                        <div className="w-64 h-64 bg-slate-200 rounded flex items-center justify-center">
                          <div className="text-center">
                            <QrCode className="w-16 h-16 mx-auto mb-2 text-slate-400" />
                            <p className="text-sm text-slate-600">QR Code</p>
                            <p className="text-xs text-slate-500 mt-2">Fonctionnalité à venir</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        Scannez ce QR code avec l'application WireGuard pour importer automatiquement votre configuration
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            ))
          ) : (
            <Card className="p-6 text-center text-muted-foreground">
              Aucun réseau disponible. Contactez votre administrateur.
            </Card>
          )}
        </div>

        {/* Support */}
        <Card className="border-blue-500/30 p-6 bg-blue-950/20">
          <h2 className="text-lg font-semibold neon-cyan mb-3">🆘 Besoin d'Aide ?</h2>
          <p className="text-sm text-muted-foreground">
            Si vous avez des problèmes de connexion, consultez la documentation WireGuard officielle ou contactez votre administrateur.
          </p>
        </Card>
      </div>
    </div>
  );
}
