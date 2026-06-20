import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Copy, CheckCircle2, Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function VPNClientConfig() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [selectedNetworkId, setSelectedNetworkId] = useState<number | null>(null);
  const [deviceName, setDeviceName] = useState("");
  const [isCreatingDevice, setIsCreatingDevice] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Récupérer les réseaux disponibles
  const { data: networks, isLoading: networksLoading } = trpc.networks.list.useQuery();

  // Récupérer les appareils d'un réseau
  const { data: networkDevices, isLoading: devicesLoading } = trpc.wireguard.getNetworkDevices.useQuery(
    { networkId: selectedNetworkId! },
    { enabled: !!selectedNetworkId }
  );

  // Mutations
  const generateDeviceKeysMutation = trpc.wireguard.generateDeviceKeys.useMutation();
  const utils = trpc.useUtils();

  const handleCreateDevice = async (networkId: number) => {
    if (!deviceName.trim()) {
      toast.error("Veuillez entrer un nom d'appareil");
      return;
    }

    setIsCreatingDevice(true);
    try {
      const result = await generateDeviceKeysMutation.mutateAsync({
        networkId,
        deviceName: deviceName.trim(),
        description: `Device créé par ${user?.name || "utilisateur"}`,
      });

      if (result.success) {
        toast.success(`Appareil "${deviceName}" créé avec succès !`);
        setDeviceName("");
        setDialogOpen(false);
        // Refresh devices list
        await utils.wireguard.getNetworkDevices.invalidate({ networkId });
      }
    } catch (error) {
      toast.error("Erreur lors de la création de l'appareil");
      console.error(error);
    } finally {
      setIsCreatingDevice(false);
    }
  };

  const handleDownloadConfig = async (deviceId: number, deviceName: string) => {
    try {
      const result = await utils.wireguard.getDeviceConfig.fetch({ deviceId });
      if (result.success && result.config) {
        const element = document.createElement("a");
        element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(result.config));
        element.setAttribute("download", `${deviceName}.conf`);
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        toast.success(`${deviceName}.conf téléchargé !`);
      }
    } catch (error) {
      toast.error("Erreur lors du téléchargement de la configuration");
      console.error(error);
    }
  };

  const handleCopyConfig = async (deviceId: number) => {
    try {
      const result = await utils.wireguard.getDeviceConfig.fetch({ deviceId });
      if (result.success && result.config) {
        navigator.clipboard.writeText(result.config);
        setCopied(true);
        toast.success("Configuration copiée !");
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      toast.error("Erreur lors de la copie");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-green-950 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold neon-green">Configuration Client VPN</h1>
          <p className="text-muted-foreground">Créez et téléchargez votre configuration WireGuard pour accéder à HomeLink</p>
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
              <span>Créez un nouvel appareil avec un nom unique</span>
            </div>
            <div className="flex gap-3">
              <span className="font-bold neon-green">3.</span>
              <span>Téléchargez votre configuration client</span>
            </div>
            <div className="flex gap-3">
              <span className="font-bold neon-green">4.</span>
              <span>Installez WireGuard et importez la configuration</span>
            </div>
          </div>
        </Card>

        {/* Networks */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold neon-green">Réseaux Disponibles</h2>

          {networksLoading ? (
            <Card className="p-6 text-center text-muted-foreground">Chargement des réseaux...</Card>
          ) : networks && networks.length > 0 ? (
            networks.map((network) => (
              <Card key={network.id} className="border-green-500/30 p-6 bg-slate-900/30">
                <div className="space-y-4">
                  {/* Network Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold neon-green">{network.name}</h3>
                      <p className="text-sm text-muted-foreground">Subnet: {network.vpnSubnet}</p>
                    </div>
                    <Badge variant={network.isActive ? "default" : "secondary"}>
                      {network.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </div>

                  {/* Create Device Button */}
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setSelectedNetworkId(network.id)}
                      >
                        <Plus className="w-4 h-4" />
                        Créer un nouvel appareil
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Créer un nouvel appareil pour {network.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="device-name">Nom de l'appareil</Label>
                          <Input
                            id="device-name"
                            placeholder="ex: Mon Laptop, Mon Téléphone"
                            value={deviceName}
                            onChange={(e) => setDeviceName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleCreateDevice(network.id);
                              }
                            }}
                          />
                        </div>
                        <Button
                          onClick={() => handleCreateDevice(network.id)}
                          disabled={isCreatingDevice || !deviceName.trim()}
                          className="w-full gap-2"
                        >
                          {isCreatingDevice && <Loader2 className="w-4 h-4 animate-spin" />}
                          Créer l'appareil
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Devices List */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-green-400">Mes Appareils</h4>

                    {selectedNetworkId === network.id && devicesLoading ? (
                      <div className="text-center text-muted-foreground text-sm">Chargement des appareils...</div>
                    ) : networkDevices && networkDevices.devices && networkDevices.devices.length > 0 ? (
                      <div className="space-y-2">
                        {networkDevices.devices.map((device) => (
                          <Card key={device.id} className="p-4 bg-slate-950/50 border-green-500/20">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-green-400">{device.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  IP VPN: {device.vpnIp} • {device.isActive ? "Actif" : "Inactif"}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCopyConfig(device.id)}
                                  className="gap-2"
                                >
                                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                  {copied ? "Copié" : "Copier"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadConfig(device.id, device.name)}
                                  className="gap-2"
                                >
                                  <Download className="w-4 h-4" />
                                  Télécharger
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : selectedNetworkId === network.id ? (
                      <div className="text-center text-muted-foreground text-sm py-4">
                        Aucun appareil créé. Créez-en un pour commencer.
                      </div>
                    ) : null}
                  </div>

                  {/* Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-slate-950/50 rounded p-3">
                      <p className="text-muted-foreground">Port VPN</p>
                      <p className="font-mono neon-green">{network.listenPort}</p>
                    </div>
                    <div className="bg-slate-950/50 rounded p-3">
                      <p className="text-muted-foreground">Subnet</p>
                      <p className="font-mono neon-green text-xs">{network.vpnSubnet}</p>
                    </div>
                  </div>

                  {/* Guide */}
                  <div className="bg-green-950/20 border border-green-500/30 rounded p-4 space-y-3">
                    <h4 className="font-semibold neon-green">📱 Installation sur vos appareils</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="font-semibold text-green-400 mb-1">Android/iOS</p>
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
                          <li>Installez l'application WireGuard depuis l'App Store</li>
                          <li>Appuyez sur "+" pour ajouter une configuration</li>
                          <li>Sélectionnez "Créer à partir de fichier"</li>
                          <li>Choisissez le fichier .conf téléchargé</li>
                          <li>Appuyez sur "Activer" pour vous connecter</li>
                        </ol>
                      </div>

                      <div>
                        <p className="font-semibold text-green-400 mb-1">Windows/Mac/Linux</p>
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
                          <li>Installez WireGuard depuis wireguard.com</li>
                          <li>Ouvrez l'application WireGuard</li>
                          <li>Cliquez sur "Importer un tunnel depuis un fichier"</li>
                          <li>Sélectionnez le fichier .conf téléchargé</li>
                          <li>Cliquez sur "Activer" pour vous connecter</li>
                        </ol>
                      </div>

                      <div className="bg-green-950/40 border border-green-500/20 rounded p-2 mt-2">
                        <p className="text-green-400 font-semibold text-xs mb-1">💡 Important</p>
                        <p className="text-muted-foreground text-xs">
                          Remplacez "&lt;YOUR_PUBLIC_IP&gt;" dans la configuration par l'adresse IP publique de votre routeur (trouvez-la sur whatismyipaddress.com)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
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
