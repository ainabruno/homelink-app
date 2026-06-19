import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Activity, LogOut, LogIn, AlertCircle, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AdminDashboard() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  // Récupérer les données admin
  const { data: allUsers, isLoading: usersLoading } = trpc.admin.getAllUsers.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const { data: recentConnections, isLoading: connectionsLoading } =
    trpc.admin.getRecentConnections.useQuery({ limit: 50 }, { enabled: user?.role === "admin" });

  const { data: globalStats, isLoading: statsLoading } = trpc.admin.getGlobalStats.useQuery(
    undefined,
    { enabled: user?.role === "admin" }
  );

  const { data: globalLogs, isLoading: logsLoading } = trpc.admin.getGlobalLogs.useQuery(
    { limit: 100 },
    { enabled: user?.role === "admin" }
  );

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 border-red-500/30 bg-red-950/20">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-red-500">Accès Refusé</h2>
          <p className="text-muted-foreground mt-2">Vous n'avez pas les permissions pour accéder à ce tableau de bord.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold neon-cyan">Tableau de Bord Admin</h1>
          <p className="text-muted-foreground">Gérez les utilisateurs et surveillez l'activité de la plateforme</p>
        </div>

        {/* Stats Cards */}
        {globalStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-cyan-500/30 p-6 bg-cyan-950/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Utilisateurs Totaux</p>
                  <p className="text-3xl font-bold neon-cyan">{globalStats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 neon-cyan opacity-50" />
              </div>
            </Card>

            <Card className="border-green-500/30 p-6 bg-green-950/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Connexions Actives</p>
                  <p className="text-3xl font-bold neon-green">{globalStats.activeConnections}</p>
                </div>
                <LogIn className="w-8 h-8 neon-green opacity-50" />
              </div>
            </Card>

            <Card className="border-purple-500/30 p-6 bg-purple-950/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Réseaux Totaux</p>
                  <p className="text-3xl font-bold text-purple-400">{globalStats.totalNetworks}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-400 opacity-50" />
              </div>
            </Card>

            <Card className="border-orange-500/30 p-6 bg-orange-950/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Appareils Totaux</p>
                  <p className="text-3xl font-bold text-orange-400">{globalStats.totalDevices}</p>
                </div>
                <Activity className="w-8 h-8 text-orange-400 opacity-50" />
              </div>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="bg-slate-900/50 border border-cyan-500/30">
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="connections">Connexions Récentes</TabsTrigger>
            <TabsTrigger value="logs">Logs d'Audit</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className="border-cyan-500/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900/50 border-b border-cyan-500/30">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-cyan-400">Nom</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-cyan-400">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-cyan-400">Rôle</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-cyan-400">Réseaux</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-cyan-400">Connexions</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-cyan-400">Dernière Connexion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-500/10">
                    {usersLoading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                          Chargement...
                        </td>
                      </tr>
                    ) : allUsers && allUsers.length > 0 ? (
                      allUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="px-6 py-4 text-sm">{u.name || "-"}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{u.email || "-"}</td>
                          <td className="px-6 py-4 text-sm">
                            <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                              {u.role === "admin" ? "Admin" : "Utilisateur"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm">{u.networkCount}</td>
                          <td className="px-6 py-4 text-sm">{u.connectionCount}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {u.lastConnection
                              ? format(new Date(u.lastConnection), "dd MMM yyyy HH:mm", { locale: fr })
                              : "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                          Aucun utilisateur trouvé
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Connections Tab */}
          <TabsContent value="connections" className="space-y-4">
            <Card className="border-green-500/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900/50 border-b border-green-500/30">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-green-400">Utilisateur</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-green-400">Appareil</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-green-400">Réseau</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-green-400">IP Source</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-green-400">Statut</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-green-400">Heure</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-500/10">
                    {connectionsLoading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                          Chargement...
                        </td>
                      </tr>
                    ) : recentConnections && recentConnections.length > 0 ? (
                      recentConnections.map((conn) => (
                        <tr key={conn.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="px-6 py-4 text-sm">{conn.userName || "-"}</td>
                          <td className="px-6 py-4 text-sm">{conn.deviceName || "-"}</td>
                          <td className="px-6 py-4 text-sm">{conn.networkName || "-"}</td>
                          <td className="px-6 py-4 text-sm font-mono text-xs">{conn.sourceIp}</td>
                          <td className="px-6 py-4 text-sm">
                            <Badge
                              variant={conn.status === "connected" ? "default" : "secondary"}
                              className={
                                conn.status === "connected"
                                  ? "bg-green-500/30 text-green-400"
                                  : conn.status === "disconnected"
                                    ? "bg-slate-500/30 text-slate-400"
                                    : "bg-red-500/30 text-red-400"
                              }
                            >
                              {conn.status === "connected"
                                ? "Connecté"
                                : conn.status === "disconnected"
                                  ? "Déconnecté"
                                  : "Erreur"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {format(new Date(conn.startTime), "dd MMM HH:mm", { locale: fr })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                          Aucune connexion trouvée
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card className="border-orange-500/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900/50 border-b border-orange-500/30">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-orange-400">Action</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-orange-400">Utilisateur</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-orange-400">Réseau</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-orange-400">Statut</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-orange-400">Détails</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-orange-400">Heure</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-500/10">
                    {logsLoading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                          Chargement...
                        </td>
                      </tr>
                    ) : globalLogs && globalLogs.length > 0 ? (
                      globalLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="px-6 py-4 text-sm font-mono text-xs">{log.action}</td>
                          <td className="px-6 py-4 text-sm">{log.userName || "-"}</td>
                          <td className="px-6 py-4 text-sm">{log.networkName || "-"}</td>
                          <td className="px-6 py-4 text-sm">
                            <Badge
                              variant={
                                log.status === "success"
                                  ? "default"
                                  : log.status === "warning"
                                    ? "secondary"
                                    : "destructive"
                              }
                              className={
                                log.status === "success"
                                  ? "bg-green-500/30 text-green-400"
                                  : log.status === "warning"
                                    ? "bg-yellow-500/30 text-yellow-400"
                                    : "bg-red-500/30 text-red-400"
                              }
                            >
                              {log.status === "success"
                                ? "Succès"
                                : log.status === "warning"
                                  ? "Avertissement"
                                  : "Erreur"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground truncate max-w-xs">
                            {log.details || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {format(new Date(log.timestamp), "dd MMM HH:mm", { locale: fr })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                          Aucun log trouvé
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
