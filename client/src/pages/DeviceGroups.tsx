import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";
import { Plus, Trash2, Edit2, Users } from "lucide-react";
import { toast } from "sonner";

const categoryIcons: Record<string, string> = {
  mobile: "📱",
  computer: "💻",
  iot: "🔌",
  other: "📦",
};

const categoryColors: Record<string, string> = {
  mobile: "border-blue-500/50",
  computer: "border-purple-500/50",
  iot: "border-orange-500/50",
  other: "border-gray-500/50",
};

export default function DeviceGroups() {
  const { user } = useAuth();
  const [networkId, setNetworkId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    category: "other" as const,
    color: "cyan",
  });

  // Fetch networks
  const { data: networks, isLoading: networksLoading } = trpc.networks.list.useQuery();

  // Fetch groups for selected network
  const { data: groups, isLoading: groupsLoading, refetch: refetchGroups } = trpc.groups.list.useQuery(
    { networkId: networkId || 0 },
    { enabled: !!networkId }
  );

  // Mutations
  const createGroupMutation = trpc.groups.create.useMutation({
    onSuccess: () => {
      toast.success("Groupe créé avec succès");
      setNewGroup({ name: "", description: "", category: "other", color: "cyan" });
      setIsCreateOpen(false);
      refetchGroups();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteGroupMutation = trpc.groups.delete.useMutation({
    onSuccess: () => {
      toast.success("Groupe supprimé");
      refetchGroups();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleCreateGroup = () => {
    if (!networkId || !newGroup.name) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    createGroupMutation.mutate({
      networkId,
      ...newGroup,
    });
  };

  const handleDeleteGroup = (groupId: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce groupe?")) {
      deleteGroupMutation.mutate({ groupId });
    }
  };

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
        <h1 className="text-4xl font-bold neon-cyan">Groupes d'Appareils</h1>
        <p className="text-muted-foreground">
          Organisez vos appareils en groupes pour une gestion simplifiée.
        </p>
      </div>

      {/* Network Selector */}
      {primaryNetwork && (
        <Card className="border-cyan-500/30 p-4 bg-slate-900/50">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Réseau:</span>
            <span className="font-semibold text-cyan-400">{primaryNetwork.name}</span>
            <Button
              onClick={() => setNetworkId(primaryNetwork.id)}
              variant={networkId === primaryNetwork.id ? "default" : "outline"}
              size="sm"
            >
              Sélectionner
            </Button>
          </div>
        </Card>
      )}

      {/* Create Group Button */}
      {networkId && (
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="btn-neon-cyan gap-2">
              <Plus className="w-4 h-4" />
              Créer un Groupe
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-cyan-500/30">
            <DialogHeader>
              <DialogTitle className="text-cyan-400">Créer un Nouveau Groupe</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Nom du groupe</label>
                <Input
                  placeholder="ex: Appareils mobiles"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="mt-1 bg-slate-800 border-slate-700"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400">Description</label>
                <Input
                  placeholder="Description optionnelle"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  className="mt-1 bg-slate-800 border-slate-700"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400">Catégorie</label>
                <Select value={newGroup.category} onValueChange={(value: any) => setNewGroup({ ...newGroup, category: value })}>
                  <SelectTrigger className="mt-1 bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="mobile">📱 Appareils mobiles</SelectItem>
                    <SelectItem value="computer">💻 Ordinateurs</SelectItem>
                    <SelectItem value="iot">🔌 Appareils IoT</SelectItem>
                    <SelectItem value="other">📦 Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleCreateGroup}
                className="btn-neon-cyan w-full"
                disabled={createGroupMutation.isPending}
              >
                {createGroupMutation.isPending ? "Création..." : "Créer le Groupe"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Groups List */}
      {networkId && groupsLoading && (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      )}

      {networkId && groups && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.length === 0 ? (
            <Card className="border-cyan-500/30 p-8 col-span-full text-center">
              <p className="text-gray-400">Aucun groupe créé. Commencez par créer votre premier groupe!</p>
            </Card>
          ) : (
            groups.map((group) => (
              <Card key={group.id} className={`border-2 ${categoryColors[group.category] || "border-gray-500/50"} p-6 bg-slate-900/50 hover:bg-slate-800/50 transition`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{categoryIcons[group.category] || "📦"}</span>
                    <div>
                      <h3 className="font-semibold text-lg text-white">{group.name}</h3>
                      <p className="text-xs text-gray-400 capitalize">{group.category}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteGroup(group.id)}
                      disabled={deleteGroupMutation.isPending}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {group.description && (
                  <p className="text-sm text-gray-300 mb-4">{group.description}</p>
                )}

                <div className="pt-4 border-t border-slate-700">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10"
                  >
                    <Users className="w-4 h-4" />
                    Gérer les Appareils
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {!networkId && (
        <Card className="border-cyan-500/30 p-8 text-center">
          <p className="text-gray-400">Sélectionnez un réseau pour gérer les groupes d'appareils.</p>
        </Card>
      )}
    </div>
  );
}
