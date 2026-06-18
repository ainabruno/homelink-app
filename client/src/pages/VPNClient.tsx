import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { AlertCircle, CheckCircle, Download, Copy, Wifi, WifiOff, Globe } from "lucide-react";
import { toast } from "sonner";

export default function VPNClient() {
  const [serverIp, setServerIp] = useState("");
  const [serverPort, setServerPort] = useState("51820");
  const [clientPrivateKey, setClientPrivateKey] = useState("");
  const [clientIp, setClientIp] = useState("10.0.0.2");
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected");
  const [generatedConfig, setGeneratedConfig] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateConfig = () => {
    if (!serverIp || !clientPrivateKey) {
      toast.error("Remplissez tous les champs requis");
      return;
    }

    setIsGenerating(true);
    try {
      const config = `[Interface]
PrivateKey = ${clientPrivateKey}
Address = ${clientIp}/24
DNS = 8.8.8.8, 8.8.4.4

[Peer]
PublicKey = SERVER_PUBLIC_KEY_HERE
Endpoint = ${serverIp}:${serverPort}
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25`;

      setGeneratedConfig(config);
      toast.success("Configuration générée avec succès");
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadConfig = () => {
    if (!generatedConfig) {
      toast.error("Générez d'abord la configuration");
      return;
    }

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(generatedConfig));
    element.setAttribute("download", "wg-client.conf");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Configuration téléchargée");
  };

  const copyToClipboard = () => {
    if (!generatedConfig) {
      toast.error("Générez d'abord la configuration");
      return;
    }

    navigator.clipboard.writeText(generatedConfig);
    toast.success("Configuration copiée dans le presse-papiers");
  };

  const simulateConnection = () => {
    if (!generatedConfig) {
      toast.error("Générez d'abord la configuration");
      return;
    }

    setConnectionStatus("connecting");
    setTimeout(() => {
      setConnectionStatus("connected");
      setIsConnected(true);
      toast.success("Connexion VPN établie");
    }, 2000);
  };

  const disconnect = () => {
    setConnectionStatus("disconnected");
    setIsConnected(false);
    toast.success("Déconnecté du VPN");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold neon-cyan">Client VPN WireGuard</h1>
        <p className="text-muted-foreground">
          Générez et testez votre configuration VPN pour accéder à votre réseau à distance.
        </p>
      </div>

      {/* Connection Status */}
      <Card className={`border-2 p-6 ${isConnected ? "border-neon-green" : "border-red-500"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isConnected ? (
              <Wifi className="w-8 h-8 text-neon-green animate-pulse" />
            ) : (
              <WifiOff className="w-8 h-8 text-red-500" />
            )}
            <div>
              <h2 className="text-xl font-bold">
                {isConnected ? "Connecté au VPN" : "Déconnecté"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isConnected ? `Connecté via ${serverIp}:${serverPort}` : "Pas de connexion VPN active"}
              </p>
            </div>
          </div>
          {isConnected && (
            <Button onClick={disconnect} className="bg-red-600 hover:bg-red-700">
              Déconnecter
            </Button>
          )}
        </div>
      </Card>

      {/* Configuration Section */}
      <Card className="border-neon-cyan p-6">
        <h2 className="text-xl font-bold mb-4 neon-cyan">Configuration Client</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="server-ip">IP du Serveur WireGuard</Label>
            <Input
              id="server-ip"
              placeholder="203.0.113.45 (votre IP publique)"
              value={serverIp}
              onChange={(e) => setServerIp(e.target.value)}
              className="border-neon-cyan mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Trouvez votre IP publique sur votre routeur ou sur https://ifconfig.me
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="server-port">Port du Serveur</Label>
              <Input
                id="server-port"
                type="number"
                placeholder="51820"
                value={serverPort}
                onChange={(e) => setServerPort(e.target.value)}
                className="border-neon-cyan mt-1"
              />
            </div>

            <div>
              <Label htmlFor="client-ip">IP Client VPN</Label>
              <Input
                id="client-ip"
                placeholder="10.0.0.2"
                value={clientIp}
                onChange={(e) => setClientIp(e.target.value)}
                className="border-neon-cyan mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="private-key">Clé Privée Client</Label>
            <Textarea
              id="private-key"
              placeholder="Collez votre clé privée WireGuard ici"
              value={clientPrivateKey}
              onChange={(e) => setClientPrivateKey(e.target.value)}
              className="border-neon-cyan mt-1 font-mono text-xs"
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Générez une clé avec: <code className="bg-black/30 px-2 py-1 rounded">wg genkey</code>
            </p>
          </div>

          <Button onClick={generateConfig} disabled={isGenerating} className="btn-neon-cyan w-full">
            {isGenerating ? <Spinner className="w-4 h-4 mr-2" /> : null}
            Générer Configuration
          </Button>
        </div>
      </Card>

      {/* Generated Config */}
      {generatedConfig && (
        <Card className="border-neon-green p-6">
          <h2 className="text-xl font-bold mb-4 neon-green flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Configuration Générée
          </h2>

          <div className="space-y-4">
            <Textarea
              value={generatedConfig}
              readOnly
              className="border-neon-green font-mono text-xs bg-black/30"
              rows={10}
            />

            <div className="flex gap-2 flex-wrap">
              <Button onClick={copyToClipboard} variant="outline" className="border-neon-cyan text-neon-cyan">
                <Copy className="w-4 h-4 mr-2" />
                Copier
              </Button>

              <Button onClick={downloadConfig} variant="outline" className="border-neon-green text-neon-green">
                <Download className="w-4 h-4 mr-2" />
                Télécharger .conf
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="btn-neon-cyan">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Instructions
                  </Button>
                </DialogTrigger>
                <DialogContent className="border-neon-cyan max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="neon-cyan">Comment utiliser cette configuration?</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 text-sm">
                    <div>
                      <h3 className="font-bold text-neon-green mb-2">1. Sur Windows/Mac/Linux:</h3>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Téléchargez WireGuard depuis https://www.wireguard.com/install/</li>
                        <li>Installez l'application</li>
                        <li>Cliquez sur "Importer" et sélectionnez le fichier .conf téléchargé</li>
                        <li>Cliquez sur "Activer" pour vous connecter</li>
                      </ol>
                    </div>

                    <div>
                      <h3 className="font-bold text-neon-green mb-2">2. Sur iOS/Android:</h3>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Téléchargez l'app WireGuard depuis l'App Store ou Google Play</li>
                        <li>Ouvrez l'app et cliquez sur "+"</li>
                        <li>Scannez le QR code ou importez le fichier .conf</li>
                        <li>Activez la connexion</li>
                      </ol>
                    </div>

                    <Alert className="border-yellow-500 bg-yellow-950/20">
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                      <AlertDescription className="text-yellow-200">
                        Remplacez "SERVER_PUBLIC_KEY_HERE" par la clé publique de votre serveur WireGuard
                      </AlertDescription>
                    </Alert>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </Card>
      )}

      {/* Test Connection */}
      {generatedConfig && (
        <Card className="border-neon-green p-6">
          <h2 className="text-xl font-bold mb-4 neon-green flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Tester la Connexion
          </h2>

          <div className="space-y-4">
            <Alert className="border-blue-500 bg-blue-950/20">
              <AlertCircle className="w-4 h-4 text-blue-400" />
              <AlertDescription className="text-blue-200">
                Cette section simule une connexion VPN. Pour une vraie connexion, utilisez l'application WireGuard officielle.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                onClick={simulateConnection}
                disabled={isConnected || connectionStatus === "connecting"}
                className="btn-neon-cyan flex-1"
              >
                {connectionStatus === "connecting" ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4 mr-2" />
                    Simuler Connexion
                  </>
                )}
              </Button>
            </div>

            {isConnected && (
              <div className="space-y-2 p-4 bg-green-950/20 border border-neon-green rounded">
                <p className="text-neon-green font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Connexion VPN établie
                </p>
                <p className="text-sm text-muted-foreground">
                  Serveur: {serverIp}:{serverPort}
                </p>
                <p className="text-sm text-muted-foreground">
                  IP VPN: {clientIp}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Troubleshooting */}
      <Card className="border-yellow-500 p-6">
        <h2 className="text-xl font-bold mb-4 text-yellow-400">Dépannage</h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div>
            <p className="font-bold text-yellow-300">Pas de connexion?</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Vérifiez que le serveur WireGuard est en cours d'exécution sur le Raspberry Pi</li>
              <li>Vérifiez que le port 51820 est redirigé sur votre routeur Tenda F3</li>
              <li>Vérifiez que votre IP publique est correcte</li>
              <li>Attendez 5 minutes après la configuration du port forwarding</li>
            </ul>
          </div>

          <div>
            <p className="font-bold text-yellow-300">Pas d'Internet via VPN?</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Vérifiez que le forwarding IP est activé sur le Raspberry Pi</li>
              <li>Vérifiez les règles iptables sur le serveur</li>
              <li>Consultez les logs: <code className="bg-black/30 px-1">sudo journalctl -u wg-quick@wg0</code></li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
