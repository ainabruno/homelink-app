import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Copy, CheckCircle2, QrCode, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function VPNClientConfig() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [creatingDevice, setCreatingDevice] = useState(false);

  // Récupérer les réseaux disponibles
  const { data: networks, isLoading: networksLoading } = trpc.networks.list.useQuery();

  // Récupérer les appareils d'un réseau
  const { data: networkDevices, refetch: refetchDevices } = trpc.wireguard.getNetworkDevices.useQuery(
    { networkId: selectedDeviceId || 0 },
    { enabled: !!selectedDeviceId }
  );

  // Générer les clés pour un nouvel appareil
  const generateDeviceMutation = trpc.wireguard.generateDeviceKeys.useMutation({
    onSuccess: (result) => {
      toast.success(`Appareil "${result.device.name}" créé avec succès !`);
      refetchDevices();
      setCreatingDevice(false);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
      setCreatingDevice(false);
    },
  });

  // Récupérer la configuration d'un appareil
  const { data: deviceConfig, isLoading: configLoading } = trpc.wireguard.getDeviceConfig.useQuery(
    { deviceId: selectedDeviceId || 0 },
    { enabled: !!selectedDeviceId && selectedDeviceId > 0 }
  );

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

  const handleCreateDevice = async (networkId: number, deviceName: string) => {
    setCreatingDevice(true);
    try {
      await generateDeviceMutation.mutateAsync({
        networkId,
        deviceName: deviceName || `Device-${Date.now()}`,
      });
    } catch (error) {
      console.error("Error creating device:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-green-950 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold neon-green">Configuration Client VPN</h1>
          <p className="text-muted-foreground">
            Créez des appareils VPN et téléchargez vos configurations WireGuard pour vous connecter à HomeLink
          </p>
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
              <span>Créez un nouvel appareil VPN</span>
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
            <Card className="p-6 text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Chargement des réseaux...
            </Card>
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

                  {/* Network Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-slate-950/50 rounded p-3">
                      <p className="text-muted-foreground">Port d'écoute</p>
                      <p className="font-mono neon-green">{network.listenPort}</p>
                    </div>
                    <div className="bg-slate-950/50 rounded p-3">
                      <p className="text-muted-foreground">Clé publique serveur</p>
                      <p className="font-mono neon-green text-xs truncate">{network.serverPublicKey?.substring(0, 20)}...</p>
                    </div>
                  </div>

                  {/* Create Device Button */}
                  <Button
                    onClick={() => handleCreateDevice(network.id, `${user?.name || "Device"}-${Date.now()}`)}
                    disabled={creatingDevice || !network.isActive}
                    className="w-full gap-2"
                  >
                    {creatingDevice ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Création en cours...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Créer un nouvel appareil
                      </>
                    )}
                  </Button>

                  {/* Devices List */}
                  {networkDevices && networkDevices.devices && networkDevices.devices.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-green-400 text-sm">Appareils du réseau</h4>
                      {networkDevices.devices.map((device) => (
                        <div
                          key={device.id}
                          className={`border rounded p-3 cursor-pointer transition-all ${
                            selectedDeviceId === device.id
                              ? "border-green-500 bg-green-950/30"
                              : "border-green-500/20 hover:border-green-500/40"
                          }`}
                          onClick={() => setSelectedDeviceId(device.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-green-400">{device.name}</p>
                              <p className="text-xs text-muted-foreground">IP VPN: {device.vpnIp}</p>
                            </div>
                            <Badge variant={device.isActive ? "default" : "secondary"}>
                              {device.isActive ? "Actif" : "Inactif"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-950/50 rounded p-3 text-center text-sm text-muted-foreground">
                      Aucun appareil créé. Créez-en un pour commencer.
                    </div>
                  )}

                  {/* Device Config */}
                  {selectedDeviceId && selectedDeviceId > 0 && (
                    <div className="border-t border-green-500/20 pt-4 space-y-4">
                      {configLoading ? (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Chargement de la configuration...
                        </div>
                      ) : deviceConfig?.config ? (
                        <>
                          <div>
                            <label className="text-sm font-semibold text-green-400">Configuration Client</label>
                            <div className="bg-slate-950 rounded border border-green-500/20 p-4 font-mono text-xs overflow-x-auto mt-2">
                              <pre className="text-green-400 whitespace-pre-wrap break-words">
                                {deviceConfig.config}
                              </pre>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopyConfig(deviceConfig.config)}
                              className="gap-2"
                            >
                              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              {copied ? "Copié !" : "Copier"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleDownloadConfig(
                                  deviceConfig.config,
                                  `${deviceConfig.device?.name || "wireguard"}.conf`
                                )
                              }
                              className="gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Télécharger
                            </Button>
                          </div>

                          {/* Installation Guide */}
                          <div className="bg-blue-950/20 border border-blue-500/30 rounded p-4 space-y-3">
                            <h5 className="font-semibold text-blue-400 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              Guide d'Installation
                            </h5>
                            <div className="space-y-3 text-sm">
                              <div>
                                <h6 className="font-semibold neon-green mb-2">📱 Sur Téléphone (Android/iOS)</h6>
                                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                                  <li>Installez l'application WireGuard depuis l'App Store</li>
                                  <li>Appuyez sur "+" pour ajouter une configuration</li>
                                  <li>Sélectionnez "Créer à partir de fichier"</li>
                                  <li>Choisissez le fichier .conf téléchargé</li>
                                  <li>Appuyez sur "Activer" pour vous connecter</li>
                                </ol>
                              </div>

                              <div>
                                <h6 className="font-semibold neon-green mb-2">💻 Sur Windows/Mac/Linux</h6>
                                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                                  <li>Installez WireGuard depuis wireguard.com</li>
                                  <li>Ouvrez l'application WireGuard</li>
                                  <li>Cliquez sur "Importer un tunnel depuis un fichier"</li>
                                  <li>Sélectionnez le fichier .conf téléchargé</li>
                                  <li>Cliquez sur "Activer" pour vous connecter</li>
                                </ol>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="bg-red-950/20 border border-red-500/30 rounded p-3 text-sm text-red-400">
                          Erreur: Impossible de charger la configuration. Veuillez réessayer.
                        </div>
                      )}
                    </div>
                  )}
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
            Si vous avez des problèmes de connexion, consultez la documentation WireGuard officielle ou contactez votre
            administrateur.
          </p>
        </Card>
      </div>
    </div>
  );
}
