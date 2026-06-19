import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ConfigExport } from "@/components/QRCodeViewer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { Plus, Download, Trash2, AlertCircle, CheckCircle, Smartphone, QrCode, Tag } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function DevicesList() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNetworkId, setSelectedNetworkId] = useState<number | null>(null);
  const [deviceName, setDeviceName] = useState("");
  const [deviceDescription, setDeviceDescription] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [assigningDeviceId, setAssigningDeviceId] = useState<number | null>(null);

  // Fetch networks
  const { data: networks, isLoading: networksLoading } = trpc.networks.list.useQuery();

  // Fetch devices for selected network
  const { data: devices, isLoading: devicesLoading, refetch: refetchDevices } = trpc.devices.list.useQuery(
    { networkId: selectedNetworkId || 0 },
    { enabled: !!selectedNetworkId }
  );

  // Fetch groups
  const { data: groups, isLoading: groupsLoading } = trpc.deviceGroups.list.useQuery();

  // Create device mutation
  const createMutation = trpc.devices.create.useMutation({
    onSuccess: () => {
      toast.success("Appareil créé avec succès");
      setDeviceName("");
      setDeviceDescription("");
      setIsOpen(false);
      refetchDevices();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Delete device mutation
  const deleteMutation = trpc.devices.delete.useMutation({
    onSuccess: () => {
      toast.success("Appareil supprimé");
      refetchDevices();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Add device to group mutation
  const addToGroupMutation = trpc.deviceGroups.addDevice.useMutation({
    onSuccess: () => {
      toast.success("Appareil ajouté au groupe");
      setAssigningDeviceId(null);
      setSelectedGroupId(null);
      refetchDevices();
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Get config mutation
  const [configLoading, setConfigLoading] = useState(false);
  const [selectedDeviceConfig, setSelectedDeviceConfig] = useState<{ deviceId: number; deviceName: string; config: string } | null>(null);

  const handleCreateDevice = () => {
    if (!selectedNetworkId) {
      toast.error("Sélectionnez un réseau");
      return;
    }
    if (!deviceName) {
      toast.error("Le nom de l'appareil est requis");
      return;
    }

    createMutation.mutate({
      networkId: selectedNetworkId,
      name: deviceName,
      description: deviceDescription,
    });
  };

  const handleShowConfig = async (deviceId: number, deviceName: string) => {
    setConfigLoading(true);
    try {
      const response = await fetch(`/api/trpc/devices.getConfig?input=${JSON.stringify({ deviceId })}`);
      if (!response.ok) throw new Error("Failed to get config");
      const data = await response.json();
      setSelectedDeviceConfig({
        deviceId,
        deviceName: data.result.data.deviceName,
        config: data.result.data.config,
      });
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setConfigLoading(false);
    }
  };

  const handleDeleteDevice = (deviceId: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet appareil?")) {
      deleteMutation.mutate({ deviceId });
    }
  };

  const handleAddToGroup = (deviceId: number) => {
    if (!selectedGroupId) {
      toast.error("Sélectionnez un groupe");
      return;
    }
    addToGroupMutation.mutate({
      groupId: selectedGroupId,
      deviceId,
    });
  };

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
        <h1 className="text-4xl font-bold neon-cyan">Gestion des Appareils</h1>
        <Card className="border-neon-cyan p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
          <h3 className="text-xl font-bold mb-2">Aucun réseau disponible</h3>
          <p className="text-muted-foreground mb-4">
            Créez d'abord un réseau pour ajouter des appareils.
          </p>
          <Button onClick={() => navigate("/networks")} className="btn-neon-cyan">
            Créer un Réseau
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold neon-cyan">Gestion des Appareils</h1>
        <p className="text-muted-foreground">
          Ajoutez et gérez les appareils connectés à votre réseau VPN.
        </p>
      </div>

      {/* Network Selector */}
      <Card className="border-neon-green p-6">
        <Label className="text-base font-semibold">Sélectionner un Réseau</Label>
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

      {/* Create Device Button */}
      {selectedNetworkId && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="btn-neon-green">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter Appareil
            </Button>
          </DialogTrigger>
          <DialogContent className="border-neon-cyan">
            <DialogHeader>
              <DialogTitle className="neon-cyan">Ajouter Appareil</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nom de l'Appareil</Label>
                <Input
                  placeholder="Mon téléphone"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="border-neon-cyan mt-1"
                />
              </div>
              <div>
                <Label>Description (optionnel)</Label>
                <Textarea
                  placeholder="iPhone 14 Pro"
                  value={deviceDescription}
                  onChange={(e) => setDeviceDescription(e.target.value)}
                  className="border-neon-cyan mt-1"
                />
              </div>
              <Button
                onClick={handleCreateDevice}
                disabled={createMutation.isPending}
                className="btn-neon-cyan w-full"
              >
                {createMutation.isPending ? (
                  <Spinner className="w-4 h-4 mr-2" />
                ) : null}
                Créer Appareil
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Devices List */}
      {selectedNetworkId && (
        <div className="space-y-4">
          {devicesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : devices && devices.length > 0 ? (
            devices.map((device) => (
              <Card key={device.id} className="border-neon-cyan p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Smartphone className="w-5 h-5 neon-cyan" />
                      <h3 className="text-xl font-bold">{device.name}</h3>
                      {device.isActive ? (
                        <span className="status-online text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Actif
                        </span>
                      ) : (
                        <span className="status-offline text-sm">
                          <AlertCircle className="w-4 h-4" />
                          Inactif
                        </span>
                      )}
                    </div>

                    {device.description && (
                      <p className="text-muted-foreground mb-3">{device.description}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-muted-foreground">IP VPN</p>
                        <p className="font-mono text-sm mt-1">{device.vpnIp}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Clé Publique</p>
                        <p className="font-mono text-xs mt-1 truncate">
                          {device.publicKey}
                        </p>
                      </div>
                      {device.lastConnected && (
                        <div>
                          <p className="text-sm text-muted-foreground">Dernière connexion</p>
                          <p className="text-sm mt-1">
                            {new Date(device.lastConnected).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Group Assignment */}
                    {assigningDeviceId === device.id ? (
                      <div className="mt-4 p-4 bg-slate-900/50 rounded border border-cyan-500/30 space-y-3">
                        <p className="text-sm font-semibold text-cyan-400">Assigner à un groupe</p>
                        <Select value={selectedGroupId?.toString() || ""} onValueChange={(v) => setSelectedGroupId(parseInt(v))}>
                          <SelectTrigger className="border-cyan-500/30">
                            <SelectValue placeholder="Sélectionner un groupe" />
                          </SelectTrigger>
                          <SelectContent>
                            {groups?.map((group: any) => (
                              <SelectItem key={group.id} value={group.id.toString()}>
                                {group.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAddToGroup(device.id)}
                            disabled={addToGroupMutation.isPending}
                            className="btn-neon-cyan flex-1"
                          >
                            Confirmer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAssigningDeviceId(null)}
                            className="flex-1"
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAssigningDeviceId(device.id)}
                        className="mt-4 border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/50 gap-2"
                      >
                        <Tag className="w-4 h-4" />
                        Assigner à un groupe
                      </Button>
                    )}

                    <p className="text-xs text-muted-foreground mt-4">
                      Créé le: {new Date(device.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShowConfig(device.id, device.name)}
                      disabled={configLoading}
                      className="border-neon-cyan text-neon-cyan hover:bg-cyan-950"
                      title="Afficher QR code et configuration"
                    >
                      {configLoading ? <Spinner className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDevice(device.id)}
                      className="border-red-500 text-red-400 hover:bg-red-950"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="border-neon-cyan p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
              <h3 className="text-xl font-bold mb-2">Aucun appareil</h3>
              <p className="text-muted-foreground">
                Ajoutez votre premier appareil pour commencer.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* QR Code Viewer Modal */}
      {selectedDeviceConfig && (
        <ConfigExport
          deviceName={selectedDeviceConfig.deviceName}
          configContent={selectedDeviceConfig.config}
        />
      )}
    </div>
  );
}
