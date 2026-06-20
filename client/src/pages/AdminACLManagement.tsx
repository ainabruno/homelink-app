import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit2, Loader2, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminACLManagement() {
  const { user } = useAuth();
  const [selectedNetworkId, setSelectedNetworkId] = useState<number | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedPermission, setSelectedPermission] = useState<"view" | "connect" | "configure" | "admin">("connect");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Vérifier que l'utilisateur est admin
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950 to-slate-950 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-6 text-center border-red-500/30 bg-red-950/20">
            <Lock className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold text-red-500 mb-2">Accès Refusé</h1>
            <p className="text-muted-foreground">Vous devez être administrateur pour accéder à cette page.</p>
          </Card>
        </div>
      </div>
    );
  }

  // Récupérer les réseaux
  const { data: networks, isLoading: networksLoading } = trpc.networks.list.useQuery();

  // Récupérer les appareils du réseau sélectionné
  const { data: networkDevices, isLoading: devicesLoading } = trpc.wireguard.getNetworkDevices.useQuery(
    { networkId: selectedNetworkId! },
    { enabled: !!selectedNetworkId }
  );

  // Récupérer les permissions de l'appareil
  const { data: devicePerms, isLoading: permsLoading } = trpc.permissions.getDevicePermissions.useQuery(
    { deviceId: selectedDeviceId! },
    { enabled: !!selectedDeviceId }
  );

  // Mutations
  const createPermissionMutation = trpc.permissions.createDevicePermission.useMutation();
  const deletePermissionMutation = trpc.permissions.deleteDevicePermission.useMutation();
  const utils = trpc.useUtils();

  const handleCreatePermission = async () => {
    if (!selectedDeviceId || !selectedUserId) {
      toast.error("Veuillez sélectionner un appareil et un utilisateur");
      return;
    }

    setIsCreating(true);
    try {
      await createPermissionMutation.mutateAsync({
        deviceId: selectedDeviceId,
        userId: selectedUserId,
        permission: selectedPermission,
      });

      toast.success("Permission créée avec succès !");
      setDialogOpen(false);
      setSelectedUserId(null);
      await utils.permissions.getDevicePermissions.invalidate({ deviceId: selectedDeviceId });
    } catch (error) {
      toast.error("Erreur lors de la création de la permission");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePermission = async (permissionId: number) => {
    try {
      await deletePermissionMutation.mutateAsync({ permissionId });
      toast.success("Permission supprimée !");
      if (selectedDeviceId) {
        await utils.permissions.getDevicePermissions.invalidate({ deviceId: selectedDeviceId });
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    }
  };

  const permissionLevels = {
    view: { label: "Voir", color: "blue" },
    connect: { label: "Connecter", color: "green" },
    configure: { label: "Configurer", color: "yellow" },
    admin: { label: "Admin", color: "red" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold neon-cyan">Gestion des Permissions ACL</h1>
          <p className="text-muted-foreground">Configurez les permissions d'accès pour chaque appareil</p>
        </div>

        {/* Networks Selection */}
        <Card className="border-purple-500/30 p-6 bg-purple-950/20">
          <h2 className="text-lg font-semibold neon-cyan mb-4">Sélectionner un Réseau</h2>
          {networksLoading ? (
            <div className="text-muted-foreground">Chargement des réseaux...</div>
          ) : networks && networks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {networks.map((network) => (
                <button
                  key={network.id}
                  onClick={() => {
                    setSelectedNetworkId(network.id);
                    setSelectedDeviceId(null);
                  }}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedNetworkId === network.id
                      ? "border-cyan-500 bg-cyan-950/30"
                      : "border-purple-500/30 bg-slate-900/30 hover:border-purple-500/50"
                  }`}
                >
                  <p className="font-semibold neon-cyan">{network.name}</p>
                  <p className="text-xs text-muted-foreground">Subnet: {network.vpnSubnet}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">Aucun réseau disponible</div>
          )}
        </Card>

        {/* Devices Selection */}
        {selectedNetworkId && (
          <Card className="border-purple-500/30 p-6 bg-purple-950/20">
            <h2 className="text-lg font-semibold neon-cyan mb-4">Sélectionner un Appareil</h2>
            {devicesLoading ? (
              <div className="text-muted-foreground">Chargement des appareils...</div>
            ) : networkDevices && networkDevices.devices && networkDevices.devices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {networkDevices.devices.map((device) => (
                  <button
                    key={device.id}
                    onClick={() => setSelectedDeviceId(device.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedDeviceId === device.id
                        ? "border-cyan-500 bg-cyan-950/30"
                        : "border-purple-500/30 bg-slate-900/30 hover:border-purple-500/50"
                    }`}
                  >
                    <p className="font-semibold neon-cyan">{device.name}</p>
                    <p className="text-xs text-muted-foreground">IP: {device.vpnIp}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">Aucun appareil dans ce réseau</div>
            )}
          </Card>
        )}

        {/* Permissions Management */}
        {selectedDeviceId && (
          <Card className="border-purple-500/30 p-6 bg-purple-950/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold neon-cyan">Permissions</h2>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Ajouter une Permission
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter une Permission</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="user-id">ID Utilisateur</Label>
                      <Input
                        id="user-id"
                        type="number"
                        placeholder="ID de l'utilisateur"
                        value={selectedUserId || ""}
                        onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="permission">Permission</Label>
                      <Select value={selectedPermission} onValueChange={(v) => setSelectedPermission(v as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="view">Voir</SelectItem>
                          <SelectItem value="connect">Connecter</SelectItem>
                          <SelectItem value="configure">Configurer</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleCreatePermission}
                      disabled={isCreating || !selectedUserId}
                      className="w-full gap-2"
                    >
                      {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                      Créer la Permission
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {permsLoading ? (
              <div className="text-muted-foreground">Chargement des permissions...</div>
            ) : devicePerms && devicePerms.permissions && devicePerms.permissions.length > 0 ? (
              <div className="space-y-2">
                {devicePerms.permissions.map((perm) => (
                  <div key={perm.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <div>
                      <p className="font-semibold text-cyan-400">Utilisateur ID: {perm.userId}</p>
                      <Badge variant="outline" className="mt-1">
                        {permissionLevels[perm.permission as keyof typeof permissionLevels]?.label || perm.permission}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeletePermission(perm.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-center py-4">
                Aucune permission configurée pour cet appareil
              </div>
            )}
          </Card>
        )}

        {/* Info */}
        <Card className="border-blue-500/30 p-6 bg-blue-950/20">
          <h2 className="text-lg font-semibold neon-cyan mb-3">📋 Niveaux de Permission</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge>Voir</Badge>
              <span className="text-muted-foreground">Consulter les informations de l'appareil</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-600">Connecter</Badge>
              <span className="text-muted-foreground">Se connecter via VPN</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-600">Configurer</Badge>
              <span className="text-muted-foreground">Modifier les paramètres</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-600">Admin</Badge>
              <span className="text-muted-foreground">Accès complet</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
