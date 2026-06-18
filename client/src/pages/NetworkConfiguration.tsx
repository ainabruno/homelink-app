import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { Plus, Edit2, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function NetworkConfiguration() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    publicIp: "",
    ddnsDomain: "",
    isActive: false,
  });

  // Fetch networks
  const { data: networks, isLoading, refetch } = trpc.networks.list.useQuery();

  // Create network mutation
  const createMutation = trpc.networks.create.useMutation({
    onSuccess: () => {
      toast.success("Réseau créé avec succès");
      setFormData({ name: "", publicIp: "", ddnsDomain: "", isActive: false });
      setIsOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Update network mutation
  const updateMutation = trpc.networks.update.useMutation({
    onSuccess: () => {
      toast.success("Réseau mis à jour");
      setFormData({ name: "", publicIp: "", ddnsDomain: "", isActive: false });
      setEditingId(null);
      setIsOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Delete network mutation
  const deleteMutation = trpc.networks.delete.useMutation({
    onSuccess: () => {
      toast.success("Réseau supprimé");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error("Le nom du réseau est requis");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        networkId: editingId,
        ...formData,
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        vpnSubnet: "10.191.143.0/24",
        listenPort: 51820,
      });
    }
  };

  const handleEdit = (network: any) => {
    setFormData({
      name: network.name,
      publicIp: network.publicIp || "",
      ddnsDomain: network.ddnsDomain || "",
      isActive: network.isActive,
    });
    setEditingId(network.id);
    setIsOpen(true);
  };

  const handleDelete = (networkId: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce réseau?")) {
      deleteMutation.mutate({ networkId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold neon-cyan">Configuration Réseau</h1>
        <p className="text-muted-foreground">
          Gérez vos réseaux domestiques et configurez l'accès distant.
        </p>
      </div>

      {/* Create Button */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            onClick={() => {
              setEditingId(null);
              setFormData({ name: "", publicIp: "", ddnsDomain: "", isActive: false });
            }}
            className="btn-neon-green"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Réseau
          </Button>
        </DialogTrigger>
        <DialogContent className="border-neon-cyan">
          <DialogHeader>
            <DialogTitle className="neon-cyan">
              {editingId ? "Modifier Réseau" : "Créer Réseau"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom du Réseau</Label>
              <Input
                placeholder="Mon réseau domestique"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-neon-cyan mt-1"
              />
            </div>
            <div>
              <Label>IP Publique (optionnel)</Label>
              <Input
                placeholder="203.0.113.42"
                value={formData.publicIp}
                onChange={(e) => setFormData({ ...formData, publicIp: e.target.value })}
                className="border-neon-cyan mt-1"
              />
            </div>
            <div>
              <Label>Domaine DDNS (optionnel)</Label>
              <Input
                placeholder="home.example.com"
                value={formData.ddnsDomain}
                onChange={(e) => setFormData({ ...formData, ddnsDomain: e.target.value })}
                className="border-neon-cyan mt-1"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Activer l'accès distant</Label>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn-neon-cyan w-full"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Spinner className="w-4 h-4 mr-2" />
              ) : null}
              {editingId ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Networks List */}
      <div className="space-y-4">
        {networks && networks.length > 0 ? (
          networks.map((network) => (
            <Card key={network.id} className="border-neon-cyan p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold">{network.name}</h3>
                    {network.isActive ? (
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {network.publicIp && (
                      <div>
                        <p className="text-sm text-muted-foreground">IP Publique</p>
                        <p className="font-mono text-sm mt-1">{network.publicIp}</p>
                      </div>
                    )}
                    {network.ddnsDomain && (
                      <div>
                        <p className="text-sm text-muted-foreground">Domaine DDNS</p>
                        <p className="font-mono text-sm mt-1">{network.ddnsDomain}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Subnet VPN</p>
                      <p className="font-mono text-sm mt-1">{network.vpnSubnet}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Port d'écoute</p>
                      <p className="font-mono text-sm mt-1">{network.listenPort}</p>
                    </div>
                  </div>

                  {network.lastHealthCheck && (
                    <p className="text-xs text-muted-foreground mt-4">
                      Dernier contrôle: {new Date(network.lastHealthCheck).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(network)}
                    className="border-neon-green text-neon-green hover:bg-green-950"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(network.id)}
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
            <h3 className="text-xl font-bold mb-2">Aucun réseau configuré</h3>
            <p className="text-muted-foreground">
              Créez votre premier réseau pour commencer.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
