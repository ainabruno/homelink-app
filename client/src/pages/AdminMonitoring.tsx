import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, Clock, AlertTriangle, Lock, Activity, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminMonitoring() {
  const { user } = useAuth();
  const [selectedNetworkId, setSelectedNetworkId] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState("activity");
  const [filterAction, setFilterAction] = useState<string>("");
  const [filterSeverity, setFilterSeverity] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

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

  // Récupérer les logs d'activité
  const { data: activityData, isLoading: activityLoading } = trpc.monitoring.getActivityLogs.useQuery(
    {
      networkId: selectedNetworkId!,
      action: filterAction || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    },
    { enabled: !!selectedNetworkId, refetchInterval: 5000 }
  );

  // Récupérer les événements de sécurité
  const { data: securityData, isLoading: securityLoading } = trpc.monitoring.getSecurityEvents.useQuery(
    {
      networkId: selectedNetworkId!,
      severity: (filterSeverity as any) || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    },
    { enabled: !!selectedNetworkId, refetchInterval: 5000 }
  );

  // Récupérer les stats d'activité
  const { data: activityStats } = trpc.monitoring.getActivityStats.useQuery(
    { networkId: selectedNetworkId! },
    { enabled: !!selectedNetworkId, refetchInterval: 10000 }
  );

  // Récupérer les stats de sécurité
  const { data: securityStats } = trpc.monitoring.getSecurityStats.useQuery(
    { networkId: selectedNetworkId! },
    { enabled: !!selectedNetworkId, refetchInterval: 10000 }
  );

  // Mutation pour résoudre un événement
  const resolveEventMutation = trpc.monitoring.resolveSecurityEvent.useMutation();
  const utils = trpc.useUtils();

  const handleResolveEvent = async (eventId: number) => {
    try {
      await resolveEventMutation.mutateAsync({ eventId });
      toast.success("Événement marqué comme résolu !");
      if (selectedNetworkId) {
        await utils.monitoring.getSecurityEvents.invalidate({ networkId: selectedNetworkId });
        await utils.monitoring.getSecurityStats.invalidate({ networkId: selectedNetworkId });
      }
    } catch (error) {
      toast.error("Erreur lors de la résolution");
      console.error(error);
    }
  };

  const severityColors = {
    info: "bg-blue-600",
    warning: "bg-yellow-600",
    critical: "bg-red-600",
  };

  const severityIcons = {
    info: <AlertCircle className="w-4 h-4" />,
    warning: <AlertTriangle className="w-4 h-4" />,
    critical: <AlertTriangle className="w-4 h-4" />,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold neon-cyan">Monitoring & Logs</h1>
          <p className="text-muted-foreground">Surveillance d'activité et alertes de sécurité</p>
        </div>

        {/* Network Selection */}
        <Card className="border-blue-500/30 p-6 bg-blue-950/20">
          <h2 className="text-lg font-semibold neon-cyan mb-4">Sélectionner un Réseau</h2>
          {networksLoading ? (
            <div className="text-muted-foreground">Chargement des réseaux...</div>
          ) : networks && networks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {networks.map((network) => (
                <button
                  key={network.id}
                  onClick={() => setSelectedNetworkId(network.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedNetworkId === network.id
                      ? "border-cyan-500 bg-cyan-950/30"
                      : "border-blue-500/30 bg-slate-900/30 hover:border-blue-500/50"
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

        {selectedNetworkId && (
          <>
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Activity Stats */}
              <Card className="border-blue-500/30 p-4 bg-blue-950/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Actions</p>
                    <p className="text-2xl font-bold neon-cyan">{activityStats?.stats.totalActions || 0}</p>
                  </div>
                  <Activity className="w-8 h-8 text-blue-500 opacity-50" />
                </div>
              </Card>

              {/* Security Events */}
              <Card className="border-yellow-500/30 p-4 bg-yellow-950/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Événements</p>
                    <p className="text-2xl font-bold neon-cyan">{securityStats?.stats.totalEvents || 0}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-yellow-500 opacity-50" />
                </div>
              </Card>

              {/* Unresolved Events */}
              <Card className="border-red-500/30 p-4 bg-red-950/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Non Résolus</p>
                    <p className="text-2xl font-bold neon-cyan">{securityStats?.stats.unresolvedCount || 0}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-500 opacity-50" />
                </div>
              </Card>

              {/* Critical Events */}
              <Card className="border-red-500/30 p-4 bg-red-950/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Critiques</p>
                    <p className="text-2xl font-bold neon-cyan">
                      {securityStats?.stats.eventsBySeverity?.critical || 0}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-500 opacity-50" />
                </div>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="activity">Logs d'Activité</TabsTrigger>
                <TabsTrigger value="security">Événements de Sécurité</TabsTrigger>
              </TabsList>

              {/* Activity Logs Tab */}
              <TabsContent value="activity">
                <Card className="border-blue-500/30 p-6 bg-blue-950/20">
                  <div className="space-y-4 mb-4">
                    <h2 className="text-lg font-semibold neon-cyan">Logs d'Activité</h2>
                    <div className="flex gap-4 flex-wrap">
                      <Select value={filterAction} onValueChange={setFilterAction}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Filtrer par action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Toutes les actions</SelectItem>
                          {activityStats?.stats.actionsByType &&
                            Object.keys(activityStats.stats.actionsByType).map((action) => (
                              <SelectItem key={action} value={action}>
                                {action}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <input
                        type="date"
                        value={startDate ? startDate.toISOString().split('T')[0] : ''}
                        onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                        className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm"
                        placeholder="Date de début"
                      />
                      <input
                        type="date"
                        value={endDate ? endDate.toISOString().split('T')[0] : ''}
                        onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                        className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm"
                        placeholder="Date de fin"
                      />
                    </div>
                  </div>

                  {activityLoading ? (
                    <div className="text-muted-foreground">Chargement des logs...</div>
                  ) : activityData?.logs && activityData.logs.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {activityData.logs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-semibold text-cyan-400">{log.action}</p>
                            <p className="text-xs text-muted-foreground">
                              {log.resourceType} • {new Date(log.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="outline">{log.resourceType}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-center py-4">Aucun log disponible</div>
                  )}
                </Card>
              </TabsContent>

              {/* Security Events Tab */}
              <TabsContent value="security">
                <Card className="border-red-500/30 p-6 bg-red-950/20">
                  <div className="space-y-4 mb-4">
                    <h2 className="text-lg font-semibold neon-cyan">Événements de Sécurité</h2>
                    <div className="flex gap-4 flex-wrap">
                      <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Filtrer par sévérité" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Toutes les sévérités</SelectItem>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warning">Avertissement</SelectItem>
                          <SelectItem value="critical">Critique</SelectItem>
                        </SelectContent>
                      </Select>
                      <input
                        type="date"
                        value={startDate ? startDate.toISOString().split('T')[0] : ''}
                        onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                        className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm"
                        placeholder="Date de début"
                      />
                      <input
                        type="date"
                        value={endDate ? endDate.toISOString().split('T')[0] : ''}
                        onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                        className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm"
                        placeholder="Date de fin"
                      />
                    </div>
                  </div>

                  {securityLoading ? (
                    <div className="text-muted-foreground">Chargement des événements...</div>
                  ) : securityData?.events && securityData.events.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {securityData.events.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`p-2 rounded ${severityColors[event.severity as keyof typeof severityColors]}`}>
                              {severityIcons[event.severity as keyof typeof severityIcons]}
                            </div>
                            <div>
                              <p className="font-semibold text-cyan-400">{event.eventType}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(event.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {event.isResolved ? (
                              <Badge className="bg-green-600">Résolu</Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleResolveEvent(event.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Résoudre
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-center py-4">Aucun événement disponible</div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
